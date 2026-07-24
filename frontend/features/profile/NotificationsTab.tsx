// features/profile/NotificationsTab.tsx
// Notifications tab content (Figma node 147:11875's "Notification
// Channels" table). Colors/spacing pulled directly from Figma's
// get_design_context output for this node, same approach as the
// Account tab. There's no dedicated notification-preferences backend —
// like the Account tab's Buyer Profile fields, these five channel
// toggles live under a "notification_channels" key in the existing
// free-form `preferences` JSONB (P2-T20), the same pattern T22
// established for fields with no dedicated column. Every save spreads
// the currently-loaded preferences first so this tab can't silently
// wipe another tab's keys.

"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { getMe, updateMe, type UserRead } from "@/lib/api/endpoints/users";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { notificationsFormSchema, type NotificationsFormValues } from "@/lib/validation/profile";

type ChannelKey = keyof NotificationsFormValues;

const CHANNELS: { key: ChannelKey; title: string; description: string }[] = [
  {
    key: "property_match_alerts",
    title: "Property Match Alerts",
    description: "Real-time alerts for curated listings matching your criteria.",
  },
  {
    key: "market_volatility",
    title: "Market Volatility Updates",
    description: "Immediate reporting on significant price shifts in tracked districts.",
  },
  {
    key: "private_viewings",
    title: "Private Viewings",
    description: "Logistics and confirmations for scheduled property walkthroughs.",
  },
  {
    key: "offer_status",
    title: "Offer Status Updates",
    description: "Get notified when an offer is accepted, countered or declined.",
  },
  {
    key: "emi_reminders",
    title: "EMI Reminders",
    description: "Monthly reminders 3 days before your home loan EMI due date.",
  },
];

const DEFAULT_CHANNEL = { email: true, push: true };

function toFormValues(user: UserRead): NotificationsFormValues {
  const stored = user.preferences?.notification_channels;
  const saved = typeof stored === "object" && stored !== null ? (stored as Record<string, unknown>) : {};
  const values = {} as NotificationsFormValues;
  for (const { key } of CHANNELS) {
    const entry = saved[key];
    values[key] =
      typeof entry === "object" && entry !== null
        ? {
            email: Boolean((entry as Record<string, unknown>).email),
            push: Boolean((entry as Record<string, unknown>).push),
          }
        : DEFAULT_CHANNEL;
  }
  return values;
}

export function NotificationsTab() {
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (isLoading || !user) {
    return <NotificationsTabSkeleton />;
  }

  // Keyed + mounted once real data exists, same reasoning as AccountTab:
  // defaultValues baked in at construction rather than synced in later.
  return <NotificationsForm key={user.id} user={user} />;
}

// Mirrors the real table's header row + 5 channel rows so the loading
// state keeps the same shape instead of collapsing into generic bars —
// matches Figma's own skeleton frame for this tab (Components/Section 3).
// Exported so ProfileLayout's AuthGuard fallback can show the same shape
// immediately, instead of swapping from a generic placeholder once auth
// resolves.
export function NotificationsTabSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-0.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-1 h-3 w-80" />
        </div>

        <div className="overflow-hidden rounded-xl border-[0.8px] border-[#f1f5f9] bg-[#fefeff]">
          <div className="flex items-center justify-between border-b-[0.8px] border-[#f1f5f9] bg-[#f8f9fa] px-6 py-3">
            <Skeleton className="h-3 w-16" />
            <div className="flex gap-8">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>

          {CHANNELS.map(({ key }, index) => (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between px-6 py-5",
                index < CHANNELS.length - 1 && "border-b-[0.8px] border-[#f8fafc]",
              )}
            >
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <div className="flex gap-8">
                <div className="flex w-[60px] justify-center">
                  <Skeleton className="size-[22px] rounded-[4px]" />
                </div>
                <div className="flex w-[60px] justify-center">
                  <Skeleton className="size-[22px] rounded-[4px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Skeleton className="h-11 w-40 rounded" />
      </div>
    </div>
  );
}

function NotificationsForm({ user }: { user: UserRead }) {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: toFormValues(user),
  });

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      reset(toFormValues(updated));
      toast.success("Notification preferences saved.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });

  const onSubmit = (values: NotificationsFormValues) => {
    mutation.mutate({
      preferences: {
        ...user.preferences,
        notification_channels: values,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-brand-primary-400 text-[36px] leading-[44px] font-bold">Settings</h1>
        <p className="font-body text-brand-primary-600/70 text-[16px] leading-[26px]">
          Manage your profile and account security.
        </p>
      </div>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-brand-primary-400 text-[20px] leading-[28px] font-bold">
            Notification Channels
          </h2>
          <p className="font-body text-[12px] leading-[18px] text-slate-500">
            Configure how you receive property updates and market reports.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border-[0.8px] border-[#f1f5f9] bg-[#fefeff]">
          <div className="flex items-center justify-between border-b-[0.8px] border-[#f1f5f9] bg-[#f8f9fa] px-6 py-3">
            <span className="font-heading text-[12px] font-bold tracking-[1.2px] text-[#94a3b8] uppercase">
              Channel
            </span>
            <div className="flex gap-8">
              <span className="font-heading w-[60px] text-center text-[12px] font-bold tracking-[1.2px] text-[#94a3b8] uppercase">
                Email
              </span>
              <span className="font-heading w-[60px] text-center text-[12px] font-bold tracking-[1.2px] text-[#94a3b8] uppercase">
                Push
              </span>
            </div>
          </div>

          {CHANNELS.map(({ key, title, description }, index) => (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between px-6 py-5",
                index < CHANNELS.length - 1 && "border-b-[0.8px] border-[#f8fafc]",
              )}
            >
              <div className="flex flex-col gap-0.5">
                <p className="font-heading text-[16px] font-bold text-[#1a1a1a]">{title}</p>
                <p className="font-body text-[12px] text-[#64748b]">{description}</p>
              </div>
              <div className="flex gap-8">
                <div className="flex w-[60px] justify-center">
                  <Controller
                    control={control}
                    name={`${key}.email`}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label={`${title} — Email`}
                        className="size-[22px] rounded-[4px] border-[rgba(38,38,38,0.3)] data-[state=checked]:border-[#1a1a1a] data-[state=checked]:bg-[#1a1a1a] data-[state=checked]:text-background"
                      />
                    )}
                  />
                </div>
                <div className="flex w-[60px] justify-center">
                  <Controller
                    control={control}
                    name={`${key}.push`}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label={`${title} — Push`}
                        className="size-[22px] rounded-[4px] border-[rgba(38,38,38,0.3)] data-[state=checked]:border-[#1a1a1a] data-[state=checked]:bg-[#1a1a1a] data-[state=checked]:text-background"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isDirty || mutation.isPending}
          className="bg-brand-primary-600 text-background font-heading rounded px-6 py-2.5 text-[16px] font-bold disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save Preferences"}
        </button>
      </div>
    </form>
  );
}
