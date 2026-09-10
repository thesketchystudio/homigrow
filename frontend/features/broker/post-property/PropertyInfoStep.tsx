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
import { PostPropertyStepper, type StepKey } from "@/features/broker/post-property/PostPropertyStepper";
import { FreePlanUsageBar } from "@/features/broker/post-property/FreePlanUsageBar";
import { PropertySpecificationsSidebar } from "@/features/broker/post-property/PropertySpecificationsSidebar";
import { PropertyLocationMapPreview } from "@/features/broker/post-property/PropertyLocationMapPreview";
import { JVPartnersSection } from "@/features/broker/post-property/JVPartnersSection";
import { PGDetailsSection } from "@/features/broker/post-property/PGDetailsSection";
import { Furnishing, ListingType, PropertyType } from "@/lib/enums";
import { cn, toOptionalNumber } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { CITY_NAMES, stateForCity } from "@/lib/data/indian-cities";
import { saveInfoDraft } from "@/lib/postPropertyDraft";
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
  onStepSelect?: (step: StepKey) => void;
};

export function PropertyInfoStep({ defaultValues, jvAgreementFile, onJvAgreementFileChange, onContinue, onStepSelect }: PropertyInfoStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
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

  const handlePropertyTypeChange = (value: string) => {
    setValue("property_type", value as PropertyInfoValues["property_type"], { shouldValidate: true });
    if (value === PropertyType.plot && getValues("plot_details.is_corner_plot") === undefined) {
      setValue("plot_details.is_corner_plot", false);
    }
    if (value === PropertyType.pg_colive && getValues("pg_details.currently_operational") === undefined) {
      setValue("pg_details.currently_operational", true);
    }
  };

  const handleCityChange = (city: string) => {
    setValue("city", city, { shouldValidate: true });
    setValue("state", stateForCity(city) ?? "", { shouldValidate: true });
  };

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
  const labelClassName = "text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80";

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-8">
      <h1 className="font-heading text-[48px] font-bold leading-15 text-brand-primary-600">Post your listing</h1>

      <PostPropertyStepper current="info" onStepSelect={onStepSelect} />
      <FreePlanUsageBar />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-[20px] font-bold text-brand-primary-600">Property Basics</h2>
            <div className="flex items-start rounded p-1 bg-border">
              {([ListingType.sale, ListingType.rent] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleListingTypeChange(option)}
                  className={cn(
                    "rounded px-6 py-1.5 font-heading text-[16px] font-bold",
                    listingType === option
                      ? "bg-background text-foreground shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                      : "text-brand-primary-600/80",
                  )}
                >
                  {option === ListingType.sale ? "SELL" : "RENT"}
                </button>
              ))}
            </div>
          </div>

          <AuthTextField
            label="Listing Title"
            placeholder="e.g. 3 BHK Villa in Whitefield"
            register={register("title")}
            error={errors.title?.message}
            labelClassName={labelClassName}
          />

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <AuthSelectField
              label="Property Type"
              placeholder="Select property type"
              value={watch("property_type")}
              onValueChange={handlePropertyTypeChange}
              groups={propertyTypeGroups}
              error={errors.property_type?.message}
              labelClassName={labelClassName}
            />
            <AuthTextField
              label="Built Year"
              placeholder="2020"
              register={register("built_year", { setValueAs: toOptionalNumber })}
              error={errors.built_year?.message}
              labelClassName={labelClassName}
            />
          </div>

          {isPlot && (
            <div className="flex flex-col gap-5 rounded border border-[rgba(198,198,205,0.35)] p-5">
              <span className="font-heading text-[9px] font-bold uppercase tracking-[1.5px] text-brand-primary-600/50">Plot Details</span>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <AuthTextField
                  label="Plot Dimension"
                  placeholder="e.g. 30x40"
                  register={register("plot_details.dimension")}
                  error={errors.plot_details?.dimension?.message}
                  labelClassName={labelClassName}
                />
                <AuthSelectField
                  label="Facing"
                  placeholder="Select facing"
                  value={watch("facing")}
                  onValueChange={(value) => setValue("facing", value, { shouldValidate: true })}
                  options={FACING_SELECT_OPTIONS}
                  error={errors.facing?.message}
                  labelClassName={labelClassName}
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <span className={labelClassName}>Corner Plot</span>
                <div className="flex w-fit items-start self-start rounded p-1 bg-border">
                  {([false, true] as const).map((option) => (
                    <button
                      key={String(option)}
                      type="button"
                      onClick={() => setValue("plot_details.is_corner_plot", option, { shouldValidate: true })}
                      className={cn(
                        "rounded px-4 py-1.5 font-heading text-[13px] font-bold",
                        isCornerPlot === option ? "bg-background text-foreground shadow-[0px_1px_1px_rgba(0,0,0,0.05)]" : "text-brand-primary-600/70",
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
            <div className="flex flex-col gap-5 rounded border border-[rgba(198,198,205,0.35)] p-5">
              <span className="font-heading text-[9px] font-bold uppercase tracking-[1.5px] text-brand-primary-600/50">Land Details</span>
              <div className="flex flex-col gap-2.5">
                <span className={labelClassName}>Land Use</span>
                <div className="flex flex-wrap gap-2">
                  {LAND_USE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue("land_details.land_use", option.value as "residential" | "commercial", { shouldValidate: true })}
                      className={cn(
                        "self-stretch rounded px-[13px] py-1.5 font-heading text-[13px] font-medium",
                        watch("land_details.land_use") === option.value
                          ? "border border-foreground bg-foreground text-background"
                          : "border border-[rgba(198,198,205,0.5)] bg-background text-brand-primary-600",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className={labelClassName}>Approval / Classification (select all that apply)</span>
                <div className="flex flex-wrap gap-2">
                  {LAND_APPROVAL_OPTIONS.map((option) => {
                    const selected = landApprovals.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setValue("land_details.approvals", selected ? landApprovals.filter((v) => v !== option) : [...landApprovals, option])}
                        className={cn(
                          "self-stretch rounded px-[13px] py-1.5 font-heading text-[13px] font-medium",
                          selected ? "border border-foreground bg-foreground text-background" : "border border-[rgba(198,198,205,0.5)] bg-background text-brand-primary-600",
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
              <AuthTextField
                label="Total Area (sqft)"
                placeholder="e.g. 15,000"
                register={register("area_sqft", { setValueAs: toOptionalNumber })}
                error={errors.area_sqft?.message}
                labelClassName={labelClassName}
              />
            </div>
          )}

          {isResidential && (
            <AuthSelectField
              label="Furnishing"
              placeholder="Select furnishing"
              value={watch("furnishing")}
              onValueChange={(value) => setValue("furnishing", value as PropertyInfoValues["furnishing"], { shouldValidate: true })}
              labelClassName={labelClassName}
              options={FURNISHING_OPTIONS}
              error={errors.furnishing?.message}
            />
          )}

          {isSell && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-heading text-[15px] font-medium text-brand-primary-600">Is this a JV Property?</span>
                  <span className="font-body text-[12px] leading-[18px] text-brand-primary-600/50">Add venture features and partner management</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isJvProperty}
                  onClick={() => {
                    const next = !isJvProperty;
                    setValue("is_jv_property", next);
                    if (next && !getValues("jv_details.commission_mode")) {
                      setValue("jv_details.commission_mode", "auto");
                    }
                  }}
                  className={cn("h-6 w-11 rounded-full transition-colors", isJvProperty ? "bg-foreground" : "bg-brand-secondary-500")}
                >
                  <span className={cn("block size-5 translate-x-0.5 rounded-full bg-background transition-transform", isJvProperty && "translate-x-5")} />
                </button>
              </div>

              {isJvProperty && (
                <JVPartnersSection
                  partners={jvPartners}
                  onPartnersChange={(partners) => setValue("jv_details.partners", partners)}
                  commissionMode={commissionMode}
                  onCommissionModeChange={(mode) => setValue("jv_details.commission_mode", mode)}
                  agreementFile={jvAgreementFile}
                  onAgreementFileChange={onJvAgreementFileChange}
                />
              )}
            </div>
          )}

          {isPG && <PGDetailsSection listingType={listingType} value={pgDetails} onChange={(patch) => setValue("pg_details", { ...pgDetails, ...patch })} />}

          <div className="flex flex-col gap-6 border-t border-border pt-8">
            <h2 className="font-heading text-[20px] font-bold text-brand-primary-600">Location Details</h2>
            <AuthTextField
              label="Address"
              placeholder="12 MG Road"
              register={register("address_line")}
              error={errors.address_line?.message}
              labelClassName={labelClassName}
            />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <AuthTextField
                label="Locality"
                placeholder="Indiranagar"
                register={register("locality")}
                error={errors.locality?.message}
                labelClassName={labelClassName}
              />
              <AuthTextField
                label="Landmark (optional)"
                placeholder="Near Metro Station"
                register={register("landmark")}
                error={errors.landmark?.message}
                labelClassName={labelClassName}
              />
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <AuthSelectField
                label="City"
                placeholder="Select your city"
                value={watch("city")}
                onValueChange={handleCityChange}
                options={CITY_NAMES}
                error={errors.city?.message}
                labelClassName={labelClassName}
              />
              <AuthSelectField
                label="State"
                placeholder="State"
                value={watch("state")}
                onValueChange={() => {}}
                options={watch("state") ? [watch("state")] : []}
                disabled
                error={errors.state?.message}
                labelClassName={labelClassName}
              />
              <AuthTextField
                label="Pincode"
                placeholder="560038"
                register={register("pincode")}
                error={errors.pincode?.message}
                labelClassName={labelClassName}
              />
            </div>
            <PropertyLocationMapPreview />
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

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            saveInfoDraft(getValues());
            toast.success("Draft saved on this device.");
          }}
          className="rounded px-16 py-4.75 font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-[#1b1c1c]"
          style={{ backgroundColor: "#eae8e7" }}
        >
          Save as Draft
        </button>
        <button type="submit" className="rounded bg-black px-14 py-4.75 font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-white">
          Save &amp; Continue
        </button>
      </div>
    </form>
  );
}
