import Link from "next/link";

import { AppLogo } from "../../../components/AppLogo";

import type { AnalysisHeader } from "../hooks/useAnalysisRecord";

interface ReportHeaderProps {
  header: AnalysisHeader;
}

export function ReportHeader({ header }: ReportHeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 py-2">
        <div className="flex items-center justify-between">
          <AppLogo />
          <Link href="/" className="btn-ghost text-xs pr-0">
            <span className="hidden sm:inline">← Back to Dashboard</span>
            <span className="sm:hidden">←</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
