// features/auth/BrokerDocumentUploadStep.tsx
// Step 3 of 4 (a broker's Phase A) — "Broker verification" document
// upload (Figma: node 431:280/431:281, "Document"). Figma labels this
// screen "Step 3 of 3", not accounting for the shared OTP-verify screen
// in between form submission and this one — same class of step-count
// authoring gap already documented for the client's Phase B, so this
// renders the real step count (4) instead of Figma's static label.

"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { submitVerificationDocuments } from "@/lib/api/endpoints/brokers";
import type { VerificationStatus } from "@/lib/enums";
import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { BrokerDocumentDropzone } from "@/features/auth/BrokerDocumentDropzone";

const ACCEPTED_TYPES = "application/pdf,image/jpeg,image/png";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

type BrokerDocumentUploadStepProps = {
  onSubmitted: (status: VerificationStatus) => void;
  onExit: () => void;
};

export function BrokerDocumentUploadStep({ onSubmitted, onExit }: BrokerDocumentUploadStepProps) {
  const [reraCertificate, setReraCertificate] = useState<File | null>(null);
  const [governmentId, setGovernmentId] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: () => submitVerificationDocuments(reraCertificate!, governmentId!),
    onSuccess: (data) => onSubmitted(data.verification_status),
  });

  const validateAndSet = (file: File, setter: (file: File) => void) => {
    if (file.size > MAX_SIZE_BYTES) {
      setFileError("File must be 5 MB or smaller.");
      return;
    }
    setFileError(null);
    setter(file);
  };

  const canSubmit = Boolean(reraCertificate && governmentId) && !submitMutation.isPending;
  const apiError = submitMutation.error as ApiError | undefined;

  return (
    <div className="flex w-full flex-col gap-10">
      <AuthProgressBar step={3} totalSteps={4} phase="onboarding" />

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[36px] font-medium leading-[44px] text-brand-primary-700">
          Broker verification
        </h1>
        <p className="font-body text-[16px] leading-[26px] text-brand-secondary-900">
          Upload your documents. Our team reviews within 24–48 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <BrokerDocumentDropzone
          label="License / RERA Certificate"
          helperText="PDF, JPG or PNG · Max 5 MB"
          accept={ACCEPTED_TYPES}
          file={reraCertificate}
          onFileSelected={(file) => validateAndSet(file, setReraCertificate)}
        />
        <BrokerDocumentDropzone
          label="Government ID Proof"
          helperText="Passport, Aadhaar, or Driver's License"
          accept={ACCEPTED_TYPES}
          file={governmentId}
          onFileSelected={(file) => validateAndSet(file, setGovernmentId)}
        />
      </div>

      {(fileError || (apiError && !apiError.fields)) && (
        <p className="text-[14px] text-destructive">{fileError ?? apiError?.message}</p>
      )}

      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="flex flex-1 items-center justify-center rounded-[4px] border border-brand-primary-100 bg-background p-[17px] font-heading text-[16px] font-bold text-brand-primary-400"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => submitMutation.mutate()}
          disabled={!canSubmit}
          className="ml-4 flex flex-1 items-center justify-center gap-3 rounded-[4px] bg-brand-primary-500 py-4 font-heading text-[16px] font-bold text-background disabled:opacity-60"
        >
          {submitMutation.isPending ? "Submitting…" : "Submit for review →"}
        </button>
      </div>
    </div>
  );
}
