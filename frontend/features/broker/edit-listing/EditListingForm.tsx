// features/broker/edit-listing/EditListingForm.tsx
// Edit Listing form (Figma "Real Estate Broker Portal > Edit Listing", node
// 177:4065) — a single flat page matching the Figma design directly, unlike
// the Post Property wizard's 4-step flow and its bold underline-field
// styling. Reuses the boxed Input/Select/Textarea/Checkbox primitives and
// white bordered-card sections already established by BrokerPropertyDetail's
// SectionCard, since this screen lives in the same broker admin surface.
//
// Property Type and Transaction Type are shown per Figma but rendered
// read-only: both determine which type-specific sub-form (plot/land/pg/jv)
// applies to a listing, and changing either — or editing those JSONB blobs —
// isn't supported by this form; see PropertyUpdateRequest's backend
// docstring. "Society / Project Name" maps to address_line, the only
// free-text address field the Property model has — Figma's Location Details
// card has no separate street-address field either.
//
// Saved via PATCH /properties/{id}, a genuine partial update (only touched
// fields are sent). Photo add/delete are immediate, separate API calls
// against the already-existing property, not staged until submit like the
// create wizard — there's a real property_id to upload against from the
// moment this page opens.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ErrorState from "@/components/shared/ErrorState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type BrokerPropertyDetailRead,
  deletePropertyMedia,
  getMyProperty,
  type PropertyUpdateInput,
  submitProperty,
  updateProperty,
  uploadPropertyMedia,
} from "@/lib/api/endpoints/properties";
import { ApiError } from "@/lib/api/client";
import { CITY_NAMES, stateForCity } from "@/lib/data/indian-cities";
import {
  Furnishing,
  FURNISHING_LABELS,
  LISTING_TYPE_LABELS,
  OwnershipType,
  OWNERSHIP_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  PropertyStatus,
} from "@/lib/enums";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const AMENITY_OPTIONS = [
  "Gym",
  "Swimming Pool",
  "24/7 Security",
  "Lift",
  "Power Backup",
  "Parking",
  "Club House",
  "Garden",
  "Kids Play Area",
  "CCTV",
  "Intercom",
  "Gas Pipeline",
  "Maintenance Staff",
  "Visitor Parking",
  "Fire Safety",
  "Water Supply",
  "Wifi",
  "Cafeteria",
];

const BHK_OPTIONS = ["1", "2", "3", "4", "5"];
const PARKING_OPTIONS = [
  { value: "0", label: "None" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4+" },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-white p-6">
      <h2 className="font-heading text-[16px] font-medium text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="font-body text-[13px] font-medium text-foreground">{children}</Label>;
}

type FormState = {
  title: string;
  ownership_type: OwnershipType | "";
  available_from: string;
  city: string;
  locality: string;
  address_line: string;
  bhk: string;
  floor: string;
  total_floors: string;
  area_sqft: string;
  furnishing: Furnishing | "";
  parking_slots: string;
  price: string;
  maintenance_monthly: string;
  is_negotiable: boolean;
  amenities: string[];
  virtual_tour_url: string;
  description: string;
};

function toFormState(property: BrokerPropertyDetailRead): FormState {
  return {
    title: property.title,
    ownership_type: property.ownership_type ?? "",
    available_from: property.available_from ?? "",
    city: property.city,
    locality: property.locality,
    address_line: property.address_line,
    bhk: property.bhk != null ? String(property.bhk) : "",
    floor: property.floor != null ? String(property.floor) : "",
    total_floors: property.total_floors != null ? String(property.total_floors) : "",
    area_sqft: property.area_sqft != null ? String(property.area_sqft) : "",
    furnishing: property.furnishing ?? "",
    parking_slots: property.parking_slots != null ? String(property.parking_slots) : "",
    price: String(property.price),
    maintenance_monthly: property.maintenance_monthly != null ? String(property.maintenance_monthly) : "",
    is_negotiable: property.is_negotiable,
    amenities: property.amenities,
    virtual_tour_url: property.virtual_tour_url ?? "",
    description: property.description ?? "",
  };
}

function toUpdatePayload(state: FormState): PropertyUpdateInput {
  return {
    title: state.title,
    ownership_type: state.ownership_type || undefined,
    available_from: state.available_from || undefined,
    city: state.city,
    state: stateForCity(state.city) ?? undefined,
    locality: state.locality,
    address_line: state.address_line,
    bhk: state.bhk === "" ? undefined : Number(state.bhk),
    floor: state.floor === "" ? undefined : Number(state.floor),
    total_floors: state.total_floors === "" ? undefined : Number(state.total_floors),
    area_sqft: state.area_sqft === "" ? undefined : Number(state.area_sqft),
    furnishing: state.furnishing || undefined,
    parking_slots: state.parking_slots === "" ? undefined : Number(state.parking_slots),
    price: state.price === "" ? undefined : Number(state.price),
    maintenance_monthly: state.maintenance_monthly === "" ? undefined : Number(state.maintenance_monthly),
    is_negotiable: state.is_negotiable,
    amenities: state.amenities,
    virtual_tour_url: state.virtual_tour_url || undefined,
    description: state.description || undefined,
  };
}

function EditListingFormBody({ property }: { property: BrokerPropertyDetailRead }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => toFormState(property));
  const [uploading, setUploading] = useState(false);

  const patch = (next: Partial<FormState>) => setForm((prev) => ({ ...prev, ...next }));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["broker-property-detail", property.id] });
    queryClient.invalidateQueries({ queryKey: ["broker-my-properties"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const updated = await updateProperty(property.id, toUpdatePayload(form));
      if (publish && updated.status === PropertyStatus.draft) {
        return submitProperty(property.id);
      }
      return updated;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Listing updated.");
      router.push(`/broker/listings/${property.id}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Couldn't save this listing. Please try again.");
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) => deletePropertyMedia(property.id, mediaId),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't remove that photo. Please try again."),
  });

  async function handleAddPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await uploadPropertyMedia(property.id, Array.from(files));
      invalidate();
    } catch {
      toast.error("Couldn't upload one or more photos. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const photos = property.media.filter((item) => item.media_type === "image");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[28px] font-medium text-foreground">Edit Listing</h1>
        <p className="font-body text-[15px] text-muted-foreground">Fill in the details to update your property listing</p>
      </div>

      <SectionCard title="Basic Information">
        <div className="flex flex-col gap-2">
          <FieldLabel>Property Title</FieldLabel>
          <Input value={form.title} onChange={(event) => patch({ title: event.target.value })} placeholder="e.g., Luxury 3 BHK Apartment with Sea View" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FieldLabel>Property Type</FieldLabel>
            <Input value={PROPERTY_TYPE_LABELS[property.property_type]} disabled />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Transaction Type</FieldLabel>
            <Input value={LISTING_TYPE_LABELS[property.listing_type]} disabled />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FieldLabel>Ownership</FieldLabel>
            <Select value={form.ownership_type || undefined} onValueChange={(value) => patch({ ownership_type: value as OwnershipType })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select ownership" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OwnershipType).map((value) => (
                  <SelectItem key={value} value={value}>
                    {OWNERSHIP_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Available From</FieldLabel>
            <Input type="date" value={form.available_from} onChange={(event) => patch({ available_from: event.target.value })} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Location Details">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FieldLabel>City</FieldLabel>
            <Select value={form.city || undefined} onValueChange={(value) => patch({ city: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {CITY_NAMES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Locality</FieldLabel>
            <Input value={form.locality} onChange={(event) => patch({ locality: event.target.value })} placeholder="e.g., Koramangala" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel>Society / Project Name</FieldLabel>
          <Input value={form.address_line} onChange={(event) => patch({ address_line: event.target.value })} placeholder="e.g., Prestige Lakeside Habitat" />
        </div>
      </SectionCard>

      <SectionCard title="Property Details">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <FieldLabel>BHK Configuration</FieldLabel>
            <Select value={form.bhk || undefined} onValueChange={(value) => patch({ bhk: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select BHK" />
              </SelectTrigger>
              <SelectContent>
                {BHK_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value} BHK
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Floor Number</FieldLabel>
            <Input type="number" value={form.floor} onChange={(event) => patch({ floor: event.target.value })} placeholder="5" />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Total Floors</FieldLabel>
            <Input type="number" value={form.total_floors} onChange={(event) => patch({ total_floors: event.target.value })} placeholder="15" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <FieldLabel>Carpet Area (sq.ft)</FieldLabel>
            <Input type="number" value={form.area_sqft} onChange={(event) => patch({ area_sqft: event.target.value })} placeholder="1200" />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Furnishing Status</FieldLabel>
            <Select value={form.furnishing || undefined} onValueChange={(value) => patch({ furnishing: value as Furnishing })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select furnishing" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Furnishing).map((value) => (
                  <SelectItem key={value} value={value}>
                    {FURNISHING_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Parking</FieldLabel>
            <Select value={form.parking_slots || undefined} onValueChange={(value) => patch({ parking_slots: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select parking" />
              </SelectTrigger>
              <SelectContent>
                {PARKING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Pricing Details">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FieldLabel>Expected Price</FieldLabel>
            <Input type="number" value={form.price} onChange={(event) => patch({ price: event.target.value })} placeholder="e.g., 2.5 Cr or 65 Lakh" />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Maintenance (Monthly)</FieldLabel>
            <Input type="number" value={form.maintenance_monthly} onChange={(event) => patch({ maintenance_monthly: event.target.value })} placeholder="e.g., 5000" />
          </div>
        </div>
        <label className="flex items-center gap-3">
          <Checkbox checked={form.is_negotiable} onCheckedChange={(checked) => patch({ is_negotiable: checked === true })} />
          <span className="font-body text-[14px] font-medium text-foreground">Price Negotiable</span>
        </label>
      </SectionCard>

      <SectionCard title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((amenity) => {
            const selected = form.amenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => patch({ amenities: selected ? form.amenities.filter((value) => value !== amenity) : [...form.amenities, amenity] })}
                className={cn(
                  "rounded-md border px-4 py-2 font-body text-[13px] font-medium transition-colors",
                  selected ? "border-brand-green-600 bg-brand-green-100 text-brand-primary-700" : "border-border bg-muted text-foreground",
                )}
              >
                {amenity}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Photos & Video">
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-md border border-border">
                <img src={photo.url} alt="" className="size-full object-cover" />
                {photo.is_cover && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-foreground/80 px-1.5 py-0.5 font-body text-[10px] text-background">Cover</span>
                )}
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => deleteMediaMutation.mutate(photo.id)}
                  disabled={deleteMediaMutation.isPending}
                  className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center",
            uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
        >
          {uploading ? <Loader2 className="size-8 animate-spin text-muted-foreground" /> : <Upload className="size-8 text-muted-foreground" />}
          <p className="font-body text-[14px] font-medium text-foreground">Drag & drop photos here</p>
          <p className="font-body text-[13px] text-muted-foreground">or click to browse (Max 20 photos, 5MB each)</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            className="hidden"
            onChange={(event) => {
              void handleAddPhotos(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        {photos.length === 0 && (
          <p className="flex items-center gap-2 font-body text-[12px] text-muted-foreground">
            <ImageIcon size={14} /> No photos yet
          </p>
        )}

        <div className="flex flex-col gap-2">
          <FieldLabel>Video URL (Optional)</FieldLabel>
          <Input
            value={form.virtual_tour_url}
            onChange={(event) => patch({ virtual_tour_url: event.target.value })}
            placeholder="e.g., https://youtube.com/watch?v=..."
          />
        </div>
      </SectionCard>

      <SectionCard title="Property Description">
        <Textarea
          value={form.description}
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="Describe your property, highlight unique features, nearby landmarks, etc."
          className="min-h-35"
        />
      </SectionCard>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button variant="outline" asChild>
          <Link href={`/broker/listings/${property.id}`}>Cancel</Link>
        </Button>
        <Button variant="outline" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(false)}>
          Save as Draft
        </Button>
        <Button
          className="bg-brand-green-500 text-brand-primary-700 hover:opacity-90"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate(true)}
        >
          {property.status === PropertyStatus.draft ? "Publish Listing" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function EditListingFormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-48 w-full animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export function EditListingForm({ propertyId }: { propertyId: string }) {
  const { data: property, isLoading, error } = useQuery({
    queryKey: ["broker-property-detail", propertyId],
    queryFn: () => getMyProperty(propertyId),
    retry: (failureCount, err) => (err instanceof ApiError && (err.status === 404 || err.status === 403) ? false : failureCount < 2),
  });

  if (isLoading) {
    return <EditListingFormSkeleton />;
  }

  if (error || !property) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 403);
    return (
      <ErrorState
        title={notFound ? "Property not found" : "Couldn't load this property"}
        body={notFound ? "This listing may have been removed, or you don't have access to it." : "Please try again in a moment."}
        action={
          <Button asChild variant="outline">
            <Link href="/broker/listings">Back to Listings</Link>
          </Button>
        }
      />
    );
  }

  return <EditListingFormBody property={property} />;
}
