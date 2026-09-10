// features/broker/post-property/PropertyMediaDropzone.tsx
// Multi-file drag/drop-or-click upload box for the Post Property
// wizard's Media step. Multi-file variant of the existing
// BrokerDocumentDropzone.tsx (features/auth/), which only accepts one
// file — that one is left untouched since it's a different, already-
// shipped flow (broker verification documents).

"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Each tile owns its own object URL instead of the parent computing one
// array of urls. The URL is created and assigned to the <img> imperatively
// inside an effect (a ref may only be touched outside render, and the linter
// forbids calling setState synchronously inside an effect) — this also
// happens to be what makes it survive React 18 Strict Mode's dev-only
// double-invoke of effects: the phantom replay creates and assigns a fresh
// url rather than revoking the one already painted with nothing to replace
// it, since creation lives in the effect body itself, not in state.
function MediaPreviewTile({ file, isCover, onRemove }: { file: File; isCover: boolean; onRemove: () => void }) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (imgRef.current) imgRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative flex flex-col gap-1">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
        <img ref={imgRef} alt={file.name} className="size-full object-cover" />
        {isCover && (
          <span className="absolute left-1 top-1 rounded bg-foreground px-1.5 py-0.5 font-heading text-[10px] font-bold text-background">
            Cover
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-foreground/80 text-background"
          aria-label={`Remove ${file.name}`}
        >
          <X size={12} />
        </button>
      </div>
      <p className="truncate font-body text-[11px] text-muted-foreground">{file.name}</p>
    </div>
  );
}

type PropertyMediaDropzoneProps = {
  images: File[];
  onChange: (images: File[]) => void;
  error?: string;
  // Below let Hero/Interior/Floor Plans/Video sections reuse this same
  // dropzone with their own Figma copy and accepted file types instead of
  // the hardcoded photo defaults.
  title?: string;
  helperText?: string;
  accept?: string;
  showPreviews?: boolean;
  // Hero Photography caps at 5 per the Figma "0/5 Photos" counter; Interior
  // and Floor Plans have no cap yet, so this is left unset for those.
  maxFiles?: number;
};

export function PropertyMediaDropzone({
  images,
  onChange,
  error,
  title = "Upload Photos",
  helperText = "Drag & drop or browse — JPG, PNG, or WEBP, max 10MB each",
  accept = "image/jpeg,image/png,image/webp",
  showPreviews = true,
  maxFiles,
}: PropertyMediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [capMessage, setCapMessage] = useState<string | undefined>(undefined);
  const isFull = maxFiles !== undefined && images.length >= maxFiles;

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const room = maxFiles === undefined ? incoming.length : Math.max(0, maxFiles - images.length);

    if (room <= 0) {
      setCapMessage(`Maximum ${maxFiles} photos allowed.`);
      return;
    }

    onChange([...images, ...incoming.slice(0, room)]);
    const skipped = incoming.length - room;
    setCapMessage(skipped > 0 ? `${skipped} photo${skipped === 1 ? "" : "s"} skipped — maximum ${maxFiles} photos allowed.` : undefined);
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
    setCapMessage(undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        disabled={isFull}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isFull) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-4 rounded-lg border-[1.5px] border-dashed px-[25px] py-[41px] text-center transition-colors",
          isFull
            ? "cursor-not-allowed border-brand-primary-200 bg-muted opacity-60"
            : error
              ? "border-destructive"
              : isDragOver
                ? "border-brand-green-600 bg-brand-green-100"
                : "border-brand-primary-200 bg-background",
        )}
      >
        <Upload size={24} className="text-brand-primary-100" />
        <div className="flex flex-col gap-2">
          <p className="font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-secondary-900">
            {isFull ? `Maximum ${maxFiles} photos reached` : title}
          </p>
          <p className="font-body text-[12px] text-brand-primary-300">{isFull ? "Remove one to add another." : helperText}</p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        disabled={isFull}
        className="hidden"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {images.length > 0 && showPreviews && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((file, index) => (
            <MediaPreviewTile
              key={`${file.name}-${index}`}
              file={file}
              isCover={index === 0}
              onRemove={() => removeAt(index)}
            />
          ))}
        </div>
      )}

      {images.length > 0 && !showPreviews && (
        <div className="flex flex-col gap-2">
          {images.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <p className="truncate font-body text-[12px] text-foreground">{file.name}</p>
              <button type="button" onClick={() => removeAt(index)} aria-label={`Remove ${file.name}`} className="text-muted-foreground">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <p className="flex items-center gap-2 font-body text-[12px] text-muted-foreground">
          <ImageIcon size={14} /> No files added yet
        </p>
      )}
      {error && <p className="text-[12px] text-destructive">{error}</p>}
      {capMessage && <p className="font-body text-[12px] text-muted-foreground">{capMessage}</p>}
    </div>
  );
}
