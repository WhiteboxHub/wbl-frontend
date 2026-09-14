"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  ClipboardList,
  FileText,
  Lock,
  LoaderCircle,
  Play,
} from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";
import type {
  AssessmentSummary,
  ReadinessCheck,
} from "@/types/aiprep";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type View = "home" | "assessments";

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
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // ---------------------------------------------------------------------------
  // Derived readiness flags — sourced entirely from pre-check response
  // ---------------------------------------------------------------------------

  const hasLlmKey = readiness?.llm_check?.is_configured === true;
  const hasResume = readiness?.resume_check?.has_resume === true;
  const isReady = hasLlmKey && hasResume;

  // ---------------------------------------------------------------------------
  // Initial data load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setApiError("");

      const [preCheck, assessmentList] = await Promise.allSettled([
        aiPrepApi.getReadiness(),
        aiPrepApi.listAssessments(),
      ]);

      if (preCheck.status === "fulfilled") {
        setReadiness(preCheck.value);
      } else {
        console.error("[AIPrepDashboard] pre-check failed:", preCheck.reason);
        setApiError("Could not load AI Prep readiness data. Please try again.");
      }

      if (assessmentList.status === "fulfilled") {
        setAssessments(assessmentList.value.items ?? []);
      } else {
        console.error("[AIPrepDashboard] assessments fetch failed:", assessmentList.reason);
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
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const goToSetup = (tab: "my-llm-setup" | "my-resume") =>
    router.push(`/user_dashboard/${tab}`);

  const cardAction = (name: string) => {
    if (name === "Start an assessment") {
      router.push("/aiprep/start");
    } else if (name === "View assessments") {
      setView("assessments");
    }
  };

  // ---------------------------------------------------------------------------
  // Dashboard cards
  //
  // "Analytics" and "Scores" do not have AI Prep backend endpoints yet.
  // They are kept in the UI (locked when not ready) but do not connect to any
  // endpoint — no mock data, no invented API calls.
  // ---------------------------------------------------------------------------

  const cards = [
    { title: "Start Assessment", name: "Start an assessment", icon: Play, desc: "Begin a new AI-powered assessment tailored to your goals.", comingSoon: false },
    { title: "View Assessments", name: "View assessments", icon: ClipboardList, desc: "Review your past assessments, feedback, and performance.", comingSoon: false },
    { title: "Analytics", name: "Analytics", icon: BarChart3, desc: "Track your progress and identify areas for improvement.", comingSoon: true },
    { title: "Scores", name: "Scores", icon: FileText, desc: "View your detailed scores and performance breakdown.", comingSoon: true },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  }).format(new Date());

  // Get first name from JWT sub (email prefix) stored in localStorage
  const firstName = (() => {
    if (typeof window === "undefined") return "";
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      const sub: string = payload.sub || payload.email || "";
      // If it looks like an email, take the part before @; otherwise use as-is
      const name = sub.includes("@") ? sub.split("@")[0] : sub;
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch { return ""; }
  })();

  return (
    <div className="px-8 py-7">
      <div className="mx-auto max-w-5xl">

        {/* Page header */}
        <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Dashboard</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#071d49]">
                Welcome back{firstName ? `, ${firstName}` : ""}!
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Your AI-powered interview preparation platform.
              </p>
            </div>
            <span className="text-sm text-slate-400 mt-1 whitespace-nowrap">{today}</span>
        </div>

        {/* Readiness banners — one per missing item */}
        {!loading && !hasLlmKey && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3.5">
            <AlertCircle size={20} className="text-rose-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-700">LLM setup is not configured or has expired</p>
              <p className="text-xs text-rose-600 mt-0.5">Please set up your LLM API keys to start an assessment.</p>
            </div>
            <button
              onClick={() => goToSetup("my-llm-setup")}
              className="whitespace-nowrap rounded-lg border border-rose-300 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-rose-50 transition-colors"
            >
              Go to LLM Setup →
            </button>
          </div>
        )}
        {!loading && !hasResume && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
            <AlertCircle size={20} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-700">Resume is not set up</p>
              <p className="text-xs text-amber-600 mt-0.5">Please upload or configure your resume to get personalized assessments.</p>
            </div>
            <button
              onClick={() => goToSetup("my-resume")}
              className="whitespace-nowrap rounded-lg border border-amber-300 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-amber-50 transition-colors"
            >
              Go to Resume Setup →
            </button>
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
        ) : view === "home" ? (
          // ── Home / card grid ──
          <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map(({ title, name, icon: Icon, desc, comingSoon }) => {
              const canUse = isReady && !comingSoon;
              return (
                <div
                  key={name}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
                >
                  <div className="bg-indigo-50 rounded-xl w-12 h-12 flex items-center justify-center">
                    <Icon size={20} className="text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{title}</p>
                    <p className="text-xs text-gray-500 mt-1">{desc}</p>
                  </div>
                  {comingSoon ? (
                    <button disabled className="rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold py-2 cursor-not-allowed">
                      Coming Soon
                    </button>
                  ) : canUse ? (
                    <button
                      onClick={() => cardAction(name)}
                      className="rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                    >
                      {title} →
                    </button>
                  ) : (
                    <button disabled className="rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold py-2 cursor-not-allowed flex items-center justify-center gap-1">
                      <Lock size={11} /> Locked
                    </button>
                  )}
                </div>
              );
            })}
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

      </div>
    </div>
  );
}

