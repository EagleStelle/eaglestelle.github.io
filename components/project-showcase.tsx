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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProjectView = {
  id: number;
  title: string;
  description: string;
  imageUrls: string[];
  techStack: string[];
  projectUrl: string | null;
  sourceUrl: string | null;
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
        <Button asChild variant="glass-accent" size="icon-text">
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
        <Button asChild variant="glass" size="icon-text">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopCardOpen}
          >
            <UiIcon icon={Github01Icon} />
            Source
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
  images: string[];
  activeIndex: number;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <>
      {images.map((src, index) => (
        <Image
          key={`${src}-${index}`}
          src={src}
          alt={index === activeIndex ? title : ""}
          fill
          priority={priority && index === 0}
          sizes={sizes}
          className={cn(
            "object-cover opacity-0 transition-opacity duration-700 ease-out",
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
  const images = project.imageUrls;

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
        className="portfolio-item flex cursor-pointer flex-col gap-3 rounded-xl outline-none"
      >
        <div className="glass-surface relative aspect-video overflow-hidden rounded-xl">
          <ProjectImageStack
            title={project.title}
            images={images}
            activeIndex={cardImageIndex}
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
          />
        </div>

        <h3 className="text-xl leading-tight font-semibold text-balance">
          {project.title}
        </h3>

        {project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <Badge key={tech} variant="glass">
                {tech}
              </Badge>
            ))}
          </div>
        )}

        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {project.description}
        </p>

        <ProjectActions
          projectUrl={project.projectUrl}
          sourceUrl={project.sourceUrl}
        />
      </article>

      <DialogContent className="max-h-[calc(100dvh-var(--spacing)*8)] overflow-hidden p-4 sm:max-w-5xl sm:p-5">
        <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="glass-surface relative aspect-video overflow-hidden rounded-xl">
              <ProjectImageStack
                title={project.title}
                images={images}
                activeIndex={dialogImageIndex}
                sizes="(min-width: 1024px) 54vw, 100vw"
                priority
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((src, index) => (
                  <Button
                    key={`${src}-thumb-${index}`}
                    type="button"
                    variant={index === dialogImageIndex ? "glass-accent" : "glass"}
                    size="icon-only"
                    className="relative size-14 overflow-hidden rounded-lg p-0"
                    onClick={() => setDialogImageIndex(index)}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="calc(var(--spacing) * 14)"
                      className="object-cover"
                    />
                    <span className="sr-only">Image {index + 1}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <DialogHeader className="gap-3">
              <DialogTitle className="text-2xl leading-tight font-semibold text-balance md:text-3xl">
                {project.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {project.title}
              </DialogDescription>
              {project.techStack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <Badge key={tech} variant="glass">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
            </DialogHeader>

            <div className="min-h-0 max-h-96 overflow-y-auto text-base leading-7 whitespace-pre-line text-muted-foreground lg:max-h-[48dvh]">
              {project.description}
            </div>

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
    <div className="grid gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
