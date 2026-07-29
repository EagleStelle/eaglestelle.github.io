import Link from "next/link";
import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/admin/actions";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/certifications", label: "Certifications" },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex w-full max-w-full flex-1 flex-col">
      <header className="sticky top-0 z-50 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border/60 bg-background/80 px-5 py-4 backdrop-blur-xl md:px-10 lg:px-16">
        <span className="font-mono text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
          Admin
        </span>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href="/">
              View site
              <HugeiconsIcon
                aria-hidden="true"
                icon={ArrowUpRight01Icon}
                className="size-4"
              />
            </Link>
          </Button>

          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={Logout01Icon}
                className="size-4"
              />
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="w-full flex-1 px-5 py-12 md:px-10 lg:px-16 2xl:px-24">
        {children}
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}
