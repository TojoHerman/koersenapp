import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Columns3, DollarSign, Euro, Users } from "lucide-react";
import AppHeader from "./components/AppHeader";
import BusinessPortal from "./components/BusinessPortal";
import CompareModal from "./components/CompareModal";
import ConverterCard from "./components/ConverterCard";
import CrowdsourcePanel from "./components/CrowdsourcePanel";
import FilterBar from "./components/FilterBar";
import NearbyBestRateCard from "./components/NearbyBestRateCard";
import OfficialParallelPanel from "./components/OfficialParallelPanel";
import RatesTable from "./components/RatesTable";
import TrendingSection from "./components/TrendingSection";
import { hasNumericRate } from "./utils/formatters";
import { isCambioOpenNow, isRateStale, STALE_THRESHOLD_MS } from "./utils/marketState";
import {
  fetchGoldSpotRate,
  fetchInitialMarketRates,
  fetchOfficialVsParallelSnapshot,
  refreshMarketRates,
} from "./services/ratesService";

const REFRESH_INTERVAL_MS = 3_600_000;

function toNumber(value) {
  return Number(Number(value).toFixed(2));
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function formatDistanceLabel(distanceKm) {
  if (distanceKm === null || Number.isNaN(distanceKm)) return "afstand onbekend";
  return `${distanceKm.toFixed(1)} km van je`;
}

function hasQuoteForCurrency(rate, currency) {
  const active = rate?.rates?.[currency];
  return hasNumericRate(active?.buy) && hasNumericRate(active?.sell);
}

function applyRateUpdate(list, { cambioId, currency, buy, sell, source, trustScore = 100 }) {
  return list.map((rate) => {
    if (rate.id !== cambioId) return rate;
    const target = rate.rates[currency];
    const nextBuy = toNumber(buy);
    const nextSell = toNumber(sell);
    const mid = toNumber((nextBuy + nextSell) / 2);

    return {
      ...rate,
      rates: {
        ...rate.rates,
        [currency]: {
          ...target,
          previousBuy: target.buy,
          previousSell: target.sell,
          buy: nextBuy,
          sell: nextSell,
          source,
          trustScore,
          lastSourceUpdate: new Date(),
          history: [...target.history.slice(-6), mid],
        },
      },
      updatedAt: new Date(),
    };
  });
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [rates, setRates] = useState([]);
  const ratesRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [showOfficialVsParallel, setShowOfficialVsParallel] = useState(false);
  const [officialSnapshot, setOfficialSnapshot] = useState(null);
  const [goldSpot, setGoldSpot] = useState(null);
  const [amount, setAmount] = useState("100");
  const [reports, setReports] = useState([]);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [geoMessage, setGeoMessage] = useState("");

  useEffect(() => {
    document.body.classList.toggle("light-theme", !isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    ratesRef.current = rates;
  }, [rates]);

  const refreshRates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [marketRates, latestGoldSpot] = await Promise.all([
        refreshMarketRates(ratesRef.current),
        fetchGoldSpotRate().catch(() => null),
      ]);
      setRates(marketRates);
      if (latestGoldSpot) {
        setGoldSpot(latestGoldSpot);
      }
      setLastSyncedAt(new Date());
      ratesRef.current = marketRates;

      if (showOfficialVsParallel) {
        const snapshot = await fetchOfficialVsParallelSnapshot(marketRates);
        setOfficialSnapshot(snapshot);
      }
    } catch (fetchError) {
      setError(fetchError?.message || "Failed to fetch rates.");
    } finally {
      setLoading(false);
    }
  }, [showOfficialVsParallel]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const initialRates = await fetchInitialMarketRates();
        const initialGoldSpot = await fetchGoldSpotRate().catch(() => null);
        if (!active) return;
        setRates(initialRates);
        if (initialGoldSpot) {
          setGoldSpot(initialGoldSpot);
        }
        ratesRef.current = initialRates;
        setLastSyncedAt(new Date());
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError?.message || "Failed to fetch initial rates.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      refreshRates();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refreshRates]);

  useEffect(() => {
    if (!showOfficialVsParallel) {
      setOfficialSnapshot(null);
      return;
    }

    fetchOfficialVsParallelSnapshot(ratesRef.current)
      .then(setOfficialSnapshot)
      .catch(() => setOfficialSnapshot(null));
  }, [showOfficialVsParallel, selectedCurrency]);

  useEffect(() => {
    setSelectedCompareIds((prev) => prev.filter((id) => rates.some((rate) => rate.id === id)));
  }, [rates]);

  const districtOptions = useMemo(
    () => [...new Set(rates.map((rate) => rate.district))].sort(),
    [rates]
  );

  const filteredRates = useMemo(() => {
    return rates.filter((rate) => {
      const districtMatch = selectedDistrict === "All" || rate.district === selectedDistrict;
      const nameMatch = rate.name.toLowerCase().includes(searchTerm.toLowerCase());
      const openNowMatch = !openNowOnly || isCambioOpenNow(rate.businessHours) === true;
      return districtMatch && nameMatch && openNowMatch;
    });
  }, [rates, selectedDistrict, searchTerm, openNowOnly]);

  const filteredRatesWithQuotes = useMemo(
    () => filteredRates.filter((rate) => hasQuoteForCurrency(rate, selectedCurrency)),
    [filteredRates, selectedCurrency]
  );

  const freshRatesForSelectedCurrency = useMemo(
    () =>
      filteredRatesWithQuotes.filter((rate) => !isRateStale(rate.updatedAt, STALE_THRESHOLD_MS)),
    [filteredRatesWithQuotes]
  );

  const allRatesWithQuotesForSelectedCurrency = useMemo(
    () => rates.filter((rate) => hasQuoteForCurrency(rate, selectedCurrency)),
    [rates, selectedCurrency]
  );

  const bestBuyId = useMemo(() => {
    if (!freshRatesForSelectedCurrency.length) return null;
    return freshRatesForSelectedCurrency.reduce((best, current) =>
      current.rates[selectedCurrency].buy < best.rates[selectedCurrency].buy ? current : best
    ).id;
  }, [freshRatesForSelectedCurrency, selectedCurrency]);

  const bestSellId = useMemo(() => {
    if (!freshRatesForSelectedCurrency.length) return null;
    return freshRatesForSelectedCurrency.reduce((best, current) =>
      current.rates[selectedCurrency].sell > best.rates[selectedCurrency].sell ? current : best
    ).id;
  }, [freshRatesForSelectedCurrency, selectedCurrency]);

  const bestSellExchange = useMemo(
    () => freshRatesForSelectedCurrency.find((rate) => rate.id === bestSellId) || null,
    [freshRatesForSelectedCurrency, bestSellId]
  );
  const bestBuyExchangeForConverter = useMemo(() => {
    const pool = freshRatesForSelectedCurrency.length
      ? freshRatesForSelectedCurrency
      : allRatesWithQuotesForSelectedCurrency;
    if (!pool.length) return null;

    return pool.reduce((best, current) =>
      current.rates[selectedCurrency].buy < best.rates[selectedCurrency].buy ? current : best
    );
  }, [freshRatesForSelectedCurrency, allRatesWithQuotesForSelectedCurrency, selectedCurrency]);

  const topViewed = useMemo(
    () => [...rates].sort((a, b) => b.viewsToday - a.viewsToday).slice(0, 5),
    [rates]
  );

  const compareItems = useMemo(() => {
    return rates
      .filter((item) => selectedCompareIds.includes(item.id))
      .map((item) => ({
        ...item,
        buyRate: item.rates[selectedCurrency].buy,
        sellRate: item.rates[selectedCurrency].sell,
      }));
  }, [rates, selectedCompareIds, selectedCurrency]);

  const canOpenCompare = selectedCompareIds.length >= 2 && selectedCompareIds.length <= 3;

  const handleToggleCompareMode = () => {
    setCompareMode((prev) => !prev);
    setSelectedCompareIds([]);
    setCompareModalOpen(false);
  };

  const handleToggleCompareSelect = (id) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleToggleOfficialVsParallel = () => {
    setShowOfficialVsParallel((prev) => !prev);
  };

  const handleTrackView = useCallback((cambioId) => {
    if (!cambioId) return;
    setRates((current) =>
      current.map((item) =>
        item.id === cambioId
          ? {
              ...item,
              viewsToday: Number.isFinite(Number(item.viewsToday)) ? Number(item.viewsToday) + 1 : 1,
            }
          : item
      )
    );
  }, []);

  const handleReportRate = (payload) => {
    const normalizedBuy = toNumber(payload.buy);
    const normalizedSell = toNumber(payload.sell);
    if (normalizedSell <= normalizedBuy) {
      return {
        ok: false,
        message: "Fraud-check: sell moet hoger zijn dan buy.",
      };
    }

    const spread = normalizedSell - normalizedBuy;
    if (spread > 5) {
      return {
        ok: false,
        message: "Fraud-check: spread is onrealistisch groot. Report geblokkeerd.",
      };
    }

    const baselineRate = ratesRef.current.find((item) => item.id === payload.cambioId)?.rates?.[payload.currency];
    if (baselineRate && hasNumericRate(baselineRate.buy) && hasNumericRate(baselineRate.sell)) {
      const buyDelta = Math.abs(normalizedBuy - baselineRate.buy);
      const sellDelta = Math.abs(normalizedSell - baselineRate.sell);
      if (buyDelta > 3 || sellDelta > 3) {
        return {
          ok: false,
          message: "Fraud-check: report wijkt te sterk af van de recente koers. Controleer je foto opnieuw.",
        };
      }
    }

    const now = new Date();
    const oneHourAgo = now.getTime() - 60 * 60 * 1000;
    if (payload.photoFingerprint) {
      const duplicateProof = reports.some((item) => {
        const insideWindow = new Date(item.reportedAt).getTime() >= oneHourAgo;
        return item.photoFingerprint === payload.photoFingerprint && insideWindow;
      });
      if (duplicateProof) {
        return {
          ok: false,
          message: "Fraud-check: dezelfde photo proof werd recent al gebruikt.",
        };
      }
    }

    const report = {
      id: `report-${Date.now()}`,
      ...payload,
      buy: normalizedBuy,
      sell: normalizedSell,
      reportedAt: now,
    };
    const nextReports = [report, ...reports];
    setReports(nextReports);

    const oneHourAgoForMatch = report.reportedAt.getTime() - 60 * 60 * 1000;
    const matchingReportsCount = nextReports.filter((item) => {
      const sameCambio = item.cambioId === report.cambioId;
      const sameCurrency = item.currency === report.currency;
      const sameBuy = toNumber(item.buy) === report.buy;
      const sameSell = toNumber(item.sell) === report.sell;
      const insideWindow = new Date(item.reportedAt).getTime() >= oneHourAgoForMatch;
      return sameCambio && sameCurrency && sameBuy && sameSell && insideWindow;
    }).length;

    const verified = matchingReportsCount >= 3;
    const source = verified ? "Community Verified" : "User Reported";
    const trustScore = Math.min(100, matchingReportsCount * 34);

    setRates((current) =>
      applyRateUpdate(current, {
        ...payload,
        source,
        trustScore,
      })
    );

    return {
      ok: true,
      message: verified
        ? "Community Verified: 3+ identieke reports binnen 1 uur."
        : `Report opgeslagen (${matchingReportsCount}/3 voor community verification).`,
    };
  };

  const handleOwnerUpdateRate = ({ cambioId, currency, buy, sell }) => {
    setRates((current) =>
      applyRateUpdate(current, {
        cambioId,
        currency,
        buy,
        sell,
        source: "Cambio Owner Portal",
        trustScore: 100,
      })
    );
  };

  const handleCheckLocation = () => {
    if (!rates.length) {
      setGeoStatus("error");
      setGeoMessage("Er zijn nog geen cambio-koersen om te analyseren.");
      return;
    }

    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoMessage("Geolocation API is niet beschikbaar in deze browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const analyzed = rates
          .map((rate) => ({
            ...rate,
            distance:
              rate.coordinates?.lat && rate.coordinates?.lng
                ? haversineKm(userCoords, rate.coordinates)
                : null,
          }))
          .filter(
            (rate) =>
              hasQuoteForCurrency(rate, selectedCurrency) &&
              !isRateStale(rate.updatedAt, STALE_THRESHOLD_MS)
          );

        if (!analyzed.length) {
          setGeoStatus("error");
          setGeoMessage(`Geen verse ${selectedCurrency}-koersen beschikbaar voor analyse.`);
          return;
        }

        const bestSell = analyzed.reduce((best, current) =>
          current.rates[selectedCurrency].sell > best.rates[selectedCurrency].sell ? current : best
        );
        const bestBuy = analyzed.reduce((best, current) =>
          current.rates[selectedCurrency].buy < best.rates[selectedCurrency].buy ? current : best
        );

        const bestSellRate = bestSell.rates[selectedCurrency].sell.toFixed(2);
        const bestBuyRate = bestBuy.rates[selectedCurrency].buy.toFixed(2);
        const bestSellDistance = formatDistanceLabel(bestSell.distance);
        const bestBuyDistance = formatDistanceLabel(bestBuy.distance);

        const message = `Beste ${selectedCurrency}-sell: ${bestSell.name} (${bestSellRate} SRD, ${bestSellDistance}). Beste ${selectedCurrency}-buy: ${bestBuy.name} (${bestBuyRate} SRD, ${bestBuyDistance}).`;
        setGeoStatus("success");
        setGeoMessage(message);

        if ("Notification" in window) {
          const notificationBody = `Beste ${selectedCurrency}-koers nu bij ${bestSell.name} (${bestSellRate} SRD sell).`;
          const showNotification = () => new Notification("Koersen Alert", { body: notificationBody });
          if (Notification.permission === "granted") {
            showNotification();
          } else if (Notification.permission === "default") {
            Notification.requestPermission().then((permission) => {
              if (permission === "granted") showNotification();
            });
          }
        }
      },
      (geoError) => {
        setGeoStatus("error");
        setGeoMessage(geoError.message || "Locatie kon niet worden opgehaald.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  return (
    <main className={`min-h-screen px-3 py-4 sm:px-5 sm:py-6 ${isDarkMode ? "" : "text-slate-900"}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-5">
        <AppHeader
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((prev) => !prev)}
          onRefresh={refreshRates}
          isRefreshing={loading}
          lastSyncLabel={lastSyncedAt.toLocaleTimeString()}
          goldSpot={goldSpot}
        />

        <FilterBar
          districts={districtOptions}
          selectedDistrict={selectedDistrict}
          onDistrictChange={setSelectedDistrict}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          openNowOnly={openNowOnly}
          onToggleOpenNowOnly={() => setOpenNowOnly((prev) => !prev)}
          compareMode={compareMode}
          onToggleCompareMode={handleToggleCompareMode}
          showOfficialVsParallel={showOfficialVsParallel}
          onToggleOfficialVsParallel={handleToggleOfficialVsParallel}
        />

        <section className="glass-panel rounded-2xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Display Currency</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedCurrency("USD")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${
                  selectedCurrency === "USD"
                    ? "bg-emeraldRate-600 text-white"
                    : "border border-slate-200/20 bg-black/10 text-slate-200"
                }`}
              >
                <DollarSign size={15} />
                USD
              </button>
              <button
                type="button"
                onClick={() => setSelectedCurrency("EUR")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${
                  selectedCurrency === "EUR"
                    ? "bg-emeraldRate-600 text-white"
                    : "border border-slate-200/20 bg-black/10 text-slate-200"
                }`}
              >
                <Euro size={15} />
                EUR
              </button>
            </div>
          </div>
        </section>

        {showOfficialVsParallel && (
          <OfficialParallelPanel snapshot={officialSnapshot} selectedCurrency={selectedCurrency} />
        )}

        {error && (
          <section className="glass-panel rounded-2xl border border-rose-500/40 p-3 text-sm text-rose-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          </section>
        )}

        {compareMode && (
          <section className="glass-panel rounded-2xl p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-100">
                Select 2 or 3 exchanges for side-by-side comparison.
                <span className="ml-2 rounded-full bg-slate-300/20 px-2 py-1 text-xs">
                  Selected: {selectedCompareIds.length}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setCompareModalOpen(true)}
                disabled={!canOpenCompare}
                className="inline-flex items-center gap-2 rounded-lg bg-emeraldRate-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Columns3 size={16} />
                Compare Selected
              </button>
            </div>
          </section>
        )}

        <div className="min-w-0">
          <RatesTable
            rates={filteredRates}
            loading={loading}
            bestBuyId={bestBuyId}
            bestSellId={bestSellId}
            selectedCurrency={selectedCurrency}
            compareMode={compareMode}
            selectedCompareIds={selectedCompareIds}
            onToggleCompareSelect={handleToggleCompareSelect}
            onTrackView={handleTrackView}
            staleThresholdMs={STALE_THRESHOLD_MS}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ConverterCard
            amount={amount}
            onAmountChange={setAmount}
            selectedCurrency={selectedCurrency}
            bestBuyRate={bestBuyExchangeForConverter?.rates?.[selectedCurrency]?.buy ?? null}
            bestBuyExchangeName={bestBuyExchangeForConverter?.name || "Geen koers beschikbaar"}
          />
          <TrendingSection items={topViewed} />
          <NearbyBestRateCard
            status={geoStatus}
            message={geoMessage}
            onCheckLocation={handleCheckLocation}
          />
        </div>

        <div className="glass-panel rounded-2xl p-3 text-xs text-slate-200">
          <span className="inline-flex items-center gap-1">
            <Users size={13} className="text-emeraldRate-500" />
            Community reports vandaag: {reports.length}
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <CrowdsourcePanel
            rates={rates}
            defaultCurrency={selectedCurrency}
            onSubmitReport={handleReportRate}
          />
          <BusinessPortal rates={rates} onOwnerUpdateRate={handleOwnerUpdateRate} />
        </div>

        {!loading && filteredRates.length === 0 && (
          <section className="glass-panel rounded-xl p-4 text-sm text-slate-200">
            No exchanges match your current filter/search.
          </section>
        )}

        <footer className="pb-2 text-center text-xs text-slate-300/80">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 size={14} className="text-emeraldRate-500" />
            Live multi-source feed active. Update cycle every 1 hour.
          </span>
          <p className="mt-2">
            Designed and maintained by{" "}
            <a
              href="https://www.tcbictservice.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline"
            >
              TCB ICT Services &amp; Consultancy
            </a>
          </p>
        </footer>
      </div>

      <CompareModal
        open={compareModalOpen}
        items={compareItems}
        selectedCurrency={selectedCurrency}
        onClose={() => setCompareModalOpen(false)}
      />
    </main>
  );
}
