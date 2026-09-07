// features/broker/leads/LeadActionDialogs.tsx
// The two quick-action dialogs behind the Leads table's chat/calendar row
// icons (Figma node 176:1505): logging a note and setting a follow-up date.
// Both are single-field, submit-on-click dialogs rather than a fuller lead
// detail view — Figma's table row only shows these two actions plus a call
// icon, with no separate detail screen in this frame to build against.

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Modal from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { addLeadNote, updateLead } from "@/lib/api/endpoints/leads";
import { toast } from "@/lib/toast";
import { LEADS_QUERY_KEY } from "@/features/broker/leads/queryKey";

type AddNoteDialogProps = {
  leadId: string | null;
  onClose: () => void;
};

export function AddLeadNoteDialog({ leadId, onClose }: AddNoteDialogProps) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (noteBody: string) => addLeadNote(leadId as string, noteBody),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Note added.");
      setBody("");
      onClose();
    },
    onError: () => toast.error("Couldn't add the note. Please try again."),
  });

  return (
    <Modal
      open={leadId !== null}
      onClose={onClose}
      title="Add a note"
      description="Logged against this lead's history."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!body.trim() || mutation.isPending} onClick={() => mutation.mutate(body.trim())}>
            {mutation.isPending ? "Saving…" : "Save Note"}
          </Button>
        </>
      }
    >
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="e.g. Called, left a voicemail."
        rows={4}
        autoFocus
      />
    </Modal>
  );
}

type SetFollowUpDialogProps = {
  leadId: string | null;
  onClose: () => void;
};

export function SetFollowUpDialog({ leadId, onClose }: SetFollowUpDialogProps) {
  const [date, setDate] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (followUpDate: string) => updateLead(leadId as string, { follow_up_at: new Date(followUpDate).toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Follow-up scheduled.");
      setDate("");
      onClose();
    },
    onError: () => toast.error("Couldn't schedule the follow-up. Please try again."),
  });

  return (
    <Modal
      open={leadId !== null}
      onClose={onClose}
      title="Schedule a follow-up"
      description="Pick a date to be reminded to reach back out to this lead."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!date || mutation.isPending} onClick={() => mutation.mutate(date)}>
            {mutation.isPending ? "Saving…" : "Schedule"}
          </Button>
        </>
      }
    >
      <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} autoFocus />
    </Modal>
  );
}
