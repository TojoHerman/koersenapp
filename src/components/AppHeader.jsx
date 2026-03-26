import { MoonStar, RefreshCw, Sun } from "lucide-react";

export default function AppHeader({
  isDarkMode,
  onToggleTheme,
  onRefresh,
  isRefreshing,
  lastSyncLabel,
}) {
  return (
    <header className="glass-panel rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emeraldRate-500">Koersen Suriname</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">Real-Time Cambio Rates</h1>
          <p className="mt-1 text-sm text-slate-200/80">
            Compare USD/EUR rates across market cambios and CBvS official benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/20 bg-white/10 transition hover:bg-white/20"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <MoonStar size={18} />}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-emeraldRate-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition hover:bg-emeraldRate-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-950/25 px-4 py-2 text-xs text-slate-200/80">
        Last platform sync: {lastSyncLabel}
      </div>
    </header>
  );
}
