// lib/property-media.ts
// Picks the representative image for a property's media gallery: the
// item explicitly flagged as the cover photo, or the first item if none
// is flagged.

export function coverImageUrl(media: { url: string; is_cover: boolean }[]): string | undefined {
  return media.find((item) => item.is_cover)?.url ?? media[0]?.url;
}
