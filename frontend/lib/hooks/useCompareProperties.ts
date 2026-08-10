// lib/hooks/useCompareProperties.ts
// Shared fetch for whichever ids are queued for comparison — used by both
// CompareDrawer (thumbnails) and the /compare page (full spec table) so
// there's exactly one fetch path, mirroring
// useSavedPropertyToggle's SAVED_IDS_QUERY_KEY export precedent.

import { useQuery } from "@tanstack/react-query";

import { compareProperties } from "@/lib/api/endpoints/properties";

function compareQueryKey(ids: string[]) {
  return ["compare-properties", [...ids].sort()];
}

export function useCompareProperties(ids: string[]) {
  return useQuery({
    queryKey: compareQueryKey(ids),
    queryFn: () => compareProperties(ids),
    enabled: ids.length > 0,
  });
}
