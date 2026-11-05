// features/auth/OtpVerifyStep.tsx
// Step 3 of 3 — "Verify your identity" (Figma: node 418:874/877/878).
// Six-digit code entry; distinguishes OTP_INVALID vs OTP_EXPIRED so the
// two Figma error states render correctly.

"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, RotateCcw } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ApiError } from "@/lib/api/client";
import { requestOtp, verifyOtp, type TokenResponse } from "@/lib/api/endpoints/auth";
import { OTPPurpose } from "@/lib/enums";
import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { cn } from "@/lib/utils";

// Matches the backend's per-email resend cooldown (OTP_RESEND_COOLDOWN_SECONDS);
// the button counts it down so users aren't left clicking into a 429.
const RESEND_COOLDOWN_SECONDS = 60;

type OtpVerifyStepProps = {
  email: string;
  onVerified: (session: TokenResponse) => void;
  totalSteps?: number;
  // The signup wizard shows its progress bar; the login screen reuses this
  // step for accounts that never finished verifying and has no such bar.
  showProgress?: boolean;
};

export function OtpVerifyStep({ email, onVerified, totalSteps = 3, showProgress = true }: OtpVerifyStepProps) {
  const [code, setCode] = useState("");
  // A code was just sent when this step mounted (signup or login redirect).
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const verifyMutation = useMutation({
    mutationFn: () => verifyOtp({ email, code, purpose: OTPPurpose.signup }),
    // This step only ever verifies the signup purpose, which the backend
    // always answers with a TokenResponse (never the bare 204 other
    // purposes get) — see auth_service.verify_otp.
    onSuccess: (data) => onVerified(data as TokenResponse),
  });

  const resendMutation = useMutation({
    mutationFn: () => requestOtp({ email, purpose: OTPPurpose.signup }),
    onSuccess: () => {
      setCode("");
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    },
  });
  const resendError = resendMutation.error as ApiError | null;

  const error = verifyMutation.error as ApiError | undefined;
  const errorMessage =
    resendError?.message ??
    (error?.status === 410
      ? "This OTP has expired. Request a new one below."
      : error?.status === 401
        ? "Incorrect OTP. Please try again."
        : error?.message);

  return (
    <div className="flex w-full flex-col gap-8">
      {showProgress && <AuthProgressBar step={3} totalSteps={totalSteps} phase="onboarding" />}

      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-0">
          <h1 className="font-heading text-[34px] font-bold leading-[51px] tracking-[-0.5px] text-brand-primary-700">
            Verify your identity
          </h1>
          <p className="font-heading text-[16px] text-brand-primary-400">
            {"We sent a 6-digit code to "}
            <span className="font-bold">{email}.</span>
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={cn(
                    "h-[60px] w-[52px] rounded border-[1.5px] font-heading text-[24px] font-bold",
                    errorMessage ? "border-destructive" : "border-brand-secondary-700",
                  )}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded border border-destructive/20 bg-destructive/[0.06] px-[13px] py-[11px]">
              <AlertCircle size={18} className="text-destructive" />
              <p className="font-heading text-[16px] text-destructive">{errorMessage}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            resendMutation.reset();
            verifyMutation.mutate();
          }}
          disabled={code.length !== 6 || verifyMutation.isPending}
          className="flex w-full max-w-[420px] items-center justify-center rounded bg-gradient-to-r from-black to-[#131b2e] py-4 font-heading text-[16px] font-bold text-background disabled:opacity-60"
        >
          {verifyMutation.isPending ? "Verifying…" : "Verify OTP"}
        </button>

        <button
          type="button"
          onClick={() => {
            verifyMutation.reset();
            resendMutation.mutate();
          }}
          disabled={resendMutation.isPending || secondsLeft > 0}
          className="flex items-center gap-2 font-heading text-[13px] font-semibold text-brand-primary-700 disabled:opacity-60"
        >
          <RotateCcw size={14} />
          {resendMutation.isPending ? "Sending…" : secondsLeft > 0 ? `Resend OTP in ${secondsLeft}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}
