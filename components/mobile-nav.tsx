"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
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
  sections: { href: string; name: string }[];
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

        <nav className="flex flex-col px-4">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              onClick={() => setOpen(false)}
              className="border-b border-border py-5 text-2xl font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {section.name}
            </a>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
