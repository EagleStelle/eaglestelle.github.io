import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { SkillCategoryCombobox } from "@/components/admin/skill-category-combobox";
import { Field, PrimaryButton, TextInput } from "@/components/form";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import {
  createSkill,
  createSkillCategory,
  deleteSkill,
  deleteSkillCategory,
  updateSkill,
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

  return (
    <div className="flex flex-col gap-10">
      {/* Skill Categories Section */}
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

      {/* Skills Section */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Skills List ({skills.length})
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

        <ReorderableList
          entityType="skill"
          items={skills.map((skill) => ({
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
                    <TextInput name="name" defaultValue={skill.name} required />
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
      </div>
    </div>
  );
}
