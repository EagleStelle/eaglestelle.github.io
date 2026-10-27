import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export function UiIcon({
  icon,
  className,
}: {
  icon: IconSvgElement;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      icon={icon}
      className={cn("size-4 shrink-0", className)}
    />
  );
}
