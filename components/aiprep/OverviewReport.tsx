"use client";
import { RefObject } from "react";
import Link from "next/link";
import {
  User, Cpu, Code2, AudioWaveform, Video, ShieldCheck,
  Lightbulb, FileText, ExternalLink,
} from "lucide-react";
import { type NormalizedReport, formatBand, bandColor } from "@/types/aiprep-report";
import VideoPlayer from "./VideoPlayer";

interface Props {
  report: NormalizedReport;
  videoRef: RefObject<HTMLVideoElement | null>;
  seekTo: (seconds: number) => void;
  assessmentId: string;
  onSelectTab?: (tab: "Overview" | "Performance" | "Technical" | "Communication" | "Coaching" | "Transcript" | "Next Steps") => void;
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function Badge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${bandColor(status)}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {formatBand(status)}
    </span>
  );
}

// ── Highlight Card ─────────────────────────────────────────────────────────────
function HighlightCard({
  icon, title, observation, status,
}: {
  icon: React.ReactNode;
  title: string;
  observation?: string;
  status?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-violet-600">{icon}</div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      {observation ? (
        <p className="flex-1 text-xs leading-5 text-slate-600 line-clamp-3">{observation}</p>
      ) : (
        <p className="flex-1 text-xs text-slate-400 italic">Evaluation data unavailable.</p>
      )}
      <div className="mt-auto pt-1">
        {status ? <Badge status={status} /> : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>
    </div>
  );
}

// ── Format timestamp seconds → MM:SS ─────────────────────────────────────────
function fmtTime(seconds?: number): string {
  if (seconds == null || isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function OverviewReport({ report, videoRef, seekTo, assessmentId, onSelectTab }: Props) {
  const {
    youtube_url, overall_readiness, overall_summary, scores,
    intro_sections, audio, video, transcript, coaching_suggestions,
    priority_improvements, final_assessment,
  } = report;

  // ── Derive highlight cards ────────────────────────────────────────────────
  // 1. Introduction & Resume — from intro_sections: career_story / current_role / current_project
  const introSection = intro_sections.find(s =>
    ["career_story", "current_role", "current_project"].includes(s.key)
  );
  const introResumeBand = introSection?.status ?? scores.overall_band;

  // 2. AI Engineering — scores_breakdown_json.ai_engineering band
  const aiEngBand = scores.ai_engineering?.band;
  const aiEngObs = intro_sections.find(s =>
    ["agentic_ai", "rag_and_retrieval", "models_and_ai_platforms"].includes(s.key)
  )?.observation;

  // 3. Software Engineering — scores_breakdown_json.core_engineering band
  const coreEngBand = scores.core_engineering?.band;
  const coreEngObs = intro_sections.find(s =>
    ["software_engineering", "cloud_and_infrastructure", "cicd_and_delivery"].includes(s.key)
  )?.observation;

  // 4. Audio Analysis — audio_evaluation.summary.overall_readiness
  const audioObs = audio?.executive_summary ?? audio?.primary_vocal_strength ?? undefined;
  const audioBand = audio?.overall_readiness;

  // 5. Video & On-Camera — video_evaluation.summary
  const videoObs = video?.overall_summary ?? video?.primary_setup_strength ?? undefined;
  const videoBand = video
    ? (video.factors.camera_framing_centering?.status ?? scores.non_technical?.band)
    : undefined;

  // 6. Additional Factors — non_technical / business_acumen
  const addlBand = scores.non_technical?.band ?? scores.business_acumen?.band;
  const addlObs = intro_sections.find(s =>
    ["ai_engineering_evolution", "cicd_and_delivery"].includes(s.key)
  )?.observation;

  // ── Tip — pick best available LLM suggestion ──────────────────────────────
  const tip =
    final_assessment?.most_important_improvement ??
    priority_improvements[0]?.guidance ??
    coaching_suggestions.find(c => c.priority === 1)?.suggestion ??
    coaching_suggestions[0]?.suggestion;

  // ── Transcript preview — first 4 segments ────────────────────────────────
  const previewSegments = transcript.segments.slice(0, 4);

  return (
    <div className="space-y-6">

      {/* ── Overall Assessment ─────────────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">✦</span>
            <h2 className="text-base font-extrabold text-slate-900">Overall Assessment</h2>
          </div>
          <Badge status={overall_readiness ?? scores.overall_band} />
        </div>
        {overall_summary ? (
          <p className="mt-3 text-sm leading-6 text-slate-600">{overall_summary}</p>
        ) : (
          <p className="mt-3 text-sm text-slate-400 italic">
            {report.assessment.status === "EVALUATING"
              ? "Your assessment is currently being evaluated. Check back soon."
              : "Overall summary not yet available."}
          </p>
        )}
      </section>

      {/* ── Evaluation Highlights ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Evaluation Highlights
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HighlightCard
            icon={<User size={16} />}
            title="Introduction & Resume"
            observation={introSection?.observation}
            status={introResumeBand}
          />
          <HighlightCard
            icon={<Cpu size={16} />}
            title="AI Engineering"
            observation={aiEngObs}
            status={aiEngBand}
          />
          <HighlightCard
            icon={<Code2 size={16} />}
            title="Software Engineering"
            observation={coreEngObs}
            status={coreEngBand}
          />
          <HighlightCard
            icon={<AudioWaveform size={16} />}
            title="Audio Analysis"
            observation={audioObs}
            status={audioBand}
          />
          <HighlightCard
            icon={<Video size={16} />}
            title="Video & On-Camera"
            observation={report.assessment.media_type === "AUDIO" ? "Audio-only assessment — no video evaluation." : videoObs}
            status={report.assessment.media_type === "AUDIO" ? undefined : videoBand}
          />
          <HighlightCard
            icon={<ShieldCheck size={16} />}
            title="Additional Factors"
            observation={addlObs}
            status={addlBand}
          />
        </div>
      </section>

      {/* ── Recording + Transcript preview ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Recording Playback */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-slate-700">
            <Video size={15} className="text-violet-500" />
            <h2 className="text-sm font-bold">Recording Playback</h2>
          </div>
          <VideoPlayer youtubeUrl={youtube_url} videoRef={videoRef} />
        </section>

        {/* Transcript Preview */}
        <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText size={15} className="text-violet-500" />
              <h2 className="text-sm font-bold">Transcript Preview</h2>
            </div>
            <Link
              href={`/aiprep/reports/${assessmentId}/transcript`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && onSelectTab) {
                  e.preventDefault();
                  onSelectTab("Transcript");
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
            >
              <ExternalLink size={12} />
              Open Full Transcript
            </Link>
          </div>

          {previewSegments.length > 0 ? (
            <div className="flex-1 space-y-3 overflow-hidden">
              {previewSegments.map((seg, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  {/* Timestamp — clickable if timestamp_s is available */}
                  {seg.timestamp_s != null ? (
                    <button
                      onClick={() => seekTo(seg.timestamp_s!)}
                      className="w-10 shrink-0 font-mono text-violet-600 hover:text-violet-800 hover:underline text-left transition-colors"
                      title={`Seek to ${seg.timestamp}`}
                    >
                      {seg.timestamp ?? fmtTime(seg.timestamp_s)}
                    </button>
                  ) : (
                    <span className="w-10 shrink-0 font-mono text-slate-400">
                      {seg.timestamp ?? "—"}
                    </span>
                  )}
                  <div>
                    {seg.speaker && (
                      <p className="mb-0.5 font-bold text-slate-700">{seg.speaker}</p>
                    )}
                    <p className="leading-5 text-slate-600 line-clamp-2">{seg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : transcript.full_text ? (
            <p className="flex-1 text-xs leading-6 text-slate-600 line-clamp-6">{transcript.full_text}</p>
          ) : (
            <p className="flex-1 text-xs text-slate-400 italic">
              Transcript unavailable for this assessment.
            </p>
          )}
        </section>
      </div>

      {/* ── Tip ───────────────────────────────────────────────────────────── */}
      {tip && (
        <section className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Tip</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{tip}</p>
          </div>
        </section>
      )}

    </div>
  );
}
