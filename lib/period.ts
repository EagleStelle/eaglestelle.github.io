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
  value: string | Date | null | undefined,
): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    if (!isValid(value)) return null;

    return `${value.getUTCFullYear()}-${String(
      value.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
  }

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

  const monthValue = normalizeMonthValue(value);
  if (monthValue) {
    const parsedMonth = parseISO(`${monthValue}-01`);
    return isValid(parsedMonth) ? format(parsedMonth, "MMM yyyy") : null;
  }

  if (value instanceof Date) return null;

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
    label: start ? `${start} - ${resolvedEnd}` : resolvedEnd,
  };
}
