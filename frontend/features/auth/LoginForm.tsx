// features/auth/LoginForm.tsx
// Login screen (Figma: "Client - Log in", node 423:3651), rendered inside
// AuthSplitShell. The role toggle and remember-me are display-only — login
// doesn't take a role (it comes back from the account server-side) and
// there's no remember-me support in the API yet. Google sign-in is still
// deferred (P2-T35).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { login } from "@/lib/api/endpoints/auth";
import { toast } from "@/lib/toast";
import { UserRole } from "@/lib/enums";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { AuthPasswordField } from "@/components/forms/AuthPasswordField";
import { Checkbox } from "@/components/ui/checkbox";
import { loginFormSchema, type LoginFormValues } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

type LoginRole = Exclude<UserRole, "admin">;

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>(UserRole.client);
  const [rememberMe, setRememberMe] = useState(false);

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
    onSuccess: (data) => {
      toast.success(data.user.full_name ? `Welcome back, ${data.user.full_name}!` : "Welcome back!");
      router.push("/");
    },
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

      <div className="flex gap-1 rounded bg-brand-secondary-500 p-1">
        {([UserRole.client, UserRole.broker] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRole(option)}
            className={cn(
              "flex-1 rounded-[3px] py-2.5 font-heading text-[13px] tracking-[0.3px] transition-colors",
              role === option
                ? "bg-background font-semibold text-foreground shadow-sm"
                : "font-normal text-brand-primary-500",
            )}
          >
            {option === UserRole.client ? "Buyer / Client" : "Broker / Agent"}
          </button>
        ))}
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
              onClick={() => toast.info("Password reset isn't available yet.")}
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

      <p className="text-center font-heading text-[16px] text-brand-secondary-800">
        {"New here? "}
        <button type="button" onClick={() => router.push("/signup")} className="font-bold text-foreground">
          Sign up
        </button>
      </p>
    </form>
  );
}
