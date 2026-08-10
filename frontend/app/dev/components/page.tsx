// app/dev/components/page.tsx
// TEMPORARY — Tier 0/1 component gallery required as a verification
// artifact ("Tier 0+1 components render in a storybook-like
// /dev/components page"). Delete this route before production.

"use client";

import { useState } from "react";
import { Building2, LayoutDashboard, Users2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/shared/Sidebar";
import PropertyCard, { type PropertyCardData } from "@/components/shared/PropertyCard";
import Modal from "@/components/shared/Modal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import SharedTable, { type TableColumn } from "@/components/shared/Table";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import StatusPill, { leadStatusPillMap, propertyStatusPillMap } from "@/components/shared/StatusPill";
import { toast } from "@/lib/toast";
import { PropertyStatus, LeadStatus } from "@/lib/enums";

const SAMPLE_PROPERTY: PropertyCardData = {
  id: "p1",
  title: "The Meridian Estate",
  imageUrl: "/homepage/modern-mansion.png",
  price: "₹2,45,000/mo",
  location: "Indiranagar, Bengaluru",
  bhk: 4,
  areaSqft: 4500,
  href: "#",
};

type Row = { id: string; name: string; status: PropertyStatus };
const ROWS: Row[] = [
  { id: "1", name: "The Meridian Estate", status: PropertyStatus.active },
  { id: "2", name: "Aravali Sky Residences", status: PropertyStatus.pending },
  { id: "3", name: "The Glass Penthouse", status: PropertyStatus.sold },
];
const COLUMNS: TableColumn<Row>[] = [
  { key: "name", header: "Property", render: (r) => r.name, sortable: true },
  { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} map={propertyStatusPillMap} /> },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function ComponentGalleryPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 p-8">
      <h1 className="text-2xl font-bold">Tier 0/1 Component Gallery (temp — delete before prod)</h1>

      <Section title="Sidebar (T23)">
        <div className="relative h-64 overflow-hidden rounded-lg border contain-[layout]">
          <SidebarProvider className="min-h-0">
            <AppSidebar
              activeRoute="/broker/dashboard"
              header={<span className="px-2 text-sm font-semibold">Homigrow Broker</span>}
              groups={[
                {
                  items: [
                    { label: "Dashboard", href: "/broker/dashboard", icon: LayoutDashboard },
                    { label: "Listings", href: "/broker/listings", icon: Building2, badge: 12 },
                    { label: "Leads", href: "/broker/leads", icon: Users2 },
                  ],
                },
              ]}
            />
            <SidebarInset>
              <header className="flex h-14 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <span className="text-sm font-medium">Broker Portal</span>
              </header>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </Section>

      <Section title="PropertyCard (T24) — sm/md, saved-toggled, sold overlay">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PropertyCard property={SAMPLE_PROPERTY} size="md" isSaved={saved} onToggleSave={() => setSaved((v) => !v)} badge={{ label: "Premium Curation" }} />
          <PropertyCard property={SAMPLE_PROPERTY} size="sm" />
          <PropertyCard property={{ ...SAMPLE_PROPERTY, id: "p2", status: PropertyStatus.sold }} size="md" onToggleSave={() => {}} />
        </div>
      </Section>

      <Section title="Modal / Drawer (T25)">
        <div className="flex gap-3">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>Open drawer</Button>
        </div>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Filter properties" description="Example modal content.">
          <p className="text-muted-foreground text-sm">Filters go here.</p>
        </Modal>
        <Modal open={drawerOpen} onClose={() => setDrawerOpen(false)} variant="drawer" side="right" title="Compare">
          <p className="text-muted-foreground text-sm">Compare drawer content.</p>
        </Modal>
      </Section>

      <Section title="Toast system (T26)">
        <div className="flex gap-3">
          <Button onClick={() => toast.success("Listing published")}>Success</Button>
          <Button variant="destructive" onClick={() => toast.error("Upload failed")}>Error</Button>
          <Button variant="outline" onClick={() => toast.info("Draft autosaved")}>Info</Button>
        </div>
      </Section>

      <Section title="Table (T27) — loading / data / empty / error">
        <SharedTable columns={COLUMNS} data={[]} rowKey={(r) => r.id} isLoading />
        <SharedTable columns={COLUMNS} data={ROWS} rowKey={(r) => r.id} />
        <SharedTable columns={COLUMNS} data={[]} rowKey={(r) => r.id} emptyTitle="No listings yet" emptyBody="Post your first property to see it here." />
        <SharedTable columns={COLUMNS} data={[]} rowKey={(r) => r.id} error="Could not reach the server." />
      </Section>

      <Section title="EmptyState / ErrorState (T27)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border"><EmptyState title="No saved properties" body="Properties you save will show up here." /></div>
          <div className="rounded-lg border"><ErrorState title="Something went wrong" body="Please try again." /></div>
        </div>
      </Section>

      <Section title="ConfirmDialog (T27)">
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>Delete listing</Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete this listing?"
          body="This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => new Promise((resolve) => setTimeout(resolve, 800))}
        />
      </Section>

      <Section title="StatusPill (T27) — every enum value, incl. unknown fallback">
        <div className="flex flex-wrap gap-2">
          {Object.values(PropertyStatus).map((s) => (
            <StatusPill key={s} value={s} map={propertyStatusPillMap} />
          ))}
          {Object.values(LeadStatus).map((s) => (
            <StatusPill key={s} value={s} map={leadStatusPillMap} />
          ))}
          <StatusPill value="unmapped_value" map={propertyStatusPillMap} />
        </div>
      </Section>
    </div>
  );
}
