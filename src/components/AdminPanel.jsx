import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminPanel({ rates, onAdminUpdateRate, onAdminAddCambio, onAdminRemoveCambio }) {
  const [selectedId, setSelectedId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [newCambio, setNewCambio] = useState({
    name: "",
    district: "Paramaribo",
    locationLabel: "",
    whatsappNumber: "",
    usdBuy: "39.20",
    usdSell: "39.80",
    eurBuy: "42.50",
    eurSell: "43.20",
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    const exists = rates.some((rate) => rate.id === selectedId);
    if ((!selectedId || !exists) && rates.length) {
      setSelectedId(rates[0].id);
    }
    if (!rates.length) {
      setSelectedId("");
    }
  }, [rates, selectedId]);

  const handleUpdateRate = (event) => {
    event.preventDefault();
    if (!selectedId || !buy || !sell) return;
    onAdminUpdateRate({
      cambioId: selectedId,
      currency,
      buy: Number(buy),
      sell: Number(sell),
    });
    setStatus("Admin update opgeslagen.");
    setBuy("");
    setSell("");
  };

  const handleAddCambio = (event) => {
    event.preventDefault();
    if (!newCambio.name || !newCambio.locationLabel) {
      setStatus("Naam en locatie zijn verplicht.");
      return;
    }
    const id = slugify(newCambio.name);
    onAdminAddCambio({
      id,
      name: newCambio.name,
      district: newCambio.district,
      locationLabel: newCambio.locationLabel,
      mapsQuery: `${newCambio.locationLabel} Suriname`,
      whatsappNumber: newCambio.whatsappNumber || "5978889999",
      usdBuy: Number(newCambio.usdBuy),
      usdSell: Number(newCambio.usdSell),
      eurBuy: Number(newCambio.eurBuy),
      eurSell: Number(newCambio.eurSell),
      coordinates: null,
    });
    setStatus("Nieuwe cambio toegevoegd.");
    setNewCambio({
      name: "",
      district: "Paramaribo",
      locationLabel: "",
      whatsappNumber: "",
      usdBuy: "39.20",
      usdSell: "39.80",
      eurBuy: "42.50",
      eurSell: "43.20",
    });
  };

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck size={17} className="text-emeraldRate-500" />
        <h2 className="text-lg font-semibold">Admin Module</h2>
      </div>

      <form onSubmit={handleUpdateRate} className="space-y-2 rounded-xl border border-slate-200/10 bg-black/10 p-3">
        <p className="text-xs uppercase tracking-[0.08em] text-slate-300">Koers manueel aanpassen</p>
        <div className="grid grid-cols-4 gap-2">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="col-span-2 h-9 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
          >
            {rates.map((rate) => (
              <option key={rate.id} value={rate.id}>
                {rate.name}
              </option>
            ))}
          </select>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="h-9 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          <button
            type="button"
            onClick={() => onAdminRemoveCambio(selectedId)}
            className="h-9 rounded-lg border border-rose-500/40 bg-rose-500/20 px-2 text-xs text-rose-100"
          >
            Verwijder
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="0.01"
            placeholder="Buy"
            value={buy}
            onChange={(event) => setBuy(event.target.value)}
            className="h-9 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Sell"
            value={sell}
            onChange={(event) => setSell(event.target.value)}
            className="h-9 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
          />
        </div>
        <button type="submit" className="w-full rounded-lg bg-emeraldRate-600 py-2 text-xs font-medium text-white">
          Opslaan
        </button>
      </form>

      <form onSubmit={handleAddCambio} className="mt-3 space-y-2 rounded-xl border border-slate-200/10 bg-black/10 p-3">
        <p className="text-xs uppercase tracking-[0.08em] text-slate-300">Nieuwe cambio toevoegen</p>
        <input
          value={newCambio.name}
          onChange={(event) => setNewCambio((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Naam"
          className="h-9 w-full rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
        />
        <input
          value={newCambio.locationLabel}
          onChange={(event) => setNewCambio((prev) => ({ ...prev, locationLabel: event.target.value }))}
          placeholder="Locatie"
          className="h-9 w-full rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={newCambio.district}
            onChange={(event) => setNewCambio((prev) => ({ ...prev, district: event.target.value }))}
            placeholder="District"
            className="h-9 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
          />
          <input
            value={newCambio.whatsappNumber}
            onChange={(event) => setNewCambio((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
            placeholder="WhatsApp"
            className="h-9 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={newCambio.usdBuy}
            onChange={(event) => setNewCambio((prev) => ({ ...prev, usdBuy: event.target.value }))}
            placeholder="USD Buy"
            className="h-9 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
          />
          <input
            value={newCambio.usdSell}
            onChange={(event) => setNewCambio((prev) => ({ ...prev, usdSell: event.target.value }))}
            placeholder="USD Sell"
            className="h-9 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={newCambio.eurBuy}
            onChange={(event) => setNewCambio((prev) => ({ ...prev, eurBuy: event.target.value }))}
            placeholder="EUR Buy"
            className="h-9 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
          />
          <input
            value={newCambio.eurSell}
            onChange={(event) => setNewCambio((prev) => ({ ...prev, eurSell: event.target.value }))}
            placeholder="EUR Sell"
            className="h-9 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-xs text-slate-100 outline-none"
          />
        </div>
        <button type="submit" className="w-full rounded-lg bg-navy-700 py-2 text-xs font-medium text-white">
          Voeg cambio toe
        </button>
      </form>

      {status && <p className="mt-2 text-xs text-slate-300">{status}</p>}
    </section>
  );
}
