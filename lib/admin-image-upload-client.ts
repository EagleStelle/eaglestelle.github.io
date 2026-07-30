"use client";

import { upload } from "@vercel/blob/client";
import {
  ACCEPTED_IMAGE_INPUT,
  MAX_IMAGE_SOURCE_BYTES,
  MAX_IMAGE_UPLOAD_BYTES,
} from "@/lib/image-upload";
import {
  formatBytes,
  prepareImageForUpload,
  type PreparedImageUpload,
} from "@/lib/image-compression";

export { ACCEPTED_IMAGE_INPUT };

export type StagedImageUpload = PreparedImageUpload & {
  id: string;
  previewUrl: string;
};

export async function prepareStagedImage(file: File): Promise<StagedImageUpload> {
  const [image] = await prepareStagedImages([file]);
  if (!image) {
    throw new Error("Select an image to upload.");
  }
  return image;
}

export async function prepareStagedImages(
  files: File[],
): Promise<StagedImageUpload[]> {
  const oversized = files.find((file) => file.size > MAX_IMAGE_SOURCE_BYTES);
  if (oversized) {
    throw new Error("Images must be 20 MB or smaller before compression.");
  }

  const preparedFiles = await Promise.all(
    files.map((file) => prepareImageForUpload(file)),
  );

  const tooLarge = preparedFiles.find(
    (item) => item.uploadBytes > MAX_IMAGE_UPLOAD_BYTES,
  );
  if (tooLarge) {
    throw new Error("Compressed images must be 4 MB or smaller.");
  }

  return preparedFiles.map((prepared) => ({
    ...prepared,
    id: crypto.randomUUID(),
    previewUrl: URL.createObjectURL(prepared.file),
  }));
}

export function compressionNotice(images: StagedImageUpload[]): string {
  const compressed = images.filter((item) => item.compressed);
  if (compressed.length === 0) return "";

  return `Compressed ${compressed.length} image${
    compressed.length === 1 ? "" : "s"
  } from ${formatBytes(
    compressed.reduce((total, item) => total + item.originalBytes, 0),
  )} to ${formatBytes(
    compressed.reduce((total, item) => total + item.uploadBytes, 0),
  )}.`;
}

export function revokeStagedImage(image: StagedImageUpload | null | undefined) {
  if (image) {
    URL.revokeObjectURL(image.previewUrl);
  }
}

export async function uploadStagedImage(
  folder: string,
  file: File,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const blob = await upload(
    `${folder}/${crypto.randomUUID()}-${safeName}`,
    file,
    {
      access: "public",
      handleUploadUrl: "/api/blob/upload",
    },
  );

  return blob.url;
}
