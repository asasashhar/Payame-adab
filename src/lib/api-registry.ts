/* Generic resource registry for the admin/content API.
 * Each resource: prisma model, public read rule, writer role, writable fields with types.
 */
import type { PrismaClient } from "@prisma/client";

export type FieldType = "string" | "text" | "bool" | "int" | "date";
export type ResourceDef = {
  model: string;
  publicRead: boolean;
  publicWhere?: Record<string, unknown>;
  write: "admin";
  fields: Record<string, FieldType>;
  searchFields?: string[];
};

export const REGISTRY: Record<string, ResourceDef> = {
  news: {
    model: "news",
    publicRead: true,
    publicWhere: { status: "PUBLISHED" },
    write: "admin",
    fields: {
      title: "string", excerpt: "string", content: "text", sourceName: "string",
      category: "string", authorName: "string", coverUrl: "string",
      topicImageUrl: "string", tags: "string", status: "string",
      feedback: "text", featured: "bool", publishAt: "date",
    },
    searchFields: ["title", "excerpt", "content", "sourceName"],
  },
  books: {
    model: "book",
    publicRead: true,
    write: "admin",
    fields: {
      title: "string", author: "string", translator: "string", category: "string",
      description: "text", coverUrl: "string", year: "string", pages: "string",
      featured: "bool",
    },
    searchFields: ["title", "author", "description"],
  },
  poets: {
    model: "poet",
    publicRead: true,
    write: "admin",
    fields: {
      name: "string", takhallus: "string", photoUrl: "string", bio: "text",
      era: "string", style: "text", works: "text", awards: "text", featured: "bool",
    },
    searchFields: ["name", "takhallus", "bio"],
  },
  newspaper: {
    model: "newspaperEdition",
    publicRead: true,
    publicWhere: { published: true },
    write: "admin",
    fields: {
      title: "string", editionNumber: "string", weekLabel: "string",
      pdfUrl: "string", coverUrl: "string", notes: "text", published: "bool",
    },
    searchFields: ["title", "weekLabel"],
  },
  words: {
    model: "wordOfDay",
    publicRead: true,
    publicWhere: { active: true },
    write: "admin",
    fields: {
      word: "string", meaning: "string", englishMeaning: "string",
      synonyms: "string", antonyms: "string", example: "text", usage: "text",
      active: "bool",
    },
    searchFields: ["word", "meaning"],
  },
  shers: {
    model: "dailySher",
    publicRead: true,
    publicWhere: { active: true },
    write: "admin",
    fields: { text: "text", poetName: "string", active: "bool" },
    searchFields: ["text", "poetName"],
  },
  competitions: {
    model: "competition",
    publicRead: true,
    publicWhere: { active: true },
    write: "admin",
    fields: {
      title: "string", description: "text", rules: "text",
      startDate: "date", endDate: "date", posterUrl: "string",
      posterSize: "string", active: "bool", resultNote: "text",
    },
    searchFields: ["title", "description"],
  },
  events: {
    model: "event",
    publicRead: true,
    write: "admin",
    fields: {
      title: "string", description: "text", date: "date", time: "string",
      venue: "string", eventType: "string", posterUrl: "string", posterSize: "string",
    },
    searchFields: ["title", "description"],
  },
  banners: {
    model: "banner",
    publicRead: true,
    publicWhere: { active: true },
    write: "admin",
    fields: {
      title: "string", imageUrl: "string", linkUrl: "string",
      position: "string", recommendedSize: "string", active: "bool", sortOrder: "int",
    },
    searchFields: ["title"],
  },
  qafiya: {
    model: "qafiyaEntry",
    publicRead: true,
    write: "admin",
    fields: {
      word: "string", meaning: "string", pattern: "string",
      notes: "text", rhymes: "text",
    },
    searchFields: ["word", "meaning", "pattern", "rhymes"],
  },
  behrs: {
    model: "behr",
    publicRead: true,
    write: "admin",
    fields: {
      name: "string", nameEn: "string", arkan: "string",
      pattern: "string", example: "text", notes: "text",
    },
    searchFields: ["name", "arkan"],
  },
  users: {
    model: "user",
    publicRead: false,
    write: "admin",
    fields: {
      name: "string", penName: "string", bio: "text", photoUrl: "string",
      role: "string", status: "string",
    },
    searchFields: ["name", "email", "penName"],
  },
};

type Delegate = {
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  findUnique: (args: Record<string, unknown>) => Promise<unknown>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  delete: (args: Record<string, unknown>) => Promise<unknown>;
  count: (args?: Record<string, unknown>) => Promise<number>;
};

export function getDelegate(db: PrismaClient, model: string): Delegate {
   
  return (db as unknown as Record<string, Delegate>)[model];
}

export function coerceFields(
  def: ResourceDef,
  body: Record<string, unknown>,
  allowed?: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, type] of Object.entries(def.fields)) {
    if (allowed && !allowed.includes(key)) continue;
    if (!(key in body)) continue;
    const v = body[key];
    if (v === undefined) continue;
    switch (type) {
      case "bool": out[key] = v === true || v === "true" || v === 1; break;
      case "int": out[key] = v === null || v === "" ? null : Number(v); break;
      case "date": out[key] = v === null || v === "" ? null : new Date(v as string); break;
      default:
        out[key] = v === null ? null : String(v);
    }
  }
  return out;
}
