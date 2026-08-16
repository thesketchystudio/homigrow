// components/shared/ErrorState.tsx
// Shown on every query surface when a request fails. Distinct from
// EmptyState (which means "succeeded, nothing to show") so callers and
// screen readers can tell "no data" apart from "couldn't load data".

import type { ComponentType, ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

export type ErrorStateProps = {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  action?: ReactNode;
};

export default function ErrorState({ icon: Icon = TriangleAlert, title, body, action }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
        <Icon className="text-destructive size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        {body && <p className="text-muted-foreground text-sm">{body}</p>}
      </div>
      {action}
    </div>
  );
}
