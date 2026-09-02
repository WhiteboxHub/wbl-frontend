"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIPrepAssessmentPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/user_dashboard/wbl-smartprep?ai_prep_practice=1"); }, [router]);
  return null;
}
