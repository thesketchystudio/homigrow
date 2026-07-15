// features/auth/WelcomeScreen.tsx
// Welcome/chooser screen (Figma: "landing", node 423:3792, "common screen"
// section) — the entry point offered before both signup and login. Google
// sign-in is deferred here too, matching the same call made on the login
// screen (P2-T35).

"use client";

import { useRouter } from "next/navigation";

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-4">
        <span className="w-fit rounded bg-brand-green-500 px-3 py-[3.5px] font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-primary-400">
          Exclusive Access
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[36px] font-medium leading-[44px] text-foreground">
            Your exclusive real estate haven.
          </h1>
          <p className="font-body text-[16px] leading-[26px] text-brand-secondary-800">
            Access curated properties and connect with verified brokers worldwide.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => router.push("/signup")}
          className="w-full rounded bg-gradient-to-r from-black to-[#131b2e] py-4 font-heading text-[16px] font-bold text-background"
        >
          Get started
        </button>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full rounded border border-brand-primary-100 py-[17px] font-heading text-[16px] font-bold text-brand-primary-400"
        >
          Log in
        </button>
      </div>

      <p className="text-center font-heading text-[16px] text-brand-secondary-800">
        {"Already have an account? "}
        <button type="button" onClick={() => router.push("/login")} className="font-bold text-foreground">
          Log in →
        </button>
      </p>
    </div>
  );
}
