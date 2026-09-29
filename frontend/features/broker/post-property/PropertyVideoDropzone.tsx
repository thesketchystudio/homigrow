// features/broker/post-property/PropertyVideoDropzone.tsx
// Single-file drag/drop-or-click upload box for the Media step's property
// video/walkthrough section. Not a PropertyMediaDropzone reuse — that
// component's preview tiles render an <img>, which breaks on a video file,
// and it's built around a File[] array rather than one optional file.
// Mirrors BrokerDocumentDropzone.tsx's single-file selected/unselected
// visual states instead.

"use client";

import { useRef, useState } from "react";
import { CircleCheck, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PropertyVideoDropzoneProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
};

export function PropertyVideoDropzone({ file, onChange, error }: PropertyVideoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const selectFile = (selected: File | undefined) => {
    if (selected) onChange(selected);
  };

  return (
    <div className="flex flex-col gap-2">
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
          selectFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-lg border-[1.5px] border-dashed px-[25px] py-10 text-center transition-colors",
          error ? "border-destructive" : isDragOver ? "border-brand-green-600 bg-brand-green-100" : "border-brand-primary-200 bg-background",
        )}
      >
        {file ? (
          <>
            <div className="flex size-5 items-center justify-center rounded-full bg-brand-green-600">
              <CircleCheck size={14} className="text-background" />
            </div>
            <p className="max-w-[280px] truncate font-heading text-[14px] font-bold text-foreground">{file.name}</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
              className="flex items-center gap-1 font-body text-[12px] text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
              Remove
            </button>
          </>
        ) : (
          <>
            <Upload size={24} className="text-brand-primary-100" />
            <div className="flex flex-col gap-2">
              <p className="font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-secondary-900">Upload Property Video</p>
              <p className="font-body text-[12px] text-brand-primary-300">Drag & drop or browse — MP4 or MOV, max 100MB</p>
            </div>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime"
        className="hidden"
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
