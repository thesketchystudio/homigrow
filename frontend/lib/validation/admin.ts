// lib/validation/admin.ts
// Zod schemas for admin portal forms: the admin sign-in, and the free-text
// reasons a moderator must give when rejecting a listing or suspending an
// account (mirroring the backend's ModerateRequest/SuspendRequest limits).

import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().min(1, "Enter your admin email.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
export type AdminLoginValues = z.infer<typeof adminLoginSchema>;

export const REJECTION_NOTE_MAX = 1000;
export const SUSPENSION_REASON_MAX = 500;
