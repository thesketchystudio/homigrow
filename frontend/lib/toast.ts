// lib/toast.ts
// Typed entrypoint for the app-wide toast queue. sonner (mounted once via
// <Toaster/> in the root layout) already handles stacking, auto-dismiss,
// and aria-live — this just constrains callers to the three variants the
// component library defines instead of sonner's full API surface.

import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
};
