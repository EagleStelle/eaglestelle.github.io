"use client";

import type { ComponentProps, ReactNode } from "react";
import { toast } from "sonner";

type Props = Omit<ComponentProps<"form">, "action"> & {
  action: (formData: FormData) => Promise<void>;
  success: string;
  children: ReactNode;
};

export function ActionForm({ action, success, children, ...props }: Props) {
  return (
    <form
      {...props}
      action={async (formData) => {
        try {
          await action(formData);
          toast.success(success);
        } catch (cause) {
          toast.error(
            cause instanceof Error ? cause.message : "Something went wrong.",
          );
        }
      }}
    >
      {children}
    </form>
  );
}
