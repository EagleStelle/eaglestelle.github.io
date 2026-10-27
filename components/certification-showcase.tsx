"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { Cancel01Icon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { UiIcon } from "@/components/ui-icon";
import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/period";

export type CertificationView = {
  id: number;
  title: string;
  issuer: string;
  imageUrl: string;
  certificationUrl: string | null;
  issuedAt: Date | string | null;
};

function issuerLine(certification: CertificationView) {
  return [certification.issuer, formatDateLabel(certification.issuedAt)]
    .filter(Boolean)
    .join(" · ");
}

function VerifyLink({ href, className }: { href: string; className?: string }) {
  return (
    <Button asChild size="icon-text" className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <UiIcon icon={CheckmarkBadge01Icon} />
        Verify
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </Button>
  );
}

function CertificationCard({
  certification,
}: {
  certification: CertificationView;
}) {
  const [open, setOpen] = useState(false);
  const meta = issuerLine(certification);

  return (
    <li className="group/tile relative flex flex-col overflow-hidden rounded-md border bg-card transition-[border-color] duration-200 hover:border-primary/70 has-[[data-tile-open]:focus-visible]:outline-2 has-[[data-tile-open]:focus-visible]:outline-offset-2 has-[[data-tile-open]:focus-visible]:outline-ring">
      <div className="relative aspect-7/5 overflow-hidden border-b bg-tint">
        <Image
          src={certification.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1280px) 22rem, 45vw"
          className="object-cover transition-transform duration-500 ease-out group-hover/tile:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-balance sm:text-base">
          <button
            type="button"
            data-tile-open
            onClick={() => setOpen(true)}
            className="text-left outline-none group-hover/tile:text-primary after:absolute after:inset-0 after:content-['']"
          >
            {certification.title}
          </button>
        </h3>
        {meta && <p className="chart-label text-muted-foreground">{meta}</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-var(--spacing)*4)] overflow-y-auto sm:max-w-[calc(100%-var(--spacing)*8)] sm:p-6 lg:w-max lg:max-w-[calc(100%-var(--spacing)*12)] lg:grid-cols-[auto_18rem] lg:grid-rows-[auto_1fr] lg:gap-x-6 lg:overflow-hidden"
        >
          <div className="flex items-start gap-3 lg:col-start-2 lg:row-start-1">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <DialogTitle className="type-wide text-feature font-bold text-balance wrap-break-word uppercase lg:hyphens-auto">
                {certification.title}
              </DialogTitle>
              <DialogDescription className="chart-label text-muted-foreground">
                {meta || "Certificate"}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="-mt-1 -mr-1.5 pointer-coarse:-mt-2.5 pointer-coarse:-mr-2.5"
              >
                <UiIcon icon={Cancel01Icon} />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>

          <div className="-mx-4 border-y bg-tint sm:-mx-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:overflow-hidden lg:rounded-md lg:border">
            <Image
              src={certification.imageUrl}
              alt={certification.title}
              width={1600}
              height={1131}
              sizes="(min-width: 1024px) 70vw, 100vw"
              className="block h-auto w-full object-contain lg:h-[calc(100dvh-var(--spacing)*24-2px)] lg:w-auto lg:max-w-[calc(100vw-var(--spacing)*30-18rem-2px)]"
            />
          </div>

          {certification.certificationUrl && (
            <VerifyLink
              href={certification.certificationUrl}
              className="w-full lg:col-start-2 lg:row-start-2 lg:self-end"
            />
          )}
        </DialogContent>
      </Dialog>
    </li>
  );
}

export function CertificationShowcase({
  certifications,
}: {
  certifications: CertificationView[];
}) {
  const minWidth =
    certifications.length <= 2 ? "22rem" : certifications.length <= 4 ? "17rem" : "14.5rem";

  return (
    <ul
      className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(min(100%,var(--tile-min)),1fr))] sm:gap-4 lg:gap-5"
      style={{ "--tile-min": minWidth } as CSSProperties}
    >
      {certifications.map((certification) => (
        <CertificationCard key={certification.id} certification={certification} />
      ))}
    </ul>
  );
}
