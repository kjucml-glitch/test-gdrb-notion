import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./config";

export async function uploadImage(
  file: File,
  path: string
): Promise<string> {
  if (!storage) throw new Error("Firebase is not configured");
  const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function uploadCoverImage(
  file: File,
  pageId: string
): Promise<string> {
  return uploadImage(file, `pages/${pageId}/cover`);
}

export async function uploadBlockImage(
  file: File,
  pageId: string
): Promise<string> {
  return uploadImage(file, `pages/${pageId}/images`);
}

export async function deleteImage(url: string): Promise<void> {
  if (!storage) return;
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // Image may already be deleted
  }
}
