// features/auth/AuthSplitShell.tsx
// Shared split-screen page shell for the login and welcome screens (Figma
// "landing" frames, nodes 423:3651 / 423:3792 on the Onboarding page): a
// dark hero BrandPanel on the left, page content on the right. Signup's
// own Figma frames (416:623 etc.) don't use this shell — that flow keeps
// the simpler (auth) route group layout instead.

import svgPaths from "@/lib/homepage-svg-paths";

export function AuthSplitShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden w-[683px] shrink-0 overflow-hidden lg:block">
        <img src="/auth/brand-panel.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "linear-gradient(153deg, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0.55) 50%)" }}
        />
        <div className="relative flex h-full flex-col justify-between px-[100px] py-12">
          <div className="flex items-center gap-2">
            <svg width="24" height="22" viewBox="0 0 45.4044 40.0834" fill="none">
              <path d={svgPaths.p2b92b400} fill="#fefeff" />
              <path d={svgPaths.p29b4f280} fill="#fefeff" />
            </svg>
            <span className="font-heading text-[18px] font-bold uppercase tracking-[1.4px] text-background">
              Homigrow
            </span>
          </div>

          <div className="flex flex-col gap-6">
            <span className="w-fit rounded bg-brand-green-500 px-3 py-[3.5px] font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-primary-400">
              Curated Living
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-heading text-[48px] font-bold leading-[60px] text-background">
                Real estate.
                <br />
                Made simpler.
              </h2>
              <p className="max-w-[360px] font-body text-[16px] leading-[26px] text-brand-secondary-800">
                Find, list, and invest in premium properties with verified brokers.
              </p>
            </div>
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="font-heading text-[28px] font-bold text-background">2.4k</span>
                <span className="font-heading text-[16px] tracking-[1px] text-background/50">Active Listings</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-[28px] font-bold text-background">140+</span>
                <span className="font-heading text-[16px] tracking-[1px] text-background/50">Global Markets</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-[448px]">{children}</div>
      </div>
    </div>
  );
}
