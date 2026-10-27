"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  Github01Icon,
  Globe02Icon,
  PauseIcon,
  PlayIcon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PeriodLabel } from "@/components/period-label";
import { useProjectFilter } from "@/components/project-filter";
import { UiIcon } from "@/components/ui-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toPeriod } from "@/lib/period";
import type { ProjectImage } from "@/lib/project-data";
import { techKey } from "@/lib/tech";
import { useInView, usePrefersReducedMotion } from "@/lib/use-media";
import { cn, plural } from "@/lib/utils";

export type ProjectView = {
  id: number;
  title: string;
  description: string;
  images: ProjectImage[];
  techStack: string[];
  projectUrl: string | null;
  sourceUrl: string | null;
  startDate: string | null;
  endDate: string | null;
};

type WideSlot = "plate" | "plate-reverse" | "half" | "third";
type MediumSlot = "plate" | "cell";

type TileSlot = {
  lg: WideSlot;
  md: MediumSlot;
};

const TILE_CHIP_COUNT = 3;
const COLLAPSED_CHIP_COUNT = 6;
const SLIDE_INTERVAL_MS = 4500;
const SWIPE_THRESHOLD_PX = 40;

const TILE_CLASS: Record<WideSlot, string> = {
  plate: "lg:col-span-12 lg:grid lg:grid-cols-subgrid lg:items-center lg:gap-x-6",
  "plate-reverse": "lg:col-span-12 lg:grid lg:grid-cols-subgrid lg:items-center lg:gap-x-6",
  half: "lg:col-span-6",
  third: "lg:col-span-4",
};

const MEDIUM_TILE_CLASS: Record<MediumSlot, string> = {
  plate:
    "md:max-lg:col-span-2 md:max-lg:grid md:max-lg:grid-cols-subgrid md:max-lg:items-center md:max-lg:gap-x-6",
  cell: "",
};

const MEDIUM_FRAME_CLASS: Record<MediumSlot, string> = {
  plate: "md:max-lg:col-start-1 md:max-lg:row-start-1",
  cell: "",
};

const MEDIUM_CAPTION_CLASS: Record<MediumSlot, string> = {
  plate: "md:max-lg:col-start-2 md:max-lg:row-start-1",
  cell: "",
};

const FRAME_CLASS: Record<WideSlot, string> = {
  plate: "lg:col-span-7 lg:col-start-1 lg:row-start-1",
  "plate-reverse": "lg:col-span-7 lg:col-start-6 lg:row-start-1",
  half: "",
  third: "",
};

const CAPTION_CLASS: Record<WideSlot, string> = {
  plate: "lg:col-span-5 lg:col-start-8 lg:row-start-1",
  "plate-reverse": "lg:col-span-5 lg:col-start-1 lg:row-start-1",
  half: "",
  third: "",
};

const WIDE_IMAGE_WIDTH: Record<WideSlot, string> = {
  plate: "52vw",
  "plate-reverse": "52vw",
  half: "40vw",
  third: "26vw",
};

function projectLayout(count: number): TileSlot[] {
  if (count === 1) return [{ lg: "plate", md: "plate" }];
  if (count === 2) {
    return [
      { lg: "half", md: "cell" },
      { lg: "half", md: "cell" },
    ];
  }

  const slots: TileSlot[] = [{ lg: "plate", md: "plate" }];
  const rest = count - 1;
  const wideRemainder = rest % 3;

  for (let index = 0; index < rest; index += 1) {
    const remaining = rest - index;
    let lg: WideSlot = "third";

    if (wideRemainder === 1 && remaining === 1) {
      lg = "plate-reverse";
    } else if (wideRemainder === 2 && remaining <= 2) {
      lg = "half";
    }

    slots.push({ lg, md: rest % 2 === 1 && remaining === 1 ? "plate" : "cell" });
  }

  return slots;
}

function techTags(projects: ProjectView[]) {
  const tags = new Map<string, { key: string; label: string; count: number }>();

  for (const project of projects) {
    for (const tech of new Set(project.techStack.map(techKey))) {
      const label = project.techStack.find((item) => techKey(item) === tech) ?? tech;
      const tag = tags.get(tech);
      if (tag) {
        tag.count += 1;
      } else {
        tags.set(tech, { key: tech, label, count: 1 });
      }
    }
  }

  return [...tags.values()].sort(
    (left, right) => right.count - left.count || left.label.localeCompare(right.label),
  );
}

function useCollapsedList<T>(items: T[], limit: number) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = items.length > limit + 1;

  return {
    collapsible,
    expanded,
    shown: collapsible && !expanded ? items.slice(0, limit) : items,
    toggle: () => setExpanded((value) => !value),
  };
}

function stopTileOpen(event: React.MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation();
}

const chipClass =
  "chip transition-colors duration-150 outline-offset-2 focus-visible:outline-2";

const techMoreClass =
  "relative z-10 inline-flex h-5 shrink-0 cursor-pointer items-center rounded-4xl border border-dashed border-input px-2 text-xs font-medium whitespace-nowrap text-muted-foreground outline-offset-2 transition-colors duration-150 before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] hover:border-primary hover:text-primary focus-visible:outline-2";

function MoreToggle({
  expanded,
  hiddenCount,
  controls,
  onToggle,
  className,
}: {
  expanded: boolean;
  hiddenCount: number;
  controls: string;
  onToggle: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      className={className}
    >
      {expanded ? "Show fewer" : `+${hiddenCount} more`}
    </button>
  );
}

function FilterChip({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        chipClass,
        pressed
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-card text-foreground hover:border-primary hover:text-primary",
      )}
    >
      {label}
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          pressed ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function TechChips({
  techStack,
  limit,
  className,
}: {
  techStack: string[];
  limit: number;
  className?: string;
}) {
  const listId = useId();
  const { collapsible, expanded, shown, toggle } = useCollapsedList(techStack, limit);

  if (techStack.length === 0) return null;

  return (
    <ul
      id={listId}
      aria-label="Technologies"
      className={cn("flex min-w-0 flex-wrap items-center gap-1.5", className)}
    >
      {shown.map((tech) => (
        <li key={tech} className="flex">
          <Badge>{tech}</Badge>
        </li>
      ))}
      {collapsible && (
        <li className="flex">
          <MoreToggle
            expanded={expanded}
            hiddenCount={techStack.length - shown.length}
            controls={listId}
            onToggle={toggle}
            className={techMoreClass}
          />
        </li>
      )}
    </ul>
  );
}

function sourceIcon(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "") === "github.com"
      ? Github01Icon
      : SourceCodeIcon;
  } catch {
    return SourceCodeIcon;
  }
}

function TileLinks({
  projectUrl,
  sourceUrl,
}: {
  projectUrl: string | null;
  sourceUrl: string | null;
}) {
  if (!projectUrl && !sourceUrl) return null;

  return (
    <div className="relative z-10 -mr-1.5 ml-auto flex shrink-0 items-center">
      {projectUrl && (
        <Button
          asChild
          variant="ghost"
          size="icon-only"
          className="size-8 text-primary hover:text-primary"
        >
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopTileOpen}
            aria-label="Live site (opens in a new tab)"
            title="Live site"
          >
            <UiIcon icon={Globe02Icon} />
          </a>
        </Button>
      )}
      {sourceUrl && (
        <Button asChild variant="ghost" size="icon-only" className="size-8">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopTileOpen}
            aria-label="Source code (opens in a new tab)"
            title="Source code"
          >
            <UiIcon icon={sourceIcon(sourceUrl)} />
          </a>
        </Button>
      )}
    </div>
  );
}

function ProjectLinks({
  projectUrl,
  sourceUrl,
  className,
}: {
  projectUrl: string | null;
  sourceUrl: string | null;
  className?: string;
}) {
  if (!projectUrl && !sourceUrl) return null;

  return (
    <div className={cn("-ml-3.5 flex shrink-0 flex-wrap items-center gap-2", className)}>
      {projectUrl && (
        <Button
          asChild
          variant="ghost"
          size="icon-text"
          className="text-primary hover:text-primary"
        >
          <a href={projectUrl} target="_blank" rel="noopener noreferrer">
            <UiIcon icon={Globe02Icon} />
            Live site
            <UiIcon icon={ArrowUpRight01Icon} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      )}
      {sourceUrl && (
        <Button asChild variant="ghost" size="icon-text">
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            <UiIcon icon={sourceIcon(sourceUrl)} />
            Source code
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      )}
    </div>
  );
}

function ImageStepButton({
  direction,
  onStep,
  className,
}: {
  direction: 1 | -1;
  onStep: (direction: 1 | -1) => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-only"
      className={className}
      onClick={() => onStep(direction)}
      aria-label={direction === -1 ? "Previous image" : "Next image"}
    >
      <UiIcon icon={direction === -1 ? ArrowLeft01Icon : ArrowRight01Icon} />
    </Button>
  );
}

function ProjectLightbox({
  open,
  onOpenChange,
  image,
  fallbackTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: ProjectImage | undefined;
  fallbackTitle: string;
}) {
  if (!image) return null;

  const label = image.title || fallbackTitle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-var(--spacing)*4)] max-w-none bg-transparent p-2 ring-0 sm:max-w-[min(96vw,90rem)]"
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">Expanded view of {label}</DialogDescription>
        <div className="relative h-[calc(100dvh-var(--spacing)*16)] w-full">
          <Image src={image.url} alt={label} fill sizes="96vw" className="object-contain" />
        </div>
        <DialogClose asChild>
          <Button
            variant="secondary"
            size="icon-only"
            className="absolute top-3 right-3 shadow-md"
            aria-label="Close expanded image"
          >
            <UiIcon icon={Cancel01Icon} />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDialog({
  project,
  open,
  onOpenChange,
  imageIndex,
  onImageIndexChange,
}: {
  project: ProjectView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageIndex: number;
  onImageIndexChange: (index: number) => void;
}) {
  const [lightbox, setLightbox] = useState({ index: 0, open: false });
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipeStart = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const swiped = useRef(false);
  const images = project.images;
  const activeImage = images[imageIndex] ?? images[0];
  const period = toPeriod(project.startDate, project.endDate);

  useEffect(() => {
    if (!open || images.length < 2) return;

    thumbnailRefs.current[imageIndex]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [imageIndex, open, images.length]);

  const step = (direction: 1 | -1) =>
    onImageIndexChange((imageIndex + direction + images.length) % images.length);

  const openLightbox = (index: number) => setLightbox({ index, open: true });

  function startSwipe(event: React.PointerEvent<HTMLDivElement>) {
    swiped.current = false;
    swipeStart.current =
      event.pointerType === "mouse"
        ? null
        : { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  }

  function endSwipe(event: React.PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.pointerId !== event.pointerId || images.length < 2) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) return;

    swiped.current = true;
    step(deltaX < 0 ? 1 : -1);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="native-scrollbar flex max-h-[calc(100dvh-var(--spacing)*6)] flex-col overflow-y-auto p-4 sm:max-w-6xl sm:p-6 lg:max-h-[calc(100dvh-var(--spacing)*8)] lg:max-w-[min(calc(100%-var(--spacing)*8),80rem)] lg:overflow-hidden lg:p-8"
        >
          <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <DialogHeader className="gap-3 lg:col-start-2 lg:row-start-1">
              <div className="flex items-start gap-3">
                <DialogTitle className="type-wide min-w-0 flex-1 text-feature leading-(--text-feature--line-height) font-bold text-balance text-foreground uppercase">
                  {project.title}
                </DialogTitle>
                <div className="flex h-lh shrink-0 items-center text-feature leading-(--text-feature--line-height)">
                  <DialogClose asChild>
                    <Button variant="ghost" size="icon-sm" className="-mr-1.5">
                      <UiIcon icon={Cancel01Icon} />
                      <span className="sr-only">Close</span>
                    </Button>
                  </DialogClose>
                </div>
              </div>
              <PeriodLabel period={period} />
              <DialogDescription className="sr-only">
                Details, images and links for {project.title}
              </DialogDescription>
              <TechChips techStack={project.techStack} limit={COLLAPSED_CHIP_COUNT} />
            </DialogHeader>

            <div className="native-scrollbar min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-4">
              <figure className="flex flex-col gap-3 lg:hidden">
                <div
                  onPointerDown={startSwipe}
                  onPointerUp={endSwipe}
                  onPointerCancel={() => {
                    swipeStart.current = null;
                  }}
                  className="relative aspect-video w-full shrink-0 touch-pan-y overflow-hidden rounded-md border bg-tint"
                >
                  {activeImage && (
                    <button
                      type="button"
                      onClick={() => {
                        if (swiped.current) {
                          swiped.current = false;
                          return;
                        }
                        openLightbox(imageIndex);
                      }}
                      className="relative size-full cursor-zoom-in outline-offset-[-3px] focus-visible:outline-2"
                    >
                      <Image
                        key={activeImage.url}
                        src={activeImage.url}
                        alt={activeImage.title || project.title}
                        fill
                        sizes="92vw"
                        className="object-contain"
                      />
                      <span className="sr-only">Expand image</span>
                    </button>
                  )}

                  {images.length > 1 && (
                    <>
                      <ImageStepButton
                        direction={-1}
                        onStep={step}
                        className="absolute top-1/2 left-3 z-10 -translate-y-1/2 shadow-md max-sm:hidden"
                      />
                      <ImageStepButton
                        direction={1}
                        onStep={step}
                        className="absolute top-1/2 right-3 z-10 -translate-y-1/2 shadow-md max-sm:hidden"
                      />
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="native-scrollbar -mx-1 min-w-0 shrink-0 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1">
                    <ul className="flex w-max gap-2.5 p-1.5 sm:pb-3" aria-label="Project images">
                      {images.map((image, index) => (
                        <li key={`${image.url}-${index}`}>
                          <button
                            type="button"
                            ref={(element) => {
                              thumbnailRefs.current[index] = element;
                            }}
                            aria-current={index === imageIndex ? "true" : undefined}
                            onClick={() => onImageIndexChange(index)}
                            className={cn(
                              "relative block size-14 overflow-hidden rounded-sm border bg-tint outline-offset-2 transition-opacity duration-150 focus-visible:outline-2",
                              index === imageIndex
                                ? "border-primary ring-2 ring-primary"
                                : "opacity-70 hover:opacity-100",
                            )}
                          >
                            <Image src={image.url} alt="" fill sizes="3.5rem" className="object-cover" />
                            <span className="sr-only">
                              {image.title || `Image ${index + 1} of ${images.length}`}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeImage && (activeImage.title || activeImage.description) && (
                  <figcaption className="flex flex-col gap-1.5">
                    {activeImage.title && (
                      <h3 className="text-base leading-snug font-semibold text-balance">
                        {activeImage.title}
                      </h3>
                    )}
                    {activeImage.description && (
                      <p className="text-sm leading-6 text-pretty whitespace-pre-line text-muted-foreground sm:text-justify sm:hyphens-auto">
                        {activeImage.description}
                      </p>
                    )}
                  </figcaption>
                )}
              </figure>

              <ol aria-label="Project images" className="hidden lg:flex lg:flex-col lg:gap-10">
                {images.map((image, index) => (
                  <li key={`${image.url}-${index}`}>
                    <figure className="flex flex-col gap-4">
                      <button
                        type="button"
                        onClick={() => openLightbox(index)}
                        className="flex w-full cursor-zoom-in justify-center overflow-hidden rounded-md border bg-tint outline-offset-[-3px] transition-colors duration-200 hover:border-primary focus-visible:outline-2"
                      >
                        <Image
                          src={image.url}
                          alt={image.title || `${project.title}, image ${index + 1}`}
                          width={1600}
                          height={1000}
                          sizes="(min-width: 1280px) 52rem, 60vw"
                          className="h-auto max-h-[75dvh] w-auto max-w-full"
                        />
                        <span className="sr-only">Expand image</span>
                      </button>
                      {(image.title || image.description) && (
                        <figcaption className="flex flex-col gap-1.5">
                          <div className="flex items-baseline gap-3">
                            <span aria-hidden="true" className="chart-label text-muted-foreground">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            {image.title && (
                              <h3 className="text-base leading-snug font-semibold text-balance">
                                {image.title}
                              </h3>
                            )}
                          </div>
                          {image.description && (
                            <p className="text-justify text-sm leading-6 whitespace-pre-line text-muted-foreground hyphens-auto">
                              {image.description}
                            </p>
                          )}
                        </figcaption>
                      )}
                    </figure>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex min-w-0 flex-col gap-5 border-t pt-6 lg:col-start-2 lg:row-start-2 lg:min-h-0">
              <div className="native-scrollbar min-h-0 lg:overflow-y-auto lg:overscroll-contain">
                <p className="pr-3 text-sm leading-6 text-pretty whitespace-pre-line text-foreground/90 sm:text-justify sm:text-base sm:leading-7 sm:hyphens-auto">
                  {project.description}
                </p>
              </div>

              <ProjectLinks projectUrl={project.projectUrl} sourceUrl={project.sourceUrl} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ProjectLightbox
        open={lightbox.open}
        onOpenChange={(lightboxOpen) =>
          setLightbox((current) => ({ ...current, open: lightboxOpen }))
        }
        image={images[lightbox.index]}
        fallbackTitle={project.title}
      />
    </>
  );
}

function ProjectTile({ project, slot }: { project: ProjectView; slot: TileSlot }) {
  const tileRef = useRef<HTMLLIElement>(null);
  const [open, setOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [dialogImageIndex, setDialogImageIndex] = useState(0);
  const [hasCycled, setHasCycled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  const inView = useInView(tileRef);
  const reducedMotion = usePrefersReducedMotion();
  const images = project.images;
  const image = images[imageIndex] ?? images[0];
  const period = toPeriod(project.startDate, project.endDate);
  const previewDescription = project.description.trim().split(/\r?\n/)[0];
  const widePlate = slot.lg === "plate" || slot.lg === "plate-reverse";
  const mediumPlate = slot.md === "plate";
  const hasFooter =
    project.techStack.length > 0 || Boolean(project.projectUrl || project.sourceUrl);
  const slideshow = images.length > 1 && !reducedMotion;
  const playing = slideshow && inView && !open && !hovered && !focused && !paused;

  useEffect(() => {
    if (!playing) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setHasCycled(true);
      setImageIndex((index) => (index + 1) % images.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [playing, images.length]);

  function openProject() {
    setDialogImageIndex(imageIndex);
    setOpen(true);
  }

  return (
    <li
      ref={tileRef}
      style={{ viewTransitionName: `project-${project.id}` }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) => setFocused(!event.target.hasAttribute("data-slideshow-toggle"))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
      className={cn(
        "group/tile relative flex flex-col gap-4 rounded-sm outline-offset-8 has-[[data-tile-open]:focus-visible]:outline-2 has-[[data-tile-open]:focus-visible]:outline-ring",
        MEDIUM_TILE_CLASS[slot.md],
        TILE_CLASS[slot.lg],
      )}
    >
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-sm border bg-tint transition-colors duration-200 group-hover/tile:border-primary",
          MEDIUM_FRAME_CLASS[slot.md],
          FRAME_CLASS[slot.lg],
        )}
      >
        {image && (
          <Image
            key={image.url}
            src={image.url}
            alt=""
            fill
            sizes={`(min-width: 1024px) ${WIDE_IMAGE_WIDTH[slot.lg]}, (min-width: 768px) 50vw, 100vw`}
            className={cn(
              "object-cover transition-transform duration-700 ease-out group-hover/tile:scale-[1.02] motion-reduce:transition-none",
              hasCycled && "tile-image-in",
            )}
          />
        )}
        {slideshow ? (
          <button
            type="button"
            data-slideshow-toggle
            onClick={() => setPaused((value) => !value)}
            aria-label={`${paused ? "Play" : "Pause"} ${project.title} slideshow`}
            className="chart-label absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-sm bg-background/90 px-2 py-1 text-foreground outline-offset-2 transition-colors duration-150 before:absolute before:-inset-2 before:content-[''] hover:text-primary pointer-coarse:before:-inset-2.5 focus-visible:outline-2"
          >
            <UiIcon icon={paused ? PlayIcon : PauseIcon} className="size-3" />
            <span aria-hidden="true">
              {imageIndex + 1}/{images.length}
            </span>
          </button>
        ) : (
          images.length > 1 && (
            <span
              aria-hidden="true"
              className="chart-label absolute bottom-2.5 left-2.5 rounded-sm bg-background/90 px-2 py-1 text-foreground"
            >
              {imageIndex + 1}/{images.length}
            </span>
          )
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          MEDIUM_CAPTION_CLASS[slot.md],
          CAPTION_CLASS[slot.lg],
        )}
      >
        <div className={cn("flex flex-col gap-1", widePlate && "lg:gap-2")}>
          <h3
            className={cn(
              "text-lg leading-snug font-semibold text-balance",
              mediumPlate && "md:max-lg:text-xl",
              widePlate &&
                "lg:type-wide lg:text-feature lg:leading-(--text-feature--line-height) lg:font-bold lg:uppercase",
            )}
          >
            <button
              type="button"
              data-tile-open
              onClick={openProject}
              className="text-left outline-none group-hover/tile:text-primary after:absolute after:inset-0 after:z-1 after:content-['']"
            >
              {project.title}
            </button>
          </h3>
          <PeriodLabel period={period} />
        </div>

        {previewDescription && (
          <p
            className={cn(
              "mt-2 max-w-[60ch] text-sm leading-6 text-pretty text-muted-foreground line-clamp-2",
              mediumPlate && "md:max-lg:line-clamp-3",
              widePlate && "lg:mt-4 lg:line-clamp-4 lg:text-base lg:leading-7",
            )}
          >
            {previewDescription}
          </p>
        )}

        {hasFooter &&
          (widePlate ? (
            <div className="mt-auto flex flex-col items-start gap-3 pt-4 lg:pt-6">
              <TechChips techStack={project.techStack} limit={COLLAPSED_CHIP_COUNT} />
              <ProjectLinks
                projectUrl={project.projectUrl}
                sourceUrl={project.sourceUrl}
                className="relative z-10"
              />
            </div>
          ) : (
            <div className="mt-auto flex items-center gap-3 pt-3">
              <TechChips
                techStack={project.techStack}
                limit={TILE_CHIP_COUNT}
                className="flex-1"
              />
              <TileLinks projectUrl={project.projectUrl} sourceUrl={project.sourceUrl} />
            </div>
          ))}
      </div>

      <ProjectDialog
        project={project}
        open={open}
        onOpenChange={setOpen}
        imageIndex={dialogImageIndex}
        onImageIndexChange={setDialogImageIndex}
      />
    </li>
  );
}

export function ProjectShowcase({ projects }: { projects: ProjectView[] }) {
  const { techs, toggleTech, clearTechs } = useProjectFilter();
  const tags = useMemo(() => techTags(projects), [projects]);
  const {
    collapsible,
    expanded,
    shown: leadingTags,
    toggle,
  } = useCollapsedList(tags, COLLAPSED_CHIP_COUNT);
  const visible =
    techs.length > 0
      ? projects.filter((project) =>
          project.techStack.some((item) => techs.includes(techKey(item))),
        )
      : projects;
  const slots = projectLayout(visible.length);
  const activeTags = tags.filter((tag) => techs.includes(tag.key));
  const shownTags = [
    ...leadingTags,
    ...activeTags.filter((tag) => !leadingTags.includes(tag)),
  ];
  const activeLabels = new Intl.ListFormat("en", { type: "disjunction" }).format(
    activeTags.map((tag) => tag.label),
  );

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {tags.length > 1 && (
        <div
          id="project-filters"
          role="group"
          aria-label="Filter projects by technology"
          className="flex flex-wrap gap-1.5"
        >
          <FilterChip
            label="All"
            count={projects.length}
            pressed={techs.length === 0}
            onClick={clearTechs}
          />
          {shownTags.map((tag) => (
            <FilterChip
              key={tag.key}
              label={tag.label}
              count={tag.count}
              pressed={techs.includes(tag.key)}
              onClick={() => toggleTech(tag.key)}
            />
          ))}
          {collapsible && (
            <MoreToggle
              expanded={expanded}
              hiddenCount={tags.length - shownTags.length}
              controls="project-filters"
              onToggle={toggle}
              className={cn(
                chipClass,
                "border-dashed border-input bg-transparent text-muted-foreground hover:border-primary hover:text-primary",
              )}
            />
          )}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {activeTags.length > 0
          ? `Showing ${plural(visible.length, "project")} using ${activeLabels}`
          : ""}
      </p>

      <ul className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-y-10">
        {visible.map((project, index) => (
          <ProjectTile
            key={project.id}
            project={project}
            slot={slots[index] ?? { lg: "third", md: "cell" }}
          />
        ))}
      </ul>
    </div>
  );
}
