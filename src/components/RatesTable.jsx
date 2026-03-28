import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ExternalLink, Minus } from "lucide-react";
import { formatSrd, hasNumericRate, relativeTime } from "../utils/formatters";
import { isCambioOpenNow, isRateStale } from "../utils/marketState";
import MiniRateChart from "./MiniRateChart";

function TrendPill({ buyRate, sellRate, previousBuyRate, previousSellRate }) {
  const hasCurrent = hasNumericRate(buyRate) && hasNumericRate(sellRate);
  const hasPrevious = hasNumericRate(previousBuyRate) && hasNumericRate(previousSellRate);
  if (!hasCurrent || !hasPrevious) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-400/20 px-2 py-1 text-xs font-medium text-slate-100">
        <Minus size={14} />
        Geen data
      </span>
    );
  }

  const delta = (buyRate - previousBuyRate + (sellRate - previousSellRate)) / 2;
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-200">
        <ArrowUpRight size={14} />
        Up
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-1 text-xs font-medium text-rose-200">
        <ArrowDownRight size={14} />
        Down
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-400/20 px-2 py-1 text-xs font-medium text-slate-100">
      <Minus size={14} />
      Flat
    </span>
  );
}

function LoadingRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <tr key={`skeleton-${index}`} className="border-b border-slate-200/10">
      {Array.from({ length: 12 }).map((__, colIdx) => (
        <td key={colIdx} className="px-3 py-4">
          <div className="h-4 w-full animate-pulse-soft rounded bg-slate-300/20" />
        </td>
      ))}
    </tr>
  ));
}

function SourceBadge({ source, trustScore = 0 }) {
  if (source === "Official Site") {
    return <span className="rounded-full bg-sky-500/20 px-2 py-1 text-xs text-sky-100">Official Site</span>;
  }
  if (source === "Community Verified") {
    return (
      <span className="rounded-full bg-emerald-500/25 px-2 py-1 text-xs text-emerald-100">
        Community Verified ({trustScore}%)
      </span>
    );
  }
  if (source === "User Reported") {
    return (
      <span className="rounded-full bg-amber-500/25 px-2 py-1 text-xs text-amber-100">
        User Reported ({trustScore}%)
      </span>
    );
  }
  if (source === "Business Portal" || source === "Cambio Owner Portal") {
    return (
      <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-xs text-indigo-100">
        Cambio Owner Portal
      </span>
    );
  }
  if (source === "CBvS Register") {
    return <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-100">CBvS Register</span>;
  }
  if (source === "Admin Updated" || source === "Admin Added") {
    return <span className="rounded-full bg-slate-400/20 px-2 py-1 text-xs text-slate-100">{source}</span>;
  }
  return <span className="rounded-full bg-slate-400/20 px-2 py-1 text-xs text-slate-100">{source}</span>;
}

export default function RatesTable({
  rates,
  loading,
  bestBuyId,
  bestSellId,
  selectedCurrency,
  compareMode,
  selectedCompareIds,
  onToggleCompareSelect,
  onTrackView,
  staleThresholdMs,
}) {
  const [, setTicker] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((value) => value + 1);
    }, 30_000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="glass-panel rounded-2xl p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Live Cambio Board</h2>
        <p className="text-xs text-slate-300">Buy: lower is better | Sell: higher is better</p>
      </div>

      <div className="table-scroll overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/15 text-xs uppercase tracking-[0.08em] text-slate-300">
              {compareMode && <th className="px-3 py-2">Compare</th>}
              <th className="px-3 py-2">Exchange</th>
              <th className="px-3 py-2">District</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Open</th>
              <th className="px-3 py-2">{selectedCurrency} Buy</th>
              <th className="px-3 py-2">{selectedCurrency} Sell</th>
              <th className="px-3 py-2">Trend</th>
              <th className="px-3 py-2">7D</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Last Updated</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows />
            ) : (
              rates.map((rate) => {
                const isBestBuy = rate.id === bestBuyId;
                const isBestSell = rate.id === bestSellId;
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rate.mapsQuery)}`;
                const active = rate.rates[selectedCurrency];
                const hasQuote = hasNumericRate(active?.buy) && hasNumericRate(active?.sell);
                const isOpenNow = isCambioOpenNow(rate.businessHours);
                const stale = isRateStale(rate.updatedAt, staleThresholdMs);

                return (
                  <tr key={rate.id} className="border-b border-slate-200/10 text-slate-100/95">
                    {compareMode && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCompareIds.includes(rate.id)}
                          onChange={() => onToggleCompareSelect(rate.id)}
                          className="h-4 w-4 rounded border-slate-200/20 bg-transparent accent-emeraldRate-500"
                        />
                      </td>
                    )}
                    <td className="px-3 py-3 font-medium">{rate.name}</td>
                    <td className="px-3 py-3">{rate.district}</td>
                    <td className="px-3 py-3 text-slate-200/85">{rate.locationLabel}</td>
                    <td className="px-3 py-3">
                      {isOpenNow === null ? (
                        <span className="rounded-full bg-slate-400/20 px-2 py-0.5 text-xs text-slate-100">Unknown</span>
                      ) : isOpenNow ? (
                        <span className="rounded-full bg-emerald-500/25 px-2 py-0.5 text-xs text-emerald-100">Open</span>
                      ) : (
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-100">Closed</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span>{formatSrd(active.buy)}</span>
                        {isBestBuy && hasQuote && (
                          <span className="rounded-full bg-amber-300/20 px-2 py-0.5 text-xs text-amber-200">
                            Best Buy
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span>{formatSrd(active.sell)}</span>
                        {isBestSell && hasQuote && (
                          <span className="rounded-full bg-emerald-500/25 px-2 py-0.5 text-xs text-emerald-100">
                            Best Sell
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <TrendPill
                        buyRate={active.buy}
                        sellRate={active.sell}
                        previousBuyRate={active.previousBuy}
                        previousSellRate={active.previousSell}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <MiniRateChart points={active.history} />
                    </td>
                    <td className="px-3 py-3">
                      <SourceBadge source={active.source} trustScore={active.trustScore} />
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{relativeTime(rate.updatedAt)}</span>
                        {stale && (
                          <span className="rounded-full bg-amber-500/25 px-2 py-0.5 text-[10px] text-amber-100">
                            Stale
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          onTrackView?.(rate.id);
                          window.open(mapUrl, "_blank", "noopener,noreferrer");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200/20 px-2 py-1 text-xs text-slate-100 transition hover:bg-white/15"
                      >
                        Map View
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
