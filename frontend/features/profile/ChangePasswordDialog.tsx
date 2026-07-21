// features/profile/ChangePasswordDialog.tsx
// "Change Password" action from the Account tab (Figma node 145:4840).
// Verifies the current password server-side before setting a new one
// (PATCH /users/me/password) — does not touch other active sessions.

"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";

import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/shared/Modal";
import { ApiError } from "@/lib/api/client";
import { changePassword } from "@/lib/api/endpoints/users";
import { toast } from "@/lib/toast";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validation/profile";

export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  const newPassword = watch("new_password") ?? "";

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password updated.");
      reset();
      onClose();
    },
    onError: (error: ApiError) => {
      if (error.code === "BAD_CURRENT_PASSWORD") {
        setError("current_password", { message: error.message });
      } else if (error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          setError(field as keyof ChangePasswordValues, { message });
        }
      } else {
        toast.error(error.message);
      }
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change Password"
      description="Enter your current password and choose a new one."
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Password"}
          </Button>
        </>
      }
    >
      <form
        id="change-password-form"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex flex-col gap-4"
      >
        <PasswordField label="Current Password" register={register("current_password")} error={errors.current_password?.message} />
        <div className="flex flex-col gap-2">
          <PasswordField label="New Password" register={register("new_password")} error={errors.new_password?.message} />
          <PasswordStrengthMeter password={newPassword} />
        </div>
        <PasswordField label="Confirm New Password" register={register("confirm_password")} error={errors.confirm_password?.message} />
      </form>
    </Modal>
  );
}

function PasswordField({
  label,
  register,
  error,
}: {
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={register.name}>{label}</Label>
      <div className="relative">
        <Input id={register.name} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} className="pr-10" {...register} />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
