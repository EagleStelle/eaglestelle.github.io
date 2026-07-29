"use client";

import Image from "next/image";
import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowUpRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/period";
import { cn } from "@/lib/utils";

export type CredentialView = {
  id: number;
  title: string;
  issuer: string;
  imageUrl: string;
  credentialUrl: string | null;
  issuedAt: Date | string | null;
};

function UiIcon({
  icon,
  className,
}: {
  icon: IconSvgElement;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      icon={icon}
      className={cn("size-4 shrink-0", className)}
    />
  );
}

function stopCardOpen(event: MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation();
}

function CredentialCard({ credential }: { credential: CredentialView }) {
  const [open, setOpen] = useState(false);
  const issuedDateLabel = formatDateLabel(credential.issuedAt);
  const issuerDate = credential.issuer
    ? `${credential.issuer}${issuedDateLabel ? ` / ${issuedDateLabel}` : ""}`
    : issuedDateLabel;

  function openCredential() {
    setOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openCredential();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <article
        role="button"
        tabIndex={0}
        aria-label={`Open ${credential.title}`}
        onClick={openCredential}
        onKeyDown={handleKeyDown}
        className="glass-orb portfolio-item group relative flex aspect-video cursor-pointer flex-col justify-between overflow-hidden rounded-lg p-3 outline-none focus-visible:outline-2 focus-visible:outline-ring sm:p-4"
      >
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <Image
            src={credential.imageUrl}
            alt={credential.title}
            fill
            sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover rounded-lg"
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 inset-x-0 h-[52%] bg-gradient-to-t from-neutral-950 via-neutral-950/90 via-50% to-transparent transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 inset-x-0 h-[52%] opacity-0 bg-gradient-to-t from-primary via-primary/90 via-50% to-transparent transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        />

        <div className="relative flex items-start justify-end gap-3">
          {credential.credentialUrl && (
            <Button
              asChild
              variant="default"
              size="icon-only"
              className="size-8"
            >
              <a
                href={credential.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stopCardOpen}
              >
                <UiIcon icon={ArrowUpRight01Icon} />
                <span className="sr-only">Verify</span>
              </a>
            </Button>
          )}
        </div>

        <div className="relative flex flex-col gap-1">
          <h3 className="text-lg leading-tight font-semibold text-balance sm:text-xl text-white">
            {credential.title}
          </h3>
          {issuerDate && (
            <p className="flex shrink-0 items-center gap-1.5 font-mono text-xs tracking-[0.08em] text-white/60 uppercase truncate">
              {issuerDate}
            </p>
          )}
        </div>
      </article>

      <DialogContent
        showCloseButton={false}
        className="flex h-auto max-h-[90dvh] w-full max-w-[calc(100%-var(--spacing)*8)] flex-col justify-between overflow-hidden p-4 sm:h-[calc(100dvh-var(--spacing)*6)] sm:max-h-[calc(100dvh-var(--spacing)*6)] sm:max-w-5xl sm:p-5"
      >
        {/* Top header row with title and close button */}
        <div className="flex shrink-0 items-center justify-between gap-4 pb-1">
          <DialogTitle className="text-xl leading-tight font-semibold text-balance text-foreground md:text-2xl">
            {credential.title}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={Cancel01Icon}
                className="size-5"
              />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </div>

        <DialogDescription className="sr-only">
          {credential.title}
        </DialogDescription>

        {/* Strict 16:9 Aspect Ratio Image Container */}
        <div className="relative aspect-video w-full shrink-0 sm:flex-1 overflow-hidden rounded-lg bg-neutral-950/20">
          <Image
            src={credential.imageUrl}
            alt={credential.title}
            fill
            priority
            sizes="(min-width: 1024px) 64rem, 100vw"
            className="object-cover rounded-lg"
          />
        </div>

        {/* Bottom Issuer / Date */}
        {issuerDate && (
          <p className="shrink-0 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase pt-1">
            {issuerDate}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CredentialShowcase({
  credentials,
}: {
  credentials: CredentialView[];
}) {
  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
      {credentials.map((credential) => (
        <CredentialCard key={credential.id} credential={credential} />
      ))}
    </div>
  );
}
