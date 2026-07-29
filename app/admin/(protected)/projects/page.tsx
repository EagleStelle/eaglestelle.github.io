import { ImageGalleryUpload } from "@/components/image-gallery-upload";
import { DatePickerInput } from "@/components/date-picker-input";
import { ActionForm } from "@/components/admin/action-form";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { ReorderableList } from "@/components/admin/reorderable-list";
import { Field, PrimaryButton, TextArea, TextInput } from "@/components/form";
import { Separator } from "@/components/ui/separator";
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
      <ActionForm
        action={createProject}
        success="Project added."
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Add New Project
          </span>
          <Separator />
        </div>

        <ImageGalleryUpload
          name="imageUrls"
          folder="projects"
          label="Images"
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title">
              <TextInput name="title" required />
            </Field>
          </div>
          <Field label="Start Date">
            <DatePickerInput name="startDate" />
          </Field>
          <Field label="End Date">
            <DatePickerInput name="endDate" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Live URL">
              <TextInput type="url" name="projectUrl" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Source Code URL">
              <TextInput type="url" name="sourceUrl" />
            </Field>
          </div>
        </div>

        <Field label="Tech Stack (one per line)">
          <TextArea name="techStack" />
        </Field>

        <Field label="Description">
          <TextArea name="description" required />
        </Field>

        <div>
          <PrimaryButton type="submit">Add Project</PrimaryButton>
        </div>
      </ActionForm>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Saved Projects ({projects.length})
          </span>
          <Separator />
        </div>

        <ReorderableList
          entityType="project"
          items={projects.map((project) => ({
            id: project.id,
            order: project.order,
            content: (
              <div className="flex flex-col gap-5">
                <ActionForm
                  action={updateProject}
                  success="Project saved."
                  className="flex flex-col gap-5"
                >
                  <input type="hidden" name="id" value={project.id} />
                  <input type="hidden" name="order" value={project.order} />

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
                    <div className="sm:col-span-2">
                      <Field label="Title">
                        <TextInput
                          name="title"
                          defaultValue={project.title}
                          required
                        />
                      </Field>
                    </div>
                    <Field label="Start Date">
                      <DatePickerInput
                        name="startDate"
                        defaultValue={project.startDate ?? ""}
                      />
                    </Field>
                    <Field label="End Date">
                      <DatePickerInput
                        name="endDate"
                        defaultValue={project.endDate ?? ""}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Live URL">
                        <TextInput
                          type="url"
                          name="projectUrl"
                          defaultValue={project.projectUrl ?? ""}
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Source Code URL">
                        <TextInput
                          type="url"
                          name="sourceUrl"
                          defaultValue={project.sourceUrl ?? ""}
                        />
                      </Field>
                    </div>
                  </div>

                  <Field label="Tech Stack">
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

                  <div className="flex items-center justify-between pt-2">
                    <PrimaryButton type="submit">Save Changes</PrimaryButton>
                    <DeleteDialog
                      id={project.id}
                      action={deleteProject}
                      trigger="Delete Project"
                      title={`Delete "${project.title}"?`}
                      description="This also deletes the project images from blob storage. It cannot be undone."
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
