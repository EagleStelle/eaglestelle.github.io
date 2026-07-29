import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { SkillCategoryCombobox } from "@/components/admin/skill-category-combobox";
import { Field, PrimaryButton, TextInput } from "@/components/form";
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
      <h1 className="font-display text-4xl tracking-tight">Skills</h1>

      <div className="flex flex-col gap-6">
        <ActionForm
          action={createSkillCategory}
          success="Category added."
          className="flex flex-col gap-5"
        >
          <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Add a category
          </h2>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_6rem_auto] sm:items-end">
            <Field label="Name">
              <TextInput name="name" required />
            </Field>
            <Field label="Order">
              <TextInput type="number" name="order" defaultValue={0} />
            </Field>
            <PrimaryButton type="submit">Add category</PrimaryButton>
          </div>
        </ActionForm>

        <div className="flex flex-col gap-4">
          <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            {skillCategories.length} categories
          </h2>

          {skillCategories.map((category) => (
            <div
              key={category.id}
              className="flex flex-wrap items-end gap-4 border-t border-border pt-5"
            >
              <ActionForm
                action={updateSkillCategory}
                success="Category saved."
                className="flex flex-1 flex-wrap items-end gap-4"
              >
                <input type="hidden" name="id" value={category.id} />
                <div className="min-w-40 flex-1">
                  <Field label="Name">
                    <TextInput
                      name="name"
                      defaultValue={category.name}
                      required
                    />
                  </Field>
                </div>
                <div className="w-24">
                  <Field label="Order">
                    <TextInput
                      type="number"
                      name="order"
                      defaultValue={category.order}
                    />
                  </Field>
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
          ))}
        </div>
      </div>

      <ActionForm
        action={createSkill}
        success="Skill added."
        className="flex flex-col gap-5"
      >
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          Add a skill
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name">
            <TextInput name="name" required />
          </Field>
          <Field label="Category">
            <SkillCategoryCombobox
              name="category"
              categories={categoryOptions}
            />
          </Field>
          <Field label="Order">
            <TextInput type="number" name="order" defaultValue={0} />
          </Field>
        </div>
        <div>
          <PrimaryButton type="submit">Add skill</PrimaryButton>
        </div>
      </ActionForm>

      <div className="flex flex-col gap-4">
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          {skills.length} saved
        </h2>

        {skills.map((skill) => (
          <div
            key={skill.id}
            className="flex flex-wrap items-end gap-4 border-t border-border pt-5"
          >
            <ActionForm
              action={updateSkill}
              success="Skill saved."
              className="flex flex-1 flex-wrap items-end gap-4"
            >
              <input type="hidden" name="id" value={skill.id} />
              <div className="min-w-40 flex-1">
                <Field label="Name">
                  <TextInput name="name" defaultValue={skill.name} required />
                </Field>
              </div>
              <div className="min-w-40 flex-1">
                <Field label="Category">
                  <SkillCategoryCombobox
                    name="category"
                    categories={categoryOptions}
                    defaultValue={skill.category}
                  />
                </Field>
              </div>
              <div className="w-24">
                <Field label="Order">
                  <TextInput
                    type="number"
                    name="order"
                    defaultValue={skill.order}
                  />
                </Field>
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
        ))}
      </div>
    </div>
  );
}
