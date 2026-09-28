// features/ai-tools/ResultCard.tsx
// Label/value result row used in every AI Tools calculator's results
// column (Figma's "ResultCard" component, e.g. node 735:1892). `accent`
// gives the primary headline metric (e.g. Monthly EMI) the dark
// highlighted treatment; other rows use the plain bordered variant.

export function ResultCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`flex w-full items-center justify-between rounded-xl px-5 py-4 ${
        accent ? "bg-brand-primary-800" : "border border-brand-secondary-500 bg-brand-secondary-400"
      }`}
    >
      <span className={`font-body text-[14px] ${accent ? "text-brand-secondary-100/70" : "text-brand-primary-600/70"}`}>{label}</span>
      <span className={`font-heading text-[18px] font-bold ${accent ? "text-brand-secondary-100" : "text-brand-primary-500"}`}>{value}</span>
    </div>
  );
}
