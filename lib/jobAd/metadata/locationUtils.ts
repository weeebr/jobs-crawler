const REMOTE_KEYWORDS = ["remote", "hybrid", "anywhere", "distributed"];

const POSTAL_CITY_REGEX = /\b(\d{3,6})\s+([A-Za-zÀ-ÖØ-öø-ÿ'.-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'.-]+)*)/gu;

function extractPostalCity(value: string): string | undefined {
  let postalCity: string | undefined;
  for (const match of value.matchAll(POSTAL_CITY_REGEX)) {
    const postal = match[1];
    const cityRaw = match[2]?.trim();
    if (cityRaw) {
      postalCity = `${postal} ${cityRaw.replace(/\s+/g, " ")}`;
    }
  }

  if (postalCity) {
    return postalCity;
  }

  const compactMatch = value.match(/\b(\d{3,6})[-\s]*([A-Za-zÀ-ÖØ-öø-ÿ'.-]+)/u);
  if (compactMatch) {
    const [, postal, city] = compactMatch;
    return `${postal} ${city.replace(/\s+/g, " ")}`;
  }

  return undefined;
}

function extractTrailingCity(value: string): string | undefined {
  const tokens = value.split(/\s+/).filter(Boolean);
  const cityTokens: string[] = [];

  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index];
    if (/\d/.test(token)) {
      if (cityTokens.length > 0) break;
      continue;
    }
    if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(token)) {
      if (cityTokens.length > 0) break;
      continue;
    }
    cityTokens.push(token);
  }

  if (cityTokens.length === 0) {
    return undefined;
  }

  return cityTokens.reverse().join(" ");
}

export function normalizeLocationLabel(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const normalizedWhitespace = trimmed.replace(/\s+/g, " ");
  const lower = normalizedWhitespace.toLowerCase();

  if (REMOTE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return normalizedWhitespace;
  }

  const commaParts = normalizedWhitespace
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (commaParts.length > 0) {
    const postalCandidate = extractPostalCity(commaParts.join(", "));
    if (postalCandidate) {
      return postalCandidate;
    }

    const firstLetters = commaParts.find((part) => /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(part));
    if (firstLetters) {
      return firstLetters;
    }
  }

  const postalFromSingle = extractPostalCity(normalizedWhitespace);
  if (postalFromSingle) {
    return postalFromSingle;
  }

  const trailingCity = extractTrailingCity(normalizedWhitespace);
  if (trailingCity) {
    return trailingCity;
  }

  return normalizedWhitespace;
}
