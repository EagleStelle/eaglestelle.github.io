export function parseProjectList(value: string | null | undefined): string[] {
  if (!value) return [];

  let source = value;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return normalizeList(parsed.map((item) => String(item)));
    }
  } catch {
    source = value;
  }

  return normalizeList(source.split(/[\n,]/));
}

export type ProjectImage = {
  url: string;
  title: string;
  description: string;
};

export function parseProjectImageEntries(
  value: string | null | undefined,
): ProjectImage[] {
  if (!value) return [];

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return parseProjectList(value).map(toProjectImage);
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.reduce<ProjectImage[]>((images, entry) => {
    const image = readProjectImage(entry);
    if (image && !images.some((item) => item.url === image.url)) {
      images.push(image);
    }
    return images;
  }, []);
}

export function parseProjectImageList({
  imageUrl,
  imageUrls,
}: {
  imageUrl: string;
  imageUrls: string | null | undefined;
}): ProjectImage[] {
  const images = parseProjectImageEntries(imageUrls);
  if (images.length > 0) return images;

  return normalizeList([imageUrl]).map(toProjectImage);
}

export function parseProjectImages(project: {
  imageUrl: string;
  imageUrls: string | null | undefined;
}): string[] {
  return parseProjectImageList(project).map((image) => image.url);
}

export function serializeProjectImages(images: ProjectImage[]): string {
  return JSON.stringify(
    images.reduce<ProjectImage[]>((items, image) => {
      const url = image.url.trim();
      if (url && !items.some((item) => item.url === url)) {
        items.push({
          url,
          title: image.title.trim(),
          description: image.description.trim(),
        });
      }
      return items;
    }, []),
  );
}

export function serializeProjectList(values: string[]): string {
  return JSON.stringify(normalizeList(values));
}

export function formatProjectList(value: string | null | undefined): string {
  return parseProjectList(value).join("\n");
}

function toProjectImage(url: string): ProjectImage {
  return { url, title: "", description: "" };
}

function readProjectImage(entry: unknown): ProjectImage | null {
  if (typeof entry === "string") {
    const url = entry.trim();
    return url ? toProjectImage(url) : null;
  }

  if (!entry || typeof entry !== "object") return null;

  const record = entry as Record<string, unknown>;
  const url = typeof record.url === "string" ? record.url.trim() : "";
  if (!url) return null;

  return {
    url,
    title: typeof record.title === "string" ? record.title.trim() : "",
    description:
      typeof record.description === "string" ? record.description.trim() : "",
  };
}

function normalizeList(values: string[]): string[] {
  return values.reduce<string[]>((items, item) => {
    const value = item.trim();
    if (value && !items.includes(value)) {
      items.push(value);
    }
    return items;
  }, []);
}
