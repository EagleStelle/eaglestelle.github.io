"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      <input type="hidden" name={name} value={url} required={required} />

      <div className="flex flex-wrap items-start gap-4">
        {url ? (
          <div className="relative size-36 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
            <Image
              src={url}
              alt=""
              fill
              className="object-cover"
              sizes="144px"
            />
          </div>
        ) : (
          <div className="flex size-36 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            No image
          </div>
        )}

        <div className="flex min-w-56 flex-1 flex-col gap-3">
          <Input
            type="file"
            accept={ACCEPTED}
            onChange={handleChange}
            disabled={busy}
            className="cursor-pointer file:mr-3 file:cursor-pointer file:text-sm"
          />

          {url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setUrl("")}
              className="w-fit rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Clear image
            </Button>
          )}

          {busy && (
            <p className="text-sm text-muted-foreground">Uploading…</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
