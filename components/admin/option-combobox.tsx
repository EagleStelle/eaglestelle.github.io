"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  options: string[];
  defaultValue?: string | null;
  placeholder: string;
  emptyMessage: string;
  required?: boolean;
  className?: string;
};

function uniqueOptions(options: string[], defaultValue?: string | null) {
  const values = new Set(options.map((option) => option.trim()).filter(Boolean));

  if (defaultValue?.trim()) {
    values.add(defaultValue.trim());
  }

  return [...values];
}

export function OptionCombobox({
  name,
  options,
  defaultValue,
  placeholder,
  emptyMessage,
  required = false,
  className,
}: Props) {
  const items = React.useMemo(
    () => uniqueOptions(options, defaultValue),
    [options, defaultValue],
  );

  return (
    <Combobox
      name={name}
      items={items}
      defaultValue={defaultValue?.trim() || null}
      required={required}
      autoHighlight
    >
      <ComboboxInput
        className={cn("w-full", className)}
        placeholder={placeholder}
        showClear
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
