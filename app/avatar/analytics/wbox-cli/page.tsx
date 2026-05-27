"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — WboxCLI lives on the Analytics overview tab bar. */
export default function WboxCliAnalyticsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/avatar/analytics?tab=wbox-cli");
  }, [router]);

  return null;
}
