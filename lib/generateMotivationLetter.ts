import type { CVProfile, JobAdParsed, ComparisonResult } from "./schemas";

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_MODEL =
  process.env.OPENAI_LETTER_MODEL ?? process.env.OPENAI_MATCH_MODEL ?? "gpt-4o";

export type LetterLanguage = "en" | "de";

interface GenerateLetterInput {
  job: JobAdParsed;
  cv: CVProfile;
  heuristics: ComparisonResult;
  language: LetterLanguage;
}

interface LetterResult {
  content: string;
  source: "llm" | "template";
}

export async function generateMotivationLetter(
  input: GenerateLetterInput,
): Promise<LetterResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is required for job analysis. Please configure your API key in the environment variables.");
  }

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildRequestPayload(input)),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(
        `[generateMotivationLetter] OpenAI responded ${response.status}: ${text.slice(0, 200)}`,
      );
      return {
        content: buildTemplateLetter(input),
        source: "template",
      };
    }

    const data = await response.json();
    const content: unknown = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      console.warn("[generateMotivationLetter] missing content in OpenAI response");
      return {
        content: buildTemplateLetter(input),
        source: "template",
      };
    }

    console.info(
      `[generateMotivationLetter] generated letter (${input.language}) via llm`,
    );

    return {
      content: sanitizeLetter(content, input.language),
      source: "llm",
    };
  } catch (error) {
    console.warn("[generateMotivationLetter] letter failure", error);
    return {
      content: buildTemplateLetter(input),
      source: "template",
    };
  }
}

function buildRequestPayload({ job, cv, heuristics, language }: GenerateLetterInput) {
  const system =
    "You are a precise hiring expert. Draft authentic motivation letters that rely strictly on provided evidence. Do not fabricate achievements or technologies.";
  const locale = language === "de" ? "German" : "English";
  const stackMatches = listStackMatches(heuristics, job.stack, language);
  const topProjects = cv.projects
    .slice(0, 3)
    .map((project) =>
      [project.name, project.stack.slice(0, 6).join(", "), project.impact]
        .filter(Boolean)
        .join(" — "),
    )
    .filter(Boolean);

  const user = `Write a ${locale} motivation letter tailored to the following job.
- Keep it under 320 words.
- Highlight only the candidate's strengths that are explicitly listed.
- Reference concrete achievements or technologies from the CV when claiming alignment.
- If a requested skill is missing, acknowledge the learning plan instead of faking experience.

JOB SNAPSHOT
Title: ${job.title}
Company: ${job.company}
Stack focus: ${job.stack.slice(0, 12).join(", ") || "unspecified"}
Key requirements: ${job.qualifications.slice(0, 6).join("; ") || "(none extracted)"}
Role focus: ${job.roles.slice(0, 4).join("; ") || "(none extracted)"}
Values: ${job.motto ?? "(not provided)"}

CANDIDATE SNAPSHOT
Roles: ${cv.roles
    .map((role) =>
      [role.title, role.stack.slice(0, 6).join(", "),
        typeof role.years === "number" ? `${role.years} years` : null]
        .filter(Boolean)
        .join(" — "),
    )
    .slice(0, 4)
    .join("; ") || "(no roles provided)"}
Skills: ${cv.skills.slice(0, 12).join(", ") || "(no skills provided)"}
Projects: ${topProjects.join("; ") || "(no projects provided)"}
Keywords: ${cv.keywords.slice(0, 12).join(", ") || "(no keywords provided)"}

STACK MATCH SUMMARY
${stackMatches}
`;

  return {
    model: OPENAI_MODEL,
    temperature: language === "de" ? 0.3 : 0.2,
    messages: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: user,
      },
    ],
  } satisfies Record<string, unknown>;
}

function sanitizeLetter(content: string, language: LetterLanguage) {
  const trimmed = content.trim();
  if (trimmed.startsWith("Dear")) return trimmed;
  if (language === "de" && trimmed.startsWith("Sehr")) return trimmed;
  // Ensure salutation exists to make the letter copy-ready.
  const salutation =
    language === "de"
      ? "Sehr geehrtes Recruiting-Team,"
      : "Dear Hiring Team,";
  return `${salutation}\n\n${trimmed}`;
}

function buildTemplateLetter({ job, cv, heuristics, language }: GenerateLetterInput) {
  const greeting =
    language === "de"
      ? "Sehr geehrtes Recruiting-Team," 
      : "Dear Hiring Team,";
  const closing =
    language === "de"
      ? "Mit freundlichen Grüßen\n[Ihr Name]"
      : "Kind regards\n[Your Name]";
  const matching = listStackMatches(heuristics, job.stack, language);
  const strongestRole = cv.roles[0];
  const roleLine = strongestRole
    ? language === "de"
      ? `In meiner Rolle als ${strongestRole.title} arbeitete ich täglich mit ${strongestRole.stack.join(", ")}.`
      : `In my role as ${strongestRole.title}, I worked daily with ${strongestRole.stack.join(", ")}.`
    : "";
  const projectLine = cv.projects[0]
    ? language === "de"
      ? `Ein Beispiel: ${cv.projects[0].name} (${cv.projects[0].stack.join(", ")})${cv.projects[0].impact ? ` — ${cv.projects[0].impact}` : ""}.`
      : `For example, ${cv.projects[0].name} (${cv.projects[0].stack.join(", ")})${cv.projects[0].impact ? ` — ${cv.projects[0].impact}` : ""}.`
    : "";
  const learning = heuristics.gaps.length
    ? language === "de"
      ? `Wo mir Erfahrung fehlt (${heuristics.gaps.join(", ")}), plane ich einen konkreten Lernpfad und dokumentiere Fortschritte transparent.`
      : `Where I lack evidence (${heuristics.gaps.join(", ")}), I outline a concrete learning plan and document progress transparently.`
    : "";

  const intro =
    language === "de"
      ? `Ihre Position "${job.title}" bei ${job.company} spricht mich an, weil sie praxisnahe Zusammenarbeit und messbare Wirkung fordert.`
      : `Your role "${job.title}" at ${job.company} resonates with me because it demands hands-on collaboration and measurable outcomes.`;

  const bodyLines = [intro, roleLine, projectLine, matching, learning]
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");

  return `${greeting}\n\n${bodyLines}\n\n${closing}`;
}

function listStackMatches(
  heuristics: ComparisonResult,
  stack: string[],
  language: LetterLanguage,
): string {
  if (stack.length === 0) {
    return language === "de"
      ? "Es wurde kein Tech-Stack aus der Ausschreibung extrahiert."
      : "No stack extracted from the job description.";
  }
  const matched = stack.filter((tech) => !heuristics.gaps.includes(tech));
  const missing = heuristics.gaps;
  const matchedLine =
    matched.length > 0
      ? language === "de"
        ? `Abgedeckter Stack: ${matched.join(", ")}.`
        : `Proven stack coverage: ${matched.join(", ")}.`
      : language === "de"
        ? "Noch keine nachgewiesene Stack-Überschneidung." 
        : "No proven stack coverage detected yet.";
  const missingLine =
    missing.length > 0
      ? language === "de"
        ? `Fehlende Nachweise: ${missing.join(", ")}.`
        : `Missing evidence: ${missing.join(", ")}.`
      : language === "de"
        ? "Alle gewünschten Technologien sind belegt."
        : "All requested technologies covered by experience.";
  return `${matchedLine}\n${missingLine}`;
}
