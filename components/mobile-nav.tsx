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

      <SheetContent side="right" className="w-[280px] sm:w-[320px] p-5 flex flex-col gap-5 bg-background text-foreground border-l border-border">
        <SheetHeader className="p-0 pb-3 border-b border-border/40 text-left">
          <SheetTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Navigation
          </SheetTitle>
        </SheetHeader>

        <NavLinks
          items={sections}
          className="flex flex-col items-stretch gap-1.5"
          itemClassName="w-full justify-start text-base font-medium h-11 px-4 rounded-lg"
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
