import { BellRing, LocateFixed } from "lucide-react";

export default function NearbyBestRateCard({ status, message, onCheckLocation }) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <BellRing size={17} className="text-emeraldRate-500" />
        <h2 className="text-lg font-semibold">Locatie-notificaties</h2>
      </div>
      <p className="mb-3 text-sm text-slate-200/90">
        Het systeem analyseert alle cambios en meldt welke cambio nu de beste koers heeft, inclusief locatie.
      </p>
      <button
        type="button"
        onClick={onCheckLocation}
        className="inline-flex items-center gap-2 rounded-xl bg-emeraldRate-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emeraldRate-500"
      >
        <LocateFixed size={15} />
        Check mijn locatie
      </button>
      {status !== "idle" && (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
            status === "error"
              ? "border-rose-500/40 bg-rose-500/15 text-rose-100"
              : "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
