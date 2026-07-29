import { ImageGalleryUpload } from "@/components/image-gallery-upload";
import { DatePickerInput } from "@/components/date-picker-input";
import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { Field, PrimaryButton, TextArea, TextInput } from "@/components/form";
import { prisma } from "@/lib/prisma";
import { formatProjectList, parseProjectImageList } from "@/lib/project-data";
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
      <h1 className="font-display text-4xl tracking-tight">Projects</h1>

      <ActionForm
        action={createProject}
        success="Project added."
        className="flex flex-col gap-5"
      >
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          Add a project
        </h2>

        <ImageGalleryUpload
          name="imageUrls"
          folder="projects"
          label="Images"
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title">
            <TextInput name="title" required />
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

        <Field label="Tech stack">
          <TextArea name="techStack" />
        </Field>

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
      </ActionForm>

      <div className="flex flex-col gap-6">
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          {projects.length} saved
        </h2>

        {projects.map((project) => (
          <div
            key={project.id}
            className="flex flex-col gap-5 border-t border-border pt-6"
          >
            <ActionForm
              action={updateProject}
              success="Project saved."
              className="flex flex-col gap-5"
            >
              <input type="hidden" name="id" value={project.id} />

              <ImageGalleryUpload
                name="imageUrls"
                folder="projects"
                label="Images"
                defaultValue={parseProjectImageList({
                  imageUrl: project.imageUrl,
                  imageUrls: project.imageUrls,
                })}
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
                <Field label="Start">
                  <DatePickerInput
                    name="startDate"
                    defaultValue={project.startDate ?? ""}
                  />
                </Field>
                <Field label="End">
                  <DatePickerInput
                    name="endDate"
                    defaultValue={project.endDate ?? ""}
                  />
                </Field>
              </div>

              <Field label="Tech stack">
                <TextArea
                  name="techStack"
                  defaultValue={formatProjectList(project.techStack)}
                />
              </Field>

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
            </ActionForm>

            <div>
              <DeleteDialog
                id={project.id}
                action={deleteProject}
                trigger="Delete project"
                title={`Delete "${project.title}"?`}
                description="This also deletes the project images from blob storage. It cannot be undone."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
