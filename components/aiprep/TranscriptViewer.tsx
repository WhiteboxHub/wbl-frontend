'use client';

/**
 * TranscriptViewer Component
 * Specification: [Vishnu] Phase 6: Timestamped Transcript
 * 
 * Renders timestamped interview evidence, candidate quotes, question-by-question
 * review, search filtering, and media jump-to-timestamp seek capabilities.
 */

import React, { useState } from 'react';
import {
  AssessmentDetails,
  TranscriptEvidenceItem,
  QuestionTelemetryItem,
} from '@/types/aiprep';
import { Search, Play, Video, Clock, MessageSquare, Quote } from 'lucide-react';

export interface ExtendedQuestionItem extends QuestionTelemetryItem {
  candidate_answer?: string;
  rubric?: string;
  ideal_answer_rubric?: string;
  did_well?: string;
  could_improve?: string;
  suggested_approach?: string;
  timestamp_s?: number;
}

export interface TranscriptViewerProps {
  assessment: AssessmentDetails;
  evidence?: TranscriptEvidenceItem[];
  questions?: ExtendedQuestionItem[];
  onSeek?: (seconds: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  assessment,
  evidence: propEvidence,
  questions: propQuestions,
  onSeek,
  videoRef,
  audioRef,
}) => {
  const report = assessment?.report;
  const transcriptEval = report?.transcript_evaluation;
  const evidence: TranscriptEvidenceItem[] =
    propEvidence || transcriptEval?.transcript_evidence || [];
  const questions: ExtendedQuestionItem[] =
    propQuestions || assessment?.data?.questions || [];

  const [evidenceSearch, setEvidenceSearch] = useState('');
  const [mediaError, setMediaError] = useState(false);

  const youtubeUrl = assessment?.youtube_url;
  const audioUrl = assessment?.data?.audio_telemetry?.audio_url;

  const handleTimestampClick = (sec?: number) => {
    if (typeof sec !== 'number') return;
    if (onSeek) {
      onSeek(sec);
    } else {
      if (videoRef?.current) {
        videoRef.current.currentTime = sec;
        void videoRef.current.play();
      }
      if (audioRef?.current) {
        audioRef.current.currentTime = sec;
        void audioRef.current.play();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Session Media Player if available */}
      {(youtubeUrl || audioUrl) && !mediaError && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            <Video className="w-4 h-4 text-purple-600" />
            <span>Session Recording</span>
          </h3>
          {youtubeUrl ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
              <iframe
                src={youtubeUrl}
                title="Interview Recording"
                className="w-full h-full"
                allowFullScreen
                onError={() => setMediaError(true)}
              />
            </div>
          ) : audioUrl ? (
            <audio
              ref={audioRef}
              controls
              src={audioUrl}
              className="w-full"
              onError={() => setMediaError(true)}
            />
          ) : null}
        </div>
      )}

      {/* Questions & Evidence List */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Interview Evidence & Transcript Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Questions asked and evaluated responses with timestamps
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search transcript evidence..."
              value={evidenceSearch}
              onChange={(e) => setEvidenceSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Evidence Items */}
        <div className="space-y-3">
          {evidence.length > 0 ? (
            evidence
              .filter(
                (e) => !evidenceSearch || e.quote.toLowerCase().includes(evidenceSearch.toLowerCase())
              )
              .map((ev, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      Evidence #{idx + 1}
                    </span>
                    {ev.timestamp_s != null && (
                      <button
                        type="button"
                        onClick={() => handleTimestampClick(ev.timestamp_s)}
                        className="inline-flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>
                          {Math.floor(ev.timestamp_s / 60)}:
                          {(ev.timestamp_s % 60).toString().padStart(2, '0')}
                        </span>
                      </button>
                    )}
                  </div>
                  <blockquote className="text-xs text-slate-700 dark:text-slate-300 italic border-l-2 border-purple-400 pl-3 leading-relaxed">
                    &ldquo;{ev.quote}&rdquo;
                  </blockquote>
                </div>
              ))
          ) : questions.length > 0 ? (
            questions
              .filter(
                (q) =>
                  !evidenceSearch ||
                  q.question_text.toLowerCase().includes(evidenceSearch.toLowerCase())
              )
              .map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 space-y-1.5"
                >
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    Question {idx + 1}
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {q.question_text}
                  </p>
                  {q.candidate_answer && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic border-l-2 border-slate-300 dark:border-slate-700 pl-2.5 mt-1 leading-relaxed">
                      &ldquo;{q.candidate_answer}&rdquo;
                    </p>
                  )}
                </div>
              ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              No transcript evidence available for this session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptViewer;
