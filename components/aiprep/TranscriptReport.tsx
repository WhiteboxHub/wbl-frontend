"use client";

import { useState, useEffect, RefObject } from "react";
import { ArrowRight, X, ChevronRight, ChevronDown, Clock, MessageSquare, Sparkles } from "lucide-react";
import { type NormalizedReport, type TranscriptEvidence, type TranscriptSegment } from "@/types/aiprep-report";
import VideoPlayer from "./VideoPlayer";

interface Props {
  report: NormalizedReport;
  videoRef: RefObject<HTMLVideoElement | null>;
  seekTo: (seconds: number) => void;
}

function fmtTime(seconds?: number | null): string {
  if (seconds == null || isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Match a transcript segment to its corresponding Key Moment (TranscriptEvidence)
 * based on word overlap, timestamp proximity, or index.
 */
function findMatchingKeyMoment(
  seg: TranscriptSegment,
  evidenceList: TranscriptEvidence[],
  index: number
): TranscriptEvidence | undefined {
  if (!evidenceList || evidenceList.length === 0) return undefined;

  const normalize = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();

  const segNorm = normalize(seg.text);
  const segWords = segNorm.split(/\s+/).filter((w) => w.length > 3);

  // 1. Check for word overlap / substring match
  let bestMatch: TranscriptEvidence | undefined;
  let bestScore = 0;

  for (const ev of evidenceList) {
    const evNorm = normalize(ev.quote);
    if (segNorm.includes(evNorm) || evNorm.includes(segNorm)) {
      return ev;
    }
    const evWords = evNorm.split(/\s+/).filter((w) => w.length > 3);
    const sharedWords = segWords.filter((w) => evWords.includes(w));
    if (sharedWords.length >= 2 && sharedWords.length > bestScore) {
      bestScore = sharedWords.length;
      bestMatch = ev;
    }
  }

  if (bestMatch && bestScore >= 2) {
    return bestMatch;
  }

  // 2. Proximity match by timestamp if available
  if (seg.timestamp_s != null) {
    let closest: TranscriptEvidence | undefined;
    let minDiff = Infinity;
    for (const ev of evidenceList) {
      if (ev.timestamp_s != null) {
        const diff = Math.abs(ev.timestamp_s - seg.timestamp_s);
        if (diff < minDiff && diff <= 30) {
          minDiff = diff;
          closest = ev;
        }
      }
    }
    if (closest) return closest;
  }

  // 3. Fallback to index if in range
  if (index < evidenceList.length) {
    return evidenceList[index];
  }

  return undefined;
}

type ActiveTab = "transcript" | "key-moments";

export default function TranscriptReport({ report, videoRef, seekTo }: Props) {
  const { transcript, youtube_url, transcript_evidence } = report;

  const [activeSubTab, setActiveSubTab] = useState<ActiveTab>("transcript");
  const [selectedKeyMoment, setSelectedKeyMoment] = useState<TranscriptEvidence | null>(null);
  const [isFullTranscriptOpen, setIsFullTranscriptOpen] = useState(false);
  const [expandedRowIndices, setExpandedRowIndices] = useState<Record<number, boolean>>({});

  // Escape key & body scroll lock handler for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedKeyMoment(null);
        setIsFullTranscriptOpen(false);
      }
    };

    if (selectedKeyMoment || isFullTranscriptOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selectedKeyMoment, isFullTranscriptOpen]);

  const hasSegments = transcript.segments && transcript.segments.length > 0;
  const hasFullText = !!transcript.full_text;
  const hasTranscript = hasSegments || hasFullText;
  const hasKeyMoments = transcript_evidence && transcript_evidence.length > 0;

  // Toggle inline expansion of a transcript preview row
  const toggleRowExpand = (index: number) => {
    setExpandedRowIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const previewSegments = hasSegments ? transcript.segments.slice(0, 6) : [];

  return (
    <div className="space-y-5">
      {/* ── 1. Page Header ── */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Your Interview Conversation
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {activeSubTab === "transcript"
            ? "Review what you said during the interview."
            : "Important parts of your conversation highlighted from the assessment."}
        </p>
      </div>

      {/* ── Player (for non-YouTube video) ── */}
      {youtube_url && !youtube_url.includes("youtube.com") && !youtube_url.includes("youtu.be") && (
        <section className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recording Playback
          </p>
          <VideoPlayer youtubeUrl={youtube_url} videoRef={videoRef} />
        </section>
      )}

      {/* ── 2. Sub-Tabs [ Transcript ] [ Key Moments ] ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("transcript")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSubTab === "transcript"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Transcript
          {hasSegments && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                activeSubTab === "transcript"
                  ? "bg-violet-700/80 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {transcript.segments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("key-moments")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSubTab === "key-moments"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Key Moments
          {hasKeyMoments && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                activeSubTab === "key-moments"
                  ? "bg-violet-700/80 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {transcript_evidence.length}
            </span>
          )}
        </button>
      </div>

      {/* ── 3. Tab Content: Transcript ── */}
      {activeSubTab === "transcript" && (
        <div className="space-y-4">
          {!hasTranscript ? (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No interview conversation is available for this assessment.
              </p>
            </div>
          ) : hasSegments ? (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* Compact Entry Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {previewSegments.map((seg, i) => {
                  const isExpanded = !!expandedRowIndices[i];
                  const matchingKeyMoment = findMatchingKeyMoment(seg, transcript_evidence, i);

                  return (
                    <div
                      key={i}
                      onClick={() => toggleRowExpand(i)}
                      className={`flex flex-col px-4 sm:px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                        isExpanded ? "bg-slate-50/50 dark:bg-slate-800/30" : ""
                      }`}
                    >
                      {/* Main row */}
                      <div className="flex items-start gap-3.5">
                        {/* Timestamp Button */}
                        {seg.timestamp_s != null ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              seekTo(seg.timestamp_s!);
                            }}
                            className="shrink-0 font-mono text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/50 hover:bg-violet-100 px-2 py-0.5 rounded transition-colors"
                            title={`Seek to ${seg.timestamp ?? fmtTime(seg.timestamp_s)}`}
                          >
                            {seg.timestamp ?? fmtTime(seg.timestamp_s)}
                          </button>
                        ) : (
                          <span className="shrink-0 font-mono text-xs text-slate-400 px-2 py-0.5">
                            {seg.timestamp ?? "—"}
                          </span>
                        )}

                        {/* Content Preview / Full Text */}
                        <div className="flex-1 min-w-0 pr-2">
                          {seg.speaker && (
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                              {seg.speaker}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-normal">
                            {seg.text}
                          </p>
                        </div>

                        {/* Right side indicators: Key Point badge & Chevron */}
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          {matchingKeyMoment && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedKeyMoment(matchingKeyMoment);
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-100 dark:border-violet-800/50 px-2 py-0.5 text-[11px] font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/60 transition-colors"
                              title="Click to view Key Point details"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span className="hidden sm:inline">Key Point</span>
                            </button>
                          )}

                          <div className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── Inline Key Point Details (shown when expanded) ── */}
                      {isExpanded && matchingKeyMoment && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKeyMoment(matchingKeyMoment);
                          }}
                          className="mt-3 ml-0 sm:ml-12 rounded-xl border border-violet-200/90 dark:border-violet-800/60 bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-950/40 dark:to-slate-900 p-3.5 sm:p-4 space-y-2 cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-all shadow-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-100/80 dark:border-violet-900/40 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 dark:text-violet-300">
                                <Sparkles className="w-3.5 h-3.5" />
                                Key Point
                              </span>
                              {matchingKeyMoment.dimension && (
                                <span className="rounded-full bg-white dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-violet-100 dark:border-violet-800/50 shadow-xs">
                                  {matchingKeyMoment.dimension}
                                </span>
                              )}
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700">
                              View full details
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>

                          {matchingKeyMoment.observation ? (
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed pt-0.5">
                              <strong className="text-slate-900 dark:text-white font-semibold">
                                Why this matters:{" "}
                              </strong>
                              {matchingKeyMoment.observation}
                            </p>
                          ) : (
                            <p className="text-xs italic text-slate-500">
                              Highlighted as an important assessment key moment.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* View Full Transcript Footer Trigger */}
              <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {previewSegments.length} of {transcript.segments.length} conversation lines
                </span>
                <button
                  type="button"
                  onClick={() => setIsFullTranscriptOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors cursor-pointer"
                >
                  View full transcript
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Flat full text fallback */
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <p className="text-sm leading-7 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                {transcript.full_text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 4. Tab Content: Key Moments ── */}
      {activeSubTab === "key-moments" && (
        <div className="space-y-4">
          {!hasKeyMoments ? (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No key moments are available for this assessment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {transcript_evidence.map((ev, i) => {
                const timeStr = ev.timestamp_s != null ? fmtTime(ev.timestamp_s) : null;

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedKeyMoment(ev)}
                    className="group flex flex-col justify-between h-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-200 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedKeyMoment(ev);
                      }
                    }}
                  >
                    <div className="space-y-3">
                      {/* Top row: Dimension badge & Timestamp */}
                      <div className="flex items-center justify-between gap-2">
                        {ev.dimension ? (
                          <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                            {ev.dimension}
                          </span>
                        ) : (
                          <span />
                        )}

                        {timeStr && (
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/50 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" />
                            {timeStr}
                          </span>
                        )}
                      </div>

                      {/* Quote preview */}
                      <p className="text-xs sm:text-sm italic leading-relaxed text-slate-700 dark:text-slate-200 line-clamp-3">
                        "{ev.quote}"
                      </p>
                    </div>

                    {/* Footer action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                        View details
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 5. Modal: Full Transcript ── */}
      {isFullTranscriptOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-150"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFullTranscriptOpen(false)}
          />

          {/* Dialog Container */}
          <div
            className="relative w-full max-w-3xl max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Full Transcript
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete conversation record from the interview assessment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullTranscriptOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Modal Body with internal scrolling */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {hasSegments ? (
                transcript.segments.map((seg, i) => (
                  <div key={i} className="flex gap-4 py-3.5 first:pt-0 last:pb-0">
                    {seg.timestamp_s != null ? (
                      <button
                        type="button"
                        onClick={() => {
                          seekTo(seg.timestamp_s!);
                          setIsFullTranscriptOpen(false);
                        }}
                        className="mt-0.5 min-w-[3.5rem] font-mono text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline transition-colors text-left shrink-0"
                        title={`Seek to ${seg.timestamp ?? fmtTime(seg.timestamp_s)}`}
                      >
                        {seg.timestamp ?? fmtTime(seg.timestamp_s)}
                      </button>
                    ) : (
                      <span className="mt-0.5 min-w-[3.5rem] font-mono text-xs text-slate-400 shrink-0">
                        {seg.timestamp ?? "—"}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      {seg.speaker && (
                        <p className="mb-0.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                          {seg.speaker}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                        {seg.text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {transcript.full_text}
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-5 py-3.5 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setIsFullTranscriptOpen(false)}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Modal: Key Moment Detail ── */}
      {selectedKeyMoment && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-150"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedKeyMoment(null)}
          />

          {/* Dialog Container */}
          <div
            className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5 pr-2">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedKeyMoment.dimension && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                      {selectedKeyMoment.dimension}
                    </span>
                  )}
                  {selectedKeyMoment.timestamp_s != null && (
                    <button
                      type="button"
                      onClick={() => {
                        seekTo(selectedKeyMoment.timestamp_s!);
                      }}
                      className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/50 hover:bg-violet-100 px-2 py-0.5 rounded transition-colors"
                      title="Seek to timestamp"
                    >
                      <Clock className="w-3 h-3" />
                      {fmtTime(selectedKeyMoment.timestamp_s)}
                    </button>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Key Moment Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKeyMoment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Modal Body with internal scrolling */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* What You Said */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  What You Said
                </h4>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-4">
                  <p className="text-xs sm:text-sm italic leading-relaxed text-slate-700 dark:text-slate-200">
                    "{selectedKeyMoment.quote}"
                  </p>
                </div>
              </div>

              {/* Why This Matters (Observation) */}
              {selectedKeyMoment.observation && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Why This Matters
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {selectedKeyMoment.observation}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-5 py-3.5 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setSelectedKeyMoment(null)}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
