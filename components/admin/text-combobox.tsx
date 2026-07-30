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
  emptyPlaceholder?: string;
  required?: boolean;
  className?: string;
};

function normalizeValue(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized === "" ? null : normalized;
}

function uniqueOptions(options: string[], defaultValue: string | null) {
  const values = new Set(
    options
      .map(normalizeValue)
      .filter((value): value is string => value !== null),
  );

  if (defaultValue) {
    values.add(defaultValue);
  }

  return [...values];
}

export function TextCombobox({
  name,
  options,
  defaultValue,
  placeholder,
  emptyMessage,
  emptyPlaceholder,
  required = false,
  className,
}: Props) {
  const normalizedDefaultValue = normalizeValue(defaultValue);
  const items = React.useMemo(
    () => uniqueOptions(options, normalizedDefaultValue),
    [options, normalizedDefaultValue],
  );
  const [valueState, setValueState] = React.useState(() => ({
    defaultValue: normalizedDefaultValue,
    value: normalizedDefaultValue,
  }));
  const inputRef = React.useRef<HTMLInputElement>(null);
  const value =
    valueState.defaultValue === normalizedDefaultValue
      ? valueState.value
      : normalizedDefaultValue;

  const setComboboxValue = React.useCallback(
    (nextValue: string | null) => {
      setValueState({
        defaultValue: normalizedDefaultValue,
        value: normalizeValue(nextValue),
      });
    },
    [normalizedDefaultValue],
  );

  React.useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return undefined;

    function handleReset() {
      setComboboxValue(normalizedDefaultValue);
    }

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [normalizedDefaultValue, setComboboxValue]);

  return (
    <Combobox<string>
      name={name}
      items={items}
      value={value}
      onValueChange={setComboboxValue}
      required={required}
      autoHighlight
    >
      <ComboboxInput
        ref={inputRef}
        className={cn("w-full", className)}
        placeholder={
          items.length > 0 ? placeholder : (emptyPlaceholder ?? placeholder)
        }
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
