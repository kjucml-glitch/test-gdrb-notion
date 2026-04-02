import Link from "next/link";
import { getPublishedPages } from "@/lib/supabase/firestore";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/helpers";
import { ArrowRight } from "lucide-react";
import type { Page } from "@/types";

export const revalidate = 60;

export default async function BlogHome() {
  let pages: Page[] = [];
  try {
    pages = await getPublishedPages();
  } catch {
    // Supabase may not be configured yet
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="text-xl">✏️</span>
            Notion Blog
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              로그인
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            블로그
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            생각과 아이디어를 기록하고 공유합니다.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          {pages.length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">
                아직 게시된 글이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {pages.map((page) => (
                <PostCard key={page.id} page={page} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Notion Blog. Built with Next.js &
            Supabase.
          </p>
        </div>
      </footer>
    </div>
  );
}

function PostCard({ page }: { page: Page }) {
  const slug = page.slug || page.id;

  return (
    <Link
      href={`/${slug}`}
      className="group flex items-start gap-4 p-4 -mx-4 rounded-lg hover:bg-muted/50 transition-colors"
    >
      {/* Cover thumbnail */}
      {page.coverImage && (
        <div className="hidden sm:block w-32 h-20 rounded-md overflow-hidden bg-muted shrink-0">
          <img
            src={page.coverImage}
            alt={page.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <span className="text-xl shrink-0">{page.icon}</span>
          <h2 className="text-lg font-semibold group-hover:text-primary/80 transition-colors line-clamp-1">
            {page.title}
          </h2>
        </div>
        {page.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2 ml-7">
            {page.description}
          </p>
        )}
        <div className="flex items-center gap-2 ml-7">
          <span className="text-xs text-muted-foreground">
            {page.publishedAt ? formatDate(page.publishedAt) : formatDate(page.createdAt)}
          </span>
          {page.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <ArrowRight className="h-5 w-5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0 mt-2" />
    </Link>
  );
}
