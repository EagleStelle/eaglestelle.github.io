import ImageUpload from "@/components/ImageUpload";
import { DatePickerInput } from "@/components/date-picker-input";
import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { Field, PrimaryButton, TextArea, TextInput } from "@/components/form";
import { prisma } from "@/lib/prisma";
import {
  createExperience,
  deleteExperience,
  updateExperience,
} from "@/app/admin/actions";

export default async function AdminExperiencePage() {
  const experience = await prisma.experience.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-4xl tracking-tight">Experience</h1>

      <ActionForm
        action={createExperience}
        success="Experience added."
        className="flex flex-col gap-5"
      >
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          Add experience
        </h2>

        <ImageUpload name="logoUrl" folder="experience" label="Company logo" />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Role">
            <TextInput name="role" required />
          </Field>
          <Field label="Company">
            <TextInput name="company" required />
          </Field>
          <Field label="Location">
            <TextInput name="location" />
          </Field>
          <Field label="Order">
            <TextInput type="number" name="order" defaultValue={0} />
          </Field>
          <Field label="Start">
            <DatePickerInput name="startDate" />
          </Field>
          <Field label="End">
            <DatePickerInput name="endDate" />
          </Field>
        </div>

        <Field label="Description">
          <TextArea name="description" required />
        </Field>

        <div>
          <PrimaryButton type="submit">Add experience</PrimaryButton>
        </div>
      </ActionForm>

      <div className="flex flex-col gap-6">
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          {experience.length} saved
        </h2>

        {experience.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-5 border-t border-border pt-6"
          >
            <ActionForm
              action={updateExperience}
              success="Experience saved."
              className="flex flex-col gap-5"
            >
              <input type="hidden" name="id" value={item.id} />

              <ImageUpload
                name="logoUrl"
                folder="experience"
                label="Company logo"
                defaultValue={item.logoUrl}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Role">
                  <TextInput name="role" defaultValue={item.role} required />
                </Field>
                <Field label="Company">
                  <TextInput
                    name="company"
                    defaultValue={item.company}
                    required
                  />
                </Field>
                <Field label="Location">
                  <TextInput name="location" defaultValue={item.location ?? ""} />
                </Field>
                <Field label="Order">
                  <TextInput
                    type="number"
                    name="order"
                    defaultValue={item.order}
                  />
                </Field>
                <Field label="Start">
                  <DatePickerInput
                    name="startDate"
                    defaultValue={item.startDate ?? ""}
                  />
                </Field>
                <Field label="End">
                  <DatePickerInput
                    name="endDate"
                    defaultValue={item.endDate ?? ""}
                  />
                </Field>
              </div>

              <Field label="Description">
                <TextArea
                  name="description"
                  defaultValue={item.description}
                  required
                />
              </Field>

              <div>
                <PrimaryButton type="submit">Save</PrimaryButton>
              </div>
            </ActionForm>

            <div>
              <DeleteDialog
                id={item.id}
                action={deleteExperience}
                trigger="Delete experience"
                title={`Delete "${item.role}"?`}
                description="This removes the experience from your public page. It cannot be undone."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
