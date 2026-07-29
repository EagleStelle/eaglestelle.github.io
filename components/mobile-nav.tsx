"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Props = {
  name: string;
  sections: NavItem[];
};

export function MobileNav({ name, sections }: Props) {
  const [open, setOpen] = useState(false);

  if (sections.length === 0) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-only"
          className="md:hidden"
          aria-label="Open menu"
        >
          <HugeiconsIcon aria-hidden="true" icon={Menu01Icon} className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">
            {name}
          </SheetTitle>
        </SheetHeader>

        <NavLinks
          items={sections}
          className="flex flex-col items-stretch px-4"
          itemClassName="h-auto justify-start rounded-none border-b border-border py-5 text-2xl font-semibold"
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
