import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import type { AnalysisRecord } from "@/lib/types";

// Helper function to get API key for requests
async function getApiKey(): Promise<string> {
  return process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

// Helper function to make authenticated requests
async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = await getApiKey();

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...options.headers,
    },
  });
}

type Status = "loading" | "ready" | "missing" | "error";

interface AnalysisHeader {
  title: string;
  company: string;
  companyUrl?: string | null;
  createdAt: string;
  location?: string | null;
  workload?: string | null;
  duration?: string | null;
  companySize?: string | null;
  publishedAt?: string | null;
}

interface UseAnalysisRecordResult {
  record: AnalysisRecord | null;
  status: Status;
  setRecord: Dispatch<SetStateAction<AnalysisRecord | null>>;
  header: AnalysisHeader | null;
}

export function useAnalysisRecord(id: string): UseAnalysisRecordResult {
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let ignore = false;

    async function fetchFromApi() {
      try {
        const analysisId = Number(id);
        if (!Number.isFinite(analysisId)) {
          setStatus("missing");
          return;
        }

        const response = await apiRequest(`/api/analysis/${analysisId}`);

        if (response.status === 404) {
          setStatus("missing");
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch analysis: ${response.statusText}`);
        }

        const dbRecord = await response.json();

        if (!dbRecord) {
          setStatus("missing");
          return;
        }

        if (ignore) return;
        setRecord(dbRecord);
        setStatus("ready");
        console.info(`[report] loaded analysis ${id} from API`);
      } catch (error) {
        console.warn("[report] failed to fetch analysis from API", error);
        if (!ignore) {
          setStatus("error");
        }
      }
    }

    fetchFromApi();

    return () => {
      ignore = true;
    };
  }, [id]);

  const header = useMemo(() => {
    if (!record) return null;
    return {
      title: record.job.title,
      company: record.job.company,
      companyUrl: record.job.companyUrl,
      createdAt: new Date(record.createdAt).toLocaleString(),
      location: record.job.location,
      publishedAt: record.job.publishedAt,
      workload: record.job.workload,
      duration: record.job.duration,
      companySize: record.job.companySize,
    } satisfies AnalysisHeader;
  }, [record]);

  return { record, status, setRecord, header };
}

export type { Status, AnalysisHeader };
