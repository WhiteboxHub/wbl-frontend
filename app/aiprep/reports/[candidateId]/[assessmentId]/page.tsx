"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import AiPrepReport from "@/components/aiprep/OverviewReport";

export default function CandidateAssessmentReportPage() {
  const params = useParams<{ candidateId: string; assessmentId: string }>();
  const assessmentId = params?.assessmentId;
  const candidateId = params?.candidateId;

  if (!assessmentId) return null;

  return (
    <Suspense fallback={null}>
      <AiPrepReport assessmentId={assessmentId} candidateId={candidateId} />
    </Suspense>
  );
}
