import ImageUpload from "@/components/ImageUpload";
import {
  DangerButton,
  Field,
  PrimaryButton,
  TextArea,
  TextInput,
} from "@/components/form";
import { prisma } from "@/lib/prisma";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/app/admin/actions";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold">Projects</h1>

      <form
        action={createProject}
        className="flex flex-col gap-5 rounded-xl border border-black/10 p-5 dark:border-white/15"
      >
        <h2 className="font-medium">Add a project</h2>

        <ImageUpload
          name="imageUrl"
          folder="projects"
          label="Cover image"
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title">
            <TextInput name="title" required />
          </Field>
          <Field label="Order">
            <TextInput type="number" name="order" defaultValue={0} />
          </Field>
        </div>

        <Field label="Description">
          <TextArea name="description" required />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Live URL">
            <TextInput type="url" name="projectUrl" />
          </Field>
          <Field label="Source URL">
            <TextInput type="url" name="sourceUrl" />
          </Field>
        </div>

        <div>
          <PrimaryButton type="submit">Add project</PrimaryButton>
        </div>
      </form>

      <div className="flex flex-col gap-6">
        <h2 className="font-medium">{projects.length} saved</h2>

        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-xl border border-black/10 p-5 dark:border-white/15"
          >
            <form action={updateProject} className="flex flex-col gap-5">
              <input type="hidden" name="id" value={project.id} />

              <ImageUpload
                name="imageUrl"
                folder="projects"
                label="Cover image"
                defaultValue={project.imageUrl}
                required
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Title">
                  <TextInput
                    name="title"
                    defaultValue={project.title}
                    required
                  />
                </Field>
                <Field label="Order">
                  <TextInput
                    type="number"
                    name="order"
                    defaultValue={project.order}
                  />
                </Field>
              </div>

              <Field label="Description">
                <TextArea
                  name="description"
                  defaultValue={project.description}
                  required
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Live URL">
                  <TextInput
                    type="url"
                    name="projectUrl"
                    defaultValue={project.projectUrl ?? ""}
                  />
                </Field>
                <Field label="Source URL">
                  <TextInput
                    type="url"
                    name="sourceUrl"
                    defaultValue={project.sourceUrl ?? ""}
                  />
                </Field>
              </div>

              <div>
                <PrimaryButton type="submit">Save</PrimaryButton>
              </div>
            </form>

            <form action={deleteProject} className="mt-4">
              <input type="hidden" name="id" value={project.id} />
              <DangerButton type="submit">Delete project</DangerButton>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
