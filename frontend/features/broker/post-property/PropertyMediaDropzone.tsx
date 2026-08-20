// features/broker/post-property/PropertyMediaDropzone.tsx
// Multi-file drag/drop-or-click upload box for the Post Property
// wizard's Media step. Multi-file variant of the existing
// BrokerDocumentDropzone.tsx (features/auth/), which only accepts one
// file — that one is left untouched since it's a different, already-
// shipped flow (broker verification documents).

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PropertyMediaDropzoneProps = {
  images: File[];
  onChange: (images: File[]) => void;
  error?: string;
};

export function PropertyMediaDropzone({ images, onChange, error }: PropertyMediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  // Derived, not state — recomputing only when the file list identity
  // changes (not on every render) is what useMemo is for. Revocation
  // lives in a separate cleanup-only effect below, since setting state
  // from inside an effect body is what actually causes cascading renders.
  const previewUrls = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);

  useEffect(() => {
    return () => {
      for (const url of previewUrls) URL.revokeObjectURL(url);
    };
  }, [previewUrls]);

  const addFiles = (files: FileList | File[]) => {
    onChange([...images, ...Array.from(files)]);
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-4">
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
          if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-4 rounded-lg border-[1.5px] border-dashed px-[25px] py-[41px] text-center transition-colors",
          error ? "border-destructive" : isDragOver ? "border-brand-green-600 bg-brand-green-100" : "border-brand-primary-200 bg-background",
        )}
      >
        <Upload size={24} className="text-brand-primary-100" />
        <div className="flex flex-col gap-2">
          <p className="font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-secondary-900">Upload Photos</p>
          <p className="font-body text-[12px] text-brand-primary-300">Drag & drop or browse — JPG, PNG, or WEBP, max 10MB each</p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative flex flex-col gap-1">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                {previewUrls[index] && <img src={previewUrls[index]} alt={file.name} className="size-full object-cover" />}
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-foreground px-1.5 py-0.5 font-heading text-[10px] font-bold text-background">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-foreground/80 text-background"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={12} />
                </button>
              </div>
              <p className="truncate font-body text-[11px] text-muted-foreground">{file.name}</p>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <p className="flex items-center gap-2 font-body text-[12px] text-muted-foreground">
          <ImageIcon size={14} /> No photos added yet
        </p>
      )}
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
