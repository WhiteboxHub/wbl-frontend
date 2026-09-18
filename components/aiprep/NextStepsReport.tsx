"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Compass,
  Milestone,
  RotateCcw,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { type NormalizedReport } from "@/types/aiprep-report";

interface Props {
  report: NormalizedReport;
}

// ── Centralized Performance Tiers (Section 2 & 7) ───────────────────────────
export type PerformanceTier = "GOOD" | "AVERAGE" | "LOW";

export const PERFORMANCE_THRESHOLDS = {
  GOOD_MIN_SCORE: 75,
  AVERAGE_MIN_SCORE: 50,
} as const;

/**
 * Derives the internal performance tier from existing report data.
 * Score is used ONLY internally and is NEVER displayed to the candidate.
 */
export function getPerformanceTier(report: NormalizedReport): PerformanceTier {
  // 1. Check numeric overall score if already present
  const rAny = report as any;
  const assessment = rAny.assessment ?? {};
  const rep = assessment.report ?? {};
  const repData = rep.report_data ?? assessment.report_data ?? {};
  const txEval = rep.transcript_evaluation ?? repData.transcript_evaluation ?? {};
  const sb = txEval.scores_breakdown_json ?? rep.scores_breakdown_json ?? repData.scores_breakdown_json ?? {};

  let score: number | null = null;
  if (typeof sb.overall_score === "number") score = sb.overall_score;
  else if (typeof assessment.overall_score === "number") score = assessment.overall_score;
  else if (typeof rAny.overall_score === "number") score = rAny.overall_score;

  if (score !== null) {
    if (score >= PERFORMANCE_THRESHOLDS.GOOD_MIN_SCORE) return "GOOD";
    if (score >= PERFORMANCE_THRESHOLDS.AVERAGE_MIN_SCORE) return "AVERAGE";
    return "LOW";
  }

  // 2. Prefer existing normalized qualitative band
  const rawBand = (
    report.scores?.overall_band ||
    report.overall_readiness ||
    ""
  ).toUpperCase();

  if (["EXCELLENT", "STRONG", "GOOD", "ADVANCED", "HIGH"].includes(rawBand)) {
    return "GOOD";
  }
  if (["NEEDS_WORK", "WEAK", "POOR", "LOW"].includes(rawBand)) {
    return "LOW";
  }
  if (["DEVELOPING", "ADEQUATE", "NEEDS_POLISH", "AVERAGE", "MEDIUM"].includes(rawBand)) {
    return "AVERAGE";
  }

  return "AVERAGE";
}

/**
 * Friendly English sanitizer (Section 10).
 * Converts robotic/negative terms into constructive, encouraging language.
 */
export function toFriendlyText(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/critical knowledge deficiencies/gi, "topics to strengthen")
    .replace(/critical knowledge deficiency/gi, "topic to strengthen")
    .replace(/poor communication performance/gi, "opportunity to build communication confidence")
    .replace(/major improvement required/gi, "key area to develop")
    .replace(/knowledge deficit/gi, "topic worth reviewing")
    .replace(/knowledge gaps/gi, "topics to explore")
    .replace(/knowledge gap/gi, "topic to explore")
    .replace(/failure/gi, "next opportunity to improve")
    .replace(/low performer/gi, "developing practitioner")
    .trim();
}

// ── Tier Visual Configurations ─────────────────────────────────────────────
interface TierVisualConfig {
  badgeLabel: string;
  badgeClass: string;
  headerTitle: string;
  headerSubtitle: string;
  quoteDefault: string;
  sublineDefault: string;
  growthCardGradient: string;
  growthCardBorder: string;
  cardBorder: string;
  roadmapHeading: string;
  roadmapSteps: { title: string; subtitle: string }[];
  ctaHeadline: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  ctaGradient: string;
}

const TIER_CONFIG: Record<PerformanceTier, TierVisualConfig> = {
  GOOD: {
    badgeLabel: "Strong Foundation",
    badgeClass:
      "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    headerTitle: "Keep building. You're close!",
    headerSubtitle:
      "Here are a few focused actions to help you perform even better in your next interview.",
    quoteDefault:
      "Growth happens when you take the next step, not when you wait for perfection.",
    sublineDefault: "You're on the right track!",
    growthCardGradient:
      "from-purple-50/90 via-violet-50/50 to-indigo-50/30 dark:from-purple-950/40 dark:via-violet-950/20 dark:to-slate-900/60",
    growthCardBorder: "border-purple-200/70 dark:border-purple-800/40",
    cardBorder: "border-purple-200/60 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-700",
    roadmapHeading: "Your path forward",
    roadmapSteps: [
      { title: "Review", subtitle: "Reflect on your standout strengths and core takeaways" },
      { title: "Refine", subtitle: "Sharpen architecture depth and trade-off justifications" },
      { title: "Practice", subtitle: "Rehearse targeted scenarios to reinforce consistency" },
      { title: "Challenge yourself", subtitle: "Tackle advanced interview questions and complex systems" },
    ],
    ctaHeadline: "Keep your momentum going",
    ctaSubtitle:
      "Practice the areas that will help you take your skills to the next level.",
    ctaButtonText: "Start Your Next Practice",
    ctaGradient: "from-purple-600 via-violet-600 to-indigo-600",
  },
  AVERAGE: {
    badgeLabel: "Making Progress",
    badgeClass:
      "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    headerTitle: "You're making progress. Let's build on it.",
    headerSubtitle:
      "Focus on a few key areas and use practice to build more confidence.",
    quoteDefault:
      "A little focused practice can make your next answers even clearer.",
    sublineDefault: "Keep working on the areas that matter most.",
    growthCardGradient:
      "from-purple-50/80 via-indigo-50/40 to-amber-50/20 dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-slate-900/60",
    growthCardBorder: "border-purple-200/60 dark:border-purple-800/40",
    cardBorder: "border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700",
    roadmapHeading: "Your improvement path",
    roadmapSteps: [
      { title: "Review", subtitle: "Review key feedback areas and suggested patterns" },
      { title: "Strengthen", subtitle: "Strengthen conceptual clarity on flagged topics" },
      { title: "Practice", subtitle: "Practice your delivery and structured responses" },
      { title: "Try again", subtitle: "Run another assessment round to measure your progress" },
    ],
    ctaHeadline: "Ready to keep improving?",
    ctaSubtitle:
      "Practice the areas identified in your assessment and build more confidence.",
    ctaButtonText: "Start Your Next Practice",
    ctaGradient: "from-purple-600 via-indigo-600 to-violet-600",
  },
  LOW: {
    badgeLabel: "Needs Practice",
    badgeClass:
      "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    headerTitle: "Let's focus on what to improve.",
    headerSubtitle:
      "Here are the key areas to work on based on your assessment.",
    quoteDefault:
      "Every strong performance starts with practice. Focus on one area at a time and keep moving forward.",
    sublineDefault: "You can build this step by step.",
    growthCardGradient:
      "from-rose-50/70 via-purple-50/40 to-indigo-50/20 dark:from-rose-950/30 dark:via-purple-950/20 dark:to-slate-900/60",
    growthCardBorder: "border-rose-200/70 dark:border-rose-800/50",
    cardBorder: "border-rose-200/70 dark:border-rose-800/50 hover:border-rose-300 dark:hover:border-rose-700",
    roadmapHeading: "Your learning path",
    roadmapSteps: [
      { title: "Review", subtitle: "Review the essential takeaways at your own pace" },
      { title: "Learn", subtitle: "Explore foundational concepts for the core areas" },
      { title: "Practice", subtitle: "Practice in bite-sized, supportive rounds" },
      { title: "Try again", subtitle: "Re-take the assessment when you feel ready" },
    ],
    ctaHeadline: "Ready to take the next step?",
    ctaSubtitle:
      "Start with the areas identified in your assessment and build your skills step by step.",
    ctaButtonText: "Start Your Next Practice",
    ctaGradient: "from-rose-600 via-purple-600 to-indigo-600",
  },
};

// ── Abstract Growth Vector Illustrations (No humans/faces) ──────────────────

/** Mountain Summit & Winding Path for Strong/Good performance */
function MountainSummitIllustration() {
  return (
    <svg
      viewBox="0 0 130 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full max-h-20 overflow-visible"
    >
      <defs>
        <linearGradient id="mntG1" x1="65" y1="18" x2="65" y2="85" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" stopOpacity="0.5" />
          <stop stopColor="#DDD6FE" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="mntPeak" x1="65" y1="18" x2="65" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" stopOpacity="0.75" />
          <stop stopColor="#C4B5FD" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="flagG" x1="65" y1="8" x2="80" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Soft circular aura */}
      <circle cx="65" cy="40" r="32" fill="#F5F3FF" className="dark:fill-purple-950/40" />

      {/* Secondary background mountain peaks */}
      <polygon points="18,85 45,42 74,85" fill="#E9D5FF" className="dark:fill-purple-900/30" opacity="0.55" />
      <polygon points="60,85 90,45 120,85" fill="#DDD6FE" className="dark:fill-purple-900/25" opacity="0.5" />

      {/* Main Mountain Peak */}
      <polygon points="30,85 65,22 100,85" fill="url(#mntG1)" />
      <polygon points="52,46 65,22 78,46 72,42 65,45 58,42" fill="url(#mntPeak)" />

      {/* Winding Ascending Path */}
      <path
        d="M 44,85 Q 60,72 54,62 T 68,48 T 64,34 T 65,23"
        stroke="#7C3AED"
        strokeWidth="1.75"
        strokeDasharray="3 2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />

      {/* Summit Flagpole & Flag */}
      <line x1="65" y1="22" x2="65" y2="9" stroke="#6D28D9" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 65,9 L 80,14 L 65,19 Z" fill="url(#flagG)" />

      {/* Minimalist Clouds */}
      <path
        d="M 10,58 Q 16,54 22,58 Q 28,53 34,58 L 10,58 Z"
        fill="#FFFFFF"
        opacity="0.85"
        className="dark:fill-slate-800"
      />
      <path
        d="M 94,42 Q 100,38 106,42 Q 112,38 118,42 L 94,42 Z"
        fill="#FFFFFF"
        opacity="0.8"
        className="dark:fill-slate-800"
      />

      {/* Sparkles / Stars */}
      <path d="M 84,20 L 85.5,17 L 87,20 L 90,21.5 L 87,23 L 85.5,26 L 84,23 L 81,21.5 Z" fill="#F59E0B" />
      <circle cx="102" cy="26" r="1.5" fill="#A78BFA" />
      <circle cx="30" cy="35" r="1.5" fill="#FBBF24" />
    </svg>
  );
}

/** Progress Path with Rising Steps & Target for Developing/Average performance */
function ProgressPathIllustration() {
  return (
    <svg
      viewBox="0 0 130 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full max-h-20 overflow-visible"
    >
      <defs>
        <linearGradient id="pGrad" x1="18" y1="75" x2="100" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* Soft circular aura */}
      <circle cx="68" cy="45" r="34" fill="#F5F3FF" className="dark:fill-purple-950/30" />

      {/* Ascending Steps */}
      <rect x="18" y="70" width="20" height="10" rx="3" fill="#E9D5FF" className="dark:fill-purple-900/40" />
      <rect x="36" y="57" width="20" height="10" rx="3" fill="#DDD6FE" className="dark:fill-purple-900/60" />
      <rect x="54" y="44" width="20" height="10" rx="3" fill="#C4B5FD" className="dark:fill-indigo-900/60" />
      <rect x="72" y="31" width="20" height="10" rx="3" fill="#A78BFA" className="dark:fill-purple-600" />

      {/* Ascending Dashed Trajectory */}
      <path
        d="M 28,66 Q 46,51 64,37 T 86,24"
        stroke="url(#pGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="3.5 2"
        fill="none"
      />

      {/* Target at Destination */}
      <circle cx="92" cy="20" r="12" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="1.5" className="dark:fill-slate-900" />
      <circle cx="92" cy="20" r="7.5" fill="#EDE9FE" stroke="#6366F1" strokeWidth="1.5" className="dark:fill-indigo-950" />
      <circle cx="92" cy="20" r="3" fill="#7C3AED" />

      {/* Upward Growth Arrow */}
      <path
        d="M 108,30 L 114,20 L 103,24"
        stroke="#10B981"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sparkles */}
      <path d="M 40,34 L 41.5,30 L 43,34 L 47,35.5 L 43,37 L 41.5,41 L 40,37 L 36,35.5 Z" fill="#F59E0B" />
      <circle cx="25" cy="42" r="1.5" fill="#8B5CF6" />
      <circle cx="112" cy="46" r="1.5" fill="#A78BFA" />
    </svg>
  );
}

/** Step-by-Step Stepping Stones & Sprout for Needs Practice/Low performance */
function StepByStepIllustration() {
  return (
    <svg
      viewBox="0 0 130 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full max-h-20 overflow-visible"
    >
      <defs>
        <linearGradient id="warmPath" x1="25" y1="72" x2="100" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EC4899" />
          <stop stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Soft warm circular aura */}
      <circle cx="65" cy="45" r="34" fill="#FAF5FF" className="dark:fill-purple-950/25" />

      {/* Gentle Stepping Stones */}
      <ellipse cx="28" cy="72" rx="13" ry="6.5" fill="#F5D0FE" className="dark:fill-purple-900/40" />
      <ellipse cx="50" cy="59" rx="13" ry="6.5" fill="#E879F9" opacity="0.65" className="dark:fill-purple-800/40" />
      <ellipse cx="72" cy="46" rx="13" ry="6.5" fill="#C084FC" opacity="0.75" className="dark:fill-purple-700/50" />
      <ellipse cx="94" cy="33" rx="13" ry="6.5" fill="#A855F7" opacity="0.85" className="dark:fill-purple-600/60" />

      {/* Connecting Curved Rising Path */}
      <path
        d="M 28,72 Q 50,59 72,46 T 94,33"
        stroke="url(#warmPath)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="3 2"
        fill="none"
      />

      {/* Sprout of Growth at Step 1 */}
      <path d="M 24,68 Q 21,60 16,61 Q 19,66 24,68 Z" fill="#10B981" />
      <path d="M 25,68 Q 30,60 35,62 Q 31,67 25,68 Z" fill="#34D399" />
      <path d="M 24.5,68 L 24.5,63" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />

      {/* Guiding Milestone Star at Final Step */}
      <path
        d="M 94,16 L 96,22 L 102.5,23 L 97.5,27 L 99.5,33 L 94,29.5 L 88.5,33 L 90.5,27 L 85.5,23 L 92,22 Z"
        fill="#FBBF24"
      />

      {/* Gentle ambient dots */}
      <circle cx="44" cy="35" r="1.5" fill="#F472B6" />
      <circle cx="78" cy="20" r="1.5" fill="#A855F7" />
      <circle cx="62" cy="74" r="1.5" fill="#FDE047" />
    </svg>
  );
}

// ── Three Cards Data Model ──────────────────────────────────────────────────
interface CardData {
  category: "IMPROVE" | "STRENGTHEN" | "PRACTICE";
  badgeClass: string;
  iconBgClass: string;
  icon: "improve" | "strengthen" | "practice";
  title: string;
  description: string;
  actions: string[];
  ctaLabel: string;
}

/**
 * Extracts real IMPROVE content from the assessment report without any hardcoded candidate text.
 */
function extractImproveCard(report: NormalizedReport): CardData {
  const {
    priority_improvements = [],
    improvements = [],
    technical_analysis,
    final_assessment,
  } = report;

  let title = "";
  let description = "";
  const actions: string[] = [];

  const addAction = (txt?: string) => {
    if (!txt) return;
    const clean = toFriendlyText(txt).trim();
    if (!clean) return;
    const descClean = toFriendlyText(description).trim().toLowerCase();
    if (clean.toLowerCase() === descClean) return;
    if (actions.some((a) => a.toLowerCase() === clean.toLowerCase())) return;
    actions.push(clean);
  };

  if (priority_improvements.length > 0) {
    const first = priority_improvements[0];
    title = first.topic || "Area for Review";
    description = first.guidance || first.example || "";
    if (first.example && first.guidance && first.example !== first.guidance) {
      addAction(first.example);
    }
    if (priority_improvements.length > 1) {
      const second = priority_improvements[1];
      const text = [second.topic, second.guidance].filter(Boolean).join(": ");
      addAction(text);
    }
    if (technical_analysis?.areas_for_improvement?.[0]) {
      addAction(technical_analysis.areas_for_improvement[0]);
    }
  } else if (improvements.length > 0) {
    const first = improvements[0];
    title = first.topic || "Area for Review";
    description = first.rationale || "";
    if (improvements.length > 1) {
      const second = improvements[1];
      const text = [second.topic, second.rationale].filter(Boolean).join(": ");
      addAction(text);
    }
    if (technical_analysis?.areas_for_improvement?.[0]) {
      addAction(technical_analysis.areas_for_improvement[0]);
    }
  } else if (
    technical_analysis?.areas_for_improvement &&
    technical_analysis.areas_for_improvement.length > 0
  ) {
    title = "Technical Implementation";
    description = technical_analysis.areas_for_improvement[0];
    technical_analysis.areas_for_improvement.slice(1, 3).forEach((item) => {
      addAction(item);
    });
  } else if (final_assessment?.most_important_improvement) {
    title = "Priority Focus";
    description = final_assessment.most_important_improvement;
  }

  const hasData = Boolean(title && (description || actions.length > 0));

  return {
    category: "IMPROVE",
    badgeClass:
      "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    iconBgClass:
      "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/60",
    icon: "improve",
    title: hasData ? toFriendlyText(title) : "Improvement Guidance",
    description: hasData
      ? toFriendlyText(description)
      : "No specific recommendation is available for this area yet.",
    actions: actions.slice(0, 3),
    ctaLabel: "Practice This Area →",
  };
}

/**
 * Extracts real STRENGTHEN content from the assessment report without any hardcoded candidate text.
 */
function extractStrengthenCard(report: NormalizedReport): CardData {
  const {
    critical_gaps = [],
    gaps_to_validate = [],
    resume_alignment,
    technical_analysis,
    priority_improvements = [],
  } = report;

  let title = "";
  let description = "";
  const actions: string[] = [];

  const addAction = (txt?: string) => {
    if (!txt) return;
    const clean = toFriendlyText(txt).trim();
    if (!clean) return;
    const descClean = toFriendlyText(description).trim().toLowerCase();
    if (clean.toLowerCase() === descClean) return;
    if (actions.some((a) => a.toLowerCase() === clean.toLowerCase())) return;
    actions.push(clean);
  };

  if (critical_gaps.length > 0) {
    const first = critical_gaps[0];
    // If the topic matches priority_improvements[0], differentiate card focus
    const isOverlapping = priority_improvements[0]?.topic === first.topic;
    title = isOverlapping
      ? `Coverage: ${first.topic || "Core Requirements"}`
      : first.topic || "Topic to Strengthen";
    description =
      first.what_is_missing || first.why_it_matters || first.suggested_addition || "";
    if (first.suggested_addition && first.suggested_addition !== description) {
      addAction(first.suggested_addition);
    }
    if (first.why_it_matters && first.why_it_matters !== description) {
      addAction(first.why_it_matters);
    }
    if (critical_gaps.length > 1) {
      const second = critical_gaps[1];
      const text = [
        second.topic,
        second.suggested_addition || second.what_is_missing,
      ]
        .filter(Boolean)
        .join(": ");
      addAction(text);
    } else if (gaps_to_validate.length > 0) {
      const g = gaps_to_validate[0];
      const text = [g.topic, g.reason].filter(Boolean).join(": ");
      addAction(text);
    }
  } else if (gaps_to_validate.length > 0) {
    const first = gaps_to_validate[0];
    title = first.topic || "Concept to Validate";
    description = first.reason || "";
    gaps_to_validate.slice(1, 3).forEach((g) => {
      const text = [g.topic, g.reason].filter(Boolean).join(": ");
      addAction(text);
    });
  } else if (
    resume_alignment?.missed_highlights &&
    resume_alignment.missed_highlights.length > 0
  ) {
    title = "Experience & Project Depth";
    description = "Highlight relevant engineering decisions from your background.";
    resume_alignment.missed_highlights.slice(0, 2).forEach((h) => {
      actions.push(toFriendlyText(h));
    });
  } else if (technical_analysis?.depth_assessment) {
    title = "Domain Concepts";
    description = technical_analysis.depth_assessment;
  }

  const hasData = Boolean(title && (description || actions.length > 0));

  return {
    category: "STRENGTHEN",
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    iconBgClass:
      "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/60",
    icon: "strengthen",
    title: hasData ? toFriendlyText(title) : "Topics to Strengthen",
    description: hasData
      ? toFriendlyText(description)
      : "No specific recommendation is available for this area yet.",
    actions: actions.slice(0, 3),
    ctaLabel: "Explore Topic →",
  };
}

/**
 * Extracts real PRACTICE content from the assessment report without any hardcoded candidate text.
 */
function extractPracticeCard(report: NormalizedReport): CardData {
  const {
    coaching_suggestions = [],
    final_assessment,
    audio,
    non_technical,
  } = report;

  let title = "";
  let description = "";
  const actions: string[] = [];

  if (coaching_suggestions.length > 0) {
    const first = coaching_suggestions[0];
    // If the topic is identical to improve/strengthen card, give it a delivery-focused angle
    title =
      first.dimension && first.dimension !== first.area
        ? `${first.dimension}: ${first.area}`
        : first.area || "Delivery & Practice";
    description = first.suggestion || "";
    if (first.evidence) {
      actions.push(toFriendlyText("Observation: " + first.evidence));
    }
    if (coaching_suggestions.length > 1) {
      const second = coaching_suggestions[1];
      const text = [second.area, second.suggestion].filter(Boolean).join(": ");
      if (text) actions.push(toFriendlyText(text));
    }
    const vocalGap = audio?.primary_vocal_gap;
    if (vocalGap && vocalGap !== "null" && vocalGap !== "undefined" && vocalGap.trim()) {
      actions.push(toFriendlyText("Vocal delivery: " + vocalGap));
    }
  } else if (final_assessment?.most_important_improvement) {
    title = "Core Practice Focus";
    description = final_assessment.most_important_improvement;
    const vocalGap = audio?.primary_vocal_gap;
    if (vocalGap && vocalGap !== "null" && vocalGap !== "undefined" && vocalGap.trim()) {
      actions.push(toFriendlyText("Delivery: " + vocalGap));
    }
    if (final_assessment.transition_quality) {
      actions.push(toFriendlyText("Transitions: " + final_assessment.transition_quality));
    }
  } else if (audio?.primary_vocal_gap) {
    title = "Communication & Delivery";
    description = audio.primary_vocal_gap;
    if (audio.executive_summary) {
      actions.push(toFriendlyText(audio.executive_summary));
    }
  } else if (
    non_technical?.communication_summary ||
    non_technical?.structure_quality
  ) {
    title = "Interview Presence";
    description =
      non_technical.communication_summary ||
      non_technical.structure_quality ||
      "";
    if (non_technical.confidence_notes) {
      actions.push(toFriendlyText(non_technical.confidence_notes));
    }
  }

  const hasData = Boolean(title && (description || actions.length > 0));

  return {
    category: "PRACTICE",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    iconBgClass:
      "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/60",
    icon: "practice",
    title: hasData ? toFriendlyText(title) : "Practice Focus",
    description: hasData
      ? toFriendlyText(description)
      : "No specific recommendation is available for this area yet.",
    actions: actions.slice(0, 3),
    ctaLabel: "Practice Round →",
  };
}

/**
 * Resolves the top-right motivational message.
 * Prefers real LLM report fields (e.g. motivational_message, encouragement, coaching_summary)
 * and falls back to performance-tier friendly encouragement without hardcoding a generic quote.
 */
function getMotivationalContent(
  report: NormalizedReport,
  tier: PerformanceTier
): { message: string; subline: string } {
  const rAny = report as any;
  const assessment = rAny.assessment ?? {};
  const rep = assessment.report ?? {};
  const repData = rep.report_data ?? assessment.report_data ?? {};
  const txEval = rep.transcript_evaluation ?? repData.transcript_evaluation ?? {};

  // Check if real LLM data provides a motivational or encouraging summary
  const llmMsg =
    rAny.motivational_message ||
    rAny.encouragement ||
    rAny.next_steps_summary ||
    rAny.personalized_summary ||
    rAny.coaching_summary ||
    rep.motivational_message ||
    rep.encouragement ||
    rep.next_steps_summary ||
    rep.personalized_summary ||
    rep.coaching_summary ||
    txEval.motivational_message ||
    txEval.encouragement ||
    txEval.coaching_summary;

  const cleanLLMMsg =
    typeof llmMsg === "string" && llmMsg.trim() ? toFriendlyText(llmMsg) : null;

  const cfg = TIER_CONFIG[tier];

  return {
    message: cleanLLMMsg || cfg.quoteDefault,
    subline: cfg.sublineDefault,
  };
}

export default function NextStepsReport({ report }: Props) {
  const tier = getPerformanceTier(report);
  const tierConfig = TIER_CONFIG[tier];
  const motivational = getMotivationalContent(report, tier);

  const improveCard = extractImproveCard(report);
  const strengthenCard = extractStrengthenCard(report);
  const practiceCard = extractPracticeCard(report);

  const cards = [improveCard, strengthenCard, practiceCard];

  // Standout strength for Good Tier hero highlight (purely dynamic from report)
  const standoutStrength =
    report.overall_strongest_signal ||
    report.technical_analysis?.strengths?.[0] ||
    null;

  // Check if evaluation data has arrived
  const hasAnyData =
    (report.priority_improvements && report.priority_improvements.length > 0) ||
    (report.improvements && report.improvements.length > 0) ||
    (report.critical_gaps && report.critical_gaps.length > 0) ||
    (report.gaps_to_validate && report.gaps_to_validate.length > 0) ||
    (report.coaching_suggestions && report.coaching_suggestions.length > 0) ||
    Boolean(report.technical_analysis?.areas_for_improvement?.length) ||
    Boolean(report.final_assessment?.most_important_improvement) ||
    Boolean(report.audio?.primary_vocal_gap);

  const handleStartPractice = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("aiprep_wizard_step", "CONFIGURATION");
    }
  };

  const handleDashboard = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("aiprep_wizard_step");
    }
  };

  // Graceful empty/loading state if no evaluation data is found yet
  if (!hasAnyData) {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${tierConfig.badgeClass}`}
            >
              {tierConfig.badgeLabel}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            {tierConfig.headerTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tierConfig.headerSubtitle}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-xs space-y-3">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            No specific recommendation is available for this area yet. More practice guidance will appear when your assessment evaluation finishes.
          </p>
          <div className="pt-1">
            <Link
              href="/user_dashboard/ai-prep"
              onClick={handleDashboard}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── 1. Page Header & Editorial Growth Card (Section 5, 8-10, 14) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Column: Heading, Subtitle, & Standout Badge */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${tierConfig.badgeClass}`}
            >
              {tierConfig.badgeLabel}
            </span>
            {standoutStrength && tier === "GOOD" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100/90 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[11px] font-medium">
                <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="line-clamp-1">{standoutStrength}</span>
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight">
            {tierConfig.headerTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
            {tierConfig.headerSubtitle}
          </p>
        </div>

        {/* Right Column: Growth / Motivational Card (occupies ~30–35% on desktop) */}
        <div
          className={`w-full lg:max-w-md rounded-2xl border ${tierConfig.growthCardBorder} bg-gradient-to-br ${tierConfig.growthCardGradient} p-4 sm:p-4.5 shadow-[0_4px_16px_-4px_rgba(124,58,237,0.05)] shrink-0 transition-all overflow-hidden relative`}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left side: Quote + Accent Divider + Supporting Line */}
            <div className="space-y-2 min-w-0 flex-1">
              <p className="text-xs sm:text-xs font-medium text-slate-800 dark:text-slate-100 italic leading-relaxed">
                &ldquo;{motivational.message}&rdquo;
              </p>

              {/* Elegant Accent Divider */}
              <div className="w-8 h-0.5 rounded-full bg-purple-300 dark:bg-purple-700/80" />

              {/* Supporting Line */}
              <p className="text-[11px] font-semibold text-purple-700/90 dark:text-purple-300/90 tracking-wide">
                {motivational.subline}
              </p>
            </div>

            {/* Right side: Abstract Growth / Mountain / Progress Illustration */}
            <div className="w-24 sm:w-28 h-20 shrink-0 flex items-center justify-center pointer-events-none select-none">
              {tier === "GOOD" && <MountainSummitIllustration />}
              {tier === "AVERAGE" && <ProgressPathIllustration />}
              {tier === "LOW" && <StepByStepIllustration />}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Three Focused Action Cards (Equal visual height, compact) ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Focused Action Cards
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Real performance-driven recommendations
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`flex flex-col justify-between rounded-2xl border ${tierConfig.cardBorder} bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-200 h-full`}
            >
              <div className="space-y-3">
                {/* Category Header Badge & Abstract Icon */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${card.badgeClass}`}
                  >
                    {card.category}
                  </span>
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-lg border shrink-0 ${card.iconBgClass}`}
                  >
                    {card.icon === "improve" && <ArrowUpRight className="w-3.5 h-3.5" />}
                    {card.icon === "strengthen" && <Compass className="w-3.5 h-3.5" />}
                    {card.icon === "practice" && <RotateCcw className="w-3.5 h-3.5" />}
                  </span>
                </div>

                {/* Dynamic Title and Description */}
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {card.title}
                  </h4>
                  {card.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {card.description}
                    </p>
                  )}
                </div>

                {/* Dynamic Action Checklist (✓ Dynamic action) */}
                {card.actions.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Recommended Focus
                    </p>
                    <div className="space-y-1.5">
                      {card.actions.map((action, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug line-clamp-2">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card CTA Action Button */}
              <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href="/user_dashboard/ai-prep/assessment-type"
                  onClick={handleStartPractice}
                  className="inline-flex items-center justify-center w-full gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 hover:bg-purple-50 dark:bg-slate-800/60 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-800/70 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-300 transition-all group"
                >
                  <span>{card.ctaLabel}</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Improvement Path — 4 Horizontal Steps on Desktop (Section 15) ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-4.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {tierConfig.roadmapHeading}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Follow this structured 4-step progression to maximize interview readiness.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <Milestone className="w-3.5 h-3.5" />
            <span>Horizontal Progression</span>
          </span>
        </div>

        {/* 4 horizontal steps on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {tierConfig.roadmapSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-600/10 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-bold text-[11px]">
                  {idx + 1}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {step.title}
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                {step.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Compact Final CTA Banner (Section 16) ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-4.5 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-1.5">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-white shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                Ready to make progress?
              </p>
            </div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
              Put your insights into action
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Practice the areas identified in your assessment and come back stronger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/user_dashboard/ai-prep"
              onClick={handleDashboard}
              className="px-3.5 py-2 rounded-lg border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/user_dashboard/ai-prep/assessment-type"
              onClick={handleStartPractice}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r ${tierConfig.ctaGradient} hover:opacity-95 text-xs font-semibold text-white shadow-sm transition-all hover:gap-2`}
            >
              <span>{tierConfig.ctaButtonText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
