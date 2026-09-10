// features/broker/post-property/MediaStep.tsx
// Step 2 of the Post Property wizard (Figma "Curate Your Listing" > Media).
// Hero/Interior/Floor Plans reuse the generalized PropertyMediaDropzone,
// uploaded to Supabase Storage on submit. Video/Drone footage and the 360°
// virtual tour link render as a "Coming soon" placeholder — real uploads
// for those are on hold until Cloudflare (Stream for video) is wired up,
// rather than shipping them through Supabase Storage like the photos.
// Floor plans are uploaded as regular gallery images (JPG/PNG/WEBP) rather
// than the PDF/SVG Figma shows — the backend's image upload only validates
// those three image types, and adding a parallel PDF pathway just for this
// one box isn't worth it yet.
// Hero caps at 5 photos (PropertyMediaDropzone's maxFiles); Interior has no
// cap yet but requires at least 3 — the only gate on Continue, since Hero's
// cap alone doesn't guarantee a usable gallery. Floor Plans has neither.

"use client";

import { useState } from "react";
import { Circle, CircleCheck, Video } from "lucide-react";
import { PostPropertyStepper, type StepKey } from "@/features/broker/post-property/PostPropertyStepper";
import { FreePlanUsageBar } from "@/features/broker/post-property/FreePlanUsageBar";
import { PropertyMediaDropzone } from "@/features/broker/post-property/PropertyMediaDropzone";

type MediaStepProps = {
  heroImages: File[];
  onHeroImagesChange: (images: File[]) => void;
  interiorImages: File[];
  onInteriorImagesChange: (images: File[]) => void;
  floorPlanImages: File[];
  onFloorPlanImagesChange: (images: File[]) => void;
  onBack: () => void;
  onContinue: () => void;
  onStepSelect?: (step: StepKey) => void;
};

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {done ? <CircleCheck size={16} className="text-brand-green-600" /> : <Circle size={16} className="text-muted-foreground" />}
      <span className={done ? "font-body text-[13px] text-foreground" : "font-body text-[13px] text-muted-foreground"}>{label}</span>
    </div>
  );
}

export function MediaStep({
  heroImages,
  onHeroImagesChange,
  interiorImages,
  onInteriorImagesChange,
  floorPlanImages,
  onFloorPlanImagesChange,
  onBack,
  onContinue,
  onStepSelect,
}: MediaStepProps) {
  const [touched, setTouched] = useState(false);
  const hasMinInteriorPhotos = interiorImages.length >= 3;
  const interiorError = touched && !hasMinInteriorPhotos ? "Add at least 3 interior photos before continuing." : undefined;

  return (
    <div className="flex w-full flex-col gap-8">
      <h1 className="font-heading text-[48px] font-bold leading-15 text-brand-primary-600">Post your listing</h1>

      <PostPropertyStepper current="media" onStepSelect={onStepSelect} />
      <FreePlanUsageBar />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-10 lg:col-span-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[16px] font-bold text-foreground">Hero Photography</h2>
              <span className="font-body text-[12px] text-muted-foreground">{heroImages.length}/5 Photos</span>
            </div>
            <PropertyMediaDropzone
              images={heroImages}
              onChange={onHeroImagesChange}
              title="Hero Architectural Shot"
              helperText="Drag & drop or browse — JPG, PNG, WEBP — Max 20MB each"
              maxFiles={5}
            />
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Interior Photography</h2>
            <PropertyMediaDropzone
              images={interiorImages}
              onChange={onInteriorImagesChange}
              error={interiorError}
              title="Interior Shots"
              helperText="Living spaces, kitchen, bathrooms — Min. 3 photos"
            />
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Floor Plans & Blueprints</h2>
            <PropertyMediaDropzone
              images={floorPlanImages}
              onChange={onFloorPlanImagesChange}
              title="Upload Floor Plan"
              helperText="JPG, PNG, or WEBP — Detailed layout preferred"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[16px] font-bold text-foreground">Video & Virtual Tour</h2>
              <span className="font-body text-[11px] font-bold uppercase tracking-[1px] text-muted-foreground">Coming soon</span>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-lg bg-brand-secondary-400 py-10 text-center">
              <Video className="size-6 text-brand-primary-300" />
              <p className="font-heading text-[14px] font-bold text-brand-primary-600">Coming soon</p>
              <p className="max-w-sm font-body text-[12px] text-brand-primary-300">
                Property video, drone footage, and 360° virtual tour uploads launch once our Cloudflare-powered video hosting is ready.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="flex flex-col gap-3 rounded-md border border-border p-6 lg:sticky lg:top-6">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Media Checklist</h2>
            <ChecklistRow label="Hero exterior shot" done={heroImages.length > 0} />
            <ChecklistRow label="Interior photos (3+)" done={interiorImages.length >= 3} />
            <ChecklistRow label="Floor plan uploaded" done={floorPlanImages.length > 0} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center rounded-[4px] border border-brand-primary-100 bg-background px-12 py-4 font-heading text-[16px] font-bold text-brand-primary-400"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            setTouched(true);
            if (hasMinInteriorPhotos) onContinue();
          }}
          className="flex items-center justify-center rounded py-4 px-12 font-heading text-[16px] font-bold text-background"
          style={{ backgroundImage: "linear-gradient(122.455deg, rgb(0, 0, 0) 0%, rgb(19, 27, 46) 100%)" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
