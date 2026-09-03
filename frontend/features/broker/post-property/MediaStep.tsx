// features/broker/post-property/MediaStep.tsx
// Step 2 of the Post Property wizard (Figma "Curate Your Listing" > Media).
// Hero/Interior/Floor Plans reuse the generalized PropertyMediaDropzone;
// Property Video and Drone Footage go through Supabase Storage directly
// (no Cloudflare Stream yet, per the user's call this session) via the
// same dropzone with a video accept type and single-file semantics.
// Floor plans are uploaded as regular gallery images (JPG/PNG/WEBP) rather
// than the PDF/SVG Figma shows — the backend's image upload only validates
// those three image types, and adding a parallel PDF pathway just for this
// one box isn't worth it yet.

"use client";

import { useState } from "react";
import { Circle, CircleCheck } from "lucide-react";
import { PostPropertyStepper } from "@/features/broker/post-property/PostPropertyStepper";
import { FreePlanUsageBar } from "@/features/broker/post-property/FreePlanUsageBar";
import { PropertyMediaDropzone } from "@/features/broker/post-property/PropertyMediaDropzone";

type MediaStepProps = {
  heroImages: File[];
  onHeroImagesChange: (images: File[]) => void;
  interiorImages: File[];
  onInteriorImagesChange: (images: File[]) => void;
  floorPlanImages: File[];
  onFloorPlanImagesChange: (images: File[]) => void;
  videoFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  droneFile: File | null;
  onDroneFileChange: (file: File | null) => void;
  virtualTourUrl: string;
  onVirtualTourUrlChange: (url: string) => void;
  onBack: () => void;
  onContinue: () => void;
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
  videoFile,
  onVideoFileChange,
  droneFile,
  onDroneFileChange,
  virtualTourUrl,
  onVirtualTourUrlChange,
  onBack,
  onContinue,
}: MediaStepProps) {
  const [touched, setTouched] = useState(false);
  const hasCoverPhoto = heroImages.length > 0 || interiorImages.length > 0;
  const error = touched && !hasCoverPhoto ? "Add at least one photo before continuing." : undefined;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Curate Your Listing</h1>
        <p className="font-body text-[16px] text-muted-foreground">Add photos, floor plans, and video to bring your listing to life.</p>
      </div>

      <PostPropertyStepper current="media" />
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
              error={error}
              title="Hero Architectural Shot"
              helperText="Drag & drop or browse — JPG, PNG, WEBP — Max 20MB each"
            />
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Interior Photography</h2>
            <PropertyMediaDropzone
              images={interiorImages}
              onChange={onInteriorImagesChange}
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
            <h2 className="font-heading text-[16px] font-bold text-foreground">Video & Virtual Tour</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Property Video</span>
                <PropertyMediaDropzone
                  images={videoFile ? [videoFile] : []}
                  onChange={(files) => onVideoFileChange(files[files.length - 1] ?? null)}
                  title="Upload Video"
                  helperText="MP4, MOV — Max 100MB"
                  accept="video/mp4,video/quicktime"
                  showPreviews={false}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Drone Footage</span>
                <PropertyMediaDropzone
                  images={droneFile ? [droneFile] : []}
                  onChange={(files) => onDroneFileChange(files[files.length - 1] ?? null)}
                  title="Aerial / Drone Video"
                  helperText="MP4, MOV — Max 100MB — Exterior aerial view"
                  accept="video/mp4,video/quicktime"
                  showPreviews={false}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-body font-bold text-[12px] leading-[18px] text-brand-primary-100">360° Virtual Tour Link</span>
              <input
                value={virtualTourUrl}
                onChange={(event) => onVirtualTourUrlChange(event.target.value)}
                placeholder="https://my.matterport.com/show/?m=..."
                className="w-full border-b border-foreground bg-transparent pb-[5px] pt-1 font-heading text-[20px] leading-[28px] text-foreground outline-none placeholder:text-brand-secondary-700 focus:border-brand-green-600"
              />
              <p className="font-body text-[12px] text-muted-foreground">Compatible with Matterport, Kuula, and other 360° tour platforms.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="flex flex-col gap-3 rounded-md border border-border p-6 lg:sticky lg:top-6">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Media Checklist</h2>
            <ChecklistRow label="Hero exterior shot" done={heroImages.length > 0} />
            <ChecklistRow label="Interior photos (3+)" done={interiorImages.length >= 3} />
            <ChecklistRow label="Floor plan uploaded" done={floorPlanImages.length > 0} />
            <ChecklistRow label="Property video" done={videoFile !== null} />
            <ChecklistRow label="Virtual tour link" done={virtualTourUrl.trim().length > 0} />
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
            if (hasCoverPhoto) onContinue();
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
