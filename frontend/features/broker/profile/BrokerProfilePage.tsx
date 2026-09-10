// features/broker/profile/BrokerProfilePage.tsx
// Broker Profile page (Figma "Real Estate Broker Portal > Profile", node
// 177:2805) — the sidebar/app-shell chrome in that export is the broker
// portal's own shared AppSidebar (app/(broker)/broker/layout.tsx), so this
// file only builds the Profile content area itself.
//
// Only the Overview tab has a real Figma design at this node; Settings and
// Subscription toast "coming soon", same pattern the broker layout already
// uses for unbuilt nav destinations.
//
// Several Figma sections have no backing data model at all — Avg Rating,
// the Recent Activity feed, and NAR/MagicBricks-style third-party
// certifications. Rather than fabricate numbers, those are omitted or shown
// as an honest empty state: Active Listings/Leads Closed/Properties Sold
// are computed live from the broker's own properties/leads; Certifications
// shows only the real RERA registration (BrokerProfile.rera_number); Expertise
// shows only Primary Cities (service_areas) and Member Since (created_at).

"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Users2,
  XCircle,
} from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditBrokerProfileDialog } from "@/features/broker/profile/EditBrokerProfileDialog";
import { listMyProperties } from "@/lib/api/endpoints/properties";
import { listLeads } from "@/lib/api/endpoints/leads";
import { getMe } from "@/lib/api/endpoints/users";
import { LeadStatus, PropertyStatus, VerificationStatus } from "@/lib/enums";
import { toast } from "@/lib/toast";
import { cn, initials } from "@/lib/utils";

const VERIFICATION_BADGE: Record<VerificationStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  [VerificationStatus.verified]: { label: "Verified", icon: CheckCircle2, className: "border-transparent bg-emerald-100 text-emerald-800" },
  [VerificationStatus.pending]: { label: "Verification Pending", icon: Clock, className: "border-transparent bg-amber-100 text-amber-800" },
  [VerificationStatus.unverified]: { label: "Not Verified", icon: ShieldAlert, className: "border-transparent bg-slate-100 text-slate-700" },
  [VerificationStatus.rejected]: { label: "Verification Rejected", icon: XCircle, className: "border-transparent bg-red-100 text-red-800" },
};

const TABS = ["Overview", "Settings", "Subscription"] as const;

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-lg border border-brand-secondary-500 bg-white p-6", className)}>
      <h2 className="font-heading text-[16px] font-medium text-brand-primary-400">{title}</h2>
      {children}
    </div>
  );
}

function StatChip({ icon: Icon, value, label }: { icon: typeof Building2; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-brand-secondary-500 bg-brand-secondary-100 px-3.5 py-2">
      <Icon className="size-3.5 text-brand-primary-300" />
      <span className="font-heading text-[14px] font-medium text-brand-primary-400">{value}</span>
      <span className="font-body text-[12px] text-brand-primary-300">{label}</span>
    </div>
  );
}

function QuickLinkRow({ href, icon: Icon, label }: { href: string; icon: typeof Building2; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-brand-secondary-500 px-5 py-3.5 font-body text-[13px] font-medium text-brand-primary-400 last:border-b-0 hover:bg-brand-secondary-100"
    >
      <span className="flex items-center gap-2.5">
        <Icon className="size-4" />
        {label}
      </span>
      <ChevronRight className="size-4 text-brand-primary-300" />
    </Link>
  );
}

function BrokerProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 rounded-lg border border-brand-secondary-500 bg-white p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex flex-col gap-2 pt-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-32 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_342px]">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function BrokerProfilePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [editOpen, setEditOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: properties, isLoading: propertiesLoading } = useQuery({ queryKey: ["broker-my-properties"], queryFn: listMyProperties });
  const { data: leads, isLoading: leadsLoading } = useQuery({ queryKey: ["broker-leads"], queryFn: listLeads });

  if (userLoading || !user || propertiesLoading || leadsLoading) {
    return <BrokerProfileSkeleton />;
  }

  const broker = user.broker_profile;
  const activeListings = (properties ?? []).filter((p) => p.status === PropertyStatus.active).length;
  const propertiesSold = (properties ?? []).filter((p) => p.status === PropertyStatus.sold).length;
  const leadsClosed = (leads ?? []).filter((l) => l.status === LeadStatus.closed_won).length;

  const city = typeof user.preferences?.city === "string" ? user.preferences.city : "";
  const state = typeof user.preferences?.state === "string" ? user.preferences.state : "";
  const locationLabel = [city, state].filter(Boolean).join(", ");

  const subtitleParts = [
    broker?.company_name || "Real Estate Broker",
    broker?.experience_years != null ? `${broker.experience_years} years experience` : null,
  ].filter(Boolean);

  const verification = VERIFICATION_BADGE[broker?.verification_status ?? VerificationStatus.unverified];
  const VerificationIcon = verification.icon;

  const specializations = broker?.specializations ?? [];
  const serviceAreas = broker?.service_areas ?? [];
  const memberSince = new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const handleUnbuiltTab = (nextTab: (typeof TABS)[number]) => {
    if (nextTab === "Overview") {
      setTab(nextTab);
      return;
    }
    toast.info("Coming soon — this page isn't built yet.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 rounded-lg border border-brand-secondary-500 bg-white p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-5">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex size-20 items-center justify-center rounded-full bg-brand-primary-400"
                aria-label="Edit profile photo"
              >
                <span className="font-heading text-[28px] font-bold text-white">{initials(user.full_name)}</span>
              </button>
              <span className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                <Camera className="size-3.5 text-white" />
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-[24px] font-medium text-brand-primary-400">{user.full_name ?? "Broker"}</h1>
                <Badge variant="outline" className={cn("gap-1", verification.className)}>
                  <VerificationIcon className="size-3" />
                  {verification.label}
                </Badge>
              </div>
              {subtitleParts.length > 0 && <p className="font-body text-[14px] text-brand-primary-300">{subtitleParts.join(" · ")}</p>}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                {locationLabel && (
                  <span className="flex items-center gap-1.5 font-body text-[13px] text-brand-primary-300">
                    <MapPin className="size-3.5" />
                    {locationLabel}
                  </span>
                )}
                {user.phone && (
                  <span className="flex items-center gap-1.5 font-body text-[13px] text-brand-primary-300">
                    <Phone className="size-3.5" />
                    {user.phone}
                  </span>
                )}
                {user.email && (
                  <span className="flex items-center gap-1.5 font-body text-[13px] text-brand-primary-300">
                    <Mail className="size-3.5" />
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit Profile
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-brand-secondary-500 pt-4">
          <StatChip icon={Building2} value={activeListings} label="Active Listings" />
          <StatChip icon={Users2} value={leadsClosed} label="Leads Closed" />
          <StatChip icon={FileText} value={propertiesSold} label="Properties Sold" />
        </div>

        <div className="flex gap-1 border-t border-brand-secondary-500 pt-4">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleUnbuiltTab(item)}
              className={cn(
                "rounded-md px-4 py-2 font-body text-[13px] font-medium",
                item === tab ? "bg-brand-primary-400 text-white" : "text-brand-primary-300 hover:text-brand-primary-400",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_342px]">
        <div className="flex flex-col gap-5">
          <SectionCard title="About">
            <p className="font-body text-[14px] leading-[22.75px] text-brand-primary-300">
              {broker?.bio || "No bio added yet."}
            </p>
            {specializations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {specializations.map((item) => (
                  <span key={item} className="rounded-[4px] bg-[#f3f4f6] px-2.5 py-1 font-body text-[12px] text-brand-primary-400">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent Activity">
            <EmptyState
              icon={Activity}
              title="Activity tracking is coming soon"
              body="Your recent leads, listing updates, and reviews will show up here."
            />
          </SectionCard>
        </div>

        <div className="flex flex-col gap-5">
          <SectionCard title="Certifications">
            {broker?.rera_number ? (
              <div className="flex items-center gap-3 rounded-lg bg-brand-secondary-100 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-100">
                  <ShieldCheck className="size-4 text-emerald-700" />
                </div>
                <div className="flex flex-col">
                  <span className="font-body text-[13px] font-medium text-brand-primary-400">RERA Registered</span>
                  <span className="font-body text-[11px] text-brand-primary-300">{broker.rera_number}</span>
                </div>
              </div>
            ) : (
              <p className="font-body text-[13px] text-brand-primary-300">No certifications added yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Expertise">
            <div className="flex flex-col gap-1">
              <span className="font-body text-[12px] text-brand-primary-300">Primary Cities</span>
              <span className="font-body text-[13px] font-medium text-brand-primary-400">
                {serviceAreas.length > 0 ? serviceAreas.join(", ") : "Not added yet"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-body text-[12px] text-brand-primary-300">Member Since</span>
              <span className="font-body text-[13px] font-medium text-brand-primary-400">{memberSince}</span>
            </div>
          </SectionCard>

          <SectionCard title="" className="p-0">
            <QuickLinkRow href="/broker/listings" icon={FileText} label="My Listings" />
            <QuickLinkRow href="/broker/leads" icon={Users2} label="Leads" />
            <QuickLinkRow href="/broker/analytics" icon={BarChart3} label="Analytics" />
          </SectionCard>
        </div>
      </div>

      <EditBrokerProfileDialog open={editOpen} onClose={() => setEditOpen(false)} user={user} />
    </div>
  );
}
