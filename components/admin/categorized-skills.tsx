"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  Search01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { SkillCategoryCombobox } from "@/components/admin/skill-category-combobox";
import { PrimaryButton, TextInput } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { updateSkill, deleteSkill } from "@/app/admin/actions";

export type SkillItem = {
  id: number;
  name: string;
  category: string | null;
  order: number;
};

export type SkillGroup = {
  categoryName: string;
  isUncategorized: boolean;
  skills: SkillItem[];
};

type Props = {
  groups: SkillGroup[];
  categoryOptions: string[];
};

export function CategorizedSkills({ groups, categoryOptions }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalSkillsCount = groups.reduce((acc, g) => acc + g.skills.length, 0);

  const filteredGroups = groups
    .map((group) => {
      // Filter by category tab
      if (
        selectedCategory !== "all" &&
        group.categoryName !== selectedCategory
      ) {
        return null;
      }

      // Filter by search query
      if (!searchQuery.trim()) {
        return group;
      }

      const query = searchQuery.toLowerCase().trim();
      const categoryMatches = group.categoryName.toLowerCase().includes(query);

      const matchingSkills = group.skills.filter((skill) =>
        skill.name.toLowerCase().includes(query),
      );

      if (categoryMatches) {
        return group;
      }

      if (matchingSkills.length > 0) {
        return {
          ...group,
          skills: matchingSkills,
        };
      }

      return null;
    })
    .filter((g): g is SkillGroup => g !== null);

  return (
    <div className="flex flex-col gap-6">
      {/* Category Pills & Search Bar Toolbar */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Categories
            <span
              className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                selectedCategory === "all"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background/80 text-muted-foreground"
              }`}
            >
              {totalSkillsCount}
            </span>
          </button>

          {groups.map((group) => {
            const isSelected = selectedCategory === group.categoryName;
            return (
              <button
                key={group.categoryName}
                type="button"
                onClick={() => setSelectedCategory(group.categoryName)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {group.categoryName}
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background/80 text-muted-foreground"
                  }`}
                >
                  {group.skills.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8.5 w-full rounded-full border border-border/80 bg-background/50 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-ring focus:outline-hidden focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Category Groups Stack */}
      {filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No matching skills or categories found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.categoryName}
              className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/40 p-5 backdrop-blur-xs transition-all hover:border-border"
            >
              {/* Category Group Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HugeiconsIcon
                      icon={group.isUncategorized ? Tag01Icon : Folder01Icon}
                      className="size-4"
                    />
                  </div>
                  <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">
                    {group.categoryName}
                  </h3>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {group.skills.length}{" "}
                    {group.skills.length === 1 ? "skill" : "skills"}
                  </Badge>
                </div>
              </div>

              {/* Category Skills List */}
              {group.skills.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 py-6 text-center text-xs text-muted-foreground/70">
                  No skills in this category yet.
                </div>
              ) : (
                <ReorderableList
                  entityType="skill"
                  items={group.skills.map((skill) => ({
                    id: skill.id,
                    order: skill.order,
                    content: (
                      <div className="flex flex-wrap items-center gap-3">
                        <ActionForm
                          action={updateSkill}
                          success="Skill saved."
                          className="flex flex-1 flex-wrap items-center gap-3"
                        >
                          <input type="hidden" name="id" value={skill.id} />
                          <input type="hidden" name="order" value={skill.order} />
                          <div className="min-w-36 flex-1">
                            <TextInput
                              name="name"
                              defaultValue={skill.name}
                              required
                            />
                          </div>
                          <div className="min-w-44 flex-1">
                            <SkillCategoryCombobox
                              name="category"
                              categories={categoryOptions}
                              defaultValue={skill.category}
                            />
                          </div>
                          <PrimaryButton type="submit">Save</PrimaryButton>
                        </ActionForm>

                        <DeleteDialog
                          id={skill.id}
                          action={deleteSkill}
                          trigger="Delete"
                          title={`Delete "${skill.name}"?`}
                          description="This removes the skill from your public page. It cannot be undone."
                        />
                      </div>
                    ),
                  }))}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
