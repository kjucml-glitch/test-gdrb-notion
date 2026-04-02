import { getSupabaseClient } from "./client";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "pages";

function makePath(basePath: string, fileName: string): string {
  const safeName = fileName.replace(/\s+/g, "-");
  return `${basePath}/${Date.now()}-${safeName}`;
}

async function uploadImage(file: File, path: string): Promise<string> {
  const objectPath = makePath(path, file.name);
  const { error } = await getSupabaseClient().storage.from(BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = getSupabaseClient().storage.from(BUCKET).getPublicUrl(objectPath);

  return publicUrl;
}

export async function uploadCoverImage(file: File, pageId: string): Promise<string> {
  return uploadImage(file, `pages/${pageId}/cover`);
}

export async function uploadBlockImage(file: File, pageId: string): Promise<string> {
  return uploadImage(file, `pages/${pageId}/images`);
}

export async function deleteImage(url: string): Promise<void> {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index < 0) return;

  const objectPath = decodeURIComponent(url.slice(index + marker.length));
  const { error } = await getSupabaseClient().storage.from(BUCKET).remove([objectPath]);
  if (error) {
    throw new Error(error.message);
  }
}
