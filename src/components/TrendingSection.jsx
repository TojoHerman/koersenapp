import { Flame } from "lucide-react";

export default function TrendingSection({ items }) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Flame size={17} className="text-amber-300" />
        <h2 className="text-lg font-semibold">Most Viewed Today</h2>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-slate-200/10 bg-black/10 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-slate-100">
                {index + 1}. {item.name}
              </p>
              <p className="text-xs text-slate-300">{item.district}</p>
            </div>
            <span className="rounded-full bg-amber-300/20 px-2 py-1 text-xs font-medium text-amber-200">
              {item.viewsToday} views
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
