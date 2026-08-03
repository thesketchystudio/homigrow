// lib/hooks/useSavedPropertyToggle.ts
// Shared saved/unsaved state + optimistic toggle for PropertyCard's heart
// button (10_Phase_3.md P3-T40), used by both the /properties Listings
// grid and the homepage Trending section — the only two places that
// currently render property cards backed by GET /properties data.
//
// Fetches up to 50 saved ids (the backend's max page_size) just to know
// membership for card display — not the full paginated saved list, which
// is a separate, not-yet-built "Saved properties" screen (P3-T41).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listSavedProperties, saveProperty, unsaveProperty } from "@/lib/api/endpoints/savedProperties";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "@/lib/toast";

// Exported so the Saved properties page (P3-T41) can invalidate this same
// cache after an unsave — otherwise a heart icon on another page (Listings,
// homepage Trending) would keep showing "saved" until its own query refetches.
export const SAVED_IDS_QUERY_KEY = ["saved-property-ids"];

export function useSavedPropertyToggle() {
  const isAuthenticated = useAuthStore((state) => state.status === "authenticated");
  const queryClient = useQueryClient();

  const { data: savedIds } = useQuery({
    queryKey: SAVED_IDS_QUERY_KEY,
    queryFn: async () => {
      const response = await listSavedProperties({ page_size: 50 });
      return new Set(response.items.map((item) => item.id));
    },
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: ({ id, wasSaved }: { id: string; wasSaved: boolean }) =>
      wasSaved ? unsaveProperty(id) : saveProperty(id),
    onMutate: async ({ id, wasSaved }) => {
      await queryClient.cancelQueries({ queryKey: SAVED_IDS_QUERY_KEY });
      const previous = queryClient.getQueryData<Set<string>>(SAVED_IDS_QUERY_KEY);
      const next = new Set(previous);
      if (wasSaved) {
        next.delete(id);
      } else {
        next.add(id);
      }
      queryClient.setQueryData(SAVED_IDS_QUERY_KEY, next);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(SAVED_IDS_QUERY_KEY, context?.previous);
      toast.error("Couldn't update your saved properties.");
    },
  });

  const onToggleSave = (id: string) => {
    if (!isAuthenticated) {
      toast.info("Log in to save properties.");
      return;
    }
    mutation.mutate({ id, wasSaved: savedIds?.has(id) ?? false });
  };

  return { savedIds: savedIds ?? new Set<string>(), onToggleSave };
}
