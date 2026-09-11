"use client";

import { useParams } from "next/navigation";
import { DeviceCheckWizard } from "@/components/aiprep/DeviceCheckWizard";

export default function SessionPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return <DeviceCheckWizard assessmentId={assessmentId ? Number(assessmentId) : undefined} />;
}

