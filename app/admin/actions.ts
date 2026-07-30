"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { destroySession, requireAdmin } from "@/lib/auth";
import { normalizeThemeColor } from "@/lib/appearance";
import { normalizeMonthValue } from "@/lib/period";
import {
  assertPersistedBlobUrls,
  deletedBlobUrls,
  removeBlob,
  removeBlobs,
  removeChangedBlobs,
} from "@/lib/admin-blob-storage";
import {
  parseProjectImageEntries,
  parseProjectImages,
  parseProjectList,
  serializeProjectImages,
  type ProjectImage,
} from "@/lib/project-data";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value === "" ? null : value;
}

function optionalMonth(
  formData: FormData,
  key: string,
  label: string,
): string | null {
  const value = text(formData, key);
  if (value === "") return null;

  const normalized = normalizeMonthValue(value);
  if (!normalized) {
    throw new Error(`${label} must include a valid month and year.`);
  }

  return normalized;
}

function requiredText(formData: FormData, key: string, label: string): string {
  const value = text(formData, key);
  if (value === "") {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function integer(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

function requireId(formData: FormData): number {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    throw new Error("Missing or invalid id.");
  }
  return id;
}

function refresh(path: string): void {
  revalidatePath("/");
  revalidatePath(path);
}

function projectImages(formData: FormData): ProjectImage[] {
  const images = parseProjectImageEntries(text(formData, "imageUrls"));
  if (images.length === 0) {
    throw new Error("Add at least one project image.");
  }
  assertPersistedBlobUrls(images.map((image) => image.url));
  return images;
}

async function saveSkillCategoryOption(name: string | null): Promise<void> {
  if (!name) return;

  await prisma.skillCategory.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}

async function getNextOrder(
  entity: "skill" | "skillCategory" | "project" | "experience" | "education" | "certification",
  providedOrder?: number,
): Promise<number> {
  if (providedOrder && providedOrder !== 0) {
    return providedOrder;
  }
  let maxItem: { order: number } | null = null;
  switch (entity) {
    case "skill":
      maxItem = await prisma.skill.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
      break;
    case "skillCategory":
      maxItem = await prisma.skillCategory.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
      break;
    case "project":
      maxItem = await prisma.project.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
      break;
    case "experience":
      maxItem = await prisma.experience.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
      break;
    case "education":
      maxItem = await prisma.education.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
      break;
    case "certification":
      maxItem = await prisma.certification.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
      break;
  }
  return maxItem ? maxItem.order + 1 : 0;
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function saveProfile(formData: FormData): Promise<void> {
  await requireAdmin();

  const avatarUrl = optionalText(formData, "avatarUrl");
  const resumeUrl = optionalText(formData, "resumeUrl");
  const existing = await prisma.profile.findUnique({ where: { id: 1 } });

  const data = {
    name: text(formData, "name"),
    headline: text(formData, "headline"),
    avatarUrl,
    summary: text(formData, "summary"),
    resumeUrl,
    email: text(formData, "email"),
    githubUrl: optionalText(formData, "githubUrl"),
    linkedinUrl: optionalText(formData, "linkedinUrl"),
    themeColor: normalizeThemeColor(
      formData.get("themeColor") ?? existing?.themeColor ?? null,
    ),
  };

  await prisma.profile.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  await removeChangedBlobs(
    [
      existing?.avatarUrl,
      existing?.resumeUrl,
      ...deletedBlobUrls(formData, "avatarUrl"),
    ],
    [avatarUrl, resumeUrl],
  );

  refresh("/admin/profile");
}

export async function createSkill(formData: FormData): Promise<void> {
  await requireAdmin();

  const category = optionalText(formData, "category");
  await saveSkillCategoryOption(category);

  const providedOrder = integer(formData, "order");
  const order = await getNextOrder("skill", providedOrder);

  await prisma.skill.create({
    data: {
      name: text(formData, "name"),
      category,
      order,
    },
  });

  refresh("/admin/skills");
}

export async function updateSkill(formData: FormData): Promise<void> {
  await requireAdmin();

  const category = optionalText(formData, "category");
  await saveSkillCategoryOption(category);

  await prisma.skill.update({
    where: { id: requireId(formData) },
    data: {
      name: text(formData, "name"),
      category,
      order: integer(formData, "order"),
    },
  });

  refresh("/admin/skills");
}

export async function deleteSkill(formData: FormData): Promise<void> {
  await requireAdmin();

  await prisma.skill.delete({ where: { id: requireId(formData) } });

  refresh("/admin/skills");
}

export async function createSkillCategory(formData: FormData): Promise<void> {
  await requireAdmin();

  const name = requiredText(formData, "name", "Category name");

  const existing = await prisma.skillCategory.findUnique({ where: { name } });
  if (existing) {
    throw new Error("A category with that name already exists.");
  }

  const providedOrder = integer(formData, "order");
  const order = await getNextOrder("skillCategory", providedOrder);

  await prisma.skillCategory.create({
    data: {
      name,
      order,
    },
  });

  refresh("/admin/skills");
}

export async function updateSkillCategory(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = requireId(formData);
  const name = requiredText(formData, "name", "Category name");
  const order = integer(formData, "order");

  const current = await prisma.skillCategory.findUnique({ where: { id } });
  if (!current) {
    throw new Error("Category not found.");
  }

  const existing = await prisma.skillCategory.findUnique({ where: { name } });
  if (existing && existing.id !== id) {
    throw new Error("A category with that name already exists.");
  }

  await prisma.$transaction([
    prisma.skillCategory.update({
      where: { id },
      data: { name, order },
    }),
    prisma.skill.updateMany({
      where: { category: current.name },
      data: { category: name },
    }),
  ]);

  refresh("/admin/skills");
}

export async function deleteSkillCategory(formData: FormData): Promise<void> {
  await requireAdmin();

  const category = await prisma.skillCategory.findUnique({
    where: { id: requireId(formData) },
  });
  if (!category) {
    throw new Error("Category not found.");
  }

  await prisma.$transaction([
    prisma.skill.updateMany({
      where: { category: category.name },
      data: { category: null },
    }),
    prisma.skillCategory.delete({ where: { id: category.id } }),
  ]);

  refresh("/admin/skills");
}

export async function createProject(formData: FormData): Promise<void> {
  await requireAdmin();

  const images = projectImages(formData);
  const providedOrder = integer(formData, "order");
  const order = await getNextOrder("project", providedOrder);

  await prisma.project.create({
    data: {
      title: text(formData, "title"),
      description: text(formData, "description"),
      imageUrl: images[0].url,
      imageUrls: serializeProjectImages(images),
      techStack: parseProjectList(text(formData, "techStack")).join("\n"),
      projectUrl: optionalText(formData, "projectUrl"),
      sourceUrl: optionalText(formData, "sourceUrl"),
      startDate: optionalMonth(formData, "startDate", "Start month"),
      endDate: optionalMonth(formData, "endDate", "End month"),
      order,
    },
  });

  refresh("/admin/projects");
}

export async function updateProject(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = requireId(formData);
  const images = projectImages(formData);
  const existing = await prisma.project.findUnique({ where: { id } });
  const previousImages = existing
    ? parseProjectImages({
        imageUrl: existing.imageUrl,
        imageUrls: existing.imageUrls,
      })
    : [];
  const nextImages = images.map((image) => image.url);

  await prisma.project.update({
    where: { id },
    data: {
      title: text(formData, "title"),
      description: text(formData, "description"),
      imageUrl: images[0].url,
      imageUrls: serializeProjectImages(images),
      techStack: parseProjectList(text(formData, "techStack")).join("\n"),
      projectUrl: optionalText(formData, "projectUrl"),
      sourceUrl: optionalText(formData, "sourceUrl"),
      startDate: optionalMonth(formData, "startDate", "Start month"),
      endDate: optionalMonth(formData, "endDate", "End month"),
      order: integer(formData, "order"),
    },
  });

  await removeChangedBlobs(
    [...previousImages, ...deletedBlobUrls(formData, "imageUrls")],
    nextImages,
  );

  refresh("/admin/projects");
}

export async function deleteProject(formData: FormData): Promise<void> {
  await requireAdmin();

  const project = await prisma.project.findUnique({
    where: { id: requireId(formData) },
  });
  if (!project) {
    throw new Error("Project not found.");
  }

  await removeBlobs(
    parseProjectImages({
      imageUrl: project.imageUrl,
      imageUrls: project.imageUrls,
    }),
  );
  await prisma.project.delete({ where: { id: project.id } });

  refresh("/admin/projects");
}

export async function createExperience(formData: FormData): Promise<void> {
  await requireAdmin();

  const providedOrder = integer(formData, "order");
  const order = await getNextOrder("experience", providedOrder);

  await prisma.experience.create({
    data: {
      role: text(formData, "role"),
      company: text(formData, "company"),
      logoUrl: optionalText(formData, "logoUrl"),
      employmentType: optionalText(formData, "employmentType"),
      locationType: optionalText(formData, "locationType"),
      startDate: optionalMonth(formData, "startDate", "Start month"),
      endDate: optionalMonth(formData, "endDate", "End month"),
      description: text(formData, "description"),
      order,
    },
  });

  refresh("/admin/experience");
}

export async function updateExperience(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = requireId(formData);
  const logoUrl = optionalText(formData, "logoUrl");
  const existing = await prisma.experience.findUnique({ where: { id } });

  await prisma.experience.update({
    where: { id },
    data: {
      role: text(formData, "role"),
      company: text(formData, "company"),
      logoUrl,
      employmentType: optionalText(formData, "employmentType"),
      locationType: optionalText(formData, "locationType"),
      startDate: optionalMonth(formData, "startDate", "Start month"),
      endDate: optionalMonth(formData, "endDate", "End month"),
      description: text(formData, "description"),
      order: integer(formData, "order"),
    },
  });

  await removeChangedBlobs(
    [existing?.logoUrl, ...deletedBlobUrls(formData, "logoUrl")],
    [logoUrl],
  );

  refresh("/admin/experience");
}

export async function deleteExperience(formData: FormData): Promise<void> {
  await requireAdmin();

  const experience = await prisma.experience.findUnique({
    where: { id: requireId(formData) },
  });
  if (!experience) {
    throw new Error("Experience not found.");
  }

  await removeBlob(experience.logoUrl);
  await prisma.experience.delete({ where: { id: experience.id } });

  refresh("/admin/experience");
}

export async function createEducation(formData: FormData): Promise<void> {
  await requireAdmin();

  const providedOrder = integer(formData, "order");
  const order = await getNextOrder("education", providedOrder);

  await prisma.education.create({
    data: {
      degree: text(formData, "degree"),
      institution: text(formData, "institution"),
      logoUrl: optionalText(formData, "logoUrl"),
      startDate: optionalMonth(formData, "startDate", "Start month"),
      endDate: optionalMonth(formData, "endDate", "End month"),
      description: text(formData, "description"),
      order,
    },
  });

  refresh("/admin/education");
}

export async function updateEducation(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = requireId(formData);
  const logoUrl = optionalText(formData, "logoUrl");
  const existing = await prisma.education.findUnique({ where: { id } });

  await prisma.education.update({
    where: { id },
    data: {
      degree: text(formData, "degree"),
      institution: text(formData, "institution"),
      logoUrl,
      startDate: optionalMonth(formData, "startDate", "Start month"),
      endDate: optionalMonth(formData, "endDate", "End month"),
      description: text(formData, "description"),
      order: integer(formData, "order"),
    },
  });

  await removeChangedBlobs(
    [existing?.logoUrl, ...deletedBlobUrls(formData, "logoUrl")],
    [logoUrl],
  );

  refresh("/admin/education");
}

export async function deleteEducation(formData: FormData): Promise<void> {
  await requireAdmin();

  const education = await prisma.education.findUnique({
    where: { id: requireId(formData) },
  });
  if (!education) {
    throw new Error("Education not found.");
  }

  await removeBlob(education.logoUrl);
  await prisma.education.delete({ where: { id: education.id } });

  refresh("/admin/education");
}

export async function createCertification(formData: FormData): Promise<void> {
  await requireAdmin();

  const providedOrder = integer(formData, "order");
  const order = await getNextOrder("certification", providedOrder);
  const imageUrl = requiredText(formData, "imageUrl", "Certificate image");

  await prisma.certification.create({
    data: {
      title: text(formData, "title"),
      issuer: text(formData, "issuer"),
      imageUrl,
      certificationUrl: optionalText(formData, "certificationUrl"),
      issuedAt: optionalMonth(formData, "issuedAt", "Issued month"),
      order,
    },
  });

  refresh("/admin/certifications");
}

export async function updateCertification(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = requireId(formData);
  const imageUrl = requiredText(formData, "imageUrl", "Certificate image");
  const existing = await prisma.certification.findUnique({ where: { id } });

  await prisma.certification.update({
    where: { id },
    data: {
      title: text(formData, "title"),
      issuer: text(formData, "issuer"),
      imageUrl,
      certificationUrl: optionalText(formData, "certificationUrl"),
      issuedAt: optionalMonth(formData, "issuedAt", "Issued month"),
      order: integer(formData, "order"),
    },
  });

  await removeChangedBlobs(
    [existing?.imageUrl, ...deletedBlobUrls(formData, "imageUrl")],
    [imageUrl],
  );

  refresh("/admin/certifications");
}

export async function deleteCertification(formData: FormData): Promise<void> {
  await requireAdmin();

  const certification = await prisma.certification.findUnique({
    where: { id: requireId(formData) },
  });
  if (!certification) {
    throw new Error("Certification not found.");
  }

  await removeBlob(certification.imageUrl);
  await prisma.certification.delete({ where: { id: certification.id } });

  refresh("/admin/certifications");
}

export async function reorderItems(
  entityType: "skill" | "skillCategory" | "project" | "experience" | "education" | "certification",
  orderedIds: number[],
): Promise<void> {
  await requireAdmin();

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;

  const updates = orderedIds.map((id, index) => {
    switch (entityType) {
      case "skill":
        return prisma.skill.update({ where: { id }, data: { order: index } });
      case "skillCategory":
        return prisma.skillCategory.update({ where: { id }, data: { order: index } });
      case "project":
        return prisma.project.update({ where: { id }, data: { order: index } });
      case "experience":
        return prisma.experience.update({ where: { id }, data: { order: index } });
      case "education":
        return prisma.education.update({ where: { id }, data: { order: index } });
      case "certification":
        return prisma.certification.update({ where: { id }, data: { order: index } });
      default:
        throw new Error("Invalid entity type for reordering.");
    }
  });

  await prisma.$transaction(updates);

  const refreshMap: Record<string, string> = {
    skill: "/admin/skills",
    skillCategory: "/admin/skills",
    project: "/admin/projects",
    experience: "/admin/experience",
    education: "/admin/education",
    certification: "/admin/certifications",
  };

  if (refreshMap[entityType]) {
    refresh(refreshMap[entityType]);
  }
}
