import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type NewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
};

type EconEvent = {
  title: string;
  country?: string;
  date?: string;
  impact?: string;
  previous?: string;
  forecast?: string;
  actual?: string;
};

type UsMacroEvent = {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
};

function cleanXmlText(raw?: string) {
  if (!raw) return "";
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseRssItems(xml: string, source: string, limit = 8): NewsItem[] {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
  const linkRegex = /<link>([\s\S]*?)<\/link>/;
  const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;
  const items: NewsItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) && items.length < limit) {
    const block = match[1];
    const titleMatch = block.match(titleRegex);
    const linkMatch = block.match(linkRegex);
    const pubDateMatch = block.match(pubDateRegex);
    const title = cleanXmlText(titleMatch?.[1] || titleMatch?.[2] || "");
    const url = cleanXmlText(linkMatch?.[1] || "");
    const publishedAt = cleanXmlText(pubDateMatch?.[1] || "");
    if (!title || !url) continue;
    items.push({
      title,
      url,
      source,
      publishedAt,
    });
  }

  return items;
}

async function fetchCryptoPanic(): Promise<NewsItem[]> {
  const token = process.env.CRYPTOPANIC_API_KEY;
  const endpoint = token
    ? `https://cryptopanic.com/api/v1/posts/?auth_token=${token}&public=true&kind=news&regions=en&filter=hot`
    : "https://cryptopanic.com/api/v1/posts/?public=true&kind=news&regions=en";

  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) return [];

  const data = (await response.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      published_at?: string;
      source?: { title?: string };
    }>;
  };

  return (data.results ?? [])
    .slice(0, 10)
    .filter((item) => item.title && item.url)
    .map((item) => ({
      title: item.title ?? "",
      url: item.url ?? "",
      source: item.source?.title || "CryptoPanic",
      publishedAt: item.published_at,
    }));
}

async function fetchCryptoMediaFallback(): Promise<NewsItem[]> {
  const feeds = [
    { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
    { url: "https://cointelegraph.com/rss", source: "Cointelegraph" },
  ];

  const results = await Promise.all(
    feeds.map(async (feed) => {
      try {
        const res = await fetch(feed.url, { cache: "no-store" });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRssItems(xml, feed.source, 8);
      } catch {
        return [];
      }
    }),
  );

  return results.flat().slice(0, 16);
}

async function fetchBybitAnnouncements(): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://api.bybit.com/v5/announcements/index?locale=en-US&limit=10", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      result?: {
        list?: Array<{
          title?: string;
          url?: string;
          publishTime?: number;
        }>;
      };
    };
    return (data.result?.list ?? [])
      .filter((item) => item.title && item.url)
      .map((item) => ({
        title: item.title ?? "",
        url: item.url ?? "",
        source: "Bybit",
        publishedAt: item.publishTime ? new Date(item.publishTime).toISOString() : undefined,
      }));
  } catch {
    return [];
  }
}

async function fetchBinanceAnnouncements(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&pageNo=1&pageSize=8",
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: {
        catalogs?: Array<{
          articles?: Array<{
            title?: string;
            code?: string;
            releaseDate?: number;
          }>;
        }>;
      };
    };

    const articles = (data.data?.catalogs ?? []).flatMap((catalog) => catalog.articles ?? []).slice(0, 12);
    return articles
      .filter((item) => item.title && item.code)
      .map((item) => ({
        title: item.title ?? "",
        url: `https://www.binance.com/en/support/announcement/${item.code}`,
        source: "Binance",
        publishedAt: item.releaseDate ? new Date(item.releaseDate).toISOString() : undefined,
      }));
  } catch {
    return [];
  }
}

async function fetchExchangeAnnouncements(): Promise<NewsItem[]> {
  const [bybit, binance] = await Promise.all([fetchBybitAnnouncements(), fetchBinanceAnnouncements()]);
  return [...bybit, ...binance].slice(0, 16);
}

async function fetchEconomicCalendar(): Promise<EconEvent[]> {
  try {
    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thismonth.json", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      title?: string;
      country?: string;
      date?: string;
      impact?: string;
      previous?: string;
      forecast?: string;
      actual?: string;
    }>;

    return (data ?? [])
      .filter((item) => item.title)
      .map((item) => ({
        title: item.title ?? "",
        country: item.country,
        date: item.date,
        impact: item.impact,
        previous: item.previous,
        forecast: item.forecast,
        actual: item.actual,
      }));
  } catch {
    return [];
  }
}

async function fetchUsMacroEvents(): Promise<UsMacroEvent[]> {
  const sources = [
    { url: "https://www.federalreserve.gov/feeds/speeches.xml", source: "Federal Reserve Speeches" },
    { url: "https://www.federalreserve.gov/feeds/press_all.xml", source: "Federal Reserve Press" },
    { url: "https://www.bls.gov/feed/bls_latest.rss", source: "U.S. BLS" },
  ];

  const majorKeywords = [
    "fomc",
    "powell",
    "federal reserve",
    "fed",
    "speech",
    "minutes",
    "interest rate",
    "cpi",
    "ppi",
    "inflation",
    "payroll",
    "employment",
    "unemployment",
    "jobless",
    "pce",
    "gdp",
    "ism",
  ];

  const results = await Promise.all(
    sources.map(async (feed) => {
      try {
        const res = await fetch(feed.url, { cache: "no-store" });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRssItems(xml, feed.source, 40);
      } catch {
        return [];
      }
    }),
  );

  const merged = results.flat();
  const filtered = merged.filter((item) => {
    const lower = item.title.toLowerCase();
    return majorKeywords.some((keyword) => lower.includes(keyword));
  });

  const deduped = new Map<string, UsMacroEvent>();
  for (const item of filtered) {
    const key = `${item.source}::${item.url || item.title}`;
    if (!deduped.has(key)) {
      deduped.set(key, {
        title: item.title,
        url: item.url,
        source: item.source,
        publishedAt: item.publishedAt,
      });
    }
  }

  return Array.from(deduped.values()).slice(0, 30);
}

export async function GET() {
  try {
    const [cryptoPanicRaw, cryptoMediaFallback, exchangeAnnouncements, economicCalendar, usMacroEvents] = await Promise.all([
      fetchCryptoPanic(),
      fetchCryptoMediaFallback(),
      fetchExchangeAnnouncements(),
      fetchEconomicCalendar(),
      fetchUsMacroEvents(),
    ]);
    const cryptoPanic = cryptoPanicRaw.length > 0 ? cryptoPanicRaw : cryptoMediaFallback;

    return NextResponse.json({
      cryptoPanic,
      exchangeAnnouncements,
      economicCalendar,
      usMacroEvents,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        cryptoPanic: [],
        exchangeAnnouncements: [],
        economicCalendar: [],
        usMacroEvents: [],
        fetchedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
