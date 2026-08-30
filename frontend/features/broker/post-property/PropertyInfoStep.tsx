// features/broker/post-property/PropertyInfoStep.tsx
// Step 1 of the Post Property wizard (Figma "post property" section,
// node 62:1343 — adapted to real Homigrow tokens/components instead of
// the unskinned template's raw hex values and top-nav layout). Supports
// residential listings plus Plot and Land, each swapping in their own
// type-specific sub-form below Built Year, mirroring how Figma's
// "Property Basics" section re-renders per Property Type. PG/Co-living
// and Commercial Building sub-forms are deferred to later passes.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { AuthSelectField } from "@/components/forms/AuthSelectField";
import { ChecklistGroup } from "@/features/auth/preferences/ChecklistGroup";
import { PostPropertyStepper } from "@/features/broker/post-property/PostPropertyStepper";
import { Furnishing, ListingType, PropertyType, PROPERTY_TYPE_LABELS } from "@/lib/enums";
import { cn, toOptionalNumber } from "@/lib/utils";
import {
  FACING_OPTIONS,
  LAND_APPROVAL_OPTIONS,
  POSTABLE_PROPERTY_TYPES,
  propertyInfoSchema,
  RESIDENTIAL_PROPERTY_TYPES,
  type PropertyInfoValues,
} from "@/lib/validation/postProperty";

const AMENITY_OPTIONS = [
  { value: "Power Backup", label: "Power Backup" },
  { value: "Lift", label: "Lift" },
  { value: "Covered Parking", label: "Covered Parking" },
  { value: "Swimming Pool", label: "Swimming Pool" },
  { value: "Gym", label: "Gym" },
  { value: "Club House", label: "Club House" },
  { value: "24x7 Security", label: "24x7 Security" },
  { value: "Park / Garden", label: "Park / Garden" },
  { value: "CCTV", label: "CCTV" },
];

const PROPERTY_TYPE_OPTIONS = POSTABLE_PROPERTY_TYPES.map((value) => ({ value, label: PROPERTY_TYPE_LABELS[value] }));
const FURNISHING_OPTIONS = Object.values(Furnishing).map((value) => ({
  value,
  label: value === Furnishing.unfurnished ? "Unfurnished" : value === Furnishing.semi_furnished ? "Semi-furnished" : "Fully furnished",
}));
const FACING_SELECT_OPTIONS = FACING_OPTIONS.map((value) => ({ value, label: value }));
const LAND_APPROVAL_CHECKLIST_OPTIONS = LAND_APPROVAL_OPTIONS.map((value) => ({ value, label: value }));
const LAND_USE_OPTIONS = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
];

type PropertyInfoStepProps = {
  defaultValues: Partial<PropertyInfoValues> | null;
  onContinue: (values: PropertyInfoValues) => void;
};

export function PropertyInfoStep({ defaultValues, onContinue }: PropertyInfoStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyInfoValues>({
    resolver: zodResolver(propertyInfoSchema),
    defaultValues: { listing_type: ListingType.sale, amenities: [], ...defaultValues },
  });

  const listingType = watch("listing_type");
  const propertyType = watch("property_type");
  const amenities = watch("amenities") ?? [];
  const landApprovals = watch("land_details.approvals") ?? [];
  const isCornerPlot = watch("plot_details.is_corner_plot");

  const isResidential = (RESIDENTIAL_PROPERTY_TYPES as readonly string[]).includes(propertyType);
  const isPlot = propertyType === PropertyType.plot;
  const isLand = propertyType === PropertyType.land;

  const onSubmit = handleSubmit(onContinue);

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[28px] font-bold text-foreground">List your property</h1>
        <p className="font-body text-[16px] text-muted-foreground">Tell us about the property you&apos;re listing.</p>
      </div>

      <PostPropertyStepper current="info" />

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Listing Type</span>
          <div className="flex rounded-md border border-border p-1">
            {([ListingType.sale, ListingType.rent] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setValue("listing_type", option, { shouldValidate: true })}
                className={cn(
                  "rounded px-4 py-1.5 font-heading text-[14px] font-bold",
                  listingType === option ? "bg-foreground text-background" : "text-muted-foreground",
                )}
              >
                {option === ListingType.sale ? "Sell" : "Rent"}
              </button>
            ))}
          </div>
        </div>

        <AuthTextField label="Listing Title" placeholder="e.g. 3 BHK Villa in Whitefield" register={register("title")} error={errors.title?.message} />

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <AuthSelectField
            label="Property Type"
            placeholder="Select property type"
            value={watch("property_type")}
            onValueChange={(value) => setValue("property_type", value as PropertyInfoValues["property_type"], { shouldValidate: true })}
            options={PROPERTY_TYPE_OPTIONS}
            error={errors.property_type?.message}
          />
          <AuthTextField
            label="Built Year"
            placeholder="2020"
            register={register("built_year", { setValueAs: toOptionalNumber })}
            error={errors.built_year?.message}
          />
        </div>

        {isResidential && (
          <>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <AuthTextField
                label="Bedrooms (BHK)"
                placeholder="3"
                register={register("bhk", { setValueAs: toOptionalNumber })}
                error={errors.bhk?.message}
              />
              <AuthTextField
                label="Bathrooms"
                placeholder="2"
                register={register("bathrooms", { setValueAs: toOptionalNumber })}
                error={errors.bathrooms?.message}
              />
              <AuthTextField
                label="Total Area (sq.ft)"
                placeholder="1200"
                register={register("area_sqft", { setValueAs: toOptionalNumber })}
                error={errors.area_sqft?.message}
              />
            </div>

            <AuthSelectField
              label="Furnishing"
              placeholder="Select furnishing"
              value={watch("furnishing")}
              onValueChange={(value) => setValue("furnishing", value as PropertyInfoValues["furnishing"], { shouldValidate: true })}
              options={FURNISHING_OPTIONS}
              error={errors.furnishing?.message}
            />

            <div className="flex flex-col gap-3">
              <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Amenities</span>
              <ChecklistGroup options={AMENITY_OPTIONS} value={amenities} onChange={(value) => setValue("amenities", value)} className="gap-0" />
            </div>
          </>
        )}

        {isPlot && (
          <div className="flex flex-col gap-8 border-t border-border pt-8">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Plot Details</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <AuthTextField
                label="Plot Dimension"
                placeholder="e.g. 30x40"
                register={register("plot_details.dimension")}
                error={errors.plot_details?.dimension?.message}
              />
              <AuthSelectField
                label="Facing"
                placeholder="Select facing"
                value={watch("facing")}
                onValueChange={(value) => setValue("facing", value, { shouldValidate: true })}
                options={FACING_SELECT_OPTIONS}
                error={errors.facing?.message}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Corner Plot</span>
              <div className="flex rounded-md border border-border p-1">
                {([true, false] as const).map((option) => (
                  <button
                    key={String(option)}
                    type="button"
                    onClick={() => setValue("plot_details.is_corner_plot", option, { shouldValidate: true })}
                    className={cn(
                      "rounded px-4 py-1.5 font-heading text-[14px] font-bold",
                      isCornerPlot === option ? "bg-foreground text-background" : "text-muted-foreground",
                    )}
                  >
                    {option ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLand && (
          <div className="flex flex-col gap-8 border-t border-border pt-8">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Land Details</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <AuthSelectField
                label="Land Use"
                placeholder="Select land use"
                value={watch("land_details.land_use")}
                onValueChange={(value) => setValue("land_details.land_use", value as "residential" | "commercial", { shouldValidate: true })}
                options={LAND_USE_OPTIONS}
                error={errors.land_details?.land_use?.message}
              />
              <AuthTextField
                label="Total Area (sq.ft)"
                placeholder="12000"
                register={register("area_sqft", { setValueAs: toOptionalNumber })}
                error={errors.area_sqft?.message}
              />
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">
                Approval / Classification (select all that apply)
              </span>
              <ChecklistGroup
                options={LAND_APPROVAL_CHECKLIST_OPTIONS}
                value={landApprovals}
                onChange={(value) => setValue("land_details.approvals", value)}
                className="gap-0"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6 border-t border-border pt-8">
          <h2 className="font-heading text-[16px] font-bold text-foreground">Location Details</h2>
          <AuthTextField label="Address" placeholder="12 MG Road" register={register("address_line")} error={errors.address_line?.message} />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <AuthTextField label="Locality" placeholder="Indiranagar" register={register("locality")} error={errors.locality?.message} />
            <AuthTextField label="Landmark (optional)" placeholder="Near Metro Station" register={register("landmark")} error={errors.landmark?.message} />
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <AuthTextField label="City" placeholder="Bengaluru" register={register("city")} error={errors.city?.message} />
            <AuthTextField label="State" placeholder="Karnataka" register={register("state")} error={errors.state?.message} />
            <AuthTextField label="Pincode" placeholder="560038" register={register("pincode")} error={errors.pincode?.message} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center justify-center rounded py-4 px-12 font-heading text-[16px] font-bold text-background"
          style={{ backgroundImage: "linear-gradient(122.455deg, rgb(0, 0, 0) 0%, rgb(19, 27, 46) 100%)" }}
        >
          Continue
        </button>
      </div>
    </form>
  );
}
