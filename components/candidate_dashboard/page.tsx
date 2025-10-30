"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

/**
 * Candidate Dashboard (Stylish Modern + Horizontal Tabs)
 * Place this file at: app/dashboard/page.tsx
 *
 * Requirements:
 * - NEXT_PUBLIC_API_BASE_URL must be set in environment
 * - Auth token stored in localStorage as "token"
 * - (Optional) user role in localStorage as "userRole"
 */

/* ----------------------------- Types ------------------------------ */
type CandidateBasicInfo = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  batch_name: string;
  enrolled_date: string;
};

type PhaseMetrics = {
  enrolled?: { days_since: number; batch_name?: string };
  preparation?: { duration_days: number; rating: number };
  marketing?: { duration_days: number; total_interviews: number; success_rate: number };
  placement?: { company: string; days_since: number };
};

type InterviewStats = { total: number; positive: number; success_rate: number };

type RecentInterview = { company: string; interview_date: string; feedback: string };

type Alert = { type: string; message: string };

type DashboardResponse = {
  basic_info: CandidateBasicInfo;
  phase_metrics: PhaseMetrics;
  interview_stats: InterviewStats;
  recent_interviews: RecentInterview[];
  alerts: Alert[];
};

/* ----------------------------- Helpers ---------------------------- */
const formatShortDate = (iso?: string) => {
  if (!iso) return "-";
  try {
    return format(parseISO(iso), "MMM dd, yyyy");
  } catch {
    return iso;
  }
};

const apiFetch = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
};

/* ----------------------- Small Reusable UI ------------------------ */
const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div className="flex items-center justify-center p-6">
    <div style={{ width: size, height: size }} className="animate-spin rounded-full border-t-4 border-b-4 border-blue-500" />
  </div>
);

const Card: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>{children}</div>
);

const StatusPill: React.FC<{ label: string; kind?: "info" | "success" | "warning" | "neutral" }> = ({ label, kind = "neutral" }) => {
  const map: Record<string, string> = {
    info: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-50 text-yellow-800",
    neutral: "bg-gray-100 text-gray-800",
  };
  return <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${map[kind]}`}>{label}</span>;
};

/* -------------------------- Tabs Component ------------------------ */
const TAB_IDS = ["overview", "preparation", "marketing", "placement", "interviews", "team", "statistics"] as const;
type TabId = (typeof TAB_IDS)[number];

const Tabs: React.FC<{ active: TabId; setActive: (t: TabId) => void }> = ({ active, setActive }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "preparation", label: "Preparation" },
    { id: "marketing", label: "Marketing" },
    { id: "placement", label: "Placement" },
    { id: "interviews", label: "Interviews" },
    { id: "team", label: "Team" },
    { id: "statistics", label: "Stats" },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-6 overflow-x-auto px-4 sm:px-6 lg:px-0">
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id as TabId)}
              className={`py-3 px-1 text-sm font-medium whitespace-nowrap ${
                isActive ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

/* ------------------------- Main Component ------------------------- */
export default function CandidateDashboardPage({ searchParams }: { searchParams?: { id?: string } }) {
  const router = useRouter();
  const candidateId = searchParams?.id ?? (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null);

  // role & auth guard (basic client-side)
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
    if (!token) {
      router.replace("/login");
    } else if (userRole && userRole !== "candidate") {
      // If you want stricter behavior, change this
      // Allow admins to view candidate dashboards for debugging? Here we redirect them
      // router.replace("/admin_dashboard");
    }
  }, [router]);

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // overview state
  const [overview, setOverview] = useState<DashboardResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // per-tab caches/loading/errors
  const [preparationData, setPreparationData] = useState<any | null>(null);
  const [marketingData, setMarketingData] = useState<any | null>(null);
  const [placementData, setPlacementData] = useState<any | null>(null);
  const [interviewsData, setInterviewsData] = useState<any[] | null>(null);
  const [teamData, setTeamData] = useState<any | null>(null);
  const [statisticsData, setStatisticsData] = useState<any | null>(null);

  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

  /* ------------------ Load Overview on mount ------------------ */
  useEffect(() => {
    if (!candidateId) {
      setOverviewError("No candidate id provided");
      setOverviewLoading(false);
      return;
    }

    let mounted = true;
    setOverviewLoading(true);
    apiFetch(`${base}/candidates/${candidateId}/dashboard/overview`)
      .then((data) => {
        if (!mounted) return;
        setOverview(data);
        setOverviewError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setOverviewError(err.message || "Failed to load overview");
      })
      .finally(() => {
        if (!mounted) return;
        setOverviewLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [candidateId, base]);

  /* ------------------ Lazy load per-tab content ------------------ */
  useEffect(() => {
    if (!candidateId) return;

    async function loadTab(t: TabId) {
      setTabLoading(true);
      setTabError(null);
      try {
        switch (t) {
          case "preparation": {
            if (!preparationData) {
              const d = await apiFetch(`${base}/candidates/${candidateId}/preparation`);
              setPreparationData(d);
            }
            break;
          }
          case "marketing": {
            if (!marketingData) {
              const d = await apiFetch(`${base}/candidates/${candidateId}/marketing`);
              setMarketingData(d);
            }
            break;
          }
          case "placement": {
            if (!placementData) {
              const d = await apiFetch(`${base}/candidates/${candidateId}/placement`);
              setPlacementData(d);
            }
            break;
          }
          case "interviews": {
            if (!interviewsData) {
              const d = await apiFetch(`${base}/candidates/${candidateId}/interviews?limit=100`);
              setInterviewsData(d);
            }
            break;
          }
          case "team": {
            if (!teamData) {
              const d = await apiFetch(`${base}/candidates/${candidateId}/team`);
              setTeamData(d);
            }
            break;
          }
          case "statistics": {
            if (!statisticsData) {
              const d = await apiFetch(`${base}/candidates/${candidateId}/statistics`);
              setStatisticsData(d);
            }
            break;
          }
          default:
            break;
        }
      } catch (err: any) {
        setTabError(err.message || "Failed to load tab data");
      } finally {
        setTabLoading(false);
      }
    }

    // load overview is separate; only lazy-load the selected tab if not "overview"
    if (activeTab !== "overview") {
      loadTab(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, candidateId, base]);

  /* -------------------- Memo derived values -------------------- */
  const overviewMemo = useMemo(() => overview, [overview]);

  /* ----------------------- Render helpers ---------------------- */
  if (overviewLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (overviewError) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-red-700">Failed to load dashboard</h3>
            <p className="mt-2 text-sm text-gray-600">Reason: {overviewError}</p>
            <div className="mt-4">
              <button
                onClick={() => location.reload()}
                className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  if (!overviewMemo) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <p>No overview available for this candidate.</p>
      </main>
    );
  }

  const { basic_info, phase_metrics, interview_stats, recent_interviews, alerts } = overviewMemo;

  /* --------------------------- JSX ----------------------------- */
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-24">
      {/* Header area - hero card */}
      <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-tr from-indigo-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold">
            {basic_info.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{basic_info.full_name}</h1>
            <p className="text-sm text-gray-600">{basic_info.email} • {basic_info.phone}</p>
            <div className="mt-2 flex gap-2 items-center">
              <StatusPill label={`Status: ${basic_info.status}`} kind={basic_info.status?.toLowerCase() === "active" ? "success" : "info"} />
              <StatusPill label={`Batch: ${basic_info.batch_name}`} kind="neutral" />
              <StatusPill label={`Enrolled: ${formatShortDate(basic_info.enrolled_date)}`} kind="info" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => router.push(`/candidates/${basic_info.id}/edit`)}
            className="rounded-md bg-white border border-gray-200 px-4 py-2 text-sm font-medium shadow-sm hover:shadow"
          >
            Edit Candidate
          </button>
          <button
            onClick={() => location.reload()}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs active={activeTab} setActive={setActiveTab} />

      {/* Tab content grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content area (left 3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Overview Tab content (cards + interviews) */}
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Preparation */}
                <Card>
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="mr-4 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xl">🧠</div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Preparation</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {phase_metrics.preparation ? `${phase_metrics.preparation.duration_days} days` : "Not started"}
                        </p>
                        {phase_metrics.preparation && (
                          <p className="mt-2 text-sm font-semibold text-gray-700">Rating: {phase_metrics.preparation.rating}/5</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Marketing */}
                <Card>
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="mr-4 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xl">📣</div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Marketing</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {phase_metrics.marketing ? `${phase_metrics.marketing.duration_days} days` : "Not started"}
                        </p>
                        {phase_metrics.marketing && (
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-semibold mr-2">{phase_metrics.marketing.success_rate}%</span>
                            <span className="text-gray-500">success • {phase_metrics.marketing.total_interviews} interviews</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Placement */}
                <Card>
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="mr-4 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xl">💼</div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Placement</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {phase_metrics.placement ? `${phase_metrics.placement.days_since} days since` : "Not placed"}
                        </p>
                        {phase_metrics.placement && <p className="mt-2 text-sm font-semibold">{phase_metrics.placement.company}</p>}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Interview performance */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">Interview Performance</h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                        {interview_stats.positive}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Positive Feedback</p>
                        <p className="text-sm text-gray-500">
                          {interview_stats.total > 0 ? `${((interview_stats.positive / interview_stats.total) * 100).toFixed(1)}%` : "0%"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl font-semibold text-gray-700">
                        {interview_stats.total}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Interviews</p>
                        <p className="text-sm text-gray-500">{interview_stats.success_rate}% success rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Recent Interviews */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">Recent Interviews</h3>
                  <div className="mt-4 space-y-3">
                    {recent_interviews.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No interviews found</p>
                    ) : (
                      recent_interviews.map((iv, i) => (
                        <div
                          key={i}
                          className={`flex items-center p-3 rounded-lg ${
                            iv.feedback === "Positive" ? "bg-green-50" : iv.feedback === "Negative" ? "bg-red-50" : "bg-yellow-50"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center">{iv.company?.slice(0, 1)}</div>
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between">
                              <h4 className="text-sm font-medium text-gray-900">{iv.company}</h4>
                              <p className="text-sm text-gray-500">{format(new Date(iv.interview_date), "MMM dd")}</p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{iv.feedback}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Preparation Tab */}
          {activeTab === "preparation" && (
            <div>
              {tabLoading ? (
                <LoadingSpinner />
              ) : tabError ? (
                <p className="text-red-600">{tabError}</p>
              ) : (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-medium">Preparation Details</h3>
                    <pre className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(preparationData ?? { message: "No preparation record" }, null, 2)}</pre>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Marketing Tab */}
          {activeTab === "marketing" && (
            <div>
              {tabLoading ? (
                <LoadingSpinner />
              ) : tabError ? (
                <p className="text-red-600">{tabError}</p>
              ) : (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-medium">Marketing Details</h3>
                    <pre className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(marketingData ?? { message: "No marketing record" }, null, 2)}</pre>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Placement Tab */}
          {activeTab === "placement" && (
            <div>
              {tabLoading ? (
                <LoadingSpinner />
              ) : tabError ? (
                <p className="text-red-600">{tabError}</p>
              ) : (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-medium">Placement Details</h3>
                    <pre className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(placementData ?? { message: "No placement record" }, null, 2)}</pre>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Interviews Tab */}
          {activeTab === "interviews" && (
            <div>
              {tabLoading ? (
                <LoadingSpinner />
              ) : tabError ? (
                <p className="text-red-600">{tabError}</p>
              ) : (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-medium">Interviews</h3>
                    <div className="mt-4">
                      {Array.isArray(interviewsData) && interviewsData.length > 0 ? (
                        <ul className="space-y-3">
                          {interviewsData.map((iv, i) => (
                            <li key={i} className="p-3 border border-gray-100 rounded-lg">
                              <div className="flex justify-between">
                                <div>
                                  <div className="text-sm font-semibold">{iv.company}</div>
                                  <div className="text-xs text-gray-500">{formatShortDate(iv.interview_date)}</div>
                                </div>
                                <div className="text-sm text-gray-600">{iv.feedback}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No interviews found</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Team Tab */}
          {activeTab === "team" && (
            <div>
              {tabLoading ? (
                <LoadingSpinner />
              ) : tabError ? (
                <p className="text-red-600">{tabError}</p>
              ) : (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-medium">Team Members</h3>
                    <pre className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(teamData ?? { message: "No team assigned" }, null, 2)}</pre>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === "statistics" && (
            <div>
              {tabLoading ? (
                <LoadingSpinner />
              ) : tabError ? (
                <p className="text-red-600">{tabError}</p>
              ) : (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-medium">Statistics</h3>
                    <pre className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(statisticsData ?? { message: "No stats" }, null, 2)}</pre>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Journey */}
          <Card>
            <div className="p-6">
              <h4 className="text-md font-medium text-gray-900">Journey Progress</h4>
              <ol className="mt-4 space-y-4">
                <li className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">1</div>
                  <div>
                    <p className="text-sm font-medium">Enrolled</p>
                    <p className="text-sm text-gray-500">{formatShortDate(basic_info.enrolled_date)}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-indigo-300 text-indigo-600 flex items-center justify-center">2</div>
                  <div>
                    <p className="text-sm font-medium">Preparation</p>
                    <p className="text-sm text-gray-500">{phase_metrics.preparation ? `Active for ${phase_metrics.preparation.duration_days} days` : "Not started"}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-indigo-300 text-indigo-600 flex items-center justify-center">3</div>
                  <div>
                    <p className="text-sm font-medium">Marketing</p>
                    <p className="text-sm text-gray-500">{phase_metrics.marketing ? `Active for ${phase_metrics.marketing.duration_days} days` : "Not started"}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-indigo-300 text-indigo-600 flex items-center justify-center">4</div>
                  <div>
                    <p className="text-sm font-medium">Placement</p>
                    <p className="text-sm text-gray-500">{phase_metrics.placement ? `${phase_metrics.placement.days_since} days since placement` : "Not placed"}</p>
                  </div>
                </li>
              </ol>
            </div>
          </Card>

          {/* Alerts */}
          <Card>
            <div className="p-6">
              <h4 className="text-md font-medium text-gray-900">Alerts & Notifications</h4>
              <div className="mt-4 space-y-3">
                {alerts && alerts.length > 0 ? (
                  alerts.map((a, i) => (
                    <div key={i} className={`p-3 rounded-md ${a.type === "warning" ? "bg-yellow-50 border-l-4 border-yellow-400" : "bg-blue-50 border-l-4 border-blue-400"}`}>
                      <p className="text-sm text-gray-900">{a.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No active alerts</p>
                )}
              </div>
            </div>
          </Card>

          {/* Quick actions */}
          <Card>
            <div className="p-4 flex flex-col gap-3">
              <button
                onClick={() => setActiveTab("preparation")}
                className="w-full py-2 rounded-md bg-indigo-600 text-white text-sm font-medium"
              >
                Move to Preparation
              </button>
              <button
                onClick={() => setActiveTab("marketing")}
                className="w-full py-2 rounded-md border border-gray-200 text-sm"
              >
                Move to Marketing
              </button>
              <button
                onClick={() => setActiveTab("placement")}
                className="w-full py-2 rounded-md border border-gray-200 text-sm"
              >
                Move to Placement
              </button>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
