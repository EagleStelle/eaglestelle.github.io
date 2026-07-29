import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function groupByCategory<T extends { category: string | null }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.category ?? "Other";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()];
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
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-zinc-500">
          No profile yet. Go to{" "}
          <Link href="/admin" className="underline">
            /admin
          </Link>{" "}
          to set one up.
        </p>
      </div>
    );
  }

  const contactLinks = [
    { href: `mailto:${profile.email}`, label: "Email" },
    profile.githubUrl && { href: profile.githubUrl, label: "GitHub" },
    profile.linkedinUrl && { href: profile.linkedinUrl, label: "LinkedIn" },
    profile.websiteUrl && { href: profile.websiteUrl, label: "Website" },
    profile.resumeUrl && { href: profile.resumeUrl, label: "Resume" },
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-20">
      <section className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {profile.avatarUrl && (
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full">
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              fill
              className="object-cover"
              sizes="112px"
              priority
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {profile.name}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {profile.headline}
          </p>
          {(profile.location || profile.phone) && (
            <p className="text-sm text-zinc-500">
              {[profile.location, profile.phone].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </section>

      <p className="mt-10 max-w-2xl leading-7 text-zinc-700 dark:text-zinc-300">
        {profile.summary}
      </p>

      <nav className="mt-6 flex flex-wrap gap-4 text-sm">
        {contactLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:no-underline"
          >
            {link.label}
          </a>
        ))}
      </nav>

      {skills.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold">Skills</h2>
          <div className="mt-6 flex flex-col gap-5">
            {groupByCategory(skills).map(([category, items]) => (
              <div key={category} className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-zinc-500">
                  {category}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {items.map((skill) => (
                    <li
                      key={skill.id}
                      className="rounded-full border border-black/10 px-3 py-1 text-sm dark:border-white/15"
                    >
                      {skill.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold">Projects</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            {projects.map((project) => (
              <article key={project.id} className="flex flex-col gap-3">
                <div className="relative aspect-video overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <h3 className="font-medium">{project.title}</h3>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {project.description}
                </p>
                <div className="flex gap-4 text-sm">
                  {project.projectUrl && (
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      Live
                    </a>
                  )}
                  {project.sourceUrl && (
                    <a
                      href={project.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      Source
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {certifications.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold">Certifications</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            {certifications.map((certification) => (
              <article key={certification.id} className="flex flex-col gap-3">
                <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
                  <Image
                    src={certification.imageUrl}
                    alt={certification.title}
                    fill
                    className="object-contain"
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <h3 className="font-medium">{certification.title}</h3>
                <p className="text-sm text-zinc-500">
                  {certification.issuer}
                  {certification.issuedAt &&
                    ` · ${certification.issuedAt.getUTCFullYear()}`}
                </p>
                {certification.credentialUrl && (
                  <a
                    href={certification.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline underline-offset-4"
                  >
                    Verify
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
