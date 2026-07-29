const MAX_DIMENSION = 1800;
const OUTPUT_TYPE = "image/webp";
const OUTPUT_QUALITY = 0.82;
const MIN_SAVINGS_RATIO = 0.94;

export type PreparedImageUpload = {
  file: File;
  originalBytes: number;
  uploadBytes: number;
  compressed: boolean;
};

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

export async function prepareImageForUpload(
  file: File,
): Promise<PreparedImageUpload> {
  if (!file.type.startsWith("image/")) {
    return unchanged(file);
  }

  let image: LoadedImage | null = null;

  try {
    image = await loadImage(file);
    const size = fitWithin(image.width, image.height, MAX_DIMENSION);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return unchanged(file);

    context.drawImage(image.source, 0, 0, size.width, size.height);

    const blob = await canvasToBlob(canvas, OUTPUT_TYPE, OUTPUT_QUALITY);
    if (!blob) return unchanged(file);

    const resized = size.width !== image.width || size.height !== image.height;
    if (!resized && blob.size >= file.size * MIN_SAVINGS_RATIO) {
      return unchanged(file);
    }

    const compressed = new File([blob], withExtension(file.name, "webp"), {
      type: OUTPUT_TYPE,
      lastModified: file.lastModified,
    });

    return {
      file: compressed,
      originalBytes: file.size,
      uploadBytes: compressed.size,
      compressed: true,
    };
  } catch {
    return unchanged(file);
  } finally {
    image?.release();
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function unchanged(file: File): PreparedImageUpload {
  return {
    file,
    originalBytes: file.size,
    uploadBytes: file.size,
    compressed: false,
  };
}

function fitWithin(width: number, height: number, max: number) {
  const largest = Math.max(width, height);
  if (largest <= max) return { width, height };

  const scale = max / largest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function loadImage(file: File): Promise<LoadedImage> {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Image could not be loaded."));
      element.src = url;
    });

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (cause) {
    URL.revokeObjectURL(url);
    throw cause;
  }
}

function withExtension(name: string, extension: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const withoutExtension = cleaned.replace(/\.[^.]+$/, "");

  return `${withoutExtension || "image"}.${extension}`;
}
