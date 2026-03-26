import { X } from "lucide-react";
import { formatSrd } from "../utils/formatters";

export default function CompareModal({ open, items, selectedCurrency, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:items-center">
      <div className="glass-panel w-full max-w-4xl rounded-3xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Compare Exchanges</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/20 bg-white/10 hover:bg-white/20"
            aria-label="Close compare modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200/15 bg-black/15 p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-300">{item.district}</p>
              <h4 className="mt-1 text-lg font-semibold">{item.name}</h4>
              <p className="mt-3 text-sm text-slate-200">Buy: {formatSrd(item.buyRate)}</p>
              <p className="text-sm text-slate-200">Sell: {formatSrd(item.sellRate)}</p>
              <p className="mt-2 text-xs text-slate-300">Source: {item.rates[selectedCurrency].source}</p>
              <p className="mt-2 text-xs text-slate-300">
                {selectedCurrency === "USD"
                  ? `EUR ${formatSrd(item.rates.EUR.buy)} / ${formatSrd(item.rates.EUR.sell)}`
                  : `USD ${formatSrd(item.rates.USD.buy)} / ${formatSrd(item.rates.USD.sell)}`}
              </p>
              <p className="mt-3 text-xs text-slate-300">{item.locationLabel}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
