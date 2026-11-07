// components/shared/Modal.tsx
// Shared modal/drawer used across all portals (filters, compare drawer,
// boost checkout, confirmations). Wraps shadcn's Dialog for the centered
// "modal" variant and Drawer (vaul) for the slide-in "drawer" variant —
// both already provide focus trap, Esc-to-close, and scroll lock via Radix.

"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const MODAL_SIZE_CLASS = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  full: "sm:max-w-[calc(100%-2rem)] h-[calc(100%-2rem)]",
} as const;

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  variant?: "modal" | "drawer";
  side?: "top" | "bottom" | "left" | "right";
  size?: keyof typeof MODAL_SIZE_CLASS;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

// A modal renders in a portal, but React still bubbles its events through the
// component tree, so a form inside a modal that is itself opened from within
// another form would also submit that outer form. Stopping the submit event at
// the modal keeps each form's submission its own.
const keepSubmitInsideModal = (event: { stopPropagation: () => void }) => event.stopPropagation();

export default function Modal({
  open,
  onClose,
  variant = "modal",
  side = "right",
  size = "md",
  title,
  description,
  footer,
  children,
}: ModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  if (variant === "drawer") {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} direction={side}>
        <DrawerContent onSubmit={keepSubmitInsideModal}>
          {(title || description) && (
            <DrawerHeader>
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          <div className="overflow-y-auto px-4">{children}</div>
          {footer && <DrawerFooter>{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(MODAL_SIZE_CLASS[size])} onSubmit={keepSubmitInsideModal}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
