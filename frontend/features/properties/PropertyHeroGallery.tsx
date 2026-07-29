// features/properties/PropertyHeroGallery.tsx
// Asymmetric bento-grid hero gallery for the Property Details screen
// (Figma node 31:1847). Renders whatever photos the property actually has
// (falls back gracefully below 4) — the "Redesign with AI" button shown in
// Figma is intentionally not built (10_Phase_3.md P3-T04's deferred list).

import type { PropertyMediaRead } from "@/lib/api/endpoints/properties";

type PropertyHeroGalleryProps = {
  media: PropertyMediaRead[];
  title: string;
};

export function PropertyHeroGallery({ media, title }: PropertyHeroGalleryProps) {
  const images = [...media].sort((a, b) => a.position - b.position);
  const [hero, interior, detail] = images;
  const remaining = Math.max(images.length - 3, 0);

  return (
    <div className="flex flex-col gap-4 lg:h-[716px] lg:flex-row">
      <div className="relative h-[350px] shrink-0 overflow-hidden rounded lg:h-full lg:w-2/3 lg:flex-1">
        {hero && <img src={hero.url} alt={title} className="h-full w-full object-cover" />}
        <div className="absolute bottom-7 left-8 rounded bg-brand-green-500 px-4 py-2">
          <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-primary-600">
            Featured Architecture
          </p>
        </div>
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
            {remaining > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-primary-600">
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
