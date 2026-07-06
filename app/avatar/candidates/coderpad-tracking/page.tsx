"use client";
import { useEffect, useState } from "react";
import { Label } from "@/components/admin_ui/label";
import {
  Code2,
  CheckCircle,
  XCircle,
  Loader,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/admin_ui/input";

interface QuestionAttempt {
  id: number;
  question_title: string;
  language: string;
  status: string;
  execution_time_ms: number;
  created_at: string;
  test_passed: number;
  test_total: number;
  security_events_count: number;
}

interface CandidateCoderPad {
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  candidate_status?: string;
  candidate_workstatus?: string;
  candidate_education?: string;
  candidate_enrolled_date?: string;
  candidate_dob?: string;
  candidate_linkedin?: string;
  candidate_github?: string;
  candidate_address?: string;
  total_attempts: number;
  passed_attempts: number;
  failed_attempts: number;
  unique_questions_solved: number;
  questions: QuestionAttempt[];
}

const TRACKING_TABLE_CLASS = "w-full min-w-[900px] table-fixed border-collapse text-sm";

function TrackingTableColGroup() {
  return (
    <colgroup>
      <col style={{ width: "18%" }} />
      <col style={{ width: "22%" }} />
      <col style={{ width: "12%" }} />
      <col style={{ width: "12%" }} />
      <col style={{ width: "10%" }} />
      <col style={{ width: "10%" }} />
      <col style={{ width: "16%" }} />
    </colgroup>
  );
}

export default function CoderPadTrackingPage() {
  const [candidateData, setCandidateData] = useState<CandidateCoderPad[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCoderPadData = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        // Fetch candidates (profile fields) and staff tracking logs in parallel
        const [candidatesData, executionData] = await Promise.all([
          apiFetch("/candidates?limit=0").catch((err) => {
            console.error("Error fetching candidates:", err);
            return { data: [] };
          }),
          apiFetch("/coderpad/tracking/execution-logs?limit=1000").catch((err) => {
            console.error("Error fetching tracking logs:", err);
            setFetchError("Could not load CoderPad execution logs. Check that you are logged in as staff.");
            return { data: [] };
          }),
        ]);

        const candidates = Array.isArray(candidatesData?.data) ? candidatesData.data : [];
        const sessions = Array.isArray(executionData?.data) ? executionData.data : [];

        console.log("Fetched candidates count:", candidates.length);
        console.log("Fetched execution logs count:", sessions.length);

        // Create a map of candidates by email for quick lookup
        const candidatesMap = new Map();
        candidates.forEach((cand: any) => {
          if (cand.email) {
            candidatesMap.set(cand.email.toLowerCase(), cand);
          }
        });

        const groupedByCandidates: Record<string, CandidateCoderPad> = {};

        const ensureCandidate = (key: string, email: string, name: string) => {
          if (!groupedByCandidates[key]) {
            const cand = candidatesMap.get(key);
            groupedByCandidates[key] = {
              candidate_name: cand?.full_name || cand?.candidate_name || name || "Unknown",
              candidate_email: email,
              candidate_phone: cand?.phone || undefined,
              candidate_status: cand?.status || undefined,
              candidate_workstatus: cand?.workstatus || undefined,
              candidate_education: cand?.education || undefined,
              candidate_enrolled_date: cand?.enrolled_date || undefined,
              candidate_dob: cand?.dob || undefined,
              candidate_linkedin: cand?.linkedin_id || undefined,
              candidate_github: cand?.github_link || undefined,
              candidate_address: cand?.address || undefined,
              total_attempts: 0,
              passed_attempts: 0,
              failed_attempts: 0,
              unique_questions_solved: 0,
              questions: [],
            };
          }
        };

        sessions.forEach((session: any) => {
          const key = session.candidate_email?.toLowerCase();
          if (!key) return;

          ensureCandidate(
            key,
            session.candidate_email,
            session.candidate_name || "Unknown"
          );

          if (key) {
            groupedByCandidates[key].questions.push({
              id: session.id,
              question_title: session.question_title,
              language: session.language,
              status: session.status,
              execution_time_ms: session.execution_time_ms,
              created_at: session.created_at,
              test_passed: session.test_passed,
              test_total: session.test_total,
              security_events_count: session.security_events_count,
            });

            groupedByCandidates[key].total_attempts += 1;
            if (session.status === "success") {
              groupedByCandidates[key].passed_attempts += 1;
            } else {
              groupedByCandidates[key].failed_attempts += 1;
            }
          }
        });

        // Calculate unique questions solved (where status is success)
        Object.keys(groupedByCandidates).forEach((key) => {
          const successfulQuestions = new Set(
            groupedByCandidates[key].questions
              .filter((q) => q.status === "success")
              .map((q) => q.question_title)
          );
          groupedByCandidates[key].unique_questions_solved = successfulQuestions.size;
        });

        const candidateArray = Object.values(groupedByCandidates).sort(
          (a, b) => b.total_attempts - a.total_attempts
        );
        setCandidateData(candidateArray);
      } catch (error) {
        console.error("Error fetching CoderPad data:", error);
        setFetchError("Failed to load CoderPad tracking data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoderPadData();
  }, []);

  const filteredCandidates = candidateData.filter((candidate) => {
    const q = searchTerm.toLowerCase();
    const name = (candidate.candidate_name ?? "").toLowerCase();
    const email = (candidate.candidate_email ?? "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const toggleCandidate = (email: string) => {
    const newExpanded = new Set(expandedCandidates);
    if (newExpanded.has(email)) {
      newExpanded.delete(email);
    } else {
      newExpanded.add(email);
    }
    setExpandedCandidates(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      {/* Page header — matches Candidates Management layout */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Coderpad Tracking
        </h1>
        <div className="mt-2 sm:max-w-md">
          <Label
            htmlFor="coderpad-search"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Search Candidates
          </Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="coderpad-search"
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 text-sm sm:text-base"
            />
          </div>
          {searchTerm.trim() && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filteredCandidates.length} candidate
              {filteredCandidates.length === 1 ? "" : "s"} shown
            </p>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {fetchError}
        </div>
      )}

      {/* Tracking grid — sticky header, scrollable body */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="max-h-[calc(100vh-280px)] overflow-auto">
            <table className={TRACKING_TABLE_CLASS}>
              <TrackingTableColGroup />
              <thead className="sticky top-0 z-10 border-b-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Candidate Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Email
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Questions Solved
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Total Attempts
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Passed
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Failed
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <tr
                      key={candidate.candidate_email}
                      className="cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                      onClick={() => toggleCandidate(candidate.candidate_email)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          {expandedCandidates.has(candidate.candidate_email) ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                          )}
                          {candidate.candidate_name}
                        </div>
                      </td>
                      <td className="truncate px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {candidate.candidate_email}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                          {candidate.unique_questions_solved}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-gray-100">
                        {candidate.total_attempts}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                          {candidate.passed_attempts}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
                          {candidate.failed_attempts}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                              style={{
                                width: `${
                                  candidate.total_attempts > 0
                                    ? Math.round(
                                        (candidate.passed_attempts / candidate.total_attempts) * 100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <span className="w-10 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {candidate.total_attempts > 0
                              ? Math.round(
                                  (candidate.passed_attempts / candidate.total_attempts) * 100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Code2 className="mb-4 h-16 w-16 text-gray-400" />
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                          {searchTerm.trim()
                            ? "No candidates match your search"
                            : "No CoderPad activity yet"}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {searchTerm.trim()
                            ? "Try adjusting your search filters"
                            : "Submissions appear here after candidates run code in CoderPad"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>

        {expandedCandidates.size > 0 && (
            <div className="space-y-3 border-t border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/80">
              {filteredCandidates.map((candidate) =>
                expandedCandidates.has(candidate.candidate_email) ? (
                  <div
                    key={`details-${candidate.candidate_email}`}
                    className="rounded-lg border border-blue-200 bg-blue-50/90 p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {candidate.candidate_name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => toggleCandidate(candidate.candidate_email)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Collapse details"
                      >
                        <ChevronDown className="h-5 w-5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-gray-900">Recent Attempts (Last 5)</h4>
                      <div className="space-y-2">
                        {candidate.questions.length > 0 ? (
                          candidate.questions.slice(0, 5).map((question) => (
                            <div
                              key={question.id}
                              className="rounded border border-gray-300 bg-white p-3 text-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{question.question_title}</p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                      {question.language}
                                    </span>
                                    {question.status === "success" ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className="text-xs font-medium text-gray-600">
                                      {question.test_passed}/{question.test_total} tests passed
                                    </span>
                                  </div>
                                </div>
                                <span className="whitespace-nowrap text-xs text-gray-500">
                                  {new Date(question.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="py-4 text-center text-gray-500">No attempts recorded</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
        )}
      </div>
    </div>
  );
}
