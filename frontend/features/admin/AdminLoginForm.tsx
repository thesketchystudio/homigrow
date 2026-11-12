// features/admin/AdminLoginForm.tsx
// Admin sign-in form (Figma node 328:2050, right panel). Posts to the
// admin-only /auth/admin/login, which answers BAD_CREDENTIALS for any
// non-admin account, so this page never signs in a client or broker.
// "Remember me" remembers the email address on this device only — the
// session itself is the same httpOnly refresh cookie every portal uses,
// and no password or token is ever written to browser storage.
// returnTo is honoured only for paths inside /admin, so the sign-in page
// can't be used to bounce someone to an arbitrary site.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { ApiError } from "@/lib/api/client";
import { adminLogin } from "@/lib/api/endpoints/admin";
import { useAuthStore } from "@/lib/stores/auth";
import { adminLoginSchema, type AdminLoginValues } from "@/lib/validation/admin";

const REMEMBERED_EMAIL_KEY = "homigrow-admin-email";
const DEFAULT_DESTINATION = "/admin/dashboard";

function readRememberedEmail(): string {
  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeRememberedEmail(email: string | null) {
  try {
    if (email) window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Storage can be unavailable (private mode); remembering is a convenience only.
  }
}

export function safeAdminReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/admin/") || value.startsWith("//") || value.startsWith("/admin/login")) {
    return DEFAULT_DESTINATION;
  }
  return value;
}

const labelClassName = "font-heading text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80";
const inputClassName =
  "w-full bg-transparent py-3 font-heading text-[16px] text-brand-primary-600 outline-none placeholder:text-brand-secondary-600";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [initialEmail] = useState(() => (typeof window === "undefined" ? "" : readRememberedEmail()));
  const [rememberMe, setRememberMe] = useState(initialEmail !== "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: initialEmail, password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: AdminLoginValues) => adminLogin({ phone_or_email: values.email, password: values.password }),
    onSuccess: (session, values) => {
      writeRememberedEmail(rememberMe ? values.email : null);
      setAuth(session.user, session.access_token);
      router.replace(safeAdminReturnTo(searchParams.get("returnTo")));
    },
  });

  const serverError = mutation.error as ApiError | null;

  return (
    <form noValidate onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-5 pt-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="admin-email" className={labelClassName}>
          Admin Email
        </label>
        <div className="border-b border-[rgba(198,198,205,0.4)] focus-within:border-brand-primary-600">
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            placeholder="admin@homigrow.com"
            className={inputClassName}
            {...register("email")}
          />
        </div>
        {errors.email && <p className="text-[12px] text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="admin-password" className={labelClassName}>
          Password
        </label>
        <div className="flex items-center border-b border-[rgba(198,198,205,0.4)] focus-within:border-brand-primary-600">
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            className={inputClassName}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="text-slate-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-[12px] text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(value) => setRememberMe(value === true)}
            className="size-4 rounded-[2px] border-[#c6c6cd] data-[state=checked]:text-background"
          />
          <span className="font-heading text-[12px] font-medium text-brand-primary-600/60">Remember me</span>
        </label>
        <Link href="/forgot-password" className="font-heading text-[12px] font-medium text-brand-primary-600/60 hover:text-brand-primary-600">
          Forgot password?
        </Link>
      </div>

      {serverError && (
        <p role="alert" className="text-[14px] text-destructive">
          {serverError.code === "BAD_CREDENTIALS" ? "Invalid admin email or password." : serverError.message}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-2 h-[53px] w-full rounded-[4px] bg-brand-primary-800 font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-background disabled:opacity-60"
      >
        {mutation.isPending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
