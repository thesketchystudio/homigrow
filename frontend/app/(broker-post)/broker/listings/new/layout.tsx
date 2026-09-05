// app/(broker-post)/broker/listings/new/layout.tsx
// Standalone chrome for the Post Property wizard — a separate route group
// from app/(broker)/broker (which owns every other /broker/* page and its
// sidebar shell) so this exact URL gets its own layout tree. Figma's
// wizard screens (node 612:770) have no sidebar at all: just a centered
// logo header and a light footer around the form. Still gated by
// AuthGuard like every other broker page.

"use client";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { PostPropertyHeader, PostPropertyFooter } from "@/features/broker/post-property/PostPropertyChrome";
import { UserRole } from "@/lib/enums";

export default function PostPropertyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[UserRole.broker]}>
      <div className="flex min-h-svh flex-col bg-background">
        <PostPropertyHeader />
        <main className="flex flex-1 justify-center px-[150px] py-16">
          <div className="w-full max-w-[1100px]">{children}</div>
        </main>
        <PostPropertyFooter />
      </div>
    </AuthGuard>
  );
}
