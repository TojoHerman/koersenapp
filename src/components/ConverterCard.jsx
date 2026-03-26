import { Calculator } from "lucide-react";
import { formatSrd, hasNumericRate } from "../utils/formatters";

export default function ConverterCard({
  amount,
  onAmountChange,
  bestBuyRate,
  bestBuyExchangeName,
  selectedCurrency,
}) {
  const parsed = Number(amount) || 0;
  const hasRate = hasNumericRate(bestBuyRate);
  const converted = hasRate ? parsed * Number(bestBuyRate) : null;

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calculator size={17} className="text-emeraldRate-500" />
        <h2 className="text-lg font-semibold">Currency Converter</h2>
      </div>

      <label className="text-xs uppercase tracking-[0.1em] text-slate-300">
        Amount ({selectedCurrency})
      </label>
      <input
        type="number"
        min="0"
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200/20 bg-black/10 px-3 text-slate-100 outline-none"
        placeholder={`Enter ${selectedCurrency} amount`}
        />

      <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3">
        <p className="text-xs uppercase tracking-[0.08em] text-emerald-100/90">
          Best buy rate source (cambio koopt van jou)
        </p>
        <p className="mt-1 text-sm text-emerald-100">
          {bestBuyExchangeName} ({selectedCurrency})
        </p>
        <p className="mt-2 text-xl font-semibold text-emerald-50">{formatSrd(converted)}</p>
      </div>
    </section>
  );
}
