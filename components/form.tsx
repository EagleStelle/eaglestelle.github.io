import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Label className="flex flex-col items-start gap-2">
      <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </Label>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <Input {...props} className={cn("w-full", className)} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <Textarea {...props} className={cn("min-h-28 w-full", className)} />;
}

export function PrimaryButton({ className, ...props }: ComponentProps<"button">) {
  return <Button {...props} className={cn("rounded-full px-5", className)} />;
}

export function DangerButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <Button
      {...props}
      variant="outline"
      className={cn(
        "rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
        className,
      )}
    />
  );
}
