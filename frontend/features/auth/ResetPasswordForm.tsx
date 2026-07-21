// features/auth/ResetPasswordForm.tsx
// "Reset your password." screen (Figma: "password reset" group, node
// 470:713), reached via the emailed reset link's ?token= query param.

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { resetPassword } from "@/lib/api/endpoints/auth";
import { toast } from "@/lib/toast";
import { AuthPasswordField } from "@/components/forms/AuthPasswordField";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordValues) => resetPassword({ token: token ?? "", new_password: values.new_password }),
    onSuccess: () => {
      toast.success("Your password has been updated. Please log in again.");
      router.push("/login");
    },
    onError: (error: ApiError) => {
      if (error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          setError(field as keyof ResetPasswordValues, { message });
        }
      }
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  if (!token) {
    return (
      <div className="flex w-full flex-col gap-6">
        <h1 className="font-heading text-[34px] font-bold leading-[51px] tracking-[-0.5px] text-foreground">
          Reset link invalid
        </h1>
        <p className="font-heading text-[16px] text-[#45464d]">
          This password reset link is missing its token. Request a new one from the login screen.
        </p>
        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="flex items-center justify-center rounded-lg bg-brand-primary-500 px-12 py-4 font-heading text-[16px] font-bold text-background"
        >
          Request New Link
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[34px] font-bold leading-[51px] tracking-[-0.5px] text-foreground">
          Reset your password.
        </h1>
        <p className="font-heading text-[16px] text-[#45464d]">Welcome back to your exclusive real estate haven.</p>
      </div>

      <div className="flex flex-col gap-5">
        <AuthPasswordField
          label="New Password"
          placeholder="Min. 8 characters"
          register={register("new_password")}
          error={errors.new_password?.message}
        />
        <AuthPasswordField
          label="Confirm Password"
          placeholder="Min. 8 characters"
          register={register("confirm_password")}
          error={errors.confirm_password?.message}
        />
      </div>

      {mutation.isError && !(mutation.error as ApiError).fields && (
        <p className="text-[14px] text-destructive">{(mutation.error as ApiError).message}</p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex items-center justify-center gap-3 rounded-lg bg-brand-primary-500 px-12 py-4 font-heading text-[16px] font-bold text-background disabled:opacity-60"
      >
        {mutation.isPending ? "Setting…" : "Set Password"}
      </button>
    </form>
  );
}
