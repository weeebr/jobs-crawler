import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiErrorResponse, createValidationErrorResponse, createSuccessResponse } from "@/lib/apiUtils";

import { analyzeJob, collectJobLinks, JOB_PIPELINE_DEFAULTS } from "@/lib/jobPipeline";
import { loadCvFromSources } from "@/lib/cvLoader";
import {
  cvProfileSchema,
  type CVProfile,
  type AnalyzeResponse,
} from "@/lib/schemas";
import type { AnalysisRecord } from "@/lib/types";

type AnalyzeRequestData = {
  jobUrl?: string;
  searchUrl?: string;
  rawHtml?: string;
  cv?: CVProfile;
  clearJobAdData?: boolean;
};

const analyzeRequestSchema = z.object({
  jobUrl: z.string().url().optional(),
  searchUrl: z.string().url().optional(),
  rawHtml: z.string().min(1, "rawHtml must not be empty").optional(),
  cv: cvProfileSchema.optional(),
  clearJobAdData: z.boolean().optional(),
}).refine((data: AnalyzeRequestData) => {
  const hasSingle = Boolean(data.jobUrl || data.rawHtml);
  const hasSearch = Boolean(data.searchUrl);
  return hasSingle || hasSearch;
}, {
  message: "Provide jobUrl, rawHtml, or searchUrl",
  path: ["jobUrl"],
}).refine((data: AnalyzeRequestData) => {
  const hasSingle = Boolean(data.jobUrl || data.rawHtml);
  const hasSearch = Boolean(data.searchUrl);
  return !(hasSingle && hasSearch);
}, {
  message: "Choose either jobUrl/rawHtml or searchUrl",
  path: ["searchUrl"],
});

// Response type is now defined in schemas.ts

export async function POST(request: NextRequest) {
  let payload: z.infer<typeof analyzeRequestSchema>;

  try {
    const data = await request.json();
    const parsed = analyzeRequestSchema.safeParse(data);
    if (!parsed.success) {
      return createValidationErrorResponse(parsed.error, "api/analyze");
    }
    payload = parsed.data;
  } catch (error) {
    return createApiErrorResponse(error, 400, "api/analyze");
  }

  try {
    let cvProfile: CVProfile;
    
    if (payload.cv) {
      cvProfile = payload.cv;
    } else {
      // Load CV from various sources (user settings, .env, or default file)
      const cvSource = await loadCvFromSources();
      if (cvSource.markdown) {
        // Parse the CV markdown to get the profile
        const { parseCvMarkdown } = await import("@/lib/parseCvMarkdown");
        const parsed = parseCvMarkdown(cvSource.markdown);
        cvProfile = cvProfileSchema.parse(parsed);
      } else {
        // Fallback to default CV
        const { loadDefaultCv } = await import("@/lib/defaultCv");
        cvProfile = (await loadDefaultCv()).profile;
      }
    }

    if (payload.searchUrl) {
      const searchResult = await analyzeSearchUrl(payload.searchUrl, cvProfile, payload.clearJobAdData);
      return NextResponse.json(searchResult);
    }

    const singleResult = await analyzeJob(
      { jobUrl: payload.jobUrl, rawHtml: payload.rawHtml },
      cvProfile,
      {
        clearJobAdData: payload.clearJobAdData,
        fetchOptions: {
          timeoutMs: JOB_PIPELINE_DEFAULTS.timeoutMs,
          retryCount: JOB_PIPELINE_DEFAULTS.retryCount,
        },
      },
    );

    const records: AnalysisRecord[] = [singleResult];
    return createSuccessResponse({ records });
  } catch (error) {
    return createApiErrorResponse(error, 500, "api/analyze");
  }
}

async function analyzeSearchUrl(
  searchUrl: string,
  cvProfile: CVProfile,
  clearJobAdData?: boolean,
): Promise<AnalyzeResponse> {
  const { jobLinks, fetchedPages } = await collectJobLinks(searchUrl, {
    fetchOptions: {
      timeoutMs: JOB_PIPELINE_DEFAULTS.timeoutMs,
      retryCount: JOB_PIPELINE_DEFAULTS.retryCount,
      clearJobAdData,
    },
    maxPages: JOB_PIPELINE_DEFAULTS.maxSearchPages,
  });

  console.info(
    `[api/analyze] search found ${jobLinks.length} unique links across ${fetchedPages} page(s)`,
  );

  if (jobLinks.length === 0) {
    console.info('[api/analyze] No job links found on search page - returning empty results');
    return { records: [] };
  }

  const records: AnalysisRecord[] = [];
  const errors: { url: string; message: string }[] = [];

  for (const link of jobLinks) {
    try {
      const record = await analyzeJob(
        { jobUrl: link },
        cvProfile,
        {
          clearJobAdData,
          fetchOptions: {
            timeoutMs: JOB_PIPELINE_DEFAULTS.timeoutMs,
            retryCount: JOB_PIPELINE_DEFAULTS.retryCount,
          },
        },
      );
      records.push(record);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown analysis failure";
      console.warn(`[api/analyze] failed for ${link}`, error);
      errors.push({ url: link, message });
    }
  }

  if (records.length === 0) {
    throw new Error("Failed to analyze any job ads from the search page");
  }

  return errors.length > 0 ? { records, errors } : { records };
}

// Testable functions are available for testing but not exported from API routes
