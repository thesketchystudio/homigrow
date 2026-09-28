// features/ai-tools/ToolPageShell.tsx
// Shared page chrome for every individual AI Tools calculator screen
// (Figma's "ToolLayout" component, e.g. node 735:1817 for EMI Calculator):
// a dark header with a "← Tools" breadcrumb, category eyebrow and H1,
// followed by a centered content area. Extracted once since all 7
// calculator screens share this exact shell — only the body differs.

import Link from "next/link";

export function ToolPageShell({ category, title, children }: { category: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-start gap-6 bg-brand-primary-800 px-6 pt-28 pb-16 sm:px-16">
        <div className="flex items-center gap-4">
          <Link href="/ai-tools" className="font-body text-[14px] text-brand-secondary-100/60 hover:text-brand-secondary-100">
            ← Tools
          </Link>
          <span className="font-body text-[14px] text-brand-secondary-100/30">/</span>
          <span className="font-heading text-[14px] font-bold text-brand-secondary-100">{title}</span>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-heading text-[12px] font-bold tracking-[1.2px] text-brand-primary-200 uppercase">{category}</p>
          <h1 className="font-heading text-[36px] font-bold text-brand-secondary-100 sm:text-[48px]">{title}</h1>
        </div>
      </div>
      <div className="flex justify-center bg-brand-secondary-400 px-6 py-12 sm:px-16">
        <div className="w-full max-w-[896px]">{children}</div>
      </div>
    </div>
  );
}
