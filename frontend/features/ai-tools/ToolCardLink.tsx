// features/ai-tools/ToolCardLink.tsx
// Tool card (icon, title, category, description, "Open tool →") shared by
// the hub's "Browse All Tools" grid and each tool page's "Explore more
// tools" row, which use the identical Figma card.

import Link from "next/link";

import type { ToolCard } from "./toolsCatalog";

export function ToolCardLink({ tool }: { tool: ToolCard }) {
  const Icon = tool.icon;
  return (
    <Link
      href={`/ai-tools/${tool.slug}`}
      className="flex flex-col gap-6 rounded-2xl border border-brand-secondary-500 bg-brand-secondary-100 p-8 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 items-center justify-center rounded-lg bg-brand-green-200 p-3">
          <Icon className="size-6 text-brand-green-900" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-[18px] font-bold text-brand-primary-500">{tool.title}</span>
          <span className="font-body text-[12px] text-brand-primary-100">{tool.category}</span>
        </div>
      </div>
      <p className="font-body flex-1 text-[14px] leading-[22px] text-brand-primary-600/80">{tool.description}</p>
      <span className="font-heading text-[14px] font-bold text-brand-primary-600">Open tool →</span>
    </Link>
  );
}
