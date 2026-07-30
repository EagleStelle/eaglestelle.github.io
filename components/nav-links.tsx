"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type NavItem = {
  href: string;
  name: string;
};

function useActiveHref(items: NavItem[]) {
  const pathname = usePathname();
  const hasHashLinks = items.some((item) => item.href.startsWith("#"));
  const [activeHash, setActiveHash] = useState(items[0]?.href ?? "");
  const ids = useMemo(
    () =>
      items
        .filter((item) => item.href.startsWith("#"))
        .map((item) => item.href.slice(1)),
    [items],
  );

  useEffect(() => {
    if (!hasHashLinks) return;

    const handleScroll = () => {
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 60;
      if (isAtBottom && ids.length > 0) {
        const lastId = ids[ids.length - 1];
        if (lastId) {
          setActiveHash(`#${lastId}`);
        }
      }
    };

    const syncHash = () => {
      if (window.location.hash) {
        setActiveHash(window.location.hash);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const isAtBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 60;
        if (isAtBottom && ids.length > 0) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveHash(`#${visible.target.id}`);
        }
      },
      { rootMargin: "-20% 0px -40% 0px", threshold: [0.1, 0.35, 0.65] },
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    syncHash();
    handleScroll();

    window.addEventListener("hashchange", syncHash);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [hasHashLinks, ids]);

  return (href: string) => {
    if (href.startsWith("#")) return activeHash === href;
    if (href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

function NavButton({
  item,
  active,
  className,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const isHashLink = item.href.startsWith("#");

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.();

    const targetId = item.href.slice(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      // Delay slightly to allow mobile menu drawer to unmount/unlock body scroll
      setTimeout(() => {
        targetElement.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", item.href);
      }, 100);
    }
  };

  return (
    <Button
      asChild
      variant={active ? "default" : "ghost"}
      size="text-only"
      className={className}
    >
      {isHashLink ? (
        <a
          href={item.href}
          onClick={handleHashClick}
          aria-current={active ? "page" : undefined}
        >
          {item.name}
        </a>
      ) : (
        <Link
          href={item.href}
          onClick={() => onClick?.()}
          aria-current={active ? "page" : undefined}
        >
          {item.name}
        </Link>
      )}
    </Button>
  );
}

export function NavLinks({
  items,
  className,
  itemClassName,
  onNavigate,
}: {
  items: NavItem[];
  className?: string;
  itemClassName?: string;
  onNavigate?: () => void;
}) {
  const isActive = useActiveHref(items);

  return (
    <nav className={cn("items-center gap-1", className)}>
      {items.map((item) => (
        <NavButton
          key={item.href}
          item={item}
          active={isActive(item.href)}
          className={itemClassName}
          onClick={onNavigate}
        />
      ))}
    </nav>
  );
}
