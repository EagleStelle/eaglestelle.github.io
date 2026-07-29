"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  ImageUpload01Icon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes, prepareImageForUpload } from "@/lib/image-compression";
import type { ProjectImage } from "@/lib/project-data";

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
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
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setError("");
    setNotice("");

    const oversized = files.find((file) => file.size > MAX_SOURCE_BYTES);
    if (oversized) {
      setError("Images must be 20 MB or smaller before compression.");
      event.target.value = "";
      return;
    }

    setBusy(true);
    try {
      const preparedFiles = await Promise.all(
        files.map((file) => prepareImageForUpload(file)),
      );

      const tooLarge = preparedFiles.find(
        (item) => item.uploadBytes > MAX_UPLOAD_BYTES,
      );
      if (tooLarge) {
        setError("Compressed images must be 4 MB or smaller.");
        return;
      }

      const uploaded = await Promise.all(
        preparedFiles.map(async (prepared) => {
          const safeName = prepared.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
          const blob = await upload(
            `${folder}/${crypto.randomUUID()}-${safeName}`,
            prepared.file,
            {
              access: "public",
              handleUploadUrl: "/api/blob/upload",
            },
          );
          return { url: blob.url, title: "", description: "" };
        }),
      );

      setImages((items) => [...items, ...uploaded]);

      const compressed = preparedFiles.filter((item) => item.compressed);
      if (compressed.length > 0) {
        setNotice(
          `Compressed ${compressed.length} image${
            compressed.length === 1 ? "" : "s"
          } from ${formatBytes(
            compressed.reduce((total, item) => total + item.originalBytes, 0),
          )} to ${formatBytes(
            compressed.reduce((total, item) => total + item.uploadBytes, 0),
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
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          {label}
        </span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => !busy && inputRef.current?.click()}
          disabled={busy}
        >
          <HugeiconsIcon
            aria-hidden="true"
            icon={ImageUpload01Icon}
            className="size-3.5"
          />
          Add images
        </Button>
      </div>

      <input type="hidden" name={name} value={JSON.stringify(images)} />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        onChange={handleChange}
        disabled={busy}
        required={required && images.length === 0}
        className="hidden"
      />

      {images.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.url}
              className="group flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-3 shadow-xs"
            >
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted/40">
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 28vw, (min-width: 640px) 45vw, 90vw"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  title="Remove image"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 shadow-xs"
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={Cancel01Icon}
                    className="size-3.5"
                  />
                  <span className="sr-only">Remove image</span>
                </Button>
              </div>

              <Input
                value={image.title}
                onChange={(event) => edit(index, "title", event.target.value)}
                aria-label={`Image ${index + 1} title`}
              />
              <Textarea
                value={image.description}
                onChange={(event) =>
                  edit(index, "description", event.target.value)
                }
                aria-label={`Image ${index + 1} description`}
                className="min-h-16 text-xs"
              />

              <div className="flex items-center gap-1 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={ArrowLeft01Icon}
                    className="size-3.5"
                  />
                  <span className="sr-only">Move earlier</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === images.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={ArrowRight01Icon}
                    className="size-3.5"
                  />
                  <span className="sr-only">Move later</span>
                </Button>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  #{index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
          className="flex aspect-video max-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground transition-all hover:border-primary/50 hover:bg-muted/40 hover:text-foreground"
        >
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
            {busy ? "Uploading images..." : "Click to select & upload images"}
          </span>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
    </div>
  );
}
