"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { getUserPages, createPage, archivePage } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  FileText,
  Globe,
  GlobeLock,
} from "lucide-react";
import type { Page } from "@/types";
import { formatRelativeDate } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const loadPages = useCallback(async () => {
    if (!user) return;
    try {
      const p = await getUserPages(user.id);
      setPages(p);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleNewPage = async () => {
    if (!user) return;
    try {
      const page = await createPage(user.id);
      router.push(`/admin/${page.id}`);
    } catch {
      toast.error("페이지 생성에 실패했습니다.");
    }
  };

  const handleArchive = async (pageId: string) => {
    try {
      await archivePage(pageId);
      setPages((prev) => prev.filter((p) => p.id !== pageId));
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const filteredPages = pages
    .filter((p) => {
      if (filter === "published") return p.isPublished;
      if (filter === "draft") return !p.isPublished;
      return true;
    })
    .filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">모든 페이지</h1>
          <p className="text-sm text-muted-foreground mt-1">
            총 {pages.length}개의 페이지
          </p>
        </div>
        <Button onClick={handleNewPage}>
          <Plus className="h-4 w-4 mr-2" />
          새 페이지
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="페이지 검색..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all" ? "전체" : f === "published" ? "게시됨" : "초안"}
            </button>
          ))}
        </div>
      </div>

      {/* Page List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {search ? "검색 결과가 없습니다" : "아직 페이지가 없습니다"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {search
              ? "다른 키워드로 검색해보세요."
              : "새 페이지를 만들어 블로그를 시작하세요!"}
          </p>
          {!search && (
            <Button onClick={handleNewPage}>
              <Plus className="h-4 w-4 mr-2" />
              첫 페이지 만들기
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className="group flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/admin/${page.id}`)}
            >
              <span className="text-2xl shrink-0">{page.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {page.title || "Untitled"}
                  </span>
                  {page.isPublished ? (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <Globe className="h-3 w-3 mr-1" />
                      게시됨
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs shrink-0">
                      <GlobeLock className="h-3 w-3 mr-1" />
                      초안
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeDate(page.updatedAt)}에 수정됨
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {page.isPublished && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/${page.slug || page.id}`, "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(page.id);
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
          ))}
        </div>
      )}
    </div>
  );
}
