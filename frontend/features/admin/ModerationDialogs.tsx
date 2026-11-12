// features/admin/ModerationDialogs.tsx
// Approve/reject flow shared by the Listings page's card menu and the
// Review Queue. Approving asks for a plain confirmation; rejecting needs
// a note (sent to the broker in their notification), mirroring the
// backend rule that a rejection without a reason is refused. Both
// invalidate every admin query on success, since one decision changes
// the queue, the listing counts and the dashboard KPIs together.

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Modal from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { moderateProperty, type ModerationAction } from "@/lib/api/endpoints/admin";
import { toast } from "@/lib/toast";
import { REJECTION_NOTE_MAX } from "@/lib/validation/admin";
import { ADMIN_ROOT_KEY } from "@/features/admin/queryKeys";

export type ModerationTarget = { id: string; title: string };

export function useModerateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: ModerationAction; note?: string }) =>
      moderateProperty(id, action, note),
    onSuccess: (_, variables) => {
      toast.success(variables.action === "approve" ? "Listing approved and published." : "Listing rejected. The broker has been notified.");
    },
    onError: (error: ApiError) => {
      toast.error(error.code === "INVALID_TRANSITION" ? "This listing is no longer awaiting review." : error.message || "Couldn't save the decision.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ADMIN_ROOT_KEY }),
  });
}

export function ApproveListingDialog({ target, onClose }: { target: ModerationTarget | null; onClose: () => void }) {
  const mutation = useModerateProperty();
  return (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Approve this listing?"
      body={target ? `"${target.title}" will go live and become visible to buyers. The broker will be notified.` : undefined}
      confirmLabel="Approve"
      onConfirm={async () => {
        if (target) await mutation.mutateAsync({ id: target.id, action: "approve" }).catch(() => undefined);
      }}
    />
  );
}

export function RejectListingDialog({
  target,
  onClose,
  initialNote = "",
}: {
  target: ModerationTarget | null;
  onClose: () => void;
  // Prefills the note (the Review Queue passes its "Admin notes" draft); remount with a key to change it.
  initialNote?: string;
}) {
  const [note, setNote] = useState(initialNote);
  const mutation = useModerateProperty();
  const trimmed = note.trim();

  const close = () => {
    setNote("");
    onClose();
  };

  return (
    <Modal
      open={target !== null}
      onClose={close}
      title="Reject listing"
      description={target ? `Tell the broker why "${target.title}" can't be published. They'll see this note.` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!trimmed || mutation.isPending}
            onClick={() => target && mutation.mutate({ id: target.id, action: "reject", note: trimmed }, { onSuccess: close })}
          >
            {mutation.isPending ? "Rejecting…" : "Reject Listing"}
          </Button>
        </>
      }
    >
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={REJECTION_NOTE_MAX}
        rows={4}
        placeholder="e.g. Photos are blurry and the floor plan is missing."
        aria-label="Rejection note"
        autoFocus
      />
    </Modal>
  );
}
