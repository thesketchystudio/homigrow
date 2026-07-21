// features/auth/ForgotPasswordFlow.tsx
// "Forgot password?" flow (Figma: "password reset" group, node 470:500).
// Figma only designs the confirmation state ("Check your inbox!", node
// 470:603) and the follow-up "Reset your password." screen (node
// 470:713) — there's no dedicated "enter your email" frame, so the
// initial email-entry form here is a minimal addition matching the same
// AuthSplitShell visual language (underline fields, black CTA) rather
// than a literal Figma pull.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "@/lib/api/endpoints/auth";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validation/auth";

export function ForgotPasswordFlow() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) {
    return <CheckInboxScreen email={sentTo} />;
  }

  return <EmailForm onSent={setSentTo} />;
}

function EmailForm({ onSent }: { onSent: (email: string) => void }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => onSent(getValues("email")),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[34px] font-bold leading-[51px] tracking-[-0.5px] text-foreground">
          Forgot password?
        </h1>
        <p className="font-heading text-[16px] text-[#45464d]">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <AuthTextField
        label="Email"
        type="email"
        placeholder="xyz@gmail.com"
        register={register("email")}
        error={errors.email?.message}
      />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex items-center justify-center rounded-lg bg-brand-primary-500 px-12 py-4 font-heading text-[16px] font-bold text-background disabled:opacity-60"
      >
        {mutation.isPending ? "Sending…" : "Send Reset Link"}
      </button>

      <p className="text-center font-heading text-[16px] text-brand-secondary-800">
        {"Remembered it? "}
        <button type="button" onClick={() => router.push("/login")} className="font-bold text-foreground">
          Log in
        </button>
      </p>
    </form>
  );
}

function CheckInboxScreen({ email }: { email: string }) {
  const resendMutation = useMutation({
    mutationFn: () => forgotPassword({ email }),
  });

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full flex-col items-center gap-1">
        <h1 className="font-heading text-[34px] font-bold leading-[51px] tracking-[-0.5px] text-foreground">
          Check your inbox!
        </h1>
        <p className="text-center font-heading text-[16px] leading-[24px] text-[#45464d]">
          You would have received a reset password link on your registered email.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-6">
        <div className="h-px w-full bg-brand-secondary-500" />
        <p className="text-center font-heading text-[16px] leading-[24px] text-foreground">
          <span className="underline">Didn&apos;t get an email? </span>
          <button
            type="button"
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="font-bold underline disabled:opacity-60"
          >
            {resendMutation.isPending ? "Resending…" : "Resend"}
          </button>
        </p>
      </div>
    </div>
  );
}
