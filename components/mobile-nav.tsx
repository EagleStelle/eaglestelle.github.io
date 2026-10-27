"use client";

import { useState } from "react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { UiIcon } from "@/components/ui-icon";
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
  triggerClassName?: string;
};

export function MobileNav({ name, sections, triggerClassName = "md:hidden" }: Props) {
  const [open, setOpen] = useState(false);

  if (sections.length === 0) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-only"
          className={triggerClassName}
          aria-label="Open menu"
        >
          <UiIcon icon={Menu01Icon} className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-[18rem] flex-col gap-5 border-l border-border bg-background p-5 text-foreground sm:w-[20rem]"
      >
        <SheetHeader className="border-b border-border p-0 pb-3 text-left">
          <SheetTitle className="chart-label text-muted-foreground">
            {name}
          </SheetTitle>
        </SheetHeader>

        <NavLinks
          items={sections}
          className="flex flex-col items-stretch gap-1.5"
          itemClassName="h-11 w-full justify-start rounded-md px-4 text-base font-medium"
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
