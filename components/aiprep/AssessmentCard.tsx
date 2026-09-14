"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, LoaderCircle } from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";
import type { AssessmentDetail } from "@/types/aiprep";

export default function AssessmentCard({
  assessmentId,
  onBack,
}: {
  assessmentId: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        if (assessmentId === "new") {
          const created = await aiPrepApi.createAssessment();
          const detail = await aiPrepApi.getAssessment(created.id);
          setAssessment(detail);
          return;
        }
        setAssessment(await aiPrepApi.getAssessment(assessmentId));
      } catch (caught) {
        const err = caught as { body?: { detail?: unknown } };
        const detail = err.body?.detail;
        const reasons =
          detail &&
          typeof detail === "object" &&
          !Array.isArray(detail)
            ? (detail as { reasons?: string[] }).reasons
            : undefined;
        const message =
          detail &&
          typeof detail === "object" &&
          !Array.isArray(detail)
            ? (detail as { message?: string }).message
            : undefined;
        setError(
          reasons?.length
            ? reasons.join(" ")
            : message ||
              (typeof detail === "string"
                ? detail
                : "The assessment service could not create this session.")
        );
      }
    };
    void loadAssessment();
  }, [assessmentId]);

  if (!assessment && !error) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoaderCircle className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-6 text-center text-slate-600">
        {error}
      </div>
    );
  }

  const resolvedId = assessment?.id ?? assessmentId;

  return (
    <section className="bg-slate-50 py-4">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() =>
            onBack ? onBack() : router.push("/user_dashboard/aiprep")
          }
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to AI Prep
        </button>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <ClipboardCheck className="text-indigo-600" size={28} />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            {(assessment?.assessment_type || "Assessment").replaceAll("_", " ")}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your assessment session has been created. Status:{" "}
            {(assessment?.status || "In progress").replaceAll("_", " ")}.
          </p>

          <button
            onClick={() => router.push(`/aiprep/reports/${resolvedId}`)}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            View assessment details
          </button>
        </div>
      </div>
    </section>
  );
}
