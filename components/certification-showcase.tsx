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

export type CertificationView = {
  id: number;
  title: string;
  issuer: string;
  imageUrl: string;
  certificationUrl: string | null;
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

function CertificationCard({
  certification,
}: {
  certification: CertificationView;
}) {
  const [open, setOpen] = useState(false);
  const issuedDateLabel = formatDateLabel(certification.issuedAt);
  const issuerDate = certification.issuer
    ? `${certification.issuer}${issuedDateLabel ? ` / ${issuedDateLabel}` : ""}`
    : issuedDateLabel;

  function openCertification() {
    setOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openCertification();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <article
        role="button"
        tabIndex={0}
        aria-label={`Open ${certification.title}`}
        onClick={openCertification}
        onKeyDown={handleKeyDown}
        className="glass-orb portfolio-item group relative flex aspect-video cursor-pointer flex-col justify-between overflow-hidden rounded-lg p-2.5 outline-none focus-visible:outline-2 focus-visible:outline-ring sm:p-4"
      >
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <Image
            src={certification.imageUrl}
            alt={certification.title}
            fill
            sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 25vw, 50vw"
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
          {certification.certificationUrl && (
            <Button
              asChild
              variant="default"
              size="icon-only"
              className="size-7 sm:size-8"
            >
              <a
                href={certification.certificationUrl}
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

        <div className="relative flex flex-col gap-0.5 sm:gap-1">
          <h3 className="text-sm leading-tight font-semibold text-balance sm:text-[1.1rem] text-white">
            {certification.title}
          </h3>
          {issuerDate && (
            <p className="flex shrink-0 items-center gap-1.5 font-mono text-[0.65rem] sm:text-xs tracking-[0.08em] text-white/60 uppercase truncate">
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
            {certification.title}
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
          {certification.title}
        </DialogDescription>

        {/* Strict 16:9 Aspect Ratio Image Container */}
        <div className="relative aspect-video w-full shrink-0 sm:flex-1 overflow-hidden rounded-lg bg-neutral-950/20">
          <Image
            src={certification.imageUrl}
            alt={certification.title}
            fill
            priority
            sizes="(min-width: 1024px) 64rem, 100vw"
            className="object-contain rounded-lg"
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

export function CertificationShowcase({
  certifications,
}: {
  certifications: CertificationView[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4 2xl:grid-cols-5">
      {certifications.map((certification) => (
        <CertificationCard
          key={certification.id}
          certification={certification}
        />
      ))}
    </div>
  );
}
