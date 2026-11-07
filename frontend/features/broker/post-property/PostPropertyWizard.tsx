// features/broker/post-property/PostPropertyWizard.tsx
// Orchestrates the 4-step Post Property flow as local component state.
// Steps 1-3 (Info, Media, Pricing) only collect data client-side —
// nothing is persisted until Step 4's (Verification) submit, which fires
// createProperty -> media uploads -> video upload -> JV agreement upload ->
// submitProperty in sequence. See PropertyCreateInput's comment in
// lib/api/endpoints/properties.ts for why creation can't happen any
// earlier (Property.price is NOT NULL with a `price > 0` check).
// virtual_tour_url is still never collected — unrelated to video upload,
// which now goes through uploadPropertyVideo (see MediaStep).
// The listing created on submit is remembered together with which uploads
// already finished, so a retry after a failed upload continues on the same
// draft instead of creating another one. Editing any step discards it, since
// the saved listing would no longer match what the broker entered.
// Step 1's "Save as Draft" is a lighter, browser-local stand-in for a real
// resumable draft — see lib/postPropertyDraft.ts for why.

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { createProperty, submitProperty, uploadJvAgreement, uploadPropertyMedia, uploadPropertyVideo } from "@/lib/api/endpoints/properties";
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [jvAgreementFile, setJvAgreementFile] = useState<File | null>(null);

  // Only allows jumping back to an already-completed step — a later step
  // (e.g. Pricing) reads an earlier one's data with a non-null assertion,
  // so jumping forward to a step never reached yet would crash.
  const goToStep = (target: WizardStep) => {
    if (STEP_ORDER.indexOf(target) < STEP_ORDER.indexOf(step)) setStep(target);
  };

  const draftRef = useRef<{ id: string; photosUploaded: number; videoUploaded: boolean; jvUploaded: boolean } | null>(null);

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!info || !pricing) throw new Error("Missing property info or pricing");

      if (!draftRef.current) {
        const property = await createProperty({ ...info, ...pricing });
        draftRef.current = { id: property.id, photosUploaded: 0, videoUploaded: false, jvUploaded: false };
      }
      const draft = draftRef.current;

      const photos = [...heroImages, ...interiorImages, ...floorPlanImages].slice(draft.photosUploaded);
      if (photos.length > 0) {
        await uploadPropertyMedia(draft.id, photos, (count) => {
          draft.photosUploaded += count;
        });
      }
      if (videoFile && !draft.videoUploaded) {
        await uploadPropertyVideo(draft.id, videoFile);
        draft.videoUploaded = true;
      }
      if (info.is_jv_property && jvAgreementFile && !draft.jvUploaded) {
        await uploadJvAgreement(draft.id, jvAgreementFile);
        draft.jvUploaded = true;
      }

      return submitProperty(draft.id);
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
          draftRef.current = null;
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
        videoFile={videoFile}
        onVideoFileChange={setVideoFile}
        onBack={() => setStep("info")}
        onContinue={() => {
          draftRef.current = null;
          setStep("pricing");
        }}
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
          draftRef.current = null;
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
