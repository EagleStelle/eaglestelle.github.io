import ImageUpload from "@/components/ImageUpload";
import { MonthInput } from "@/components/month-input";
import { ActionForm, CreateActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { Field, PrimaryButton, TextArea, TextInput } from "@/components/form";
import { Separator } from "@/components/ui/separator";
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
      <CreateActionForm
        action={createEducation}
        success="Education added."
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Add Education
          </span>
          <Separator />
        </div>

        <ImageUpload name="logoUrl" folder="education" label="School / Institution Logo" />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Degree">
            <TextInput name="degree" required />
          </Field>
          <Field label="Institution">
            <TextInput name="institution" required />
          </Field>
          <Field label="Start Month">
            <MonthInput name="startDate" />
          </Field>
          <Field label="End Month">
            <MonthInput name="endDate" />
          </Field>
        </div>

        <Field label="Description">
          <TextArea name="description" required />
        </Field>

        <div>
          <PrimaryButton type="submit">Add Education</PrimaryButton>
        </div>
      </CreateActionForm>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Saved Education ({education.length})
          </span>
          <Separator />
        </div>

        <ReorderableList
          entityType="education"
          items={education.map((item) => ({
            id: item.id,
            order: item.order,
            content: (
              <div className="flex flex-col gap-5">
                <ActionForm
                  action={updateEducation}
                  success="Education saved."
                  className="flex flex-col gap-5"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="order" value={item.order} />

                  <ImageUpload
                    name="logoUrl"
                    folder="education"
                    label="School Logo"
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
                    <Field label="Start Month">
                      <MonthInput
                        name="startDate"
                        defaultValue={item.startDate ?? ""}
                      />
                    </Field>
                    <Field label="End Month">
                      <MonthInput
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

                  <div className="flex items-center justify-between pt-2">
                    <PrimaryButton type="submit">Save Changes</PrimaryButton>
                    <DeleteDialog
                      id={item.id}
                      action={deleteEducation}
                      trigger="Delete Education"
                      title={`Delete "${item.degree}"?`}
                      description="This also deletes the institution logo from blob storage. It cannot be undone."
                    />
                  </div>
                </ActionForm>
              </div>
            ),
          }))}
        />
      </div>
    </div>
  );
}
