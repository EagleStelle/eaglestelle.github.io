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
  categories: string[];
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

function categoryOptions(categories: string[], defaultValue?: string | null) {
  const options = new Set(
    categories.map((category) => category.trim()).filter(Boolean),
  );

  if (defaultValue?.trim()) {
    options.add(defaultValue.trim());
  }

  return [...options];
}

export function SkillCategoryCombobox({
  name,
  categories,
  defaultValue,
  placeholder = "Select category",
  required = false,
  className,
}: Props) {
  const options = React.useMemo(
    () => categoryOptions(categories, defaultValue),
    [categories, defaultValue],
  );

  return (
    <Combobox
      name={name}
      items={options}
      defaultValue={defaultValue?.trim() || null}
      required={required}
      autoHighlight
    >
      <ComboboxInput
        className={cn("w-full", className)}
        placeholder={options.length > 0 ? placeholder : "No categories"}
        showClear
      />
      <ComboboxContent>
        <ComboboxEmpty>No categories found.</ComboboxEmpty>
        <ComboboxList>
          {(category: string) => (
            <ComboboxItem key={category} value={category}>
              {category}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
