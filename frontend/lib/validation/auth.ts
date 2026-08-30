// lib/validation/auth.ts
// Zod schemas for the signup wizard, mirroring the backend Pydantic
// schemas in app/schemas/auth.py so the user sees identical validation
// client-side first. The server's zxcvbn score>=3 check is the source of
// truth for password strength — the client-side MIN_PASSWORD_STRENGTH_SCORE
// below only drives the local strength meter/gate, a bypassable UX nicety.

import { z } from "zod";
import { UserRole } from "@/lib/enums";

export const MIN_PASSWORD_STRENGTH_SCORE = 3;

export const roleSelectSchema = z.object({
  role: z.enum([UserRole.client, UserRole.broker]),
});
export type RoleSelectValues = z.infer<typeof roleSelectSchema>;

const phoneDigits = z
  .string()
  .trim()
  .min(10, "Enter a valid 10-digit phone number")
  .max(10, "Enter a valid 10-digit phone number")
  .regex(/^\d{10}$/, "Phone number must contain only digits");

export const signupFormSchema = z
  .object({
    full_name: z.string().trim().min(1, "Full name is required"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    phone: phoneDigits,
    role: z.enum([UserRole.client, UserRole.broker]),
    city: z.string().trim().min(1, "City is required"),
    state: z.string().trim().min(1, "State is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your password"),
    agree_to_terms: z.literal(true, { error: "You must agree to continue" }),
    // Broker-only "Verification Details" fields — required when
    // role=broker (enforced below via superRefine), left blank/unused
    // for role=client.
    company_name: z.string().trim().optional(),
    rera_number: z.string().trim().optional(),
    service_area: z.string().trim().optional(),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .superRefine((values, ctx) => {
    if (values.role !== UserRole.broker) return;

    if (!values.company_name) {
      ctx.addIssue({ code: "custom", message: "Agency / firm name is required", path: ["company_name"] });
    }
    if (!values.rera_number) {
      ctx.addIssue({ code: "custom", message: "License / RERA number is required", path: ["rera_number"] });
    } else if (values.rera_number.length < 5 || values.rera_number.length > 50) {
      ctx.addIssue({
        code: "custom",
        message: "RERA number must be between 5 and 50 characters",
        path: ["rera_number"],
      });
    }
    if (!values.service_area) {
      ctx.addIssue({ code: "custom", message: "City of operation is required", path: ["service_area"] });
    }
  });
export type SignupFormValues = z.infer<typeof signupFormSchema>;

export const otpVerifySchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});
export type OtpVerifyValues = z.infer<typeof otpVerifySchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
