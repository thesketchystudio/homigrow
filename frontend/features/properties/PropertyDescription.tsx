// features/properties/PropertyDescription.tsx
// Editorial description section (Figma node 31:1916, "Section - Editorial
// Description"). Figma's copy for its one demo listing splits into a large
// hook line followed by body paragraphs; the backend only stores a single
// `description` text, so paragraphs are split on blank lines and the first
// one is styled as the hook line.

export function PropertyDescription({ description }: { description?: string }) {
  if (!description) return null;

  const [hook, ...rest] = description.split(/\n\n+/).filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-green-700">Architectural Vision</p>
      <p className="font-heading text-[28px] leading-[36px] text-brand-primary-600">{hook}</p>
      {rest.length > 0 && (
        <div className="flex flex-col gap-6">
          {rest.map((paragraph, index) => (
            <p key={index} className="font-body text-[18px] leading-[28px] text-brand-primary-600/80">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
