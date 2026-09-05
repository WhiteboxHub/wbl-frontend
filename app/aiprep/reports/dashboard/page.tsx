"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExecutiveDashboard } from "@/components/aiprep/ExecutiveDashboard";
import { ReportOverview } from "@/components/aiprep/ReportOverview";

export default function AIPrepExecutiveDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const embedded = searchParams.get("embed") === "true";
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  if (selectedReportId !== null) {
    return (
      <ReportOverview
        assessmentId={selectedReportId}
        embedded={embedded}
        onBack={() => setSelectedReportId(null)}
      />
    );
  }

  return (
    <ExecutiveDashboard
      embedded={embedded}
      onViewReport={(id) => setSelectedReportId(id)}
      onBack={() => router.push("/user_dashboard/wbl-smartprep")}
    />
  );
}
