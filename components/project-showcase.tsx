"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

const MAX_TILE_TECH = 3;
const CHIP_GAP_PX = 6;
const COLLAPSED_FILTER_COUNT = 6;
const SLIDE_INTERVAL_MS = 4500;

const TILE_CLASS: Record<WideSlot, string> = {
  plate: "lg:col-span-12 lg:grid lg:grid-cols-subgrid lg:items-center lg:gap-x-6",
  "plate-reverse": "lg:col-span-12 lg:grid lg:grid-cols-subgrid lg:items-center lg:gap-x-6",
  half: "lg:col-span-6 lg:flex",
  third: "lg:col-span-4 lg:flex",
};

const MEDIUM_TILE_CLASS: Record<MediumSlot, string> = {
  plate: "md:col-span-2 md:grid md:grid-cols-subgrid md:items-center md:gap-x-6",
  cell: "",
};

const MEDIUM_FRAME_CLASS: Record<MediumSlot, string> = {
  plate: "md:col-start-1 md:row-start-1",
  cell: "",
};

const MEDIUM_CAPTION_CLASS: Record<MediumSlot, string> = {
  plate: "md:col-start-2 md:row-start-1",
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

const IMAGE_SIZES: Record<WideSlot, string> = {
  plate: "(min-width: 1024px) 52vw, 100vw",
  "plate-reverse": "(min-width: 1024px) 52vw, 100vw",
  half: "(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw",
  third: "(min-width: 1024px) 26vw, (min-width: 768px) 50vw, 100vw",
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

function stopTileOpen(event: React.MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation();
}

const chipClass =
  "chip transition-colors duration-150 outline-offset-2 focus-visible:outline-2";

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

function MoreChip({ hidden }: { hidden: string[] }) {
  return (
    <Badge variant="secondary" title={hidden.join(", ")}>
      <span aria-hidden="true">+{hidden.length}</span>
      <span className="sr-only">
        and {plural(hidden.length, "more technology", "more technologies")}:{" "}
        {hidden.join(", ")}
      </span>
    </Badge>
  );
}

function TechChips({ techStack }: { techStack: string[] }) {
  if (techStack.length === 0) return null;

  return (
    <ul aria-label="Technologies" className="flex min-w-0 flex-wrap items-center gap-1.5">
      {techStack.map((tech) => (
        <li key={tech} className="flex">
          <Badge>{tech}</Badge>
        </li>
      ))}
    </ul>
  );
}

function FittedTechChips({ techStack, limit }: { techStack: string[]; limit: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const candidates = techStack.slice(0, limit);
  const [fit, setFit] = useState(candidates.length);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    const compute = () => {
      const items = Array.from(measure.children) as HTMLElement[];
      const moreWidth = items[items.length - 1]?.offsetWidth ?? 0;
      const available = row.clientWidth;
      let used = 0;
      let count = 0;

      for (let index = 0; index < candidates.length; index += 1) {
        const width = (items[index]?.offsetWidth ?? 0) + (index > 0 ? CHIP_GAP_PX : 0);
        const remaining = techStack.length - (index + 1);
        const reserve = remaining > 0 ? CHIP_GAP_PX + moreWidth : 0;
        if (used + width + reserve > available) break;
        used += width;
        count = index + 1;
      }

      setFit(count);
    };

    compute();
    document.fonts?.ready.then(compute);
    const observer = new ResizeObserver(compute);
    observer.observe(row);
    return () => observer.disconnect();
  }, [techStack, candidates.length]);

  if (techStack.length === 0) return <span className="flex-1" />;

  const shown = techStack.slice(0, fit);
  const hidden = techStack.slice(fit);

  return (
    <div ref={rowRef} className="relative h-5 min-w-0 flex-1 overflow-hidden">
      <ul aria-label="Technologies" className="flex h-5 items-center gap-1.5">
        {shown.map((tech) => (
          <li key={tech} className="flex shrink-0">
            <Badge>{tech}</Badge>
          </li>
        ))}
        {hidden.length > 0 && (
          <li className="flex shrink-0">
            <MoreChip hidden={hidden} />
          </li>
        )}
      </ul>
      <ul
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 flex w-max gap-1.5"
      >
        {candidates.map((tech) => (
          <li key={tech} className="flex shrink-0">
            <Badge>{tech}</Badge>
          </li>
        ))}
        <li className="flex shrink-0">
          <Badge variant="secondary">+{techStack.length}</Badge>
        </li>
      </ul>
    </div>
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
    <div className="relative z-10 -mr-1.5 flex shrink-0 items-center">
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

function DialogLinks({
  projectUrl,
  sourceUrl,
}: {
  projectUrl: string | null;
  sourceUrl: string | null;
}) {
  if (!projectUrl && !sourceUrl) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="native-scrollbar flex max-h-[calc(100dvh-var(--spacing)*6)] flex-col overflow-y-auto p-4 sm:max-w-6xl sm:p-6 lg:h-[calc(100dvh-var(--spacing)*8)] lg:overflow-hidden">
          <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md border bg-tint">
                {activeImage && (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="relative size-full cursor-zoom-in outline-offset-[-3px] focus-visible:outline-2"
                  >
                    <Image
                      key={activeImage.url}
                      src={activeImage.url}
                      alt={activeImage.title || project.title}
                      fill
                      priority
                      sizes="(min-width: 1024px) 40rem, 92vw"
                      className="object-contain"
                    />
                    <span className="sr-only">Expand image</span>
                  </button>
                )}

                {images.length > 1 && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-only"
                      className="absolute top-1/2 left-3 z-10 -translate-y-1/2 shadow-md"
                      onClick={() => step(-1)}
                      aria-label="Previous image"
                    >
                      <UiIcon icon={ArrowLeft01Icon} />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-only"
                      className="absolute top-1/2 right-3 z-10 -translate-y-1/2 shadow-md"
                      onClick={() => step(1)}
                      aria-label="Next image"
                    >
                      <UiIcon icon={ArrowRight01Icon} />
                    </Button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="native-scrollbar -mx-1 min-w-0 shrink-0 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1">
                  <ul className="flex w-max gap-2.5 p-1.5 pb-3" aria-label="Project images">
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
                <div className="flex min-h-0 flex-col gap-1.5 lg:flex-1">
                  {activeImage.title && (
                    <h3 className="shrink-0 text-base leading-snug font-semibold text-balance">
                      {activeImage.title}
                    </h3>
                  )}
                  {activeImage.description && (
                    <div className="native-scrollbar min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                      <p className="max-w-[68ch] pr-3 text-sm leading-6 text-pretty whitespace-pre-line text-muted-foreground sm:text-justify sm:hyphens-auto">
                        {activeImage.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-col gap-5">
              <DialogHeader className="shrink-0 gap-3 pr-8">
                <DialogTitle className="type-wide text-feature font-bold text-balance text-foreground uppercase">
                  {project.title}
                </DialogTitle>
                <PeriodLabel period={period} />
                <DialogDescription className="sr-only">
                  Details, images and links for {project.title}
                </DialogDescription>
                <TechChips techStack={project.techStack} />
              </DialogHeader>

              <div className="native-scrollbar min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                <p className="max-w-[68ch] pr-3 text-sm leading-6 text-pretty whitespace-pre-line text-foreground/90 sm:text-justify sm:text-base sm:leading-7 sm:hyphens-auto">
                  {project.description}
                </p>
              </div>

              <DialogLinks projectUrl={project.projectUrl} sourceUrl={project.sourceUrl} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ProjectLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        image={activeImage}
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
        "group/tile relative flex flex-col gap-3 rounded-sm outline-offset-8 has-[[data-tile-open]:focus-visible]:outline-2 has-[[data-tile-open]:focus-visible]:outline-ring",
        MEDIUM_TILE_CLASS[slot.md],
        TILE_CLASS[slot.lg],
      )}
    >
      <div
        className={cn(
          "order-2 flex min-w-0 flex-1 flex-col gap-2",
          MEDIUM_CAPTION_CLASS[slot.md],
          CAPTION_CLASS[slot.lg],
        )}
      >
        <h3
          className={cn(
            "text-lg leading-snug font-semibold text-balance",
            mediumPlate && "md:text-xl",
            widePlate
              ? "lg:type-wide lg:text-feature lg:leading-(--text-feature--line-height) lg:font-bold lg:uppercase"
              : "lg:text-lg",
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
        {previewDescription && (
          <p
            className={cn(
              "max-w-[60ch] text-sm leading-6 text-pretty text-muted-foreground line-clamp-2",
              mediumPlate && "md:line-clamp-3",
              widePlate ? "lg:line-clamp-4 lg:text-base lg:leading-7" : "lg:line-clamp-2",
            )}
          >
            {previewDescription}
          </p>
        )}
      </div>

      <div
        className={cn(
          "order-1 flex flex-col overflow-hidden rounded-sm border bg-card transition-colors duration-200 group-hover/tile:border-primary",
          MEDIUM_FRAME_CLASS[slot.md],
          FRAME_CLASS[slot.lg],
        )}
      >
        <div className="relative aspect-video overflow-hidden bg-tint">
          {image && (
            <Image
              key={image.url}
              src={image.url}
              alt=""
              fill
              sizes={IMAGE_SIZES[slot.lg]}
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

        {(project.techStack.length > 0 || project.projectUrl || project.sourceUrl) && (
          <div className="flex min-h-11 items-center gap-3 border-t px-3 py-1.5 pointer-coarse:py-0">
            <FittedTechChips techStack={project.techStack} limit={MAX_TILE_TECH} />
            <TileLinks projectUrl={project.projectUrl} sourceUrl={project.sourceUrl} />
          </div>
        )}
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
  const [expanded, setExpanded] = useState(false);
  const tags = useMemo(() => techTags(projects), [projects]);
  const visible =
    techs.length > 0
      ? projects.filter((project) =>
          project.techStack.some((item) => techs.includes(techKey(item))),
        )
      : projects;
  const slots = projectLayout(visible.length);
  const activeTags = tags.filter((tag) => techs.includes(tag.key));
  const collapsible = tags.length > COLLAPSED_FILTER_COUNT + 1;
  const leadingTags = collapsible && !expanded ? tags.slice(0, COLLAPSED_FILTER_COUNT) : tags;
  const shownTags = [
    ...leadingTags,
    ...activeTags.filter((tag) => !leadingTags.includes(tag)),
  ];
  const hiddenCount = tags.length - shownTags.length;
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
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls="project-filters"
              onClick={() => setExpanded((value) => !value)}
              className={cn(
                chipClass,
                "border-dashed border-input bg-transparent text-muted-foreground hover:border-primary hover:text-primary",
              )}
            >
              {expanded ? "Show fewer" : `+${hiddenCount} more`}
            </button>
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
