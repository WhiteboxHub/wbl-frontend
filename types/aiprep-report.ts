/**
 * AI Prep Report – Normalization Layer
 *
 * Source of truth: fapi/ai_prep/schemas.py + all_json_schemas.json contracts
 *
 * The three backend report columns are:
 *   audio_evaluation        → from audio_prompt.py LLM output
 *   video_evaluation        → from video_prompt.py LLM output (null if AUDIO-only)
 *   transcript_evaluation   → from intro_prompt.py / technical LLM output, contains:
 *       scores_breakdown_json, intro_evaluation, technical_analysis_json,
 *       non_technical_analysis_json, coaching_suggestions_json,
 *       transcript_evidence_json, gaps_to_validate_json, improvements_json,
 *       resume_alignment, signal_timeline_json
 *
 * Recording URL: assessment.youtube_url (YouTube or streaming URL; null if not yet processed)
 * Transcript: data.transcript.{ full_text?, text?, segments?[] }
 */
import type { AssessmentDataResponse, AssessmentDetail, AssessmentReportResponse } from "./aiprep";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Dict = Record<string, unknown>;
const asRecord = (v: unknown): Dict =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Dict) : {};
const asStr = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;
const asStrArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(asStr).filter(Boolean) as string[] : [];
const nested = (v: unknown, key: string): Dict => asRecord(asRecord(v)[key]);

/** Convert backend band/readiness enum to display label */
export function formatBand(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const map: Record<string, string> = {
    EXCELLENT:           "Excellent",
    STRONG:              "Strong",
    GOOD:                "Good",
    ADEQUATE:            "Adequate",
    DEVELOPING:          "Developing",
    NEEDS_WORK:          "Needs Improvement",
    NEEDS_POLISH:        "Needs Improvement",
    WEAK:                "Needs Improvement",
    COVERED:             "Covered",
    PARTIAL:             "Partial",
    NOT_MENTIONED:       "Not Mentioned",
    NOT_APPLICABLE:      "N/A",
    INSUFFICIENT_DATA:   "Insufficient Data",
  };
  return map[raw.toUpperCase()] ?? raw;
}

/** Tailwind colour tokens for a status badge */
export function bandColor(band?: string): string {
  switch (band?.toUpperCase()) {
    case "EXCELLENT":
    case "STRONG":        return "bg-emerald-100 text-emerald-800";
    case "GOOD":
    case "ADEQUATE":      return "bg-sky-100 text-sky-800";
    case "DEVELOPING":
    case "NEEDS_POLISH":  return "bg-amber-100 text-amber-800";
    case "NEEDS_WORK":
    case "WEAK":          return "bg-rose-100 text-rose-800";
    case "COVERED":       return "bg-green-100 text-green-800";
    case "PARTIAL":       return "bg-yellow-100 text-yellow-800";
    case "NOT_MENTIONED": return "bg-slate-100 text-slate-600";
    default:              return "bg-slate-100 text-slate-500";
  }
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface TranscriptSegment {
  speaker?: string;
  timestamp?: string;     // display timestamp e.g. "00:48"
  timestamp_s?: number;   // numeric seconds for video seeking
  text: string;
}

export interface AudioFactor {
  status?: string;
  observation?: string;
  reliability?: string;
  reliability_note?: string | null;
}

export interface VideoFactor {
  status?: string;
  observation?: string;
  reliability?: string;
  reliability_note?: string | null;
}

export interface KeyFinding {
  factor: string;
  finding: string;
  why_it_matters?: string;
}

export interface CoachingSuggestion {
  priority?: number;
  dimension?: string;
  area?: string;
  suggestion?: string;
  evidence?: string;
}

export interface ImprovementItem {
  priority?: number;
  topic?: string;
  effort?: string;
  rationale?: string;
}

export interface GapItem {
  topic?: string;
  reason?: string;
}

export interface TranscriptEvidence {
  quote: string;
  timestamp_s?: number | null;
  dimension?: string;
  observation?: string;
}

export interface IntroOverallAssessment {
  readiness?: string;   // STRONG | GOOD | NEEDS_POLISH | WEAK
  summary?: string;
  strongest_signal?: string;
  biggest_gap?: string;
}

/** Unified normalized model consumed by all report components */
export interface NormalizedReport {
  // ── Assessment meta ──────────────────────────────────────────
  assessment: AssessmentDetail;
  /** YouTube or streaming URL for playback; null = unavailable */
  youtube_url: string | null;

  // ── Overall assessment ────────────────────────────────────────
  /** Intro readiness band: STRONG | GOOD | NEEDS_POLISH | WEAK */
  overall_readiness?: string;
  /** LLM-generated overall summary paragraph */
  overall_summary?: string;
  overall_strongest_signal?: string;
  overall_biggest_gap?: string;

  // ── Scores breakdown (from transcript_evaluation.scores_breakdown_json) ──
  scores: {
    ai_engineering?:   { band?: string };
    core_engineering?: { band?: string };
    non_technical?:    { band?: string };
    business_acumen?:  { band?: string };
    overall_band?:     string;
  };

  // ── Introduction quality (from intro_evaluation.introduction_quality) ──
  intro_quality?: {
    clarity?: string;
    coherence?: string;
    technical_depth?: string;
    business_context?: string;
    personal_ownership?: string;
    buzzword_density?: string;
    observation?: string;
  };

  // ── Resume alignment (from transcript_evaluation.resume_alignment) ──
  resume_alignment?: {
    band?: string;
    missed_highlights?: string[];
    unverified_claims?: string[];
  };

  // ── Technical analysis (from transcript_evaluation.technical_analysis_json) ──
  technical_analysis?: {
    summary?: string;
    strengths?: string[];
    areas_for_improvement?: string[];
    depth_assessment?: string;
  };

  // ── Non-technical (from transcript_evaluation.non_technical_analysis_json) ──
  non_technical?: {
    communication_summary?: string;
    structure_quality?: string;
    confidence_notes?: string;
  };

  // ── Introduction section items (from intro_evaluation sub-sections) ──
  /** Individual section highlights: career_story, current_role, current_project, agentic_ai, etc. */
  intro_sections: {
    key: string;
    title: string;
    status?: string;
    observation?: string;
    evidence?: string[];
  }[];

  // ── Strongest points and critical gaps from intro ──
  strongest_points: string[];
  critical_gaps: {
    topic?: string;
    status?: string;
    what_is_missing?: string;
    why_it_matters?: string;
    suggested_addition?: string;
  }[];
  priority_improvements: {
    priority?: number;
    topic?: string;
    guidance?: string;
    example?: string;
  }[];
  final_assessment?: {
    career_story?: string;
    current_project_clarity?: string;
    ai_engineering_depth?: string;
    production_engineering_depth?: string;
    transition_quality?: string;
    most_important_improvement?: string;
  };

  // ── Audio (from audio_evaluation) ──
  audio?: {
    overall_readiness?: string;
    executive_summary?: string;
    primary_vocal_strength?: string | null;
    primary_vocal_gap?: string | null;
    factors: {
      confidence_vocal_presence?: AudioFactor;
      fluency?: AudioFactor;
      pace?: AudioFactor & { wpm_recorded?: number };
      volume?: AudioFactor;
      filler_word_usage?: AudioFactor;
      pausing?: AudioFactor;
    };
    key_findings: KeyFinding[];
    recording_environment?: {
      background_noise_level?: string;
      clipping_detected?: boolean;
      speaking_duration_seconds?: number;
      noise_impact_observation?: string;
    };
  };

  // ── Video (from video_evaluation — null if AUDIO-only session) ──
  video?: {
    overall_summary?: string;
    primary_setup_strength?: string | null;
    primary_setup_gap?: string | null;
    factors: {
      camera_framing_centering?: VideoFactor;
      camera_angle_gaze_alignment?: VideoFactor;
      primary_display_orientation?: VideoFactor;
      off_screen_gaze_duration?: VideoFactor;
      observable_physical_tension?: VideoFactor;
    };
    key_findings: KeyFinding[];
  };

  // ── Coaching (from coaching_suggestions_json) ──
  coaching_suggestions: CoachingSuggestion[];

  // ── Improvements (from improvements_json) ──
  improvements: ImprovementItem[];

  // ── Gaps to validate (from gaps_to_validate_json) ──
  gaps_to_validate: GapItem[];

  // ── Transcript (from data.transcript) ──
  transcript: {
    full_text?: string;
    segments: TranscriptSegment[];
  };

  // ── Transcript evidence (from transcript_evidence_json) ──
  transcript_evidence: TranscriptEvidence[];
}

// ─── Normalization ────────────────────────────────────────────────────────────

function parseTranscript(raw: unknown): NormalizedReport["transcript"] {
  const rec = asRecord(raw);
  const full_text = asStr(rec.full_text) ?? asStr(rec.text) ?? asStr(rec.transcript_text);
  const rawSegs = Array.isArray(rec.segments) ? rec.segments : Array.isArray(rec.items) ? rec.items : [];
  const segments: TranscriptSegment[] = rawSegs
    .map((item: unknown) => {
      const s = asRecord(item);
      const text = asStr(s.text) ?? asStr(s.content) ?? "";
      if (!text) return null;
      const ts = asStr(s.timestamp) ?? asStr(s.start_time);
      const ts_s =
        typeof s.timestamp_s === "number" ? s.timestamp_s :
        typeof s.start_s === "number" ? s.start_s : undefined;
      return {
        speaker: asStr(s.speaker) ?? asStr(s.role),
        timestamp: ts,
        timestamp_s: ts_s,
        text,
      };
    })
    .filter(Boolean) as TranscriptSegment[];
  return { full_text, segments };
}

function parseAudio(raw: unknown): NormalizedReport["audio"] | undefined {
  const outer = asRecord(raw);
  // unwrap nested audio_evaluation if present
  const src = Object.keys(nested(outer, "audio_evaluation")).length
    ? nested(outer, "audio_evaluation")
    : outer;
  if (!Object.keys(src).length) return undefined;

  const summary = asRecord(src.summary);
  const factors = asRecord(src.factors);
  const keyFindings = (Array.isArray(src.key_findings) ? src.key_findings : [])
    .map((f: unknown) => {
      const fac = asRecord(f);
      return { factor: asStr(fac.factor) ?? "", finding: asStr(fac.finding) ?? "", why_it_matters: asStr(fac.why_it_matters) };
    })
    .filter(f => f.finding);
  const env = asRecord(src.recording_environment_context);

  const parseFactor = (key: string): AudioFactor | undefined => {
    const f = asRecord(factors[key]);
    if (!Object.keys(f).length) return undefined;
    return { status: asStr(f.status), observation: asStr(f.observation), reliability: asStr(f.reliability), reliability_note: asStr(f.reliability_note) ?? null };
  };
  const pace = asRecord(factors.pace);

  return {
    overall_readiness: asStr(summary.overall_readiness),
    executive_summary: asStr(summary.executive_summary),
    primary_vocal_strength: asStr(summary.primary_vocal_strength) ?? null,
    primary_vocal_gap: asStr(summary.primary_vocal_gap) ?? null,
    factors: {
      confidence_vocal_presence: parseFactor("confidence_vocal_presence"),
      fluency: parseFactor("fluency"),
      pace: pace.status ? { ...parseFactor("pace"), wpm_recorded: typeof pace.wpm_recorded === "number" ? pace.wpm_recorded : undefined } : undefined,
      volume: parseFactor("volume"),
      filler_word_usage: parseFactor("filler_word_usage"),
      pausing: parseFactor("pausing"),
    },
    key_findings: keyFindings,
    recording_environment: Object.keys(env).length ? {
      background_noise_level: asStr(env.background_noise_level),
      clipping_detected: typeof env.clipping_detected === "boolean" ? env.clipping_detected : undefined,
      speaking_duration_seconds: typeof env.speaking_duration_seconds === "number" ? env.speaking_duration_seconds : undefined,
      noise_impact_observation: asStr(env.noise_impact_observation),
    } : undefined,
  };
}

function parseVideo(raw: unknown): NormalizedReport["video"] | undefined {
  const outer = asRecord(raw);
  const src = Object.keys(nested(outer, "video_evaluation")).length
    ? nested(outer, "video_evaluation")
    : outer;
  if (!Object.keys(src).length) return undefined;

  const summary = asRecord(src.summary);
  const factors = asRecord(src.factors);
  const keyFindings = (Array.isArray(src.key_findings) ? src.key_findings : [])
    .map((f: unknown) => {
      const fac = asRecord(f);
      return { factor: asStr(fac.factor) ?? "", finding: asStr(fac.finding) ?? "", why_it_matters: asStr(fac.why_it_matters) };
    })
    .filter(f => f.finding);

  const parseVFactor = (key: string): VideoFactor | undefined => {
    const f = asRecord(factors[key]);
    if (!Object.keys(f).length) return undefined;
    return { status: asStr(f.status), observation: asStr(f.observation), reliability: asStr(f.reliability), reliability_note: asStr(f.reliability_note) ?? null };
  };

  return {
    overall_summary: asStr(summary.overall_summary),
    primary_setup_strength: asStr(summary.primary_setup_strength) ?? null,
    primary_setup_gap: asStr(summary.primary_setup_gap) ?? null,
    factors: {
      camera_framing_centering: parseVFactor("camera_framing_centering"),
      camera_angle_gaze_alignment: parseVFactor("camera_angle_gaze_alignment"),
      primary_display_orientation: parseVFactor("primary_display_orientation"),
      off_screen_gaze_duration: parseVFactor("off_screen_gaze_duration"),
      observable_physical_tension: parseVFactor("observable_physical_tension"),
    },
    key_findings: keyFindings,
  };
}

const SECTION_LABEL: Record<string, string> = {
  career_story: "Career Story",
  current_role: "Current Role",
  current_project: "Current Project",
  agentic_ai: "Agentic AI",
  rag_and_retrieval: "RAG & Retrieval",
  models_and_ai_platforms: "Models & AI Platforms",
  software_engineering: "Software Engineering",
  cloud_and_infrastructure: "Cloud & Infrastructure",
  cicd_and_delivery: "CI/CD & Delivery",
  ai_engineering_evolution: "AI Engineering Evolution",
};

// Keys to skip when iterating intro_evaluation sections
const SKIP_KEYS = new Set([
  "overall_assessment", "strongest_points", "critical_gaps",
  "priority_improvements", "final_assessment", "technology_inventory",
  "introduction_quality",
]);

export function normalizeReport(
  assessment: AssessmentDetail,
  data?: AssessmentDataResponse | null,
  apiReport?: AssessmentReportResponse | null,
): NormalizedReport {
  // ── Resolve report columns ───────────────────────────────────────────────
  // The backend /report endpoint returns: { audio_evaluation, video_evaluation, transcript_evaluation, report_data }
  // report_data is a virtual property = { audio_evaluation, video_evaluation, transcript_evaluation }
  const bundled = asRecord(assessment.report); // from AssessmentDetailResponse.report dict

  const rawAudio   = apiReport?.audio_evaluation   ?? asRecord(bundled.audio_evaluation);
  const rawVideo   = apiReport?.video_evaluation   ?? asRecord(bundled.video_evaluation);
  const rawTxEval  = apiReport?.transcript_evaluation ?? asRecord(bundled.transcript_evaluation);

  // ── transcript_evaluation contains the intro_evaluation and scores ───────
  const txEval = asRecord(rawTxEval);

  // Resolve intro_evaluation — it may be directly in transcript_evaluation
  const introEval = Object.keys(nested(txEval, "intro_evaluation")).length
    ? nested(txEval, "intro_evaluation")
    : txEval;

  const overallAssessment = asRecord(introEval.overall_assessment) as IntroOverallAssessment;

  // ── Scores breakdown ─────────────────────────────────────────────────────
  const scoresRaw = asRecord(txEval.scores_breakdown_json);
  const parseScore = (key: string) => {
    const s = asRecord(scoresRaw[key]);
    return Object.keys(s).length ? { band: asStr(s.band) } : undefined;
  };

  // ── Intro quality ────────────────────────────────────────────────────────
  const iq = asRecord(introEval.introduction_quality);
  const intro_quality = Object.keys(iq).length ? {
    clarity: asStr(iq.clarity),
    coherence: asStr(iq.coherence),
    technical_depth: asStr(iq.technical_depth),
    business_context: asStr(iq.business_context),
    personal_ownership: asStr(iq.personal_ownership),
    buzzword_density: asStr(iq.buzzword_density),
    observation: asStr(iq.observation),
  } : undefined;

  // ── Resume alignment ─────────────────────────────────────────────────────
  const ra = asRecord(txEval.resume_alignment);
  const resume_alignment = Object.keys(ra).length ? {
    band: asStr(ra.band),
    missed_highlights: asStrArray(ra.missed_highlights),
    unverified_claims: asStrArray(ra.unverified_claims),
  } : undefined;

  // ── Technical analysis ───────────────────────────────────────────────────
  const ta = asRecord(txEval.technical_analysis_json);
  const technical_analysis = Object.keys(ta).length ? {
    summary: asStr(ta.summary),
    strengths: asStrArray(ta.strengths),
    areas_for_improvement: asStrArray(ta.areas_for_improvement),
    depth_assessment: asStr(ta.depth_assessment),
  } : undefined;

  // ── Non-technical analysis ───────────────────────────────────────────────
  const nt = asRecord(txEval.non_technical_analysis_json);
  const non_technical = Object.keys(nt).length ? {
    communication_summary: asStr(nt.communication_summary),
    structure_quality: asStr(nt.structure_quality),
    confidence_notes: asStr(nt.confidence_notes),
  } : undefined;

  // ── Intro section items ──────────────────────────────────────────────────
  const intro_sections = Object.entries(introEval)
    .filter(([key]) => !SKIP_KEYS.has(key) && !key.startsWith("_"))
    .flatMap(([key, value]) => {
      const sec = asRecord(value);
      const observation = asStr(sec.observation);
      const status = asStr(sec.overall_status);
      if (!observation && !status) return [];
      return [{
        key,
        title: SECTION_LABEL[key] ?? key.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
        status,
        observation,
        evidence: asStrArray(sec.evidence),
      }];
    });

  // ── Critical gaps & improvements ─────────────────────────────────────────
  const critical_gaps = Array.isArray(introEval.critical_gaps)
    ? introEval.critical_gaps.map((g: unknown) => {
        const gap = asRecord(g);
        return {
          topic: asStr(gap.topic),
          status: asStr(gap.status),
          what_is_missing: asStr(gap.what_is_missing),
          why_it_matters: asStr(gap.why_it_matters),
          suggested_addition: asStr(gap.suggested_addition),
        };
      })
    : [];

  const priority_improvements = Array.isArray(introEval.priority_improvements)
    ? introEval.priority_improvements.map((p: unknown) => {
        const imp = asRecord(p);
        return {
          priority: typeof imp.priority === "number" ? imp.priority : undefined,
          topic: asStr(imp.topic),
          guidance: asStr(imp.guidance),
          example: asStr(imp.example),
        };
      })
    : [];

  const fa = asRecord(introEval.final_assessment);
  const final_assessment = Object.keys(fa).length ? {
    career_story: asStr(fa.career_story),
    current_project_clarity: asStr(fa.current_project_clarity),
    ai_engineering_depth: asStr(fa.ai_engineering_depth),
    production_engineering_depth: asStr(fa.production_engineering_depth),
    transition_quality: asStr(fa.transition_quality),
    most_important_improvement: asStr(fa.most_important_improvement),
  } : undefined;

  // ── Coaching suggestions ─────────────────────────────────────────────────
  const coaching_suggestions: CoachingSuggestion[] = Array.isArray(txEval.coaching_suggestions_json)
    ? txEval.coaching_suggestions_json.map((c: unknown) => {
        const cs = asRecord(c);
        return {
          priority: typeof cs.priority === "number" ? cs.priority : undefined,
          dimension: asStr(cs.dimension),
          area: asStr(cs.area),
          suggestion: asStr(cs.suggestion),
          evidence: asStr(cs.evidence),
        };
      })
    : [];

  // ── Improvements ─────────────────────────────────────────────────────────
  const improvements: ImprovementItem[] = Array.isArray(txEval.improvements_json)
    ? txEval.improvements_json.map((i: unknown) => {
        const imp = asRecord(i);
        return {
          priority: typeof imp.priority === "number" ? imp.priority : undefined,
          topic: asStr(imp.topic),
          effort: asStr(imp.effort),
          rationale: asStr(imp.rationale),
        };
      })
    : [];

  // ── Gaps to validate ─────────────────────────────────────────────────────
  const gaps_to_validate: GapItem[] = Array.isArray(txEval.gaps_to_validate_json)
    ? txEval.gaps_to_validate_json.map((g: unknown) => {
        const gap = asRecord(g);
        return { topic: asStr(gap.topic), reason: asStr(gap.reason) };
      })
    : [];

  // ── Transcript evidence ───────────────────────────────────────────────────
  const transcript_evidence: TranscriptEvidence[] = Array.isArray(txEval.transcript_evidence_json)
    ? txEval.transcript_evidence_json.map((e: unknown) => {
        const ev = asRecord(e);
        return {
          quote: asStr(ev.quote) ?? "",
          timestamp_s: typeof ev.timestamp_s === "number" ? ev.timestamp_s : null,
          dimension: asStr(ev.dimension),
          observation: asStr(ev.observation),
        };
      }).filter(e => e.quote)
    : [];

  // ── Transcript from data response ────────────────────────────────────────
  // data_record.transcript may also be available via assessment.data
  const rawTranscript = data?.transcript ?? asRecord(assessment.data).transcript;
  const transcript = parseTranscript(rawTranscript);

  return {
    assessment,
    youtube_url: assessment.youtube_url ?? null,
    overall_readiness: asStr(overallAssessment.readiness),
    overall_summary: asStr(overallAssessment.summary),
    overall_strongest_signal: asStr(overallAssessment.strongest_signal),
    overall_biggest_gap: asStr(overallAssessment.biggest_gap),
    scores: {
      ai_engineering:   parseScore("ai_engineering"),
      core_engineering: parseScore("core_engineering"),
      non_technical:    parseScore("non_technical"),
      business_acumen:  parseScore("business_acumen"),
      overall_band:     asStr(scoresRaw.overall_band),
    },
    intro_quality,
    resume_alignment,
    technical_analysis,
    non_technical,
    intro_sections,
    strongest_points: asStrArray(introEval.strongest_points),
    critical_gaps,
    priority_improvements,
    final_assessment,
    audio: parseAudio(rawAudio),
    video: parseVideo(rawVideo),
    coaching_suggestions,
    improvements,
    gaps_to_validate,
    transcript,
    transcript_evidence,
  };
}
