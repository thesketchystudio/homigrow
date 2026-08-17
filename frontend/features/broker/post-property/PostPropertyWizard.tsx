// features/broker/post-property/PostPropertyWizard.tsx
// Orchestrates the 3-step Post Property flow as local component state,
// mirroring SignupWizard.tsx's skeleton. Steps 1 (Info) and 2 (Media)
// only collect data client-side — nothing is persisted until Step 3's
// submit, which fires createProperty -> uploadPropertyMedia ->
// submitProperty in sequence. See PropertyCreateInput's comment in
// lib/api/endpoints/properties.ts for why creation can't happen any
// earlier (Property.price is NOT NULL with a `price > 0` check).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { createProperty, submitProperty, uploadPropertyMedia } from "@/lib/api/endpoints/properties";
import { toast } from "@/lib/toast";
import { PropertyInfoStep } from "@/features/broker/post-property/PropertyInfoStep";
import { MediaStep } from "@/features/broker/post-property/MediaStep";
import { PricingStep } from "@/features/broker/post-property/PricingStep";
import type { PropertyInfoValues, PropertyPricingValues } from "@/lib/validation/postProperty";

type WizardStep = "info" | "media" | "pricing";

export function PostPropertyWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("info");
  const [info, setInfo] = useState<PropertyInfoValues | null>(null);
  const [images, setImages] = useState<File[]>([]);

  const postMutation = useMutation({
    mutationFn: async (pricing: PropertyPricingValues) => {
      if (!info) throw new Error("Missing property info");
      const property = await createProperty({ ...info, ...pricing });
      if (images.length > 0) {
        await uploadPropertyMedia(property.id, images);
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
        onContinue={(values) => {
          setInfo(values);
          setStep("media");
        }}
      />
    );
  }

  if (step === "media") {
    return <MediaStep images={images} onChange={setImages} onBack={() => setStep("info")} onContinue={() => setStep("pricing")} />;
  }

  return (
    <PricingStep
      listingType={info!.listing_type}
      onBack={() => setStep("media")}
      onSubmit={(pricing) => postMutation.mutate(pricing)}
      isSubmitting={postMutation.isPending}
    />
  );
}
