"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WaypointGlyph } from "@/components/waypoint-glyph";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      tabIndex={-1}
      className="chart-ground flex flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-8 lg:px-12"
    >
      <WaypointGlyph state="ahead" className="size-8" />
      <h1 className="type-wide max-w-[18ch] text-display font-bold text-balance uppercase">
        This page didn&apos;t load
      </h1>
      <p className="max-w-[55ch] text-base leading-7 text-muted-foreground">
        Something failed while loading the portfolio. Try again, or come back in a few
        minutes.
      </p>
      <Button size="text-only" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
