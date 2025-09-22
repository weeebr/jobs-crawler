import { z } from "zod";

const OPENAI_BASE_URL = "https://api.openai.com/v1";

const mottoResponseSchema = z.object({
  motto: z.string(),
  result: z.boolean(),
  reasoning: z.string(),
});

// type MottoResponse = z.infer<typeof mottoResponseSchema>;

export interface MottoExtractionResult {
  motto: string; // Always returns motto or "-"
  found: boolean;
  reasoning: string | null;
  origin?: {
    source: 'job_ad' | 'company_page' | 'fallback' | 'api_error';
    sourceUrl?: string;
    confidence: 'high' | 'medium' | 'low';
    extractedFrom?: string; // Specific section or context where found
  };
}

export async function extractMottoLLM(
  text: string,
  company: string,
  sourceUrl?: string,
): Promise<MottoExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.info("[extractMottoLLM] missing OPENAI_API_KEY, using fallback");
    // Fall back to simple keyword-based extraction
    const { extractMotto } = await import("./sizeAndMotto");
    const simpleMotto = extractMotto(text);
    return {
      motto: simpleMotto || "-",
      found: Boolean(simpleMotto),
      reasoning: "No API key available, using keyword fallback",
      origin: {
        source: 'fallback',
        sourceUrl: sourceUrl,
        confidence: 'low',
        extractedFrom: 'keyword-based extraction'
      }
    };
  }

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildRequestPayload(text, company, sourceUrl)),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(
        `[extractMottoLLM] OpenAI responded ${response.status}: ${text.slice(0, 200)}`,
      );
      return {
        motto: "-",
        found: false,
        reasoning: `API error: ${response.status}`,
        origin: {
          source: 'api_error',
          sourceUrl: sourceUrl,
          confidence: 'low',
          extractedFrom: 'API request failed'
        }
      };
    }

    const data = await response.json();
    const content: unknown = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      console.warn("[extractMottoLLM] missing content in OpenAI response");
      return {
        motto: "-",
        found: false,
        reasoning: "No content in API response",
        origin: {
          source: 'api_error',
          sourceUrl: sourceUrl,
          confidence: 'low',
          extractedFrom: 'Empty API response'
        }
      };
    }

    const parsed = extractJson(content);
    if (!parsed) {
      console.warn("[extractMottoLLM] failed to parse OpenAI JSON payload");
      return {
        motto: "-",
        found: false,
        reasoning: "Failed to parse JSON response",
        origin: {
          source: 'api_error',
          sourceUrl: sourceUrl,
          confidence: 'low',
          extractedFrom: 'Invalid JSON response'
        }
      };
    }

    const result = mottoResponseSchema.safeParse(parsed);
    if (!result.success) {
      console.warn("[extractMottoLLM] invalid OpenAI payload", result.error);
      return {
        motto: "-",
        found: false,
        reasoning: "Invalid response format",
        origin: {
          source: 'api_error',
          sourceUrl: sourceUrl,
          confidence: 'low',
          extractedFrom: 'Schema validation failed'
        }
      };
    }

    // Return the motto if result is true, otherwise return "-"
    const finalMotto = result.data.result ? result.data.motto : "-";
    
    console.info(
      `[extractMottoLLM] extracted motto result=${result.data.result} motto="${finalMotto || 'none'}"`,
    );

    return {
      motto: finalMotto,
      found: result.data.result,
      reasoning: result.data.reasoning,
      origin: {
        source: 'job_ad',
        sourceUrl: sourceUrl,
        confidence: result.data.result ? 'high' : 'low',
        extractedFrom: result.data.result ? 'LLM analysis of job posting' : 'No motto found in job posting'
      }
    };
  } catch (error) {
    console.warn("[extractMottoLLM] motto extraction failure", error);
    return {
      motto: "-",
      found: false,
      reasoning: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      origin: {
        source: 'api_error',
        sourceUrl: sourceUrl,
        confidence: 'low',
        extractedFrom: 'Exception during processing'
      }
    };
  }
}

function buildRequestPayload(text: string, company: string, sourceUrl?: string) {
  const system = `You are a precise company culture analyst. Extract company mottos, values, or mission statements.

CRITICAL RULES:
- Only extract mottos/values that are explicitly stated as belonging to the company
- Look for clear, direct company motto/values statements (e.g., "Our mission is...", "We believe in...", "Company values: ...")
- If no clear company motto exists, return result: false and motto: "-"

Return JSON with: motto (string), result (boolean), reasoning (string)`;

  const user = `Analyze this job posting text for company motto/values for "${company}".

Company: ${company}
Source: ${sourceUrl || "unknown"}

Text to analyze:
${text.slice(0, 3000)}${text.length > 3000 ? "\n\n[truncated...]" : ""}

Extract the company's motto, values, or mission statement if clearly stated. Be conservative - only return result: true if it's explicitly the company's motto/values.`;

  return {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.1,
    max_tokens: 500,
  };
}

function extractJson(text: string): unknown {
  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}
