// features/admin/dashboard/DashboardCharts.tsx
// The dashboard's two charts: a 12-month views-and-leads area chart and a
// listings-by-property-type bar chart. Monochrome to match the design;
// series are told apart by fill as well as shade (views are a filled
// area, leads a plain line), and the
// legend sits in the card header, not only in colour.

"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AdminSummary } from "@/lib/api/endpoints/admin";
import { PROPERTY_TYPE_LABELS } from "@/lib/enums";

const AXIS_TICK = { fill: "#94a3b8", fontSize: 11 };
const PRIMARY = "#1a1a1a";
const SECONDARY = "#94a3b8";
const MAX_TICK_CHARS = 10;

function shortTick(label: string): string {
  return label.length > MAX_TICK_CHARS ? `${label.slice(0, MAX_TICK_CHARS - 1)}…` : label;
}

function monthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, monthIndex - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

export function TrafficChart({ data }: { data: AdminSummary["monthly_traffic"] }) {
  const rows = data.map((point) => ({ ...point, label: monthLabel(point.month) }));
  const empty = rows.every((row) => row.views === 0 && row.leads === 0);

  return (
    <div className="relative h-[220px] w-full">
      {empty && (
        <p className="absolute inset-0 z-10 flex items-center justify-center font-body text-[13px] text-slate-500">
          No views or leads recorded in the last 12 months yet.
        </p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="admin-views-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.12} />
              <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip cursor={{ stroke: "#e2e8f0" }} />
          <Area type="monotone" dataKey="views" name="Views" stroke={PRIMARY} strokeWidth={2} fill="url(#admin-views-fill)" />
          <Line type="monotone" dataKey="leads" name="Leads" stroke={SECONDARY} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ListingsByTypeChart({ data }: { data: AdminSummary["listings_by_type"] }) {
  const rows = data.slice(0, 5).map((item) => ({ label: PROPERTY_TYPE_LABELS[item.property_type] ?? item.property_type, count: item.count }));

  if (rows.length === 0) {
    return <p className="flex h-[220px] items-center justify-center font-body text-[13px] text-slate-500">No listings yet.</p>;
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
          <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} tickFormatter={shortTick} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(15,23,42,0.04)" }} />
          <Bar dataKey="count" name="Listings" fill={PRIMARY} radius={[2, 2, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
