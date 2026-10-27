"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { navigateToSection } from "@/components/nav-links";
import { WaypointGlyph, type WaypointState } from "@/components/waypoint-glyph";
import { cn } from "@/lib/utils";

export type Waypoint = {
  id: string;
  name: string;
  count?: number;
};

type ProgressAxis = "x" | "y";

type RouteContextValue = {
  waypoints: Waypoint[];
  activeId: string | null;
  progressRef: (axis: ProgressAxis) => (element: HTMLElement | null) => () => void;
};

const RouteContext = createContext<RouteContextValue>({
  waypoints: [],
  activeId: null,
  progressRef: () => () => () => {},
});

function applyProgress(element: HTMLElement, axis: ProgressAxis, progress: number) {
  element.style.transform =
    axis === "x" ? `scaleX(${progress})` : `scaleY(${progress})`;
}

export function RouteProvider({
  waypoints,
  children,
}: {
  waypoints: Waypoint[];
  children: ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const progress = useRef(0);
  const targets = useRef(new Set<{ element: HTMLElement; axis: ProgressAxis }>());

  const progressRef = useCallback(
    (axis: ProgressAxis) => (element: HTMLElement | null) => {
      if (!element) return () => {};

      const target = { element, axis };
      targets.current.add(target);
      applyProgress(element, axis, progress.current);

      return () => {
        targets.current.delete(target);
      };
    },
    [],
  );

  useEffect(() => {
    const sections = waypoints
      .map((waypoint) => document.getElementById(waypoint.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (sections.length === 0) return;

    let frame = 0;
    let offsets: number[] = [];
    let documentHeight = 0;
    let viewportHeight = 0;

    const cacheLayout = () => {
      offsets = sections.map(
        (section) => section.getBoundingClientRect().top + window.scrollY,
      );
      documentHeight = document.documentElement.scrollHeight;
      viewportHeight = window.innerHeight;
    };

    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      const marker = scrollY + viewportHeight * 0.35;
      const atBottom = scrollY + viewportHeight >= documentHeight - 4;

      let index = -1;
      offsets.forEach((offset, sectionIndex) => {
        if (offset <= marker) index = sectionIndex;
      });
      if (atBottom) index = sections.length - 1;

      let fraction = 0;
      const start = offsets[index];
      const end = offsets[index + 1];
      if (start !== undefined && end !== undefined && !atBottom) {
        fraction = Math.min(Math.max((marker - start) / (end - start), 0), 1);
      }

      const last = sections.length - 1;
      const value =
        index < 0 ? 0 : last === 0 ? 1 : Math.min((index + fraction) / last, 1);

      progress.current = value;
      targets.current.forEach((target) =>
        applyProgress(target.element, target.axis, value),
      );
      setActiveId(index < 0 ? null : (sections[index]?.id ?? null));
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const relayout = () => {
      cacheLayout();
      schedule();
    };

    const observer = new ResizeObserver(relayout);
    sections.forEach((section) => observer.observe(section));
    observer.observe(document.body);

    cacheLayout();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", relayout);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", relayout);
    };
  }, [waypoints]);

  const value = useMemo(
    () => ({ waypoints, activeId, progressRef }),
    [waypoints, activeId, progressRef],
  );

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export function RouteRail({ className }: { className?: string }) {
  const { waypoints, activeId, progressRef } = useContext(RouteContext);
  const railProgressRef = useMemo(() => progressRef("y"), [progressRef]);
  const activeIndex = waypoints.findIndex((waypoint) => waypoint.id === activeId);

  return (
    <nav aria-label="Sections" className={className}>
      <ol className="relative flex flex-col">
        <span
          aria-hidden="true"
          className="star-rail absolute top-6 bottom-6 left-1.75 w-2"
        />
        <span
          aria-hidden="true"
          ref={railProgressRef}
          className="star-rail-lit absolute top-6 bottom-6 left-1.75 w-2 origin-top transform-[scaleY(0)]"
        />

        {waypoints.map((waypoint, index) => {
          const state: WaypointState =
            index === activeIndex ? "active" : index < activeIndex ? "passed" : "ahead";

          return (
            <li key={waypoint.id} className="relative">
              <a
                href={`#${waypoint.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  navigateToSection(waypoint.id);
                }}
                aria-current={state === "active" ? "location" : undefined}
                className="group flex min-h-12 items-center gap-3 rounded-sm pr-2 outline-offset-2 focus-visible:outline-2"
              >
                <WaypointGlyph state={state} />
                <span
                  className={cn(
                    "chart-label transition-colors duration-200",
                    state === "active"
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {waypoint.name}
                </span>
                {waypoint.count !== undefined && (
                  <span className="chart-label ml-auto text-muted-foreground">
                    {String(waypoint.count).padStart(2, "0")}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function RouteStatus({ className }: { className?: string }) {
  const { waypoints, activeId } = useContext(RouteContext);
  const active = waypoints.find((waypoint) => waypoint.id === activeId);

  return (
    <span
      aria-hidden="true"
      className={cn("chart-label flex min-w-0 items-center gap-2 text-primary", className)}
    >
      {active && (
        <>
          <WaypointGlyph className="size-4" />
          <span className="truncate">{active.name}</span>
        </>
      )}
    </span>
  );
}

export function RouteProgressBar({ className }: { className?: string }) {
  const { progressRef } = useContext(RouteContext);
  const barProgressRef = useMemo(() => progressRef("x"), [progressRef]);

  return (
    <span
      aria-hidden="true"
      ref={barProgressRef}
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary transform-[scaleX(0)]",
        className,
      )}
    />
  );
}
