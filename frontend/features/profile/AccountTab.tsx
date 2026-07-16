// features/profile/AccountTab.tsx
// Account tab content (Figma node 145:4686 → "Account Information" +
// "Buyer Profile" sections). Full Name/Email are real User columns;
// Phone Number has no update path on the backend (User.phone is
// immutable post-signup) so it renders read-only; Preferred Language
// and the Buyer Profile fields (Budget Range, Preferred Location,
// Property Type, Buyer Intent) have no dedicated columns and are stored
// in the free-form `preferences` JSONB blob the backend already exposes
// for exactly this purpose (P2-T20). Figma also shows a "Last changed
// N months ago" note under Password — dropped, since nothing on the
// User model tracks a password-specific change timestamp (the generic
// updated_at column changes for unrelated edits too, so showing it here
// would be misleading).

"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePasswordDialog } from "@/features/profile/ChangePasswordDialog";
import { ApiError } from "@/lib/api/client";
import { getMe, updateMe, type UserRead } from "@/lib/api/endpoints/users";
import { toast } from "@/lib/toast";
import { accountFormSchema, type AccountFormValues } from "@/lib/validation/profile";

const LANGUAGE_OPTIONS = ["English", "Hindi", "Kannada", "Tamil", "Telugu", "Marathi", "Other"];

function toFormValues(user: UserRead): AccountFormValues {
  const prefs = user.preferences ?? {};
  return {
    full_name: user.full_name ?? "",
    email: user.email ?? "",
    preferred_language: typeof prefs.preferred_language === "string" ? prefs.preferred_language : "",
    budget_range: typeof prefs.budget_range === "string" ? prefs.budget_range : "",
    preferred_location: typeof prefs.preferred_location === "string" ? prefs.preferred_location : "",
    property_type: typeof prefs.property_type === "string" ? prefs.property_type : "",
    buyer_intent: typeof prefs.buyer_intent === "string" ? prefs.buyer_intent : "",
  };
}

export function AccountTab() {
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (isLoading || !user) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Keyed on user.id and only mounted once `user` is real: the form's
  // defaultValues are baked in at construction time instead of synced in
  // after the fact (react-hook-form's `values` option), since that sync
  // raced against Controller-bound fields (the Preferred Language select)
  // registering on the very first render — the Select would come up empty
  // even though the underlying data was correct.
  return <AccountForm key={user.id} user={user} />;
}

function AccountForm({ user }: { user: UserRead }) {
  const queryClient = useQueryClient();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: toFormValues(user),
  });

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(["me"], updated);
      reset(toFormValues(updated));
      toast.success("Profile updated.");
      if (user.is_email_verified && variables.email !== user.email) {
        toast.info("Your new email needs to be verified.");
      }
    },
    onError: (error: ApiError) => {
      if (error.code === "EMAIL_TAKEN") {
        setError("email", { message: error.message });
      } else if (error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          setError(field as keyof AccountFormValues, { message });
        }
      } else {
        toast.error(error.message);
      }
    },
  });

  const onSubmit = (values: AccountFormValues) => {
    mutation.mutate({
      full_name: values.full_name,
      email: values.email,
      preferences: {
        ...user.preferences,
        preferred_language: values.preferred_language,
        budget_range: values.budget_range,
        preferred_location: values.preferred_location,
        property_type: values.property_type,
        buyer_intent: values.buyer_intent,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your profile and account security.</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold">Account Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" aria-invalid={Boolean(errors.full_name)} {...register("full_name")} />
            {errors.full_name && <p className="text-destructive text-sm">{errors.full_name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={user.phone} disabled readOnly />
            <p className="text-muted-foreground text-xs">Contact support to change your phone number.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="preferred_language">Preferred Language</Label>
            <Controller
              control={control}
              name="preferred_language"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger id="preferred_language">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Password</h2>
          <p className="text-muted-foreground text-sm">Keep your account secure with a strong password.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(true)}>
          Change Password
        </Button>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Buyer Profile</h2>
          <p className="text-muted-foreground text-sm">Help us personalise property recommendations for you.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="budget_range">Budget Range</Label>
            <Input id="budget_range" placeholder="e.g. ₹1 Cr – ₹5 Cr" {...register("budget_range")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="preferred_location">Preferred Location</Label>
            <Input id="preferred_location" placeholder="e.g. Indiranagar, Koramangala" {...register("preferred_location")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="property_type">Property Type</Label>
            <Input id="property_type" placeholder="e.g. Residential" {...register("property_type")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="buyer_intent">Buyer Intent</Label>
            <Input id="buyer_intent" placeholder="e.g. Investment + Self-Use" {...register("buyer_intent")} />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => reset()} disabled={!isDirty || mutation.isPending}>
          Discard Changes
        </Button>
        <Button type="submit" disabled={!isDirty || mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <ChangePasswordDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />
    </form>
  );
}
