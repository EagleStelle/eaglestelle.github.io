"use client";

import { navigateToSection } from "@/components/nav-links";
import type { CareerTrackLayout } from "@/lib/career";
import { cn } from "@/lib/utils";

export const LOGBOOK_OPEN_EVENT = "logbook:open";

const GROUP_LABELS = {
  experience: "Work",
  education: "Study",
} as const;

export function CareerTrack({ layout }: { layout: CareerTrackLayout }) {
  function openEntry(entryId: string) {
    window.dispatchEvent(new CustomEvent(LOGBOOK_OPEN_EVENT, { detail: entryId }));
    navigateToSection(entryId);
  }

  return (
    <figure className="@container mb-8 rounded-md border bg-card p-4 sm:p-5">
      <figcaption className="sr-only">
        Timeline of work and study periods. Select a period to open its entry below.
      </figcaption>

      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
        <div aria-hidden="true" />
        <div aria-hidden="true" className="relative mb-2 h-4">
          {layout.years.map((year, index) => (
            <span
              key={year.year}
              className={cn(
                "chart-label absolute top-0 pl-1.5 text-muted-foreground",
                index % 2 === 1 && "@max-xl:hidden",
                index % 4 !== 0 && "@max-sm:hidden",
              )}
              style={{ left: `${year.left}%` }}
            >
              {year.year}
            </span>
          ))}
        </div>

        {layout.groups.map((group) => (
          <div key={group.kind} className="contents">
            <div className="chart-label flex items-start border-t border-border pt-2.5 text-muted-foreground">
              {GROUP_LABELS[group.kind]}
            </div>
            <div
              className="relative border-t border-border"
              style={{ height: `${group.laneCount * 2.25 + 0.75}rem` }}
            >
              {layout.years.map((year) => (
                <span
                  key={year.year}
                  aria-hidden="true"
                  className="absolute inset-y-0 w-px bg-border"
                  style={{ left: `${year.left}%` }}
                />
              ))}
              <span
                aria-hidden="true"
                className="route-dash absolute inset-y-0 w-px"
                style={{ left: `${layout.now}%` }}
              />

              {group.bars.map((bar) => (
                <button
                  type="button"
                  key={bar.entryId}
                  onClick={() => openEntry(bar.entryId)}
                  aria-label={`${bar.title}, ${bar.subtitle}: show details`}
                  title={`${bar.title} · ${bar.subtitle}`}
                  className={cn(
                    "absolute flex h-7 cursor-pointer items-center overflow-hidden rounded-sm px-2 text-left outline-offset-2 transition-[filter,box-shadow] duration-150 hover:brightness-110 hover:ring-2 hover:ring-primary/40 focus-visible:outline-2",
                    group.kind === "experience"
                      ? "bg-primary text-primary-foreground"
                      : "study-hatch border border-primary text-foreground",
                    bar.present && "rounded-r-none",
                  )}
                  style={{
                    left: `${bar.left}%`,
                    width: `max(${bar.width}%, 0.5rem)`,
                    top: `${bar.lane * 2.25 + 0.5}rem`,
                  }}
                >
                  <span aria-hidden="true" className="truncate text-xs font-semibold">{bar.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
