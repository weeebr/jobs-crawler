import { readFile } from "fs/promises";
import { join } from "path";

import { parseCvMarkdown } from "./parseCvMarkdown";
import { cvProfileSchema, type CVProfile } from "./schemas";

interface DefaultCv {
  markdown: string;
  profile: CVProfile;
}

let cached: DefaultCv | null = null;

export async function loadDefaultCv(): Promise<DefaultCv> {
  if (cached) {
    return cached;
  }

  const filePath = join(process.cwd(), "app", "CV.md");
  const markdown = await readFile(filePath, "utf-8");
  const parsed = parseCvMarkdown(markdown);
  const profile = cvProfileSchema.parse(parsed);

  cached = { markdown, profile };
  return cached;
}

export function clearDefaultCvCache() {
  cached = null;
}
