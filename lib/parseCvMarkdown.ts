import { marked, type Tokens } from "marked";

import { extractTech } from "./extractTech";
import { cvProfileSchema, type CVProfile } from "./schemas";

const SECTION_ALIAS: Record<string, keyof CVProfile | "keywords"> = {
  "work experience": "roles",
  experience: "roles",
  roles: "roles",
  "professional experience": "roles",
  skills: "skills",
  tech: "skills",
  "technical skills": "skills",
  projects: "projects",
  "selected projects": "projects",
  education: "education",
  "academic": "education",
  keywords: "keywords",
  summary: "keywords",
};

export function parseCvMarkdown(markdown: string): CVProfile {
  if (!markdown || !markdown.trim()) {
    throw new Error("CV markdown is empty");
  }

  const tokens = marked.lexer(markdown);

  const draft: CVProfile = {
    roles: [],
    skills: [],
    projects: [],
    education: [],
    keywords: [],
  };

  let section: keyof CVProfile | "keywords" | null = null;

  for (const token of tokens) {
    if (token.type === "heading") {
      const alias = SECTION_ALIAS[token.text.trim().toLowerCase()];
      section = alias ?? null;
      continue;
    }

    if (token.type === "list") {
      handleListToken(token as Tokens.List, section, draft);
      continue;
    }

    if (token.type === "paragraph" && section === "keywords") {
      const keywords = splitDelimited(token.text);
      draft.keywords.push(...keywords);
    }
  }

  draft.skills = Array.from(new Set(draft.skills.map(cleanText))).filter(
    Boolean,
  );
  draft.keywords = Array.from(new Set(draft.keywords.map(cleanText))).filter(
    Boolean,
  );

  return cvProfileSchema.parse(draft);
}

function handleListToken(
  token: Tokens.List,
  section: keyof CVProfile | "keywords" | null,
  draft: CVProfile,
) {
  if (!section) return;

  for (const item of token.items) {
    const text = getListItemText(item).trim();
    if (!text) continue;

    switch (section) {
      case "roles": {
        draft.roles.push(parseRole(text));
        break;
      }
      case "skills": {
        const skills = text.includes(",") ? splitDelimited(text) : [text];
        draft.skills.push(...skills);
        break;
      }
      case "projects": {
        draft.projects.push(parseProject(text));
        break;
      }
      case "education": {
        draft.education.push(parseEducation(text));
        break;
      }
      case "keywords": {
        draft.keywords.push(...splitDelimited(text));
        break;
      }
      default:
        break;
    }
  }
}

function parseRole(text: string): CVProfile["roles"][number] {
  const stack = extractTech(text);
  const yearsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:years|yrs)/i);
  const years = yearsMatch ? Number.parseFloat(yearsMatch[1]) : undefined;

  const atSplit = text.split(/\s+@\s+|\sat\s/i);
  const titleSegment = atSplit[0];
  const title = titleSegment.split(/[\-–—]/)[0].trim();

  return {
    title: title || text,
    stack,
    years,
  };
}

function parseProject(text: string): CVProfile["projects"][number] {
  const stack = extractTech(text);
  const [namePart, ...rest] = text.split(/[\-–—]/);
  const name = namePart.trim();
  const impact = rest.join(" - ").trim() || undefined;

  return {
    name: name || text,
    impact,
    stack,
  };
}

function parseEducation(text: string): CVProfile["education"][number] {
  const [degreePart, ...rest] = text.split(/@|\sat\s|-/i);
  const degree = degreePart.trim() || text.trim();
  const institution = rest.join(" ").trim() || undefined;
  return { degree, institution };
}

function getListItemText(item: Tokens.ListItem): string {
  if (item.text) return item.text;
  if (item.tokens) {
    return item.tokens
      .map((child) => ("text" in child ? (child as Tokens.Text).text : ""))
      .join(" ");
  }
  return "";
}

function splitDelimited(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map(cleanText)
    .filter(Boolean);
}

function cleanText(value: string): string {
  return value.replace(/[•*\-]/g, "").trim();
}
