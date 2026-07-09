"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — AI-Prep analytics lives on the Analytics overview tab bar. */
export default function AiPrepAnalyticsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/avatar/analytics?tab=ai-prep");
  }, [router]);

  return null;
}
