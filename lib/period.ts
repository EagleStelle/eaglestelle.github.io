import { format, isValid, parseISO } from "date-fns";

export const PRESENT_LABEL = "Present";

export type Period = {
  start: string | null;
  end: string;
  isPresent: boolean;
  label: string;
};

export function formatDateLabel(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (trimmed === "") return null;

  const parsed = parseISO(trimmed);
  return isValid(parsed) ? format(parsed, "MMM yyyy") : trimmed;
}

export function toPeriod(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): Period | null {
  const start = formatDateLabel(startDate);
  const end = formatDateLabel(endDate);

  if (!start && !end) return null;

  const isPresent = !end;
  const resolvedEnd = end ?? PRESENT_LABEL;

  return {
    start,
    end: resolvedEnd,
    isPresent,
    label: start ? `${start} — ${resolvedEnd}` : resolvedEnd,
  };
}
