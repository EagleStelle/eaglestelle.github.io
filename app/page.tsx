import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  File01Icon,
  Github01Icon,
  Linkedin01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { MobileNav } from "@/components/mobile-nav";
import { LavaLamp } from "@/components/lava-lamp";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { PageFrame } from "@/components/page-frame";
import { ThemeToggle } from "@/components/theme-toggle";
import { ContactForm } from "@/components/contact-form";
import { FooterEmail } from "@/components/footer-email";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectShowcase, type ProjectView } from "@/components/project-showcase";
import { CertificationShowcase, type CertificationView } from "@/components/certification-showcase";
import { Timeline, type TimelineEntry } from "@/components/timeline";
import { parseProjectImageList, parseProjectList } from "@/lib/project-data";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { SITE_ALIASES, SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });

  const name = profile?.name?.trim() || SITE_NAME;
  const title = `${name} (${SITE_ALIASES[0]})`;
  const aliasLine = `${name} (${SITE_ALIASES.join(" / ")})`;
  const summary = profile?.summary?.trim().replace(/\s+/g, " ");
  const headline = profile?.headline?.trim();

  const description = [aliasLine, headline, summary]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 300);

  return {
    title: { absolute: title },
    description,
    keywords: [name, ...SITE_ALIASES],
    alternates: { canonical: "/" },
    openGraph: {
      type: "profile",
      url: SITE_URL,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const sectionInset = "px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 xl:px-16 xl:py-12";

function PageSection({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn("flex w-full flex-col gap-6 scroll-mt-16", sectionInset, className)}
      {...props}
    />
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
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

type CategoryOrder = {
  name: string;
  order: number;
};

function groupSkillsByCategory<
  T extends { category: string | null; name: string; order: number },
>(items: T[], categories: CategoryOrder[]) {
  const categoryOrder = new Map(
    categories.map((category) => [category.name, category.order]),
  );
  const groups = new Map<
    string,
    {
      order: number;
      firstSkillOrder: number;
      items: T[];
    }
  >();

  for (const item of items) {
    const key = item.category ?? "Other";
    const group = groups.get(key);

    if (group) {
      group.firstSkillOrder = Math.min(group.firstSkillOrder, item.order);
      group.items.push(item);
    } else {
      groups.set(key, {
        order: categoryOrder.get(key) ?? Number.MAX_SAFE_INTEGER,
        firstSkillOrder: item.order,
        items: [item],
      });
    }
  }

  return [...groups.entries()]
    .sort((left, right) => {
      const leftGroup = left[1];
      const rightGroup = right[1];

      return (
        leftGroup.order - rightGroup.order ||
        leftGroup.firstSkillOrder - rightGroup.firstSkillOrder ||
        left[0].localeCompare(right[0])
      );
    })
    .map(([category, group]) => [
      category,
      [...group.items].sort(
        (left, right) =>
          left.order - right.order || left.name.localeCompare(right.name),
      ),
    ] as const);
}

export default async function Home() {
  const [
    profile,
    skills,
    skillCategories,
    projects,
    experience,
    education,
    certifications,
  ] = await Promise.all([
      prisma.profile.findUnique({ where: { id: 1 } }),
      prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
      prisma.skillCategory.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
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
          <Link
            href="/admin"
            rel="nofollow"
            className="underline underline-offset-4"
          >
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
  ].filter(
    (link): link is { href: string; icon: IconSvgElement; name: string } =>
      Boolean(link),
  );

  const sections = [
    projects.length > 0 && { href: "#projects", name: "Projects" },
    experience.length > 0 && { href: "#experience", name: "Experience" },
    education.length > 0 && { href: "#education", name: "Education" },
    skills.length > 0 && { href: "#skills", name: "Skills" },
    certifications.length > 0 && { href: "#certifications", name: "Certifications" },
    { href: "#contact", name: "Contact" },
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
    employmentType: item.employmentType,
    locationType: item.locationType,
    startDate: item.startDate,
    endDate: item.endDate,
  }));

  const educationEntries: TimelineEntry[] = education.map((item) => ({
    id: item.id,
    title: item.degree,
    subtitle: item.institution,
    description: item.description,
    logoUrl: item.logoUrl,
    startDate: item.startDate,
    endDate: item.endDate,
  }));

  const certificationViews: CertificationView[] = certifications.map((item) => ({
    id: item.id,
    title: item.title,
    issuer: item.issuer,
    imageUrl: item.imageUrl,
    certificationUrl: item.certificationUrl,
    issuedAt: item.issuedAt,
  }));
  const skillGroups = groupSkillsByCategory(skills, skillCategories);

  const heroImage =
    profile.avatarUrl ??
    projectViews[0]?.images[0]?.url ??
    certifications[0]?.imageUrl;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: profile.name,
        alternateName: SITE_ALIASES,
        url: SITE_URL,
        jobTitle: profile.headline,
        description: profile.summary,
        email: `mailto:${profile.email}`,
        image: heroImage ? new URL(heroImage, SITE_URL).toString() : undefined,
        knowsAbout: skills.map((skill) => skill.name),
        alumniOf: education.map((item) => ({
          "@type": "EducationalOrganization",
          name: item.institution,
        })),
        worksFor: experience.slice(0, 1).map((item) => ({
          "@type": "Organization",
          name: item.company,
        })),
        hasCredential: certifications.map((item) => ({
          "@type": "EducationalOccupationalCredential",
          name: item.title,
          credentialCategory: "certificate",
          recognizedBy: { "@type": "Organization", name: item.issuer },
          url: item.certificationUrl ?? undefined,
        })),
        sameAs: socials.map((social) => social.href),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: profile.name,
        alternateName: SITE_ALIASES,
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#person` },
        about: { "@id": `${SITE_URL}/#person` },
      },
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/#profilepage`,
        url: SITE_URL,
        name: `${profile.name} (${SITE_ALIASES[0]})`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: { "@id": `${SITE_URL}/#person` },
      },
    ],
  };

  return (
    <div className="glass-page flex min-h-dvh flex-col bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LavaLamp />

      <header className="sticky top-0 z-40 bg-background/5 backdrop-blur-[30px] backdrop-saturate-200">
        <PageFrame className="flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="min-w-0 truncate text-sm font-semibold">
            {profile.name}
          </Link>

          <NavLinks items={sections} className="hidden md:flex" />

          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <MobileNav name={profile.name} sections={sections} />
          </div>
        </PageFrame>
      </header>

      <main className="relative z-10 grid w-full max-w-full flex-1 content-start">
        <PageSection>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex min-w-0 w-full flex-col items-stretch gap-4">
              <div className="flex flex-col sm:flex-row w-full items-center sm:items-start gap-4 sm:gap-6">
                {heroImage && (
                  <div className="glass-orb relative size-28 shrink-0 overflow-hidden rounded-full sm:size-36 lg:size-44">
                    <Image
                      src={heroImage}
                      alt={profile.name}
                      fill
                      priority
                      sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 176px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-3 text-center sm:text-left">
                  <h1 className="max-w-5xl text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                    {profile.name}
                  </h1>
                  <p className="max-w-3xl text-base leading-snug font-medium text-primary sm:text-xl lg:text-2xl">
                    {profile.headline}
                  </p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Also known as {SITE_ALIASES.join(" · ")}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <Button asChild size="icon-text">
                      <a href="#contact">
                        <UiIcon icon={Mail01Icon} />
                        Contact
                      </a>
                    </Button>

                    {profile.resumeUrl && (
                      <Button asChild size="icon-text">
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

              <p className="w-full text-justify text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
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
              {skillGroups.map(([category, items]) => (
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

        {certificationViews.length > 0 && (
          <PageSection id="certifications">
            <SectionTitle>Certifications</SectionTitle>
            <CertificationShowcase certifications={certificationViews} />
          </PageSection>
        )}

      </main>

      <footer id="contact" className="glass-nav relative z-10 scroll-mt-16 pb-28 sm:pb-36 lg:pb-44">
        <PageFrame className="flex flex-col gap-6 py-4 sm:py-6 lg:py-8 xl:py-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 lg:items-start">
            <div className="flex flex-col gap-6 lg:col-span-5">
              <div className="flex flex-col gap-3">
                <SectionTitle>Contact</SectionTitle>
                <p className="text-base leading-7 text-muted-foreground">
                  Send a note through the form or email directly.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </span>
                <FooterEmail email={profile.email} />
              </div>

              {socials.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Connect
                  </span>
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
                </div>
              )}
            </div>

            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
            <p>
              © {new Date().getFullYear()} {profile.name} ({SITE_ALIASES.join(" / ")}). All rights
              reserved.
            </p>
          </div>
        </PageFrame>
      </footer>
    </div>
  );
}
