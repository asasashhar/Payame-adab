import { db } from "@/lib/db";
import { queueMail, type MailKind } from "@/lib/mailer";

type ContentItem = {
  id: string;
  title: string;
  status?: string;
  feedback?: string | null;
  userId?: string | null;
};

export function authorDisplay(user: { name: string; penName: string | null } | null, fallback?: string | null): string {
  return user?.penName || user?.name || fallback || "مصنف";
}

/**
 * Fires the correct editorial email for a moderation status change.
 * Reads the author's user record (if the content belongs to one) and queues
 * the notification with the admin's personal message. Never throws.
 */
export async function notifyModeration(opts: {
  kind: MailKind;
  item: ContentItem;
  resourceType: "poem" | "article" | "news";
  authorFallback?: string | null;
  suggestions?: string | null;
  resubmitAllowed?: boolean;
  url?: string;
}) {
  try {
    if (!opts.item.userId) return; // admin-created content without account → no email
    const user = await db.user.findUnique({
      where: { id: opts.item.userId },
      select: { email: true, name: true, penName: true, emailVerified: true },
    });
    if (!user?.email) return;
    await queueMail({
      kind: opts.kind,
      to: user.email,
      data: {
        authorName: authorDisplay(user, opts.authorFallback),
        title: opts.item.title,
        reason: opts.item.feedback ?? undefined,
        suggestions: opts.suggestions ?? undefined,
        resubmitAllowed: opts.resubmitAllowed,
        url: opts.url,
      },
      relatedType: opts.resourceType,
      relatedId: opts.item.id,
    });
  } catch { /* email must never break moderation */ }
}

/** Public URL of a published content item (for email links). */
export function contentUrl(resourceType: "poem" | "article" | "news", id: string, siteUrl: string): string {
  const path = resourceType === "poem" ? "poetry" : resourceType === "news" ? "news" : "articles";
  return `${siteUrl}/${path}/${id}`;
}
