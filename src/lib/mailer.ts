import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/site";

export type MailKind =
  | "PUBLISHED" | "APPROVED" | "REJECTED" | "REVISION" | "PENDING"
  | "VERIFY" | "RESET" | "TEST";

const SITE_FALLBACK = "پیامِ ادب";

const GREEN = "#0e5b43";
const GOLD = "#b8922e";
const CREAM = "#f7f1e1";

function shell(title: string, bodyHtml: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ur" dir="rtl"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#efe9d8;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Noto Naskh Arabic',serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border:1px solid ${GOLD}55;border-radius:14px;overflow:hidden;">
    <div style="background:${GREEN};padding:18px 24px;text-align:center;">
      <span style="color:#f3ead2;font-size:22px;">پیامِ ادب</span>
      <span style="color:#d9bc6a;font-size:13px;"> — Payam-e-Adab</span>
    </div>
    <div style="padding:28px 30px;color:#242424;line-height:2.1;font-size:16px;">
      <h2 style="color:${GREEN};font-size:20px;margin:0 0 14px;">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="background:${CREAM};padding:14px 24px;text-align:center;color:#7a6a3f;font-size:12px;">
      پیامِ ادب — اردو ادب، روایت سے نئی نسل تک${siteUrl ? ` · <a href="${siteUrl}" style="color:${GREEN};">${siteUrl.replace(/^https?:\/\//, "")}</a>` : ""}
    </div>
  </div>
</body></html>`;
}

function p(t: string): string {
  return `<p style="margin:0 0 12px;">${t}</p>`;
}

function reasonBox(reason: string): string {
  return `<div style="background:#fdf6e3;border:1px solid ${GOLD}66;border-radius:10px;padding:14px 18px;margin:0 0 12px;">
    <p style="margin:0;white-space:pre-line;">${reason}</p>
  </div>`;
}

function linkBtn(url: string, label: string): string {
  return `<p style="margin:16px 0 4px;"><a href="${url}" style="display:inline-block;background:${GREEN};color:#f3ead2;text-decoration:none;padding:10px 26px;border-radius:8px;font-size:15px;">${label}</a></p>`;
}

export type MailTemplateData = {
  authorName: string;
  title: string;
  reason?: string;      // admin's personal message (mandatory for reject/revision)
  suggestions?: string; // improvement suggestions
  resubmitAllowed?: boolean;
  url?: string;         // link of the published work / action link
  siteName?: string;
};

/** Admin-editable template overrides (stored in Setting table). */
export type MailTemplateOverrides = { subject?: string; body?: string };

/** Placeholder tokens usable inside admin-editable templates. */
export const MAIL_PLACEHOLDERS: { token: string; meaning: string }[] = [
  { token: "[مصنف کا نام]", meaning: "مصنف کا رجسٹرڈ نام" },
  { token: "[تحریر کا عنوان]", meaning: "تحریر کا عنوان" },
  { token: "[سائٹ کا نام]", meaning: "ویب سائٹ کا نام" },
  { token: "[لنک]", meaning: "متعلقہ صفحے کا لنک (بٹن کی صورت میں)" },
  { token: "[وجہ]", meaning: "ایڈمن کا ذاتی پیغام / وجہ (خصوصی خانے میں)" },
  { token: "[تجاویز]", meaning: "بہتری کی تجاویز (خصوصی خانے میں)" },
];

function inlineBold(t: string): string {
  // supports **bold** inside admin-written template lines
  return t.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}

function paragraphsFromTemplate(body: string, data: MailTemplateData, site: string, readLink: string): string {
  const linkLabel = data.url ? "اپنی تحریر پڑھیں" : "ویب سائٹ کھولیں";
  const name = data.authorName || "عزیز مصنف";
  const title = data.title || "";
  const html = body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // simple text placeholders first
      let t = line
        .replaceAll("[مصنف کا نام]", name)
        .replaceAll("[تحریر کا عنوان]", title)
        .replaceAll("[سائٹ کا نام]", site);
      let h = inlineBold(t);
      if (h.includes("[لنک]")) {
        const btn = linkBtn(readLink || siteUrl, linkLabel);
        h = h.replace(/\[لنک\]/g, "").trim();
        return (h ? p(h) : "") + (readLink ? btn : "");
      }
      if (h.includes("[وجہ]")) {
        h = h.replace(/\[وجہ\]/g, "").trim();
        const box = reasonBox(data.reason || "(وجہ درج نہیں کی گئی)");
        return (h ? p(h) : "") + box;
      }
      if (h.includes("[تجاویز]")) {
        h = h.replace(/\[تجاویز\]/g, "").trim();
        const box = data.suggestions ? reasonBox(`<b>بہتری کے لیے تجاویز:</b><br/>${data.suggestions}`) : "";
        return (h ? p(h) : "") + box;
      }
      return p(h);
    })
    .join("");
  return html || p("");
}

/** Renders the (kind, data) pair into an Urdu subject + HTML body. */
export function renderMail(
  kind: MailKind,
  data: MailTemplateData,
  siteUrl: string,
  custom?: MailTemplateOverrides
) {
  const name = data.authorName || "عزیز مصنف";
  const title = data.title || "";
  const site = data.siteName || SITE_FALLBACK;
  const readLink = data.url || siteUrl;

  // admin-custom template wins when its body is non-empty
  const customSubject = custom?.subject?.trim() || "";
  const customBody = custom?.body?.trim() || "";
  if (customBody) {
    const filled = paragraphsFromTemplate(customBody, data, site, readLink);
    const heading = customSubject || "ادارتی اطلاع";
    return {
      subject: customSubject || "پیامِ ادب — ادارتی اطلاع",
      html: shell(heading, filled, siteUrl),
    };
  }

  switch (kind) {
    case "PUBLISHED":
      return {
        subject: "آپ کی تحریر پیامِ ادب پر شائع ہو گئی!",
        html: shell(
          "شائع شدہ تحریر",
          `${p(`محترم جناب <b>${name}</b> صاحب،`)}${p("السلام علیکم ورحمۃ اللہ وبرکاتہ!")}${p(
            `ہمیں یہ بتاتے ہوئے بے حد خوشی ہو رہی ہے کہ آپ کی تحریر <b>’’${title}‘‘</b> ${site} پر شائع ہو چکی ہے۔`
          )}${p(
            `${site} کے ادبی سفر میں آپ کی شرکت ہمارے لیے باعثِ مسرت ہے۔ امید ہے کہ آپ کا قلم آئندہ بھی اردو ادب کی خدمت کرتا رہے گا۔`
          )}${p("اللہ تعالیٰ آپ کے قلم کو مزید قوت اور آپ کے فن کو مزید نکھار عطا فرمائے۔")}${
            readLink ? linkBtn(readLink, "اپنی تحریر پڑھیں") : ""
          }${p(`نیک تمناؤں کے ساتھ،<br/><b>ادارتی ٹیم</b><br/>${site}`)}${
            data.reason ? reasonBox(`<b>ادارتی نوٹ:</b><br/>${data.reason}`) : ""
          }`,
          siteUrl
        ),
      };
    case "APPROVED":
      return {
        subject: "آپ کی تحریر منظور کر لی گئی — پیامِ ادب",
        html: shell(
          "منظوری کی خوشخبری",
          `${p(`محترم <b>${name}</b> صاحب، السلام علیکم!`)}${p(
            `آپ کی تحریر <b>’’${title}‘‘</b> ادارتی معائنے کے بعد منظور کر لی گئی ہے۔ ان شاء اللہ جلد ہی یہ ${site} پر شائع ہو جائے گی اور اس کا لنک آپ کو بھیج دیا جائے گا۔`
          )}${data.reason ? reasonBox(`<b>ادارتی نوٹ:</b><br/>${data.reason}`) : ""}${p(`نیک تمناؤں کے ساتھ،<br/><b>ادارتی ٹیم</b><br/>${site}`)}`,
          siteUrl
        ),
      };
    case "REJECTED":
      return {
        subject: "آپ کی تحریر کے حوالے سے اطلاع — پیامِ ادب",
        html: shell(
          "ادارتی فیصلہ",
          `${p(`محترم <b>${name}</b> صاحب، السلام علیکم!`)}${p(
            `آپ نے ${site} کے لیے تحریر <b>’’${title}‘‘</b> بھیجی تھی۔ ادارتی جائزے کے بعد اسے اس وقت مسترد کر دیا گیا ہے۔ ذیل میں ادارتی ٹیم کی ذاتی رائے پیش ہے:`
          )}${reasonBox(data.reason || "(وجہ درج نہیں کی گئی)")}${
            data.suggestions ? reasonBox(`<b>بہتری کے لیے تجاویز:</b><br/>${data.suggestions}`) : ""
          }${p(
            data.resubmitAllowed === false
              ? "اس تحریر کو دوبارہ بھیجنے کی اجازت نہیں ہے۔ تاہم آپ اپنی دیگر تحریریں بھیجنے کے لیے خوش آمدید ہیں۔"
              : "آپ اصلاحات کے بعد یہ تحریر دوبارہ بھیج سکتے ہیں — آپ کا استقبال ہے۔"
          )}${p(`<b>ادارتی ٹیم</b><br/>${site}`)}`,
          siteUrl
        ),
      };
    case "REVISION":
      return {
        subject: "اصلاح مطلوب: آپ کی تحریر — پیامِ ادب",
        html: shell(
          "اصلاح کی درخواست",
          `${p(`محترم <b>${name}</b> صاحب، السلام علیکم!`)}${p(
            `آپ کی تحریر <b>’’${title}‘‘</b> کا ادارتی جائزہ مکمل ہوا ہے۔ اشاعت سے پہلی ذیل درج اصلاحات درکار ہیں:`
          )}${reasonBox(data.reason || "(تفصیل درج نہیں)")}${
            data.suggestions ? reasonBox(`<b>مزید تجاویز:</b><br/>${data.suggestions}`) : ""
          }${p(
            "اپنا ڈیش بورڈ کھولیں، متعلقہ تحریر میں ’’اصلاح کریں‘‘ پر کلک کریں، مطلوبہ تبدیلیاں کریں اور دوبارہ بھیج دیں — وہ تحریر دوبارہ ادارتی جائزے میں آ جائے گی۔"
          )}${readLink && siteUrl ? linkBtn(`${siteUrl}/dashboard`, "میرا ڈیش بورڈ") : ""}${p(`<b>ادارتی ٹیم</b><br/>${site}`)}`,
          siteUrl
        ),
      };
    case "PENDING":
      return {
        subject: "آپ کی تحریر زیرِ جائزہ ہے — پیامِ ادب",
        html: shell(
          "زیرِ جائزہ",
          `${p(`محترم <b>${name}</b> صاحب، السلام علیکم!`)}${p(
            `آپ کی تحریر <b>’’${title}‘‘</b> موصول ہو چکی ہے اور اس وقت ادارتی جائزے میں ہے۔ مکمل معائنے کے بعد آپ کو نتیجہ مطلع کر دیا جائے گا۔`
          )}${data.reason ? reasonBox(`<b>ادارتی نوٹ:</b><br/>${data.reason}`) : ""}${p(`<b>ادارتی ٹیم</b><br/>${site}`)}`,
          siteUrl
        ),
      };
    case "VERIFY":
      return {
        subject: "اپنی ای میل کی تصدیق کریں — پیامِ ادب",
        html: shell(
          "ای میل کی تصدیق",
          `${p(`محترم <b>${name}</b> صاحب، السلام علیکم!`)}${p(
            `${site} میں خوش آمدید! آپ کا اکاؤنٹ بن چکا ہے۔ نیچے دیے گئے بٹن پر کلک کر کے اپنی ای میل کی تصدیق کریں تاکہ آپ تحریریں بھیج سکیں۔`
          )}${data.url ? linkBtn(data.url, "ای میل کی تصدیق کریں") : ""}${p(
            "اگر آپ نے یہ اکاؤنٹ نہیں بنایا تو اس پیغام کو نظر انداز کر دیں۔"
          )}`,
          siteUrl
        ),
      };
    case "RESET":
      return {
        subject: "پاس ورڈ بازیابی — پیامِ ادب",
        html: shell(
          "پاس ورڈ بازیابی",
          `${p(`محترم <b>${name}</b> صاحب، السلام علیکم!`)}${p(
            "آپ کی درخواست پر پاس ورڈ بازیابی کا لنک نیچے ہے۔ یہ لنک 30 منٹ کے لیے معتبر ہے۔"
          )}${data.url ? linkBtn(data.url, "نیا پاس ورڈ مقرر کریں") : ""}${p(
            "اگر آپ نے یہ درخواست نہیں دی تو اپنا اکاؤنٹ محفوظ سمجھیں اور اس پیغام کو نظر انداز کریں۔"
          )}`,
          siteUrl
        ),
      };
    case "TEST":
    default:
      return {
        subject: "پیامِ ادب — ای میل ترتیبات کا آزمائشی پیغام",
        html: shell(
          "آزمائشی پیغام",
          p("اگر آپ یہ پیغام پڑھ رہے ہیں تو ای میل نظام درست طور پر ترتیب پا چکا ہے۔ شکریہ — ادارتی ٹیم، پیامِ ادب"),
          siteUrl
        ),
      };
  }
}

export type QueueMailInput = {
  kind: MailKind;
  to: string;
  data: MailTemplateData;
  relatedType?: string;
  relatedId?: string;
};

/**
 * Records the email in MailLog (auditable), then attempts SMTP delivery
 * according to current settings. Without SMTP config the row stays PENDING
 * so the admin can resend later from the Mail Center.
 */
export async function queueMail(input: QueueMailInput): Promise<void> {
  try {
    const settings = await getSettings();
    const siteUrl = (settings.siteUrl || "").trim() || "";
    const custom = {
      subject: settings[`mailTpl_${input.kind}_subject`],
      body: settings[`mailTpl_${input.kind}_body`],
    };
    const rendered = renderMail(input.kind, { ...input.data, siteName: settings.siteName }, siteUrl, custom);

    const row = await db.mailLog.create({
      data: {
        toEmail: input.to,
        subject: rendered.subject,
        bodyHtml: rendered.html,
        kind: input.kind,
        status: "PENDING",
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
      },
    });
    await attemptSend(row.id, settings);
  } catch {
    // never let mail failures break the main workflow
  }
}

/** Tries to deliver a pending MailLog row via configured SMTP. */
export async function attemptSend(mailId: string, settings?: Record<string, string>): Promise<boolean> {
  try {
    const s = settings ?? (await getSettings());
    const row = await db.mailLog.findUnique({ where: { id: mailId } });
    if (!row) return false;

    if (s.mailEnabled !== "1" || !(s.smtpHost ?? "").trim()) {
      await db.mailLog.update({
        where: { id: mailId },
        data: {
          status: "PENDING",
          error: "SMTP ترتیبات مکمل نہیں — ای میل سینٹر میں SMTP معلومات درج کریں",
          attempts: row.attempts + 1,
        },
      });
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: s.smtpHost,
      port: Number(s.smtpPort ?? 587) || 587,
      secure: s.smtpSecure === "1" || Number(s.smtpPort) === 465,
      auth: s.smtpUser ? { user: s.smtpUser, pass: s.smtpPass ?? "" } : undefined,
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
    });

    await transporter.sendMail({
      from: s.smtpFrom || s.smtpUser || SITE_FALLBACK,
      to: row.toEmail,
      subject: row.subject,
      html: row.bodyHtml,
    });

    await db.mailLog.update({
      where: { id: mailId },
      data: { status: "SENT", error: null, attempts: row.attempts + 1, sentAt: new Date() },
    });
    return true;
  } catch (e) {
    try {
      const row = await db.mailLog.findUnique({ where: { id: mailId } });
      await db.mailLog.update({
        where: { id: mailId },
        data: {
          status: "FAILED",
          error: String(e).slice(0, 500) || "نامعلوم خرابی",
          attempts: (row?.attempts ?? 0) + 1,
        },
      });
    } catch { /* ignore */ }
    return false;
  }
}

/** Base URL used for links inside emails. */
export function siteUrlFrom(req: NextRequestLike, settings: Record<string, string>): string {
  if (settings.siteUrl && settings.siteUrl.startsWith("http")) return settings.siteUrl.trim();
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

type NextRequestLike = { headers: { get(name: string): string | null } };
