import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const frameInset = "px-6 py-4 sm:px-8 lg:px-12 xl:px-16";

export function PageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("w-full", frameInset, className)}>{children}</div>;
}
