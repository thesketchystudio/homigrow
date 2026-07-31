// features/properties/PropertyHeroGallery.tsx
// Asymmetric bento-grid hero gallery for the Property Details screen
// (Figma node 31:1847). Most seeded listings only have one real photo —
// rather than leaving the other three grid cells blank/grey, they cycle
// through whatever photos the property does have so the grid always
// looks populated (a single-photo property just repeats that one photo
// across all four cells). "Redesign with AI" (node 127:1499) has no
// backing image-generation service — same "not available yet" toast
// pattern as PropertyContactCard's Schedule/Get Number actions.

import { Sparkles } from "lucide-react";

import type { PropertyMediaRead } from "@/lib/api/endpoints/properties";
import { toast } from "@/lib/toast";

type PropertyHeroGalleryProps = {
  media: PropertyMediaRead[];
  title: string;
};

export function PropertyHeroGallery({ media, title }: PropertyHeroGalleryProps) {
  const images = [...media].sort((a, b) => a.position - b.position);
  const remaining = Math.max(images.length - 4, 0);
  // Cycle rather than leave a cell empty when there are fewer than 4 real photos.
  const cellImage = (index: number) => (images.length > 0 ? images[index % images.length] : undefined);
  const hero = cellImage(0);
  const interior = cellImage(1);
  const detail = cellImage(2);
  const overlayCell = cellImage(3);

  return (
    <div className="flex flex-col gap-4 lg:h-[716px] lg:flex-row">
      <div className="relative h-[350px] shrink-0 overflow-hidden rounded lg:h-full lg:w-2/3 lg:flex-1">
        {hero && <img src={hero.url} alt={title} className="h-full w-full object-cover" />}
        <div className="absolute top-6 left-8 rounded bg-brand-green-500 px-4 py-2">
          <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-primary-600">
            Featured Architecture
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast.info("AI redesign isn't available yet — check back soon.")}
          className="absolute bottom-7 left-8 flex items-center gap-2 rounded border border-[#13c200] bg-brand-secondary-400 px-6 py-4"
        >
          <Sparkles className="size-5 text-brand-green-600" />
          <span className="font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-green-600">
            Redesign with AI
          </span>
        </button>
      </div>

      <div className="hidden flex-col gap-4 lg:flex lg:h-full lg:w-1/3 lg:shrink-0">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded">
          {interior && <img src={interior.url} alt={`${title} — interior`} className="h-full w-full object-cover" />}
        </div>
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="relative w-1/2 overflow-hidden rounded">
            {detail && <img src={detail.url} alt={`${title} — detail`} className="h-full w-full object-cover" />}
          </div>
          <div className="relative w-1/2 overflow-hidden rounded bg-brand-secondary-500">
            {overlayCell && <img src={overlayCell.url} alt={`${title} — more`} className="h-full w-full object-cover" />}
            {remaining > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(9,9,9,0.5)]">
                <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-secondary-100">
                  View {images.length} Photos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
