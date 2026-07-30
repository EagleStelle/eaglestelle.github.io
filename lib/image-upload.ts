export const MAX_IMAGE_SOURCE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
export const ACCEPTED_IMAGE_INPUT = ACCEPTED_IMAGE_TYPES.join(",");

const PENDING_IMAGE_PREFIX = "pending:image:";

export function pendingImageUrl(id: string): string {
  return `${PENDING_IMAGE_PREFIX}${id}`;
}

export function isPendingImageUrl(url: string): boolean {
  return url.startsWith(PENDING_IMAGE_PREFIX);
}

export function deletedBlobUrlsField(name: string): string {
  return `${name}DeletedBlobUrls`;
}
