// components/shared/PropertyCard.tsx
// Reusable property listing card used across homepage, search results,
// saved properties, and broker listings views. Takes data + callbacks only
// — it never fetches; the "saved" state is controlled by the caller.

"use client";

import { useState } from "react";
import { BedDouble, Heart, MapPin, Ruler } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
};

export type PropertyCardProps = {
  property: PropertyCardData;
  size?: "sm" | "md";
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  badge?: PropertyCardBadge;
};

export default function PropertyCard({ property, size = "md", isSaved = false, onToggleSave, badge }: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isSold = property.status !== undefined && SOLD_STATUSES.includes(property.status);
  const imageHeight = size === "sm" ? "h-40" : "h-56";

  return (
    <div className="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md">
      <div className={cn("relative shrink-0 overflow-hidden", imageHeight)}>
        {!imageLoaded && <Skeleton className="absolute inset-0" />}
        <img
          src={property.imageUrl}
          alt={property.title}
          onLoad={() => setImageLoaded(true)}
          className={cn("h-full w-full object-cover transition-opacity", imageLoaded ? "opacity-100" : "opacity-0")}
        />

        {badge && (
          <Badge variant={badge.variant ?? "default"} className="absolute bottom-3 left-3">
            {badge.label}
          </Badge>
        )}

        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(property.id)}
            aria-label={isSaved ? "Remove from saved" : "Save property"}
            aria-pressed={isSaved}
            disabled={isSold}
            className="bg-background/70 absolute top-3 right-3 flex size-9 items-center justify-center rounded-full backdrop-blur transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-50"
          >
            <Heart className={cn("size-4", isSaved ? "fill-destructive text-destructive" : "text-foreground")} />
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

      <a href={property.href} className={cn("flex flex-col gap-3", size === "sm" ? "p-4" : "p-5")}>
        <div className="flex flex-col gap-1">
          <span className={cn("font-semibold leading-tight", size === "sm" ? "text-sm" : "text-base")}>
            {property.title}
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPin className="size-3.5 shrink-0" />
            {property.location}
          </span>
        </div>

        <span className={cn("font-semibold", size === "sm" ? "text-sm" : "text-base")}>{property.price}</span>

        {(property.bhk !== undefined || property.areaSqft !== undefined) && (
          <div className="text-muted-foreground flex items-center gap-4 border-t pt-3 text-xs">
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
      </a>
    </div>
  );
}
