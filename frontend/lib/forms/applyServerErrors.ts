// lib/forms/applyServerErrors.ts
// Places an API validation error next to the form fields it belongs to.
// A reason for a field the form does not show (or a nested path) would
// otherwise vanish, leaving the user with a form that silently refuses to
// save, so those reasons are shown as a toast instead.

import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import type { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/toast";

export function applyServerErrors<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
): void {
  const unmatched: string[] = [];
  for (const [field, message] of Object.entries(error.fields ?? {})) {
    if (knownFields.includes(field)) setError(field as FieldPath<T>, { message });
    else unmatched.push(message);
  }
  if (unmatched.length > 0) toast.error(error.message);
}
