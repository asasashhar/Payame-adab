import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings, watermarkFromSettings } from "@/lib/site";
import { PaginatedDocument, type DocBlock } from "@/components/print/paginated-doc";

export const dynamic = "force-dynamic";
export const metadata = { title: "PDF پیش منظر" };

export default async function ArticlePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [article, settings] = await Promise.all([
    db.article.findUnique({
      where: { id },
      include: { user: { select: { penName: true, name: true } } },
    }),
    getSettings(),
  ]);
  if (!article) notFound();

  const wm = watermarkFromSettings(settings);
  const watermarkConfig = wm.enabled && wm.types.includes("article") ? { ...wm, position: "center" as const } : null;

  const author = article.authorName ?? article.user?.penName ?? article.user?.name ?? "";
  const blocks: DocBlock[] = [];
  if (article.excerpt) blocks.push({ type: "paragraph", text: article.excerpt });
  for (const para of article.content.split(/\n{2,}/).filter(Boolean)) {
    blocks.push({ type: "paragraph", text: para.trim() });
  }

  return (
    <div className="min-h-screen bg-secondary/60 py-8">
      <PaginatedDocument
        title={article.title}
        authorName={author}
        categoryLabel={article.category}
        blocks={blocks}
        watermarkConfig={watermarkConfig}
      />
    </div>
  );
}
