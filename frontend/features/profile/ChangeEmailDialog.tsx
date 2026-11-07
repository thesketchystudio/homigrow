// features/profile/ChangeEmailDialog.tsx
// "Change email" action from the Account tab. Two steps: the new address
// plus a re-confirmation of who is asking (current password, or for
// accounts without one a code sent to the current email), then the
// one-time code(s) emailed to prove the new address is reachable. The old
// email stays in place until the codes check out, so a stolen session can't
// quietly redirect the account.

"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Modal from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/features/profile/ChangePasswordDialog";
import { ApiError } from "@/lib/api/client";
import { confirmEmailChange, requestEmailChange, type UserRead } from "@/lib/api/endpoints/users";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "@/lib/toast";
import {
  changeEmailConfirmSchema,
  changeEmailRequestSchema,
  type ChangeEmailConfirmValues,
  type ChangeEmailRequestValues,
} from "@/lib/validation/profile";

type Step = "request" | "confirm";

const CODE_ERROR_CODES = ["OTP_INVALID", "OTP_EXPIRED", "OTP_ATTEMPTS_EXCEEDED"];

export function ChangeEmailDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user: UserRead }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("request");
  const [newEmail, setNewEmail] = useState("");

  const requestForm = useForm<ChangeEmailRequestValues>({
    resolver: zodResolver(changeEmailRequestSchema),
    defaultValues: { new_email: "", current_password: "" },
  });
  const confirmForm = useForm<ChangeEmailConfirmValues>({
    resolver: zodResolver(changeEmailConfirmSchema),
    defaultValues: { code: "", current_email_code: "" },
  });

  const requestMutation = useMutation({
    mutationFn: requestEmailChange,
    onSuccess: (_data, variables) => {
      setNewEmail(variables.new_email);
      setStep("confirm");
    },
    onError: (error: ApiError) => {
      if (error.code === "BAD_CURRENT_PASSWORD" || error.code === "ACCOUNT_LOCKED") {
        requestForm.setError("current_password", { message: error.message });
      } else if (error.code === "EMAIL_TAKEN" || error.code === "EMAIL_UNCHANGED") {
        requestForm.setError("new_email", { message: error.message });
      } else if (error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          requestForm.setError(field as keyof ChangeEmailRequestValues, { message });
        }
      } else {
        toast.error(error.message);
      }
    },
  });

  const confirmMutation = useMutation({
    mutationFn: confirmEmailChange,
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      const { user: authUser, accessToken } = useAuthStore.getState();
      if (authUser && accessToken) {
        useAuthStore.getState().setAuth({ ...authUser, email: updated.email }, accessToken);
      }
      toast.success("Email updated.");
      handleClose();
    },
    onError: (error: ApiError) => {
      if (CODE_ERROR_CODES.includes(error.code)) {
        confirmForm.setError("code", { message: error.message });
      } else if (error.code === "CURRENT_EMAIL_CODE_REQUIRED") {
        confirmForm.setError("current_email_code", { message: error.message });
      } else if (error.code === "EMAIL_TAKEN") {
        setStep("request");
        requestForm.setError("new_email", { message: error.message });
      } else {
        toast.error(error.message);
      }
    },
  });

  const handleClose = () => {
    requestForm.reset();
    confirmForm.reset();
    setStep("request");
    setNewEmail("");
    onClose();
  };

  const submitRequest = (values: ChangeEmailRequestValues) => {
    if (user.has_password && !values.current_password) {
      requestForm.setError("current_password", { message: "Enter your current password" });
      return;
    }
    requestMutation.mutate({
      new_email: values.new_email,
      current_password: user.has_password ? values.current_password : undefined,
    });
  };

  const submitConfirm = (values: ChangeEmailConfirmValues) => {
    if (!user.has_password && values.current_email_code.length !== 6) {
      confirmForm.setError("current_email_code", { message: "Enter the 6-digit code" });
      return;
    }
    confirmMutation.mutate({
      new_email: newEmail,
      code: values.code,
      current_email_code: user.has_password ? undefined : values.current_email_code,
    });
  };

  const isPending = requestMutation.isPending || confirmMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change Email"
      description={
        step === "request"
          ? "Enter your new email address. We'll send a code to it before anything changes."
          : `Enter the code we sent to ${newEmail}.`
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form={step === "request" ? "change-email-request-form" : "change-email-confirm-form"} disabled={isPending}>
            {step === "request" ? (isPending ? "Sending…" : "Send Code") : isPending ? "Verifying…" : "Confirm Email"}
          </Button>
        </>
      }
    >
      {step === "request" ? (
        <form noValidate id="change-email-request-form" onSubmit={requestForm.handleSubmit(submitRequest)} className="flex flex-col gap-4">
          <TextField
            label="New Email Address"
            id="new_email"
            type="email"
            registration={requestForm.register("new_email")}
            error={requestForm.formState.errors.new_email?.message}
          />
          {user.has_password ? (
            <PasswordField
              label="Current Password"
              register={requestForm.register("current_password")}
              error={requestForm.formState.errors.current_password?.message}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              You signed in with Google, so we&apos;ll also send a code to {user.email} to confirm it&apos;s you.
            </p>
          )}
        </form>
      ) : (
        <form noValidate id="change-email-confirm-form" onSubmit={confirmForm.handleSubmit(submitConfirm)} className="flex flex-col gap-4">
          <TextField
            label={`Code sent to ${newEmail}`}
            id="code"
            inputMode="numeric"
            maxLength={6}
            registration={confirmForm.register("code")}
            error={confirmForm.formState.errors.code?.message}
          />
          {!user.has_password && (
            <TextField
              label={`Code sent to ${user.email}`}
              id="current_email_code"
              inputMode="numeric"
              maxLength={6}
              registration={confirmForm.register("current_email_code")}
              error={confirmForm.formState.errors.current_email_code?.message}
            />
          )}
        </form>
      )}
    </Modal>
  );
}

function TextField({
  label,
  id,
  type = "text",
  inputMode,
  maxLength,
  registration,
  error,
}: {
  label: string;
  id: string;
  type?: string;
  inputMode?: "numeric";
  maxLength?: number;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} inputMode={inputMode} maxLength={maxLength} autoComplete="off" aria-invalid={Boolean(error)} {...registration} />
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
