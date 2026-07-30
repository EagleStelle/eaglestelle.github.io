"use client";

import Image from "next/image";
import {
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
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_IMAGE_INPUT,
  compressionNotice,
  prepareStagedImage,
  revokeStagedImage,
  uploadStagedImage,
  type StagedImageUpload,
} from "@/lib/admin-image-upload-client";
import { deletedBlobUrlsField } from "@/lib/image-upload";

type Props = {
  name: string;
  folder: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
};

type ImageState =
  | {
      kind: "saved";
      url: string;
    }
  | {
      kind: "pending";
      staged: StagedImageUpload;
    };

export default function ImageUpload({
  name,
  folder,
  label,
  defaultValue,
  required = false,
}: Props) {
  const [image, setImage] = useState<ImageState | null>(
    defaultValue ? { kind: "saved", url: defaultValue } : null,
  );
  const [deletedUrls, setDeletedUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef(image);

  useEffect(() => {
    imageRef.current = image;
  }, [image]);

  useEffect(() => {
    return () => {
      const current = imageRef.current;
      if (current?.kind === "pending") {
        revokeStagedImage(current.staged);
      }
    };
  }, []);

  const beforeSubmitTask = useMemo(
    () => ({
      hasPending: () => imageRef.current?.kind === "pending",
      run: async () => {
        const current = imageRef.current;
        if (current?.kind !== "pending") return;

        setBusy(true);
        setError("");
        try {
          const url = await uploadStagedImage(folder, current.staged.file);
          revokeStagedImage(current.staged);

          const next = { kind: "saved", url } satisfies ImageState;
          imageRef.current = next;
          if (valueRef.current) {
            valueRef.current.value = url;
          }
          setImage(next);
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
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setNotice("");

    setBusy(true);
    try {
      const staged = await prepareStagedImage(file);
      const current = imageRef.current;

      if (current?.kind === "saved") {
        rememberDeletedUrl(current.url);
      } else if (current?.kind === "pending") {
        revokeStagedImage(current.staged);
      }

      const next = { kind: "pending", staged } satisfies ImageState;
      imageRef.current = next;
      if (valueRef.current) {
        valueRef.current.value = "";
      }
      setImage(next);
      setNotice(compressionNotice([staged]));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image failed.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  function rememberDeletedUrl(url: string) {
    setDeletedUrls((urls) => (urls.includes(url) ? urls : [...urls, url]));
  }

  function clearImage() {
    const current = imageRef.current;
    if (current?.kind === "saved") {
      rememberDeletedUrl(current.url);
    } else if (current?.kind === "pending") {
      revokeStagedImage(current.staged);
    }

    imageRef.current = null;
    if (valueRef.current) {
      valueRef.current.value = "";
    }
    setImage(null);
    setNotice("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const savedUrl = image?.kind === "saved" ? image.url : "";
  const previewUrl =
    image?.kind === "pending" ? image.staged.previewUrl : savedUrl;

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      <input
        ref={valueRef}
        type="hidden"
        name={name}
        value={savedUrl}
        required={required}
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
          {image ? (
            <>
              {image.kind === "saved" ? (
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="144px"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt=""
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
              )}
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
                  clearImage();
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
                {busy ? "Preparing..." : "Select image"}
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
