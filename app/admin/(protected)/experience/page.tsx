import ImageUpload from "@/components/ImageUpload";
import { DatePickerInput } from "@/components/date-picker-input";
import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { OptionCombobox } from "@/components/admin/option-combobox";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { Field, PrimaryButton, TextArea, TextInput } from "@/components/form";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import {
  createExperience,
  deleteExperience,
  updateExperience,
} from "@/app/admin/actions";

const employmentTypeOptions = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
  "Self-employed",
];

const locationTypeOptions = ["On-site", "Hybrid", "Remote"];

export default async function AdminExperiencePage() {
  const experience = await prisma.experience.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-10">
      <ActionForm
        action={createExperience}
        success="Experience added."
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Add Experience
          </span>
          <Separator />
        </div>

        <ImageUpload name="logoUrl" folder="experience" label="Company Logo" />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Role">
            <TextInput name="role" required />
          </Field>
          <Field label="Company">
            <TextInput name="company" required />
          </Field>
          <Field label="Employment Type">
            <OptionCombobox
              name="employmentType"
              options={employmentTypeOptions}
              placeholder="Select employment type"
              emptyMessage="No employment types found."
            />
          </Field>
          <Field label="Location Type">
            <OptionCombobox
              name="locationType"
              options={locationTypeOptions}
              placeholder="Select location type"
              emptyMessage="No location types found."
            />
          </Field>
          <Field label="Start Date">
            <DatePickerInput name="startDate" />
          </Field>
          <Field label="End Date">
            <DatePickerInput name="endDate" />
          </Field>
        </div>

        <Field label="Description">
          <TextArea name="description" required />
        </Field>

        <div>
          <PrimaryButton type="submit">Add Experience</PrimaryButton>
        </div>
      </ActionForm>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Saved Experience ({experience.length})
          </span>
          <Separator />
        </div>

        <ReorderableList
          entityType="experience"
          items={experience.map((item) => ({
            id: item.id,
            order: item.order,
            content: (
              <div className="flex flex-col gap-5">
                <ActionForm
                  action={updateExperience}
                  success="Experience saved."
                  className="flex flex-col gap-5"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="order" value={item.order} />

                  <ImageUpload
                    name="logoUrl"
                    folder="experience"
                    label="Company Logo"
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
                    <Field label="Employment Type">
                      <OptionCombobox
                        name="employmentType"
                        options={employmentTypeOptions}
                        defaultValue={item.employmentType ?? ""}
                        placeholder="Select employment type"
                        emptyMessage="No employment types found."
                      />
                    </Field>
                    <Field label="Location Type">
                      <OptionCombobox
                        name="locationType"
                        options={locationTypeOptions}
                        defaultValue={item.locationType ?? ""}
                        placeholder="Select location type"
                        emptyMessage="No location types found."
                      />
                    </Field>
                    <Field label="Start Date">
                      <DatePickerInput
                        name="startDate"
                        defaultValue={item.startDate ?? ""}
                      />
                    </Field>
                    <Field label="End Date">
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

                  <div className="flex items-center justify-between pt-2">
                    <PrimaryButton type="submit">Save Changes</PrimaryButton>
                    <DeleteDialog
                      id={item.id}
                      action={deleteExperience}
                      trigger="Delete Experience"
                      title={`Delete "${item.role}"?`}
                      description="This removes the experience from your public page. It cannot be undone."
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
