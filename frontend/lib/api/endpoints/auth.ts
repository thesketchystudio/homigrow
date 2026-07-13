// lib/api/endpoints/auth.ts
// Typed functions for the /auth resource (05_API_Design.md). Components
// never call fetch directly — they go through these.

import { apiRequest } from "@/lib/api/client";
import type { OTPPurpose, UserRole } from "@/lib/enums";

export type SignupPayload = {
  phone: string;
  role: UserRole;
  full_name?: string;
  email: string;
  password: string;
};

export type SignupResponse = {
  user_id: string;
};

export type OTPRequestPayload = {
  email: string;
  purpose: OTPPurpose;
};

export type OTPVerifyPayload = {
  email: string;
  code: string;
  purpose: OTPPurpose;
};

export type LoginPayload = {
  phone_or_email: string;
  password: string;
};

export type UserOut = {
  id: string;
  phone: string;
  email?: string;
  full_name?: string;
  role: UserRole;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserOut;
};

export function signup(payload: SignupPayload): Promise<SignupResponse> {
  return apiRequest<SignupResponse>("/auth/signup", { method: "POST", body: payload });
}

export function requestOtp(payload: OTPRequestPayload): Promise<void> {
  return apiRequest<void>("/auth/otp/request", { method: "POST", body: payload });
}

export function verifyOtp(payload: OTPVerifyPayload): Promise<void> {
  return apiRequest<void>("/auth/otp/verify", { method: "POST", body: payload });
}

export function login(payload: LoginPayload): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/login", { method: "POST", body: payload });
}

export function refresh(): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/refresh", { method: "POST" });
}

export function logout(): Promise<void> {
  return apiRequest<void>("/auth/logout", { method: "POST" });
}
