import Image from "next/image";
import { PeriodLabel } from "@/components/period-label";
import { toPeriod } from "@/lib/period";

export type TimelineEntry = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  logoUrl: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
};

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="flex flex-col">
      {entries.map((entry) => {
        const period = toPeriod(entry.startDate, entry.endDate);

        return (
          <li
            key={entry.id}
            className="portfolio-item group relative flex gap-4 sm:gap-6"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="glass-orb relative size-16 shrink-0 overflow-hidden rounded-2xl sm:size-28">
                {entry.logoUrl ? (
                  <Image
                    src={entry.logoUrl}
                    alt={`${entry.subtitle} logo`}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center font-mono text-sm text-muted-foreground sm:text-xl">
                    {initials(entry.subtitle)}
                  </span>
                )}
              </div>

              <span
                aria-hidden="true"
                className="w-px flex-1 bg-linear-to-b from-border to-transparent group-last:hidden"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1 pb-10 group-last:pb-0 sm:pt-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h3 className="text-lg leading-snug font-semibold text-balance sm:text-xl">
                  {entry.title}
                </h3>
                <PeriodLabel period={period} />
              </div>

              <p className="text-sm font-medium text-primary">
                {entry.subtitle}
                {entry.location && (
                  <span className="text-muted-foreground">
                    {" / "}
                    {entry.location}
                  </span>
                )}
              </p>

              <p className="max-w-3xl text-sm leading-6 whitespace-pre-line text-muted-foreground">
                {entry.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
