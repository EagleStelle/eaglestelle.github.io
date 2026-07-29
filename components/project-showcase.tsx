"use client";

import Image from "next/image";
import { useEffect, useState, type KeyboardEvent, type MouseEvent } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Github01Icon, Globe02Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PeriodLabel } from "@/components/period-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toPeriod } from "@/lib/period";
import type { ProjectImage } from "@/lib/project-data";
import { cn } from "@/lib/utils";

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

const MAX_VISIBLE_TECH = 3;

const tileButtonClass = "size-8";

function stopCardOpen(event: MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation();
}

function TechStackBadges({ techStack }: { techStack: string[] }) {
  if (techStack.length === 0) return null;

  const visible = techStack.slice(0, MAX_VISIBLE_TECH);
  const hidden = techStack.slice(MAX_VISIBLE_TECH);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((tech) => (
        <Badge key={tech}>{tech}</Badge>
      ))}
      {hidden.length > 0 && (
        <Badge variant="secondary" title={hidden.join(", ")}>
          +{hidden.length}
        </Badge>
      )}
    </div>
  );
}

function ProjectTileActions({
  projectUrl,
  sourceUrl,
}: {
  projectUrl: string | null;
  sourceUrl: string | null;
}) {
  if (!projectUrl && !sourceUrl) return null;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {projectUrl && (
        <Button asChild size="icon-only" className={tileButtonClass}>
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopCardOpen}
          >
            <UiIcon icon={Globe02Icon} />
            <span className="sr-only">Live</span>
          </a>
        </Button>
      )}
      {sourceUrl && (
        <Button
          asChild
          variant="secondary"
          size="icon-only"
          className={tileButtonClass}
        >
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopCardOpen}
          >
            <UiIcon icon={Github01Icon} />
            <span className="sr-only">Source code</span>
          </a>
        </Button>
      )}
    </div>
  );
}

function ProjectActions({
  projectUrl,
  sourceUrl,
}: {
  projectUrl: string | null;
  sourceUrl: string | null;
}) {
  if (!projectUrl && !sourceUrl) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {projectUrl && (
        <Button asChild size="icon-text">
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopCardOpen}
          >
            <UiIcon icon={Globe02Icon} />
            Live
          </a>
        </Button>
      )}
      {sourceUrl && (
        <Button asChild variant="secondary" size="icon-text">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopCardOpen}
          >
            <UiIcon icon={Github01Icon} />
            Source code
          </a>
        </Button>
      )}
    </div>
  );
}

function ProjectImageStack({
  title,
  images,
  activeIndex,
  sizes,
  priority = false,
}: {
  title: string;
  images: ProjectImage[];
  activeIndex: number;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <>
      {images.map((image, index) => (
        <Image
          key={`${image.url}-${index}`}
          src={image.url}
          alt={index === activeIndex ? (image.title || title) : ""}
          fill
          priority={priority && index === 0}
          sizes={sizes}
          className={cn(
            "object-cover rounded-lg opacity-0 transition-opacity duration-700 ease-out",
            index === activeIndex && "opacity-100",
          )}
        />
      ))}
    </>
  );
}

function ProjectCard({ project }: { project: ProjectView }) {
  const [open, setOpen] = useState(false);
  const [cardImageIndex, setCardImageIndex] = useState(0);
  const [dialogImageIndex, setDialogImageIndex] = useState(0);
  const images = project.images;
  const activeImage = images[dialogImageIndex];
  const period = toPeriod(project.startDate, project.endDate);

  useEffect(() => {
    if (images.length < 2) return;

    const timer = window.setInterval(() => {
      setCardImageIndex((index) => (index + 1) % images.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [images.length]);

  function openProject() {
    setDialogImageIndex(cardImageIndex);
    setOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openProject();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <article
        role="button"
        tabIndex={0}
        aria-label={`Open ${project.title}`}
        onClick={openProject}
        onKeyDown={handleKeyDown}
        className="glass-orb portfolio-item group relative flex aspect-video cursor-pointer flex-col justify-between overflow-hidden rounded-lg p-3 outline-none focus-visible:outline-2 focus-visible:outline-ring sm:p-4"
      >
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <ProjectImageStack
            title={project.title}
            images={images}
            activeIndex={cardImageIndex}
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
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

        <div className="relative flex items-start justify-between gap-3">
          <TechStackBadges techStack={project.techStack} />
          <ProjectTileActions
            projectUrl={project.projectUrl}
            sourceUrl={project.sourceUrl}
          />
        </div>

        <div className="relative flex flex-col gap-1">
          <h3 className="text-lg leading-tight font-semibold text-balance sm:text-xl text-white">
            {project.title}
          </h3>
          <PeriodLabel period={period} className="text-white/60" />
          <p className="line-clamp-2 text-sm leading-6 text-white/80">
            {project.description}
          </p>
        </div>
      </article>

      <DialogContent className="flex h-[calc(100dvh-var(--spacing)*6)] flex-col overflow-hidden p-4 sm:max-w-5xl sm:p-5">
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-5 overflow-hidden lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:grid-rows-1">
          <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
            <div className="glass-orb relative aspect-video w-full shrink-0 overflow-hidden rounded-lg">
              <ProjectImageStack
                title={project.title}
                images={images}
                activeIndex={dialogImageIndex}
                sizes="(min-width: 1024px) 54vw, 100vw"
                priority
              />
            </div>

            {images.length > 1 && (
              <ScrollArea orientation="horizontal" className="shrink-0">
                <div className="flex gap-2 pb-2">
                  {images.map((image, index) => (
                    <Button
                      key={`${image.url}-thumb-${index}`}
                      type="button"
                      variant={
                        index === dialogImageIndex ? "default" : "secondary"
                      }
                      size="icon-only"
                      className="relative aspect-square size-14 shrink-0 overflow-hidden rounded-lg p-0"
                      onClick={() => setDialogImageIndex(index)}
                    >
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        sizes="calc(var(--spacing) * 14)"
                        className="object-cover"
                      />
                      <span className="sr-only">
                        {image.title || `Image ${index + 1}`}
                      </span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {activeImage && (activeImage.title || activeImage.description) && (
              <div className="flex min-h-0 flex-col gap-1 lg:flex-1">
                {activeImage.title && (
                  <h3 className="shrink-0 font-heading text-base leading-snug font-medium text-balance">
                    {activeImage.title}
                  </h3>
                )}
                {activeImage.description && (
                  <ScrollArea className="max-h-40 min-h-0 lg:max-h-none lg:flex-1">
                    <p className="pr-3 text-sm leading-6 whitespace-pre-line text-muted-foreground">
                      {activeImage.description}
                    </p>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <DialogHeader className="shrink-0 gap-3">
              <DialogTitle className="text-2xl leading-tight font-semibold text-balance text-foreground md:text-3xl">
                {project.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {project.title}
              </DialogDescription>
              <PeriodLabel period={period} className="text-muted-foreground/75" />
              {project.techStack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <Badge key={tech}>{tech}</Badge>
                  ))}
                </div>
              )}
            </DialogHeader>

            <ScrollArea className="min-h-0 flex-1">
              <p className="pr-3 text-base leading-7 whitespace-pre-line text-foreground/85">
                {project.description}
              </p>
            </ScrollArea>

            <ProjectActions
              projectUrl={project.projectUrl}
              sourceUrl={project.sourceUrl}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectShowcase({ projects }: { projects: ProjectView[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
