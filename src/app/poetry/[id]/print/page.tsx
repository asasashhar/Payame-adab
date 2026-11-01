import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings, watermarkFromSettings } from "@/lib/site";
import { PaginatedDocument, type DocBlock } from "@/components/print/paginated-doc";

export const dynamic = "force-dynamic";
export const metadata = { title: "PDF پیش منظر" };

export default async function PoemPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [poem, settings] = await Promise.all([
    db.poem.findUnique({
      where: { id },
      include: { user: { select: { penName: true, name: true } } },
    }),
    getSettings(),
  ]);
  if (!poem) notFound();

  const wm = watermarkFromSettings(settings);
  const watermarkConfig = wm.enabled && wm.types.includes("poem") ? { ...wm, position: "center" as const } : null;

  const author = poem.poetName ?? poem.user?.penName ?? poem.user?.name ?? "";
  const blocks: DocBlock[] = poem.content
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((couplet) => ({ type: "couplet" as const, text: couplet.trim() }));

  return (
    <div className="min-h-screen bg-secondary/60 py-8">
      <PaginatedDocument
        title={poem.title}
        authorName={author}
        categoryLabel={poem.category}
        blocks={blocks}
        watermarkConfig={watermarkConfig}
      />
    </div>
  );
}
