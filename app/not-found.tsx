import type { Metadata } from "next";
import Link from "next/link";
import { WaypointGlyph } from "@/components/waypoint-glyph";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="chart-ground flex flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-8 lg:px-12"
    >
      <WaypointGlyph state="ahead" className="size-8" />
      <h1 className="type-wide max-w-[18ch] text-display font-bold text-balance uppercase">
        Page not found
      </h1>
      <p className="max-w-[55ch] text-base leading-7 text-muted-foreground">
        This address doesn&apos;t lead anywhere on the portfolio. It may have moved, or the
        link may be mistyped.
      </p>
      <Button asChild size="text-only">
        <Link href="/">Back to the portfolio</Link>
      </Button>
    </main>
  );
}
