// features/profile/ProfileHeaderActions.tsx
// Lets a tab page (AccountTab, PreferencesTab, ...) inject its own
// right-aligned action button(s) into the shared header ProfileLayout
// renders above the sidebar+content row (Figma node 569:673/145:4687:
// the back arrow + "Edit preferences"/"Discard Changes"+"Save Changes"
// row sits full-width above the two-column layout, not inside a single
// tab's own content column). A tab with no edit capability (My
// Properties, Documents, ...) simply never calls the hook, leaving the
// slot empty.

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const ProfileHeaderActionsContext = createContext<((node: ReactNode) => void) | null>(null);

export function ProfileHeaderActionsProvider({ children }: { children: (actions: ReactNode) => ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null);
  return <ProfileHeaderActionsContext.Provider value={setActions}>{children(actions)}</ProfileHeaderActionsContext.Provider>;
}

// Registers `node` as the current tab's header action content for as long
// as the calling component is mounted, clearing it on unmount so the next
// tab's own registration (or nothing) takes over.
export function useProfileHeaderActions(node: ReactNode) {
  const setActions = useContext(ProfileHeaderActionsContext);
  useEffect(() => {
    setActions?.(node);
    return () => setActions?.(null);
  }, [setActions, node]);
}
