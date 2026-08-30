// features/broker/post-property/MediaStep.tsx
// Step 2 of the Post Property wizard — photos only. Video/drone/virtual
// tour (also in the Figma "post property" section) are deferred: the
// project's own docs already flag a full media pipeline (R2/Cloudflare
// Stream) as a separate future phase task (P3-T20, per
// backend/scripts/create_test_property.py's DEFAULT_MEDIA comment).
// Requires at least one photo before continuing — matches the backend's
// own submit-time rule (broker_property_service.submit_property 422s
// with MEDIA_REQUIRED otherwise), surfaced here instead of only after
// the final submit.

"use client";

import { useState } from "react";
import { PostPropertyStepper } from "@/features/broker/post-property/PostPropertyStepper";
import { PropertyMediaDropzone } from "@/features/broker/post-property/PropertyMediaDropzone";

type MediaStepProps = {
  images: File[];
  onChange: (images: File[]) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function MediaStep({ images, onChange, onBack, onContinue }: MediaStepProps) {
  const [touched, setTouched] = useState(false);
  const error = touched && images.length === 0 ? "Add at least one photo before continuing." : undefined;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Add photos</h1>
        <p className="font-body text-[16px] text-muted-foreground">The first photo you add becomes the listing&apos;s cover image.</p>
      </div>

      <PostPropertyStepper current="media" />

      <PropertyMediaDropzone images={images} onChange={onChange} error={error} />

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
            if (images.length > 0) onContinue();
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
