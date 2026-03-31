"use client";

import { useCallback, useMemo } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import "@blocknote/shadcn/style.css";
import { uploadBlockImage } from "@/lib/firebase/storage";

interface BlockNoteEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  pageId: string;
  editable?: boolean;
}

export function BlockNoteEditor({
  initialContent,
  onChange,
  pageId,
  editable = true,
}: BlockNoteEditorProps) {
  const { resolvedTheme } = useTheme();

  const parsedContent = useMemo(() => {
    try {
      const parsed = JSON.parse(initialContent);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [initialContent]);

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
    uploadFile: async (file: File) => {
      const url = await uploadBlockImage(file, pageId);
      return url;
    },
  });

  const handleChange = useCallback(() => {
    const content = JSON.stringify(editor.document);
    onChange(content);
  }, [editor, onChange]);

  return (
    <div className="notion-editor -mx-12">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        data-theming-css-variables-demo
      />
    </div>
  );
}
