"use client";

import { BlockNoteViewer } from "@/components/editor/BlockNoteViewer";

interface BlogPostContentProps {
  content: string;
}

export function BlogPostContent({ content }: BlogPostContentProps) {
  return <BlockNoteViewer content={content} />;
}
