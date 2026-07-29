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

export function parseProjectImages({
  imageUrl,
  imageUrls,
}: {
  imageUrl: string;
  imageUrls: string | null | undefined;
}): string[] {
  const images = parseProjectList(imageUrls);
  return images.length > 0 ? images : normalizeList([imageUrl]);
}

export function serializeProjectList(values: string[]): string {
  return JSON.stringify(normalizeList(values));
}

export function formatProjectList(value: string | null | undefined): string {
  return parseProjectList(value).join("\n");
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
