import { load } from "cheerio";

export function extractPublishedAt($: ReturnType<typeof load>): string | undefined {
  const selectors = [
    'meta[property="article:published_time"]',
    'meta[name="date"]',
    'meta[name="publication_date"]',
    'meta[itemprop="datePosted"]',
    "time[datetime]",
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length === 0) continue;

    const attr = element.attr("content") ?? element.attr("datetime");
    if (attr && attr.trim()) return attr.trim();

    const text = element.text().trim();
    if (text) return text;
  }

  const timeText = $("time").first().text().trim();
  return timeText || undefined;
}
