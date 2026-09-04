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

  // previewUrls is state, not a useMemo derived from `images`, because the
  // object URLs must be created and revoked together inside the same effect
  // run. A useMemo-computed value revoked by a separate cleanup-only effect
  // breaks under React 18 StrictMode in dev: mount fires the effect once,
  // then StrictMode immediately replays cleanup+setup to check for missing
  // cleanup — the phantom cleanup revokes the very URLs already painted to
  // the DOM, and since the memo's inputs never changed, nothing recreates
  // them until the images array itself changes (which is why they'd only
  // reappear after adding/removing a file). Creating fresh URLs inside the
  // effect body itself means the phantom replay just swaps in a second,
  // still-valid batch instead of leaving the visible one revoked.
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [images]);

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
