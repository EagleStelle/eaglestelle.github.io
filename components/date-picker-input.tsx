"use client";

import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  defaultValue?: string | null;
};

function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;

  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

export function DatePickerInput({ name, defaultValue }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    parseDate(defaultValue),
  );
  const value = date ? format(date, "yyyy-MM-dd") : "";

  return (
    <div className="flex w-full items-center gap-2">
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-8 w-full justify-between rounded-lg px-2.5 font-normal"
            aria-label="Choose date"
          >
            <span className={cn(!date && "sr-only")}>
              {date ? format(date, "MMM d, yyyy") : "No date selected"}
            </span>
            <HugeiconsIcon
              aria-hidden="true"
              icon={Calendar01Icon}
              className="size-4"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selected) => {
              setDate(selected);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {date && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => setDate(undefined)}
        >
          <HugeiconsIcon
            aria-hidden="true"
            icon={Delete02Icon}
            className="size-4"
          />
          <span className="sr-only">Clear date</span>
        </Button>
      )}
    </div>
  );
}
