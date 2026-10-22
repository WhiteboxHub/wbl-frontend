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
const asStr = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return undefined;
  }
  return trimmed;
};
const asStrArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(asStr).filter(Boolean) as string[] : [];
const nested = (v: unknown, key: string): Dict => asRecord(asRecord(v)[key]);

/**
 * Convert backend band/readiness enum to display label (Good / Average / Needs Improvement).
 * @param raw - The raw status string from backend.
 * @param inverted - When true, indicates an inverted metric where LOW is desirable and HIGH is undesirable (e.g., filler words, tension, off-screen gaze).
 *                   Defaults to false, where HIGH is desirable and LOW is undesirable (e.g., volume, vocal presence, technical depth).
 */
export function formatBand(raw?: string | null, inverted: boolean = false): string | undefined {
  if (!raw) return undefined;
  const upper = raw.toUpperCase().trim();

  if (inverted) {
    if (upper === "LOW" || upper === "MINIMAL") return "Good";
    if (upper === "MODERATE") return "Average";
    if (upper === "HIGH" || upper === "EXCESSIVE") return "Needs Improvement";
  } else {
    if (upper === "HIGH") return "Good";
    if (upper === "MODERATE") return "Average";
    if (upper === "LOW" || upper === "MINIMAL" || upper === "EXCESSIVE") return "Needs Improvement";
  }

  const map: Record<string, string> = {
    EXCELLENT:           "Good",
    STRONG:              "Good",
    GOOD:                "Good",
    POSITIVE:            "Good",
    ADEQUATE:            "Average",
    AVERAGE:             "Average",
    DEVELOPING:          "Average",
    PARTIAL:             "Average",
    NEEDS_WORK:          "Needs Improvement",
    NEEDS_POLISH:        "Needs Improvement",
    NEEDS_IMPROVEMENT:   "Needs Improvement",
    WEAK:                "Needs Improvement",
    POOR:                "Needs Improvement",
    COVERED:             "Good",
    NOT_MENTIONED:       "Not Mentioned",
    NEGATIVE:            "Needs Improvement",
    NOT_APPLICABLE:      "N/A",
    INSUFFICIENT_DATA:   "Insufficient Data",
  };
  return map[upper] ?? raw;
}

/** Tailwind colour tokens for a status badge */
export function bandColor(band?: string, inverted: boolean = false): string {
  if (!band) return "bg-slate-100 text-slate-500 border-slate-200";
  const upper = band.toUpperCase().trim();

  if (inverted) {
    if (upper === "LOW" || upper === "MINIMAL") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (upper === "MODERATE") return "bg-amber-100 text-amber-800 border-amber-200";
    if (upper === "HIGH" || upper === "EXCESSIVE") return "bg-rose-100 text-rose-800 border-rose-200";
  } else {
    if (upper === "HIGH") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (upper === "MODERATE") return "bg-amber-100 text-amber-800 border-amber-200";
    if (upper === "LOW" || upper === "MINIMAL" || upper === "EXCESSIVE") return "bg-rose-100 text-rose-800 border-rose-200";
  }

  switch (upper) {
    case "EXCELLENT":
    case "STRONG":
    case "GOOD":
    case "COVERED":
    case "POSITIVE":      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "AVERAGE":
    case "ADEQUATE":
    case "DEVELOPING":
    case "PARTIAL":       return "bg-amber-100 text-amber-800 border-amber-200";
    case "NEEDS_WORK":
    case "NEEDS_POLISH":
    case "NEEDS_IMPROVEMENT":
    case "WEAK":
    case "POOR":
    case "NEGATIVE":      return "bg-rose-100 text-rose-800 border-rose-200";
    case "NOT_MENTIONED":
    case "NOT_APPLICABLE":return "bg-slate-100 text-slate-500 border-slate-200";
    default:              return "bg-slate-100 text-slate-500 border-slate-200";
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

// ─── JD Assessment Interfaces ────────────────────────────────────────────────

export interface JdValidation {
  status?: "VALID" | "PARTIAL" | "INVALID" | string;
  reason?: string;
}

export interface JdAnalysis {
  role_title?: string;
  seniority_level?: "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "UNSPECIFIED" | string;
  domain?: string;
  core_responsibilities?: string[];
  must_have_requirements?: string[];
  nice_to_have_requirements?: string[];
  tech_stack?: Record<string, string[]>;
  soft_skills_and_ownership?: string[];
}

export interface JdRequirementCoverageItem {
  requirement: string;
  category?: "TECHNICAL" | "RESPONSIBILITY" | "DOMAIN" | "EXPERIENCE_LEVEL" | "SOFT_SKILL" | string;
  importance?: "MUST_HAVE" | "NICE_TO_HAVE" | string;
  status: "COVERED" | "PARTIAL" | "NOT_MENTIONED" | "NOT_APPLICABLE" | string;
  match_type?: "EXACT" | "EQUIVALENT" | "RELATED" | "NONE" | string;
  evidence?: string | null;
  note?: string;
}

export interface JdRoleAlignment {
  overall_status?: string;
  role_relevance?: string;
  responsibilities_alignment?: string;
  seniority_match?: "MATCHES" | "BELOW_TARGET" | "ABOVE_TARGET" | "UNCLEAR" | string;
  domain_fit?: string;
  observation?: string;
  evidence?: string[];
}

export interface JdCareerStory {
  overall_status?: string;
  timeline?: string;
  roles?: string;
  career_transitions?: string;
  leads_logically_to_target_role?: string;
  transitions_identified?: string[];
  observation?: string;
  evidence?: string[];
}

export interface JdCurrentRoleAndProject {
  overall_status?: string;
  current_role?: string;
  responsibilities?: string;
  technical_ownership?: string;
  project_explained?: string;
  application_purpose?: string;
  users_or_customers?: string;
  business_problem?: string;
  personal_contribution?: string;
  relevance_to_jd?: string;
  observation?: string;
  evidence?: string[];
}

export interface JdTechnicalAlignment {
  overall_status?: string;
  core_stack_alignment?: string;
  architecture_and_design_depth?: string;
  production_and_deployment?: string;
  scale_and_performance?: string;
  technologies_matching_jd?: string[];
  equivalent_technologies?: string[];
  jd_technologies_not_mentioned?: string[];
  other_technologies_mentioned?: string[];
  observation?: string;
  evidence?: string[];
}

export interface JdValueProposition {
  overall_status?: string;
  why_this_role?: string;
  impact_and_outcomes?: string;
  differentiators?: string[];
  observation?: string;
  evidence?: string[];
}

export interface JdTailoringQuality {
  tailored_to_role?: "STRONG" | "ADEQUATE" | "WEAK" | string;
  relevant_experience_prioritized?: "STRONG" | "ADEQUATE" | "WEAK" | string;
  irrelevant_content_ratio?: "LOW" | "MODERATE" | "HIGH" | string;
  gap_bridging?: string;
  observation?: string;
  evidence?: string[];
}

export interface JdIntroQuality {
  clarity?: string;
  coherence?: string;
  technical_depth?: string;
  business_context?: string;
  personal_ownership?: string;
  buzzword_density?: string;
  length_appropriateness?: string;
  observation?: string;
}

export interface JdSuggestedOpening {
  note?: string;
  example?: string;
}

export interface JdFinalAssessment {
  jd_fit_summary?: string;
  career_story_relevance?: string;
  current_project_clarity?: string;
  technical_alignment_depth?: string;
  seniority_match?: string;
  most_important_improvement?: string;
}

export interface JdIntroEvaluation {
  jd_validation?: JdValidation;
  overall_assessment?: {
    jd_alignment?: "STRONG_FIT" | "GOOD_FIT" | "PARTIAL_FIT" | "WEAK_FIT" | string;
    readiness?: string;
    summary?: string;
    strongest_signal?: string;
    biggest_gap?: string;
  };
  jd_analysis?: JdAnalysis;
  requirement_coverage?: JdRequirementCoverageItem[];
  role_alignment?: JdRoleAlignment;
  career_story?: JdCareerStory;
  current_role_and_project?: JdCurrentRoleAndProject;
  technical_alignment?: JdTechnicalAlignment;
  value_proposition?: JdValueProposition;
  tailoring_quality?: JdTailoringQuality;
  introduction_quality?: JdIntroQuality;
  technology_inventory?: {
    jd_matched?: string[];
    equivalent_to_jd?: string[];
    other_mentioned?: string[];
  };
  strongest_points?: string[];
  critical_gaps?: Array<{
    topic?: string;
    importance?: string;
    status?: string;
    what_is_missing?: string;
    why_it_matters_for_this_role?: string;
    suggested_addition?: string;
  }>;
  priority_improvements?: Array<{
    priority?: number;
    topic?: string;
    guidance?: string;
    example?: string;
  }>;
  suggested_opening?: JdSuggestedOpening;
  final_assessment?: JdFinalAssessment;
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
  candidate_name?: string | null;
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
    technologies_mentioned?: string[];
    concepts?: Record<string, string>;
  }[];

  // ── Technology inventory (from technology_inventory) ──
  technology_inventory?: Record<string, string[]>;

  // ── Strongest points and critical gaps from intro ──
  strongest_points: string[];
  critical_gaps: {
    topic?: string;
    importance?: string;
    status?: string;
    what_is_missing?: string;
    why_it_matters?: string;
    why_it_matters_for_this_role?: string;
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

  // ── Backend-determined content sufficiency ──────────────────────────────────
  // TRUE when the backend says there wasn't enough spoken content to evaluate.
  // The frontend MUST NOT calculate this — only consume it.
  insufficient_content: boolean;

  // ── Consent — what the candidate agreed to retain ────────────────────────────
  // Controls visibility of recording and transcript sections on the eval page.
  // Populated from the backend response when available; defaults to permissive
  // so that existing reports without consent data still show everything.
  consent: {
    /** Whether the candidate consented to retain the recording for playback */
    save_recording: boolean;
    /** Whether the candidate consented to retain the transcript for display */
    save_transcript: boolean;
  };

  // ── JD Intro Walkthrough Evaluation ──
  is_jd_intro?: boolean;
  jd_evaluation?: JdIntroEvaluation;
  jd_validation?: JdValidation;
  jd_alignment?: string; // "STRONG_FIT" | "GOOD_FIT" | "PARTIAL_FIT" | "WEAK_FIT"
  jd_analysis?: JdAnalysis;
  requirement_coverage?: JdRequirementCoverageItem[];
  role_alignment?: JdRoleAlignment;
  career_story?: JdCareerStory;
  current_role_and_project?: JdCurrentRoleAndProject;
  jd_technical_alignment?: JdTechnicalAlignment;
  value_proposition?: JdValueProposition;
  tailoring_quality?: JdTailoringQuality;
  suggested_opening?: JdSuggestedOpening;
  jd_final_assessment?: JdFinalAssessment;
}

// ─── Normalization ────────────────────────────────────────────────────────────

function parseTranscript(raw: unknown): NormalizedReport["transcript"] {
  const rec = asRecord(raw);
  let full_text = asStr(rec.full_text) ?? asStr(rec.text) ?? asStr(rec.transcript_text);
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

  // If full_text is missing or fragmented, construct a cohesive paragraph from segments
  if (!full_text && segments.length > 0) {
    full_text = segments.map((s) => s.text).join(" ");
  }

  // Clean speech artifacts, </S>, repetitive candidate prefixes, and double spaces into a continuous paragraph
  if (full_text) {
    full_text = full_text
      .replace(/<\/?s>/gi, "")
      .replace(/(?:^|\n|\r)\s*(?:Candidate|Speaker\s*\d*):\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return { full_text, segments };
}

function parseAudio(raw: unknown): NormalizedReport["audio"] | undefined {
  const outer = asRecord(raw);
  // unwrap nested audio_evaluation if present
  const src = Object.keys(nested(outer, "audio_evaluation")).length
    ? nested(outer, "audio_evaluation")
    : outer;
  if (!Object.keys(src).length) return undefined;

  // Support direct flat LLM response schema: { coherence, clarity, fluency, confidence, pace, volume, professionalism }
  if (!src.factors && (src.coherence || src.clarity || src.fluency || src.confidence || src.pace || src.volume || src.professionalism)) {
    return {
      overall_readiness: asStr(src.overall_readiness),
      executive_summary: asStr(src.professionalism) ?? asStr(src.coherence),
      primary_vocal_strength: asStr(src.primary_vocal_strength) ?? null,
      primary_vocal_gap: asStr(src.primary_vocal_gap) ?? null,
      factors: {
        confidence_vocal_presence: src.confidence ? { observation: asStr(src.confidence) } : undefined,
        fluency: src.fluency ? { observation: asStr(src.fluency) } : undefined,
        pace: src.pace ? { observation: asStr(src.pace) } : undefined,
        volume: src.volume ? { observation: asStr(src.volume) } : undefined,
      },
      key_findings: [],
    };
  }

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

  // Support direct flat LLM response schema: { eye_contact, facial_engagement, posture, expression_variety, distraction }
  if (!src.factors && (src.eye_contact || src.posture || src.facial_engagement || src.distraction || src.expression_variety)) {
    return {
      overall_summary: asStr(src.overall_summary),
      primary_setup_strength: asStr(src.primary_setup_strength) ?? null,
      primary_setup_gap: asStr(src.primary_setup_gap) ?? null,
      factors: {
        camera_framing_centering: src.posture ? { observation: asStr(src.posture) } : undefined,
        camera_angle_gaze_alignment: src.eye_contact ? { observation: asStr(src.eye_contact) } : undefined,
        off_screen_gaze_duration: src.distraction ? { observation: asStr(src.distraction) } : undefined,
      },
      key_findings: [],
    };
  }

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
  introduced_self: "Introduction",
  career_arc_covered: "Career Arc",
  ml_to_ai_transition_covered: "ML to AI Transition",
  current_role_and_responsibilities: "Current Role & Scope",
  team_and_company_mentioned: "Team & Company Context",
  ai_agents_multiagent_mentioned: "Agentic AI & Orchestration",
  mcp_mentioned: "MCP & Tool Calling",
  memory_context_engineering_mentioned: "Memory & Context Engineering",
  guardrails_evals_observability_mentioned: "Guardrails & Evals",
  rag_retrieval_chunking_mentioned: "RAG & Retrieval",
};

// Keys to skip when iterating intro_evaluation sections
const SKIP_KEYS = new Set([
  "overall_assessment", "strongest_points", "critical_gaps",
  "priority_improvements", "final_assessment", "technology_inventory",
  "introduction_quality", "jd_validation", "jd_analysis",
  "requirement_coverage", "suggested_opening",
]);

export function normalizeReport(
  assessment: AssessmentDetail,
  data?: AssessmentDataResponse | null,
  apiReport?: AssessmentReportResponse | null,
): NormalizedReport {
  // ── Resolve report columns ───────────────────────────────────────────────
  const bundled = asRecord(assessment.report);

  // Fallback to report_data if top-level fields aren't separately keyed
  const repData = asRecord(apiReport?.report_data ?? bundled.report_data);

  const rawAudio = asRecord(
    apiReport?.audio_evaluation ??
    bundled.audio_evaluation ??
    bundled.audio ??
    nested(repData, "audio_evaluation")
  );

  const rawVideo = asRecord(
    apiReport?.video_evaluation ??
    bundled.video_evaluation ??
    bundled.video ??
    nested(repData, "video_evaluation")
  );

  const rawTxEval = asRecord(
    apiReport?.transcript_evaluation ??
    bundled.transcript_evaluation ??
    (Object.keys(nested(repData, "transcript_evaluation")).length
      ? nested(repData, "transcript_evaluation")
      : Object.keys(repData).length
        ? repData
        : {})
  );

  const txEval = asRecord(rawTxEval);

  // Resolve intro_evaluation — it may be directly in transcript_evaluation, report_data, or bundled.general
  const genEval = asRecord(bundled.general);

  // Check for JD Intro Evaluation in multiple locations
  const rawJdIntro =
    nested(txEval, "jd_intro_evaluation") && Object.keys(nested(txEval, "jd_intro_evaluation")).length
      ? nested(txEval, "jd_intro_evaluation")
      : Object.keys(nested(bundled, "jd_intro_evaluation")).length
        ? nested(bundled, "jd_intro_evaluation")
        : Object.keys(nested(repData, "jd_intro_evaluation")).length
          ? nested(repData, "jd_intro_evaluation")
          : (genEval.jd_analysis || genEval.requirement_coverage || genEval.jd_validation)
            ? genEval
            : null;

  const isJdIntro = Boolean(
    rawJdIntro ||
    assessment.assessment_type === "JD_INTRO" ||
    (bundled.general && Boolean((bundled.general as any).requirement_coverage))
  );

  let jdVal: JdValidation | undefined;
  let jdAnalysis: JdAnalysis | undefined;
  let reqCoverage: JdRequirementCoverageItem[] | undefined;
  let roleAlign: JdRoleAlignment | undefined;
  let careerStory: JdCareerStory | undefined;
  let currentRoleProj: JdCurrentRoleAndProject | undefined;
  let jdTechAlign: JdTechnicalAlignment | undefined;
  let valueProp: JdValueProposition | undefined;
  let tailoringQual: JdTailoringQuality | undefined;
  let suggestedOpening: JdSuggestedOpening | undefined;
  let jdFinalAssessment: JdFinalAssessment | undefined;
  let jdAlignment: string | undefined;

  if (rawJdIntro) {
    const rawVal = asRecord(rawJdIntro.jd_validation);
    if (Object.keys(rawVal).length) {
      jdVal = {
        status: asStr(rawVal.status),
        reason: asStr(rawVal.reason),
      };
    }

    const rawAnalysis = asRecord(rawJdIntro.jd_analysis);
    if (Object.keys(rawAnalysis).length) {
      const ts = asRecord(rawAnalysis.tech_stack);
      const parsedTechStack: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(ts)) {
        parsedTechStack[k] = asStrArray(v);
      }
      jdAnalysis = {
        role_title: asStr(rawAnalysis.role_title),
        seniority_level: asStr(rawAnalysis.seniority_level),
        domain: asStr(rawAnalysis.domain),
        core_responsibilities: asStrArray(rawAnalysis.core_responsibilities),
        must_have_requirements: asStrArray(rawAnalysis.must_have_requirements),
        nice_to_have_requirements: asStrArray(rawAnalysis.nice_to_have_requirements),
        tech_stack: parsedTechStack,
        soft_skills_and_ownership: asStrArray(rawAnalysis.soft_skills_and_ownership),
      };
    }

    const rawReqCov = Array.isArray(rawJdIntro.requirement_coverage) ? rawJdIntro.requirement_coverage : [];
    if (rawReqCov.length > 0) {
      reqCoverage = rawReqCov.map((item: unknown) => {
        const rc = asRecord(item);
        return {
          requirement: asStr(rc.requirement) || "Requirement",
          category: asStr(rc.category),
          importance: asStr(rc.importance),
          status: asStr(rc.status) || "NOT_MENTIONED",
          match_type: asStr(rc.match_type),
          evidence: asStr(rc.evidence) ?? null,
          note: asStr(rc.note),
        };
      });
    }

    const rawRoleAlign = asRecord(rawJdIntro.role_alignment);
    if (Object.keys(rawRoleAlign).length) {
      roleAlign = {
        overall_status: asStr(rawRoleAlign.overall_status),
        role_relevance: asStr(rawRoleAlign.role_relevance),
        responsibilities_alignment: asStr(rawRoleAlign.responsibilities_alignment),
        seniority_match: asStr(rawRoleAlign.seniority_match),
        domain_fit: asStr(rawRoleAlign.domain_fit),
        observation: asStr(rawRoleAlign.observation),
        evidence: asStrArray(rawRoleAlign.evidence),
      };
    }

    const rawCareerStory = asRecord(rawJdIntro.career_story);
    if (Object.keys(rawCareerStory).length) {
      careerStory = {
        overall_status: asStr(rawCareerStory.overall_status),
        timeline: asStr(rawCareerStory.timeline),
        roles: asStr(rawCareerStory.roles),
        career_transitions: asStr(rawCareerStory.career_transitions),
        leads_logically_to_target_role: asStr(rawCareerStory.leads_logically_to_target_role),
        transitions_identified: asStrArray(rawCareerStory.transitions_identified),
        observation: asStr(rawCareerStory.observation),
        evidence: asStrArray(rawCareerStory.evidence),
      };
    }

    const rawCurrentRoleProj = asRecord(rawJdIntro.current_role_and_project);
    if (Object.keys(rawCurrentRoleProj).length) {
      currentRoleProj = {
        overall_status: asStr(rawCurrentRoleProj.overall_status),
        current_role: asStr(rawCurrentRoleProj.current_role),
        responsibilities: asStr(rawCurrentRoleProj.responsibilities),
        technical_ownership: asStr(rawCurrentRoleProj.technical_ownership),
        project_explained: asStr(rawCurrentRoleProj.project_explained),
        application_purpose: asStr(rawCurrentRoleProj.application_purpose),
        users_or_customers: asStr(rawCurrentRoleProj.users_or_customers),
        business_problem: asStr(rawCurrentRoleProj.business_problem),
        personal_contribution: asStr(rawCurrentRoleProj.personal_contribution),
        relevance_to_jd: asStr(rawCurrentRoleProj.relevance_to_jd),
        observation: asStr(rawCurrentRoleProj.observation),
        evidence: asStrArray(rawCurrentRoleProj.evidence),
      };
    }

    const rawTechAlign = asRecord(rawJdIntro.technical_alignment);
    if (Object.keys(rawTechAlign).length) {
      jdTechAlign = {
        overall_status: asStr(rawTechAlign.overall_status),
        core_stack_alignment: asStr(rawTechAlign.core_stack_alignment),
        architecture_and_design_depth: asStr(rawTechAlign.architecture_and_design_depth),
        production_and_deployment: asStr(rawTechAlign.production_and_deployment),
        scale_and_performance: asStr(rawTechAlign.scale_and_performance),
        technologies_matching_jd: asStrArray(rawTechAlign.technologies_matching_jd),
        equivalent_technologies: asStrArray(rawTechAlign.equivalent_technologies),
        jd_technologies_not_mentioned: asStrArray(rawTechAlign.jd_technologies_not_mentioned),
        other_technologies_mentioned: asStrArray(rawTechAlign.other_technologies_mentioned),
        observation: asStr(rawTechAlign.observation),
        evidence: asStrArray(rawTechAlign.evidence),
      };
    }

    const rawValProp = asRecord(rawJdIntro.value_proposition);
    if (Object.keys(rawValProp).length) {
      valueProp = {
        overall_status: asStr(rawValProp.overall_status),
        why_this_role: asStr(rawValProp.why_this_role),
        impact_and_outcomes: asStr(rawValProp.impact_and_outcomes),
        differentiators: asStrArray(rawValProp.differentiators),
        observation: asStr(rawValProp.observation),
        evidence: asStrArray(rawValProp.evidence),
      };
    }

    const rawTailoring = asRecord(rawJdIntro.tailoring_quality);
    if (Object.keys(rawTailoring).length) {
      tailoringQual = {
        tailored_to_role: asStr(rawTailoring.tailored_to_role),
        relevant_experience_prioritized: asStr(rawTailoring.relevant_experience_prioritized),
        irrelevant_content_ratio: asStr(rawTailoring.irrelevant_content_ratio),
        gap_bridging: asStr(rawTailoring.gap_bridging),
        observation: asStr(rawTailoring.observation),
        evidence: asStrArray(rawTailoring.evidence),
      };
    }

    const rawSuggOpen = asRecord(rawJdIntro.suggested_opening);
    if (Object.keys(rawSuggOpen).length) {
      suggestedOpening = {
        note: asStr(rawSuggOpen.note),
        example: asStr(rawSuggOpen.example),
      };
    }

    const rawJdFA = asRecord(rawJdIntro.final_assessment);
    if (Object.keys(rawJdFA).length) {
      jdFinalAssessment = {
        jd_fit_summary: asStr(rawJdFA.jd_fit_summary),
        career_story_relevance: asStr(rawJdFA.career_story_relevance),
        current_project_clarity: asStr(rawJdFA.current_project_clarity),
        technical_alignment_depth: asStr(rawJdFA.technical_alignment_depth),
        seniority_match: asStr(rawJdFA.seniority_match),
        most_important_improvement: asStr(rawJdFA.most_important_improvement),
      };
    }

    const rawJdOA = asRecord(rawJdIntro.overall_assessment);
    jdAlignment = asStr(rawJdOA.jd_alignment);
  }

  const introEval = Object.keys(nested(txEval, "intro_evaluation")).length
    ? nested(txEval, "intro_evaluation")
    : rawJdIntro
      ? rawJdIntro
      : Object.keys(genEval).length
        ? genEval
        : txEval;

  const rawOA = asRecord(rawJdIntro?.overall_assessment ?? introEval.overall_assessment);
  const overallAssessment = {
    readiness: asStr(bundled.readiness) ?? asStr(rawOA.readiness) ?? asStr(bundled.overall_readiness),
    summary: asStr(bundled.summary) ?? asStr(rawOA.summary) ?? asStr(bundled.overall_summary),
    strongest_signal: asStr(bundled.strongest_signal) ?? asStr(rawOA.strongest_signal) ?? asStr(bundled.overall_strongest_signal),
    biggest_gap: asStr(bundled.biggest_gap) ?? asStr(rawOA.biggest_gap) ?? asStr(bundled.overall_biggest_gap),
  } as IntroOverallAssessment;

  // ── Scores breakdown ─────────────────────────────────────────────────────
  const scoresRaw = asRecord(txEval.scores_breakdown_json ?? repData.scores_breakdown_json);
  const parseScore = (key: string) => {
    const s = asRecord(scoresRaw[key]);
    return Object.keys(s).length ? { band: asStr(s.band) } : undefined;
  };

  // ── Intro quality ────────────────────────────────────────────────────────
  const bundledLangIQ = asRecord(asRecord(bundled.language).introduction_quality);
  const iq = bundled.introduction_quality
    ? asRecord(bundled.introduction_quality)
    : Object.keys(bundledLangIQ).length > 0
      ? bundledLangIQ
      : introEval.introduction_quality
        ? asRecord(introEval.introduction_quality)
        : null;

  const intro_quality = iq && Object.keys(iq).length ? {
    clarity: asStr(iq.clarity),
    coherence: asStr(iq.coherence),
    technical_depth: asStr(iq.technical_depth),
    business_context: asStr(iq.business_context),
    personal_ownership: asStr(iq.personal_ownership),
    buzzword_density: asStr(iq.buzzword_density),
    observation: asStr(iq.observation),
  } : undefined;

  // ── Resume alignment ─────────────────────────────────────────────────────
  const ra = asRecord(txEval.resume_alignment ?? repData.resume_alignment);
  const resume_alignment = Object.keys(ra).length ? {
    band: asStr(ra.band),
    missed_highlights: asStrArray(ra.missed_highlights),
    unverified_claims: asStrArray(ra.unverified_claims),
  } : undefined;

  // ── Technical analysis ───────────────────────────────────────────────────


  // ── Non-technical analysis ───────────────────────────────────────────────
  const nt = asRecord(txEval.non_technical_analysis_json ?? repData.non_technical_analysis_json);
  const non_technical = Object.keys(nt).length ? {
    communication_summary: asStr(nt.communication_summary),
    structure_quality: asStr(nt.structure_quality),
    confidence_notes: asStr(nt.confidence_notes),
  } : undefined;

  // ── Intro section items ──────────────────────────────────────────────────
  type IntroSection = NormalizedReport["intro_sections"][number];

  const intro_sections: IntroSection[] = Object.entries(introEval)
    .filter(([key]) => !SKIP_KEYS.has(key) && !key.startsWith("_") && key !== "checklist_verification")
    .flatMap(([key, value]): IntroSection[] => {
      const sec = asRecord(value);
      const observation = asStr(sec.observation) ?? asStr(sec.summary);
      const status = asStr(sec.overall_status) ?? asStr(sec.status) ?? asStr(sec.readiness);
      const rawConcepts = asRecord(sec.concepts);
      const concepts: Record<string, string> = {};
      for (const [ck, cv] of Object.entries(rawConcepts)) {
        const val = asStr(cv);
        if (val) concepts[ck] = val;
      }
      // Also pick up top-level concept statuses (e.g. cicd_and_delivery fields)
      for (const [ck, cv] of Object.entries(sec)) {
        if (
          typeof cv === "string" &&
          ["COVERED", "PARTIAL", "NOT_MENTIONED", "NOT_APPLICABLE", "STRONG", "GOOD", "WEAK", "MISSING"].includes(cv.toUpperCase().trim())
        ) {
          if (ck !== "overall_status" && ck !== "status" && ck !== "readiness" && !concepts[ck]) {
            concepts[ck] = cv;
          }
        }
      }
      const techList = Array.from(new Set([
        ...asStrArray(sec.technologies_mentioned),
        ...asStrArray(sec.technologies),
        ...asStrArray(sec.tools_mentioned),
        ...asStrArray(sec.tools),
        ...asStrArray(sec.frameworks_mentioned),
        ...asStrArray(sec.models_mentioned),
        ...asStrArray(sec.model_platforms_mentioned),
        ...asStrArray(sec.patterns_mentioned),
        ...asStrArray(sec.cloud_providers),
        ...asStrArray(sec.compute_services),
        ...asStrArray(sec.container_platforms),
        ...asStrArray(sec.storage_services),
        ...asStrArray(sec.ai_cloud_services),
        ...asStrArray(sec.infrastructure_tools),
        ...asStrArray(sec.cicd_tools),
        ...asStrArray(sec.cloud_services),
        ...asStrArray(sec.stages_mentioned),
      ])).filter(Boolean);

      if (!observation && !status && Object.keys(concepts).length === 0 && techList.length === 0) return [];

      return [{
        key,
        title: SECTION_LABEL[key] ?? key.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
        status: status ?? undefined,
        observation: observation ?? undefined,
        evidence: asStrArray(sec.evidence),
        technologies_mentioned: techList.length > 0 ? techList : undefined,
        concepts: Object.keys(concepts).length > 0 ? concepts : undefined,
      }];
    });

  // Also extract from checklist_verification if available
  const checklist = asRecord(txEval.checklist_verification ?? repData.checklist_verification);
  if (Object.keys(checklist).length > 0) {
    for (const [k, v] of Object.entries(checklist)) {
      const item = asRecord(v);
      const status = asStr(item.status) ?? (typeof item.covered === "boolean" ? (item.covered ? "COVERED" : "NOT_MENTIONED") : undefined);
      const observation = asStr(item.observation) || "";
      const title = SECTION_LABEL[k] ?? k.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase());
      intro_sections.push({
        key: k,
        title,
        status: status ?? undefined,
        observation: observation || undefined,
        evidence: asStrArray(item.evidence),
      });
    }
  }

  // ── Technology inventory ─────────────────────────────────────────────────
  const tiRaw = asRecord(introEval.technology_inventory ?? bundled.technology_inventory ?? genEval.technology_inventory ?? repData.technology_inventory);
  const technology_inventory: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(tiRaw)) {
    const arr = asStrArray(v);
    if (arr.length > 0) technology_inventory[k] = arr;
  }

  // ── Critical gaps & improvements ─────────────────────────────────────────
  const cgRaw = Array.isArray(rawJdIntro?.critical_gaps)
    ? rawJdIntro.critical_gaps
    : Array.isArray(introEval.critical_gaps)
      ? introEval.critical_gaps
      : Array.isArray(bundled.critical_gaps)
        ? bundled.critical_gaps
        : Array.isArray(genEval.critical_gaps)
          ? genEval.critical_gaps
          : [];

  const critical_gaps = cgRaw.map((g: unknown) => {
    const gap = asRecord(g);
    return {
      topic: asStr(gap.topic),
      importance: asStr(gap.importance),
      status: asStr(gap.status),
      what_is_missing: asStr(gap.what_is_missing),
      why_it_matters: asStr(gap.why_it_matters) ?? asStr(gap.why_it_matters_for_this_role),
      why_it_matters_for_this_role: asStr(gap.why_it_matters_for_this_role) ?? asStr(gap.why_it_matters),
      suggested_addition: asStr(gap.suggested_addition),
    };
  });

  const piRaw = Array.isArray(introEval.priority_improvements)
    ? introEval.priority_improvements
    : Array.isArray(bundled.priority_improvements)
      ? bundled.priority_improvements
      : Array.isArray(genEval.priority_improvements)
        ? genEval.priority_improvements
        : [];

  const priority_improvements = piRaw.map((p: unknown) => {
    const imp = asRecord(p);
    return {
      priority: typeof imp.priority === "number" ? imp.priority : undefined,
      topic: asStr(imp.topic),
      guidance: asStr(imp.guidance),
      example: asStr(imp.example),
    };
  });

  const fa = asRecord(introEval.final_assessment ?? bundled.final_assessment ?? genEval.final_assessment);
  const final_assessment = Object.keys(fa).length ? {
    career_story: asStr(fa.career_story) ?? asStr(asRecord(genEval.career_story).observation),
    current_project_clarity: asStr(fa.current_project_clarity) ?? asStr(asRecord(genEval.current_project_clarity).observation) ?? asStr(asRecord(genEval.current_project).observation),
    ai_engineering_depth: asStr(fa.ai_engineering_depth) ?? asStr(genEval.ai_engineering_depth),
    production_engineering_depth: asStr(fa.production_engineering_depth) ?? asStr(genEval.production_engineering_depth) ?? asStr(genEval.software_engineering_depth),
    transition_quality: asStr(fa.transition_quality) ?? asStr(genEval.transition_quality),
    most_important_improvement: asStr(fa.most_important_improvement) ?? asStr(genEval.most_important_improvement),
  } : undefined;


  // ── Technical analysis (with fallbacks for intro & task evaluations) ──────
  const ta = asRecord(txEval.technical_analysis_json ?? repData.technical_analysis_json);
  const taSummary =
    asStr(ta.summary) ??
    asStr(overallAssessment.summary) ??
    asStr(introEval.observation) ??
    asStr(nt.communication_summary);
  const taStrengths =
    asStrArray(ta.strengths).length > 0
      ? asStrArray(ta.strengths)
      : asStrArray(introEval.strongest_points).length > 0
        ? asStrArray(introEval.strongest_points)
        : (overallAssessment.strongest_signal ? [overallAssessment.strongest_signal] : []);
  const taImprovements =
    asStrArray(ta.areas_for_improvement).length > 0
      ? asStrArray(ta.areas_for_improvement)
      : priority_improvements.length > 0
        ? priority_improvements
            .map((p) => (p.topic ? `${p.topic}: ${p.guidance || ""}`.trim() : p.guidance || ""))
            .filter(Boolean)
        : critical_gaps.length > 0
          ? critical_gaps
              .map((g) => (g.topic ? `${g.topic}: ${g.what_is_missing || g.why_it_matters || ""}`.trim() : g.what_is_missing || ""))
              .filter(Boolean)
          : (overallAssessment.biggest_gap ? [overallAssessment.biggest_gap] : []);
  const taDepth =
    asStr(ta.depth_assessment) ??
    asStr(final_assessment?.ai_engineering_depth) ??
    asStr(final_assessment?.production_engineering_depth) ??
    (intro_quality?.technical_depth ? `Technical depth: ${intro_quality.technical_depth}` : undefined);

  const technical_analysis =
    Object.keys(ta).length || taSummary || taStrengths.length > 0 || taImprovements.length > 0
      ? {
          summary: taSummary,
          strengths: taStrengths,
          areas_for_improvement: taImprovements,
          depth_assessment: taDepth,
        }
      : undefined;

  // ── Improvements ─────────────────────────────────────────────────────────
  const rawImprovements = txEval.improvements_json ?? repData.improvements_json;
  const improvements: ImprovementItem[] = Array.isArray(rawImprovements)
    ? rawImprovements.map((i: unknown) => {
        const imp = asRecord(i);
        return {
          priority: typeof imp.priority === "number" ? imp.priority : undefined,
          topic: asStr(imp.topic),
          effort: asStr(imp.effort),
          rationale: asStr(imp.rationale),
        };
      })
    : [];

  // ── Coaching suggestions (with fallbacks for completed evaluations) ──────
  const rawCoaching = txEval.coaching_suggestions_json ?? repData.coaching_suggestions_json;
  let coaching_suggestions: CoachingSuggestion[] = Array.isArray(rawCoaching)
    ? rawCoaching.map((c: unknown) => {
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

  if (coaching_suggestions.length === 0) {
    if (priority_improvements.length > 0) {
      coaching_suggestions = priority_improvements.map((p, idx) => ({
        priority: typeof p.priority === "number" ? p.priority : idx + 1,
        dimension: "Delivery & Structure",
        area: p.topic || `Priority ${idx + 1}`,
        suggestion: [p.guidance, p.example ? `Example: ${p.example}` : ""].filter(Boolean).join(" "),
        evidence: p.example,
      }));
    } else if (critical_gaps.length > 0) {
      coaching_suggestions = critical_gaps.map((g, idx) => ({
        priority: idx + 1,
        dimension: "Content Coverage",
        area: g.topic || `Focus Area ${idx + 1}`,
        suggestion: [g.what_is_missing, g.suggested_addition ? `Recommendation: ${g.suggested_addition}` : ""].filter(Boolean).join(" ") || "Improve coverage and depth.",
        evidence: g.why_it_matters,
      }));
    } else if (improvements.length > 0) {
      coaching_suggestions = improvements.map((imp, idx) => ({
        priority: typeof imp.priority === "number" ? imp.priority : idx + 1,
        dimension: "Interview Performance",
        area: imp.topic || `Recommendation ${idx + 1}`,
        suggestion: imp.rationale || "",
        evidence: imp.effort ? `Estimated effort: ${imp.effort}` : undefined,
      }));
    } else if (final_assessment?.most_important_improvement) {
      coaching_suggestions = [
        {
          priority: 1,
          dimension: "Core Focus",
          area: "Primary Improvement",
          suggestion: final_assessment.most_important_improvement,
        },
      ];
    }
  }

  // ── Gaps to validate (with fallbacks) ─────────────────────────────────────
  const rawGaps = txEval.gaps_to_validate_json ?? repData.gaps_to_validate_json;
  let gaps_to_validate: GapItem[] = Array.isArray(rawGaps)
    ? rawGaps.map((g: unknown) => {
        const gap = asRecord(g);
        return { topic: asStr(gap.topic), reason: asStr(gap.reason) };
      })
    : [];

  if (gaps_to_validate.length === 0) {
    if (critical_gaps.length > 0) {
      gaps_to_validate = critical_gaps.map((g) => ({
        topic: g.topic || "Validation Topic",
        reason: g.what_is_missing || g.why_it_matters || g.suggested_addition || "Candidate should elaborate on this in follow-up.",
      }));
    } else {
      const partials = intro_sections.filter((s) => s.status && s.status !== "COVERED");
      if (partials.length > 0) {
        gaps_to_validate = partials.map((s) => ({
          topic: s.title,
          reason: s.observation || "Not fully covered during delivery.",
        }));
      }
    }
  }

  // ── Transcript evidence ───────────────────────────────────────────────────
  const rawEvidence = txEval.transcript_evidence_json ?? repData.transcript_evidence_json;
  const transcript_evidence: TranscriptEvidence[] = Array.isArray(rawEvidence)
    ? rawEvidence.map((e: unknown) => {
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
  const rawTranscript = data?.transcript ?? asRecord(assessment.data).transcript;
  const transcript = parseTranscript(rawTranscript);

  // ── insufficient_content ─────────────────────────────────────────────────
  // Never calculated here — only read from backend.
  // Sources: report.insufficient_content, data.insufficient_content, txEval.insufficient_content
  const insufficientContent: boolean = Boolean(
    (apiReport as any)?.insufficient_content ??
    (apiReport as any)?.assessment_eval?.insufficient_content ??
    (assessment as any)?.insufficient_content ??
    (assessment as any)?.data?.insufficient_content ??
    (assessment as any)?.data?.assessment_eval?.insufficient_content ??
    (data as any)?.insufficient_content ??
    (data as any)?.assessment_eval?.insufficient_content ??
    txEval.insufficient_content ??
    false
  );

  // ── Consent ──────────────────────────────────────────────────────────────
  // Read from backend consent fields. Default to permissive (true) so that
  // existing reports without consent metadata still display everything.
  const rawConsent = asRecord(
    (assessment as any)?.consent ??
    asRecord(assessment.data).consent ??
    (data as any)?.consent ??
    (apiReport as any)?.consent ??
    {}
  );
  const consentSaveRecording: boolean =
    typeof rawConsent.save_recording === "boolean"
      ? rawConsent.save_recording
      : typeof (assessment as any).save_recording === "boolean"
        ? (assessment as any).save_recording
        : true;
  const consentSaveTranscript: boolean =
    typeof rawConsent.save_transcript === "boolean"
      ? rawConsent.save_transcript
      : typeof (assessment as any).save_transcript === "boolean"
        ? (assessment as any).save_transcript
        : true;

  const overallReadiness =
    asStr(scoresRaw.overall_band) ??
    asStr(overallAssessment.readiness);

  const overallSummary =
    asStr(overallAssessment.summary) ??
    asStr(technical_analysis?.summary) ??
    asStr(repData.overall_summary) ??
    asStr(bundled.overall_summary) ??
    asStr(txEval.summary) ??
    asStr(txEval.overall_summary) ??
    asStr(introEval.observation) ??
    asStr(intro_quality?.observation) ??
    asStr(non_technical?.communication_summary) ??
    asStr(final_assessment?.most_important_improvement);

  const resolvedMediaUrl =
    assessment.youtube_url?.trim() ||
    (apiReport as any)?.youtube_url?.trim() ||
    (apiReport as any)?.recording_url?.trim() ||
    (apiReport as any)?.video_url?.trim() ||
    (data as any)?.youtube_url?.trim() ||
    (data as any)?.recording_url?.trim() ||
    (data as any)?.video_url?.trim() ||
    (assessment as any)?.video_url?.trim() ||
    (assessment as any)?.recording_url?.trim() ||
    (assessment as any)?.media_url?.trim() ||
    null;

  const rawMediaType = (
    assessment.media_type ||
    (data as any)?.media_type ||
    (data as any)?.assessment?.media_type ||
    (apiReport as any)?.media_type ||
    (apiReport as any)?.assessment?.media_type ||
    (Object.keys(rawVideo).length > 0 ? "VIDEO" : "") ||
    (resolvedMediaUrl ? "VIDEO" : "") ||
    "AUDIO"
  ).toUpperCase();

  const normalizedMediaType =
    rawMediaType.includes("VIDEO") || rawMediaType === "VIDEO_AUDIO" || rawMediaType === "AUDIO_VIDEO"
      ? "VIDEO"
      : "AUDIO";

  const resolvedCandidateName =
    assessment.candidate_name ||
    (assessment as any)?.candidate_name ||
    (assessment as any)?.candidate_full_name ||
    (assessment as any)?.candidate?.full_name ||
    (assessment as any)?.candidate?.name ||
    (data as any)?.candidate_name ||
    (data as any)?.candidate?.full_name ||
    (data as any)?.assessment?.candidate_name ||
    (data as any)?.assessment?.candidate?.full_name ||
    (apiReport as any)?.candidate_name ||
    (apiReport as any)?.candidate?.full_name ||
    null;

  const normalizedAssessment = {
    ...assessment,
    candidate_name: resolvedCandidateName,
    media_type: normalizedMediaType,
    youtube_url: resolvedMediaUrl,
  };

  return {
    assessment: normalizedAssessment,
    candidate_name: resolvedCandidateName,
    youtube_url: resolvedMediaUrl,
    overall_readiness: overallReadiness,
    overall_summary: overallSummary,
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
    technology_inventory: Object.keys(technology_inventory).length > 0 ? technology_inventory : undefined,
    strongest_points: asStrArray(rawJdIntro?.strongest_points ?? introEval.strongest_points ?? bundled.strongest_points ?? genEval.strongest_points),
    is_jd_intro: isJdIntro,
    jd_evaluation: rawJdIntro ? (rawJdIntro as JdIntroEvaluation) : undefined,
    jd_validation: jdVal,
    jd_alignment: jdAlignment,
    jd_analysis: jdAnalysis,
    requirement_coverage: reqCoverage,
    role_alignment: roleAlign,
    career_story: careerStory,
    current_role_and_project: currentRoleProj,
    jd_technical_alignment: jdTechAlign,
    value_proposition: valueProp,
    tailoring_quality: tailoringQual,
    suggested_opening: suggestedOpening,
    jd_final_assessment: jdFinalAssessment,
    critical_gaps,
    priority_improvements,
    final_assessment,
    audio: parseAudio(rawAudio),
    video: parseVideo(rawVideo),
    coaching_suggestions,
    improvements,
    gaps_to_validate,
    transcript: consentSaveTranscript ? transcript : { full_text: "", segments: [] },
    transcript_evidence: consentSaveTranscript ? transcript_evidence : [],
    insufficient_content: insufficientContent,
    consent: {
      save_recording: consentSaveRecording,
      save_transcript: consentSaveTranscript,
    },
  };
}

