"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin_ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin_ui/table";
import {
  Code2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/admin_ui/input";
import { Button } from "@/components/admin_ui/button";

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

interface CoderPadMetrics {
  total_sessions: number;
  passed_sessions: number;
  failed_sessions: number;
  total_candidates: number;
}

export default function CoderPadTrackingPage() {
  const [candidateData, setCandidateData] = useState<CandidateCoderPad[]>([]);
  const [metrics, setMetrics] = useState<CoderPadMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCoderPadData = async () => {
      try {
        setLoading(true);
        
        // Fetch both candidates and coderpad execution logs in parallel
        const [candidatesData, executionData] = await Promise.all([
          apiFetch("/candidates?limit=0").catch(err => {
            console.error("Error fetching candidates:", err);
            return { data: [] };
          }),
          apiFetch("/coderpad/execution-logs?limit=1000").catch(err => {
            console.error("Error fetching execution logs:", err);
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

        // First, create entries for ALL candidates
        const groupedByCandidates: Record<string, CandidateCoderPad> = {};
        candidates.forEach((cand: any) => {
          const key = cand.email?.toLowerCase();
          if (key) {
            groupedByCandidates[key] = {
              candidate_name: cand.full_name || cand.candidate_name || "Unknown",
              candidate_email: cand.email,
              candidate_phone: cand.phone || undefined,
              candidate_status: cand.status || undefined,
              candidate_workstatus: cand.workstatus || undefined,
              candidate_education: cand.education || undefined,
              candidate_enrolled_date: cand.enrolled_date || undefined,
              candidate_dob: cand.dob || undefined,
              candidate_linkedin: cand.linkedin_id || undefined,
              candidate_github: cand.github_link || undefined,
              candidate_address: cand.address || undefined,
              total_attempts: 0,
              passed_attempts: 0,
              failed_attempts: 0,
              unique_questions_solved: 0,
              questions: [],
            };
          }
        });

        // Then add execution log data for those who have it
        sessions.forEach((session: any) => {
          const key = session.candidate_email?.toLowerCase();
          if (key && !groupedByCandidates[key]) {
            // If candidate not in main list, add them
            groupedByCandidates[key] = {
              candidate_name: session.candidate_name || "Unknown",
              candidate_email: session.candidate_email,
              candidate_phone: undefined,
              candidate_status: undefined,
              candidate_workstatus: undefined,
              candidate_education: undefined,
              candidate_enrolled_date: undefined,
              candidate_dob: undefined,
              candidate_linkedin: undefined,
              candidate_github: undefined,
              candidate_address: undefined,
              total_attempts: 0,
              passed_attempts: 0,
              failed_attempts: 0,
              unique_questions_solved: 0,
              questions: [],
            };
          }

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

        console.log("Final candidate array:", candidateArray);

        // Calculate metrics
        const passed = sessions.filter((s: any) => s.status === "success").length;
        const failed = sessions.filter((s: any) => s.status === "error").length;

        setMetrics({
          total_sessions: sessions.length,
          passed_sessions: passed,
          failed_sessions: failed,
          total_candidates: candidateArray.length,
        });
      } catch (error) {
        console.error("Error fetching CoderPad data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoderPadData();
  }, []);

  const filteredCandidates = candidateData.filter((candidate) =>
    candidate.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.candidate_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCandidate = (email: string) => {
    const newExpanded = new Set(expandedCandidates);
    if (newExpanded.has(email)) {
      newExpanded.delete(email);
    } else {
      newExpanded.add(email);
    }
    setExpandedCandidates(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "timeout":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Loader className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      success: { bg: "bg-green-100", text: "text-green-800" },
      error: { bg: "bg-red-100", text: "text-red-800" },
      timeout: { bg: "bg-yellow-100", text: "text-yellow-800" },
    };
    const badge = badges[status] || { bg: "bg-gray-100", text: "text-gray-800" };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Search Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Search className="h-5 w-5 text-gray-400 mt-3" />
            <Input
              type="text"
              placeholder="Search by candidate name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table View */}
      <Card>
        <CardHeader>
          <CardTitle>CoderPad Tracking</CardTitle>
          <p className="text-sm text-gray-600 mt-2">Track candidate coding activity and performance</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                  <TableHead className="text-gray-900 font-semibold py-3 px-4 text-left">
                    Candidate Name
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold py-3 px-4 text-left">
                    Email
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold py-3 px-4 text-center">
                    Questions Solved
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold py-3 px-4 text-center">
                    Total Attempts
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold py-3 px-4 text-center">
                    Passed
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold py-3 px-4 text-center">
                    Failed
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold py-3 px-4 text-center">
                    Success Rate
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <TableRow 
                      key={candidate.candidate_email}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleCandidate(candidate.candidate_email)}
                    >
                      <TableCell className="py-3 px-4 text-gray-900 font-medium">
                        {candidate.candidate_name}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-gray-600 text-sm">
                        {candidate.candidate_email}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {candidate.unique_questions_solved}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center font-medium text-gray-900">
                        {candidate.total_attempts}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {candidate.passed_attempts}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {candidate.failed_attempts}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  candidate.total_attempts > 0
                                    ? Math.round((candidate.passed_attempts / candidate.total_attempts) * 100)
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-10 text-right">
                            {candidate.total_attempts > 0
                              ? Math.round((candidate.passed_attempts / candidate.total_attempts) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Code2 className="h-16 w-16 mb-4 text-gray-400" />
                        <p className="text-lg font-medium">No candidates found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Row Details */}
      {expandedCandidates.size > 0 && (
        <div className="space-y-4">
          {filteredCandidates.map((candidate) => (
            expandedCandidates.has(candidate.candidate_email) && (
              <Card key={`details-${candidate.candidate_email}`} className="bg-blue-50 border-l-4 border-l-blue-600">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{candidate.candidate_name} - Details</CardTitle>
                    <button
                      onClick={() => toggleCandidate(candidate.candidate_email)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Extended Candidate Info */}
                  {(candidate.candidate_education ||
                    candidate.candidate_linkedin ||
                    candidate.candidate_github ||
                    candidate.candidate_dob) && (
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-300">
                      {candidate.candidate_education && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Education</p>
                          <p className="text-gray-600 mt-1">{candidate.candidate_education}</p>
                        </div>
                      )}
                      {candidate.candidate_dob && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Date of Birth</p>
                          <p className="text-gray-600 mt-1">{new Date(candidate.candidate_dob).toLocaleDateString()}</p>
                        </div>
                      )}
                      {candidate.candidate_linkedin && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">LinkedIn ID</p>
                          <p className="text-gray-600 mt-1 break-all">{candidate.candidate_linkedin}</p>
                        </div>
                      )}
                      {candidate.candidate_github && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">GitHub</p>
                          <p className="text-gray-600 mt-1 break-all">{candidate.candidate_github}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Attempts (Last 5)</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {candidate.questions.length > 0 ? (
                        candidate.questions.slice(0, 5).map((question) => (
                          <div key={question.id} className="bg-white rounded p-3 text-sm border border-gray-300">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{question.question_title}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                    {question.language}
                                  </span>
                                  {question.status === "success" ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="text-xs text-gray-600 font-medium">
                                    {question.test_passed}/{question.test_total} tests passed
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {new Date(question.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No attempts recorded</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
}
