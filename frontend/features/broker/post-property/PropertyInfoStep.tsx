// features/broker/post-property/PropertyInfoStep.tsx
// Step 1 of the Post Property wizard (Figma "Post your listing" / Section
// 1's 14 Property Info variants). Two-column layout: form on the left,
// sticky Specifications sidebar on the right (residential types only).
// Property Type options depend on the Sell/Rent toggle — switching resets
// an option that no longer exists in the other list, along with its
// now-irrelevant type-specific details.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { AuthSelectField } from "@/components/forms/AuthSelectField";
import { ChecklistGroup } from "@/features/auth/preferences/ChecklistGroup";
import { PostPropertyStepper } from "@/features/broker/post-property/PostPropertyStepper";
import { FreePlanUsageBar } from "@/features/broker/post-property/FreePlanUsageBar";
import { PropertySpecificationsSidebar } from "@/features/broker/post-property/PropertySpecificationsSidebar";
import { JVPartnersSection } from "@/features/broker/post-property/JVPartnersSection";
import { PGDetailsSection } from "@/features/broker/post-property/PGDetailsSection";
import { Furnishing, ListingType, PropertyType } from "@/lib/enums";
import { cn, toOptionalNumber } from "@/lib/utils";
import {
  FACING_OPTIONS,
  LAND_APPROVAL_OPTIONS,
  propertyInfoSchema,
  RENT_PROPERTY_TYPE_GROUPS,
  RESIDENTIAL_PROPERTY_TYPES,
  SELL_PROPERTY_TYPE_GROUPS,
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

function flattenGroupValues(groups: { options: { value: string }[] }[]): string[] {
  return groups.flatMap((group) => group.options.map((option) => option.value));
}

type PropertyInfoStepProps = {
  defaultValues: Partial<PropertyInfoValues> | null;
  jvAgreementFile: File | null;
  onJvAgreementFileChange: (file: File | null) => void;
  onContinue: (values: PropertyInfoValues) => void;
};

export function PropertyInfoStep({ defaultValues, jvAgreementFile, onJvAgreementFileChange, onContinue }: PropertyInfoStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyInfoValues>({
    resolver: zodResolver(propertyInfoSchema),
    defaultValues: { listing_type: ListingType.sale, amenities: [], is_jv_property: false, ...defaultValues },
  });

  const listingType = watch("listing_type");
  const propertyType = watch("property_type");
  const amenities = watch("amenities") ?? [];
  const landApprovals = watch("land_details.approvals") ?? [];
  const isCornerPlot = watch("plot_details.is_corner_plot");
  const isJvProperty = watch("is_jv_property");
  const jvPartners = watch("jv_details.partners") ?? [];
  const commissionMode = watch("jv_details.commission_mode");
  const pgDetails = watch("pg_details") ?? {};

  const isResidential = (RESIDENTIAL_PROPERTY_TYPES as readonly string[]).includes(propertyType);
  const isPlot = propertyType === PropertyType.plot;
  const isLand = propertyType === PropertyType.land;
  const isPG = propertyType === PropertyType.pg_colive;
  const isSell = listingType === ListingType.sale;

  const propertyTypeGroups = isSell ? SELL_PROPERTY_TYPE_GROUPS : RENT_PROPERTY_TYPE_GROUPS;

  const handleListingTypeChange = (option: PropertyInfoValues["listing_type"]) => {
    setValue("listing_type", option, { shouldValidate: true });
    const nextGroups = option === ListingType.sale ? SELL_PROPERTY_TYPE_GROUPS : RENT_PROPERTY_TYPE_GROUPS;
    const validValues = flattenGroupValues(nextGroups);
    if (propertyType && !validValues.includes(propertyType)) {
      setValue("property_type", undefined as unknown as PropertyInfoValues["property_type"], { shouldValidate: false });
      setValue("plot_details", undefined);
      setValue("land_details", undefined);
      setValue("pg_details", undefined);
    }
    if (option === ListingType.rent) {
      setValue("is_jv_property", false);
      setValue("jv_details", undefined);
      onJvAgreementFileChange(null);
    }
  };

  const onSubmit = handleSubmit(onContinue);

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[28px] font-bold text-foreground">List your property</h1>
        <p className="font-body text-[16px] text-muted-foreground">Tell us about the property you&apos;re listing.</p>
      </div>

      <PostPropertyStepper current="info" />
      <FreePlanUsageBar />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Listing Type</span>
            <div className="flex rounded-md border border-border p-1">
              {([ListingType.sale, ListingType.rent] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleListingTypeChange(option)}
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
              groups={propertyTypeGroups}
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
            <AuthSelectField
              label="Furnishing"
              placeholder="Select furnishing"
              value={watch("furnishing")}
              onValueChange={(value) => setValue("furnishing", value as PropertyInfoValues["furnishing"], { shouldValidate: true })}
              options={FURNISHING_OPTIONS}
              error={errors.furnishing?.message}
            />
          )}

          {isSell && (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-heading text-[14px] font-bold text-foreground">Is this a JV Property?</span>
                <span className="font-body text-[12px] text-muted-foreground">Add venture features and partner management</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isJvProperty}
                onClick={() => setValue("is_jv_property", !isJvProperty)}
                className={cn("h-6 w-11 rounded-full transition-colors", isJvProperty ? "bg-foreground" : "bg-muted")}
              >
                <span className={cn("block size-5 translate-x-0.5 rounded-full bg-background transition-transform", isJvProperty && "translate-x-5")} />
              </button>
            </div>
          )}

          {isSell && isJvProperty && (
            <JVPartnersSection
              partners={jvPartners}
              onPartnersChange={(partners) => setValue("jv_details.partners", partners)}
              commissionMode={commissionMode}
              onCommissionModeChange={(mode) => setValue("jv_details.commission_mode", mode)}
              agreementFile={jvAgreementFile}
              onAgreementFileChange={onJvAgreementFileChange}
            />
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

          {isPG && <PGDetailsSection listingType={listingType} value={pgDetails} onChange={(patch) => setValue("pg_details", { ...pgDetails, ...patch })} />}

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

        {isResidential && (
          <div className="lg:col-span-1">
            <PropertySpecificationsSidebar
              bhkRegister={register("bhk", { setValueAs: toOptionalNumber })}
              bhkError={errors.bhk?.message}
              bathroomsRegister={register("bathrooms", { setValueAs: toOptionalNumber })}
              bathroomsError={errors.bathrooms?.message}
              areaSqftRegister={register("area_sqft", { setValueAs: toOptionalNumber })}
              areaSqftError={errors.area_sqft?.message}
              amenityOptions={AMENITY_OPTIONS}
              amenities={amenities}
              onAmenitiesChange={(value) => setValue("amenities", value)}
            />
          </div>
        )}
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
