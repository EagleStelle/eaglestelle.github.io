import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Field as ShadcnField,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <ShadcnField>
      <FieldLabel asChild>
        <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
        </span>
      </FieldLabel>
      {children}
    </ShadcnField>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <Input {...props} className={cn("w-full", className)} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <Textarea {...props} className={cn("min-h-28 w-full", className)} />;
}

export function PrimaryButton({
  size = "text-only",
  ...props
}: ComponentProps<typeof Button>) {
  return <Button {...props} size={size} />;
}

export function DangerButton({
  variant = "destructive",
  size = "text-only",
  ...props
}: ComponentProps<typeof Button>) {
  return <Button {...props} variant={variant} size={size} />;
}
