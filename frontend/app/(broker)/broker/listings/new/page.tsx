// app/(broker)/broker/listings/new/page.tsx
// Post Property entry point — gated by BrokerLayout's AuthGuard.

import { PostPropertyWizard } from "@/features/broker/post-property/PostPropertyWizard";

export default function PostPropertyPage() {
  return (
    <div className="mx-auto w-full max-w-[900px]">
      <PostPropertyWizard />
    </div>
  );
}
