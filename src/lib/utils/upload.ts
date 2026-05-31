import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";

export function isBlobStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveUploadedFile(
  file: File,
  subfolder: string
): Promise<string> {
  const ext = path.extname(file.name) || ".bin";
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;

  if (isBlobStorageEnabled()) {
    const blob = await put(`${subfolder}/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const dir = path.join(UPLOAD_DIR, subfolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${subfolder}/${filename}`;
}

export async function saveUploadedFiles(
  files: File[],
  subfolder: string
): Promise<{ name: string; url: string; mimeType: string | null }[]> {
  const results: { name: string; url: string; mimeType: string | null }[] = [];

  for (const file of files) {
    if (!file || file.size === 0) continue;
    const url = await saveUploadedFile(file, subfolder);
    results.push({
      name: file.name,
      url,
      mimeType: file.type || null,
    });
  }

  return results;
}

export function isImageMime(mimeType: string | null): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}
