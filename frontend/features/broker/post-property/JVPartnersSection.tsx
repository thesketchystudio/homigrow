// features/broker/post-property/JVPartnersSection.tsx
// Revealed by Property Info Step's "Is this a JV Property?" toggle (Sell
// listings only) — Figma "JV Property" variant (node 619:520): one bordered
// card holding the repeatable partner rows, "+ Add Partner", and Commission
// Split Configuration together (a border-top divider, not a separate
// section), plus a second bordered card for the JV Agreement document. The
// document itself is held as a plain File by the wizard and uploaded via
// POST /properties/{id}/jv-agreement after the property is created (same
// deferred-upload pattern as wizard photos), so this component only manages
// local array/file state, not react-hook-form registration — consistent
// with how ChecklistGroup's array fields are threaded through the parent
// form via setValue rather than nested field-array bindings. Figma only
// mocks a single partner row with no border of its own; multiple rows are
// separated by the same divider style used before Commission Split, rather
// than each getting a full border box, to stay inside that one-card look.

"use client";

import { useRef } from "react";
import { FileText, Upload, X } from "lucide-react";
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

const fieldLabelClassName = "font-heading text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80";
const subLabelClassName = "font-heading text-[9px] font-bold uppercase tracking-[1.5px] text-brand-primary-600/50";
const textInputClassName =
  "w-full border-b border-foreground bg-transparent pb-[5px] pt-2 font-heading text-[16px] leading-[24px] text-foreground outline-none placeholder:text-brand-secondary-700 focus:border-brand-green-600";

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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5 rounded border border-[rgba(198,198,205,0.35)] p-5">
        <span className={subLabelClassName}>Joint Venture Partners</span>

        {rows.map((partner, index) => (
          <div key={index} className={cn("flex flex-col gap-4", index > 0 && "border-t border-[#e0e0e0] pt-4")}>
            {rows.length > 1 && (
              <div className="flex justify-end">
                <button type="button" onClick={() => removePartner(index)} className="text-brand-primary-600/55" aria-label="Remove partner">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <span className={fieldLabelClassName}>Partner Name</span>
              <input
                value={partner.name}
                onChange={(event) => updatePartner(index, { name: event.target.value })}
                placeholder="Enter partner name"
                className={textInputClassName}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <span className={fieldLabelClassName}>Role</span>
                <input
                  value={partner.role ?? ""}
                  onChange={(event) => updatePartner(index, { role: event.target.value })}
                  placeholder="e.g. Co-developer"
                  className={textInputClassName}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className={fieldLabelClassName}>Split %</span>
                <input
                  type="number"
                  value={partner.split_percent ?? ""}
                  onChange={(event) => updatePartner(index, { split_percent: event.target.value === "" ? undefined : Number(event.target.value) })}
                  placeholder="e.g. 40"
                  className={textInputClassName}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className={fieldLabelClassName}>Contact Email</span>
              <input
                type="email"
                value={partner.email ?? ""}
                onChange={(event) => updatePartner(index, { email: event.target.value })}
                placeholder="partner@example.com"
                className={textInputClassName}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <span className={fieldLabelClassName}>Permissions</span>
              {PERMISSION_OPTIONS.map((option) => (
                <label key={option.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={partner[option.key]}
                    onChange={(event) => updatePartner(index, { [option.key]: event.target.checked } as Partial<JVPartnerValues>)}
                    className="size-3.5 rounded-sm border-[#767676]"
                  />
                  <span className="font-body text-[14px] text-brand-primary-600">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button type="button" onClick={addPartner} className="w-fit font-heading text-[13px] font-normal text-brand-primary-600/55">
          + Add Partner
        </button>

        <div className="flex flex-col gap-5 border-t border-[#e0e0e0] py-5">
          <span className={subLabelClassName}>Commission Split Configuration</span>
          <div className="flex items-start gap-2">
            {([{ value: "auto", label: "Auto-calculate" }, { value: "manual", label: "Manual Entry" }] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onCommissionModeChange(option.value)}
                className={cn(
                  "rounded px-5 py-2.5 font-heading text-[13px] font-bold",
                  commissionMode === option.value ? "bg-[#090909] text-white" : "bg-[#f0f0f2] text-brand-primary-600",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="font-body text-[12px] text-brand-primary-600/50">Commission will be automatically calculated based on partner split percentages.</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded border border-[rgba(198,198,205,0.35)] p-5">
        <span className={subLabelClassName}>JV Agreement Document</span>
        <p className="font-body text-[11px] text-brand-primary-600/40">For use only — not visible to buyers</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2.5 rounded border-2 border-dashed border-[rgba(198,198,205,0.5)] bg-background p-8 text-center"
        >
          {agreementFile ? (
            <>
              <FileText size={24} className="text-brand-primary-600" />
              <p className="font-heading text-[13px] font-medium text-brand-primary-600">{agreementFile.name}</p>
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
              <Upload size={24} className="text-brand-primary-600" />
              <p className="font-heading text-[13px] font-medium text-brand-primary-600">Upload JV Agreement</p>
              <p className="font-body text-[11px] text-brand-primary-600/45">PDF, DOC, or DOCX (Max 10MB)</p>
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
