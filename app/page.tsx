import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  File01Icon,
  Github01Icon,
  Globe02Icon,
  Linkedin01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { normalizeThemeColor } from "@/lib/appearance";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const frameInset = "px-6 py-4 sm:px-8 lg:px-12 xl:px-16";
const sectionInset = "px-6 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-10";

function PageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("w-full", frameInset, className)}>{children}</div>;
}

function PageSection({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn("flex w-full flex-col gap-6", sectionInset, className)}
      {...props}
    />
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-3xl leading-tight font-semibold text-balance md:text-4xl">
      {children}
    </h2>
  );
}

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

function GlassImage({
  src,
  alt,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn("glass-surface relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}

function groupByCategory<T extends { category: string | null }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.category ?? "Other";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()];
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
          <a href={projectUrl} target="_blank" rel="noopener noreferrer">
            <UiIcon icon={ArrowUpRight01Icon} />
            Live
          </a>
        </Button>
      )}
      {sourceUrl && (
        <Button asChild variant="glass" size="icon-text">
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            <UiIcon icon={ArrowUpRight01Icon} />
            Source
          </a>
        </Button>
      )}
    </div>
  );
}

export default async function Home() {
  const [profile, skills, projects, certifications] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.project.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
    prisma.certification.findMany({
      orderBy: [{ order: "asc" }, { issuedAt: "desc" }],
    }),
  ]);

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">
          No profile yet. Go to{" "}
          <Link href="/admin" className="underline underline-offset-4">
            /admin
          </Link>{" "}
          to set one up.
        </p>
      </div>
    );
  }

  const socials = [
    profile.githubUrl && {
      href: profile.githubUrl,
      icon: Github01Icon,
      name: "GitHub",
    },
    profile.linkedinUrl && {
      href: profile.linkedinUrl,
      icon: Linkedin01Icon,
      name: "LinkedIn",
    },
    profile.websiteUrl && {
      href: profile.websiteUrl,
      icon: Globe02Icon,
      name: "Website",
    },
  ].filter(
    (link): link is { href: string; icon: IconSvgElement; name: string } =>
      Boolean(link),
  );

  const sections = [
    projects.length > 0 && { href: "#work", name: "Work" },
    skills.length > 0 && { href: "#skills", name: "Skills" },
    certifications.length > 0 && { href: "#credentials", name: "Credentials" },
  ].filter((link): link is { href: string; name: string } => Boolean(link));

  const featuredProject = projects[0];
  const secondaryProjects = projects.slice(1);
  const heroImage =
    profile.avatarUrl ??
    featuredProject?.imageUrl ??
    certifications[0]?.imageUrl;
  const themeColor = normalizeThemeColor(profile.themeColor);

  return (
    <div
      data-theme-color={themeColor}
      className="glass-page min-h-dvh bg-background text-foreground"
    >
      <header className="glass-nav sticky top-0 z-40 border-b border-border/60">
        <PageFrame className="flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="min-w-0 truncate text-sm font-semibold">
            {profile.name}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {sections.map((section) => (
              <Button key={section.href} asChild variant="ghost" size="text-only">
                <a href={section.href}>{section.name}</a>
              </Button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <Button
              asChild
              variant="glass-accent"
              size="icon-text"
              className="hidden sm:inline-flex"
            >
              <a href={`mailto:${profile.email}`}>
                <UiIcon icon={Mail01Icon} />
                Contact
              </a>
            </Button>
            <MobileNav name={profile.name} sections={sections} />
          </div>
        </PageFrame>
      </header>

      <main className="relative z-10 grid w-full max-w-full overflow-x-hidden">
        <PageSection>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex min-w-0 w-full flex-col items-stretch gap-4">
              <div className="flex w-full items-center gap-5">
                {heroImage && (
                  <div className="glass-portrait relative size-32 shrink-0 overflow-hidden rounded-full sm:size-40 lg:size-48">
                    <Image
                      src={heroImage}
                      alt={profile.name}
                      fill
                      priority
                      sizes="12rem"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  <h1 className="max-w-5xl text-3xl leading-none font-semibold text-balance sm:text-4xl lg:text-5xl">
                    {profile.name}
                  </h1>
                  <p className="max-w-3xl text-xl leading-tight font-medium text-primary md:text-2xl">
                    {profile.headline}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="glass-accent" size="icon-text">
                      <a href={`mailto:${profile.email}`}>
                        <UiIcon icon={Mail01Icon} />
                        Contact
                      </a>
                    </Button>

                    {profile.resumeUrl && (
                      <Button asChild variant="glass" size="icon-text">
                        <a
                          href={profile.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <UiIcon icon={File01Icon} />
                          Resume
                        </a>
                      </Button>
                    )}

                    {socials.map((social) => (
                      <Button
                        key={social.name}
                        asChild
                        variant="glass"
                        size="icon-only"
                      >
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.name}
                        >
                          <UiIcon icon={social.icon} className="size-5" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="w-full text-justify text-base leading-7 text-muted-foreground">
                {profile.summary}
              </p>
            </div>
          </div>
        </PageSection>

        {projects.length > 0 && (
          <PageSection id="work">
            <SectionTitle>Work</SectionTitle>

            {featuredProject && (
              <article className="grid gap-6 lg:grid-cols-5 lg:items-start">
                <GlassImage
                  src={featuredProject.imageUrl}
                  alt={featuredProject.title}
                  className="aspect-video rounded-2xl lg:col-span-3"
                />
                <div className="flex flex-col gap-4 lg:col-span-2">
                  <h3 className="text-2xl leading-tight font-semibold text-balance md:text-3xl">
                    {featuredProject.title}
                  </h3>
                  <p className="text-base leading-7 text-muted-foreground">
                    {featuredProject.description}
                  </p>
                  <ProjectActions
                    projectUrl={featuredProject.projectUrl}
                    sourceUrl={featuredProject.sourceUrl}
                  />
                </div>
              </article>
            )}

            {secondaryProjects.length > 0 && (
              <div className="grid gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
                {secondaryProjects.map((project) => (
                  <article key={project.id} className="flex flex-col gap-3">
                    <GlassImage
                      src={project.imageUrl}
                      alt={project.title}
                      className="aspect-video rounded-xl"
                    />
                    <h3 className="text-xl leading-tight font-semibold text-balance">
                      {project.title}
                    </h3>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {project.description}
                    </p>
                    {(project.projectUrl || project.sourceUrl) && (
                      <ProjectActions
                        projectUrl={project.projectUrl}
                        sourceUrl={project.sourceUrl}
                      />
                    )}
                  </article>
                ))}
              </div>
            )}
          </PageSection>
        )}

        {skills.length > 0 && (
          <PageSection id="skills">
            <SectionTitle>Skills</SectionTitle>

            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
              {groupByCategory(skills).map(([category, items]) => (
                <section key={category} className="flex flex-col gap-4">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {items.map((skill) => (
                      <li key={skill.id}>
                        <Badge variant="glass">{skill.name}</Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </PageSection>
        )}

        {certifications.length > 0 && (
          <PageSection id="credentials">
            <SectionTitle>Credentials</SectionTitle>

            <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
              {certifications.map((certification) => {
                const issuedYear = certification.issuedAt?.getUTCFullYear();

                return (
                  <article key={certification.id} className="flex flex-col gap-2">
                    <GlassImage
                      src={certification.imageUrl}
                      alt={certification.title}
                      className="aspect-square rounded-xl"
                      imageClassName="object-contain p-5"
                    />
                    <h3 className="text-lg leading-snug font-semibold text-balance">
                      {certification.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {certification.issuer}
                      {issuedYear ? ` / ${issuedYear}` : ""}
                    </p>
                    {certification.credentialUrl && (
                      <Button
                        asChild
                        variant="glass"
                        size="icon-text"
                      >
                        <a
                          href={certification.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <UiIcon icon={ArrowUpRight01Icon} />
                          Verify
                        </a>
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          </PageSection>
        )}

        <footer className="glass-nav border-t border-border/60">
          <PageFrame className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4">
              <SectionTitle>Contact</SectionTitle>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 text-lg font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {profile.email}
                <UiIcon icon={ArrowUpRight01Icon} />
              </a>
            </div>
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {socials.map((social) => (
                  <Button
                    key={social.name}
                    asChild
                    variant="glass"
                    size="icon-only"
                  >
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                    >
                      <UiIcon icon={social.icon} className="size-5" />
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </PageFrame>
        </footer>
      </main>
    </div>
  );
}
