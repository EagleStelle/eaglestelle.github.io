import ImageUpload from "@/components/ImageUpload";
import {
  DangerButton,
  Field,
  PrimaryButton,
  TextInput,
} from "@/components/form";
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
      <h1 className="text-2xl font-semibold">Certifications</h1>

      <form
        action={createCertification}
        className="flex flex-col gap-5 rounded-xl border border-black/10 p-5 dark:border-white/15"
      >
        <h2 className="font-medium">Add a certification</h2>

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
          <Field label="Credential URL">
            <TextInput type="url" name="credentialUrl" />
          </Field>
          <Field label="Issued at">
            <TextInput type="date" name="issuedAt" />
          </Field>
          <Field label="Order">
            <TextInput type="number" name="order" defaultValue={0} />
          </Field>
        </div>

        <div>
          <PrimaryButton type="submit">Add certification</PrimaryButton>
        </div>
      </form>

      <div className="flex flex-col gap-6">
        <h2 className="font-medium">{certifications.length} saved</h2>

        {certifications.map((certification) => (
          <div
            key={certification.id}
            className="rounded-xl border border-black/10 p-5 dark:border-white/15"
          >
            <form action={updateCertification} className="flex flex-col gap-5">
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
                <Field label="Credential URL">
                  <TextInput
                    type="url"
                    name="credentialUrl"
                    defaultValue={certification.credentialUrl ?? ""}
                  />
                </Field>
                <Field label="Issued at">
                  <TextInput
                    type="date"
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
            </form>

            <form action={deleteCertification} className="mt-4">
              <input type="hidden" name="id" value={certification.id} />
              <DangerButton type="submit">Delete certification</DangerButton>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
