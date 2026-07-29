import ImageUpload from "@/components/ImageUpload";
import { DatePickerInput } from "@/components/date-picker-input";
import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { Field, PrimaryButton, TextArea, TextInput } from "@/components/form";
import { prisma } from "@/lib/prisma";
import {
  createEducation,
  deleteEducation,
  updateEducation,
} from "@/app/admin/actions";

export default async function AdminEducationPage() {
  const education = await prisma.education.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-4xl tracking-tight">Education</h1>

      <ActionForm
        action={createEducation}
        success="Education added."
        className="flex flex-col gap-5"
      >
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          Add education
        </h2>

        <ImageUpload name="logoUrl" folder="education" label="School logo" />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Degree">
            <TextInput name="degree" required />
          </Field>
          <Field label="Institution">
            <TextInput name="institution" required />
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
          <PrimaryButton type="submit">Add education</PrimaryButton>
        </div>
      </ActionForm>

      <div className="flex flex-col gap-6">
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          {education.length} saved
        </h2>

        {education.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-5 border-t border-border pt-6"
          >
            <ActionForm
              action={updateEducation}
              success="Education saved."
              className="flex flex-col gap-5"
            >
              <input type="hidden" name="id" value={item.id} />

              <ImageUpload
                name="logoUrl"
                folder="education"
                label="School logo"
                defaultValue={item.logoUrl}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Degree">
                  <TextInput name="degree" defaultValue={item.degree} required />
                </Field>
                <Field label="Institution">
                  <TextInput
                    name="institution"
                    defaultValue={item.institution}
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
                action={deleteEducation}
                trigger="Delete education"
                title={`Delete "${item.degree}"?`}
                description="This removes the education from your public page. It cannot be undone."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
