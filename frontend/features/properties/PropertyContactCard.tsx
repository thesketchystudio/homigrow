// features/properties/PropertyContactCard.tsx
// Sidebar contact card + map placeholder (Figma node 31:1991, "Aside -
// Right Column: Sidebar"). The Market Context / "Download Market Report"
// card from the same Figma frame is intentionally not built — deferred in
// 10_Phase_3.md P3-T04 alongside the Vaastu checker and "Redesign with AI".
//
// POST /properties/{id}/enquire doesn't exist yet (same deferred list), so
// the form collects input locally but both actions just surface a toast —
// same placeholder pattern LoginForm used for "Forgot password?" before
// that flow was actually built.

"use client";

import { useState } from "react";
import { MapPin, ShieldCheck, User } from "lucide-react";

import type { PropertyRead } from "@/lib/api/endpoints/properties";
import { VerificationStatus } from "@/lib/enums";
import { toast } from "@/lib/toast";

export function PropertyContactCard({ property }: { property: PropertyRead }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const isVerified = property.broker.broker_profile?.verification_status === VerificationStatus.verified;

  const handleAction = (action: string) => {
    if (!name || !phone) {
      toast.error("Please enter your name and number first.");
      return;
    }
    toast.info(`${action} isn't available yet — check back soon.`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-8 rounded bg-brand-secondary-100 border border-[rgba(198,198,205,0.1)] p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-secondary-500">
            <User className="size-6 text-brand-primary-600/60" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-primary-600/80">Contact Owner</span>
            <span className="font-heading text-[16px] font-bold text-brand-primary-600">
              {property.broker.full_name ?? "Property Broker"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="contact-name" className="font-heading text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80">
              Full Name
            </label>
            <input
              id="contact-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              className="rounded-sm bg-brand-secondary-400 px-4 py-3 font-body text-[14px] text-brand-primary-600 placeholder:text-brand-primary-300 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="contact-phone" className="font-heading text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80">
              Number
            </label>
            <input
              id="contact-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter your number"
              className="rounded-sm bg-brand-secondary-400 px-4 py-3 font-body text-[14px] text-brand-primary-600 placeholder:text-brand-primary-300 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="contact-date" className="font-heading text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80">
              Preferred Date
            </label>
            <input
              id="contact-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-sm bg-brand-secondary-400 px-4 py-3 font-body text-[14px] text-brand-primary-600 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => handleAction("Scheduling a private tour")}
            className="rounded-md bg-brand-primary-600 py-4 font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-secondary-100 shadow-lg"
          >
            Schedule Private Tour
          </button>
          <button
            type="button"
            onClick={() => handleAction("Getting the owner's number")}
            className="rounded-md bg-brand-green-500 py-4 font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-primary-400"
          >
            Get Number
          </button>
        </div>

        {isVerified && (
          <div className="flex flex-col gap-4 border-t border-[rgba(198,198,205,0.1)] pt-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-brand-primary-600/80" />
              <p className="font-body text-[12px] text-brand-primary-600/80">Verified Listing</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex h-80 flex-col items-start justify-start gap-3 overflow-hidden rounded bg-brand-secondary-400 p-4">
        <span className="rounded bg-brand-secondary-100 px-3 py-1 font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-primary-600">
          Map View
        </span>
        <div className="flex flex-1 w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-brand-primary-300">
            <MapPin className="size-8" />
            <p className="font-body text-[14px]">
              {property.address_line}, {property.locality}, {property.city}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
