"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  ImageUpload01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif";

type Props = {
  name: string;
  folder: string;
  label: string;
  defaultValue?: string[];
  required?: boolean;
};

export function ImageGalleryUpload({
  name,
  folder,
  label,
  defaultValue = [],
  required = false,
}: Props) {
  const [urls, setUrls] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setError("");

    const oversized = files.find((file) => file.size > MAX_BYTES);
    if (oversized) {
      setError("Image must be 8 MB or smaller.");
      event.target.value = "";
      return;
    }

    setBusy(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
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
        }),
      );

      setUrls((items) => [...items, ...uploaded]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  function move(index: number, direction: -1 | 1) {
    setUrls((items) => {
      const next = [...items];
      const target = index + direction;
      if (target < 0 || target >= next.length) return items;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setUrls((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(urls)}
        required={required}
      />

      <Input
        type="file"
        accept={ACCEPTED}
        multiple
        onChange={handleChange}
        disabled={busy}
        className="cursor-pointer file:mr-3 file:cursor-pointer file:text-sm"
      />

      {urls.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {urls.map((url, index) => (
            <div key={url} className="flex flex-col gap-2">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/40">
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 20vw, 50vw"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={ArrowLeft01Icon}
                    className="size-4"
                  />
                  <span className="sr-only">Move earlier</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={index === urls.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={ArrowRight01Icon}
                    className="size-4"
                  />
                  <span className="sr-only">Move later</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => remove(index)}
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={Delete02Icon}
                    className="size-4"
                  />
                  <span className="sr-only">Remove image</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
          <HugeiconsIcon
            aria-hidden="true"
            icon={ImageUpload01Icon}
            className="size-5"
          />
        </div>
      )}

      {busy && <p className="text-sm text-muted-foreground">Uploading...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
