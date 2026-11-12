// features/admin/users/UserDialogs.tsx
// Dialogs behind the Users table's row menu: View Profile (account,
// broker details and totals from GET /admin/users/{id}), Suspend (needs a
// reason, which is kept on the account and in the audit log) and
// Reinstate (a plain confirmation). Suspending signs the user out
// everywhere and takes a broker's live listings off the market;
// reinstating restores exactly those listings.

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Modal from "@/components/shared/Modal";
import StatusPill from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { getAdminUser, reinstateUser, suspendUser } from "@/lib/api/endpoints/admin";
import { UserRole } from "@/lib/enums";
import { toast } from "@/lib/toast";
import { SUSPENSION_REASON_MAX } from "@/lib/validation/admin";
import { ADMIN_PILL_CLASS, adminAccountStatusMap } from "@/features/admin/adminStatus";
import { formatAdminDate } from "@/features/admin/format";
import { ADMIN_ROOT_KEY, ADMIN_USERS_KEY } from "@/features/admin/queryKeys";

export type UserTarget = { id: string; name: string };

const VERIFICATION_LABELS: Record<string, string> = {
  unverified: "Not submitted",
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="font-body text-[13px] text-slate-500">{label}</span>
      <span className="text-right font-heading text-[13px] font-medium text-brand-primary-600">{value}</span>
    </div>
  );
}

export function UserProfileDialog({ target, onClose }: { target: UserTarget | null; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: [...ADMIN_USERS_KEY, "detail", target?.id],
    queryFn: () => getAdminUser(target!.id),
    enabled: target !== null,
  });

  return (
    <Modal open={target !== null} onClose={onClose} title={target?.name ?? "User profile"} description="Account details and activity.">
      {isLoading && <Skeleton className="h-[240px] w-full" />}
      {isError && <p className="font-body text-[13px] text-destructive">Couldn&apos;t load this profile.</p>}
      {data && (
        <div className="flex flex-col">
          <ProfileRow label="Email" value={data.email || "—"} />
          <ProfileRow label="Phone" value={data.phone || "—"} />
          <ProfileRow label="Role" value={data.role === UserRole.broker ? "Broker" : "Client"} />
          <ProfileRow label="Status" value={<StatusPill value={data.status} map={adminAccountStatusMap} className={ADMIN_PILL_CLASS} />} />
          <ProfileRow label="Email verified" value={data.is_email_verified ? "Yes" : "No"} />
          <ProfileRow label="Joined" value={formatAdminDate(data.created_at)} />
          {data.role === UserRole.broker && (
            <>
              <ProfileRow label="Agency" value={data.company_name || "—"} />
              <ProfileRow label="RERA number" value={data.rera_number || "—"} />
              <ProfileRow label="Experience" value={data.experience_years != null ? `${data.experience_years} years` : "—"} />
              <ProfileRow label="Verification" value={VERIFICATION_LABELS[data.verification_status ?? "unverified"]} />
              <ProfileRow label="Listings" value={`${data.listings_count} total · ${data.active_listings_count} active`} />
              <ProfileRow label="Leads received" value={data.leads_count} />
            </>
          )}
          {data.suspended_at && (
            <div className="mt-4 rounded-[4px] bg-red-50 p-3 font-body text-[13px] text-red-800">
              Suspended {formatAdminDate(data.suspended_at)}
              {data.suspension_reason ? ` — ${data.suspension_reason}` : ""}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ADMIN_ROOT_KEY });
}

export function SuspendUserDialog({ target, onClose }: { target: UserTarget | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const invalidate = useInvalidateAdmin();
  const trimmed = reason.trim();

  const close = () => {
    setReason("");
    onClose();
  };

  const mutation = useMutation({
    mutationFn: () => suspendUser(target!.id, trimmed),
    onSuccess: () => {
      toast.success(`${target?.name ?? "User"} has been suspended.`);
      close();
    },
    onError: (error: ApiError) => toast.error(error.message || "Couldn't suspend this account."),
    onSettled: invalidate,
  });

  return (
    <Modal
      open={target !== null}
      onClose={close}
      title="Suspend user"
      description={
        target
          ? `${target.name} will be signed out everywhere and can't sign in until reinstated. Their live listings will be taken off the market.`
          : undefined
      }
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!trimmed || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Suspending…" : "Suspend User"}
          </Button>
        </>
      }
    >
      <Textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={SUSPENSION_REASON_MAX}
        rows={3}
        placeholder="Reason for suspension (kept in the audit log)"
        aria-label="Suspension reason"
        autoFocus
      />
    </Modal>
  );
}

export function ReinstateUserDialog({ target, onClose }: { target: UserTarget | null; onClose: () => void }) {
  const invalidate = useInvalidateAdmin();
  return (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Reinstate this user?"
      body={target ? `${target.name} will be able to sign in again, and listings taken down by the suspension will go back live.` : undefined}
      confirmLabel="Reinstate"
      onConfirm={async () => {
        if (!target) return;
        try {
          await reinstateUser(target.id);
          toast.success(`${target.name} has been reinstated.`);
        } catch (error) {
          toast.error((error as ApiError).message || "Couldn't reinstate this account.");
        } finally {
          await invalidate();
        }
      }}
    />
  );
}
