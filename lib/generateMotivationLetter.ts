import { OPENAI_BASE_URL } from "./letterHelpers";
import {
  buildRequestPayload,
  sanitizeLetter,
  buildTemplateLetter,
  type GenerateLetterInput,
  type LetterResult,
} from "./letterHelpers";

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
