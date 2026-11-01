import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings, homeSectionsFromSettings, watermarkFromSettings, publishDueSchedules } from "@/lib/site";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading, Divider } from "@/components/site/section-heading";
import { PoemCard, ArticleCard, BookCard, PosterCard, poemPreview, excerptPreview } from "@/components/site/cards";
import { AdRail } from "@/components/site/ad-rail";
import { LogoMark } from "@/components/site/logo";
import { PageViewTracker } from "@/components/site/view-tracker";
import { Button } from "@/components/ui/button";
import { Feather, BookOpen, Newspaper, ArrowLeft, Flame, Quote, Megaphone, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await publishDueSchedules(); // light cron: publish due scheduled content
  const settings = await getSettings();
  const sections = homeSectionsFromSettings(settings);
  const showViews = settings.showViewCounts !== "0";
  const wm = watermarkFromSettings(settings);

  const featuredPoemId = settings.featuredPoemId || null;
  const featuredArticleId = settings.featuredArticleId || null;
  const featuredBookId = settings.featuredBookId || null;

  const [
    heroBanner, sideBanners, featuredPoets,
    dailySher, wordOfDay,
    latestPoems, featuredPoemPicked, latestPoemsFallback,
    latestArticles, featuredArticlePicked, latestArticlesFallback,
    latestNews,
    popularPoems, popularArticles, popularBooks,
    newBooks, featuredBookPicked,
    latestEdition, competitions,
  ] = await Promise.all([
    db.banner.findFirst({ where: { position: "HERO", active: true }, orderBy: { sortOrder: "asc" } }),
    db.banner.findMany({ where: { position: "SIDE", active: true }, orderBy: { sortOrder: "asc" }, take: 3 }),
    db.poet.findMany({ where: { featured: true }, take: 8, orderBy: { createdAt: "asc" } }),
    db.dailySher.findFirst({ where: { active: true }, orderBy: { date: "desc" } }),
    db.wordOfDay.findFirst({ where: { active: true }, orderBy: { date: "desc" } }),
    db.poem.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 8 }),
    featuredPoemId ? db.poem.findFirst({ where: { status: "PUBLISHED", id: featuredPoemId } }) : Promise.resolve(null),
    db.poem.findFirst({ where: { status: "PUBLISHED", featured: true }, orderBy: { createdAt: "desc" } }),
    db.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 6 }),
    featuredArticleId ? db.article.findFirst({ where: { status: "PUBLISHED", id: featuredArticleId } }) : Promise.resolve(null),
    db.article.findFirst({ where: { status: "PUBLISHED", featured: true }, orderBy: { createdAt: "desc" } }),
    db.news.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 4 }),
    db.poem.findMany({ where: { status: "PUBLISHED" }, orderBy: { views: "desc" }, take: 5, include: { user: { select: { penName: true, name: true } } } }),
    db.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { views: "desc" }, take: 5 }),
    db.book.findMany({ orderBy: { views: "desc" }, take: 5 }),
    db.book.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    featuredBookId ? db.book.findFirst({ where: { id: featuredBookId } }) : db.book.findFirst({ where: { featured: true }, orderBy: { createdAt: "desc" } }),
    db.newspaperEdition.findFirst({ where: { published: true }, orderBy: { createdAt: "desc" } }),
    db.competition.findMany({ where: { active: true }, orderBy: { endDate: "desc" }, take: 4 }),
  ]);

  const featuredPoem = featuredPoemPicked ?? latestPoemsFallback;
  const featuredArticle = featuredArticlePicked ?? latestArticlesFallback;
  const featuredBook = featuredBookPicked;

  const heroTitle = settings.heroTitle ?? "اردو ادب کا ڈیجیٹل سرمایہ";
  const heroSubtitle = settings.heroSubtitle ?? "اردو زبان و ادب کے فروغ، تحفظ، اشاعت اور نئی نسل تک رسائی کا ایک جدید پلیٹ فارم۔";
  const heroImage = settings.heroImage ?? "/brand/hero-emblem.jpg";
  const heroBadge = settings.heroBadge ?? "پیامِ ادب · Payam-e-Adab";
  const adsMax = Math.min(Math.max(Number(settings.adsMaxWidth ?? 300) || 300, 160), 360);
  const order = (key: string) => sections.findIndex((s) => s.key === key);
  const isVisible = (key: string) => sections.find((s) => s.key === key)?.visible !== false;
  const sectionProps = (key: string) => ({ className: "mx-auto max-w-7xl px-4", style: { order: order(key) < 0 ? 99 : order(key) } });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <PageViewTracker />

      <div className="flex flex-1 flex-col paper-bg">
        {/* wide layout: right ad rail — main column — left ad rail (rails only on wide screens).
            In RTL, "start" = right side of screen, "end" = left side of screen. */}
        <div className="mx-auto flex w-full max-w-[1820px] items-start justify-center gap-4 px-2 xl:px-5">
          <AdRail slot="RIGHT" maxWidth={adsMax} side="start" />

          <main className="flex min-w-0 flex-1 flex-col" style={{ display: "flex", flexDirection: "column" }}>
        {/* ============ HERO ============ */}
        {isVisible("hero") && (
          <section {...sectionProps("hero")}>
            <div className="relative overflow-hidden pattern-emerald">
              {heroBanner && (
                <div className="absolute inset-0">
                  { }
                  <img src={heroBanner.imageUrl} alt={heroBanner.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-l from-emerald-ink/90 via-emerald-ink/60 to-emerald-ink/80" />
                </div>
              )}
              <div className="relative mx-auto max-w-7xl px-4 py-14 md:py-20">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                  {/* text column */}
                  <div className="text-center lg:text-start">
                    <div className="mb-5 flex justify-center lg:justify-start">
                      <LogoMark size={104} className="rounded-xl shadow-lg shadow-black/25" />
                    </div>
                    <p className="mb-4 inline-block rounded-full border border-gold/40 bg-emerald-ink/40 px-5 py-1.5 font-naskh text-[15px] text-[#d9bc6a]">
                      {heroBadge}
                    </p>
                    <h1 className="font-nastaliq-tight text-4xl leading-[1.8] text-[#f3ead2] md:text-5xl md:leading-[1.8]">
                      {heroTitle}
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl font-naskh text-lg leading-9 text-[#e5dfc9]/90 md:text-xl lg:mx-0">
                      {heroSubtitle}
                    </p>
                    <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                      <Button asChild size="lg" className="h-[52px] bg-gold px-10 font-naskh text-[17px] font-semibold text-emerald-ink shadow-md shadow-black/20 hover:bg-[#d9bc6a]">
                        <Link href="/poetry">ادب پڑھیں</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="h-[52px] border-[#d9bc6a] bg-emerald-ink/40 px-10 font-naskh text-[17px] font-semibold text-[#f3ead2] hover:bg-emerald-ink/70 hover:text-[#f3ead2]">
                        <Link href="/submit">اپنی تحریر بھیجیں</Link>
                      </Button>
                    </div>
                  </div>
                  {/* official promotional image — preserved aspect ratio, no distortion */}
                  <div className="mx-auto w-full max-w-xl">
                    <div className="overflow-hidden rounded-2xl border border-gold/40 shadow-2xl shadow-black/30">
                      { }
                      <img
                        src={heroImage}
                        alt="پیامِ ادب — سرمایہ ادب"
                        className="h-auto w-full object-contain"
                        loading="eager"
                        fetchPriority="high"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============ نمایاں شعرا و ادبا ============ */}
        {isVisible("poets") && featuredPoets.length > 0 && (
          <section {...sectionProps("poets")} className="mx-auto max-w-7xl px-4 pt-10">
            <SectionHeading title="نمایاں شعرا و ادبا" href="/poets" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredPoets.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/poets/${p.id}`}
                  className="group manuscript-frame flex flex-col items-center overflow-hidden rounded-xl bg-card p-5 text-center transition-shadow hover:shadow-lg"
                >
                  {p.photoUrl ? (
                     
                    <img src={p.photoUrl} alt={p.name} className="h-20 w-20 rounded-full border-2 border-gold/50 object-cover" />
                  ) : (
                    <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/50 bg-secondary font-nastaliq-tight text-2xl text-primary">
                      {p.takhallus?.[0] || p.name[0]}
                    </span>
                  )}
                  <h3 className="mt-3 font-nastaliq-tight text-lg leading-8 text-foreground group-hover:text-primary">
                    {p.name}
                  </h3>
                  {p.takhallus && <p className="text-xs font-naskh text-gold">تخلص: {p.takhallus}</p>}
                  {p.era && <p className="mt-0.5 text-[11px] font-latin text-muted-foreground" dir="auto">{p.era}</p>}
                  <p className="mt-2 line-clamp-2 text-xs leading-6 text-foreground/65 font-naskh">{p.bio ?? ""}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ============ آج کا شعر + آج کا لفظ ============ */}
        {isVisible("sherWord") && (
          <section {...sectionProps("sherWord")} className="mx-auto max-w-7xl px-4 pt-10">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="manuscript-frame relative overflow-hidden rounded-2xl bg-card p-7">
                <Quote className="mb-2 h-6 w-6 text-gold" />
                <h2 className="absolute end-6 top-6 font-nastaliq-tight text-2xl text-primary">آج کا شعر</h2>
                {dailySher ? (
                  <>
                    <blockquote className="whitespace-pre-line text-center font-nastaliq text-2xl leading-[2.9] text-foreground">
                      {dailySher.text}
                    </blockquote>
                    <p className="mt-4 text-center font-naskh text-base text-gold">— {dailySher.poetName}</p>
                  </>
                ) : (
                  <p className="py-10 text-center font-naskh text-base text-muted-foreground">
                    آج کا شعر جلد منتشر ہوگا۔
                  </p>
                )}
              </div>

              <div className="manuscript-frame relative overflow-hidden rounded-2xl bg-card p-7">
                <Feather className="mb-2 h-6 w-6 text-gold" />
                <div className="absolute end-6 top-6 flex items-center gap-3">
                  <Link href="/dictionary" className="text-sm font-naskh text-gold hover:text-primary">لغت ←</Link>
                  <h2 className="font-nastaliq-tight text-2xl text-primary">آج کا لفظ</h2>
                </div>
                {wordOfDay ? (
                  <div className="mt-10 text-center">
                    <p className="font-nastaliq-tight text-5xl text-emerald-deep leading-[1.9]">{wordOfDay.word}</p>
                    <p className="mt-2 font-naskh text-lg text-foreground/85">{wordOfDay.meaning}</p>
                    {wordOfDay.englishMeaning && (
                      <p className="mt-1 font-latin text-base text-muted-foreground" dir="ltr">{wordOfDay.englishMeaning}</p>
                    )}
                    {wordOfDay.example && (
                      <p className="mx-auto mt-4 max-w-md rounded-lg bg-accent px-5 py-3 font-nastaliq text-base leading-8 text-foreground/80">
                        مثال: {wordOfDay.example}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="py-10 text-center font-naskh text-base text-muted-foreground">
                    آج کا لفظ جلد منتشر ہوگا۔
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <Divider style={{ order: 2.5 } } />

        {/* ============ تازہ شاعری ============ */}
        {isVisible("latestPoems") && (
          <section {...sectionProps("latestPoems")}>
            <SectionHeading title="تازہ شاعری" href="/poetry" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {latestPoems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gold/40 bg-card p-10 text-center font-naskh text-sm text-muted-foreground">
                    ابھی کوئی شاعری شائع نہیں ہوئی۔ نئی تحریریں جلد آ رہی ہیں۔
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {latestPoems.slice(0, 4).map((p) => (
                      <PoemCard key={p.id} poem={p} showViews={showViews} />
                    ))}
                  </div>
                )}
              </div>
              <aside className="lg:col-span-1">
                {(featuredPoem || latestPoems[0]) && (
                  <FeaturedPoemPanel poem={featuredPoem ?? latestPoems[0]} />
                )}
              </aside>
            </div>
          </section>
        )}

        <Divider style={{ order: 3.5 } } />

        {/* ============ تازہ مضامین ============ */}
        {isVisible("latestArticles") && (
          <section {...sectionProps("latestArticles")}>
            <SectionHeading title="تازہ مضامین" href="/articles" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {latestArticles.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gold/40 bg-card p-10 text-center font-naskh text-sm text-muted-foreground">
                    ابھی کوئی مضمون شائع نہیں ہوا۔ نئی تحریریں جلد آ رہی ہیں۔
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {latestArticles.slice(0, 4).map((a) => (
                      <ArticleCard key={a.id} article={a} showViews={showViews} />
                    ))}
                  </div>
                )}
              </div>
              <aside className="lg:col-span-1">
                {(featuredArticle || latestArticles[0]) && (
                  <FeaturedArticlePanel article={featuredArticle ?? latestArticles[0]} />
                )}
              </aside>
            </div>
          </section>
        )}

        <Divider style={{ order: 4.5 } } />

        {/* ============ ادبی خبریں ============ */}
        {isVisible("news") && (
          <section {...sectionProps("news")}>
            <SectionHeading title="ادبی خبریں" href="/news" linkLabel="تمام خبریں" />
            {latestNews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gold/40 bg-card p-10 text-center font-naskh text-sm text-muted-foreground">
                ابھی کوئی خبر شائع نہیں ہوئی۔
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {latestNews.map((n) => (
                  <Link key={n.id} href={`/news/${n.id}`} className="group manuscript-frame flex flex-col overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-lg">
                    <div className="flex h-36 items-center justify-center overflow-hidden bg-secondary">
                      {n.coverUrl ? (
                         
                        <img src={n.coverUrl} alt={n.title} className="h-full w-full object-cover" />
                      ) : (
                        <Megaphone className="h-9 w-9 text-gold" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <span className="mb-2 w-fit rounded-full bg-accent px-2 py-0.5 text-[10px] font-naskh text-primary">{n.category}</span>
                      <h3 className="line-clamp-2 font-nastaliq-tight text-base leading-8 group-hover:text-primary">{n.title}</h3>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-foreground/65 font-naskh">{n.excerpt ?? excerptPreview(n.content, 14)}</p>
                      <p className="mt-auto pt-2 font-latin text-[10px] text-muted-foreground" dir="ltr">
                        {new Date(n.createdAt).toLocaleDateString("en-GB")}{showViews && n.views > 0 ? ` · ${n.views} views` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <Divider style={{ order: 5.5 } } />

        {/* ============ نئی کتب + مقبول تحریریں ============ */}
        {isVisible("booksPopular") && (
          <section {...sectionProps("booksPopular")}>
            <SectionHeading title="نئی کتب" href="/books" />
            <div className="grid gap-6 lg:grid-cols-4">
              <div className="lg:col-span-3">
                {newBooks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gold/40 bg-card p-10 text-center font-naskh text-sm text-muted-foreground">
                    کتب خانہ میں جلد اضافہ ہوگا۔
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {newBooks.slice(0, 3).map((b) => (
                      <BookCard key={b.id} book={b} showViews={showViews} />
                    ))}
                  </div>
                )}

                {/* مقبول تحریریں */}
                <div className="mt-8">
                  <h3 className="mb-4 flex items-center gap-2 font-nastaliq-tight text-2xl text-primary">
                    <Flame className="h-6 w-6 text-gold" /> مقبول تحریریں
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {popularPoems.slice(0, 3).map((p) => (
                      <Link key={`p-${p.id}`} href={`/poetry/${p.id}`} className="manuscript-frame group rounded-xl bg-card p-4 transition-shadow hover:shadow-md">
                        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-naskh text-primary">{p.category}</span>
                        <h4 className="mt-2 line-clamp-1 font-nastaliq-tight text-lg leading-8 group-hover:text-primary">{p.title}</h4>
                        <p className="text-sm font-naskh text-gold">{p.poetName ?? p.user?.penName ?? p.user?.name ?? "—"}</p>
                        <p className="mt-1 line-clamp-2 font-nastaliq text-sm leading-7 text-foreground/60">{poemPreview(p.content)}</p>
                        {showViews && (
                          <p className="mt-1.5 inline-flex items-center gap-1 font-latin text-[10px] text-muted-foreground" dir="ltr">
                            <Eye className="h-3 w-3" /> {p.views}
                          </p>
                        )}
                      </Link>
                    ))}
                    {popularArticles.slice(0, 2).map((a) => (
                      <Link key={`a-${a.id}`} href={`/articles/${a.id}`} className="manuscript-frame group rounded-xl bg-card p-4 transition-shadow hover:shadow-md">
                        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-naskh text-primary">{a.category}</span>
                        <h4 className="mt-2 line-clamp-2 font-nastaliq-tight text-lg leading-8 group-hover:text-primary">{a.title}</h4>
                        <p className="mt-1 line-clamp-2 text-sm leading-7 text-foreground/60 font-naskh">{excerptPreview(a.excerpt || a.content, 16)}</p>
                        {showViews && (
                          <p className="mt-1.5 inline-flex items-center gap-1 font-latin text-[10px] text-muted-foreground" dir="ltr">
                            <Eye className="h-3 w-3" /> {a.views}
                          </p>
                        )}
                      </Link>
                    ))}
                    {popularBooks.slice(0, 1).map((b) => (
                      <Link key={`b-${b.id}`} href={`/books/${b.id}`} className="manuscript-frame group rounded-xl bg-card p-4 transition-shadow hover:shadow-md">
                        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-naskh text-primary">{b.category}</span>
                        <h4 className="mt-2 line-clamp-1 font-nastaliq-tight text-lg leading-8 group-hover:text-primary">{b.title}</h4>
                        <p className="text-sm font-naskh text-gold">{b.author}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-7 text-foreground/60 font-naskh">{excerptPreview(b.description ?? "", 16)}</p>
                        {showViews && (
                          <p className="mt-1.5 inline-flex items-center gap-1 font-latin text-[10px] text-muted-foreground" dir="ltr">
                            <Eye className="h-3 w-3" /> {b.views}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* featured book + side banners column */}
              <aside className="flex flex-col gap-4">
                {(featuredBook || newBooks[0]) && (
                  <div className="manuscript-frame rounded-xl bg-card p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-nastaliq-tight text-lg text-primary">
                      <BookOpen className="h-4.5 w-4.5 text-gold" /> نمایاں کتاب
                    </h3>
                    <Link href={`/books/${(featuredBook ?? newBooks[0]).id}`} className="group block">
                      {(featuredBook ?? newBooks[0]).coverUrl ? (
                         
                        <img src={(featuredBook ?? newBooks[0]).coverUrl!} alt={(featuredBook ?? newBooks[0]).title} className="mb-3 h-48 w-full rounded-lg object-cover" />
                      ) : (
                        <div className="mb-3 flex h-48 w-full items-center justify-center rounded-lg bg-secondary">
                          <BookOpen className="h-10 w-10 text-gold" />
                        </div>
                      )}
                      <h4 className="line-clamp-1 font-nastaliq-tight text-lg leading-8 group-hover:text-primary">{(featuredBook ?? newBooks[0]).title}</h4>
                      <p className="text-sm font-naskh text-gold">{(featuredBook ?? newBooks[0]).author}</p>
                      <p className="mt-1 line-clamp-3 text-xs leading-6 text-foreground/70 font-naskh">
                        {excerptPreview((featuredBook ?? newBooks[0]).description ?? "", 24)}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-naskh text-primary">
                        مزید پڑھیے <ArrowLeft className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </div>
                )}

                {sideBanners.map((b) => (
                  <Link key={b.id} href={b.linkUrl || "#"} className="group block overflow-hidden rounded-xl border border-gold/30 shadow-sm">
                    { }
                    <img src={b.imageUrl} alt={b.title} className="w-full object-cover transition-transform group-hover:scale-[1.02]" />
                  </Link>
                ))}
              </aside>
            </div>
          </section>
        )}

        <Divider style={{ order: 6.5 } } />

        {/* ============ ڈیجیٹل اخبار ============ */}
        {isVisible("newspaper") && (
          <section {...sectionProps("newspaper")}>
            <SectionHeading title="ڈیجیٹل اخبار" href="/newspaper" linkLabel="تمام شمارے" />
            <Link
              href={latestEdition ? `/newspaper/${latestEdition.id}` : "/newspaper"}
              className="group manuscript-frame flex items-center gap-5 overflow-hidden rounded-xl bg-card p-5 transition-shadow hover:shadow-lg"
            >
              <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary sm:w-44">
                {latestEdition?.coverUrl ? (
                   
                  <img src={latestEdition.coverUrl} alt={latestEdition.title} className="h-full w-full object-cover" />
                ) : (
                  <Newspaper className="h-10 w-10 text-gold" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-nastaliq-tight text-xl leading-9 group-hover:text-primary">
                  {latestEdition ? latestEdition.title : "ہفتہ وار شمارہ"}
                </h3>
                <p className="text-sm font-naskh text-muted-foreground">
                  {latestEdition
                    ? `${latestEdition.weekLabel ?? ""} ${latestEdition.editionNumber ? `· شمارہ ${latestEdition.editionNumber}` : ""}`
                    : "معذرت! اس ہفتے کا شمارہ ابھی دستیاب نہیں ہے۔ جلد آ رہا ہے۔"}
                </p>
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-deep/10 px-3 py-1 text-xs font-naskh font-semibold text-emerald-deep">
                  <Newspaper className="h-3.5 w-3.5" /> شمارہ پڑھیں
                </span>
              </div>
            </Link>
          </section>
        )}

        <Divider style={{ order: 7.5 } } />

        {/* ============ ادبی مقابلے ============ */}
        {isVisible("competitions") && (
          <section {...sectionProps("competitions")} className="mx-auto max-w-7xl px-4 pb-14">
            <SectionHeading title="ادبی مقابلے" href="/competitions" />
            {competitions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gold/40 bg-card p-10 text-center font-naskh text-sm text-muted-foreground">
                اس وقت کوئی مقابلہ جاری نہیں۔ نئے مقابلے جلد اعلان ہوں گے۔
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {competitions.slice(0, 4).map((c) => (
                  <PosterCard
                    key={c.id}
                    title={c.title}
                    description={c.description}
                    posterUrl={c.posterUrl}
                    meta={
                      c.endDate ? (
                        <span className="inline-flex items-center gap-1 font-naskh">
                          آخری تاریخ: <span className="font-latin">{new Date(c.endDate).toLocaleDateString("en-GB")}</span>
                        </span>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}
        </main>

          <AdRail slot="LEFT" maxWidth={adsMax} side="end" />
        </div>
      </div>

      <SiteFooter settings={settings} />
    </div>
  );
}

/* -------- featured half-preview panels (مزید پڑھیے) -------- */

function FeaturedPoemPanel({ poem }: { poem: { id: string; title: string; content: string; poetName?: string | null; user?: { penName: string | null; name: string } | null } }) {
  const half = poemPreview(poem.content, 1);
  return (
    <div className="manuscript-frame relative h-full overflow-hidden rounded-xl bg-card p-5">
      <span className="absolute start-3 top-3 rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-naskh text-gold">نمایاں نظم</span>
      <div className="mt-6">
        <h3 className="text-center font-nastaliq-tight text-xl leading-9 text-emerald-ink">{poem.title}</h3>
        <p className="text-center text-xs font-naskh text-gold">
          {poem.poetName ?? poem.user?.penName ?? poem.user?.name ?? ""}
        </p>
        <p className="mt-3 whitespace-pre-line text-center font-nastaliq text-[15px] leading-8 text-foreground/85">
          {half}
        </p>
        <p className="pointer-events-none relative mt-0 h-14 bg-gradient-to-t from-card to-transparent" />
      </div>
      <Link
        href={`/poetry/${poem.id}`}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-naskh text-sm font-semibold text-primary-foreground hover:bg-emerald-deep"
      >
        مزید پڑھیے <ArrowLeft className="h-4 w-4" />
      </Link>
    </div>
  );
}

function FeaturedArticlePanel({ article }: { article: { id: string; title: string; excerpt?: string | null; content: string; authorName?: string | null } }) {
  return (
    <div className="manuscript-frame relative h-full overflow-hidden rounded-xl bg-card p-5">
      <span className="absolute start-3 top-3 rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-naskh text-gold">نمایاں مضمون</span>
      <div className="mt-6">
        <h3 className="font-nastaliq-tight text-xl leading-9 text-emerald-ink line-clamp-2">{article.title}</h3>
        <p className="text-xs font-naskh text-gold">{article.authorName ?? ""}</p>
        <p className="mt-3 font-naskh text-sm leading-7 text-foreground/85">
          {excerptPreview(article.excerpt || article.content, 40)}
        </p>
        <p className="pointer-events-none relative mt-0 h-12 bg-gradient-to-t from-card to-transparent" />
      </div>
      <Link
        href={`/articles/${article.id}`}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-naskh text-sm font-semibold text-primary-foreground hover:bg-emerald-deep"
      >
        مزید پڑھیے <ArrowLeft className="h-4 w-4" />
      </Link>
    </div>
  );
}
