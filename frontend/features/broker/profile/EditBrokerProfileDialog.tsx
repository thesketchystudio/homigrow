// features/broker/profile/EditBrokerProfileDialog.tsx
// "Edit Profile" action on the Broker Profile page (Figma node 177:2805).
// Edits the caller's own name plus the editable subset of BrokerProfile
// (bio/company_name/experience_years/specializations/service_areas) via
// PATCH /users/me's new nested broker_profile field. rera_number and
// verification_status are deliberately not editable here — changing either
// belongs to the verification-document resubmission flow
// (POST /brokers/me/verification-documents), not a plain profile edit.

"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Modal from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { updateMe, type UserRead } from "@/lib/api/endpoints/users";
import { toast } from "@/lib/toast";
import { toOptionalNumber } from "@/lib/utils";
import { brokerProfileFormSchema, type BrokerProfileFormValues } from "@/lib/validation/profile";

function toFormValues(user: UserRead): BrokerProfileFormValues {
  return {
    full_name: user.full_name ?? "",
    bio: user.broker_profile?.bio ?? "",
    company_name: user.broker_profile?.company_name ?? "",
    experience_years: user.broker_profile?.experience_years,
    specializations: (user.broker_profile?.specializations ?? []).join(", "),
    service_areas: (user.broker_profile?.service_areas ?? []).join(", "),
  };
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function EditBrokerProfileDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user: UserRead }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrokerProfileFormValues>({
    resolver: zodResolver(brokerProfileFormSchema),
    defaultValues: toFormValues(user),
  });

  // Re-seed the form whenever the dialog reopens, in case `me` changed
  // (e.g. a previous save) since it was last closed.
  useEffect(() => {
    if (open) reset(toFormValues(user));
  }, [open, user, reset]);

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      toast.success("Profile updated.");
      onClose();
    },
    onError: (error: ApiError) => {
      if (error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          toast.error(message ?? `${field}: invalid value`);
        }
      } else {
        toast.error(error.message);
      }
    },
  });

  const onSubmit = (values: BrokerProfileFormValues) => {
    mutation.mutate({
      full_name: values.full_name,
      broker_profile: {
        bio: values.bio,
        company_name: values.company_name,
        experience_years: values.experience_years,
        specializations: splitTags(values.specializations),
        service_areas: splitTags(values.service_areas),
      },
    });
  };

  const handleClose = () => {
    reset(toFormValues(user));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Profile"
      description="Update how your profile appears to clients."
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="broker-profile-edit-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="broker-profile-edit-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" aria-invalid={Boolean(errors.full_name)} {...register("full_name")} />
          {errors.full_name && <p className="text-destructive text-sm">{errors.full_name.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="company_name">Agency / Firm Name</Label>
          <Input id="company_name" aria-invalid={Boolean(errors.company_name)} {...register("company_name")} />
          {errors.company_name && <p className="text-destructive text-sm">{errors.company_name.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="experience_years">Years of Experience</Label>
          <Input
            id="experience_years"
            type="number"
            min={0}
            max={80}
            aria-invalid={Boolean(errors.experience_years)}
            {...register("experience_years", { setValueAs: toOptionalNumber })}
          />
          {errors.experience_years && <p className="text-destructive text-sm">{errors.experience_years.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="bio">About</Label>
          <Textarea id="bio" rows={4} aria-invalid={Boolean(errors.bio)} {...register("bio")} />
          {errors.bio && <p className="text-destructive text-sm">{errors.bio.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="specializations">Specializations</Label>
          <Input id="specializations" placeholder="Residential, Luxury Villas, Commercial" {...register("specializations")} />
          <p className="text-muted-foreground text-xs">Comma-separated.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="service_areas">Primary Cities / Service Areas</Label>
          <Input id="service_areas" placeholder="Bangalore, Mumbai, Hyderabad" {...register("service_areas")} />
          <p className="text-muted-foreground text-xs">Comma-separated.</p>
        </div>
      </form>
    </Modal>
  );
}
