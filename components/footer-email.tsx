"use client";

import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";

export function FooterEmail({ email }: { email: string }) {
  const handleClick = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(email);
    }
    toast.info("Opening mail app (copied email to clipboard)");
  };

  return (
    <a
      href={`mailto:${email}`}
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-lg font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {email}
      <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4 shrink-0" />
    </a>
  );
}


