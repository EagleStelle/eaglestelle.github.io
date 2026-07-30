"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

export function FooterEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success("Copied email to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMailClick = () => {
    toast.info("Opening mail app");
  };

  return (
    <div className="inline-flex items-center gap-2">
      <a
        href={`mailto:${email}`}
        onClick={handleMailClick}
        className="inline-flex items-center gap-1.5 text-lg font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {email}
        <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4 shrink-0" />
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        title="Copy email address"
        aria-label="Copy email address"
      >
        <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className="size-4 shrink-0" />
      </button>
    </div>
  );
}



