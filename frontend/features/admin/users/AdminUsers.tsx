// features/admin/users/AdminUsers.tsx
// All Users (Figma nodes 328:830 / 328:1206): header stats, search, the
// All/Clients/Brokers filter, and the users table with a per-row menu
// (View Profile, View Listings for brokers, Suspend / Reinstate). Admin
// accounts are never listed. The design's Rating and Reports columns and
// "Reported Users" card are left out: the platform has no broker ratings
// or user reports to show, and invented numbers would mislead moderators.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { House, MoreHorizontal, ShieldCheck, ShieldOff } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";
import StatusPill from "@/components/shared/StatusPill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { listAdminUsers, type AdminUser } from "@/lib/api/endpoints/admin";
import { AdminAccountStatus, UserRole, VerificationStatus } from "@/lib/enums";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { cn, initials } from "@/lib/utils";
import { AdminLoadError, AdminPageHeader, AdminStatCard } from "@/features/admin/AdminChrome";
import { AdminPager, AdminSearchInput, AdminSegmentedFilter } from "@/features/admin/AdminControls";
import { ADMIN_PILL_CLASS, adminAccountStatusMap } from "@/features/admin/adminStatus";
import { formatMonthYear } from "@/features/admin/format";
import { ADMIN_USERS_KEY } from "@/features/admin/queryKeys";
import {
  ReinstateUserDialog,
  SuspendUserDialog,
  UserProfileDialog,
  type UserTarget,
} from "@/features/admin/users/UserDialogs";

const PAGE_SIZE = 25;

type RoleFilter = "all" | "client" | "broker";

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "client", label: "Clients" },
  { value: "broker", label: "Brokers" },
];

const headClassName = "px-5 py-4 text-left font-heading text-[10px] font-bold uppercase tracking-[1.4px] text-slate-500";

function displayName(user: AdminUser): string {
  return user.full_name || user.email || user.phone || "Unnamed user";
}

export function AdminUsers() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role");
  const role: RoleFilter = roleParam === "client" || roleParam === "broker" ? roleParam : "all";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const urlQuery = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(urlQuery);
  const debouncedSearch = useDebouncedValue(search.trim());

  const [profileTarget, setProfileTarget] = useState<UserTarget | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<UserTarget | null>(null);
  const [reinstateTarget, setReinstateTarget] = useState<UserTarget | null>(null);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (debouncedSearch === urlQuery) return;
    const next = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [debouncedSearch, urlQuery, searchParams, pathname, router]);

  const query = { role: role === "all" ? undefined : role, q: urlQuery || undefined, page, page_size: PAGE_SIZE };
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...ADMIN_USERS_KEY, "list", query],
    queryFn: () => listAdminUsers(query),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader eyebrow="User Management" title="All Users" subtitle="Manage clients, brokers, and account status" />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="Total Users" value={data ? data.stats.total_users.toLocaleString("en-IN") : "—"} />
        <AdminStatCard label="Active Brokers" value={data ? data.stats.active_brokers.toLocaleString("en-IN") : "—"} />
        <AdminStatCard label="Pending Verification" value={data ? data.stats.pending_verification.toLocaleString("en-IN") : "—"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search users…" />
        <AdminSegmentedFilter
          ariaLabel="Filter by role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(value) => updateParams({ role: value === "all" ? null : value, page: null })}
        />
      </div>

      {isError && <AdminLoadError title="Couldn't load users" onRetry={() => refetch()} />}
      {isLoading && <Skeleton className="h-[480px] rounded-[6px]" />}
      {data && data.items.length === 0 && <EmptyState title="No users match" body="Try a different search or filter." />}

      {data && data.items.length > 0 && (
        <div className="overflow-x-auto rounded-[6px] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-slate-100">
              <tr>
                <th className={headClassName}>User</th>
                <th className={headClassName}>Role</th>
                <th className={headClassName}>Status</th>
                <th className={headClassName}>Listings</th>
                <th className={headClassName}>Verified</th>
                <th className={headClassName}>Joined</th>
                <th className={headClassName} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onViewProfile={setProfileTarget}
                  onSuspend={setSuspendTarget}
                  onReinstate={setReinstateTarget}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <AdminPager page={page} totalPages={data.total_pages} onPageChange={(next) => updateParams({ page: String(next) })} />}

      <UserProfileDialog target={profileTarget} onClose={() => setProfileTarget(null)} />
      <SuspendUserDialog target={suspendTarget} onClose={() => setSuspendTarget(null)} />
      <ReinstateUserDialog target={reinstateTarget} onClose={() => setReinstateTarget(null)} />
    </div>
  );
}

function UserRow({
  user,
  onViewProfile,
  onSuspend,
  onReinstate,
}: {
  user: AdminUser;
  onViewProfile: (target: UserTarget) => void;
  onSuspend: (target: UserTarget) => void;
  onReinstate: (target: UserTarget) => void;
}) {
  const name = displayName(user);
  const target = { id: user.id, name };
  const isBroker = user.role === UserRole.broker;
  const muted = user.status === AdminAccountStatus.suspended || user.status === AdminAccountStatus.deactivated;
  const verified = isBroker && user.verification_status === VerificationStatus.verified;

  return (
    <tr className={cn("border-b border-slate-100 last:border-0", muted && "opacity-60")}>
      <td className="max-w-[320px] px-5 py-4">
        {/* Capped width so an unbroken long name truncates instead of pushing the other columns off-screen. */}
        <div className="flex min-w-0 items-center gap-3" title={name}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-800 font-heading text-[11px] font-bold text-white">
            {initials(user.full_name ?? user.email ?? undefined)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-heading text-[14px] font-bold text-brand-primary-600">{name}</span>
            <span className="truncate font-body text-[12px] text-slate-500">{user.email || user.phone}</span>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span
          className={cn(
            "rounded-[3px] px-2 py-1 font-heading text-[9px] font-bold uppercase tracking-[1px]",
            isBroker ? "bg-brand-primary-800 text-white" : "border border-slate-300 text-slate-500",
          )}
        >
          {isBroker ? "Broker" : "Client"}
        </span>
      </td>
      <td className="px-5 py-4">
        <StatusPill value={user.status} map={adminAccountStatusMap} className={ADMIN_PILL_CLASS} />
      </td>
      <td className="px-5 py-4">
        <span className="flex items-center gap-1.5 font-heading text-[13px] text-brand-primary-600">
          <House size={12} className="text-slate-400" /> {user.listings_count}
        </span>
      </td>
      <td className="px-5 py-4">
        {verified ? (
          <ShieldCheck size={16} className="text-emerald-600" aria-label="Verified broker" />
        ) : (
          <ShieldOff size={16} className="text-slate-300" aria-label="Not verified" />
        )}
      </td>
      <td className="px-5 py-4 font-body text-[13px] text-slate-500">{formatMonthYear(user.created_at)}</td>
      <td className="px-5 py-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded p-1 text-slate-400 outline-none hover:text-brand-primary-600" aria-label={`Actions for ${name}`}>
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onViewProfile(target)}>View Profile</DropdownMenuItem>
            {isBroker && (
              <DropdownMenuItem asChild>
                <Link href={`/admin/listings?broker_id=${user.id}&broker_name=${encodeURIComponent(name)}`}>View Listings</Link>
              </DropdownMenuItem>
            )}
            {(user.status === AdminAccountStatus.active || user.status === AdminAccountStatus.pending) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onSuspend(target)} className="text-destructive focus:text-destructive">
                  Suspend User
                </DropdownMenuItem>
              </>
            )}
            {user.status === AdminAccountStatus.suspended && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onReinstate(target)}>Reinstate User</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
