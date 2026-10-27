"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { LOGBOOK_OPEN_EVENT } from "@/components/career-track";
import { PeriodLabel } from "@/components/period-label";
import { UiIcon } from "@/components/ui-icon";
import { toPeriod } from "@/lib/period";
import { cn, initials } from "@/lib/utils";

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

function EntryLogo({ entry }: { entry: TimelineEntry }) {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-card">
      {entry.logoUrl ? (
        <Image
          src={entry.logoUrl}
          alt=""
          fill
          sizes="2.75rem"
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true" className="chart-label text-muted-foreground">
          {initials(entry.subtitle)}
        </span>
      )}
    </span>
  );
}

function EntrySummary({ entry }: { entry: TimelineEntry }) {
  const period = toPeriod(entry.startDate, entry.endDate);
  const roleMeta = [entry.subtitle, entry.employmentType].filter(Boolean).join(" · ");

  return (
    <>
      <EntryLogo entry={entry} />
      <span className="hidden md:block">
        <PeriodLabel as="span" period={period} className="block" />
        {entry.locationType && (
          <span className="chart-label mt-1 block text-muted-foreground">
            {entry.locationType}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-base leading-snug font-semibold text-balance sm:text-lg">
          {entry.title}
        </span>
        {roleMeta && (
          <span className="text-sm leading-6 font-medium text-primary">{roleMeta}</span>
        )}
        <span className="flex flex-wrap gap-x-3 md:hidden">
          <PeriodLabel as="span" period={period} />
          {entry.locationType && (
            <span className="chart-label text-muted-foreground">{entry.locationType}</span>
          )}
        </span>
      </span>
    </>
  );
}

const BULLET_PATTERN = /^[-•*]\s+/;
const MULTI_COLUMN_MIN_LENGTH = 280;

function EntryDescription({ text }: { text: string }) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const bulleted = lines.length > 1 && lines.every((line) => BULLET_PATTERN.test(line));

  if (bulleted) {
    return (
      <ul className="flex w-full flex-col gap-2 text-justify text-sm leading-7 text-muted-foreground hyphens-auto sm:text-base">
        {lines.map((line, index) => (
          <li
            key={`${index}-${line}`}
            className="relative pl-5 before:absolute before:top-2.5 before:left-0 before:size-2 before:bg-primary before:[clip-path:polygon(50%_0,100%_100%,0_100%)] before:content-['']"
          >
            {line.replace(BULLET_PATTERN, "")}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p
      className={cn(
        "max-w-[68ch] text-justify text-sm leading-7 whitespace-pre-line text-muted-foreground hyphens-auto sm:text-base",
        text.length >= MULTI_COLUMN_MIN_LENGTH &&
          "@3xl:max-w-none @3xl:columns-2 @3xl:gap-x-12",
      )}
    >
      {text}
    </p>
  );
}

const rowGrid =
  "grid w-full grid-cols-[2.75rem_minmax(0,1fr)_auto] items-start gap-x-3 py-4 text-left sm:gap-x-4 md:grid-cols-[2.75rem_10rem_minmax(0,1fr)_auto] md:gap-x-6 md:py-5";

function LogEntry({
  entry,
  entryId,
  defaultOpen,
}: {
  entry: TimelineEntry;
  entryId: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `${entryId}-details`;
  const hasDescription = entry.description.trim().length > 0;

  useEffect(() => {
    const handleOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail === entryId) setOpen(true);
    };

    window.addEventListener(LOGBOOK_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(LOGBOOK_OPEN_EVENT, handleOpen);
  }, [entryId]);

  if (!hasDescription) {
    return (
      <li id={entryId} className="border-b border-border">
        <h3 className={rowGrid}>
          <EntrySummary entry={entry} />
          <span className="size-5" />
        </h3>
      </li>
    );
  }

  return (
    <li id={entryId} className="border-b border-border">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            rowGrid,
            "group rounded-sm outline-offset-2 focus-visible:outline-2",
          )}
        >
          <EntrySummary entry={entry} />
          <span className="flex size-11 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors duration-150 group-hover:border-border group-hover:text-primary pointer-fine:size-8">
            <UiIcon
              icon={ArrowDown01Icon}
              className={cn(
                "size-4 transition-transform duration-300 ease-out motion-reduce:transition-none",
                open && "rotate-180",
              )}
            />
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        inert={!open}
        className={cn("log-panel grid", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className="overflow-hidden">
          <div className="@container pb-5 md:pb-6 md:pl-[calc(2.75rem+10rem+3rem)] md:pr-14">
            <EntryDescription text={entry.description} />
          </div>
        </div>
      </div>
    </li>
  );
}

export function Timeline({
  entries,
  idPrefix,
}: {
  entries: TimelineEntry[];
  idPrefix: string;
}) {
  return (
    <ol className="flex flex-col border-t border-border">
      {entries.map((entry, index) => (
        <LogEntry
          key={entry.id}
          entry={entry}
          entryId={`${idPrefix}-${entry.id}`}
          defaultOpen={index === 0}
        />
      ))}
    </ol>
  );
}
