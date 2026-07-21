// app/(auth)/layout.tsx
// Shared shell for the signup wizard (role select / form / OTP verify):
// a centered logo header, a centered content column, and a footer —
// matches the Figma onboarding flow's page chrome (distinct from the
// full TopNavBar/Footer used by the (client) portal). Login/forgot-
// password/reset-password use the separate AuthSplitShell instead.

import svgPaths from "@/lib/homepage-svg-paths";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-black/[0.08] px-6 py-6 sm:px-[100px]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-center">
          <div className="flex items-center gap-2">
            <svg width="24" height="22" viewBox="0 0 45.4044 40.0834" fill="none">
              <path d={svgPaths.p2b92b400} fill="#090909" />
              <path d={svgPaths.p29b4f280} fill="#090909" />
            </svg>
            <span className="font-heading text-[18px] font-bold uppercase tracking-[1.4px] text-foreground">
              Homigrow
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-16 sm:px-[100px]">
        <div className="w-full max-w-[1003px]">{children}</div>
      </main>

      <footer className="border-t border-black/[0.07] py-6">
        <p className="text-center font-heading text-[13px] uppercase tracking-[2px] text-foreground/30">
          © 2024 Homigrow · Privacy Protocol
        </p>
      </footer>
    </div>
  );
}
