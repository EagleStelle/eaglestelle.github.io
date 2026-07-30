"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ImageUpload01Icon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";
import { useBeforeActionSubmit } from "@/components/admin/action-form";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCEPTED_IMAGE_INPUT,
  compressionNotice,
  prepareStagedImages,
  revokeStagedImage,
  uploadStagedImage,
  type StagedImageUpload,
} from "@/lib/admin-image-upload-client";
import { deletedBlobUrlsField, pendingImageUrl } from "@/lib/image-upload";
import type { ProjectImage } from "@/lib/project-data";

type Props = {
  name: string;
  folder: string;
  label: string;
  defaultValue?: ProjectImage[];
  required?: boolean;
};

type GalleryImage =
  | (ProjectImage & {
      kind: "saved";
      id: string;
    })
  | (ProjectImage & {
      kind: "pending";
      id: string;
      staged: StagedImageUpload;
    });

const EMPTY_PROJECT_IMAGES: ProjectImage[] = [];

export function ImageGalleryUpload({
  name,
  folder,
  label,
  defaultValue,
  required = false,
}: Props) {
  const savedDefaultImages = defaultValue ?? EMPTY_PROJECT_IMAGES;
  const [images, setImages] = useState<GalleryImage[]>(
    () => savedDefaultImages.map(toSavedImage),
  );
  const [deletedUrls, setDeletedUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const resetImages = useCallback(() => {
    const nextImages = savedDefaultImages.map(toSavedImage);

    imagesRef.current.forEach((image) => {
      if (image.kind === "pending") {
        revokeStagedImage(image.staged);
      }
    });

    imagesRef.current = nextImages;
    if (inputRef.current) inputRef.current.value = "";
    if (valueRef.current) {
      valueRef.current.value = serializeGalleryImages(nextImages);
    }
    setImages(nextImages);
    setDeletedUrls([]);
    setError("");
    setNotice("");
    setBusy(false);
  }, [savedDefaultImages]);

  useEffect(() => {
    const form = valueRef.current?.form;
    if (!form) return undefined;

    form.addEventListener("reset", resetImages);
    return () => form.removeEventListener("reset", resetImages);
  }, [resetImages]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.kind === "pending") {
          revokeStagedImage(image.staged);
        }
      });
    };
  }, []);

  const beforeSubmitTask = useMemo(
    () => ({
      hasPending: () =>
        imagesRef.current.some((image) => image.kind === "pending"),
      run: async () => {
        setBusy(true);
        setError("");
        try {
          const pendingImages = imagesRef.current.filter(
            (image): image is Extract<GalleryImage, { kind: "pending" }> =>
              image.kind === "pending",
          );

          for (const pending of pendingImages) {
            const current = imagesRef.current.find(
              (image) => image.id === pending.id,
            );
            if (current?.kind !== "pending") continue;

            const url = await uploadStagedImage(folder, pending.staged.file);
            revokeStagedImage(pending.staged);
            commitImages(
              imagesRef.current.map((image) =>
                image.id === pending.id
                  ? toSavedImage({
                      url,
                      title: pending.title,
                      description: pending.description,
                    })
                  : image,
              ),
            );
          }

          setNotice("");
        } finally {
          setBusy(false);
        }
      },
    }),
    [folder],
  );

  useBeforeActionSubmit(beforeSubmitTask);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setError("");
    setNotice("");

    setBusy(true);
    try {
      const stagedImages = await prepareStagedImages(files);
      commitImages((items) => [
        ...items,
        ...stagedImages.map((staged) => ({
          kind: "pending" as const,
          id: staged.id,
          url: pendingImageUrl(staged.id),
          title: "",
          description: "",
          staged,
        })),
      ]);
      setNotice(compressionNotice(stagedImages));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Images failed.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  function commitImages(
    next:
      | GalleryImage[]
      | ((current: GalleryImage[]) => GalleryImage[]),
  ) {
    const resolved = typeof next === "function" ? next(imagesRef.current) : next;
    imagesRef.current = resolved;
    if (valueRef.current) {
      valueRef.current.value = serializeGalleryImages(resolved);
    }
    setImages(resolved);
  }

  function rememberDeletedUrl(url: string) {
    setDeletedUrls((urls) => (urls.includes(url) ? urls : [...urls, url]));
  }

  function reorder(orderedUrls: Array<string | number>) {
    const current = imagesRef.current;
    commitImages(
      orderedUrls.reduce<GalleryImage[]>((next, id) => {
        const image = current.find((item) => item.id === String(id));
        if (image) next.push(image);
        return next;
      }, []),
    );
  }

  function remove(index: number) {
    const image = imagesRef.current[index];
    if (!image) return;

    if (image.kind === "saved") {
      rememberDeletedUrl(image.url);
    } else {
      revokeStagedImage(image.staged);
    }

    commitImages((items) =>
      items.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function edit(index: number, field: "title" | "description", value: string) {
    commitImages((items) =>
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

      <input
        ref={valueRef}
        type="hidden"
        name={name}
        value={serializeGalleryImages(images)}
        readOnly
      />
      <input
        type="hidden"
        name={deletedBlobUrlsField(name)}
        value={JSON.stringify(deletedUrls)}
        readOnly
      />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_INPUT}
        multiple
        onChange={handleChange}
        disabled={busy}
        required={required && images.length === 0}
        className="hidden"
      />

      {images.length > 0 ? (
        <ReorderableList
          onReorder={reorder}
          className="flex flex-col gap-3"
          items={images.map((image, index) => ({
            id: image.id,
            content: (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40 sm:w-40 lg:w-48">
                  {image.kind === "saved" ? (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 12rem, (min-width: 640px) 10rem, 90vw"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.staged.previewUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    title="Remove image"
                    onClick={() => remove(index)}
                    disabled={busy}
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

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Input
                    value={image.title}
                    placeholder="Title"
                    onChange={(event) =>
                      edit(index, "title", event.target.value)
                    }
                    aria-label={`Image ${index + 1} title`}
                  />
                  <Textarea
                    value={image.description}
                    placeholder="Description"
                    onChange={(event) =>
                      edit(index, "description", event.target.value)
                    }
                    aria-label={`Image ${index + 1} description`}
                    className="min-h-20 text-xs"
                  />
                </div>
              </div>
            ),
          }))}
        />
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
            {busy ? "Preparing images..." : "Click to select images"}
          </span>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
    </div>
  );
}

function toSavedImage(image: ProjectImage): GalleryImage {
  return {
    ...image,
    kind: "saved",
    id: image.url,
  };
}

function serializeGalleryImages(images: GalleryImage[]): string {
  return JSON.stringify(
    images.map((image) => ({
      url: image.kind === "saved" ? image.url : pendingImageUrl(image.id),
      title: image.title,
      description: image.description,
    })),
  );
}
