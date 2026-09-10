// features/broker/post-property/PostPropertyWizard.tsx
// Orchestrates the 4-step Post Property flow as local component state.
// Steps 1-3 (Info, Media, Pricing) only collect data client-side —
// nothing is persisted until Step 4's (Verification) submit, which fires
// createProperty -> media uploads -> JV agreement upload ->
// submitProperty in sequence. See PropertyCreateInput's comment in
// lib/api/endpoints/properties.ts for why creation can't happen any
// earlier (Property.price is NOT NULL with a `price > 0` check).
// Video/drone/virtual-tour collection is on hold (see MediaStep) — the
// wizard no longer sets virtual_tour_url or calls uploadPropertyVideo.
// Step 1's "Save as Draft" is a lighter, browser-local stand-in for a real
// resumable draft — see lib/postPropertyDraft.ts for why.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { createProperty, submitProperty, uploadJvAgreement, uploadPropertyMedia } from "@/lib/api/endpoints/properties";
import { toast } from "@/lib/toast";
import { PropertyInfoStep } from "@/features/broker/post-property/PropertyInfoStep";
import { MediaStep } from "@/features/broker/post-property/MediaStep";
import { PricingStep } from "@/features/broker/post-property/PricingStep";
import { VerificationStep } from "@/features/broker/post-property/VerificationStep";
import type { PropertyInfoValues, PropertyPricingValues } from "@/lib/validation/postProperty";
import { clearInfoDraft, loadInfoDraft } from "@/lib/postPropertyDraft";

type WizardStep = "info" | "media" | "pricing" | "verification";

const STEP_ORDER: WizardStep[] = ["info", "media", "pricing", "verification"];

export function PostPropertyWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("info");
  const [info, setInfo] = useState<PropertyInfoValues | null>(null);
  const [infoDraft] = useState<Partial<PropertyInfoValues> | null>(() => loadInfoDraft());
  const [pricing, setPricing] = useState<PropertyPricingValues | null>(null);

  const [heroImages, setHeroImages] = useState<File[]>([]);
  const [interiorImages, setInteriorImages] = useState<File[]>([]);
  const [floorPlanImages, setFloorPlanImages] = useState<File[]>([]);
  const [jvAgreementFile, setJvAgreementFile] = useState<File | null>(null);

  // Only allows jumping back to an already-completed step — a later step
  // (e.g. Pricing) reads an earlier one's data with a non-null assertion,
  // so jumping forward to a step never reached yet would crash.
  const goToStep = (target: WizardStep) => {
    if (STEP_ORDER.indexOf(target) < STEP_ORDER.indexOf(step)) setStep(target);
  };

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!info || !pricing) throw new Error("Missing property info or pricing");

      const property = await createProperty({ ...info, ...pricing });

      const photos = [...heroImages, ...interiorImages, ...floorPlanImages];
      if (photos.length > 0) {
        await uploadPropertyMedia(property.id, photos);
      }
      if (info.is_jv_property && jvAgreementFile) {
        await uploadJvAgreement(property.id, jvAgreementFile);
      }

      return submitProperty(property.id);
    },
    onSuccess: () => {
      clearInfoDraft();
      toast.success("Listing submitted for review.");
      router.push("/broker/dashboard");
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });

  if (step === "info") {
    return (
      <PropertyInfoStep
        defaultValues={info ?? infoDraft}
        jvAgreementFile={jvAgreementFile}
        onJvAgreementFileChange={setJvAgreementFile}
        onContinue={(values) => {
          setInfo(values);
          setStep("media");
        }}
        onStepSelect={goToStep}
      />
    );
  }

  if (step === "media") {
    return (
      <MediaStep
        heroImages={heroImages}
        onHeroImagesChange={setHeroImages}
        interiorImages={interiorImages}
        onInteriorImagesChange={setInteriorImages}
        floorPlanImages={floorPlanImages}
        onFloorPlanImagesChange={setFloorPlanImages}
        onBack={() => setStep("info")}
        onContinue={() => setStep("pricing")}
        onStepSelect={goToStep}
      />
    );
  }

  if (step === "pricing") {
    return (
      <PricingStep
        listingType={info!.listing_type}
        defaultValues={pricing}
        onBack={() => setStep("media")}
        onContinue={(values) => {
          setPricing(values);
          setStep("verification");
        }}
        onStepSelect={goToStep}
      />
    );
  }

  return (
    <VerificationStep
      onBack={() => setStep("pricing")}
      onSubmit={() => postMutation.mutate()}
      isSubmitting={postMutation.isPending}
      onStepSelect={goToStep}
    />
  );
}
