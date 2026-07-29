import {
  DangerButton,
  Field,
  PrimaryButton,
  TextInput,
} from "@/components/form";
import { prisma } from "@/lib/prisma";
import { createSkill, deleteSkill, updateSkill } from "@/app/admin/actions";

export default async function AdminSkillsPage() {
  const skills = await prisma.skill.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold">Skills</h1>

      <form
        action={createSkill}
        className="flex flex-col gap-4 rounded-xl border border-black/10 p-5 dark:border-white/15"
      >
        <h2 className="font-medium">Add a skill</h2>
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
      </form>

      <div className="flex flex-col gap-4">
        <h2 className="font-medium">{skills.length} saved</h2>

        {skills.map((skill) => (
          <div
            key={skill.id}
            className="flex flex-wrap items-end gap-4 rounded-xl border border-black/10 p-4 dark:border-white/15"
          >
            <form
              action={updateSkill}
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
            </form>

            <form action={deleteSkill}>
              <input type="hidden" name="id" value={skill.id} />
              <DangerButton type="submit">Delete</DangerButton>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
