import { del } from "@vercel/blob";
import { deletedBlobUrlsField, isPendingImageUrl } from "@/lib/image-upload";

export function deletedBlobUrls(
  formData: FormData,
  fieldName: string,
): string[] {
  return parseUrlList(formData.get(deletedBlobUrlsField(fieldName)));
}

export async function removeBlob(url: string | null | undefined): Promise<void> {
  await removeBlobs([url]);
}

export async function removeBlobs(
  urls: Iterable<string | null | undefined>,
): Promise<void> {
  const blobUrls = uniqueBlobUrls(urls);
  if (blobUrls.length === 0) return;

  await del(blobUrls);
}

export async function removeChangedBlobs(
  previous: Iterable<string | null | undefined>,
  next: Iterable<string | null | undefined>,
): Promise<void> {
  const nextUrls = new Set(
    [...next].filter((url): url is string => Boolean(url)),
  );
  await removeBlobs([...previous].filter((url) => url && !nextUrls.has(url)));
}

export function assertPersistedBlobUrls(urls: Iterable<string>): void {
  if ([...urls].some(isPendingImageUrl)) {
    throw new Error("Image upload did not finish. Please try saving again.");
  }
}

function uniqueBlobUrls(urls: Iterable<string | null | undefined>): string[] {
  return [...urls].reduce<string[]>((items, url) => {
    const value = typeof url === "string" ? url.trim() : "";
    if (value && isVercelBlobUrl(value) && !items.includes(value)) {
      items.push(value);
    }
    return items;
  }, []);
}

function parseUrlList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || value.trim() === "") return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.reduce<string[]>((urls, entry) => {
      if (typeof entry !== "string") return urls;
      const url = entry.trim();
      if (url && !urls.includes(url)) {
        urls.push(url);
      }
      return urls;
    }, []);
  } catch {
    return [];
  }
}

function isVercelBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}
