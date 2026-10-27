"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight01Icon, Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { UiIcon } from "@/components/ui-icon";
import { Button } from "@/components/ui/button";

export function FooterEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success("Email address copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the address and copy it instead.");
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      <a
        href={`mailto:${email}`}
        className="inline-flex min-w-0 items-center gap-1.5 rounded-sm text-lg font-semibold text-primary underline-offset-4 outline-offset-2 wrap-anywhere hover:underline focus-visible:outline-2 sm:text-xl"
      >
        {email}
        <UiIcon icon={ArrowUpRight01Icon} />
      </a>
      <Button
        type="button"
        variant="ghost"
        size="icon-only"
        onClick={handleCopy}
        aria-label={copied ? "Email address copied" : "Copy email address"}
        title="Copy email address"
      >
        <UiIcon icon={copied ? Tick02Icon : Copy01Icon} />
      </Button>
    </div>
  );
}
