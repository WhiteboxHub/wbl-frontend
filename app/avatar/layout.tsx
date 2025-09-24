// wbl-frontend\app\avatar\layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUserTeamRole } from "@/utils/auth";
import { AvatarLayout } from "@/components/AvatarLayout";

export default function AvatarSectionLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Check if user is authenticated
      const auth = await isAuthenticated();
      const role = getUserTeamRole();

      // If not authenticated or not admin, redirect
      if (!auth.valid || role !== "admin") {
        router.replace("/"); // Or redirect to a custom "Access Denied" page
      } else {
        setLoading(false); // Allow access
      }
    })();
  }, [router]);

  // Show loading while verifying auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Checking access...</p>
      </div>
    );
  }

  return <AvatarLayout>{children}</AvatarLayout>;
}
