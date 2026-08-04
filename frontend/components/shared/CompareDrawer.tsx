// components/shared/CompareDrawer.tsx
// Persistent floating tray (Figma node 133:3227 "Compare Drawer (Floating)",
// exact colors/fonts pulled via get_design_context) shown across every
// client page once 1+ property is queued for comparison (10_Phase_3.md
// P3-T42). Not routed through the shared Modal — Modal's Dialog/Drawer
// variants are for user-triggered open/close with a backdrop, not an
// always-mounted element that should sit quietly out of the way of
// whatever else is on the page.

"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { useCompareProperties } from "@/lib/hooks/useCompareProperties";
import { useCompareStore } from "@/lib/stores/compare";

function coverImageUrl(media: { url: string; is_cover: boolean }[]): string | undefined {
  return media.find((item) => item.is_cover)?.url ?? media[0]?.url;
}

export function CompareDrawer() {
  const router = useRouter();
  const ids = useCompareStore((state) => state.ids);
  const clear = useCompareStore((state) => state.clear);
  const { data } = useCompareProperties(ids);

  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[rgba(35,35,35,0.95)] p-6 shadow-[0px_12px_40px_0px_rgba(43,52,55,0.05)] backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            {ids.map((id, index) => {
              const property = data?.items.find((item) => item.id === id);
              const imageUrl = property ? coverImageUrl(property.media) : undefined;
              return (
                <div
                  key={id}
                  className="size-16 shrink-0 overflow-hidden rounded-lg border-2 border-[#2b3437] bg-brand-primary-400"
                  style={{ marginLeft: index === 0 ? 0 : -16 }}
                >
                  {imageUrl && <img src={imageUrl} alt="" className="size-full object-cover" />}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-background text-[16px] font-bold">
              {ids.length} {ids.length === 1 ? "Property" : "Properties"} Selected
            </span>
            <span className="font-body text-[14px] text-background/60">Compare technical specs and layouts</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(`/compare?ids=${ids.join(",")}`)}
            disabled={ids.length < 2}
            className="bg-background text-brand-primary-400 font-heading rounded-xl px-8 py-3 text-[16px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Compare Now
          </button>
          <button type="button" onClick={clear} aria-label="Clear comparison" className="text-background/70 hover:text-background p-1">
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
