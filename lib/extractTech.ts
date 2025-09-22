const CANONICAL_TECH = [
  "TypeScript",
  "JavaScript",
  "Node.js",
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Svelte",
  "Python",
  "Django",
  "Flask",
  "Ruby",
  "Rails",
  "Java",
  "Spring",
  "Kotlin",
  "Go",
  "Rust",
  "AWS",
  "GCP",
  "Azure",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "GraphQL",
  "REST",
  "Docker",
  "Kubernetes",
  "Terraform",
  "CI/CD",
  "Jest",
  "Vitest",
  "Playwright",
];

const ALIASES = new Map<string, string>([
  ["ts", "TypeScript"],
  ["typescript", "TypeScript"],
  ["javascript", "JavaScript"],
  ["node", "Node.js"],
  ["node.js", "Node.js"],
  ["nodejs", "Node.js"],
  ["react.js", "React"],
  ["reactjs", "React"],
  ["next", "Next.js"],
  ["nextjs", "Next.js"],
  ["google cloud", "GCP"],
  ["gcp", "GCP"],
  ["aws", "AWS"],
  ["azure", "Azure"],
  ["postgres", "PostgreSQL"],
  ["postgresql", "PostgreSQL"],
  ["mysql", "MySQL"],
  ["mongo", "MongoDB"],
  ["mongodb", "MongoDB"],
  ["graphql", "GraphQL"],
  ["rest", "REST"],
  ["docker", "Docker"],
  ["kubernetes", "Kubernetes"],
  ["k8s", "Kubernetes"],
  ["terraform", "Terraform"],
  ["ci/cd", "CI/CD"],
  ["cicd", "CI/CD"],
  ["jest", "Jest"],
  ["vitest", "Vitest"],
  ["playwright", "Playwright"],
  ["python", "Python"],
  ["django", "Django"],
  ["flask", "Flask"],
  ["ruby", "Ruby"],
  ["rails", "Rails"],
  ["java", "Java"],
  ["spring", "Spring"],
  ["kotlin", "Kotlin"],
  ["golang", "Go"],
  ["go", "Go"],
  ["rust", "Rust"],
  ["vue", "Vue"],
  ["angular", "Angular"],
  ["svelte", "Svelte"],
]);

const WORD_BOUNDARY = /[\s,.;:()\[\]{}<>\-_/\\]/;

function normalizeText(text: string) {
  return text.toLowerCase();
}

export function extractTech(text: string): string[] {
  const normalized = normalizeText(text);
  const results = new Set<string>();

  for (const [alias, canonical] of ALIASES.entries()) {
    if (matchAlias(normalized, alias)) {
      results.add(canonical);
    }
  }

  const directMatches = CANONICAL_TECH.filter((tech) => {
    const alias = tech.toLowerCase();
    return matchAlias(normalized, alias);
  });

  for (const tech of directMatches) {
    results.add(tech);
  }

  return Array.from(results).sort((a, b) => a.localeCompare(b));
}

function matchAlias(text: string, alias: string) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|${WORD_BOUNDARY.source})${escaped}($|${WORD_BOUNDARY.source})`, "i");
  return pattern.test(text);
}
