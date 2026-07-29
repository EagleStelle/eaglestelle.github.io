"use client";

import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-only"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <HugeiconsIcon
        aria-hidden="true"
        icon={Moon02Icon}
        className="size-4 dark:hidden"
      />
      <HugeiconsIcon
        aria-hidden="true"
        icon={Sun01Icon}
        className="hidden size-4 dark:block"
      />
    </Button>
  );
}
