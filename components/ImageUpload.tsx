"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ImageUpload01Icon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { formatBytes, prepareImageForUpload } from "@/lib/image-compression";

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
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
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setNotice("");

    if (file.size > MAX_SOURCE_BYTES) {
      setError("Image must be 20 MB or smaller before compression.");
      event.target.value = "";
      return;
    }

    setBusy(true);
    try {
      const prepared = await prepareImageForUpload(file);

      if (prepared.uploadBytes > MAX_UPLOAD_BYTES) {
        setError("Compressed image must be 4 MB or smaller.");
        return;
      }

      const safeName = prepared.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const blob = await upload(
        `${folder}/${crypto.randomUUID()}-${safeName}`,
        prepared.file,
        {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        },
      );
      setUrl(blob.url);
      if (prepared.compressed) {
        setNotice(
          `Compressed ${formatBytes(prepared.originalBytes)} to ${formatBytes(
            prepared.uploadBytes,
          )}.`,
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      <input type="hidden" name={name} value={url} required={required} />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        disabled={busy}
        className="hidden"
      />

      <div className="flex items-start gap-4">
        <div
          onClick={() => !busy && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className="group relative flex size-36 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/20 transition-all hover:border-primary/50 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {url ? (
            <>
              <Image
                src={url}
                alt=""
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="144px"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={ImageUpload01Icon}
                  className="size-5 text-white"
                />
                <span className="text-[11px] font-medium text-white">
                  Replace image
                </span>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                title="Clear image"
                onClick={(e) => {
                  e.stopPropagation();
                  setUrl("");
                  setNotice("");
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="absolute top-2 right-2 z-10 shadow-md"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Cancel01Icon}
                  className="size-3.5"
                />
                <span className="sr-only">Clear image</span>
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground transition-colors group-hover:text-foreground">
              {busy ? (
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Loading02Icon}
                  className="size-6 animate-spin text-primary"
                />
              ) : (
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={ImageUpload01Icon}
                  className="size-6"
                />
              )}
              <span className="text-xs font-medium">
                {busy ? "Uploading..." : "Upload image"}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
    </div>
  );
}
