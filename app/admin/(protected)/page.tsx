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
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-black/10 p-5 hover:border-black/30 dark:border-white/15 dark:hover:border-white/40"
          >
            <p className="text-sm text-zinc-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </Link>
        ))}
      </div>

      {!profile && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          Fill in <Link href="/admin/profile" className="underline">Profile</Link> first —
          the public page needs it to render.
        </p>
      )}
    </div>
  );
}
