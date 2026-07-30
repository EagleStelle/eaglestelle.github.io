"use client";

import { useEffect, useRef, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { normalizeMonthValue } from "@/lib/period";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const YEARS_PER_PAGE = 12;

type Props = {
  name: string;
  defaultValue?: string | Date | null;
  placeholder?: string;
  className?: string;
};

function toParts(value: string | null) {
  if (!value) return null;

  const [year, month] = value.split("-");
  return { year: Number(year), month: Number(month) };
}

function toLabel(value: string | null) {
  if (!value) return null;

  const parsed = parseISO(`${value}-01`);
  return isValid(parsed) ? format(parsed, "MMM yyyy") : null;
}

function toValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function MonthInput({
  name,
  defaultValue,
  placeholder = "Select month",
  className,
}: Props) {
  const today = new Date();
  const [value, setValue] = useState(() => normalizeMonthValue(defaultValue));
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"month" | "year">("month");
  const [year, setYear] = useState(
    () => toParts(normalizeMonthValue(defaultValue))?.year ?? today.getFullYear(),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = toParts(value);
  const label = toLabel(value);
  const pageStart = Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  const step = view === "month" ? 1 : YEARS_PER_PAGE;

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return undefined;

    function handleReset() {
      const normalized = normalizeMonthValue(defaultValue);
      setValue(normalized);
      setOpen(false);
      setView("month");
      setYear(toParts(normalized)?.year ?? new Date().getFullYear());
    }

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [defaultValue]);

  function handleOpenChange(next: boolean) {
    if (next) {
      setView("month");
      setYear(selected?.year ?? today.getFullYear());
    }

    setOpen(next);
  }

  function selectMonth(month: number) {
    setValue(toValue(year, month));
    setOpen(false);
  }

  return (
    <div className={cn("w-full", className)}>
      <input ref={inputRef} type="hidden" name={name} value={value ?? ""} />
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-8 w-full justify-between rounded-lg px-2.5 font-normal"
            aria-label={label ? `Month: ${label}` : placeholder}
          >
            <span className={cn("truncate", !label && "text-muted-foreground")}>
              {label ?? placeholder}
            </span>
            <HugeiconsIcon
              aria-hidden="true"
              icon={Calendar01Icon}
              className="size-4 text-muted-foreground"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60 gap-2 p-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setYear(year - step)}
              aria-label={view === "month" ? "Previous year" : "Previous years"}
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={ArrowLeft01Icon}
                className="size-4"
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setView(view === "month" ? "year" : "month")}
              className="flex-1 font-mono text-[11px] tracking-[0.18em] uppercase"
              aria-label={view === "month" ? "Choose year" : "Choose month"}
            >
              {view === "month"
                ? year
                : `${pageStart}-${pageStart + YEARS_PER_PAGE - 1}`}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setYear(year + step)}
              aria-label={view === "month" ? "Next year" : "Next years"}
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={ArrowRight01Icon}
                className="size-4"
              />
            </Button>
          </div>

          <Separator />

          {view === "month" ? (
            <div className="grid grid-cols-3 gap-1">
              {MONTH_LABELS.map((month, index) => {
                const monthNumber = index + 1;
                const isSelected =
                  selected?.year === year && selected?.month === monthNumber;
                const isCurrent =
                  year === today.getFullYear() &&
                  monthNumber === today.getMonth() + 1;

                return (
                  <Button
                    key={month}
                    type="button"
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    onClick={() => selectMonth(monthNumber)}
                    aria-pressed={isSelected}
                    className={cn(
                      "w-full font-normal",
                      !isSelected && isCurrent && "ring-1 ring-primary/40",
                    )}
                  >
                    {month}
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: YEARS_PER_PAGE }, (_, index) => {
                const pageYear = pageStart + index;
                const isSelected = selected?.year === pageYear;
                const isCurrent = pageYear === today.getFullYear();

                return (
                  <Button
                    key={pageYear}
                    type="button"
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setYear(pageYear);
                      setView("month");
                    }}
                    aria-pressed={isSelected}
                    className={cn(
                      "w-full font-normal",
                      !isSelected && isCurrent && "ring-1 ring-primary/40",
                    )}
                  >
                    {pageYear}
                  </Button>
                );
              })}
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setYear(today.getFullYear());
                setValue(toValue(today.getFullYear(), today.getMonth() + 1));
                setOpen(false);
              }}
              className="font-normal"
            >
              This month
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!value}
              onClick={() => {
                setValue(null);
                setOpen(false);
              }}
              className="font-normal text-muted-foreground"
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
