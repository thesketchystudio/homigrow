// features/broker/post-property/PostPropertyWizard.tsx
// Orchestrates the 4-step Post Property flow as local component state.
// Steps 1-3 (Info, Media, Pricing) only collect data client-side —
// nothing is persisted until Step 4's (Verification) submit, which fires
// createProperty -> media/video uploads -> JV agreement upload ->
// submitProperty in sequence. See PropertyCreateInput's comment in
// lib/api/endpoints/properties.ts for why creation can't happen any
// earlier (Property.price is NOT NULL with a `price > 0` check).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  createProperty,
  submitProperty,
  uploadJvAgreement,
  uploadPropertyMedia,
  uploadPropertyVideo,
} from "@/lib/api/endpoints/properties";
import { toast } from "@/lib/toast";
import { PropertyInfoStep } from "@/features/broker/post-property/PropertyInfoStep";
import { MediaStep } from "@/features/broker/post-property/MediaStep";
import { PricingStep } from "@/features/broker/post-property/PricingStep";
import { VerificationStep } from "@/features/broker/post-property/VerificationStep";
import type { PropertyInfoValues, PropertyPricingValues } from "@/lib/validation/postProperty";

type WizardStep = "info" | "media" | "pricing" | "verification";

export function PostPropertyWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("info");
  const [info, setInfo] = useState<PropertyInfoValues | null>(null);
  const [pricing, setPricing] = useState<PropertyPricingValues | null>(null);

  const [heroImages, setHeroImages] = useState<File[]>([]);
  const [interiorImages, setInteriorImages] = useState<File[]>([]);
  const [floorPlanImages, setFloorPlanImages] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [droneFile, setDroneFile] = useState<File | null>(null);
  const [virtualTourUrl, setVirtualTourUrl] = useState("");
  const [jvAgreementFile, setJvAgreementFile] = useState<File | null>(null);

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!info || !pricing) throw new Error("Missing property info or pricing");

      const property = await createProperty({
        ...info,
        ...pricing,
        virtual_tour_url: virtualTourUrl.trim() || undefined,
      });

      const photos = [...heroImages, ...interiorImages, ...floorPlanImages];
      if (photos.length > 0) {
        await uploadPropertyMedia(property.id, photos);
      }
      if (videoFile) await uploadPropertyVideo(property.id, videoFile);
      if (droneFile) await uploadPropertyVideo(property.id, droneFile);
      if (info.is_jv_property && jvAgreementFile) {
        await uploadJvAgreement(property.id, jvAgreementFile);
      }

      return submitProperty(property.id);
    },
    onSuccess: () => {
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
        defaultValues={info}
        jvAgreementFile={jvAgreementFile}
        onJvAgreementFileChange={setJvAgreementFile}
        onContinue={(values) => {
          setInfo(values);
          setStep("media");
        }}
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
        droneFile={droneFile}
        onDroneFileChange={setDroneFile}
        virtualTourUrl={virtualTourUrl}
        onVirtualTourUrlChange={setVirtualTourUrl}
        onBack={() => setStep("info")}
        onContinue={() => setStep("pricing")}
      />
    );
  }

  if (step === "pricing") {
    return (
      <PricingStep
        listingType={info!.listing_type}
        onBack={() => setStep("media")}
        onContinue={(values) => {
          setPricing(values);
          setStep("verification");
        }}
      />
    );
  }

  return (
    <VerificationStep
      onBack={() => setStep("pricing")}
      onSubmit={() => postMutation.mutate()}
      isSubmitting={postMutation.isPending}
    />
  );
}
