export default function MiniRateChart({ points = [], strokeClass = "stroke-emerald-300" }) {
  if (!points.length) {
    return <div className="h-10 w-28 rounded bg-slate-300/10" />;
  }

  const width = 110;
  const height = 34;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const pathPoints = points
    .map((value, index) => {
      const x = (index / (points.length - 1 || 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-28">
      <polyline fill="none" strokeWidth="2.3" className={strokeClass} points={pathPoints} />
    </svg>
  );
}
