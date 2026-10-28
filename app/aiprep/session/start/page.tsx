'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Keep the old URL working, but send users to the shorter Before You Begin URL.
export default function AssessmentSessionStartPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/aiprep/start');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
      Opening assessment instructions…
    </div>
  );
}
