// features/broker/post-property/JVPartnersSection.tsx
// Revealed by Property Info Step's "Is this a JV Property?" toggle (Sell
// listings only) — repeatable partner rows, a commission-mode choice, and
// the JV agreement document. The document itself is held as a plain File
// by the wizard and uploaded via POST /properties/{id}/jv-agreement after
// the property is created (same deferred-upload pattern as wizard photos),
// so this component only manages local array/file state, not react-hook-
// form registration — consistent with how ChecklistGroup's array fields
// are threaded through the parent form via setValue rather than nested
// field-array bindings.

"use client";

import { useRef } from "react";
import { FileText, Plus, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JVPartnerValues } from "@/lib/validation/postProperty";

const EMPTY_PARTNER: JVPartnerValues = {
  name: "",
  role: "",
  split_percent: undefined,
  email: "",
  can_edit: false,
  can_approve: false,
  can_publish: false,
};

type JVPartnersSectionProps = {
  partners: JVPartnerValues[];
  onPartnersChange: (partners: JVPartnerValues[]) => void;
  commissionMode: "auto" | "manual" | undefined;
  onCommissionModeChange: (mode: "auto" | "manual") => void;
  agreementFile: File | null;
  onAgreementFileChange: (file: File | null) => void;
};

const PERMISSION_OPTIONS: { key: keyof Pick<JVPartnerValues, "can_edit" | "can_approve" | "can_publish">; label: string }[] = [
  { key: "can_edit", label: "Can edit listing" },
  { key: "can_approve", label: "Can approve changes" },
  { key: "can_publish", label: "Can publish listing" },
];

export function JVPartnersSection({
  partners,
  onPartnersChange,
  commissionMode,
  onCommissionModeChange,
  agreementFile,
  onAgreementFileChange,
}: JVPartnersSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rows = partners.length > 0 ? partners : [EMPTY_PARTNER];

  const updatePartner = (index: number, patch: Partial<JVPartnerValues>) => {
    const next = rows.map((partner, i) => (i === index ? { ...partner, ...patch } : partner));
    onPartnersChange(next);
  };

  const addPartner = () => onPartnersChange([...rows, { ...EMPTY_PARTNER }]);
  const removePartner = (index: number) => onPartnersChange(rows.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-8 border-t border-border pt-8">
      <div className="flex flex-col gap-1">
        <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Joint Venture Partners</span>
      </div>

      {rows.map((partner, index) => (
        <div key={index} className="flex flex-col gap-6 rounded-md border border-border p-6">
          {rows.length > 1 && (
            <div className="flex justify-end">
              <button type="button" onClick={() => removePartner(index)} className="text-muted-foreground" aria-label="Remove partner">
                <X size={16} />
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <span className="font-body font-bold text-[12px] leading-[18px] text-brand-primary-100">Partner Name</span>
              <input
                value={partner.name}
                onChange={(event) => updatePartner(index, { name: event.target.value })}
                placeholder="Enter partner name"
                className="w-full border-b border-foreground bg-transparent pb-[5px] pt-1 font-heading text-[20px] leading-[28px] text-foreground outline-none placeholder:text-brand-secondary-700 focus:border-brand-green-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <span className="font-body font-bold text-[12px] leading-[18px] text-brand-primary-100">Role</span>
                <input
                  value={partner.role ?? ""}
                  onChange={(event) => updatePartner(index, { role: event.target.value })}
                  placeholder="e.g. Co-developer"
                  className="w-full border-b border-foreground bg-transparent pb-[5px] pt-1 font-heading text-[20px] leading-[28px] text-foreground outline-none placeholder:text-brand-secondary-700 focus:border-brand-green-600"
                />
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-body font-bold text-[12px] leading-[18px] text-brand-primary-100">Split %</span>
                <input
                  type="number"
                  value={partner.split_percent ?? ""}
                  onChange={(event) => updatePartner(index, { split_percent: event.target.value === "" ? undefined : Number(event.target.value) })}
                  placeholder="e.g. 40"
                  className="w-full border-b border-foreground bg-transparent pb-[5px] pt-1 font-heading text-[20px] leading-[28px] text-foreground outline-none placeholder:text-brand-secondary-700 focus:border-brand-green-600"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-body font-bold text-[12px] leading-[18px] text-brand-primary-100">Contact Email</span>
            <input
              type="email"
              value={partner.email ?? ""}
              onChange={(event) => updatePartner(index, { email: event.target.value })}
              placeholder="partner@example.com"
              className="w-full border-b border-foreground bg-transparent pb-[5px] pt-1 font-heading text-[20px] leading-[28px] text-foreground outline-none placeholder:text-brand-secondary-700 focus:border-brand-green-600"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Permissions</span>
            {PERMISSION_OPTIONS.map((option) => (
              <label key={option.key} className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  checked={partner[option.key]}
                  onChange={(event) => updatePartner(index, { [option.key]: event.target.checked } as Partial<JVPartnerValues>)}
                  className="size-4"
                />
                <span className="font-body text-[14px] text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPartner}
        className="flex w-fit items-center gap-2 font-heading text-[14px] font-bold text-brand-green-800"
      >
        <Plus size={16} /> Add Partner
      </button>

      <div className="flex flex-col gap-3">
        <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Commission Split Configuration</span>
        <div className="flex w-fit rounded-md border border-border p-1">
          {([{ value: "auto", label: "Auto-calculate" }, { value: "manual", label: "Manual Entry" }] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onCommissionModeChange(option.value)}
              className={cn(
                "rounded px-4 py-1.5 font-heading text-[14px] font-bold",
                commissionMode === option.value ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="font-body text-[12px] text-muted-foreground">Commission will be automatically calculated based on partner split percentages.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">JV Agreement Document</span>
          <span className="font-body text-[12px] text-muted-foreground">For internal use only — not visible to buyers</span>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border-[1.5px] border-dashed border-brand-primary-200 bg-background px-6 py-8 text-center"
        >
          {agreementFile ? (
            <>
              <FileText size={20} className="text-brand-primary-100" />
              <p className="font-heading text-[14px] font-bold text-brand-secondary-900">{agreementFile.name}</p>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onAgreementFileChange(null);
                }}
                className="font-body text-[12px] text-destructive"
              >
                Remove
              </span>
            </>
          ) : (
            <>
              <Upload size={20} className="text-brand-primary-100" />
              <p className="font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-secondary-900">Upload JV Agreement</p>
              <p className="font-body text-[12px] text-brand-primary-300">PDF, DOC, or DOCX (Max 10MB)</p>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onAgreementFileChange(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
