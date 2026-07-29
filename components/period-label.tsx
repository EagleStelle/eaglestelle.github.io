import type { Period } from "@/lib/period";
import { cn } from "@/lib/utils";

export function PeriodLabel({
  period,
  className,
}: {
  period: Period | null;
  className?: string;
}) {
  if (!period) return null;

  return (
    <p
      className={cn(
        "flex shrink-0 items-center gap-1.5 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase",
        className,
      )}
    >
      {period.start && (
        <>
          <span>{period.start}</span>
          <span aria-hidden="true" className="opacity-50">
            —
          </span>
        </>
      )}
      <span
        className={cn(
          period.isPresent &&
            "inline-flex items-center gap-1.5 font-medium text-primary before:size-1.5 before:rounded-full before:bg-primary before:content-['']",
        )}
      >
        {period.end}
      </span>
    </p>
  );
}
