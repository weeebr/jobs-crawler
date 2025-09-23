import Link from "next/link";

import type { Status } from "../hooks/useAnalysisRecord";

interface LoadingProps {
  status: "loading";
}

interface UnavailableProps {
  status: Exclude<Status, "ready" | "loading">;
}

type ReportStatusProps = LoadingProps | UnavailableProps;

export function ReportStatus(props: ReportStatusProps) {
  if (props.status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-300">
        <p className="text-sm text-slate-500">Loading analysis…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-center text-slate-200">
      <h1 className="text-2xl font-semibold">
        {props.status === "missing" ? "Report not found" : "Analysis unavailable"}
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        {props.status === "missing"
          ? "The analysis may have expired or never existed. Run a fresh comparison."
          : "We could not load this analysis. Retry from the dashboard."}
      </p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
      >
        Back to analyzer
      </Link>
    </div>
  );
}
