import { Landmark, Scale } from "lucide-react";
import { formatSrd } from "../utils/formatters";

function DeltaChip({ value }) {
  const positive = value > 0;
  const neutral = value === 0;
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        neutral
          ? "bg-slate-300/20 text-slate-100"
          : positive
            ? "bg-emerald-500/20 text-emerald-200"
            : "bg-rose-500/20 text-rose-200"
      }`}
    >
      {neutral ? "No delta" : `${positive ? "+" : ""}${value.toFixed(2)} SRD`}
    </span>
  );
}

export default function OfficialParallelPanel({ snapshot, selectedCurrency }) {
  if (!snapshot) return null;

  const official = snapshot.official[selectedCurrency];
  const parallel = snapshot.parallelMarket[selectedCurrency];
  const buyDelta = +(parallel.buy - official.buy).toFixed(2);
  const sellDelta = +(parallel.sell - official.sell).toFixed(2);

  return (
    <section className="glass-panel animate-fade-up rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark size={17} className="text-emeraldRate-500" />
          <h2 className="text-lg font-semibold">Official vs Parallel Snapshot ({selectedCurrency})</h2>
        </div>
        <span className="text-xs text-slate-300">CBvS & market spread</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200/15 bg-black/10 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-300">CBvS Official</p>
          <p className="mt-2 text-sm text-slate-100">Buy: {formatSrd(official.buy)}</p>
          <p className="text-sm text-slate-100">Sell: {formatSrd(official.sell)}</p>
        </div>
        <div className="rounded-xl border border-slate-200/15 bg-black/10 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Parallel Market (Avg)</p>
          <p className="mt-2 text-sm text-slate-100">Buy: {formatSrd(parallel.buy)}</p>
          <p className="text-sm text-slate-100">Sell: {formatSrd(parallel.sell)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <Scale size={16} className="text-slate-200" />
        <span className="text-slate-200">Market spread:</span>
        <DeltaChip value={buyDelta} />
        <DeltaChip value={sellDelta} />
      </div>
    </section>
  );
}
