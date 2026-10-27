import { normalizeMonthValue } from "@/lib/period";

export type CareerKind = "experience" | "education";

export type CareerItem = {
  entryId: string;
  kind: CareerKind;
  title: string;
  subtitle: string;
  startDate: string | null;
  endDate: string | null;
};

export type CareerBar = CareerItem & {
  lane: number;
  left: number;
  width: number;
  present: boolean;
};

export type CareerGroup = {
  kind: CareerKind;
  laneCount: number;
  bars: CareerBar[];
};

export type CareerTrackLayout = {
  groups: CareerGroup[];
  years: { year: number; left: number }[];
  now: number;
};

function monthIndex(value: string | null): number | null {
  const month = normalizeMonthValue(value);
  if (!month) return null;

  const [year, monthNumber] = month.split("-").map(Number);
  return year * 12 + (monthNumber - 1);
}

export function buildCareerTrack(
  items: CareerItem[],
  today = new Date(),
): CareerTrackLayout | null {
  const nowIndex = today.getUTCFullYear() * 12 + today.getUTCMonth();

  const spans = items.flatMap((item) => {
    const start = monthIndex(item.startDate);
    if (start === null) return [];

    const present = !item.endDate;
    const parsedEnd = present ? nowIndex : monthIndex(item.endDate);
    const end = Math.max(parsedEnd ?? start, start) + 1;

    return [{ item, start, end, present }];
  });

  if (spans.length < 2) return null;

  const firstYear = Math.floor(Math.min(...spans.map((span) => span.start)) / 12);
  const lastYear = Math.ceil(
    Math.max(nowIndex + 1, ...spans.map((span) => span.end)) / 12,
  );
  const rangeStart = firstYear * 12;
  const total = lastYear * 12 - rangeStart;
  const percent = (value: number) => ((value - rangeStart) / total) * 100;

  const groups = (["experience", "education"] as const).flatMap((kind) => {
    const laneEnds: number[] = [];
    const bars = spans
      .filter((span) => span.item.kind === kind)
      .sort((left, right) => left.start - right.start || right.end - left.end)
      .map((span) => {
        let lane = laneEnds.findIndex((laneEnd) => laneEnd <= span.start);
        if (lane === -1) {
          lane = laneEnds.length;
          laneEnds.push(span.end);
        } else {
          laneEnds[lane] = span.end;
        }

        return {
          ...span.item,
          lane,
          left: percent(span.start),
          width: percent(span.end) - percent(span.start),
          present: span.present,
        };
      });

    return bars.length > 0 ? [{ kind, laneCount: laneEnds.length, bars }] : [];
  });

  const years = Array.from({ length: lastYear - firstYear }, (_, index) => {
    const year = firstYear + index;
    return { year, left: percent(year * 12) };
  });

  return { groups, years, now: percent(nowIndex + today.getUTCDate() / 31) };
}
