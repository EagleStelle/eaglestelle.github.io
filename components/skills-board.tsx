"use client";

import { navigateToSection } from "@/components/nav-links";
import { useProjectFilter } from "@/components/project-filter";
import { techKey } from "@/lib/tech";
import { plural } from "@/lib/utils";

export type SkillGroup = {
  category: string;
  skills: { id: number; name: string }[];
};

export function SkillsBoard({
  groups,
  techCounts,
}: {
  groups: SkillGroup[];
  techCounts: Record<string, number>;
}) {
  const { selectOnly } = useProjectFilter();

  function showProjects(name: string) {
    selectOnly(techKey(name), { animate: false });
    navigateToSection("projects");
  }

  return (
    <div className="columns-1 gap-x-8 sm:columns-2 xl:columns-3 2xl:columns-4">
      {groups.map((group) => (
        <section key={group.category} className="mb-8 break-inside-avoid">
          <h3 className="chart-label mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2 text-muted-foreground">
            <span>{group.category}</span>
            <span>{String(group.skills.length).padStart(2, "0")}</span>
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {group.skills.map((skill) => {
              const count = techCounts[techKey(skill.name)] ?? 0;

              return (
                <li key={skill.id}>
                  {count > 0 ? (
                    <button
                      type="button"
                      onClick={() => showProjects(skill.name)}
                      aria-label={`${skill.name}: show ${plural(count, "project")}`}
                      className="group chip border-primary bg-card text-foreground transition-colors duration-150 outline-offset-2 hover:bg-primary hover:text-primary-foreground focus-visible:outline-2"
                    >
                      {skill.name}
                      <span className="text-xs font-semibold tabular-nums text-primary group-hover:text-primary-foreground">
                        {count}
                      </span>
                    </button>
                  ) : (
                    <span className="chip border-transparent bg-muted text-foreground/85">
                      {skill.name}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
