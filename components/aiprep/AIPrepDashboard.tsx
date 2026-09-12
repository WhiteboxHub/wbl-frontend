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
import { DeviceCheckWizard } from "./DeviceCheckWizard";
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
    : "—";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIPrepDashboard({
  setupStatus,
}: {
  setupStatus?: {
    resume_uploaded?: boolean;
    api_keys_configured?: boolean;
    setup_complete?: boolean;
  };
}) {
  const router = useRouter();

  // ── Data state ────────────────────────────────────────────────────────────
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  const [llmStatus, setLlmStatus] = useState<LlmKeyStatus | null>(null);
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<View>("home");
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [starting, setStarting] = useState(false);

  // ── Fetch all data on mount ───────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setApiError(null);

      const [readinessRes, llmRes, resumeRes, listRes] =
        await Promise.allSettled([
          aiPrepApi.getReadiness(),
          aiPrepApi.getLlmKeys(),
          aiPrepApi.getResumeStatus(),
          aiPrepApi.listAssessments(),
        ]);

      if (!isMounted) return;

      if (readinessRes.status === "fulfilled") {
        setReadiness(readinessRes.value);
      } else {
        console.warn("[AIPrepDashboard] getReadiness failed:", readinessRes.reason);
      }

      if (llmRes.status === "fulfilled") {
        setLlmStatus(llmRes.value);
      } else {
        console.warn("[AIPrepDashboard] getLlmKeys failed:", llmRes.reason);
      }

      if (resumeRes.status === "fulfilled") {
        setResumeStatus(resumeRes.value);
      } else {
        console.warn("[AIPrepDashboard] getResumeStatus failed:", resumeRes.reason);
      }

      if (listRes.status === "fulfilled") {
        setAssessments(listRes.value?.items ?? []);
      } else {
        console.warn("[AIPrepDashboard] listAssessments failed:", listRes.reason);
        setAssessments([]);
      }

      const allFailed =
        readinessRes.status === "rejected" &&
        llmRes.status === "rejected" &&
        resumeRes.status === "rejected" &&
        listRes.status === "rejected";

      if (allFailed) {
        setApiError(
          "Could not connect to the AI Prep service. Please refresh the page or try again later."
        );
      }

      setLoading(false);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Readiness flags ───────────────────────────────────────────────────────
  const hasLlmKey = useMemo(() => {
    if (llmStatus !== null) {
      return llmStatus.is_configured === true;
    }
    if (readiness?.llm_check) {
      return readiness.llm_check.is_configured === true;
    }
    return Boolean(setupStatus?.api_keys_configured);
  }, [llmStatus, readiness, setupStatus]);

  const hasResume = useMemo(() => {
    if (resumeStatus !== null) {
      return resumeStatus.has_resume === true;
    }
    if (readiness?.resume_check) {
      return readiness.resume_check.has_resume === true;
    }
    return Boolean(setupStatus?.resume_uploaded);
  }, [resumeStatus, readiness, setupStatus]);

  const isReady = useMemo(() => {
    if (readiness !== null) {
      return readiness.eligible === true;
    }
    return hasLlmKey && hasResume;
  }, [readiness, hasLlmKey, hasResume]);

  const readinessBannerMessage = useMemo(() => {
    if (!hasLlmKey && !hasResume) {
      return {
        title: "LLM setup & Resume are required",
        body: "Configure your LLM API keys and upload your resume to unlock AI Prep practice sessions.",
        fix: "both" as const,
      };
    }
    if (!hasLlmKey) {
      return {
        title: "LLM setup is not configured or has expired",
        body:
          llmStatus?.message ||
          "Please set up your LLM API keys to start an assessment.",
        fix: "llm" as const,
      };
    }
    if (!hasResume) {
      return {
        title: "Resume is not uploaded",
        body:
          resumeStatus?.message ||
          "Upload your resume so the AI can tailor assessment questions to your experience.",
        fix: "resume" as const,
      };
    }
    return null;
  }, [hasLlmKey, hasResume, llmStatus, resumeStatus]);

  const completed = useMemo(
    () => assessments.filter((a) => a.status === "COMPLETED"),
    [assessments]
  );

  // ── Navigation helpers ────────────────────────────────────────────────────
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
  };

  const cards = [
    { title: "Start an assessment", icon: Play },
    { title: "View assessments", icon: ClipboardList },
    { title: "Analytics", icon: BarChart3 },
    { title: "Scores", icon: FileText },
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-7 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Page header */}
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
        {!loading && !isReady && readinessBannerMessage && (
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
                  className="whitespace-nowrap rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 cursor-pointer"
                >
                  LLM Setup →
                </button>
                <button
                  onClick={() => goToSetup("my-resume")}
                  className="whitespace-nowrap rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 cursor-pointer"
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
                className="whitespace-nowrap rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 cursor-pointer"
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

        {/* Main content */}
        {loading ? (
          <div className="grid min-h-[330px] place-items-center">
            <LoaderCircle className="animate-spin text-indigo-600" />
          </div>
        ) : view === "assessment" ? (
          <DeviceCheckWizard onCancel={() => setView("home")} />
        ) : view === "home" ? (
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
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all duration-200 ${isReady
                      ? "border-purple-100 bg-[#F4EBFF] text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-[#7C3AED]"
                      : "border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                  >
                    {isReady ? (
                      <Icon
                        size={19}
                        className={`transition-colors duration-200 ${title === "Start an assessment" ? "group-hover:fill-white" : ""
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
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-600 hover:bg-indigo-100 cursor-pointer"
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
                    className="flex w-full justify-between border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 cursor-pointer"
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

        {/* Setup modal */}
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
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
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
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer"
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
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer"
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
                className="mt-5 w-full rounded-lg bg-slate-100 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
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

function AlertBadge() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-600 text-lg font-bold text-white">
      !
    </span>
  );
}

export default AIPrepDashboard;
