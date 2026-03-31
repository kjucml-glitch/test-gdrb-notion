export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BlockType =
  | "paragraph"
  | "heading"
  | "bulletListItem"
  | "numberedListItem"
  | "checkListItem"
  | "image"
  | "codeBlock"
  | "table"
  | "file"
  | "video"
  | "audio";

export interface Page {
  id: string;
  title: string;
  slug: string;
  icon: string;
  coverImage: string | null;
  description: string;
  isPublished: boolean;
  isArchived: boolean;
  authorId: string;
  parentPageId: string | null;
  tags: string[];
  views: number;
  content: string; // BlockNote JSON string
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface SidebarPage {
  id: string;
  title: string;
  icon: string;
  parentPageId: string | null;
  isPublished: boolean;
  children?: SidebarPage[];
}
