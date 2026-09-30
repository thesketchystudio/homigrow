// features/ai-tools/ExploreMoreTools.tsx
// "Explore more tools" row at the bottom of each tool page (Figma node
// 747:734): the three tools most relevant to the current one, in the
// order defined by `related` in toolsCatalog.

import { ToolCardLink } from "./ToolCardLink";
import { getTool } from "./toolsCatalog";

export function ExploreMoreTools({ slug }: { slug: string }) {
  const related = (getTool(slug)?.related ?? []).map(getTool).filter((t) => t !== undefined);
  if (related.length === 0) return null;

  return (
    <section className="flex flex-col items-center gap-8">
      <h2 className="font-heading text-[28px] leading-[1.2] font-bold text-brand-primary-500 sm:text-[36px]">Explore more tools</h2>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        {related.map((tool) => (
          <ToolCardLink key={tool.slug} tool={tool} />
        ))}
      </div>
    </section>
  );
}
