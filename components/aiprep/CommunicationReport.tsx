"use client";

import { useState, useEffect } from "react";
import {
  Mic,
  Video,
  MessageSquare,
  Sparkles,
  X,
  ArrowRight,
} from "lucide-react";
import { type NormalizedReport, formatBand, bandColor } from "@/types/aiprep-report";

interface Props {
  report: NormalizedReport;
}

function formatCommRating(status?: string): string | undefined {
  if (!status) return undefined;
  const s = status.toUpperCase().trim();
  if (["STRONG", "EXCELLENT", "GOOD", "HIGH"].includes(s)) return "Good";
  if (["ADEQUATE", "AVERAGE", "MODERATE", "DEVELOPING"].includes(s)) return "Average";
  if (["NEEDS_WORK", "NEEDS_POLISH", "WEAK", "LOW", "POOR"].includes(s)) return "Needs Improvement";
  if (["INSUFFICIENT_DATA", "INSUFFICIENT"].includes(s)) return "Insufficient Data";
  return formatBand(status);
}

function commRatingColor(status?: string): string {
  if (!status) return "bg-slate-100 text-slate-500";
  const s = status.toUpperCase().trim();
  if (["STRONG", "EXCELLENT", "GOOD", "HIGH"].includes(s)) return "bg-emerald-100 text-emerald-800";
  if (["ADEQUATE", "AVERAGE", "MODERATE", "DEVELOPING"].includes(s)) return "bg-sky-100 text-sky-800";
  if (["NEEDS_WORK", "NEEDS_POLISH", "WEAK", "LOW", "POOR"].includes(s)) return "bg-rose-100 text-rose-800";
  if (["INSUFFICIENT_DATA", "INSUFFICIENT"].includes(s)) return "bg-slate-100 text-slate-600";
  return bandColor(status);
}

function Badge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${commRatingColor(status)}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {formatCommRating(status)}
    </span>
  );
}

function cleanCommDetail(text?: string): string | undefined {
  if (!text) return undefined;
  return text
    .replace(/within the preferred range of \d+[–-]\d+\s*WPM\.?/gi, "at an optimal, comfortable conversational pace.")
    .replace(/\b\d+[–-]\d+\s*WPM\b/gi, "conversational pace")
    .replace(/\b\d+\s*WPM\b/gi, "conversational pace")
    .replace(/\b\d+\s*words\s*per\s*minute\b/gi, "conversational pace")
    .replace(/\bwords per minute\b/gi, "speaking pace");
}

interface MetricItem {
  key: string;
  label: string;
  status?: string;
  detail?: string;
}

export default function CommunicationReport({ report }: Props) {
  const { audio, video, non_technical, assessment } = report;

  // State for on-demand details modal
  const [selectedMetric, setSelectedMetric] = useState<MetricItem | null>(null);

  // Close modal on Escape key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedMetric(null);
    };
    if (selectedMetric) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selectedMetric]);

  // Extract raw evaluations if present for flat or structured fallback
  const rawReport = (assessment as Record<string, any>)?.report;
  const rawAudio = (rawReport?.audio_evaluation ?? {}) as Record<string, any>;
  const rawVideo = (rawReport?.video_evaluation ?? {}) as Record<string, any>;

  // ── 1. Spoken Delivery Items ───────────────────────────────────────────────
  const audioItems: MetricItem[] = [];

  if (audio?.factors) {
    if (audio.factors.confidence_vocal_presence) {
      audioItems.push({
        key: "confidence_vocal_presence",
        label: "Confidence & Vocal Presence",
        status: audio.factors.confidence_vocal_presence.status,
        detail: cleanCommDetail(audio.factors.confidence_vocal_presence.observation),
      });
    }
    if (audio.factors.fluency) {
      audioItems.push({
        key: "fluency",
        label: "Fluency",
        status: audio.factors.fluency.status,
        detail: cleanCommDetail(audio.factors.fluency.observation),
      });
    }
    if (audio.factors.pace) {
      audioItems.push({
        key: "pace",
        label: "Pace",
        status: audio.factors.pace.status,
        detail: cleanCommDetail(audio.factors.pace.observation),
      });
    }
    if (audio.factors.volume) {
      audioItems.push({
        key: "volume",
        label: "Volume",
        status: audio.factors.volume.status,
        detail: cleanCommDetail(audio.factors.volume.observation),
      });
    }
    if (audio.factors.filler_word_usage) {
      audioItems.push({
        key: "filler_word_usage",
        label: "Filler Word Usage",
        status: audio.factors.filler_word_usage.status,
        detail: cleanCommDetail(audio.factors.filler_word_usage.observation),
      });
    }
    if (audio.factors.pausing) {
      audioItems.push({
        key: "pausing",
        label: "Pausing",
        status: audio.factors.pausing.status,
        detail: cleanCommDetail(audio.factors.pausing.observation),
      });
    }
  }

  // Fallback for flat audio_evaluation fields if structured factors were empty
  if (audioItems.length === 0) {
    const flatAudioFields: [string, string][] = [
      ["clarity", "Clarity"],
      ["fluency", "Fluency"],
      ["pace", "Pace"],
      ["confidence", "Confidence"],
      ["volume", "Volume"],
      ["professionalism", "Professionalism"],
      ["coherence", "Coherence"],
    ];
    for (const [field, label] of flatAudioFields) {
      const val = typeof rawAudio[field] === "string" ? rawAudio[field] : undefined;
      if (val) {
        audioItems.push({ key: field, label, detail: cleanCommDetail(val) });
      }
    }
  }

  // Fallback to intro_quality and vocal delivery if audioItems is empty
  if (audioItems.length === 0) {
    if (report.intro_quality?.clarity) {
      audioItems.push({
        key: "clarity",
        label: "Speech Clarity",
        status: report.intro_quality.clarity,
        detail: report.intro_quality.observation ? cleanCommDetail(report.intro_quality.observation) : undefined,
      });
    }
    if (report.intro_quality?.coherence) {
      audioItems.push({
        key: "coherence",
        label: "Spoken Flow & Coherence",
        status: report.intro_quality.coherence,
        detail: report.intro_quality.observation ? cleanCommDetail(report.intro_quality.observation) : undefined,
      });
    }
    if (audio?.primary_vocal_strength) {
      audioItems.push({
        key: "vocal_strength",
        label: "Vocal Strength",
        status: audio.overall_readiness || undefined,
        detail: cleanCommDetail(audio.primary_vocal_strength),
      });
    }
    if (audio?.primary_vocal_gap) {
      audioItems.push({
        key: "vocal_gap",
        label: "Pacing & Delivery Polish",
        status: undefined,
        detail: cleanCommDetail(audio.primary_vocal_gap),
      });
    }
  }

  // ── 2. Visual & On-Camera Presence Items ───────────────────────────────────
  const videoItems: MetricItem[] = [];

  if (video?.factors) {
    if (video.factors.camera_framing_centering) {
      videoItems.push({
        key: "camera_framing_centering",
        label: "Camera Framing & Centering",
        status: video.factors.camera_framing_centering.status,
        detail: video.factors.camera_framing_centering.observation,
      });
    }
    if (video.factors.camera_angle_gaze_alignment) {
      videoItems.push({
        key: "camera_angle_gaze_alignment",
        label: "Camera Angle & Gaze Alignment",
        status: video.factors.camera_angle_gaze_alignment.status,
        detail: video.factors.camera_angle_gaze_alignment.observation,
      });
    }
    if (video.factors.primary_display_orientation) {
      videoItems.push({
        key: "primary_display_orientation",
        label: "Display Orientation",
        status: video.factors.primary_display_orientation.status,
        detail: video.factors.primary_display_orientation.observation,
      });
    }
    if (video.factors.off_screen_gaze_duration) {
      videoItems.push({
        key: "off_screen_gaze_duration",
        label: "Off-Screen Gaze & Focus",
        status: video.factors.off_screen_gaze_duration.status,
        detail: video.factors.off_screen_gaze_duration.observation,
      });
    }
    if (video.factors.observable_physical_tension) {
      videoItems.push({
        key: "observable_physical_tension",
        label: "Observable Physical Presence",
        status: video.factors.observable_physical_tension.status,
        detail: video.factors.observable_physical_tension.observation,
      });
    }
  }

  // Fallback for flat video_evaluation fields if structured factors were empty
  if (videoItems.length === 0) {
    const flatVideoFields: [string, string][] = [
      ["eye_contact", "Eye Contact"],
      ["facial_engagement", "Facial Engagement"],
      ["posture", "Posture"],
      ["expression_variety", "Expression Variety"],
      ["distraction", "Distraction"],
    ];
    for (const [field, label] of flatVideoFields) {
      const val = typeof rawVideo[field] === "string" ? rawVideo[field] : undefined;
      if (val) {
        videoItems.push({ key: field, label, detail: val });
      }
    }
  }

  // ── 3. Communication Quality Content ───────────────────────────────────────
  const commSummary =
    non_technical?.communication_summary ||
    (report.intro_quality?.observation
      ? report.intro_quality.observation.toLowerCase().includes("lacks clarity, coherence, and technical depth") ||
        report.intro_quality.observation.toLowerCase().startsWith("the introduction lacks")
        ? "Focus on structuring your journey smoothly, mentioning key technologies, and highlighting your personal contributions."
        : report.intro_quality.observation
      : undefined) ||
    audio?.executive_summary ||
    (report.scores.non_technical?.band
      ? `Overall spoken communication and conversational engagement evaluated at ${formatBand(report.scores.non_technical.band)} readiness.`
      : undefined) ||
    report.overall_summary;

  const structureQuality =
    non_technical?.structure_quality ||
    (report.intro_quality?.coherence
      ? `Story structure and narrative flow evaluated as ${formatBand(report.intro_quality.coherence)}.`
      : undefined);

  const confidenceNotes =
    non_technical?.confidence_notes ||
    (audio?.primary_vocal_strength ? cleanCommDetail(audio.primary_vocal_strength) : undefined) ||
    (report.intro_quality?.clarity
      ? `Voice projection and articulation assessed as ${formatBand(report.intro_quality.clarity)}.`
      : undefined);

  const hasCommQuality = Boolean(commSummary || structureQuality || confidenceNotes);

  const isAudioOnly = assessment.media_type === "AUDIO";
  const hasAudioContent = audioItems.length > 0 || Boolean(audio?.executive_summary) || Boolean(report.intro_quality?.clarity);
  const hasVideoContent = !isAudioOnly && (videoItems.length > 0 || Boolean(video?.overall_summary));


  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-slate-950">Communication Analysis</h2>
        <p className="text-sm text-slate-500">
          A clear view of your spoken delivery and on-camera communication.
        </p>
      </div>

      {/* ── 1. SPOKEN DELIVERY ─────────────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Mic className="size-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Spoken Delivery</h3>
          </div>
          {audio?.overall_readiness && <Badge status={audio.overall_readiness} />}
        </div>

        {audio?.executive_summary && (
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
            {cleanCommDetail(audio.executive_summary)}
          </p>
        )}

        {hasAudioContent ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {audioItems.map((item) => (
              <div
                key={item.key}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-violet-200 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{item.label}</span>
                    {item.status && <Badge status={item.status} />}
                  </div>
                  {item.detail && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {item.detail}
                    </p>
                  )}
                </div>
                {item.detail && (
                  <button
                    type="button"
                    onClick={() => setSelectedMetric(item)}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 transition-colors self-start"
                  >
                    View details <ArrowRight className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Spoken delivery evaluation is not available for this session.
          </p>
        )}
      </section>

      {/* ── 2. VISUAL & ON-CAMERA PRESENCE ─────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Video className="size-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Visual & On-Camera Presence</h3>
          </div>
        </div>

        {!isAudioOnly && video?.overall_summary && (
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
            {video.overall_summary}
          </p>
        )}


        {hasVideoContent ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {videoItems.map((item) => (
              <div
                key={item.key}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-violet-200 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{item.label}</span>
                    {item.status && <Badge status={item.status} />}
                  </div>
                  {item.detail && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {item.detail}
                    </p>
                  )}
                </div>
                {item.detail && (
                  <button
                    type="button"
                    onClick={() => setSelectedMetric(item)}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 transition-colors self-start"
                  >
                    View details <ArrowRight className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            {assessment.media_type === "AUDIO"
              ? "This was an audio-only assessment — video evaluation is not available."
              : "Visual and on-camera presence data is not available."}
          </p>
        )}
      </section>

      {/* ── 3. COMMUNICATION QUALITY ───────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <MessageSquare className="size-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Communication Quality</h3>
        </div>

        {hasCommQuality ? (
          <div className="space-y-3">
            {commSummary && (
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                {commSummary}
              </p>
            )}
            {structureQuality && (
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Structure Quality
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  {structureQuality}
                </p>
              </div>
            )}
            {confidenceNotes && (
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Confidence Notes
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  {confidenceNotes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Communication quality analysis is not available.
          </p>
        )}
      </section>

      {/* ── Metric Details Modal ────────────────────────────────────────────── */}
      {selectedMetric && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedMetric(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                  <Sparkles className="size-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {selectedMetric.label}
                </h3>
                {selectedMetric.status && <Badge status={selectedMetric.status} />}
              </div>
              <button
                type="button"
                onClick={() => setSelectedMetric(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Observation Details
              </p>
              <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3.5">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800">
                  {cleanCommDetail(selectedMetric.detail)}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-5 py-2.5 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMetric(null)}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
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
