"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ReportOverview } from "@/components/aiprep/ReportOverview";

export default function AssessmentReportPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = Number(params.assessmentId);

  return Number.isInteger(assessmentId) && assessmentId > 0 ? (
    <ReportOverview
      assessmentId={assessmentId}
      onBack={() => router.push("/user_dashboard/wbl-smartprep")}
    />
  ) : (
    <div className="px-6 py-28 text-sm text-gray-600">Assessment report is not available.</div>
  );
}
