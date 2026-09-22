"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Brain,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  KeyRound,
  LayoutList,
  Lock,
  LoaderCircle,
  Play,
  PlusCircle,
  Search,
  Sparkles,
  Table,
  X,
} from "lucide-react";
import { DeviceCheckWizard } from "./DeviceCheckWizard";
import { CandidateAssessmentsPanel } from "./CandidateAssessmentsPanel";
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

export interface AIPrepDashboardProps {
  initialView?: View;
  view?: View;
  onViewChange?: (view: View) => void;
  setupStatus?: {
    resume_uploaded?: boolean;
    api_keys_configured?: boolean;
    setup_complete?: boolean;
  };
  onStartAssessment?: () => void;
  onViewAssessments?: () => void;
  onBackToHome?: () => void;
}

export function AIPrepDashboard({
  initialView = "home",
  view: controlledView,
  onViewChange,
  setupStatus,
  onStartAssessment,
  onViewAssessments,
  onBackToHome,
}: AIPrepDashboardProps) {
  const router = useRouter();

  // ── Data state ────────────────────────────────────────────────────────────
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  const [llmStatus, setLlmStatus] = useState<LlmKeyStatus | null>(null);
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [internalView, setInternalView] = useState<View>(initialView);
  const view = controlledView !== undefined ? controlledView : internalView;

  const setView = (v: View) => {
    setInternalView(v);
    onViewChange?.(v);
  };

  useEffect(() => {
    if (controlledView === undefined && typeof window !== "undefined") {
      const p = window.location.pathname.toLowerCase();
      if (p.includes("/assessments")) {
        setInternalView("assessments");
      }
    }
  }, [controlledView]);

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [starting, setStarting] = useState(false);

  // ── Readiness flags ───────────────────────────────────────────────────────
  const hasLlmKey = useMemo(() => {
    if (llmStatus !== null) {
      return llmStatus.is_configured === true;
    }
    if (readiness?.llm_check) {
      return readiness.llm_check.is_configured === true;
    }
    if (setupStatus?.api_keys_configured !== undefined) {
      return Boolean(setupStatus.api_keys_configured);
    }
    return true;
  }, [llmStatus, readiness, setupStatus]);

  const hasResume = useMemo(() => {
    if (resumeStatus !== null) {
      return resumeStatus.has_resume === true;
    }
    if (readiness?.resume_check) {
      return readiness.resume_check.has_resume === true;
    }
    if (setupStatus?.resume_uploaded !== undefined) {
      return Boolean(setupStatus.resume_uploaded);
    }
    return true;
  }, [resumeStatus, readiness, setupStatus]);

  const isReady = useMemo(() => {
    if (readiness !== null) {
      return readiness.eligible === true;
    }
    if (setupStatus?.setup_complete !== undefined) {
      return Boolean(setupStatus.setup_complete);
    }
    return hasLlmKey && hasResume;
  }, [readiness, setupStatus, hasLlmKey, hasResume]);

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
    if (onStartAssessment) {
      onStartAssessment();
    } else {
      setView("assessment");
    }
  };

  const cardAction = (name: string) => {
    if (name === "View assessments") {
      if (onViewAssessments) {
        onViewAssessments();
      } else {
        setView("assessments");
      }
      return;
    }
    if (!isReady) {
      setShowSetupModal(true);
      return;
    }
    if (name === "Start an assessment") {
      void startAssessment();
    }
  };

  const cards = [
    { title: "Start an assessment", icon: Play },
    { title: "View assessments", icon: ClipboardList },
    { title: "Analytics", icon: BarChart3 },
    { title: "Scores", icon: FileText },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl">
        {/* Page header */}
        {view === "home" && (
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#071d49] dark:text-white">
              Welcome back!
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your AI-powered interview preparation platform.
            </p>
          </div>
        )}

        {/* API error banner */}
        {apiError && (
          <p className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {apiError}
          </p>
        )}

        {/* Main content */}
        {loading ? (
          <div className="grid min-h-[330px] place-items-center">
            <LoaderCircle className="animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : view === "assessment" ? (
          <DeviceCheckWizard onCancel={() => setView("home")} />
        ) : view === "home" ? (
          <section className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#071d49] dark:text-white">AI Prep</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Choose what you want to do next.
                </p>
              </div>
              <Sparkles className="text-indigo-500 dark:text-indigo-400" size={20} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {cards.map(({ title, icon: Icon }) => {
                const cardAccessible = title === "View assessments" || isReady;
                return (
                  <button
                    key={title}
                    onClick={() => cardAction(title)}
                    disabled={starting}
                    className={`group flex min-h-[86px] items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${cardAccessible
                      ? "border-slate-200 hover:border-purple-300 hover:bg-[#FAF6FF] hover:shadow-sm cursor-pointer dark:border-gray-800 dark:hover:border-purple-500/40 dark:hover:bg-purple-950/20"
                      : "border-slate-200 bg-slate-50 text-slate-400 dark:border-gray-800 dark:bg-gray-800/40 dark:text-slate-500"
                      }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all duration-200 ${cardAccessible
                        ? "border-purple-100 bg-[#F4EBFF] text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-[#7C3AED] dark:border-purple-900/40 dark:bg-purple-900/30"
                        : "border-slate-200 bg-slate-100 text-slate-400 dark:border-gray-700 dark:bg-gray-800"
                        }`}
                    >
                      {cardAccessible ? (
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
                      <b className="block text-[15px] font-semibold text-slate-700 transition-colors duration-200 group-hover:font-extrabold group-hover:text-[#6e2bf5] dark:text-slate-200 dark:group-hover:text-purple-400">
                        {starting && title === "Start an assessment"
                          ? "Starting…"
                          : title}
                      </b>
                      <small className="mt-1 block truncate text-slate-400 dark:text-slate-500">
                        {cardAccessible
                          ? title === "Start an assessment"
                            ? "Start a new practice session"
                            : title === "View assessments"
                              ? "Review your AI Prep results"
                              : "Coming soon — backend API not yet available"
                          : "Complete your LLM setup and upload your resume to access this."}
                      </small>
                    </span>
                    {!cardAccessible && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400 dark:bg-gray-800 dark:text-slate-500">
                        <Lock className="mr-1 inline" size={10} />
                        Locked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="mt-4">
            <CandidateAssessmentsPanel
              onBack={() => {
                if (onBackToHome) {
                  onBackToHome();
                } else {
                  setView("home");
                }
              }}
              onStartAssessment={() => startAssessment()}
            />
          </div>
        )}

        {/* Setup modal */}
        {showSetupModal && (
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <AlertCircle size={21} />
                  </span>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">
                      Complete your AI Prep setup
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Finish the missing setup before using AI Prep.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSetupModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
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
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-3 text-left hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <KeyRound className="text-indigo-600 dark:text-indigo-400" size={19} />
                      <span>
                        <b className="block text-sm text-gray-900 dark:text-white">
                          Go to LLM Setup
                        </b>
                        <small className="text-gray-500 dark:text-gray-400">
                          {llmStatus?.status === "failure"
                            ? llmStatus?.message ||
                            "LLM key is missing or invalid."
                            : "Required for interview feedback."}
                        </small>
                      </span>
                    </span>
                    <b className="text-indigo-600 dark:text-indigo-400">→</b>
                  </button>
                )}

                {!hasResume && (
                  <button
                    onClick={() => {
                      setShowSetupModal(false);
                      goToSetup("my-resume");
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-3 text-left hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="text-indigo-600 dark:text-indigo-400" size={19} />
                      <span>
                        <b className="block text-sm text-gray-900 dark:text-white">
                          Go to Resume Setup
                        </b>
                        <small className="text-gray-500 dark:text-gray-400">
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
                className="mt-5 w-full rounded-lg bg-gray-100 dark:bg-gray-800 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
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
