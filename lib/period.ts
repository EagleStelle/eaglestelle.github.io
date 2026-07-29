import { format, isValid, parseISO } from "date-fns";

export const PRESENT_LABEL = "Present";

const ISO_MONTH_VALUE = /^(\d{4})-(\d{2})(?:-\d{2}(?:.*)?)?$/;

export type Period = {
  start: string | null;
  end: string;
  isPresent: boolean;
  label: string;
};

export function normalizeMonthValue(
  value: string | null | undefined,
): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (trimmed === "") return null;

  const match = ISO_MONTH_VALUE.exec(trimmed);
  if (!match) return null;

  const month = Number(match[2]);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;

  return `${match[1]}-${match[2]}`;
}

export function formatDateLabel(
  value: string | Date | null | undefined,
): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isValid(value) ? format(value, "MMM yyyy") : null;
  }

  const trimmed = value.trim();
  if (trimmed === "") return null;

  const monthValue = normalizeMonthValue(trimmed);
  if (monthValue) {
    const parsedMonth = parseISO(`${monthValue}-01`);
    return isValid(parsedMonth) ? format(parsedMonth, "MMM yyyy") : null;
  }

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
    label: start ? `${start} - ${resolvedEnd}` : resolvedEnd,
  };
}
