import { getSupabaseClient } from "./client";
import type { Page, SidebarPage } from "@/types";
import { slugify } from "@/lib/utils/helpers";

const PAGES = "pages";

type DbRow = Record<string, unknown>;

function db() {
  return getSupabaseClient();
}

function readField<T>(row: DbRow, snake: string, camel: string): T | undefined {
  const snakeValue = row[snake] as T | undefined;
  if (snakeValue !== undefined) return snakeValue;
  return row[camel] as T | undefined;
}

function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(value as string);
}

function pageFromRow(row: DbRow): Page {
  const id = (row.id as string) ?? "";

  return {
    id,
    title: (row.title as string) ?? "Untitled",
    slug: (row.slug as string) ?? "",
    icon: (row.icon as string) ?? "📄",
    coverImage: readField<string | null>(row, "cover_image", "coverImage") ?? null,
    description: (row.description as string) ?? "",
    isPublished: readField<boolean>(row, "is_published", "isPublished") ?? false,
    isArchived: readField<boolean>(row, "is_archived", "isArchived") ?? false,
    authorId: readField<string>(row, "author_id", "authorId") ?? "",
    parentPageId: readField<string | null>(row, "parent_page_id", "parentPageId") ?? null,
    tags: (row.tags as string[]) ?? [],
    views: (row.views as number) ?? 0,
    content: (row.content as string) ?? "[]",
    createdAt: toDate(readField<string | Date>(row, "created_at", "createdAt")),
    updatedAt: toDate(readField<string | Date>(row, "updated_at", "updatedAt")),
    publishedAt: readField<string | Date | null>(row, "published_at", "publishedAt")
      ? toDate(readField<string | Date>(row, "published_at", "publishedAt"))
      : null,
  };
}

export async function createPage(authorId: string, parentPageId?: string): Promise<Page> {
  const now = new Date().toISOString();
  const payload = {
    title: "Untitled",
    slug: "",
    icon: "📄",
    cover_image: null,
    description: "",
    is_published: false,
    is_archived: false,
    author_id: authorId,
    parent_page_id: parentPageId ?? null,
    tags: [],
    views: 0,
    content: "[]",
    created_at: now,
    updated_at: now,
    published_at: null,
  };

  const { data, error } = await db().from(PAGES).insert(payload).select("*").single();

  if (error) throw new Error(error.message);
  return pageFromRow(data as DbRow);
}

export async function getPage(pageId: string): Promise<Page | null> {
  const { data, error } = await db().from(PAGES).select("*").eq("id", pageId).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return pageFromRow(data as DbRow);
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const { data, error } = await db()
    .from(PAGES)
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return pageFromRow(data as DbRow);
}

export async function getPublishedPages(): Promise<Page[]> {
  const { data, error } = await db()
    .from(PAGES)
    .select("*")
    .eq("is_published", true)
    .eq("is_archived", false)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: DbRow) => pageFromRow(row));
}

export async function getUserPages(authorId: string): Promise<Page[]> {
  const { data, error } = await db()
    .from(PAGES)
    .select("*")
    .eq("author_id", authorId)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: DbRow) => pageFromRow(row));
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
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.coverImage !== undefined) updateData.cover_image = data.coverImage;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isPublished !== undefined) updateData.is_published = data.isPublished;
  if (data.isArchived !== undefined) updateData.is_archived = data.isArchived;
  if (data.authorId !== undefined) updateData.author_id = data.authorId;
  if (data.parentPageId !== undefined) updateData.parent_page_id = data.parentPageId;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.views !== undefined) updateData.views = data.views;
  if (data.content !== undefined) updateData.content = data.content;

  if (data.title && !data.slug) {
    updateData.slug = `${slugify(data.title)}-${pageId.slice(0, 6)}`;
  }

  if (data.isPublished === true) {
    updateData.published_at = new Date().toISOString();
  }

  const { error } = await db().from(PAGES).update(updateData).eq("id", pageId);
  if (error) throw new Error(error.message);
}

export async function deletePage(pageId: string): Promise<void> {
  const { error } = await db().from(PAGES).delete().eq("id", pageId);
  if (error) throw new Error(error.message);
}

export async function archivePage(pageId: string): Promise<void> {
  const { error } = await db()
    .from(PAGES)
    .update({
      is_archived: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId);

  if (error) throw new Error(error.message);
}
