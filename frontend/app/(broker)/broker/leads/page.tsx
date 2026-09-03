// app/(broker)/broker/leads/page.tsx
// Real lead pipeline (LeadStatus board, notes, etc.) is future work. This
// route only makes sense as an onboarding nudge for a broker with zero
// listings — BrokerLayout's sidebar already gates navigation on that, but
// this self-corrects the same way for a direct visit (typed URL, back
// button) so a broker who already has listings never sees a stale "no
// leads yet, add a property" pitch once that's no longer their situation.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { BrokerEmptyState } from "@/features/broker/BrokerEmptyState";
import { listMyProperties } from "@/lib/api/endpoints/properties";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "@/lib/toast";

export default function BrokerLeadsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useQuery({ queryKey: ["broker-my-properties"], queryFn: listMyProperties });
  const hasListings = (data?.length ?? 0) > 0;

  useEffect(() => {
    if (!isLoading && hasListings) {
      toast.info("Coming soon — this page isn't built yet.");
      router.replace("/broker/dashboard");
    }
  }, [isLoading, hasListings, router]);

  if (isLoading || hasListings) return null;

  return <BrokerEmptyState name={user?.full_name} body="No leads yet. Add a property to start receiving enquiries." />;
}
