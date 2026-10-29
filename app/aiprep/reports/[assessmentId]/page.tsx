"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import AiPrepReport from "@/components/aiprep/OverviewReport";

function ReportContent({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [reloadCancelled, setReloadCancelled] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setReloadCancelled(window.localStorage.getItem(`aiprep_reload_cancelled_${assessmentId}`) === "true");
    } catch {
      setReloadCancelled(false);
    }
  }, [assessmentId]);

  // Check the reload-cancellation marker before mounting the normal report view.
  if (reloadCancelled === null) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f8fafc] p-6">
        <p className="text-sm font-medium text-slate-600">Checking assessment status…</p>
      </main>
    );
  }

  if (reloadCancelled) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f8fafc] p-6">
        <section className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <XCircle size={30} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Assessment Cancelled</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            This assessment was cancelled because the assessment room was reloaded. No evaluation report is available for this attempt.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/user_dashboard/ai-prep")}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to AI Prep Dashboard
          </button>
        </section>
      </main>
    );
  }

  return <AiPrepReport assessmentId={assessmentId} />;
}

export default function ReportDetailPage() {
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = params?.assessmentId;
  if (!assessmentId) return null;

  return (
    <Suspense fallback={null}>
      <ReportContent assessmentId={assessmentId} />
    </Suspense>
  );
}
