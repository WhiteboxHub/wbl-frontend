"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Video,
  Mic,
  FileText,
  Activity,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { AssessmentGridItem } from "@/types/assessment";
import { assessmentService } from "@/services/assessmentService";

interface AssessmentDetailModalProps {
  isOpen: boolean;
  assessment: AssessmentGridItem | null;
  onClose: () => void;
  isAdmin?: boolean;
}

export const AssessmentDetailModal: React.FC<AssessmentDetailModalProps> = ({
  isOpen,
  assessment,
  onClose,
  isAdmin = false,
}) => {
  const [reportData, setReportData] = useState<any>(null);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "telemetry" | "report">("overview");
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedTelemetry, setCopiedTelemetry] = useState(false);

  const handleCopyReport = () => {
    if (!reportData) return;
    navigator.clipboard.writeText(
      typeof reportData === "string" ? reportData : JSON.stringify(reportData, null, 2)
    );
    setCopiedReport(true);
    toast.success("Evaluation report copied to clipboard");
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleCopyTelemetry = () => {
    if (!telemetryData) return;
    navigator.clipboard.writeText(
      typeof telemetryData === "string" ? telemetryData : JSON.stringify(telemetryData, null, 2)
    );
    setCopiedTelemetry(true);
    toast.success("Questions & Telemetry copied to clipboard");
    setTimeout(() => setCopiedTelemetry(false), 2000);
  };

  useEffect(() => {
    if (isOpen && assessment?.id) {
      setIsLoading(true);
      Promise.all([
        assessmentService.fetchAssessmentDetail(assessment.id).catch(() => null),
        assessmentService.fetchAssessmentData(assessment.id).catch(() => null),
      ])
        .then(([rep, tel]) => {
          setReportData(rep);
          setTelemetryData(tel);
        })
        .finally(() => setIsLoading(false));
    } else {
      setReportData(null);
      setTelemetryData(null);
      setActiveTab("overview");
    }
  }, [
    isOpen,
    assessment,
    assessment?.id,
    setIsLoading,
    setReportData,
    setTelemetryData,
    setActiveTab,
  ]);

  if (!isOpen || !assessment) return null;

  // -------------------------------------------------------------
  // ADMIN / AVATAR SIDE: 4-Column Layout (Matching Given Image)
  // -------------------------------------------------------------
  if (isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div
          className="fixed inset-0"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative z-10 flex h-[88vh] max-h-[850px] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-blue-200 dark:border-blue-900 dark:bg-gray-900 animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="sticky top-0 flex items-center justify-between border-b border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-darklight dark:via-dark dark:to-darklight px-4 py-3 sm:px-6 z-10">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-sm sm:text-base md:text-lg font-semibold text-transparent">
                  {assessment.candidate_name
                    ? `${assessment.candidate_name} (${assessment.id}) - Assessment Details`
                    : assessment.candidate_id
                    ? `Candidate #${assessment.candidate_id} (${assessment.id}) - Assessment Details`
                    : `Assessment #${assessment.id} - Details`}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-slate-800 cursor-pointer"
              title="Close"
            >
              <X size={18} className="sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-6 border-b border-blue-200 dark:border-blue-900 px-4 sm:px-6 pt-2 bg-gradient-to-r from-blue-50/40 via-purple-50/20 to-pink-50/30 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                  : "border-transparent text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Overview & Metadata
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === "report"
                  ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                  : "border-transparent text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Evaluation Report
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("telemetry")}
              className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === "telemetry"
                  ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                  : "border-transparent text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Questions & Telemetry
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 bg-white dark:bg-gray-900">
            {isLoading ? (
              <div className="flex h-full items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
              </div>
            ) : activeTab === "overview" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {/* Column 1: Basic Information */}
                <div className="space-y-3">
                  <h3 className="border-b border-blue-200 dark:border-blue-900 pb-1.5 text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400">
                    Basic Information
                  </h3>
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Candidate Full Name
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center">
                        {assessment.candidate_name || (assessment.candidate_id ? `Candidate #${assessment.candidate_id}` : "—")}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Candidate ID
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center font-mono">
                        {assessment.candidate_id ? `CAND-${assessment.candidate_id}` : "—"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Status
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs font-bold shadow-2xs min-h-[34px] flex items-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                          assessment.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : assessment.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                            : assessment.status === "EVALUATING"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                        }`}>
                          {assessment.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Assessment Type
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center">
                        {assessment.assessment_type}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Media Mode
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center gap-1.5">
                        {assessment.media_type === "AUDIO" || assessment.media_type === "AUDIO_ONLY" ? (
                          <>
                            <Mic className="h-3.5 w-3.5 text-purple-600" />
                            <span>Audio Only</span>
                          </>
                        ) : (
                          <>
                            <Video className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Video + Audio</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Professional Information */}
                <div className="space-y-3">
                  <h3 className="border-b border-blue-200 dark:border-blue-900 pb-1.5 text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400">
                    Professional Information
                  </h3>
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Assessment ID
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-bold min-h-[34px] flex items-center">
                        #{assessment.id}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Assessment UUID
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-mono min-h-[34px] flex items-center truncate" title={reportData?.assessment_uuid || telemetryData?.telemetry?.assessment_uuid || `as-${assessment.id}`}>
                        {reportData?.assessment_uuid || telemetryData?.telemetry?.assessment_uuid || `as-${assessment.id}`}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Overall Score
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs font-bold shadow-2xs min-h-[34px] flex items-center">
                        {assessment.score != null ? (
                          <span className="text-blue-600 dark:text-blue-400 text-sm font-black">
                            {assessment.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Job Track / Role
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center truncate">
                        {reportData?.job_role || (assessment.assessment_type === "INTRO" ? "General Intro" : assessment.assessment_type.replace(/_/g, " "))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Evaluation Status
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center">
                        {reportData ? "Report Generated" : assessment.status === "COMPLETED" ? "Pending Analysis" : assessment.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Contact Information */}
                <div className="space-y-3">
                  <h3 className="border-b border-blue-200 dark:border-blue-900 pb-1.5 text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400">
                    Contact Information
                  </h3>
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Email
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center truncate">
                        {assessment.candidate_email ? (
                          <a
                            href={`mailto:${assessment.candidate_email}`}
                            className="text-blue-600 underline hover:text-blue-800 truncate"
                          >
                            {assessment.candidate_email}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Recording URL
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center">
                        {assessment.youtube_url || reportData?.video_url ? (
                          <a
                            href={assessment.youtube_url || reportData?.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800 font-semibold"
                          >
                            Click Here
                          </a>
                        ) : (
                          <span className="text-gray-400">Not Available</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Client IP Address
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-mono min-h-[34px] flex items-center">
                        {telemetryData?.telemetry?.ip || telemetryData?.telemetry?.client_ip || "127.0.0.1"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Browser / Device
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center truncate" title={telemetryData?.telemetry?.user_agent || "Web Browser"}>
                        {telemetryData?.telemetry?.user_agent ? telemetryData.telemetry.user_agent.slice(0, 32) + "..." : "Web Browser (Chrome)"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Questions Count
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center">
                        {telemetryData?.questions?.length || (reportData?.transcript_evaluation?.total_questions) || "1"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 4: Other / Timestamps */}
                <div className="space-y-3">
                  <h3 className="border-b border-blue-200 dark:border-blue-900 pb-1.5 text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400">
                    Other
                  </h3>
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Created Date
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center">
                        {assessment.created_at ? new Date(assessment.created_at).toLocaleString() : "—"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Started Date
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center">
                        {assessment.started_at ? new Date(assessment.started_at).toLocaleString() : "—"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Completed Date
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center">
                        {assessment.completed_at ? new Date(assessment.completed_at).toLocaleString() : "—"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Session Duration
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center">
                        {(() => {
                          if (!assessment.started_at || !assessment.completed_at) return "—";
                          try {
                            const diff = new Date(assessment.completed_at).getTime() - new Date(assessment.started_at).getTime();
                            if (diff <= 0) return "—";
                            const totalSec = Math.floor(diff / 1000);
                            const m = Math.floor(totalSec / 60);
                            const s = totalSec % 60;
                            return `${m}m ${s}s`;
                          } catch {
                            return "—";
                          }
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400">
                        Priority
                      </label>
                      <div className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-2xs font-medium min-h-[34px] flex items-center">
                        Normal
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "report" ? (
              <div className="space-y-4">
                {reportData ? (
                  <>
                    {/* Evaluation Factor Highlights */}
                    {reportData.audio_evaluation && (
                      <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/50 to-purple-50/40 p-4 dark:bg-slate-800/50">
                        <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
                          Audio Analysis Factors
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          {reportData.audio_evaluation?.audio_evaluation?.factors?.pace && (
                            <div className="rounded-lg border border-blue-200 bg-white dark:bg-slate-800 p-2.5">
                              <span className="text-[11px] text-gray-500 font-semibold">Pace</span>
                              <p className="font-bold text-blue-700 dark:text-blue-400">
                                {reportData.audio_evaluation.audio_evaluation.factors.pace.status || "Normal"}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                {reportData.audio_evaluation.audio_evaluation.factors.pace.wpm_recorded ?? 0} WPM
                              </p>
                            </div>
                          )}
                          {reportData.audio_evaluation?.audio_evaluation?.factors?.volume && (
                            <div className="rounded-lg border border-blue-200 bg-white dark:bg-slate-800 p-2.5">
                              <span className="text-[11px] text-gray-500 font-semibold">Volume</span>
                              <p className="font-bold text-blue-700 dark:text-blue-400">
                                {reportData.audio_evaluation.audio_evaluation.factors.volume.status || "Strong"}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                {reportData.audio_evaluation.audio_evaluation.factors.volume.avg_volume_db ?? 0} dB
                              </p>
                            </div>
                          )}
                          {reportData.audio_evaluation?.audio_evaluation?.factors?.clarity && (
                            <div className="rounded-lg border border-blue-200 bg-white dark:bg-slate-800 p-2.5">
                              <span className="text-[11px] text-gray-500 font-semibold">Clarity</span>
                              <p className="font-bold text-blue-700 dark:text-blue-400">
                                {reportData.audio_evaluation.audio_evaluation.factors.clarity.status || "Clear"}
                              </p>
                            </div>
                          )}
                          <div className="rounded-lg border border-blue-200 bg-white dark:bg-slate-800 p-2.5">
                            <span className="text-[11px] text-gray-500 font-semibold">Overall Score</span>
                            <p className="text-base font-black text-blue-700 dark:text-blue-400">
                              {assessment.score != null ? `${assessment.score}%` : "Evaluated"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                        Raw Report Output
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyReport}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                        title="Copy Evaluation Report JSON"
                      >
                        {copiedReport ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Copy Report</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-slate-50/70 p-4 dark:border-blue-900 dark:bg-gray-800/40">
                      <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-[420px] font-mono leading-relaxed">
                        {JSON.stringify(reportData, null, 2)}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
                    <FileText className="h-10 w-10 mb-2 opacity-50 text-blue-500" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      No Evaluation Report Generated Yet
                    </p>
                    <p className="text-xs mt-1 text-gray-500">
                      Assessment is in {assessment.status} state. Reports are generated once completed and evaluated.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {telemetryData ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                        Questions & Telemetry Data
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyTelemetry}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                        title="Copy Questions & Telemetry JSON"
                      >
                        {copiedTelemetry ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Copy Telemetry</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-slate-50/70 p-4 dark:border-blue-900 dark:bg-gray-800/40">
                      <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-[420px] font-mono leading-relaxed">
                        {JSON.stringify(telemetryData, null, 2)}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
                    <Activity className="h-10 w-10 mb-2 opacity-50 text-blue-500" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      No Telemetry Data Available
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 flex items-center justify-end border-t border-blue-200 dark:border-blue-900 px-6 py-3 bg-gradient-to-r from-blue-50/50 via-purple-50/20 to-pink-50/30 dark:bg-gray-900">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-blue-200 bg-white px-4 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-800 dark:text-blue-300 shadow-2xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // CANDIDATE SIDE: Previous Clean Layout
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-[85vh] max-h-[750px] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 dark:bg-gray-900 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2a5a6b]/10 text-[#2a5a6b] dark:bg-teal-950/40 dark:text-teal-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Assessment Details
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {assessment.candidate_name
                  ? `${assessment.candidate_name} (CAND-${assessment.candidate_id}) • `
                  : assessment.candidate_id
                  ? `Candidate #${assessment.candidate_id} • `
                  : ""}Type: {assessment.assessment_type} | Mode: {assessment.media_type} | Status: {assessment.status}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 pt-2 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "overview"
                ? "border-[#2a5a6b] text-[#2a5a6b] dark:border-teal-400 dark:text-teal-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Overview & Metadata
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "report"
                ? "border-[#2a5a6b] text-[#2a5a6b] dark:border-teal-400 dark:text-teal-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Evaluation Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("telemetry")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "telemetry"
                ? "border-[#2a5a6b] text-[#2a5a6b] dark:border-teal-400 dark:text-teal-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Questions & Telemetry
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2a5a6b] border-t-transparent" />
            </div>
          ) : activeTab === "overview" ? (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <span className="text-[11px] font-semibold text-gray-400">Score</span>
                  <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                    {assessment.score != null ? `${assessment.score}%` : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <span className="text-[11px] font-semibold text-gray-400">Status</span>
                  <p className="mt-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {assessment.status}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <span className="text-[11px] font-semibold text-gray-400">Assessment Type</span>
                  <p className="mt-1 text-sm font-bold text-gray-800 dark:text-gray-200">
                    {assessment.assessment_type}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <span className="text-[11px] font-semibold text-gray-400">Media Mode</span>
                  <p className="mt-1 text-sm font-bold text-gray-800 dark:text-gray-200">
                    {assessment.media_type}
                  </p>
                </div>
              </div>

              {/* Assessment Timestamps & Details */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-800/40">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2a5a6b] mb-3">
                  Session Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Candidate</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {assessment.candidate_name || (assessment.candidate_id ? `Candidate #${assessment.candidate_id}` : "—")}
                    </p>
                    {assessment.candidate_id && (
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        CAND-{assessment.candidate_id}
                        {assessment.candidate_email ? ` • ${assessment.candidate_email}` : ""}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400">Created At</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {assessment.created_at ? new Date(assessment.created_at).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Started At</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {assessment.started_at ? new Date(assessment.started_at).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Completed At</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {assessment.completed_at ? new Date(assessment.completed_at).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "report" ? (
            <div className="space-y-3">
              {reportData ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Evaluation Report Output
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      title="Copy Evaluation Report JSON"
                    >
                      {copiedReport ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                          <span>Copy Report</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                    <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-[450px]">
                      {JSON.stringify(reportData, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
                  <FileText className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    No Evaluation Report Generated Yet
                  </p>
                  <p className="text-xs">
                    Assessment is in {assessment.status} state. Reports are generated once completed and evaluated.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {telemetryData ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Questions & Telemetry Data
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTelemetry}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      title="Copy Questions & Telemetry JSON"
                    >
                      {copiedTelemetry ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                          <span>Copy Telemetry</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                    <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-[450px]">
                      {JSON.stringify(telemetryData, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
                  <Activity className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    No Telemetry Data Available
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-100 px-6 py-3.5 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
