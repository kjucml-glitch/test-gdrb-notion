import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, isConfigured } from "./config";
import type { Page, SidebarPage } from "@/types";
import { slugify } from "@/lib/utils/helpers";

const PAGES = "pages";

function getDb() {
  if (!db) throw new Error("Firebase is not configured");
  return db;
}

function toDate(ts: Timestamp | Date | null): Date {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  return ts;
}

function pageFromDoc(id: string, data: Record<string, unknown>): Page {
  return {
    id,
    title: (data.title as string) || "Untitled",
    slug: (data.slug as string) || "",
    icon: (data.icon as string) || "📄",
    coverImage: (data.coverImage as string) || null,
    description: (data.description as string) || "",
    isPublished: (data.isPublished as boolean) || false,
    isArchived: (data.isArchived as boolean) || false,
    authorId: (data.authorId as string) || "",
    parentPageId: (data.parentPageId as string) || null,
    tags: (data.tags as string[]) || [],
    views: (data.views as number) || 0,
    content: (data.content as string) || "[]",
    createdAt: toDate(data.createdAt as Timestamp),
    updatedAt: toDate(data.updatedAt as Timestamp),
    publishedAt: data.publishedAt ? toDate(data.publishedAt as Timestamp) : null,
  };
}

export async function createPage(authorId: string, parentPageId?: string): Promise<Page> {
  const ref = await addDoc(collection(getDb(), PAGES), {
    title: "Untitled",
    slug: "",
    icon: "📄",
    coverImage: null,
    description: "",
    isPublished: false,
    isArchived: false,
    authorId,
    parentPageId: parentPageId || null,
    tags: [],
    views: 0,
    content: "[]",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: null,
  });

  const snap = await getDoc(ref);
  return pageFromDoc(ref.id, snap.data() as Record<string, unknown>);
}

export async function getPage(pageId: string): Promise<Page | null> {
  const snap = await getDoc(doc(getDb(), PAGES, pageId));
  if (!snap.exists()) return null;
  return pageFromDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  if (!isConfigured) return null;
  const q = query(
    collection(getDb(), PAGES),
    where("slug", "==", slug),
    where("isPublished", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return pageFromDoc(d.id, d.data() as Record<string, unknown>);
}

export async function getPublishedPages(): Promise<Page[]> {
  if (!isConfigured) return [];
  const q = query(
    collection(getDb(), PAGES),
    where("isPublished", "==", true),
    where("isArchived", "==", false),
    orderBy("publishedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => pageFromDoc(d.id, d.data() as Record<string, unknown>));
}

export async function getUserPages(authorId: string): Promise<Page[]> {
  const q = query(
    collection(getDb(), PAGES),
    where("authorId", "==", authorId),
    where("isArchived", "==", false),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => pageFromDoc(d.id, d.data() as Record<string, unknown>));
}

export async function getUserSidebarPages(authorId: string): Promise<SidebarPage[]> {
  const pages = await getUserPages(authorId);
  return pages.map((p) => ({
    id: p.id,
    title: p.title,
    icon: p.icon,
    parentPageId: p.parentPageId,
    isPublished: p.isPublished,
  }));
}

export async function updatePage(
  pageId: string,
  data: Partial<Omit<Page, "id" | "createdAt">>
): Promise<void> {
  const updateData: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };

  if (data.title && !data.slug) {
    updateData.slug = slugify(data.title) + "-" + pageId.slice(0, 6);
  }

  if (data.isPublished === true) {
    updateData.publishedAt = serverTimestamp();
  }

  await updateDoc(doc(getDb(), PAGES, pageId), updateData);
}

export async function deletePage(pageId: string): Promise<void> {
  await deleteDoc(doc(getDb(), PAGES, pageId));
}

export async function archivePage(pageId: string): Promise<void> {
  await updateDoc(doc(getDb(), PAGES, pageId), {
    isArchived: true,
    updatedAt: serverTimestamp(),
  });
}
