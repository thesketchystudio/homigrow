// features/broker/post-property/PostPropertyChrome.tsx
// Header/footer shell for the Post Property wizard (Figma "Post your
// listing" screens, node 612:776 header / 612:1064 footer). Deliberately
// not the shared components/shared/Footer.tsx — that's the dark, full
// homepage footer; this is a distinct, minimal light-chrome pair scoped to
// the wizard's own standalone layout (see app/(broker-post)/broker/
// listings/new/layout.tsx for why the wizard has no sidebar).

import Link from "next/link";

export function PostPropertyHeader() {
  return (
    <header className="flex h-20 items-center justify-center bg-[rgba(248,249,250,0.8)] px-[150px]">
      <Link href="/broker/dashboard" className="font-heading text-[20px] font-bold text-brand-primary-600">
        Homigrow
      </Link>
    </header>
  );
}

const FOOTER_LINKS = ["Legal Disclosure", "Privacy Policy", "Contact Support", "Investor Relations"];

export function PostPropertyFooter() {
  return (
    <footer className="flex items-start px-[150px] pb-12 pt-[49px]">
      <div className="flex flex-1 items-start">
        <div className="flex flex-1 flex-col">
          <span className="font-heading text-[20px] font-bold text-brand-primary-600">Homigrow</span>
          <span className="pt-4 font-body text-[14px] text-[#64748b]">© 2026 Homigrow. All rights reserved.</span>
        </div>
        <div className="flex flex-1 items-center justify-end gap-8 self-stretch">
          {FOOTER_LINKS.map((link) => (
            <span key={link} className="font-body text-[14px] text-[#64748b]">
              {link}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
