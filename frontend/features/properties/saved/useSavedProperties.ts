// features/properties/saved/useSavedProperties.ts
// State and data access shared by every screen that lists the signed-in
// user's saved properties (the standalone /saved page and the Profile
// "Saved" tab): category filter, sort, pagination, the paged query, and
// the unsave mutation with its cache invalidation.

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { categoryToPropertyTypes, type SavedCategory } from "@/features/properties/saved/SavedCategoryPills";
import {
  listSavedProperties,
  unsaveProperty,
  type SavedPropertyListResponse,
  type SavedSort,
} from "@/lib/api/endpoints/savedProperties";
import { SAVED_IDS_QUERY_KEY } from "@/lib/hooks/useSavedPropertyToggle";

export const SAVED_PAGE_SIZE = 12;

export function useSavedProperties() {
  const [category, setCategory] = useState<SavedCategory>("all");
  const [sort, setSort] = useState<SavedSort>("recent");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const propertyType = categoryToPropertyTypes(category);
  const queryKey = ["saved-properties", category, sort, page];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => listSavedProperties({ property_type: propertyType, sort, page, page_size: SAVED_PAGE_SIZE }),
  });

  const unsaveMutation = useMutation({
    mutationFn: (id: string) => unsaveProperty(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["saved-properties"] });
      queryClient.invalidateQueries({ queryKey: SAVED_IDS_QUERY_KEY });
      // Unsaving the last item on a page beyond the first would otherwise
      // leave the view stuck showing an empty grid even though earlier
      // pages still have items — step back a page once the refetch
      // confirms this page is now empty.
      const refetched = queryClient.getQueryData<SavedPropertyListResponse>(queryKey);
      if (refetched && refetched.items.length === 0 && page > 1) {
        setPage(page - 1);
      }
    },
  });

  const changeCategory = (next: SavedCategory) => {
    setCategory(next);
    setPage(1);
  };

  const changeSort = (next: SavedSort) => {
    setSort(next);
    setPage(1);
  };

  return {
    category,
    sort,
    page,
    setPage,
    changeCategory,
    changeSort,
    data,
    isLoading,
    error,
    unsave: (id: string) => unsaveMutation.mutate(id),
    savedIds: new Set((data?.items ?? []).map((item) => item.id)),
  };
}
