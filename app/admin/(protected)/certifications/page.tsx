import ImageUpload from "@/components/ImageUpload";
import { DatePickerInput } from "@/components/date-picker-input";
import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { Field, PrimaryButton, TextInput } from "@/components/form";
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
      <h1 className="font-display text-4xl tracking-tight">Certifications</h1>

      <ActionForm
        action={createCertification}
        success="Certification added."
        className="flex flex-col gap-5"
      >
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          Add a certification
        </h2>

        <ImageUpload
          name="imageUrl"
          folder="certifications"
          label="Certificate image"
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
          <Field label="Issued at">
            <DatePickerInput name="issuedAt" />
          </Field>
          <Field label="Order">
            <TextInput type="number" name="order" defaultValue={0} />
          </Field>
        </div>

        <div>
          <PrimaryButton type="submit">Add certification</PrimaryButton>
        </div>
      </ActionForm>

      <div className="flex flex-col gap-6">
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          {certifications.length} saved
        </h2>

        {certifications.map((certification) => (
          <div
            key={certification.id}
            className="flex flex-col gap-5 border-t border-border pt-6"
          >
            <ActionForm
              action={updateCertification}
              success="Certification saved."
              className="flex flex-col gap-5"
            >
              <input type="hidden" name="id" value={certification.id} />

              <ImageUpload
                name="imageUrl"
                folder="certifications"
                label="Certificate image"
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
                <Field label="Issued at">
                  <DatePickerInput
                    name="issuedAt"
                    defaultValue={toDateInput(certification.issuedAt)}
                  />
                </Field>
                <Field label="Order">
                  <TextInput
                    type="number"
                    name="order"
                    defaultValue={certification.order}
                  />
                </Field>
              </div>

              <div>
                <PrimaryButton type="submit">Save</PrimaryButton>
              </div>
            </ActionForm>

            <div>
              <DeleteDialog
                id={certification.id}
                action={deleteCertification}
                trigger="Delete certification"
                title={`Delete "${certification.title}"?`}
                description="This also deletes the certificate image from blob storage. It cannot be undone."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
