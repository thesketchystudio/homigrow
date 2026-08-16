// lib/api/endpoints/brokers.ts
// Typed functions for the /brokers resource.

import { apiRequestMultipart } from "@/lib/api/client";
import type { VerificationStatus } from "@/lib/enums";

export type BrokerVerificationOut = {
  verification_status: VerificationStatus;
};

export function submitVerificationDocuments(
  reraCertificate: File,
  governmentId: File,
): Promise<BrokerVerificationOut> {
  const formData = new FormData();
  formData.append("rera_certificate", reraCertificate);
  formData.append("government_id", governmentId);
  return apiRequestMultipart<BrokerVerificationOut>("/brokers/me/verification-documents", formData);
}
