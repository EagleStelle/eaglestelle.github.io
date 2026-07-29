import ImageUpload from "@/components/ImageUpload";
import { Field, PrimaryButton, TextArea, TextInput } from "@/components/form";
import { prisma } from "@/lib/prisma";
import { saveProfile } from "@/app/admin/actions";

export default async function AdminProfilePage() {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <form action={saveProfile} className="flex flex-col gap-5">
        <ImageUpload
          name="avatarUrl"
          folder="profile"
          label="Profile photo"
          defaultValue={profile?.avatarUrl}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name">
            <TextInput name="name" defaultValue={profile?.name} required />
          </Field>
          <Field label="Headline">
            <TextInput
              name="headline"
              defaultValue={profile?.headline}
              placeholder="Full-stack Developer"
              required
            />
          </Field>
        </div>

        <Field label="Summary">
          <TextArea name="summary" defaultValue={profile?.summary} required />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email">
            <TextInput
              type="email"
              name="email"
              defaultValue={profile?.email}
              required
            />
          </Field>
          <Field label="Phone">
            <TextInput name="phone" defaultValue={profile?.phone ?? ""} />
          </Field>
          <Field label="Location">
            <TextInput name="location" defaultValue={profile?.location ?? ""} />
          </Field>
          <Field label="Resume URL">
            <TextInput
              type="url"
              name="resumeUrl"
              defaultValue={profile?.resumeUrl ?? ""}
            />
          </Field>
          <Field label="GitHub URL">
            <TextInput
              type="url"
              name="githubUrl"
              defaultValue={profile?.githubUrl ?? ""}
            />
          </Field>
          <Field label="LinkedIn URL">
            <TextInput
              type="url"
              name="linkedinUrl"
              defaultValue={profile?.linkedinUrl ?? ""}
            />
          </Field>
          <Field label="Website URL">
            <TextInput
              type="url"
              name="websiteUrl"
              defaultValue={profile?.websiteUrl ?? ""}
            />
          </Field>
        </div>

        <div>
          <PrimaryButton type="submit">Save profile</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
