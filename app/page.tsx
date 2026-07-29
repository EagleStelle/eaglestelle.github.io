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
import { LavaLamp } from "@/components/lava-lamp";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { PageFrame } from "@/components/page-frame";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectShowcase, type ProjectView } from "@/components/project-showcase";
import { Timeline, type TimelineEntry } from "@/components/timeline";
import { parseProjectImageList, parseProjectList } from "@/lib/project-data";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const sectionInset = "px-6 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-10";

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

export default async function Home() {
  const [profile, skills, projects, experience, education, certifications] =
    await Promise.all([
      prisma.profile.findUnique({ where: { id: 1 } }),
      prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
      prisma.project.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.experience.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.education.findMany({
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
    projects.length > 0 && { href: "#projects", name: "Projects" },
    experience.length > 0 && { href: "#experience", name: "Experience" },
    education.length > 0 && { href: "#education", name: "Education" },
    skills.length > 0 && { href: "#skills", name: "Skills" },
    certifications.length > 0 && { href: "#credentials", name: "Credentials" },
  ].filter((link): link is NavItem => Boolean(link));

  const projectViews: ProjectView[] = projects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    images: parseProjectImageList({
      imageUrl: project.imageUrl,
      imageUrls: project.imageUrls,
    }),
    techStack: parseProjectList(project.techStack),
    projectUrl: project.projectUrl,
    sourceUrl: project.sourceUrl,
    startDate: project.startDate,
    endDate: project.endDate,
  }));

  const experienceEntries: TimelineEntry[] = experience.map((item) => ({
    id: item.id,
    title: item.role,
    subtitle: item.company,
    description: item.description,
    logoUrl: item.logoUrl,
    location: item.location,
    startDate: item.startDate,
    endDate: item.endDate,
  }));

  const educationEntries: TimelineEntry[] = education.map((item) => ({
    id: item.id,
    title: item.degree,
    subtitle: item.institution,
    description: item.description,
    logoUrl: item.logoUrl,
    location: item.location,
    startDate: item.startDate,
    endDate: item.endDate,
  }));

  const heroImage =
    profile.avatarUrl ??
    projectViews[0]?.images[0]?.url ??
    certifications[0]?.imageUrl;

  return (
    <div className="glass-page flex min-h-dvh flex-col bg-background text-foreground">
      <LavaLamp />

      <header className="sticky top-0 z-40 bg-background/5 backdrop-blur-[30px] backdrop-saturate-200">
        <PageFrame className="flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="min-w-0 truncate text-sm font-semibold">
            {profile.name}
          </Link>

          <NavLinks items={sections} className="hidden md:flex" />

          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <Button
              asChild
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

      <main className="relative z-10 grid w-full max-w-full flex-1 content-start">
        <PageSection>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex min-w-0 w-full flex-col items-stretch gap-4">
              <div className="flex w-full items-center gap-5">
                {heroImage && (
                  <div className="glass-orb relative size-32 shrink-0 overflow-hidden rounded-full sm:size-40 lg:size-48">
                    <Image
                      src={heroImage}
                      alt={profile.name}
                      fill
                      priority
                      sizes="calc(var(--spacing) * 48)"
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
                    <Button asChild size="icon-text">
                      <a href={`mailto:${profile.email}`}>
                        <UiIcon icon={Mail01Icon} />
                        Contact
                      </a>
                    </Button>

                    {profile.resumeUrl && (
                      <Button asChild variant="secondary" size="icon-text">
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
                        variant="secondary"
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

        {projectViews.length > 0 && (
          <PageSection id="projects">
            <SectionTitle>Projects</SectionTitle>
            <ProjectShowcase projects={projectViews} />
          </PageSection>
        )}

        {experienceEntries.length > 0 && (
          <PageSection id="experience">
            <SectionTitle>Experience</SectionTitle>
            <Timeline entries={experienceEntries} />
          </PageSection>
        )}

        {educationEntries.length > 0 && (
          <PageSection id="education">
            <SectionTitle>Education</SectionTitle>
            <Timeline entries={educationEntries} />
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
                        <Badge>{skill.name}</Badge>
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
                  <article
                    key={certification.id}
                    className="portfolio-item flex flex-col gap-2 rounded-xl outline-none"
                  >
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
                      <Button asChild variant="secondary" size="icon-text">
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

      </main>

      <footer className="glass-nav relative z-10">
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
                  variant="secondary"
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
    </div>
  );
}
