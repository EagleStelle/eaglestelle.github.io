import Link from "next/link";
import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { PageFrame } from "@/components/page-frame";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/admin/actions";

const links = [
  { href: "/admin/profile", name: "Profile" },
  { href: "/admin/skills", name: "Skills" },
  { href: "/admin/projects", name: "Projects" },
  { href: "/admin/experience", name: "Experience" },
  { href: "/admin/education", name: "Education" },
  { href: "/admin/certifications", name: "Certifications" },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex w-full max-w-full flex-1 flex-col bg-background/80 min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
        <PageFrame className="flex min-h-16 items-center justify-between gap-4">
          <Link
            href="/admin/profile"
            className="min-w-0 truncate font-display text-base font-bold tracking-tight"
          >
            Admin Dashboard
          </Link>

          <NavLinks items={links} className="hidden md:flex" />

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />

            <Button
              asChild
              variant="secondary"
              size="icon-text"
              className="hidden sm:inline-flex"
            >
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
                variant="destructive"
                size="icon-text"
                className="hidden sm:inline-flex"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Logout01Icon}
                  className="size-4"
                />
                Sign out
              </Button>
            </form>

            <MobileNav name="Admin" sections={links} />
          </div>
        </PageFrame>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}
