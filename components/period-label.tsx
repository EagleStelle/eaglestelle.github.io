import type { Period } from "@/lib/period";
import { cn } from "@/lib/utils";

export function PeriodLabel({
  period,
  className,
  as: Tag = "p",
}: {
  period: Period | null;
  className?: string;
  as?: "p" | "span";
}) {
  if (!period) return null;

  return (
    <Tag
      className={cn(
        "chart-label flex shrink-0 flex-wrap items-center gap-x-1.5 text-muted-foreground",
        className,
      )}
    >
      {period.start && (
        <>
          <span>{period.start}</span>
          <span aria-hidden="true">–</span>
          <span className="sr-only">to</span>
        </>
      )}
      <span
        className={cn(
          period.isPresent &&
            "inline-flex items-center gap-1.5 text-primary before:size-1.5 before:rounded-full before:bg-primary before:content-['']",
        )}
      >
        {period.end}
      </span>
    </Tag>
  );
}
