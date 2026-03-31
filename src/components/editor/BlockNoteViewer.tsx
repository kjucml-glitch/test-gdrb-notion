"use client";

import { useMemo } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import "@blocknote/shadcn/style.css";

interface BlockNoteViewerProps {
  content: string;
}

export function BlockNoteViewer({ content }: BlockNoteViewerProps) {
  const { resolvedTheme } = useTheme();

  const parsedContent = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [content]);

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
  });

  return (
    <div className="notion-viewer">
      <BlockNoteView
        editor={editor}
        editable={false}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  );
}
