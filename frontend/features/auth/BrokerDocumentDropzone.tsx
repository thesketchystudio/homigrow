// features/auth/BrokerDocumentDropzone.tsx
// Single-file drag/drop-or-click upload box for the broker document
// upload step (Figma: node 431:307/431:319, default + "selected" states
// 431:1299). No existing form primitive supports file upload, so this is
// new. Icons use lucide-react's closest equivalents rather than Figma's
// exported SVGs — same precedent as the homepage "Coming Soon" section's
// icon swap, not a pixel-exact asset pull.

"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type BrokerDocumentDropzoneProps = {
  label: string;
  helperText: string;
  accept: string;
  file: File | null;
  onFileSelected: (file: File) => void;
  error?: string;
};

export function BrokerDocumentDropzone({ label, helperText, accept, file, onFileSelected, error }: BrokerDocumentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          const dropped = event.dataTransfer.files[0];
          if (dropped) onFileSelected(dropped);
        }}
        className={cn(
          "flex h-full flex-col items-center justify-center gap-4 rounded-lg border-[1.5px] border-dashed px-[25px] py-[41px] text-center transition-colors",
          error ? "border-destructive" : isDragOver ? "border-brand-green-600 bg-brand-green-100" : "border-brand-primary-200 bg-background",
        )}
      >
        {file ? (
          <>
            <div className="flex size-5 items-center justify-center rounded-full bg-brand-green-600">
              <CheckCircle2 size={14} className="text-background" />
            </div>
            <p className="max-w-[200px] truncate font-heading text-[14px] font-bold text-foreground">{file.name}</p>
          </>
        ) : (
          <>
            <Upload size={24} className="text-brand-primary-100" />
            <div className="flex flex-col gap-2">
              <p className="font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-secondary-900">{label}</p>
              <p className="font-body text-[12px] text-brand-primary-300">{helperText}</p>
            </div>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onFileSelected(selected);
        }}
      />
      {error && <p className="text-center text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
