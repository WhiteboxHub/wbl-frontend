"use client";

import { useParams } from "next/navigation";
import ReportShell from "@/components/aiprep/ReportShell";

export default function TranscriptReportPage() {
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = params?.assessmentId;

  if (!assessmentId) return null;

  return <ReportShell assessmentId={assessmentId} initialTab="Transcript" />;
}
