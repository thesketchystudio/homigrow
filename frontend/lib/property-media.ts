// lib/property-media.ts
// Picks the representative image for a property's media gallery: the
// item explicitly flagged as the cover photo, or the first item if none
// is flagged. Also holds the upload limits the backend enforces, so every
// upload screen shows and checks the same numbers.

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const PHOTOS_PER_REQUEST = 10;
export const MAX_PHOTOS_PER_LISTING = 30;

/** Splits files into those within the photo size limit and the names of those over it. */
export function splitOversizedPhotos(files: File[]): { accepted: File[]; oversized: string[] } {
  const accepted: File[] = [];
  const oversized: string[] = [];
  for (const file of files) {
    if (file.size > MAX_PHOTO_BYTES) oversized.push(file.name);
    else accepted.push(file);
  }
  return { accepted, oversized };
}

/** Plain-language message naming the photos that were left out for being too large. */
export function oversizedPhotosMessage(names: string[]): string {
  const list = names.length > 3 ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more` : names.join(", ");
  return `${list} ${names.length === 1 ? "is" : "are"} over 10 MB and ${names.length === 1 ? "was" : "were"} not added.`;
}

/** Splits a list into consecutive groups of at most `size` items. */
export function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let start = 0; start < items.length; start += size) groups.push(items.slice(start, start + size));
  return groups;
}

export function coverImageUrl(media: { url: string; is_cover: boolean }[]): string | undefined {
  return media.find((item) => item.is_cover)?.url ?? media[0]?.url;
}
