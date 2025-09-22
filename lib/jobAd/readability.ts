import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export type ReadableContent = {
  title?: string;
  contentHtml?: string;
  textContent: string;
};

export function getReadableContent(html: string, url?: string): ReadableContent {
  try {
    const dom = new JSDOM(html, { url: url ?? "https://example.com" });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    return {
      title: article?.title ?? undefined,
      contentHtml: article?.content ?? undefined,
      textContent: article?.textContent ?? "",
    };
  } catch (error) {
    console.warn("[parseJobAd] readability failed", error);
    return {
      title: undefined,
      contentHtml: undefined,
      textContent: "",
    };
  }
}
