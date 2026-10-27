"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { prefersReducedMotion } from "@/lib/use-media";

type UpdateOptions = { animate?: boolean };

type ProjectFilterValue = {
  techs: string[];
  toggleTech: (tech: string) => void;
  clearTechs: () => void;
  selectOnly: (tech: string, options?: UpdateOptions) => void;
};

const ProjectFilterContext = createContext<ProjectFilterValue>({
  techs: [],
  toggleTech: () => {},
  clearTechs: () => {},
  selectOnly: () => {},
});

export function ProjectFilterProvider({ children }: { children: ReactNode }) {
  const [techs, setTechs] = useState<string[]>([]);

  const update = useCallback(
    (next: (current: string[]) => string[], options?: UpdateOptions) => {
      const animate = options?.animate ?? true;

      if (!animate || prefersReducedMotion() || !("startViewTransition" in document)) {
        setTechs(next);
        return;
      }

      document.startViewTransition(() => {
        flushSync(() => setTechs(next));
      });
    },
    [],
  );

  const toggleTech = useCallback(
    (tech: string) =>
      update((current) =>
        current.includes(tech)
          ? current.filter((item) => item !== tech)
          : [...current, tech],
      ),
    [update],
  );

  const clearTechs = useCallback(() => update(() => []), [update]);

  const selectOnly = useCallback(
    (tech: string, options?: UpdateOptions) => update(() => [tech], options),
    [update],
  );

  const value = useMemo(
    () => ({ techs, toggleTech, clearTechs, selectOnly }),
    [techs, toggleTech, clearTechs, selectOnly],
  );

  return (
    <ProjectFilterContext.Provider value={value}>
      {children}
    </ProjectFilterContext.Provider>
  );
}

export function useProjectFilter() {
  return useContext(ProjectFilterContext);
}
