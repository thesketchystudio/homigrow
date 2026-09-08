// features/broker/listings/BrokerPropertyGallery.tsx
// Image carousel for the broker Property Detail page's hero (Figma
// "Real Estate Broker Portal > Property Detail", node 177:3345): an
// embla carousel with a status pill overlay, prev/next buttons overlaid on
// the image edges, and dot indicators — the shadcn Carousel primitive
// positions its own prev/next buttons outside the frame by default, so
// this renders its own buttons directly against the carousel api instead.

"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import StatusPill, { propertyStatusPillMap } from "@/components/shared/StatusPill";
import { cn } from "@/lib/utils";
import type { PropertyMediaRead } from "@/lib/api/endpoints/properties";
import type { PropertyStatus } from "@/lib/enums";

export function BrokerPropertyGallery({
  media,
  title,
  status,
}: {
  media: PropertyMediaRead[];
  title: string;
  status: PropertyStatus;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const images = [...media].sort((a, b) => a.position - b.position);

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-brand-secondary-100">
      {images.length === 0 ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-brand-primary-300">
          <ImageOff className="size-8" />
          <span className="font-body text-[14px]">No photos yet</span>
        </div>
      ) : (
        <Carousel setApi={setApi} className="h-full w-full">
          <CarouselContent className="ml-0 h-[400px]">
            {images.map((item) => (
              <CarouselItem key={item.id} className="h-full pl-0">
                <img src={item.url} alt={title} className="size-full object-cover" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}

      <div className="absolute left-4 top-4">
        <StatusPill value={status} map={propertyStatusPillMap} />
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => api?.scrollPrev()}
            className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
          >
            <ChevronLeft className="size-5 text-brand-primary-400" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => api?.scrollNext()}
            className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
          >
            <ChevronRight className="size-5 text-brand-primary-400" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {images.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to photo ${index + 1}`}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === selected ? "w-6 bg-white" : "w-1.5 bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
