import { Camera, ScanText, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MIN_OCR_CONFIDENCE = 65;

function parseRateToken(token) {
  if (!token) return null;
  const normalized = String(token).replace(",", ".").replace(/[^\d.]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  if (parsed <= 0 || parsed >= 1000) return null;
  return Number(parsed.toFixed(2));
}

function extractRatesFromLine(line) {
  const normalized = line.toUpperCase().replace(/[,]/g, ".");

  const labeled = normalized.match(
    /(?:BUY|KOOP|AANKOOP|BID)\D{0,12}(\d{1,3}(?:\.\d{1,3})?).*?(?:SELL|VERKOOP|LAAT|ASK)\D{0,12}(\d{1,3}(?:\.\d{1,3})?)/i
  );
  if (labeled) {
    const buy = parseRateToken(labeled[1]);
    const sell = parseRateToken(labeled[2]);
    if (buy !== null && sell !== null) return { buy, sell };
  }

  const numbers = [...normalized.matchAll(/\d{1,3}(?:\.\d{1,3})?/g)]
    .map((match) => parseRateToken(match[0]))
    .filter((value) => value !== null);

  if (numbers.length >= 2) {
    return { buy: numbers[0], sell: numbers[1] };
  }

  return null;
}

function parseRatesFromOcrText(rawText) {
  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const result = {};
  ["USD", "EUR"].forEach((currency) => {
    const rowWithCurrency = lines.find((line) => line.toUpperCase().includes(currency));
    if (rowWithCurrency) {
      const parsed = extractRatesFromLine(rowWithCurrency);
      if (parsed) {
        result[currency] = parsed;
      }
    }
  });

  return result;
}

export default function CrowdsourcePanel({ rates, defaultCurrency, onSubmitReport }) {
  const fileInputRef = useRef(null);
  const [selectedCambioId, setSelectedCambioId] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoName, setPhotoName] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [ocrTextPreview, setOcrTextPreview] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const exists = rates.some((rate) => rate.id === selectedCambioId);
    if ((!selectedCambioId || !exists) && rates.length) {
      setSelectedCambioId(rates[0].id);
    }
    if (!rates.length) {
      setSelectedCambioId("");
    }
  }, [rates, selectedCambioId]);

  useEffect(() => {
    setCurrency(defaultCurrency);
  }, [defaultCurrency]);

  useEffect(() => {
    if (!ocrResult) {
      setBuy("");
      setSell("");
      return;
    }

    const extracted = ocrResult[currency];
    if (!extracted) {
      setBuy("");
      setSell("");
      return;
    }

    setBuy(String(extracted.buy));
    setSell(String(extracted.sell));
  }, [currency, ocrResult]);

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoName(file.name);
    setBuy("");
    setSell("");
    setStatusMessage("");
    setOcrLoading(true);
    setOcrResult(null);
    setOcrConfidence(null);
    setOcrTextPreview("");

    let worker = null;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      const parsed = parseRatesFromOcrText(data?.text || "");
      const preview = String(data?.text || "").replace(/\s+/g, " ").trim().slice(0, 220);

      setOcrResult(parsed);
      setOcrConfidence(Math.round(data?.confidence || 0));
      setOcrTextPreview(preview);

      const extractedForCurrency = parsed[currency];
      if (extractedForCurrency) {
        setBuy(String(extractedForCurrency.buy));
        setSell(String(extractedForCurrency.sell));
        setStatusMessage(`OCR gelukt. ${currency} buy/sell overgenomen uit de foto.`);
      } else if (parsed.USD || parsed.EUR) {
        setStatusMessage(`OCR vond geen ${currency}-koers in de foto. Kies de juiste valuta of upload een duidelijkere foto.`);
      } else {
        setStatusMessage("OCR kon geen geldige buy/sell-koers lezen. Upload een duidelijkere foto.");
      }
    } catch (error) {
      setStatusMessage(error?.message || "OCR verwerking is mislukt. Probeer opnieuw met een scherpere foto.");
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Ignore worker termination failures to avoid blocking UI updates.
        }
      }
      setOcrLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedCambioId) {
      setStatusMessage("Kies eerst een cambio.");
      return;
    }
    if (!photoFile) {
      setStatusMessage("Foto proof is verplicht.");
      return;
    }
    if ((ocrConfidence ?? 0) < MIN_OCR_CONFIDENCE) {
      setStatusMessage(
        `OCR confidence is te laag (${ocrConfidence ?? 0}%). Minimaal ${MIN_OCR_CONFIDENCE}% vereist.`
      );
      return;
    }
    const extracted = ocrResult?.[currency];
    if (!extracted || !buy || !sell) {
      setStatusMessage(`Geen geldige ${currency} OCR-koers gevonden. Upload een duidelijke foto van het koersbord.`);
      return;
    }

    const summary = onSubmitReport({
      cambioId: selectedCambioId,
      currency,
      buy: extracted.buy,
      sell: extracted.sell,
      photoName,
      photoFingerprint: `${photoFile.name}|${photoFile.size}|${photoFile.lastModified}`,
    });

    setStatusMessage(summary.message);
    if (!summary.ok) {
      return;
    }

    setPhotoFile(null);
    setPhotoName("");
    setOcrResult(null);
    setOcrConfidence(null);
    setOcrTextPreview("");
    setBuy("");
    setSell("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <UsersRound size={17} className="text-emeraldRate-500" />
        <h2 className="text-lg font-semibold">Report Rate (Crowdsourcing)</h2>
      </div>
      <p className="mb-3 text-sm text-slate-200/90">
        Upload een foto van het koersbord. De app leest Buy/Sell via OCR; zonder foto kan je niet submitten.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          value={selectedCambioId}
          onChange={(event) => setSelectedCambioId(event.target.value)}
          className="readable-select h-10 w-full rounded-lg border border-slate-200/20 bg-black/10 px-3 text-sm text-slate-100 outline-none"
        >
          {rates.map((rate) => (
            <option key={rate.id} value={rate.id}>
              {rate.name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-3 gap-2">
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="readable-select h-10 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-sm text-slate-100 outline-none"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          <input
            type="text"
            placeholder="Buy (OCR)"
            value={buy}
            readOnly
            className="h-10 rounded-lg border border-slate-200/20 bg-black/20 px-2 text-sm text-slate-100 outline-none"
          />
          <input
            type="text"
            placeholder="Sell (OCR)"
            value={sell}
            readOnly
            className="h-10 rounded-lg border border-slate-200/20 bg-black/20 px-2 text-sm text-slate-100 outline-none"
          />
        </div>

        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-200/30 px-3 text-sm text-slate-200">
          <Camera size={15} />
          <span>{photoName || "Photo proof upload (Verplicht)"}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </label>

        {ocrLoading && <p className="text-xs text-slate-300">OCR is foto aan het analyseren...</p>}

        {(ocrResult || ocrTextPreview) && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-100">
            <p className="inline-flex items-center gap-1">
              <ScanText size={13} />
              OCR confidence: {ocrConfidence ?? 0}% (minimaal {MIN_OCR_CONFIDENCE}%)
            </p>
            <p className="mt-1">USD: {ocrResult?.USD ? `${ocrResult.USD.buy} / ${ocrResult.USD.sell}` : "Niet gevonden"}</p>
            <p>EUR: {ocrResult?.EUR ? `${ocrResult.EUR.buy} / ${ocrResult.EUR.sell}` : "Niet gevonden"}</p>
            {ocrTextPreview && <p className="mt-1 text-emerald-100/80">Tekst-preview: "{ocrTextPreview}"</p>}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-emeraldRate-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emeraldRate-500"
        >
          Report rate
        </button>
      </form>

      {statusMessage && (
        <p className="mt-3 rounded-lg border border-slate-200/20 bg-black/10 px-3 py-2 text-xs text-slate-200">
          {statusMessage}
        </p>
      )}
    </section>
  );
}
