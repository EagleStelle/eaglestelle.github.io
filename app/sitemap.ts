import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profile = await prisma.profile.findUnique({
    where: { id: 1 },
    select: { updatedAt: true },
  });

  return [
    {
      url: SITE_URL,
      lastModified: profile?.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
