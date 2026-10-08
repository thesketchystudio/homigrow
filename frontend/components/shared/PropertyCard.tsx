// components/shared/PropertyCard.tsx
// Reusable property listing card used across homepage, search results,
// saved properties, and broker listings views. Takes data + callbacks only
// — it never fetches; the "saved" state is controlled by the caller.

"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { BedDouble, Check, Heart, MapPin, Ruler, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { PropertyStatus } from "@/lib/enums";

const SOLD_STATUSES: readonly PropertyStatus[] = [PropertyStatus.sold, PropertyStatus.rented, PropertyStatus.expired];

const OVERLAY_LABEL: Partial<Record<PropertyStatus, string>> = {
  [PropertyStatus.sold]: "Sold",
  [PropertyStatus.rented]: "Rented",
  [PropertyStatus.expired]: "Expired",
};

export type PropertyCardData = {
  id: string;
  title: string;
  imageUrl: string;
  price: string;
  location: string;
  bhk?: number;
  areaSqft?: number;
  status?: PropertyStatus;
  href: string;
};

export type PropertyCardBadge = {
  label: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
  // Escape hatch for callers needing exact brand colors the fixed variant
  // palette can't express (e.g. per-listing-type tag colors) — takes
  // precedence over variant via inline style, not a fork of the badge.
  style?: CSSProperties;
};

export type PropertyCardProps = {
  property: PropertyCardData;
  size?: "sm" | "md";
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  isComparing?: boolean;
  onToggleCompare?: (id: string) => void;
  badge?: PropertyCardBadge;
  // "View property"/"Enquire now"/"Check Vaastu" row (Figma "search" screen,
  // node 28:735). "View property" is a plain span, not a nested link/button —
  // the whole card is already the real Link to the details page, so clicking
  // it triggers the same navigation without an invalid nested <a>.
  showActions?: boolean;
};

export default function PropertyCard({
  property,
  size = "md",
  isSaved = false,
  onToggleSave,
  isComparing = false,
  onToggleCompare,
  badge,
  showActions = false,
}: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isSold = property.status !== undefined && SOLD_STATUSES.includes(property.status);
  const imageHeight = size === "sm" ? "h-40" : "h-56";

  return (
    <Link
      href={property.href}
      className="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md"
    >
      <div className={cn("relative shrink-0 overflow-hidden", imageHeight)}>
        {!imageLoaded && <Skeleton className="absolute inset-0" />}
        <img
          src={property.imageUrl}
          alt={property.title}
          onLoad={() => setImageLoaded(true)}
          className={cn("h-full w-full object-cover transition-opacity", imageLoaded ? "opacity-100" : "opacity-0")}
        />

        {badge && (
          <Badge variant={badge.variant ?? "default"} className="absolute bottom-3 left-3" style={badge.style}>
            {badge.label}
          </Badge>
        )}

        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave(property.id);
            }}
            aria-label={isSaved ? "Remove from saved" : "Save property"}
            aria-pressed={isSaved}
            disabled={isSold}
            className="bg-background/70 absolute top-3 right-3 flex size-9 items-center justify-center rounded-full backdrop-blur transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-50"
          >
            <Heart className={cn("size-4", isSaved ? "fill-destructive text-destructive" : "text-foreground")} />
          </button>
        )}

        {onToggleCompare && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCompare(property.id);
            }}
            aria-label={isComparing ? "Remove from comparison" : "Select for comparison"}
            aria-pressed={isComparing}
            disabled={isSold}
            className={cn(
              "absolute bottom-3 left-3 flex items-center gap-2 rounded transition-colors disabled:pointer-events-none disabled:opacity-50",
              isComparing ? "bg-brand-primary-400 p-0.75" : "bg-background/70 border border-background/80 backdrop-blur size-5.5"
            )}
          >
            {isComparing ? (
              <>
                <Check className="text-background size-4 shrink-0" />
                <span className="text-background pr-2 text-sm font-medium drop-shadow-sm whitespace-nowrap">
                  Selected for Comparison
                </span>
              </>
            ) : null}
          </button>
        )}

        {isSold && property.status && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
            <Badge variant="secondary" className="text-sm">
              {OVERLAY_LABEL[property.status]}
            </Badge>
          </div>
        )}
      </div>

      <div className={cn("flex flex-col gap-3", size === "sm" ? "p-4" : "p-5")}>
        <div className="flex flex-col gap-1">
          <span className={cn("font-heading font-bold leading-tight", size === "sm" ? "text-sm" : "text-base")}>
            {property.title}
          </span>
          <span className="text-muted-foreground font-body flex items-center gap-1 text-xs">
            <MapPin className="size-3.5 shrink-0" />
            {property.location}
          </span>
        </div>

        <span className={cn("font-heading font-bold", size === "sm" ? "text-sm" : "text-base")}>{property.price}</span>

        {(property.bhk !== undefined || property.areaSqft !== undefined) && (
          <div className="text-muted-foreground font-body flex items-center gap-4 border-t pt-3 text-xs">
            {property.bhk !== undefined && (
              <span className="flex items-center gap-1.5">
                <BedDouble className="size-3.5" />
                {property.bhk} BHK
              </span>
            )}
            {property.areaSqft !== undefined && (
              <span className="flex items-center gap-1.5">
                <Ruler className="size-3.5" />
                {property.areaSqft.toLocaleString("en-IN")} sqft
              </span>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-black px-4 py-2 font-heading text-[14px] font-bold text-brand-primary-400">
                View property
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast.info("Enquiries aren't available yet — check back soon.");
                }}
                className="rounded-lg bg-[#565e74] px-4 py-2 font-heading text-[14px] font-bold text-[#f8f9fa]"
              >
                Enquire now
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.info("Vaastu compliance checking isn't available yet — check back soon.");
              }}
              className="flex items-center gap-1 font-heading text-[14px] font-bold text-[#575e70]"
            >
              <Sparkles className="size-3.5" />
              Check Vaastu
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
