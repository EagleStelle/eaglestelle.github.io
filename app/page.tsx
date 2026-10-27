import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  File01Icon,
  Github01Icon,
  Linkedin01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { BrandMark } from "@/components/brand-mark";
import { CareerTrack } from "@/components/career-track";
import { CertificationShowcase, type CertificationView } from "@/components/certification-showcase";
import { CompassRose } from "@/components/compass-rose";
import { ContactForm } from "@/components/contact-form";
import { FooterEmail } from "@/components/footer-email";
import { MobileNav } from "@/components/mobile-nav";
import { SectionLink } from "@/components/nav-links";
import { frameInset } from "@/components/page-frame";
import { ProjectFilterProvider } from "@/components/project-filter";
import { ProjectShowcase, type ProjectView } from "@/components/project-showcase";
import { RouteProgressBar, RouteProvider, RouteRail, RouteStatus, type Waypoint } from "@/components/route";
import { SkillsBoard, type SkillGroup } from "@/components/skills-board";
import { ThemeToggle } from "@/components/theme-toggle";
import { Timeline, type TimelineEntry } from "@/components/timeline";
import { UiIcon } from "@/components/ui-icon";
import { WaypointGlyph } from "@/components/waypoint-glyph";
import { Button } from "@/components/ui/button";
import { buildCareerTrack, type CareerItem } from "@/lib/career";
import { prisma } from "@/lib/prisma";
import {
  aliasIdentities,
  displayName,
  displayTitle,
  formatIdentity,
  getProfile,
} from "@/lib/profile";
import { parseProjectImageList, parseProjectList } from "@/lib/project-data";
import { SITE_URL } from "@/lib/site";
import { techKey } from "@/lib/tech";
import { cn, plural } from "@/lib/utils";

export const revalidate = 3600;

const aliasFormat = new Intl.ListFormat("en", { type: "disjunction" });

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const title = displayTitle(profile);
  const names = profile ? [profile.name, ...profile.aliases] : [];
  const summary = profile?.summary.trim().replace(/\s+/g, " ");
  const aliases = aliasFormat.format(profile?.aliases ?? []);
  const tagline = [profile?.headline.trim(), aliases && `also known as ${aliases}`]
    .filter(Boolean)
    .join(", ");
  const description = [[profile?.name.trim(), tagline].filter(Boolean).join(" — "), summary]
    .filter(Boolean)
    .join(". ")
    .slice(0, 300);

  return {
    title: { absolute: title },
    description: description || undefined,
    keywords: names.length > 0 ? names : undefined,
    alternates: { canonical: "/" },
    openGraph: {
      type: "profile",
      url: SITE_URL,
      title,
      description: description || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || undefined,
    },
  };
}

type CategoryOrder = {
  name: string;
  order: number;
};

function groupSkillsByCategory<
  T extends { id: number; category: string | null; name: string; order: number },
>(items: T[], categories: CategoryOrder[]): SkillGroup[] {
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
    .map(([category, group]) => ({
      category,
      skills: [...group.items]
        .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
        .map((skill) => ({ id: skill.id, name: skill.name })),
    }));
}

function ChartHeading({
  id,
  title,
  meta,
  className,
}: {
  id: string;
  title: string;
  meta?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-2", className)}>
      <h2
        id={`${id}-title`}
        className="type-wide flex items-center gap-2.5 text-section font-bold uppercase sm:gap-3"
      >
        <WaypointGlyph state="mark" className="size-5 sm:size-6" />
        {title}
      </h2>
      {meta && <p className="chart-label text-muted-foreground lg:hidden">{meta}</p>}
    </div>
  );
}

function ChartSection({
  id,
  title,
  meta,
  children,
}: {
  id: string;
  title?: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="border-t border-border py-10 sm:py-12 lg:py-14"
    >
      {title && <ChartHeading id={id} title={title} meta={meta} className="mb-6 sm:mb-8" />}
      {children}
    </section>
  );
}

export default async function Home() {
  const [profile, skills, skillCategories, projects, experience, education, certifications] =
    await Promise.all([
      getProfile(),
      prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
      prisma.skillCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
      prisma.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
      prisma.experience.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
      prisma.education.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
      prisma.certification.findMany({ orderBy: [{ order: "asc" }, { issuedAt: "desc" }] }),
    ]);

  if (!profile) {
    return (
      <main
        id="main"
        tabIndex={-1}
        className="chart-ground flex flex-1 items-center justify-center px-4 text-center"
      >
        <p className="text-sm text-muted-foreground">
          No profile yet. Go to{" "}
          <Link href="/admin" rel="nofollow" className="text-primary underline underline-offset-4">
            /admin
          </Link>{" "}
          to set one up.
        </p>
      </main>
    );
  }

  const name = displayName(profile);
  const identities = aliasIdentities(profile.aliases);
  const taglineChars =
    [...profile.headline].length * 1.25 +
    identities.map(formatIdentity).join("   ").length +
    (profile.headline && identities.length > 0 ? 2.5 : 0);

  const socials = [
    profile.githubUrl && { href: profile.githubUrl, icon: Github01Icon, name: "GitHub" },
    profile.linkedinUrl && { href: profile.linkedinUrl, icon: Linkedin01Icon, name: "LinkedIn" },
  ].filter((link): link is { href: string; icon: IconSvgElement; name: string } =>
    Boolean(link),
  );

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

  const techCounts: Record<string, number> = {};
  for (const project of projectViews) {
    for (const tech of new Set(project.techStack.map(techKey))) {
      techCounts[tech] = (techCounts[tech] ?? 0) + 1;
    }
  }

  const careerItems: CareerItem[] = [
    ...experienceEntries.map((entry) => ({
      entryId: `experience-${entry.id}`,
      kind: "experience" as const,
      title: entry.title,
      subtitle: entry.subtitle,
      startDate: entry.startDate,
      endDate: entry.endDate,
    })),
    ...educationEntries.map((entry) => ({
      entryId: `education-${entry.id}`,
      kind: "education" as const,
      title: entry.title,
      subtitle: entry.subtitle,
      startDate: entry.startDate,
      endDate: entry.endDate,
    })),
  ];
  const careerTrack = buildCareerTrack(careerItems);

  const waypoints: Waypoint[] = [
    { id: "profile", name: "Profile" },
    projectViews.length > 0 && { id: "projects", name: "Projects", count: projectViews.length },
    experienceEntries.length > 0 && {
      id: "experience",
      name: "Experience",
      count: experienceEntries.length,
    },
    educationEntries.length > 0 && {
      id: "education",
      name: "Education",
      count: educationEntries.length,
    },
    skills.length > 0 && { id: "skills", name: "Skills", count: skills.length },
    certificationViews.length > 0 && {
      id: "certifications",
      name: "Certifications",
      count: certificationViews.length,
    },
    { id: "contact", name: "Contact" },
  ].filter((waypoint): waypoint is Waypoint => Boolean(waypoint));

  const heroImage =
    profile.avatarUrl ?? projectViews[0]?.images[0]?.url ?? certifications[0]?.imageUrl;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name,
        alternateName: profile.aliases.length > 0 ? profile.aliases : undefined,
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
        name,
        alternateName: profile.aliases.length > 0 ? profile.aliases : undefined,
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#person` },
        about: { "@id": `${SITE_URL}/#person` },
      },
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/#profilepage`,
        url: SITE_URL,
        name: displayTitle(profile),
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: { "@id": `${SITE_URL}/#person` },
      },
    ],
  };

  const careerTrackElement = careerTrack && <CareerTrack layout={careerTrack} />;

  return (
    <RouteProvider waypoints={waypoints}>
      <ProjectFilterProvider>
        <div className="chart-ground flex min-h-dvh flex-col text-foreground">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />

          <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
            <div className={cn(frameInset, "flex h-14 items-center justify-between gap-4 sm:h-16")}>
              <SectionLink
                id="profile"
                className="type-wide flex min-w-0 shrink items-center gap-2.5 rounded-sm text-sm font-bold tracking-[0.02em] uppercase outline-offset-2 focus-visible:outline-2"
              >
                <BrandMark />
                <span className="truncate">{name}</span>
              </SectionLink>

              <RouteStatus className="hidden sm:flex lg:hidden" />

              <div className="flex shrink-0 items-center gap-1">
                {profile.resumeUrl && (
                  <Button asChild variant="ghost" size="text-only" className="hidden sm:inline-flex">
                    <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                      Resume
                      <UiIcon icon={ArrowUpRight01Icon} />
                    </a>
                  </Button>
                )}
                <ThemeToggle />
                <MobileNav
                  name={name}
                  sections={waypoints.map((waypoint) => ({
                    href: `#${waypoint.id}`,
                    name: waypoint.name,
                  }))}
                  triggerClassName="lg:hidden"
                />
              </div>
            </div>
            <RouteProgressBar className="lg:hidden" />
          </header>

          <div
            className={cn(
              frameInset,
              "grid flex-1 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[12.5rem_minmax(0,1fr)] xl:gap-16",
            )}
          >
            <aside className="hidden lg:block">
              <RouteRail className="sticky top-24 py-12" />
            </aside>

            <main id="main" tabIndex={-1} className="min-w-0">
              <section
                id="profile"
                aria-labelledby="profile-name"
                className="grid items-center gap-8 py-12 lg:grid-cols-12 lg:gap-12"
              >
                <div className="@container order-2 flex min-w-0 flex-col items-center gap-6 text-center lg:order-1 lg:col-span-8 lg:items-start lg:text-left xl:col-span-7">
                  <hgroup className="flex w-full flex-col items-center gap-3 lg:items-start">
                    <h1
                      id="profile-name"
                      style={{ "--fit-chars": [...name].length } as CSSProperties}
                      className="type-wide display-fit w-full font-bold uppercase"
                    >
                      {name}
                    </h1>

                    {(profile.headline || identities.length > 0) && (
                      <p
                        style={{ "--fit-chars": taglineChars } as CSSProperties}
                        className="tagline-fit flex items-center justify-center gap-x-[0.625em] leading-snug font-medium lg:justify-start lg:[--tagline-max:1.1875rem]"
                      >
                        {profile.headline && (
                          <span className="text-[1.25em] text-primary">{profile.headline}</span>
                        )}
                        {profile.headline && identities.length > 0 && (
                          <span aria-hidden="true" className="h-[1.25em] w-px bg-border" />
                        )}
                        {identities.length > 0 && (
                          <span className="flex items-center gap-x-[0.625em]">
                            <span className="sr-only">
                              {profile.headline ? ", also known as " : "Also known as "}
                            </span>
                            {identities.map((identity) => (
                              <span
                                key={identity.displayName ?? identity.username}
                                className="inline-flex items-center gap-x-[0.375em]"
                              >
                                {identity.displayName && (
                                  <span className="text-foreground">{identity.displayName}</span>
                                )}
                                {identity.username && (
                                  <span className="font-normal text-muted-foreground">
                                    @{identity.username}
                                  </span>
                                )}
                              </span>
                            ))}
                          </span>
                        )}
                      </p>
                    )}
                  </hgroup>

                  {profile.summary && (
                    <p className="max-w-[65ch] text-left text-sm leading-6 text-pretty whitespace-pre-line text-muted-foreground sm:text-justify sm:text-base sm:leading-7 sm:hyphens-auto lg:text-lg lg:leading-8">
                      {profile.summary}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                    <Button asChild size="icon-text">
                      <a href="#contact">
                        <UiIcon icon={Mail01Icon} />
                        Contact
                      </a>
                    </Button>

                    {profile.resumeUrl && (
                      <Button asChild variant="secondary" size="icon-text">
                        <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                          <UiIcon icon={File01Icon} />
                          Resume
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </Button>
                    )}

                    {socials.map((social) => (
                      <Button key={social.name} asChild variant="ghost" size="icon-only">
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${social.name} (opens in a new tab)`}
                        >
                          <UiIcon icon={social.icon} />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="order-1 mx-auto w-full max-w-52 sm:max-w-64 lg:order-2 lg:col-span-4 lg:max-w-80 xl:col-span-5 xl:max-w-88">
                  <CompassRose imageUrl={profile.avatarUrl} name={name} />
                </div>
              </section>

              {projectViews.length > 0 && (
                <ChartSection id="projects" title="Projects" meta={plural(projectViews.length, "project")}>
                  <ProjectShowcase projects={projectViews} />
                </ChartSection>
              )}

              {experienceEntries.length > 0 && (
                <ChartSection
                  id="experience"
                  title="Experience"
                  meta={plural(experienceEntries.length, "role")}
                >
                  {careerTrackElement}
                  <Timeline entries={experienceEntries} idPrefix="experience" />
                </ChartSection>
              )}

              {educationEntries.length > 0 && (
                <ChartSection
                  id="education"
                  title="Education"
                  meta={plural(educationEntries.length, "entry", "entries")}
                >
                  {experienceEntries.length === 0 && careerTrackElement}
                  <Timeline entries={educationEntries} idPrefix="education" />
                </ChartSection>
              )}

              {skills.length > 0 && (
                <ChartSection id="skills" title="Skills" meta={plural(skills.length, "skill")}>
                  <SkillsBoard groups={skillGroups} techCounts={techCounts} />
                </ChartSection>
              )}

              {certificationViews.length > 0 && (
                <ChartSection
                  id="certifications"
                  title="Certifications"
                  meta={plural(certificationViews.length, "certification")}
                >
                  <CertificationShowcase certifications={certificationViews} />
                </ChartSection>
              )}

              <ChartSection id="contact">
                <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                  <div className="flex flex-col lg:col-span-5">
                    <ChartHeading id="contact" title="Contact" className="mb-6 sm:mb-8" />

                    <p className="max-w-[42ch] text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
                      Send a note through the form or email directly.
                    </p>

                    <div className="mt-8 flex flex-col gap-6 sm:mt-10">
                      <div className="flex flex-col gap-2">
                        <span className="chart-label text-muted-foreground">Email</span>
                        <FooterEmail email={profile.email} />
                      </div>

                      {socials.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="chart-label text-muted-foreground">Elsewhere</span>
                          <ul className="flex flex-wrap gap-2">
                            {socials.map((social) => (
                              <li key={social.name}>
                                <Button asChild variant="secondary" size="icon-text">
                                  <a href={social.href} target="_blank" rel="noopener noreferrer">
                                    <UiIcon icon={social.icon} />
                                    {social.name}
                                    <span className="sr-only">(opens in a new tab)</span>
                                  </a>
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    <ContactForm />
                  </div>
                </div>
              </ChartSection>
            </main>
          </div>

          <footer className="border-t border-border">
            <div
              className={cn(
                frameInset,
                "chart-label flex flex-col gap-2 py-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
              )}
            >
              <p>
                © {new Date().getFullYear()} {name}
              </p>
              {identities.length > 0 && <p>{identities.map(formatIdentity).join(" · ")}</p>}
            </div>
          </footer>
        </div>
      </ProjectFilterProvider>
    </RouteProvider>
  );
}
