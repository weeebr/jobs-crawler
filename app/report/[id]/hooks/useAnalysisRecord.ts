import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import {
  loadAnalysisRecord,
  loadRecentSummaries,
  persistAnalysisRecord,
  persistRecentSummaries,
  toSummary,
  type RecentAnalysisSummary,
} from "@/lib/clientStorage";
import type { AnalysisRecord } from "@/lib/types";

type Status = "loading" | "ready" | "missing" | "error";

interface AnalysisHeader {
  title: string;
  company: string;
  companyUrl?: string | null;
  createdAt: string;
  location?: string | null;
  workload?: string | null;
  duration?: string | null;
  teamSize?: string | null;
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

    function syncRecent(nextRecord: AnalysisRecord) {
      const summary = toSummary(nextRecord);
      const current = loadRecentSummaries();
      const next: RecentAnalysisSummary[] = [
        summary,
        ...current.filter((item) => item.id !== nextRecord.id),
      ];
      persistRecentSummaries(next.slice(0, 5));
    }

    function hydrateFromLocal() {
      const localRecord = loadAnalysisRecord(Number(id));
      if (localRecord && !ignore) {
        setRecord(localRecord);
        setStatus("ready");
        syncRecent(localRecord);
        return true;
      }
      return false;
    }

    if (hydrateFromLocal()) {
      return () => {
        ignore = true;
      };
    }

    async function fetchRemote() {
      try {
        const response = await fetch(`/api/analysis/${id}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          setStatus(response.status === 404 ? "missing" : "error");
          return;
        }

        const remoteRecord = (await response.json()) as AnalysisRecord;
        persistAnalysisRecord(remoteRecord);
        syncRecent(remoteRecord);
        if (ignore) return;
        setRecord(remoteRecord);
        setStatus("ready");
      } catch (error) {
        console.warn("[report] failed to fetch analysis", error);
        if (!ignore) {
          setStatus("error");
        }
      }
    }

    fetchRemote();

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
      teamSize: record.job.teamSize,
    } satisfies AnalysisHeader;
  }, [record]);

  return { record, status, setRecord, header };
}

export type { Status, AnalysisHeader };
