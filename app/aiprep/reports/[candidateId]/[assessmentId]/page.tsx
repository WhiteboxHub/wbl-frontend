"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import AiPrepReport from "@/components/aiprep/OverviewReport";

export default function CandidateAssessmentReportPage({
  params: routeParams,
}: {
  params?: { candidateId?: string; assessmentId?: string };
} = {}) {
  const hookParams = useParams<{ candidateId?: string; assessmentId?: string }>();
  const assessmentId = routeParams?.assessmentId || hookParams?.assessmentId;
  const candidateId = routeParams?.candidateId || hookParams?.candidateId;

  if (!assessmentId) return null;

  return (
    <Suspense fallback={null}>
      <AiPrepReport assessmentId={assessmentId} candidateId={candidateId} />
    </Suspense>
  );
}
