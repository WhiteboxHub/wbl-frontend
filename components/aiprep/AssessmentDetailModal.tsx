"use client";

import React, { useEffect, useState } from "react";
import { X, Calendar, Video, Mic, CheckCircle, AlertCircle, FileText, Activity } from "lucide-react";
import { AssessmentGridItem } from "@/types/assessment";
import { assessmentService } from "@/services/assessmentService";

interface AssessmentDetailModalProps {
  isOpen: boolean;
  assessment: AssessmentGridItem | null;
  onClose: () => void;
}

export const AssessmentDetailModal: React.FC<AssessmentDetailModalProps> = ({
  isOpen,
  assessment,
  onClose,
}) => {
  const [reportData, setReportData] = useState<any>(null);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "telemetry" | "report">("overview");

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
    assessment?.id,
    setIsLoading,
    setReportData,
    setTelemetryData,
    setActiveTab,
  ]);

  if (!isOpen || !assessment) return null;

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
                Assessment #{assessment.id} (Candidate #{assessment.candidate_id || "—"})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Type: {assessment.assessment_type} | Mode: {assessment.media_type} | Status: {assessment.status}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 pt-2 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
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
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
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
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
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
                      Candidate #{assessment.candidate_id || "—"}
                    </p>
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
            <div className="space-y-4">
              {reportData ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-[450px]">
                    {JSON.stringify(reportData, null, 2)}
                  </pre>
                </div>
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
            <div className="space-y-4">
              {telemetryData ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-[450px]">
                    {JSON.stringify(telemetryData, null, 2)}
                  </pre>
                </div>
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
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
