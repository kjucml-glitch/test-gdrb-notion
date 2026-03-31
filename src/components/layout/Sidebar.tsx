"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import {
  getUserSidebarPages,
  createPage,
} from "@/lib/firebase/firestore";
import { logoutUser } from "@/lib/firebase/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Search,
  Settings,
  Trash2,
  FileText,
  MoreHorizontal,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Star,
  Clock,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { SidebarPage } from "@/types";
import { cn } from "@/lib/utils";
import { archivePage } from "@/lib/firebase/firestore";
import { toast } from "sonner";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isOpen, toggle } = useSidebarStore();
  const { theme, setTheme } = useTheme();

  const [pages, setPages] = useState<SidebarPage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const p = await getUserSidebarPages(user.id);
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

  const handleCreatePage = async () => {
    if (!user) return;
    try {
      const page = await createPage(user.id);
      await loadPages();
      router.push(`/admin/${page.id}`);
    } catch {
      toast.error("페이지 생성에 실패했습니다.");
    }
  };

  const handleArchivePage = async (pageId: string) => {
    try {
      await archivePage(pageId);
      await loadPages();
      toast.success("페이지가 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/login");
    } catch {
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  const filteredPages = pages.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rootPages = filteredPages.filter((p) => !p.parentPageId);

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-sidebar-background border-r border-sidebar-border transition-all duration-200 ease-in-out shrink-0",
        isOpen ? "w-60" : "w-0 overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-3 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold hover:bg-sidebar-accent transition-colors truncate">
              <span className="text-lg">✏️</span>
              <span className="truncate">{user?.displayName || "My Blog"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {theme === "dark" ? "라이트 모드" : "다크 모드"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggle}>
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">사이드바 닫기</TooltipContent>
        </Tooltip>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="검색..."
            className="h-8 pl-8 text-sm bg-sidebar-accent border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Quick Actions */}
      <div className="px-2 py-2 space-y-0.5">
        <button
          onClick={() => router.push("/admin")}
          className={cn(
            "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent transition-colors",
            pathname === "/admin" && "bg-sidebar-accent font-medium"
          )}
        >
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>최근 페이지</span>
        </button>
        <button
          onClick={() => router.push("/admin/settings")}
          className={cn(
            "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent transition-colors",
            pathname === "/admin/settings" && "bg-sidebar-accent font-medium"
          )}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span>설정</span>
        </button>
      </div>

      <Separator />

      {/* Pages */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          페이지
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCreatePage}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>새 페이지</TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1 px-2">
        {loading && pages.length === 0 ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 bg-sidebar-accent rounded animate-pulse" />
            ))}
          </div>
        ) : rootPages.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "검색 결과가 없습니다" : "페이지가 없습니다"}
            </p>
            {!searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={handleCreatePage}
              >
                <Plus className="h-3 w-3 mr-1" />
                첫 페이지 만들기
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5 pb-4">
            {rootPages.map((page) => (
              <PageItem
                key={page.id}
                page={page}
                pathname={pathname}
                onNavigate={(id) => router.push(`/admin/${id}`)}
                onArchive={handleArchivePage}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Bottom: New Page */}
      <Separator />
      <div className="p-2 shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleCreatePage}
        >
          <Plus className="mr-2 h-4 w-4" />
          새 페이지
        </Button>
      </div>
    </aside>
  );
}

function PageItem({
  page,
  pathname,
  onNavigate,
  onArchive,
}: {
  page: SidebarPage;
  pathname: string;
  onNavigate: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const isActive = pathname === `/admin/${page.id}`;

  return (
    <div className="group">
      <div
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-sm cursor-pointer transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
        )}
      >
        <button
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          onClick={() => onNavigate(page.id)}
        >
          <span className="shrink-0 text-base">{page.icon}</span>
          <span className="truncate">{page.title || "Untitled"}</span>
        </button>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {page.isPublished && (
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1" />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-sidebar-accent">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(page.id);
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
    </div>
  );
}
