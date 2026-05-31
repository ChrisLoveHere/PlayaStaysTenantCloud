import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";

export async function saveUploadedFile(
  file: File,
  subfolder: string
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || ".pdf";
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
  const dir = path.join(UPLOAD_DIR, subfolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${subfolder}/${filename}`;
}
