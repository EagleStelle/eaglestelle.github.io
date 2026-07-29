import ImageUpload from "@/components/ImageUpload";
import { DatePickerInput } from "@/components/date-picker-input";
import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { Field, PrimaryButton, TextInput } from "@/components/form";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import {
  createCertification,
  deleteCertification,
  updateCertification,
} from "@/app/admin/actions";

function toDateInput(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function AdminCertificationsPage() {
  const certifications = await prisma.certification.findMany({
    orderBy: [{ order: "asc" }, { issuedAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-10">
      <ActionForm
        action={createCertification}
        success="Certification added."
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Add Certification
          </span>
          <Separator />
        </div>

        <ImageUpload
          name="imageUrl"
          folder="certifications"
          label="Certificate Image"
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title">
            <TextInput name="title" required />
          </Field>
          <Field label="Issuer">
            <TextInput name="issuer" required />
          </Field>
          <Field label="Certification URL">
            <TextInput type="url" name="certificationUrl" />
          </Field>
          <Field label="Issued At">
            <DatePickerInput name="issuedAt" />
          </Field>
        </div>

        <div>
          <PrimaryButton type="submit">Add Certification</PrimaryButton>
        </div>
      </ActionForm>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Saved Certifications ({certifications.length})
          </span>
          <Separator />
        </div>

        <ReorderableList
          entityType="certification"
          items={certifications.map((certification) => ({
            id: certification.id,
            order: certification.order,
            content: (
              <div className="flex flex-col gap-5">
                <ActionForm
                  action={updateCertification}
                  success="Certification saved."
                  className="flex flex-col gap-5"
                >
                  <input type="hidden" name="id" value={certification.id} />
                  <input type="hidden" name="order" value={certification.order} />

                  <ImageUpload
                    name="imageUrl"
                    folder="certifications"
                    label="Certificate Image"
                    defaultValue={certification.imageUrl}
                    required
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Title">
                      <TextInput
                        name="title"
                        defaultValue={certification.title}
                        required
                      />
                    </Field>
                    <Field label="Issuer">
                      <TextInput
                        name="issuer"
                        defaultValue={certification.issuer}
                        required
                      />
                    </Field>
                    <Field label="Certification URL">
                      <TextInput
                        type="url"
                        name="certificationUrl"
                        defaultValue={certification.certificationUrl ?? ""}
                      />
                    </Field>
                    <Field label="Issued At">
                      <DatePickerInput
                        name="issuedAt"
                        defaultValue={toDateInput(certification.issuedAt)}
                      />
                    </Field>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <PrimaryButton type="submit">Save Changes</PrimaryButton>
                    <DeleteDialog
                      id={certification.id}
                      action={deleteCertification}
                      trigger="Delete Certification"
                      title={`Delete "${certification.title}"?`}
                      description="This also deletes the certificate image from blob storage. It cannot be undone."
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
