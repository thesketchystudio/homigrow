// features/broker/leads/LeadActionDialogs.tsx
// Quick-action dialogs behind the Leads table's row icons (Figma node
// 176:1505): logging a note and setting a follow-up date are single-field,
// submit-on-click dialogs — Figma's table row only shows those two actions
// plus a call icon, with no separate detail screen in this frame to build
// against. LeadDetailDialog is a later addition (GET /leads/{id} existed
// with no frontend caller at all) — a read-only view of the lead's full
// contact info and note history, not a Figma pull.

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Modal from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { addLeadNote, getLead, updateLead } from "@/lib/api/endpoints/leads";
import { toast } from "@/lib/toast";
import { LEADS_QUERY_KEY } from "@/features/broker/leads/queryKey";
import { formatRelativeTime } from "@/lib/utils";

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

type LeadDetailDialogProps = {
  leadId: string | null;
  onClose: () => void;
};

export function LeadDetailDialog({ leadId, onClose }: LeadDetailDialogProps) {
  const { data: lead, isLoading } = useQuery({
    queryKey: [...LEADS_QUERY_KEY, leadId],
    queryFn: () => getLead(leadId as string),
    enabled: leadId !== null,
  });

  return (
    <Modal open={leadId !== null} onClose={onClose} title="Lead details" description="Full contact info and note history for this lead.">
      {isLoading || !lead ? (
        <p className="font-body text-[13px] text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-heading text-[14px] font-medium text-foreground">{lead.contact_name ?? "Unknown"}</span>
            <span className="font-body text-[13px] text-muted-foreground">{lead.contact_phone ?? "No phone on file"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-body text-[11px] font-bold uppercase tracking-[1px] text-muted-foreground">Interested in</span>
            <span className="font-body text-[13px] text-foreground">{lead.property_title}</span>
          </div>
          {lead.message && (
            <div className="flex flex-col gap-1">
              <span className="font-body text-[11px] font-bold uppercase tracking-[1px] text-muted-foreground">Message</span>
              <p className="font-body text-[13px] text-foreground">{lead.message}</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <span className="font-body text-[11px] font-bold uppercase tracking-[1px] text-muted-foreground">Notes</span>
            {lead.notes.length === 0 ? (
              <p className="font-body text-[13px] text-muted-foreground">No notes yet.</p>
            ) : (
              lead.notes.map((note) => (
                <div key={note.id} className="rounded-md border border-border p-2">
                  <p className="font-body text-[13px] text-foreground">{note.body}</p>
                  <p className="font-body text-[11px] text-muted-foreground">
                    {note.author_name ?? "Unknown"} · {formatRelativeTime(note.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
