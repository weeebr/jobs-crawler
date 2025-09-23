import { NextResponse } from "next/server";

export async function GET() {
  // Check if OpenAI API key is available in environment variables
  const hasEnvApiKey = Boolean(process.env.OPENAI_API_KEY);
  
  return NextResponse.json({ 
    hasEnvApiKey,
    message: hasEnvApiKey 
      ? "OpenAI API key is configured in environment variables" 
      : "OpenAI API key not found in environment variables"
  });
}