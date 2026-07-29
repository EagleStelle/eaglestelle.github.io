import { Input } from "@/components/ui/input";
import { normalizeMonthValue } from "@/lib/period";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  defaultValue?: string | null;
  className?: string;
};

export function MonthInput({ name, defaultValue, className }: Props) {
  return (
    <Input
      type="month"
      name={name}
      defaultValue={normalizeMonthValue(defaultValue) ?? ""}
      pattern="[0-9]{4}-[0-9]{2}"
      placeholder="YYYY-MM"
      className={cn("w-full", className)}
    />
  );
}
