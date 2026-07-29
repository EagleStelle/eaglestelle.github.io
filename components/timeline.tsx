import Image from "next/image";
import { Fragment } from "react";
import { toPeriod } from "@/lib/period";

export type TimelineEntry = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  logoUrl: string | null;
  employmentType?: string | null;
  locationType?: string | null;
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

function MetaLine({
  items,
  primary = false,
}: {
  items: string[];
  primary?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <p
      className={
        primary
          ? "text-sm leading-6 font-medium text-foreground/85"
          : "font-mono text-xs leading-5 tracking-[0.08em] text-muted-foreground uppercase"
      }
    >
      {items.map((item, index) => (
        <Fragment key={`${item}-${index}`}>
          {index > 0 && (
            <span aria-hidden="true" className="text-muted-foreground">
              {" \u00B7 "}
            </span>
          )}
          <span className={primary ? "text-primary" : undefined}>
            {item}
          </span>
        </Fragment>
      ))}
    </p>
  );
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="flex flex-col">
      {entries.map((entry) => {
        const period = toPeriod(entry.startDate, entry.endDate);
        const roleMeta = [entry.subtitle, entry.employmentType].filter(
          (item): item is string => Boolean(item),
        );
        const dateMeta = [period?.label, entry.locationType].filter(
          (item): item is string => Boolean(item),
        );

        return (
          <li
            key={entry.id}
            className="portfolio-item group relative flex gap-4 sm:gap-6"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="glass-orb relative size-16 shrink-0 overflow-hidden rounded-lg sm:size-28">
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
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg leading-snug font-semibold text-balance sm:text-xl">
                  {entry.title}
                </h3>
                <MetaLine items={roleMeta} primary />
                <MetaLine items={dateMeta} />
              </div>

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
