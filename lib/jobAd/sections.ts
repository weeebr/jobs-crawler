import { load } from "cheerio";

const QUALIFICATION_HEADINGS = [
  "qualifications",
  "requirements",
  "what you bring",
  "must have",
  "skills",
  "profile",
  "you have",
  "your toolkit",
  "who you are",
];

const ROLE_HEADINGS = [
  "responsibilities",
  "what you'll do",
  "what you will do",
  "what you'll be doing",
  "your impact",
  "day to day",
  "mission",
  "role",
];

const BENEFIT_HEADINGS = [
  "benefits",
  "what we offer",
  "perks",
  "why us",
  "compensation",
  "fringe",
  "culture",
  "we offer",
];

const MAX_SECTION_ITEMS = 8;

type JobSectionKey = "qualifications" | "roles" | "benefits";

type JobSections = Record<JobSectionKey, string[]>;

type SectionAccumulator = Record<JobSectionKey, Set<string>>;

export function collectJobSectionsHeuristic(
  $: ReturnType<typeof load>,
  readableHtml: string | undefined,
): JobSections {
  const sections: SectionAccumulator = {
    qualifications: new Set<string>(),
    roles: new Set<string>(),
    benefits: new Set<string>(),
  };

  const headingMap: Array<{ key: JobSectionKey; keywords: string[] }> = [
    { key: "qualifications", keywords: QUALIFICATION_HEADINGS },
    { key: "roles", keywords: ROLE_HEADINGS },
    { key: "benefits", keywords: BENEFIT_HEADINGS },
  ];

  $("h2, h3, h4, strong").each((_, element) => {
    const headingText = $(element).text().trim();
    if (!headingText) return;

    const normalized = headingText.toLowerCase();
    const match = headingMap.find((entry) =>
      entry.keywords.some((keyword) => normalized.includes(keyword)),
    );
    if (!match) return;

    const targetSet = sections[match.key];
    const list = $(element).nextAll("ul,ol").first();
    if (list.length === 0) return;

    list.find("li").each((_, li) => {
      if (targetSet.size >= MAX_SECTION_ITEMS) return false;
      const itemText = $(li).text().replace(/\s+/g, " ").trim();
      if (itemText) targetSet.add(itemText);
      return undefined;
    });
  });

  if (readableHtml) {
    const $readable = load(readableHtml);
    for (const key of Object.keys(sections) as JobSectionKey[]) {
      if (sections[key].size > 0) continue;
      $readable("ul li")
        .slice(0, MAX_SECTION_ITEMS)
        .each((_, li) => {
          const text = $readable(li).text().replace(/\s+/g, " ").trim();
          if (text) sections[key].add(text);
        });
    }
  }

  for (const key of Object.keys(sections) as JobSectionKey[]) {
    if (sections[key].size === 0) {
      $("p")
        .slice(0, 6)
        .each((_, paragraph) => {
          if (sections[key].size >= MAX_SECTION_ITEMS) return false;
          const text = $(paragraph).text().replace(/\s+/g, " ").trim();
          if (text.length > 40) {
            sections[key].add(text);
          }
          return undefined;
        });
    }
  }

  return {
    qualifications: Array.from(sections.qualifications).slice(0, MAX_SECTION_ITEMS),
    roles: Array.from(sections.roles).slice(0, MAX_SECTION_ITEMS),
    benefits: Array.from(sections.benefits).slice(0, MAX_SECTION_ITEMS),
  };
}
