"use client";

import { useState } from "react";
import { useLetterManager } from "./hooks/useLetterManager";
import { useAnalysisRecord } from "./hooks/useAnalysisRecord";
import { ReportStatus } from "./components/ReportStatus";
import { ReportHeader } from "./components/ReportHeader";
import { MatchOverview } from "./components/MatchOverview";
import { JobMetadataBar } from "./components/JobMetadataBar";
import { JobContent } from "./components/JobContent";
import { MotivationLetterModal } from "./components/MotivationLetterModal";

interface ReportPageProps {
  params: { id: string };
}

export default function ReportPage({ params }: ReportPageProps) {
  const { record, status, setRecord, header } = useAnalysisRecord(params.id);
  const {
    activeLetter,
    activeLanguage,
    loadingLanguage,
    letterError,
    copyNotice,
    handleGenerate,
    handleDraftChange,
    handleCopy,
  } = useLetterManager({ record, setRecord });
  
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);

  if (status !== "ready" || !record || !header) {
    const fallbackStatus = status === "ready" ? "error" : status;
    return <ReportStatus status={fallbackStatus} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <ReportHeader />
      <MatchOverview 
        header={header} 
        record={record} 
        onOpenLetterModal={() => setIsLetterModalOpen(true)}
      />
      <JobMetadataBar header={header} record={record} />

      <main className="mx-auto max-w-5xl px-4 py-4">
        <JobContent record={record} />
      </main>
      
      <MotivationLetterModal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        activeLetter={activeLetter}
        activeLanguage={activeLanguage}
        loadingLanguage={loadingLanguage}
        letterError={letterError}
        copyNotice={copyNotice}
        onGenerate={handleGenerate}
        onDraftChange={handleDraftChange}
        onCopy={handleCopy}
      />
    </div>
  );
}
