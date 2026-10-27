import { cn } from "@/lib/utils";

export type WaypointState = "ahead" | "passed" | "active" | "mark";

const STAR = "M11 3 13 9 19 11 13 13 11 19 9 13 3 11 9 9Z";

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
          cy="11"
          r="10"
          strokeWidth="1"
          className="fill-background stroke-primary"
        />
      )}
      {state === "passed" && <path d={STAR} className="fill-background" />}
      <path
        d={STAR}
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
