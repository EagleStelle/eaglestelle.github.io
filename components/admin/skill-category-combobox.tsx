"use client";

import { TextCombobox } from "@/components/admin/text-combobox";

type Props = {
  name: string;
  categories: string[];
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function SkillCategoryCombobox({
  name,
  categories,
  defaultValue,
  placeholder = "Select category",
  required = false,
  className,
}: Props) {
  return (
    <TextCombobox
      name={name}
      options={categories}
      defaultValue={defaultValue}
      placeholder={placeholder}
      emptyPlaceholder="No categories"
      emptyMessage="No categories found."
      required={required}
      className={className}
    />
  );
}
