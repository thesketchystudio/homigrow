// features/broker/post-property/PropertySpecificationsEmptyCard.tsx
// Default state of the Property Info Step's right-column "Specifications"
// card (Figma "Step1Sidebar", node 763:657) — shown until a property type
// is chosen, since the fields it will hold depend on that type.

export function PropertySpecificationsEmptyCard() {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-brand-secondary-100 p-10 drop-shadow-[0px_4px_2px_rgba(0,0,0,0.1)] lg:sticky lg:top-6">
      <h2 className="font-heading text-[16px] font-bold text-brand-primary-600">Specifications</h2>
      <p className="font-body text-[14px] leading-[22px] text-[#64748b]">Select the property type to add specifications.</p>
    </div>
  );
}
