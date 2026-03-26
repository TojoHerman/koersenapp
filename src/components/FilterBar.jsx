import { Search, SlidersHorizontal } from "lucide-react";

export default function FilterBar({
  districts,
  selectedDistrict,
  onDistrictChange,
  searchTerm,
  onSearchChange,
  openNowOnly,
  onToggleOpenNowOnly,
  compareMode,
  onToggleCompareMode,
  showOfficialVsParallel,
  onToggleOfficialVsParallel,
}) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-100">
        <SlidersHorizontal size={16} />
        Smart Filters
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200/20 bg-black/10 px-3">
          <Search size={16} className="text-slate-300" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search cambio name"
            className="h-11 w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-300/80"
          />
        </label>

        <select
          value={selectedDistrict}
          onChange={(event) => onDistrictChange(event.target.value)}
          className="readable-select h-11 rounded-xl border border-slate-200/20 bg-black/10 px-3 text-sm text-slate-100 outline-none"
        >
          <option value="All">All Districts</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onToggleOfficialVsParallel}
          className={`h-11 rounded-xl border px-3 text-left text-sm transition ${
            showOfficialVsParallel
              ? "border-emeraldRate-500 bg-emeraldRate-500/20 text-emerald-100"
              : "border-slate-200/20 bg-black/10 text-slate-100"
          }`}
        >
          Official vs Parallel: {showOfficialVsParallel ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          onClick={onToggleOpenNowOnly}
          className={`h-11 rounded-xl border px-3 text-left text-sm transition ${
            openNowOnly
              ? "border-emeraldRate-500 bg-emeraldRate-500/20 text-emerald-100"
              : "border-slate-200/20 bg-black/10 text-slate-100"
          }`}
        >
          Open Now Only: {openNowOnly ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          onClick={onToggleCompareMode}
          className={`h-11 rounded-xl border px-3 text-left text-sm transition ${
            compareMode
              ? "border-emeraldRate-500 bg-emeraldRate-500/20 text-emerald-100"
              : "border-slate-200/20 bg-black/10 text-slate-100"
          }`}
        >
          Compare Mode: {compareMode ? "ON" : "OFF"}
        </button>
      </div>
    </section>
  );
}
