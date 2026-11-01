import Link from "next/link";
import { BookOpen, Eye, Feather, Newspaper, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_URDU } from "@/lib/site";

export type PoemItem = {
  id: string; title: string; content: string; category: string;
  poetName?: string | null; user?: { id: string; name: string; penName: string | null } | null;
  views?: number; createdAt?: string | Date; coverUrl?: string | null; topicImageUrl?: string | null;
};
export type ArticleItem = {
  id: string; title: string; excerpt?: string | null; content: string; category: string;
  authorName?: string | null; views?: number; createdAt?: string | Date;
  coverUrl?: string | null; topicImageUrl?: string | null;
};
export type BookItem = {
  id: string; title: string; author: string; category: string;
  description?: string | null; coverUrl?: string | null; year?: string | null; views?: number;
};

/** First 2 couplets / first lines of a poem for previews. */
export function poemPreview(content: string, lines = 2): string {
  const couplets = content.split(/\n\s*\n/).filter(Boolean);
  if (couplets.length > 1) return couplets.slice(0, lines).join("\n");
  const ls = content.split(/\n/).filter(Boolean);
  return ls.slice(0, lines * 2 + 1).join("\n");
}

export function excerptPreview(text: string, words = 42): string {
  const clean = (text ?? "").replace(/[#*_>]/g, "").replace(/\s+/g, " ").trim();
  const parts = clean.split(" ");
  return parts.length > words ? parts.slice(0, words).join(" ") + "…" : clean;
}

export function authorLabel(item: PoemItem | ArticleItem): string {
  if ("poetName" in item && item.poetName) return item.poetName;
  if ("authorName" in item && item.authorName) return item.authorName;
  if ("user" in item && item.user) return item.user.penName || item.user.name;
  return "گمنام";
}

function Thumb({ url, alt, icon, tall = false }: { url?: string | null; alt: string; icon: React.ReactNode; tall?: boolean }) {
  if (url) {
    return (
       
      <img src={url} alt={alt} className={cn("w-full object-cover", tall ? "h-52" : "h-44")} loading="lazy" />
    );
  }
  return (
    <div className={cn("flex w-full items-center justify-center bg-secondary", tall ? "h-52" : "h-44")}>
      <div className="flex flex-col items-center gap-1.5 text-gold">
        {icon}
      </div>
    </div>
  );
}

export function PoemCard({ poem, badge, showViews = true }: { poem: PoemItem; badge?: string; showViews?: boolean }) {
  return (
    <article className="group manuscript-frame flex h-full flex-col overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-lg">
      <Link href={`/poetry/${poem.id}`} className="relative block">
        <Thumb url={poem.coverUrl || poem.topicImageUrl} alt={poem.title} icon={<Feather className="h-9 w-9" />} />
        <span className="absolute start-2 top-2 rounded-full bg-emerald-deep/90 px-2.5 py-0.5 text-[11px] font-naskh text-[#f3ead2]">
          {badge || poem.category}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/poetry/${poem.id}`}>
          <h3 className="font-nastaliq-tight text-xl leading-9 text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {poem.title}
          </h3>
        </Link>
        <p className="mt-1.5 flex-1 whitespace-pre-line font-nastaliq text-[15px] leading-8 text-foreground/75 line-clamp-3">
          {poemPreview(poem.content)}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-gold/20 pt-2.5 text-xs text-muted-foreground">
          <Link
            href={"poetId" in poem && (poem as { poetId?: string }).poetId ? `/poets/${(poem as { poetId?: string }).poetId}` : `/search?q=${encodeURIComponent(authorLabel(poem))}`}
            className="font-naskh font-semibold text-primary/90 hover:text-gold"
          >
            {authorLabel(poem)}
          </Link>
          {showViews && (
            <span className="inline-flex items-center gap-1 font-latin">
              <Eye className="h-3.5 w-3.5" /> {poem.views ?? 0}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ArticleCard({ article, badge, showViews = true }: { article: ArticleItem; badge?: string; showViews?: boolean }) {
  return (
    <article className="group manuscript-frame flex h-full flex-col overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-lg">
      <Link href={`/articles/${article.id}`} className="relative block">
        <Thumb url={article.coverUrl || article.topicImageUrl} alt={article.title} icon={<BookOpen className="h-9 w-9" />} />
        <span className="absolute start-2 top-2 rounded-full bg-emerald-deep/90 px-2.5 py-0.5 text-[11px] font-naskh text-[#f3ead2]">
          {badge || article.category}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/articles/${article.id}`}>
          <h3 className="font-nastaliq-tight text-xl leading-9 text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
        </Link>
        <p className="mt-1.5 flex-1 text-[15px] leading-8 text-foreground/75 font-naskh line-clamp-3">
          {excerptPreview(article.excerpt || article.content)}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-gold/20 pt-2.5 text-xs text-muted-foreground">
          <span className="font-naskh font-semibold text-primary/90">{authorLabel(article)}</span>
          {showViews && (
            <span className="inline-flex items-center gap-1 font-latin">
              <Eye className="h-3.5 w-3.5" /> {article.views ?? 0}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function BookCard({ book, showViews = true }: { book: BookItem; showViews?: boolean }) {
  return (
    <article className="group manuscript-frame flex h-full flex-col overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-lg">
      <Link href={`/books/${book.id}`} className="relative block">
        <Thumb url={book.coverUrl} alt={book.title} icon={<BookOpen className="h-9 w-9" />} tall />
        <span className="absolute start-2 top-2 rounded-full bg-emerald-deep/90 px-2.5 py-0.5 text-[11px] font-naskh text-[#f3ead2]">
          {book.category}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/books/${book.id}`}>
          <h3 className="font-nastaliq-tight text-xl leading-9 text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {book.title}
          </h3>
        </Link>
        <p className="text-[15px] font-naskh text-gold">{book.author}</p>
        <p className="mt-1.5 flex-1 text-[15px] leading-8 text-foreground/70 font-naskh line-clamp-3">
          {excerptPreview(book.description ?? "", 30)}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-gold/20 pt-2.5 text-xs text-muted-foreground">
          <span className="font-latin">{book.year || ""}</span>
          {showViews && (
            <span className="inline-flex items-center gap-1 font-latin">
              <Eye className="h-3.5 w-3.5" /> {book.views ?? 0}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function PosterCard({
  title, description, posterUrl, meta, resultNote,
}: {
  title: string; description: string; posterUrl?: string | null;
  meta?: React.ReactNode; resultNote?: string | null;
}) {
  return (
    <article className="group manuscript-frame flex h-full flex-col overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-lg">
      <div className="relative">
        {posterUrl ? (
           
          <img src={posterUrl} alt={title} className="h-64 w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-2 pattern-emerald text-center">
            <Feather className="h-8 w-8 text-[#d9bc6a]" />
            <p className="px-6 font-nastaliq-tight text-xl leading-8 text-[#f3ead2]">{title}</p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-nastaliq-tight text-xl leading-9 text-foreground">{title}</h3>
        <p className="mt-1 flex-1 text-[15px] leading-8 text-foreground/75 font-naskh line-clamp-3">
          {excerptPreview(description, 28)}
        </p>
        {meta && <div className="mt-3 text-xs text-muted-foreground">{meta}</div>}
        {resultNote && (
          <p className="mt-2 rounded-md bg-accent px-3 py-2 text-xs font-naskh text-primary">{resultNote}</p>
        )}
      </div>
    </article>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PENDING: "bg-[#fdf3d7] text-[#8a6d1a]",
    REVISION: "bg-[#fde8cf] text-[#9a5b1f]",
    APPROVED: "bg-[#e3f0e6] text-[#2f6d46]",
    PUBLISHED: "bg-emerald-deep/10 text-emerald-deep",
    REJECTED: "bg-[#fbe4e4] text-[#a03333]",
    SCHEDULED: "bg-[#e4ecfb] text-[#2a4d8f]",
    ARCHIVED: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-naskh", styles[status] ?? "bg-muted")}>
      {STATUS_URDU[status] ?? status}
    </span>
  );
}
