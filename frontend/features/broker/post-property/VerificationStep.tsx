// features/broker/post-property/VerificationStep.tsx
// Step 4 (final) of the Post Property wizard (Figma "Curate Your Listing"
// > Verification). Three confirmation checkboxes gate the actual submit —
// createProperty -> media/video/JV-agreement uploads -> submitProperty,
// all orchestrated by PostPropertyWizard. This step has no schema of its
// own; the checkboxes are a client-side gate, not persisted fields.

"use client";

import { useState } from "react";
import { Check, Circle } from "lucide-react";
import { PostPropertyStepper } from "@/features/broker/post-property/PostPropertyStepper";
import { FreePlanUsageBar } from "@/features/broker/post-property/FreePlanUsageBar";
import { cn } from "@/lib/utils";

type VerificationStepProps = {
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

const CONFIRMATIONS = [
  "I confirm that I am the authorized owner or agent for this property.",
  "I verify that all information provided is accurate and truthful.",
  "I agree to Homigrow's listing terms and privacy policy.",
] as const;

function SummaryRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-full",
          done ? "bg-foreground text-background" : "border border-border text-transparent",
        )}
      >
        {done ? <Check size={10} /> : <Circle size={4} />}
      </span>
      <span className={cn("font-body text-[13px]", done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

export function VerificationStep({ onBack, onSubmit, isSubmitting }: VerificationStepProps) {
  const [checked, setChecked] = useState<boolean[]>([false, false, false]);
  const allChecked = checked.every(Boolean);

  const toggle = (index: number) => setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)));

  return (
    <div className="flex w-full flex-col gap-8">
      <h1 className="font-heading text-[48px] font-bold leading-15 text-brand-primary-600">Post your listing</h1>

      <PostPropertyStepper current="verification" />
      <FreePlanUsageBar />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <h2 className="font-heading text-[16px] font-bold text-foreground">Verify & Publish</h2>
          <div className="flex flex-col gap-4 rounded-md border border-border p-6">
            <p className="font-body text-[14px] text-muted-foreground">
              Review your listing details before publishing. Once submitted, our curation team will review and publish your property within 24–48 hours.
            </p>
            {CONFIRMATIONS.map((label, index) => (
              <label key={label} className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={checked[index]} onChange={() => toggle(index)} className="mt-1 size-4" />
                <span className="font-body text-[14px] text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="flex flex-col gap-3 rounded-md border border-border p-6 lg:sticky lg:top-6">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Listing Summary</h2>
            <SummaryRow label="Property Info" done />
            <SummaryRow label="Media" done />
            <SummaryRow label="Pricing" done />
            <SummaryRow label="Verification" done={allChecked} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center justify-center rounded-[4px] border border-brand-primary-100 bg-background px-12 py-4 font-heading text-[16px] font-bold text-brand-primary-400 disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!allChecked || isSubmitting}
          className="flex items-center justify-center rounded py-4 px-12 font-heading text-[16px] font-bold text-background disabled:opacity-60"
          style={{ backgroundImage: "linear-gradient(122.455deg, rgb(0, 0, 0) 0%, rgb(19, 27, 46) 100%)" }}
        >
          {isSubmitting ? "Submitting…" : "Submit Listing"}
        </button>
      </div>
    </div>
  );
}
