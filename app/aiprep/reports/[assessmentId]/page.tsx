"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import AiPrepReport from "@/components/aiprep/OverviewReport";

export default function ReportDetailPage() {
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = params?.assessmentId;
  if (!assessmentId) return null;

  return (
    <Suspense fallback={null}>
      <AiPrepReport assessmentId={assessmentId} />
    </Suspense>
  );
}
