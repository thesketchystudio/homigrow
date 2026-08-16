// components/shared/EmptyState.tsx
// Shown on every query surface when a list/table has no rows to display.

import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";

export type EmptyStateProps = {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  action?: ReactNode;
};

export default function EmptyState({ icon: Icon = Inbox, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        {body && <p className="text-muted-foreground text-sm">{body}</p>}
      </div>
      {action}
    </div>
  );
}
