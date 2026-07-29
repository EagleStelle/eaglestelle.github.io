import { ActionForm } from "@/components/admin/action-form";
import {
  CategorizedSkills,
  type SkillGroup,
} from "@/components/admin/categorized-skills";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { SkillCategoryCombobox } from "@/components/admin/skill-category-combobox";
import { Field, PrimaryButton, TextInput } from "@/components/form";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import {
  createSkill,
  createSkillCategory,
  deleteSkillCategory,
  updateSkillCategory,
} from "@/app/admin/actions";

function uniqueCategoryNames(categories: Array<string | null>) {
  const names = categories
    .map((category) => category?.trim() ?? "")
    .filter((category) => category.length > 0);

  return [...new Set(names)];
}

export default async function AdminSkillsPage() {
  const [skills, skillCategories] = await Promise.all([
    prisma.skill.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
    prisma.skillCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
  ]);

  const savedCategoryNames = skillCategories.map((category) => category.name);
  const categoryOptions = [
    ...savedCategoryNames,
    ...uniqueCategoryNames(skills.map((skill) => skill.category)).filter(
      (category) => !savedCategoryNames.includes(category),
    ),
  ];

  // Group skills by category
  const skillGroups: SkillGroup[] = [];
  const handledCategories = new Set<string>();

  // 1. Categories registered in SkillCategory (ordered by category.order)
  for (const cat of skillCategories) {
    handledCategories.add(cat.name);
    skillGroups.push({
      categoryName: cat.name,
      isUncategorized: false,
      skills: skills.filter((s) => s.category?.trim() === cat.name),
    });
  }

  // 2. Extra categories present in skill.category but not in skillCategories
  const extraCategories = uniqueCategoryNames(
    skills.map((s) => s.category),
  ).filter((cat) => !handledCategories.has(cat));

  for (const catName of extraCategories) {
    skillGroups.push({
      categoryName: catName,
      isUncategorized: false,
      skills: skills.filter((s) => s.category?.trim() === catName),
    });
  }

  // 3. Uncategorized skills (skills without a set category)
  const uncategorizedSkills = skills.filter(
    (s) => !s.category || s.category.trim() === "",
  );
  if (uncategorizedSkills.length > 0) {
    skillGroups.push({
      categoryName: "Uncategorized",
      isUncategorized: true,
      skills: uncategorizedSkills,
    });
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Skill Categories Management */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Skill Categories ({skillCategories.length})
          </span>
          <Separator />
        </div>

        <ActionForm
          action={createSkillCategory}
          success="Category added."
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-56 flex-1">
            <Field label="Category Name">
              <TextInput name="name" required />
            </Field>
          </div>
          <PrimaryButton type="submit">Add Category</PrimaryButton>
        </ActionForm>

        <ReorderableList
          entityType="skillCategory"
          items={skillCategories.map((category) => ({
            id: category.id,
            order: category.order,
            content: (
              <div className="flex flex-wrap items-center gap-3">
                <ActionForm
                  action={updateSkillCategory}
                  success="Category saved."
                  className="flex flex-1 flex-wrap items-center gap-3"
                >
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="order" value={category.order} />
                  <div className="min-w-44 flex-1">
                    <TextInput
                      name="name"
                      defaultValue={category.name}
                      required
                    />
                  </div>
                  <PrimaryButton type="submit">Save</PrimaryButton>
                </ActionForm>

                <DeleteDialog
                  id={category.id}
                  action={deleteSkillCategory}
                  trigger="Delete"
                  title={`Delete "${category.name}"?`}
                  description="This removes the category from saved categories and clears it from skills using it."
                />
              </div>
            ),
          }))}
        />
      </div>

      {/* Add New Skill Section */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Add New Skill
          </span>
          <Separator />
        </div>

        <ActionForm
          action={createSkill}
          success="Skill added."
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Skill Name">
              <TextInput name="name" required />
            </Field>
            <Field label="Category">
              <SkillCategoryCombobox
                name="category"
                categories={categoryOptions}
              />
            </Field>
          </div>
          <div>
            <PrimaryButton type="submit">Add Skill</PrimaryButton>
          </div>
        </ActionForm>
      </div>

      {/* Skills Grouped by Category Section */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Skills List ({skills.length})
          </span>
          <Separator />
        </div>

        <CategorizedSkills
          groups={skillGroups}
          categoryOptions={categoryOptions}
        />
      </div>
    </div>
  );
}
