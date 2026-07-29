"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { destroySession, requireAdmin } from "@/lib/auth";
import { normalizeThemeColor } from "@/lib/appearance";
import {
  parseProjectImages,
  parseProjectList,
  serializeProjectList,
} from "@/lib/project-data";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value === "" ? null : value;
}

function optionalDate(formData: FormData, key: string): Date | null {
  const value = text(formData, key);
  if (value === "") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

async function removeBlob(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch {
    return;
  }
}

function refresh(path: string): void {
  revalidatePath("/");
  revalidatePath(path);
}

function projectImages(formData: FormData): string[] {
  const images = parseProjectList(text(formData, "imageUrls"));
  if (images.length === 0) {
    throw new Error("Add at least one project image.");
  }
  return images;
}

async function removeChangedBlobs(
  previous: string[],
  next: string[],
): Promise<void> {
  await Promise.all(
    previous
      .filter((url) => !next.includes(url))
      .map((url) => removeBlob(url)),
  );
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function saveProfile(formData: FormData): Promise<void> {
  await requireAdmin();

  const avatarUrl = optionalText(formData, "avatarUrl");
  const existing = await prisma.profile.findUnique({ where: { id: 1 } });

  if (existing && existing.avatarUrl && existing.avatarUrl !== avatarUrl) {
    await removeBlob(existing.avatarUrl);
  }

  const data = {
    name: text(formData, "name"),
    headline: text(formData, "headline"),
    avatarUrl,
    summary: text(formData, "summary"),
    resumeUrl: optionalText(formData, "resumeUrl"),
    email: text(formData, "email"),
    phone: optionalText(formData, "phone"),
    location: optionalText(formData, "location"),
    githubUrl: optionalText(formData, "githubUrl"),
    linkedinUrl: optionalText(formData, "linkedinUrl"),
    websiteUrl: optionalText(formData, "websiteUrl"),
    themeColor: normalizeThemeColor(
      formData.get("themeColor") ?? existing?.themeColor ?? null,
    ),
  };

  await prisma.profile.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  refresh("/admin/profile");
}

export async function createSkill(formData: FormData): Promise<void> {
  await requireAdmin();

  await prisma.skill.create({
    data: {
      name: text(formData, "name"),
      category: optionalText(formData, "category"),
      order: integer(formData, "order"),
    },
  });

  refresh("/admin/skills");
}

export async function updateSkill(formData: FormData): Promise<void> {
  await requireAdmin();

  await prisma.skill.update({
    where: { id: requireId(formData) },
    data: {
      name: text(formData, "name"),
      category: optionalText(formData, "category"),
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

export async function createProject(formData: FormData): Promise<void> {
  await requireAdmin();

  const images = projectImages(formData);

  await prisma.project.create({
    data: {
      title: text(formData, "title"),
      description: text(formData, "description"),
      imageUrl: images[0],
      imageUrls: serializeProjectList(images),
      techStack: parseProjectList(text(formData, "techStack")).join("\n"),
      projectUrl: optionalText(formData, "projectUrl"),
      sourceUrl: optionalText(formData, "sourceUrl"),
      order: integer(formData, "order"),
    },
  });

  refresh("/admin/projects");
}

export async function updateProject(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = requireId(formData);
  const images = projectImages(formData);
  const existing = await prisma.project.findUnique({ where: { id } });

  if (existing) {
    await removeChangedBlobs(
      parseProjectImages({
        imageUrl: existing.imageUrl,
        imageUrls: existing.imageUrls,
      }),
      images,
    );
  }

  await prisma.project.update({
    where: { id },
    data: {
      title: text(formData, "title"),
      description: text(formData, "description"),
      imageUrl: images[0],
      imageUrls: serializeProjectList(images),
      techStack: parseProjectList(text(formData, "techStack")).join("\n"),
      projectUrl: optionalText(formData, "projectUrl"),
      sourceUrl: optionalText(formData, "sourceUrl"),
      order: integer(formData, "order"),
    },
  });

  refresh("/admin/projects");
}

export async function deleteProject(formData: FormData): Promise<void> {
  await requireAdmin();

  const deleted = await prisma.project.delete({
    where: { id: requireId(formData) },
  });
  await Promise.all(
    parseProjectImages({
      imageUrl: deleted.imageUrl,
      imageUrls: deleted.imageUrls,
    }).map((url) => removeBlob(url)),
  );

  refresh("/admin/projects");
}

export async function createExperience(formData: FormData): Promise<void> {
  await requireAdmin();

  await prisma.experience.create({
    data: {
      role: text(formData, "role"),
      company: text(formData, "company"),
      logoUrl: optionalText(formData, "logoUrl"),
      location: optionalText(formData, "location"),
      startDate: optionalText(formData, "startDate"),
      endDate: optionalText(formData, "endDate"),
      description: text(formData, "description"),
      order: integer(formData, "order"),
    },
  });

  refresh("/admin/experience");
}

export async function updateExperience(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = requireId(formData);
  const logoUrl = optionalText(formData, "logoUrl");
  const existing = await prisma.experience.findUnique({ where: { id } });

  if (existing && existing.logoUrl !== logoUrl) {
    await removeBlob(existing.logoUrl);
  }

  await prisma.experience.update({
    where: { id },
    data: {
      role: text(formData, "role"),
      company: text(formData, "company"),
      logoUrl,
      location: optionalText(formData, "location"),
      startDate: optionalText(formData, "startDate"),
      endDate: optionalText(formData, "endDate"),
      description: text(formData, "description"),
      order: integer(formData, "order"),
    },
  });

  refresh("/admin/experience");
}

export async function deleteExperience(formData: FormData): Promise<void> {
  await requireAdmin();

  const deleted = await prisma.experience.delete({
    where: { id: requireId(formData) },
  });
  await removeBlob(deleted.logoUrl);

  refresh("/admin/experience");
}

export async function createEducation(formData: FormData): Promise<void> {
  await requireAdmin();

  await prisma.education.create({
    data: {
      degree: text(formData, "degree"),
      institution: text(formData, "institution"),
      logoUrl: optionalText(formData, "logoUrl"),
      location: optionalText(formData, "location"),
      startDate: optionalText(formData, "startDate"),
      endDate: optionalText(formData, "endDate"),
      description: text(formData, "description"),
      order: integer(formData, "order"),
    },
  });

  refresh("/admin/education");
}

export async function updateEducation(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = requireId(formData);
  const logoUrl = optionalText(formData, "logoUrl");
  const existing = await prisma.education.findUnique({ where: { id } });

  if (existing && existing.logoUrl !== logoUrl) {
    await removeBlob(existing.logoUrl);
  }

  await prisma.education.update({
    where: { id },
    data: {
      degree: text(formData, "degree"),
      institution: text(formData, "institution"),
      logoUrl,
      location: optionalText(formData, "location"),
      startDate: optionalText(formData, "startDate"),
      endDate: optionalText(formData, "endDate"),
      description: text(formData, "description"),
      order: integer(formData, "order"),
    },
  });

  refresh("/admin/education");
}

export async function deleteEducation(formData: FormData): Promise<void> {
  await requireAdmin();

  const deleted = await prisma.education.delete({
    where: { id: requireId(formData) },
  });
  await removeBlob(deleted.logoUrl);

  refresh("/admin/education");
}

export async function createCertification(formData: FormData): Promise<void> {
  await requireAdmin();

  await prisma.certification.create({
    data: {
      title: text(formData, "title"),
      issuer: text(formData, "issuer"),
      imageUrl: text(formData, "imageUrl"),
      credentialUrl: optionalText(formData, "credentialUrl"),
      issuedAt: optionalDate(formData, "issuedAt"),
      order: integer(formData, "order"),
    },
  });

  refresh("/admin/certifications");
}

export async function updateCertification(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = requireId(formData);
  const imageUrl = text(formData, "imageUrl");
  const existing = await prisma.certification.findUnique({ where: { id } });

  if (existing && existing.imageUrl !== imageUrl) {
    await removeBlob(existing.imageUrl);
  }

  await prisma.certification.update({
    where: { id },
    data: {
      title: text(formData, "title"),
      issuer: text(formData, "issuer"),
      imageUrl,
      credentialUrl: optionalText(formData, "credentialUrl"),
      issuedAt: optionalDate(formData, "issuedAt"),
      order: integer(formData, "order"),
    },
  });

  refresh("/admin/certifications");
}

export async function deleteCertification(formData: FormData): Promise<void> {
  await requireAdmin();

  const deleted = await prisma.certification.delete({
    where: { id: requireId(formData) },
  });
  await removeBlob(deleted.imageUrl);

  refresh("/admin/certifications");
}
