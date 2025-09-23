import { NextResponse } from "next/server";

export async function GET() {
  // Check if OpenAI API key is available in environment variables
  const hasEnvApiKey = Boolean(process.env.OPENAI_API_KEY);
  
  // Check if CV content is available in environment variables
  const cvMarkdown = process.env.CV_MARKDOWN;
  const hasCvMarkdown = Boolean(cvMarkdown);
  
  return NextResponse.json({ 
    hasEnvApiKey,
    hasCvMarkdown,
    markdown: hasCvMarkdown ? cvMarkdown : null,
    source: hasCvMarkdown ? 'env' : null,
    message: hasEnvApiKey 
      ? "OpenAI API key is configured in environment variables" 
      : "OpenAI API key not found in environment variables"
  });
}