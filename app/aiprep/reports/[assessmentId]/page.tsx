"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import AiPrepReport from "@/components/aiprep/OverviewReport";

function ReportDetailContent() {
  const params = useParams<{ assessmentId: string }>();
  const searchParams = useSearchParams();
  const assessmentId = params?.assessmentId;
  const candidateId = searchParams?.get("candidateId") || undefined;
  if (!assessmentId) return null;

  return <AiPrepReport assessmentId={assessmentId} candidateId={candidateId} />;
}

export default function ReportDetailPage() {
  return (
    <Suspense fallback={null}>
      <ReportDetailContent />
    </Suspense>
  );
}
