import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { Field, PrimaryButton, TextInput } from "@/components/form";
import { prisma } from "@/lib/prisma";
import { createSkill, deleteSkill, updateSkill } from "@/app/admin/actions";

export default async function AdminSkillsPage() {
  const skills = await prisma.skill.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-4xl tracking-tight">Skills</h1>

      <ActionForm
        action={createSkill}
        success="Skill added."
        className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5"
      >
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          Add a skill
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name">
            <TextInput name="name" required />
          </Field>
          <Field label="Category">
            <TextInput name="category" placeholder="Frontend" />
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
            className="flex flex-wrap items-end gap-4 rounded-xl border border-border p-4"
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
                  <TextInput
                    name="category"
                    defaultValue={skill.category ?? ""}
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
