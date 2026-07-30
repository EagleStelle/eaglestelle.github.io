"use client";

import { TextCombobox } from "@/components/admin/text-combobox";

type Props = {
  name: string;
  options: string[];
  defaultValue?: string | null;
  placeholder: string;
  emptyMessage: string;
  required?: boolean;
  className?: string;
};

export function OptionCombobox({
  name,
  options,
  defaultValue,
  placeholder,
  emptyMessage,
  required = false,
  className,
}: Props) {
  return (
    <TextCombobox
      name={name}
      options={options}
      defaultValue={defaultValue}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      required={required}
      className={className}
    />
  );
}
