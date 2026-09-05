// features/auth/LoginForm.tsx
// Login screen (Figma: "Client - Log in", node 423:3651), rendered inside
// AuthSplitShell. There's no remember-me support in the API yet, so that
// checkbox is display-only. The Figma design has no role toggle — login
// doesn't take a role, it comes back from the account server-side — and
// no build ever needed one, so none exists here. Google sign-in (Figma's
// "OR CONTINUE WITH" row) sends no role — an unmatched email means no
// account exists yet, so it's rejected rather than silently signing
// someone up from the login screen.

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { login, type TokenResponse } from "@/lib/api/endpoints/auth";
import { getRoleHomePath } from "@/lib/auth/roleHome";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "@/lib/toast";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { AuthPasswordField } from "@/components/forms/AuthPasswordField";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleSignInButton } from "@/features/auth/GoogleSignInButton";
import { loginFormSchema, type LoginFormValues } from "@/lib/validation/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [rememberMe, setRememberMe] = useState(false);

  const handleAuthenticated = (session: TokenResponse) => {
    setAuth(session.user, session.access_token);
    toast.success(session.user.full_name ? `Welcome back, ${session.user.full_name}!` : "Welcome back!");
    router.push(searchParams.get("returnTo") || getRoleHomePath(session.user.role));
  };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => login({ phone_or_email: values.email, password: values.password }),
    onSuccess: handleAuthenticated,
    onError: (error: ApiError) => {
      if (error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          setError(field as keyof LoginFormValues, { message });
        }
      }
    },
  });

  const onSubmit = handleSubmit((values) => loginMutation.mutate(values));

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[34px] font-bold leading-[51px] tracking-[-0.5px] text-brand-primary-700">
          Hello!
        </h1>
        <p className="font-heading text-[16px] text-brand-primary-400">
          Welcome back to your exclusive real estate haven.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <AuthTextField
          label="Email"
          type="email"
          placeholder="xyz@gmail.com"
          register={register("email")}
          error={errors.email?.message}
        />
        <div className="flex flex-col gap-2">
          <AuthPasswordField
            label="Password"
            placeholder="Enter your password"
            register={register("password")}
            error={errors.password?.message}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(value) => setRememberMe(value === true)}
                className="size-3.5 rounded-[2px]"
              />
              <span className="font-heading text-[12px] font-medium text-brand-secondary-800">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="font-heading text-[12px] text-brand-secondary-800/65"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>

      {loginMutation.isError && !(loginMutation.error as ApiError).fields && (
        <p className="text-[14px] text-destructive">{(loginMutation.error as ApiError).message}</p>
      )}

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="flex items-center justify-center gap-3 rounded-lg bg-brand-primary-500 px-12 py-4 font-heading text-[16px] font-bold text-background disabled:opacity-60"
      >
        {loginMutation.isPending ? "Logging in…" : "Login →"}
      </button>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-brand-secondary-500" />
        <span className="font-heading text-[12px] tracking-[0.3px] text-brand-secondary-800/65">OR CONTINUE WITH</span>
        <div className="h-px flex-1 bg-brand-secondary-500" />
      </div>

      <GoogleSignInButton
        onSuccess={handleAuthenticated}
        onNoAccount={() => toast.error("No account found for this Google email. Please sign up first.")}
      />

      <p className="text-center font-heading text-[16px] text-brand-secondary-800">
        {"New here? "}
        <button type="button" onClick={() => router.push("/signup")} className="font-bold text-foreground">
          Sign up
        </button>
      </p>
    </form>
  );
}
