import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const [profile, skills, projects, certifications] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.skill.count(),
    prisma.project.count(),
    prisma.certification.count(),
  ]);

  const cards = [
    {
      href: "/admin/profile",
      label: "Profile",
      value: profile ? "Set up" : "Not set up",
    },
    { href: "/admin/skills", label: "Skills", value: `${skills}` },
    { href: "/admin/projects", label: "Projects", value: `${projects}` },
    {
      href: "/admin/certifications",
      label: "Certifications",
      value: `${certifications}`,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-4xl tracking-tight">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-border bg-card p-5 hover:border-foreground/30 hover:bg-accent/40"
          >
            <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              {card.label}
            </p>
            <p className="mt-2 font-display text-3xl tracking-tight">
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      {!profile && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm">
          Fill in{" "}
          <Link href="/admin/profile" className="underline underline-offset-4">
            Profile
          </Link>{" "}
          first. The public page needs it to render.
        </p>
      )}
    </div>
  );
}
