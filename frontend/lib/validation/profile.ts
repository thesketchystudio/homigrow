// lib/validation/profile.ts
// Zod schemas for the Profile & Settings section. Mirrors the backend's
// UserUpdateRequest/PasswordChangeRequest (app/schemas/users.py) so the
// user sees identical validation client-side first.

import { z } from "zod";

export const accountFormSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});
export type AccountFormValues = z.infer<typeof accountFormSchema>;

const channelSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
});

export const notificationsFormSchema = z.object({
  property_match_alerts: channelSchema,
  market_volatility: channelSchema,
  private_viewings: channelSchema,
  offer_status: channelSchema,
  emi_reminders: channelSchema,
});
export type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
