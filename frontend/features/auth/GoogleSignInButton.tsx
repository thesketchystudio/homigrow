// features/auth/GoogleSignInButton.tsx
// Renders Google's own "Sign in with Google" button (Identity
// Services) and exchanges the resulting ID token for a Homigrow
// session via POST /auth/google. role is omitted on the login page —
// an unmatched email 404s (GOOGLE_ACCOUNT_NOT_FOUND) rather than
// auto-creating an account — and supplied on signup Step 2, where
// it's already known from Step 1's role select.

"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { googleAuth, type TokenResponse } from "@/lib/api/endpoints/auth";
import { toast } from "@/lib/toast";
import { UserRole } from "@/lib/enums";

type GoogleSignInButtonProps = {
  role?: Exclude<UserRole, "admin">;
  onSuccess: (session: TokenResponse) => void;
  onNoAccount?: () => void;
};

export function GoogleSignInButton({ role, onSuccess, onNoAccount }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const { mutate } = useMutation({
    mutationFn: googleAuth,
    onSuccess,
    onError: (error: ApiError) => {
      if (error.code === "GOOGLE_ACCOUNT_NOT_FOUND" && onNoAccount) {
        onNoAccount();
        return;
      }
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!scriptLoaded || !clientId || !buttonRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => mutate({ id_token: response.credential, role }),
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: buttonRef.current.offsetWidth || 400,
    });
  }, [scriptLoaded, clientId, role, mutate]);

  if (!clientId) return null;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setScriptLoaded(true)} />
      <div ref={buttonRef} className="flex w-full justify-center [&>div]:!w-full" />
    </>
  );
}
