import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/supabase/firestore";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/helpers";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let page = null;
  try {
    page = await getPageBySlug(slug);
  } catch {
    // Supabase may not be configured
  }

  if (!page) {
    return { title: "Not Found" };
  }

  return {
    title: page.title,
    description: page.description || `${page.title} - Notion Blog`,
    openGraph: {
      title: page.title,
      description: page.description || page.title,
      type: "article",
      ...(page.coverImage && { images: [{ url: page.coverImage }] }),
      ...(page.publishedAt && {
        publishedTime: page.publishedAt.toISOString(),
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description || page.title,
      ...(page.coverImage && { images: [page.coverImage] }),
    },
  };
}

export const revalidate = 60;

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  let page = null;
  try {
    page = await getPageBySlug(slug);
  } catch {
    // Supabase may not be configured
  }

  if (!page || !page.isPublished) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            블로그로 돌아가기
          </Link>
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
            <span className="text-base">✏️</span>
            Notion Blog
          </Link>
        </div>
      </header>

      <article>
        {/* Cover Image */}
        {page.coverImage && (
          <div className="w-full h-48 md:h-72 overflow-hidden">
            <img
              src={page.coverImage}
              alt={page.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 md:px-12 py-8 md:py-12">
          {/* Icon & Title */}
          <div className="mb-6">
            <span className="text-5xl md:text-6xl block mb-3">{page.icon}</span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              {page.title}
            </h1>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b">
            <span className="text-sm text-muted-foreground">
              {page.publishedAt
                ? formatDate(page.publishedAt)
                : formatDate(page.createdAt)}
            </span>
            {page.tags.length > 0 && (
              <div className="flex gap-1">
                {page.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Block Content */}
          <BlogPostContent content={page.content} />
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Notion Blog
          </p>
        </div>
      </footer>
    </div>
  );
}
