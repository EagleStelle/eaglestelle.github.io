import { cn } from "@/lib/utils";

export type WaypointState = "ahead" | "passed" | "active" | "mark";

export function WaypointGlyph({
  state = "active",
  className,
}: {
  state?: WaypointState;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 22 22"
      aria-hidden="true"
      focusable="false"
      className={cn("size-5.5 shrink-0 overflow-visible", className)}
    >
      {state === "active" && (
        <circle
          cx="11"
          cy="12.5"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary"
        />
      )}
      <path
        d="M11 5.5 17 16.5H5Z"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className={cn(
          state === "ahead" && "fill-background stroke-muted-foreground",
          state === "passed" && "fill-primary/55 stroke-primary/55",
          (state === "active" || state === "mark") && "fill-primary stroke-primary",
        )}
      />
    </svg>
  );
}
