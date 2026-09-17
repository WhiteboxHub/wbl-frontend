"use client";

import { useParams } from "next/navigation";
import AssessmentCard from "@/components/aiprep/AssessmentCard";

export default function SessionPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return <AssessmentCard assessmentId={assessmentId} />;
}
