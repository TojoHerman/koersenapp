import { Bell, BellOff } from "lucide-react";
import { formatSrd } from "../utils/formatters";

export default function RateAlertCard({ config, onChange, bestQuote, statusMessage }) {
  const update = (patch) => onChange({ ...config, ...patch });

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {config.enabled ? (
            <Bell size={17} className="text-emeraldRate-500" />
          ) : (
            <BellOff size={17} className="text-slate-300" />
          )}
          <h2 className="text-lg font-semibold">Target Alert</h2>
        </div>
        <button
          type="button"
          onClick={() => update({ enabled: !config.enabled })}
          className={`rounded-lg px-3 py-1 text-xs font-medium ${
            config.enabled
              ? "bg-emeraldRate-600 text-white"
              : "border border-slate-200/20 bg-black/10 text-slate-200"
          }`}
        >
          {config.enabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <select
          value={config.currency}
          onChange={(event) => update({ currency: event.target.value })}
          className="readable-select h-10 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-sm text-slate-100 outline-none"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
        <select
          value={config.side}
          onChange={(event) => update({ side: event.target.value })}
          className="readable-select h-10 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-sm text-slate-100 outline-none"
        >
          <option value="buy">Buy (lager is beter)</option>
          <option value="sell">Sell (hoger is beter)</option>
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          value={config.target}
          onChange={(event) => update({ target: event.target.value })}
          placeholder="Target koers"
          className="h-10 rounded-lg border border-slate-200/20 bg-black/10 px-3 text-sm text-slate-100 outline-none"
        />
      </div>

      <p className="mt-3 text-xs text-slate-300">
        {bestQuote
          ? `Actuele beste ${config.currency} ${config.side}: ${bestQuote.name} (${formatSrd(bestQuote.rate)})`
          : `Geen verse ${config.currency}-koers beschikbaar voor alert.`}
      </p>
      <p className="mt-2 rounded-lg border border-slate-200/20 bg-black/10 px-3 py-2 text-xs text-slate-200">
        {statusMessage}
      </p>
    </section>
  );
}
