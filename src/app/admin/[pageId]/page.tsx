"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useEditorStore } from "@/stores/editorStore";
import { getPage, updatePage } from "@/lib/firebase/firestore";
import { uploadCoverImage } from "@/lib/firebase/storage";
import { BlockNoteEditor } from "@/components/editor/BlockNoteEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ImagePlus,
  Smile,
  MoreHorizontal,
  Globe,
  GlobeLock,
  Trash2,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import type { Page } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { use } from "react";

export default function EditorPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const { setSaving, setLastSaved, setCurrentPageId } = useEditorStore();

  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📄");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setCurrentPageId(pageId);
    return () => setCurrentPageId(null);
  }, [pageId, setCurrentPageId]);

  useEffect(() => {
    async function load() {
      try {
        const p = await getPage(pageId);
        if (!p) {
          router.push("/admin");
          return;
        }
        setPage(p);
        setTitle(p.title === "Untitled" ? "" : p.title);
        setIcon(p.icon);
        setCoverImage(p.coverImage);
        setIsPublished(p.isPublished);
      } catch {
        toast.error("페이지를 불러올 수 없습니다.");
        router.push("/admin");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pageId, router]);

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      setSaving(true);
      try {
        await updatePage(pageId, { [field]: value } as Partial<Page>);
        setLastSaved(new Date());
      } catch {
        toast.error("저장에 실패했습니다.");
      }
    },
    [pageId, setSaving, setLastSaved]
  );

  const debouncedSaveTitle = useCallback(
    (newTitle: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveField("title", newTitle || "Untitled");
      }, 1000);
    },
    [saveField]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTitle(val);
    debouncedSaveTitle(val);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Focus the editor
      const editor = document.querySelector(".bn-editor") as HTMLElement;
      editor?.focus();
    }
  };

  const handleContentChange = useCallback(
    (content: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setSaving(true);
        updatePage(pageId, { content })
          .then(() => setLastSaved(new Date()))
          .catch(() => toast.error("저장에 실패했습니다."));
      }, 1500);
    },
    [pageId, setSaving, setLastSaved]
  );

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadCoverImage(file, pageId);
      setCoverImage(url);
      await updatePage(pageId, { coverImage: url });
      toast.success("커버 이미지가 업로드되었습니다.");
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
    }
  };

  const handlePublishToggle = async () => {
    const next = !isPublished;
    setIsPublished(next);
    await saveField("isPublished", next);
    toast.success(next ? "게시되었습니다!" : "게시 취소되었습니다.");
  };

  const handleIconSelect = async (emoji: string) => {
    setIcon(emoji);
    setShowIconPicker(false);
    await saveField("icon", emoji);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-12 py-16 space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-12 w-96" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Cover Image */}
      {coverImage ? (
        <div className="relative group w-full h-48 md:h-64 bg-muted overflow-hidden">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <label className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="secondary" className="cursor-pointer">
              커버 변경
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : null}

      {/* Content Area */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-8">
        {/* Controls row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {!coverImage && (
              <label>
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs cursor-pointer">
                  <ImagePlus className="h-3.5 w-3.5 mr-1" />
                  커버 추가
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SaveStatus />
            <Button
              size="sm"
              variant={isPublished ? "outline" : "default"}
              onClick={handlePublishToggle}
            >
              {isPublished ? (
                <>
                  <Globe className="h-3.5 w-3.5 mr-1" />
                  게시됨
                </>
              ) : (
                <>
                  <GlobeLock className="h-3.5 w-3.5 mr-1" />
                  게시하기
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isPublished && page && (
                  <DropdownMenuItem
                    onClick={() => {
                      const slug = page.slug || page.id;
                      navigator.clipboard.writeText(
                        `${window.location.origin}/${slug}`
                      );
                      toast.success("링크가 복사되었습니다.");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    링크 복사
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await updatePage(pageId, { isArchived: true });
                    router.push("/admin");
                    toast.success("삭제되었습니다.");
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Icon */}
        <div className="relative mb-2">
          <button
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="text-5xl md:text-6xl hover:opacity-80 transition-opacity"
          >
            {icon}
          </button>
          {showIconPicker && (
            <div className="absolute top-full left-0 z-50 mt-2 p-3 bg-popover border rounded-lg shadow-lg grid grid-cols-8 gap-1">
              {[
                "📄", "📝", "📒", "📓", "📕", "📗", "📘", "📙",
                "🎯", "🚀", "💡", "🔥", "⭐", "❤️", "🎨", "🎸",
                "💼", "🌍", "🏠", "🎮", "📷", "🎬", "✈️", "🌟",
                "🤖", "💻", "📱", "🔧", "⚡", "🎵", "📊", "🗂️",
              ].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleIconSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent text-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="제목 없음"
          className="w-full text-4xl md:text-5xl font-bold bg-transparent border-0 outline-none resize-none placeholder:text-muted-foreground/40 leading-tight mb-4"
          rows={1}
          style={{ minHeight: "1.2em" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = target.scrollHeight + "px";
          }}
        />

        {/* Tags */}
        {page?.tags && page.tags.length > 0 && (
          <div className="flex gap-1 mb-4 flex-wrap">
            {page.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Block Editor */}
        <BlockNoteEditor
          initialContent={page?.content || "[]"}
          onChange={handleContentChange}
          pageId={pageId}
        />
      </div>
    </div>
  );
}

function SaveStatus() {
  const { isSaving, lastSaved } = useEditorStore();

  if (isSaving) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
        저장 중...
      </span>
    );
  }

  if (lastSaved) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Check className="h-3 w-3 text-green-500" />
        저장됨
      </span>
    );
  }

  return null;
}
