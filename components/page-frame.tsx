import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const frameInset = "mx-auto w-full max-w-[100rem] px-4 sm:px-8 lg:px-12";

export function PageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(frameInset, "py-4", className)}>{children}</div>;
}
