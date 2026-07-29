"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif";

type Props = {
  name: string;
  folder: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
};

export default function ImageUpload({
  name,
  folder,
  label,
  defaultValue,
  required = false,
}: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    if (file.size > MAX_BYTES) {
      setError("Image must be 8 MB or smaller.");
      event.target.value = "";
      return;
    }

    setBusy(true);
    try {
      const blob = await upload(`${folder}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      setUrl(blob.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={url} required={required} />

      {url ? (
        <div className="relative h-40 w-40 overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
          <Image src={url} alt="" fill className="object-cover" sizes="160px" />
        </div>
      ) : (
        <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed border-black/20 text-xs text-zinc-500 dark:border-white/20">
          No image
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept={ACCEPTED}
          onChange={handleChange}
          disabled={busy}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:text-white disabled:opacity-50 dark:file:bg-zinc-100 dark:file:text-black"
        />
        {url && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="text-sm text-red-600 underline"
          >
            Clear
          </button>
        )}
      </div>

      {busy && <p className="text-sm text-zinc-500">Uploading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
