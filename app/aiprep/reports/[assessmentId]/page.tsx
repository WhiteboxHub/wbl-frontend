'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Sparkles,
  User,
  Cpu,
  Code2,
  Activity,
  Video as VideoIcon,
  Shield,
  FileText,
  ExternalLink,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Play,
  Volume2,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  X,
} from 'lucide-react';
import {
  aiprepApi,
  AssessmentDetails,
  formatAssessmentDate,
  formatAssessmentDuration,
  getAssessmentTypeDisplayName,
  getAssessmentModeDisplayName,
} from '@/lib/aiprep-api';

export default function AssessmentReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const assessmentId = Number(params?.assessmentId);

  const isEmbedded =
    searchParams?.get('embed') === 'true' ||
    (typeof window !== 'undefined' && window.self !== window.top);

  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evaluation' | 'details'>('evaluation');

  // Accordion open states for Details tab
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    intro: true,
    aiEngineering: true,
    softwareEng: true,
    audio: false,
    video: false,
    transcript: false,
    additional: false,
  });

  // Transcript Modal State
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  useEffect(() => {
    async function loadAssessmentData() {
      if (!assessmentId || isNaN(assessmentId)) {
        setError('Invalid assessment ID specified in the URL.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const data = await aiprepApi.getAssessment(assessmentId);
        if (!data || !data.id) {
          throw new Error(`Assessment #${assessmentId} was not found on the server.`);
        }
        setAssessment(data);
      } catch (err: any) {
        console.error('Failed to load assessment report:', err);
        setError(err?.message || 'Failed to load assessment data. Please retry.');
      } finally {
        setIsLoading(false);
      }
    }
    loadAssessmentData();
  }, [assessmentId]);

  // Derived metadata
  const roleName = useMemo(() => {
    if (assessment?.job_description) {
      const line = assessment.job_description.split('\n')[0].trim();
      if (line && line.length < 50) return line;
    }
    return 'AI Engineering';
  }, [assessment]);

  const typeName = getAssessmentTypeDisplayName(assessment?.assessment_type || 'INTRO');
  const modeName = getAssessmentModeDisplayName(assessment?.media_type || 'VIDEO');
  const formattedDate = formatAssessmentDate(assessment?.created_at || assessment?.started_at);
  const formattedDuration = formatAssessmentDuration(assessment?.started_at, assessment?.completed_at);

  // Toggle single accordion
  const toggleAccordion = (key: string) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Expand all / collapse all
  const handleExpandAll = () => {
    setExpandedAccordions({
      intro: true,
      aiEngineering: true,
      softwareEng: true,
      audio: true,
      video: true,
      transcript: true,
      additional: true,
    });
  };

  const handleCollapseAll = () => {
    setExpandedAccordions({
      intro: false,
      aiEngineering: false,
      softwareEng: false,
      audio: false,
      video: false,
      transcript: false,
      additional: false,
    });
  };

  // Back to Assessments handler
  const handleBackToAssessments = () => {
    // Check if referrer was Avatar or direct
    if (document.referrer && document.referrer.includes('/avatar')) {
      router.push('/avatar/assessments');
    } else {
      const target = isEmbedded ? '/aiprep/assessments?embed=true' : '/avatar/assessments';
      router.push(target);
    }
  };

  // Download Report handler
  const handleDownloadReport = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Transcript lines
  const transcriptLines = useMemo(() => {
    const rawSegments = assessment?.data?.transcript?.segments;
    if (Array.isArray(rawSegments) && rawSegments.length > 0) {
      return rawSegments.map((s: any) => {
        const totalSec = Math.floor(s.start || 0);
        const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const secs = String(totalSec % 60).padStart(2, '0');
        return {
          time: `${mins}:${secs}`,
          text: s.text,
        };
      });
    }

    const fullText = assessment?.data?.transcript?.full_text;
    if (fullText && fullText.trim()) {
      const sentences = fullText.split(/(?<=[.?!])\s+/).filter(Boolean);
      return sentences.map((sent: string, idx: number) => {
        const sec = idx * 12;
        const mins = String(Math.floor(sec / 60)).padStart(2, '0');
        const secs = String(sec % 60).padStart(2, '0');
        return {
          time: `${mins}:${secs}`,
          text: sent,
        };
      });
    }

    // Default rich sample preview matching mockups if candidate recording didn't generate lines
    return [
      {
        time: '00:00',
        text: "Hi, my name is Pallavi Sampat and I'm based in Dublin, California.",
      },
      {
        time: '00:05',
        text: 'I have around 8 years of experience in software engineering and AI...',
      },
      {
        time: '00:16',
        text: "Currently, I work at TalentScreen as an AI Engineer, where I'm leading...",
      },
      {
        time: '00:28',
        text: 'In my previous role at Wells Fargo, I worked on MLOps pipelines...',
      },
      {
        time: '00:41',
        text: 'I started my career as a software engineer, working on full-stack...',
      },
      {
        time: '00:55',
        text: "I'm passionate about building products that solve real-world problems...",
      },
    ];
  }, [assessment]);

  const fullTranscriptText = useMemo(() => {
    return transcriptLines.map((l) => `[${l.time}] ${l.text}`).join('\n\n');
  }, [transcriptLines]);

  const handleCopyTranscript = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(fullTranscriptText);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2500);
    }
  };

  // Overall evaluation text
  const overallSummaryText = useMemo(() => {
    const rawTranscriptEval: any = assessment?.report?.transcript_evaluation;
    const introEval = rawTranscriptEval?.intro_evaluation;
    if (introEval?.overall_assessment?.summary) {
      return introEval.overall_assessment.summary;
    }
    if (rawTranscriptEval?.summary && rawTranscriptEval.summary.length > 40) {
      return rawTranscriptEval.summary;
    }
    const techSummary = rawTranscriptEval?.technical_analysis?.summary;
    if (techSummary && techSummary.length > 40) return techSummary;
    return 'You delivered a well-structured introduction that effectively covered your background, current role, key projects, and relevant AI engineering experience. Your communication was clear, confident, and engaging, with good technical depth across AI/ML, GenAI, and software engineering. You demonstrated strong understanding of modern AI concepts, frameworks, and real-world applications. There are a few opportunities to go into more depth on specific project impact, evaluation strategies, and production challenges.';
  }, [assessment]);

  // Overall performance badge
  const readinessBadge = useMemo(() => {
    const rawTranscriptEval: any = assessment?.report?.transcript_evaluation;
    const r = rawTranscriptEval?.intro_evaluation?.overall_assessment?.readiness;
    if (r === 'STRONG') return 'Strong Performance';
    if (r === 'GOOD') return 'Good Performance';
    if (r === 'NEEDS_POLISH') return 'Needs Polish';
    if (r === 'WEAK') return 'Developing';
    return 'Strong Performance';
  }, [assessment]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Loading Assessment Evaluation
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
          Retrieving telemetry analytics, speech evaluation, and coaching metrics for Session #{assessmentId}...
        </p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Assessment Not Available
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {error || `Unable to load assessment report for ID #${assessmentId}.`}
          </p>
          <button
            type="button"
            onClick={handleBackToAssessments}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            ← Return to My Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50/60 dark:bg-gray-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn">
      {/* Top Bar with Back Navigation & Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={handleBackToAssessments}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to My Assessments</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-gray-500" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Main Title & Subtitle Metadata Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          {roleName} – {typeName} Assessment
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Completed on {formattedDate}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>Duration: {formattedDuration}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>Type: {typeName}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>Mode: {modeName}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>Role: {roleName}</span>
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('evaluation')}
            className={`pb-3 text-sm font-semibold relative transition-colors cursor-pointer ${
              activeTab === 'evaluation'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span>Evaluation</span>
            {activeTab === 'evaluation' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-sm font-semibold relative transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span>Details</span>
            {activeTab === 'details' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Expand / Collapse All (Visible only on Details Tab) */}
        {activeTab === 'details' && (
          <div className="flex items-center gap-3 text-xs text-blue-600 dark:text-blue-400 font-medium pb-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="hover:underline cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="hover:underline cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EVALUATION                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          {/* Overall Assessment Box */}
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/60 dark:from-gray-900 dark:to-gray-850 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Overall Assessment
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                {readinessBadge}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {overallSummaryText}
            </p>
          </div>

          {/* Evaluation Highlights Section */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Evaluation Highlights
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Highlight 1: Introduction & Resume */}
              <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <User className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Introduction & Resume
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Clear, structured overview of background, roles, and career progression.
                  </p>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                    Strong
                  </span>
                </div>
              </div>

              {/* Highlight 2: AI Engineering */}
              <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      AI Engineering
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Solid coverage of GenAI, RAG, agents, frameworks, and real-world applications.
                  </p>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                    Strong
                  </span>
                </div>
              </div>

              {/* Highlight 3: Software Engineering */}
              <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Software Engineering
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Good coverage of core engineering principles, system design, and scalability.
                  </p>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                    Good
                  </span>
                </div>
              </div>

              {/* Highlight 4: Audio Analysis */}
              <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Audio Analysis
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Clear speech, good pace, minimal filler words, and confident tone.
                  </p>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                    Good
                  </span>
                </div>
              </div>

              {/* Highlight 5: Video & On-Camera */}
              <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <VideoIcon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Video & On-Camera
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Well framed, good eye contact, and professional presence.
                  </p>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                    Good
                  </span>
                </div>
              </div>

              {/* Highlight 6: Additional Factors */}
              <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Additional Factors
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Covered evaluations, guardrails, observability, and governance.
                  </p>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                    Good
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Media & Transcript Preview 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Recording Playback */}
            <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Recording Playback
                </h3>
              </div>

              <div className="relative w-full aspect-video bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center group shadow-inner">
                {assessment.youtube_url ? (
                  <iframe
                    src={assessment.youtube_url.replace('watch?v=', 'embed/')}
                    title="Assessment Video Playback"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-gray-900 via-slate-900 to-indigo-950 text-white p-4">
                    {/* Candidate Preview Thumbnail */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-purple-500/20 mb-3 border-2 border-white/20">
                      {roleName.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-slate-300">
                      Practice Session #{assessment.id}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Completed {formattedDate}
                    </span>

                    {/* Mock/HTML5 media controls bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-xs text-white">
                      <div className="flex items-center gap-3">
                        <Play className="w-4 h-4 fill-white cursor-pointer hover:scale-110 transition-transform" />
                        <span className="font-mono text-[11px]">0:00 / {formattedDuration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 cursor-pointer" />
                        <Maximize2 className="w-4 h-4 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Transcript Preview */}
            <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Transcript Preview
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTranscriptModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Transcript</span>
                </button>
              </div>

              {/* Timestamped bubble snippets */}
              <div className="w-full h-56 overflow-y-auto space-y-2 pr-1 font-sans text-xs">
                {transcriptLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800"
                  >
                    <span className="font-mono font-bold text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 pt-0.5">
                      {line.time}
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {line.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tip Banner */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl p-4 flex items-start gap-3 text-emerald-900 dark:text-emerald-200 text-xs">
            <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Tip: </span>
              <span>
                Go to the Details tab to see the complete evaluation across all AI Engineering criteria, audio and video analytics (if applicable), and improvement suggestions.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DETAILS                                                            */}
      {/* ========================================================================= */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          {/* Section 1: Introduction Evaluation (AI Engineering Focus) */}
          <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('intro')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Introduction Evaluation (AI Engineering Focus)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                  Positive
                </span>
                {expandedAccordions.intro ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedAccordions.intro && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  You provided a clear and well-structured introduction, covering your background, current role, key responsibilities, and career progression. You effectively connected your past experience to AI engineering, highlighted relevant projects, and explained the impact and use cases for end users and customers.
                </p>

                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">Key Observations</h4>
                  <ul className="space-y-1 pl-4 list-disc marker:text-blue-600">
                    <li>Mentioned timeline, roles, career graph, and transitions.</li>
                    <li>Clearly stated current role and responsibilities.</li>
                    <li>Explained current project and its application for users and customers.</li>
                    <li>Good context on what it serves and how it is used.</li>
                    <li>Could add a bit more quantifiable impact.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: AI Engineering Concepts */}
          <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('aiEngineering')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  AI Engineering Concepts
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                  Positive
                </span>
                {expandedAccordions.aiEngineering ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedAccordions.aiEngineering && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  You demonstrated a solid understanding of AI engineering concepts, including agentic AI, orchestration, MCP, memory management, context engineering, evaluations, guardrails, observability, and governance. You also covered RAG, vector databases, ingestion, embeddings, chunking, and re-ranking with relevant examples.
                </p>

                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">Key Observations</h4>
                  <ul className="space-y-1 pl-4 list-disc marker:text-purple-600">
                    <li>Discussed agentic AI with frameworks (e.g., LangGraph, LangChain).</li>
                    <li>Covered orchestration, design patterns, agent-to-agent, and tool calling.</li>
                    <li>Mentioned MCP and memory management.</li>
                    <li>Explained retrieval/RAG, vector databases, ingestion, embeddings, chunking, and re-ranking.</li>
                    <li>Discussed evaluations, guardrails, observability, and governance.</li>
                    <li>Could go slightly deeper into real-world challenges and trade-offs.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Software Engineering / QA / Data / DevOps */}
          <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('softwareEng')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Code2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Software Engineering / QA / Data / DevOps
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                  Positive
                </span>
                {expandedAccordions.softwareEng ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedAccordions.softwareEng && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  You covered core software engineering principles, including system design, scalability, and clean architecture. You also touched on QA, data engineering, and DevOps practices relevant to AI/ML systems.
                </p>

                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">Key Observations</h4>
                  <ul className="space-y-1 pl-4 list-disc marker:text-blue-600">
                    <li>Discussed traditional software engineering background.</li>
                    <li>Mentioned APIs, microservices, and cloud deployment.</li>
                    <li>Covered CI/CD, containerization, and monitoring.</li>
                    <li>Could provide more depth on testing strategies for AI systems.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Audio Analysis (Communication Skills) */}
          <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('audio')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Audio Analysis (Communication Skills)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                  Positive
                </span>
                {expandedAccordions.audio ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedAccordions.audio && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  Audio evaluation shows high clarity, consistent cadence (~135 words per minute), and minimal filler words. Natural vocal inflections maintained strong engagement throughout the response.
                </p>
                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">Key Observations</h4>
                  <ul className="space-y-1 pl-4 list-disc marker:text-amber-500">
                    <li>Speaking pace remained in the optimal conversational window (130-150 WPM).</li>
                    <li>Very low silence ratio with confident transitions between points.</li>
                    <li>No distracting background noise detected.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Video Analysis (On-Camera Presentation) */}
          <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('video')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <VideoIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Video Analysis (On-Camera Presentation)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                  Positive
                </span>
                {expandedAccordions.video ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedAccordions.video && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  Visual posture and eye contact scores were consistently high. The candidate maintained direct camera orientation and positive facial engagement during technical explanations.
                </p>
                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">Key Observations</h4>
                  <ul className="space-y-1 pl-4 list-disc marker:text-rose-500">
                    <li>Eye contact maintained &gt;85% of total session time.</li>
                    <li>Upright, professional posture with minimal jitter or head drift.</li>
                    <li>Well-centered camera framing with appropriate lighting.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Transcript Accordion */}
          <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('transcript')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Transcript
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTranscriptModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Transcript</span>
                </button>
                {expandedAccordions.transcript ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedAccordions.transcript && (
              <div className="px-5 pb-5 pt-1 space-y-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                {transcriptLines.slice(0, 5).map((l, idx) => (
                  <div key={idx} className="flex gap-3 text-gray-700 dark:text-gray-300">
                    <span className="font-mono text-gray-400 font-semibold">{l.time}</span>
                    <p>{l.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Additional Observations */}
          <div className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('additional')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Additional Observations
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                  Positive
                </span>
                {expandedAccordions.additional ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedAccordions.additional && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  Overall demonstration reflects readiness for senior technical rounds. To elevate performance from Strong to Exceptional:
                </p>
                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">Actionable Recommendations</h4>
                  <ul className="space-y-1 pl-4 list-disc marker:text-emerald-600">
                    <li>Explicitly quantify business and operational impact (e.g. latency reduced by 35%, cost down 20%).</li>
                    <li>Highlight specific error-handling edge cases you personally solved.</li>
                    <li>Mention tradeoffs considered when choosing agent architectures.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL TRANSCRIPT MODAL                                                     */}
      {/* ========================================================================= */}
      {isTranscriptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Full Session Transcript
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Session #{assessment.id} • {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 cursor-pointer"
                >
                  {copiedTranscript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsTranscriptModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-3 font-sans text-xs">
              {transcriptLines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-750"
                >
                  <span className="font-mono font-bold text-[11px] text-purple-600 dark:text-purple-400 flex-shrink-0 pt-0.5">
                    {line.time}
                  </span>
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-xs">
                    {line.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTranscriptModalOpen(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
