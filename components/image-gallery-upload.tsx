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
import { Textarea } from "@/components/ui/textarea";
import type { ProjectImage } from "@/lib/project-data";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif";

type Props = {
  name: string;
  folder: string;
  label: string;
  defaultValue?: ProjectImage[];
  required?: boolean;
};

export function ImageGalleryUpload({
  name,
  folder,
  label,
  defaultValue = [],
  required = false,
}: Props) {
  const [images, setImages] = useState(defaultValue);
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
          return { url: blob.url, title: "", description: "" };
        }),
      );

      setImages((items) => [...items, ...uploaded]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  function move(index: number, direction: -1 | 1) {
    setImages((items) => {
      const next = [...items];
      const target = index + direction;
      if (target < 0 || target >= next.length) return items;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setImages((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  function edit(index: number, field: "title" | "description", value: string) {
    setImages((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      <input type="hidden" name={name} value={JSON.stringify(images)} />

      <Input
        type="file"
        accept={ACCEPTED}
        multiple
        onChange={handleChange}
        disabled={busy}
        required={required && images.length === 0}
        className="cursor-pointer file:mr-3 file:cursor-pointer file:text-sm"
      />

      {images.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.url}
              className="flex flex-col gap-2 rounded-lg border border-border p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/40">
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 28vw, (min-width: 640px) 45vw, 90vw"
                />
              </div>

              <Input
                value={image.title}
                onChange={(event) => edit(index, "title", event.target.value)}
                placeholder="Image title"
                aria-label={`Image ${index + 1} title`}
              />
              <Textarea
                value={image.description}
                onChange={(event) =>
                  edit(index, "description", event.target.value)
                }
                placeholder="Image description"
                aria-label={`Image ${index + 1} description`}
                className="min-h-20"
              />

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
                  disabled={index === images.length - 1}
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
