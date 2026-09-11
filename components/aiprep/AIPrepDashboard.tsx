"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  ClipboardList,
  FileText,
  KeyRound,
  Lock,
  LoaderCircle,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import AssessmentCard from "@/components/aiprep/AssessmentCard";
import { aiPrepApi } from "@/lib/aiprep-api";
import type {
  AssessmentSummary,
  LlmKeyStatus,
  ReadinessCheck,
  ResumeStatus,
} from "@/types/aiprep";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type View = "home" | "assessments" | "assessment";

/** Formats a date string or ISO timestamp into a readable date. */
const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(value)
    )
    : "Not started";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AIPrepDashboardProps {
  initialView?: View;
  setupStatus?: {
    resume_uploaded: boolean;
    api_keys_configured: boolean;
    setup_complete: boolean;
  };
}

export default function AIPrepDashboard({
  initialView = "home",
  setupStatus,
}: AIPrepDashboardProps) {
  const router = useRouter();

  // View state
  const [view, setView] = useState<View>(initialView);

  // Data state
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  const [llmStatus, setLlmStatus] = useState<LlmKeyStatus | null>(null);
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [apiError, setApiError] = useState("");

  // ---------------------------------------------------------------------------
  // Derived readiness flags
  //
  // All three backend responses must be present and valid. Unknown is not ready.
  // ---------------------------------------------------------------------------

  const hasLlmKey: boolean = (() => {
    return (
      llmStatus?.status === "valid" && llmStatus.is_configured === true
    );
  })();

  const hasResume: boolean = (() => {
    return (
      resumeStatus?.status === "valid" && resumeStatus.has_resume === true
    );
  })();

  const isReady =
    readiness?.llm_check?.is_configured === true &&
    readiness?.resume_check?.has_resume === true &&
    hasLlmKey &&
    hasResume;

  // ---------------------------------------------------------------------------
  // Initial data load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setApiError("");

      // Fire all four AI Prep checks in parallel.
      // Each is handled independently so a failure in one does not
      // prevent the others from providing their data.
      const [preCheck, llmCheck, resumeCheck, assessmentList] =
        await Promise.allSettled([
          aiPrepApi.getReadiness(),
          aiPrepApi.getLlmKeys(),
          aiPrepApi.getResumeStatus(),
          aiPrepApi.listAssessments(),
        ]);

      if (preCheck.status === "fulfilled") {
        setReadiness(preCheck.value);
      }

      if (llmCheck.status === "fulfilled") {
        setLlmStatus(llmCheck.value);
      }

      if (resumeCheck.status === "fulfilled") {
        setResumeStatus(resumeCheck.value);
      }

      if (
        preCheck.status === "rejected" ||
        llmCheck.status === "rejected" ||
        resumeCheck.status === "rejected"
      ) {
        console.error("[AIPrepDashboard] readiness fetch failed", {
          preCheck,
          llmCheck,
          resumeCheck,
        });
        setApiError("Could not load AI Prep readiness data. Please try again.");
      }

      if (assessmentList.status === "fulfilled") {
        setAssessments(assessmentList.value.items ?? []);
      } else {
        console.error(
          "[AIPrepDashboard] assessments fetch failed:",
          assessmentList.reason
        );
      }

      setLoading(false);
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const completed = useMemo(
    () => assessments.filter((a) => a.status === "COMPLETED"),
    [assessments]
  );

  // ---------------------------------------------------------------------------
  // Readiness banner message
  // ---------------------------------------------------------------------------

  const readinessBannerMessage = (() => {
    if (!hasLlmKey && !hasResume) {
      return {
        title: "LLM setup and Resume are not configured",
        body: "Set up your LLM API key and upload your resume to start an assessment.",
        fix: "both" as const,
      };
    }
    if (!hasLlmKey) {
      return {
        title: "LLM setup is not configured or has expired",
        body: "Please set up your LLM API keys to start an assessment.",
        fix: "llm" as const,
      };
    }
    return {
      title: "Resume is not uploaded",
      body: "Upload your resume to tailor your interview preparation.",
      fix: "resume" as const,
    };
  })();

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const goToSetup = (tab: "my-llm-setup" | "my-resume") =>
    router.push(`/user_dashboard/${tab}`);

  const startAssessment = () => {
    if (!isReady) {
      setShowSetupModal(true);
      return;
    }
    setView("assessment");
  };

  const cardAction = (name: string) => {
    if (!isReady) {
      setShowSetupModal(true);
      return;
    }
    if (name === "Start an assessment") {
      void startAssessment();
    } else if (name === "View assessments") {
      setView("assessments");
    }
    // Analytics / Scores: no backend API yet — button is shown but no action
    // (the lock state is already handled by the !isReady guard above).
  };

  // ---------------------------------------------------------------------------
  // Dashboard cards
  //
  // "Analytics" and "Scores" do not have AI Prep backend endpoints yet.
  // They are kept in the UI (locked when not ready) but do not connect to any
  // endpoint — no mock data, no invented API calls.
  // ---------------------------------------------------------------------------

  const cards = [
    { title: "Start an assessment", icon: Play },
    { title: "View assessments", icon: ClipboardList },
    { title: "Analytics", icon: BarChart3 },
    { title: "Scores", icon: FileText },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-7 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Page header – hidden when inside an assessment session */}
        {view !== "assessment" && (
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#071d49]">
              Welcome back!
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your AI-powered interview preparation platform.
            </p>
          </div>
        )}

        {/* Readiness banner */}
        {!loading && !isReady && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <AlertBadge />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{readinessBannerMessage.title}</p>
              <p className="text-xs">{readinessBannerMessage.body}</p>
            </div>
            {readinessBannerMessage.fix === "both" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => goToSetup("my-llm-setup")}
                  className="whitespace-nowrap rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600"
                >
                  LLM Setup →
                </button>
                <button
                  onClick={() => goToSetup("my-resume")}
                  className="whitespace-nowrap rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600"
                >
                  Resume →
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  goToSetup(
                    readinessBannerMessage.fix === "llm"
                      ? "my-llm-setup"
                      : "my-resume"
                  )
                }
                className="whitespace-nowrap rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600"
              >
                Complete setup →
              </button>
            )}
          </div>
        )}

        {/* API error banner */}
        {apiError && (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {apiError}
          </p>
        )}

        {/* ── Main content ── */}
        {loading ? (
          // Loading state
          <div className="grid min-h-[330px] place-items-center">
            <LoaderCircle className="animate-spin text-indigo-600" />
          </div>
        ) : view === "assessment" ? (
          // ── Assessment session ──
          <AssessmentCard
            assessmentId="new"
            onBack={() => setView("home")}
          />
        ) : view === "home" ? (
          // ── Home / card grid ──
          <section className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#071d49]">AI Prep</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose what you want to do next.
                </p>
              </div>
              <Sparkles className="text-indigo-500" size={20} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {cards.map(({ title, icon: Icon }) => (
                <button
                  key={title}
                  onClick={() => cardAction(title)}
                  disabled={starting}
                  className={`group flex min-h-[86px] items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${isReady
                      ? "border-slate-200 hover:border-purple-300 hover:bg-[#FAF6FF] hover:shadow-sm cursor-pointer"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all duration-200 ${
                    isReady
                      ? "border-slate-200 bg-white text-slate-400 group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-[#5b32e8] group-hover:to-[#9a57ff] group-hover:shadow-md group-hover:shadow-purple-500/25"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}>
                    {isReady ? (
                      <Icon
                        size={19}
                        className={`text-indigo-600 transition-colors duration-200 group-hover:text-white ${
                          title === "Start an assessment" ? "group-hover:fill-white" : ""
                        }`}
                      />
                    ) : (
                      <Lock size={17} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[15px] font-semibold text-slate-700 transition-colors duration-200 group-hover:font-extrabold group-hover:text-[#6e2bf5]">
                      {starting && title === "Start an assessment"
                        ? "Starting…"
                        : title}
                    </b>
                    <small className="mt-1 block truncate text-slate-400">
                      {isReady
                        ? title === "Start an assessment"
                          ? "Start a new practice session"
                          : title === "View assessments"
                            ? "Review your AI Prep results"
                            : "Coming soon — backend API not yet available"
                        : "Complete your LLM setup and upload your resume to access this."}
                    </small>
                  </span>
                  {!isReady && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400">
                      <Lock className="mr-1 inline" size={10} />
                      Locked
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        ) : (
          // ── Assessments list ──
          <section className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#071d49]">
                  Your assessments
                </h2>
                <p className="text-sm text-slate-500">
                  Completed reports: {completed.length}
                </p>
              </div>
              <button
                onClick={() => setView("home")}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-600 hover:bg-indigo-100"
              >
                ← Back to Dashboard
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              {assessments.length ? (
                assessments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => router.push(`/aiprep/reports/${a.id}`)}
                    className="flex w-full justify-between border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                  >
                    <span>
                      <b className="block text-sm text-slate-800">
                        {(a.assessment_type || "Assessment").replaceAll(
                          "_",
                          " "
                        )}
                      </b>
                      <small className="text-slate-500">
                        {formatDate(a.started_at || a.created_at)}
                      </small>
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {(a.status || "Unknown").replaceAll("_", " ")}
                    </span>
                  </button>
                ))
              ) : (
                <p className="p-7 text-center text-sm text-slate-500">
                  No assessments yet.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── Setup-required modal ── */}
        {showSetupModal && (
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-600">
                    <AlertCircle size={21} />
                  </span>
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Complete your AI Prep setup
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Finish the missing setup before using AI Prep.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSetupModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  aria-label="Close setup modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {!hasLlmKey && (
                  <button
                    onClick={() => {
                      setShowSetupModal(false);
                      goToSetup("my-llm-setup");
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <span className="flex items-center gap-3">
                      <KeyRound className="text-indigo-600" size={19} />
                      <span>
                        <b className="block text-sm text-slate-900">
                          Go to LLM Setup
                        </b>
                        <small className="text-slate-500">
                          {llmStatus?.status === "failure"
                            ? llmStatus?.message ||
                            "LLM key is missing or invalid."
                            : "Required for interview feedback."}
                        </small>
                      </span>
                    </span>
                    <b className="text-indigo-600">→</b>
                  </button>
                )}

                {!hasResume && (
                  <button
                    onClick={() => {
                      setShowSetupModal(false);
                      goToSetup("my-resume");
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="text-indigo-600" size={19} />
                      <span>
                        <b className="block text-sm text-slate-900">
                          Go to Resume Setup
                        </b>
                        <small className="text-slate-500">
                          {resumeStatus?.message ||
                            "Used to tailor assessment questions."}
                        </small>
                      </span>
                    </span>
                    <b className="text-indigo-600">→</b>
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowSetupModal(false)}
                className="mt-5 w-full rounded-lg bg-slate-100 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AlertBadge() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-600 text-lg font-bold text-white">
      !
    </span>
  );
}
