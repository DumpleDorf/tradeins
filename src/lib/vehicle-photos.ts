export const MAX_VEHICLE_PHOTO_BYTES = 20 * 1024 * 1024; // 20 MB

export const VEHICLE_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

export function formatPhotoSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateVehiclePhotoFile(file: File): string | null {
  if (!file.type.startsWith("image/") && file.type !== "") {
    return `${file.name}: must be an image file`;
  }

  if (file.size > MAX_VEHICLE_PHOTO_BYTES) {
    return `${file.name}: too large (${formatPhotoSize(file.size)}). Maximum is ${formatPhotoSize(MAX_VEHICLE_PHOTO_BYTES)} per image. Try compressing or resizing the photo.`;
  }

  return null;
}

export function validateVehiclePhotoFiles(files: File[]): string[] {
  return files
    .filter((file) => file && file.size > 0)
    .map((file) => validateVehiclePhotoFile(file))
    .filter((message): message is string => message !== null);
}

export function formatPhotoUploadError(fileName: string, body: string): string {
  try {
    const json = JSON.parse(body) as { message?: string; error?: string };
    const message = json.message ?? json.error ?? body;

    if (/maximum allowed size|payload too large|entity too large/i.test(message)) {
      return `${fileName}: file exceeds the maximum upload size (${formatPhotoSize(MAX_VEHICLE_PHOTO_BYTES)} per image)`;
    }

    return `${fileName}: ${message}`;
  } catch {
    if (/maximum allowed size|payload too large|entity too large/i.test(body)) {
      return `${fileName}: file exceeds the maximum upload size (${formatPhotoSize(MAX_VEHICLE_PHOTO_BYTES)} per image)`;
    }
    return `${fileName}: upload failed`;
  }
}
