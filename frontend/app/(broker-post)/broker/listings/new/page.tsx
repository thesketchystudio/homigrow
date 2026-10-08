// app/(broker-post)/broker/listings/new/page.tsx
// Post Property entry point — chrome (header/footer, AuthGuard, width
// constraint) lives in this route's own layout.tsx, not the Broker
// Portal's sidebar layout.

import { PostPropertyWizard } from "@/features/broker/post-property/PostPropertyWizard";

export default function PostPropertyPage() {
  return <PostPropertyWizard />;
}
