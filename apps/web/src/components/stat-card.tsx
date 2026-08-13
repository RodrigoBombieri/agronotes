export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-ink-muted">{label}</p>
      <p className="mt-1 text-[26px] font-extrabold tabular-nums text-brand-900">{value}</p>
    </div>
  );
}
