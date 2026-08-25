/**
 * AIPrep Main Selector Dashboard Page
 * 
 * Target Workspace: wbl-frontend
 * Route: /aiprep
 * Primary Developer: Narasimha (FE1)
 * 
 * Lists previous assessment history and presents the 7 interview modules
 * with customizable modes and JD input.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { aiprepApi, Assessment, AssessmentType, AssessmentMode, QuestionCategory } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { AssessmentCard, AssessmentMetadata } from '@/components/aiprep/AssessmentCard';
import { Video, Mic, History, Sparkles, BookOpen, AlertTriangle, FileText, ShieldCheck, X } from 'lucide-react';

const ASSESSMENT_CARDS_META: AssessmentMetadata[] = [
  {
    type: 'GENERAL_INTRO',
    title: 'General Introduction',
    description: 'A brief, friendly introductory dialogue covering your professional background and interests. Pausing is disabled to mimic live flow.',
    timeLimit: '90s per question',
    questionCount: '3-5 Questions',
    pauseAllowed: false,
    requiresJd: false,
  },
  {
    type: 'JOB_DESCRIPTION_INTRO',
    title: 'Targeted Job Description Intro',
    description: 'An introductory screen customized to a specific job description. Paste your target JD below to dynamically generate relevant questions.',
    timeLimit: '90s per question',
    questionCount: '3-5 Questions',
    pauseAllowed: false,
    requiresJd: true,
  },
  {
    type: 'RECRUITER',
    title: 'Recruiter Phone Screen',
    description: 'Simulates a standard recruiter phone screen covering experience overview, compensation expectations, notice period, and logs.',
    timeLimit: '2m per question',
    questionCount: '5-7 Questions',
    pauseAllowed: true,
    requiresJd: false,
  },
  {
    type: 'HIRING_MANAGER',
    title: 'Hiring Manager Conversation',
    description: 'Deeper technical alignment screen exploring system design ownership, past projects, conflict resolution, and leadership dynamics.',
    timeLimit: '3m per question',
    questionCount: '6-8 Questions',
    pauseAllowed: true,
    requiresJd: false,
  },
  {
    type: 'TECHNICAL',
    title: 'Technical Theory & Coding',
    description: 'Deep-dive into core AI Engineering topics: LLMs, transformers, RAG architecture, MLOps, vector DBs, and fine-tuning details.',
    timeLimit: '4m per question',
    questionCount: '6-10 Questions',
    pauseAllowed: true,
    requiresJd: false,
  },
  {
    type: 'SYSTEM_DESIGN',
    title: 'AI System Design',
    description: 'Solve production AI scale challenges. Deconstruct business problems, design pipelines, choose models, and reason about trade-offs.',
    timeLimit: '5m min response',
    questionCount: '3-5 Scenarios',
    pauseAllowed: true,
    requiresJd: false,
  },
  {
    type: 'HR',
    title: 'HR & Behavioral Screen',
    description: 'Classic situational and cultural fit loops using the STAR format (Situation, Task, Action, Result) to evaluate work dynamics.',
    timeLimit: '3m per question',
    questionCount: '5-7 Questions',
    pauseAllowed: true,
    requiresJd: false,
  },
];

const mapAssessmentTypeToCategory = (type: AssessmentType): QuestionCategory => {
  switch (type) {
    case 'TECHNICAL': return 'TECHNICAL';
    case 'SYSTEM_DESIGN': return 'SYSTEM_DESIGN';
    case 'RECRUITER': return 'RECRUITER';
    case 'HIRING_MANAGER': return 'HIRING_MANAGER';
    case 'GENERAL_INTRO':
    case 'JOB_DESCRIPTION_INTRO':
      return 'GENERAL';
    case 'HR':
    default:
      return 'BEHAVIORAL';
  }
};

export default function AIPrepDashboard() {
  // App state
  const [jdText, setJdText] = useState<string>('');
  const [selectedType, setSelectedType] = useState<AssessmentType | null>(null);

  const [history, setHistory] = useState<Assessment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [questionCounts, setQuestionCounts] = useState<Record<string, string>>({});

  // Fetch actual live question counts from question bank API
  useEffect(() => {
    async function loadLiveQuestionCounts() {
      const counts: Record<string, string> = {};
      await Promise.all(
        ASSESSMENT_CARDS_META.map(async (meta) => {
          try {
            const category = mapAssessmentTypeToCategory(meta.type);
            const qList = await aiprepApi.getQuestions(category);
            if (qList && qList.length > 0) {
              const unit = meta.type === 'SYSTEM_DESIGN' ? 'Scenarios' : 'Questions';
              counts[meta.type] = `${qList.length} ${unit}`;
            }
          } catch (err) {
            console.warn(`Failed to fetch questions count for ${meta.type}:`, err);
          }
        })
      );
      setQuestionCounts(counts);
    }
    loadLiveQuestionCounts();
  }, []);

  // Embedded detection
  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    const embedded = window.self !== window.top || window.location.search.includes('embed=true');
    setIsEmbedded(embedded);
  }, []);

  // Modal state
  const [showModeModal, setShowModeModal] = useState(false);
  const [pendingType, setPendingType] = useState<AssessmentType | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  // Fetch live Assessment History from backend DB on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoadingHistory(true);
        let candidateId = 7;
        try {
          const userResponse = await apiFetch("user_dashboard");
          if (userResponse?.candidate_id) {
            candidateId = userResponse.candidate_id;
          }
        } catch (profileErr) {
          console.error("Failed to retrieve candidateId, defaulting to 7", profileErr);
        }

        const listData = await aiprepApi.listAssessments(candidateId, 5);
        if (listData?.items && listData.items.length > 0) {
          setHistory(listData.items);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error('Error fetching live assessment history from DB:', err);
        setHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  const handleLaunchAssessment = (type: AssessmentType) => {
    setErrorMsg(null);
    setSelectedType(type);

    // Validate JD if required
    if (type === 'JOB_DESCRIPTION_INTRO' && !jdText.trim()) {
      setErrorMsg('Please paste your target Job Description in the text area before starting.');
      return;
    }

    setPendingType(type);
    setShowModeModal(true);
  };

  const confirmLaunch = (mode: 'VIDEO_AUDIO' | 'AUDIO_ONLY') => {
    if (!pendingType) return;
    setIsLaunching(true);

    // Save active session parameters and clear old IDs so consent is ALWAYS required for new loops
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aiprep_active_type', pendingType);
      sessionStorage.setItem('aiprep_active_mode', mode);
      sessionStorage.removeItem('aiprep_active_id');
      sessionStorage.removeItem('aiprep_consent_accepted');
      if (pendingType === 'JOB_DESCRIPTION_INTRO') {
        sessionStorage.setItem('aiprep_jd_text', jdText);
      }
    }

    const isMock = typeof window !== 'undefined' && window.location.search.includes('mock=true');
    const mockQuery = isMock ? '&mock=true' : '';
    const embedQuery = isEmbedded ? '&embed=true' : '';

    const targetUrl = `/aiprep/device-check?type=${pendingType}&mode=${mode}${mockQuery}${embedQuery}`;

    if (isEmbedded) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, '_blank');
    }
    setPendingType(null);
  };

  const renderCard = (type: AssessmentType) => {
    const meta = ASSESSMENT_CARDS_META.find(m => m.type === type);
    if (!meta) return null;


    return (
      <AssessmentCard
        key={meta.type}
        metadata={meta}
        questionCountOverride={questionCounts[meta.type]}
        onLaunch={handleLaunchAssessment}
        isSelected={selectedType === meta.type}
        jdText={jdText}
      />
    );
  };

  return (
    <div className={`${isEmbedded
        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 pt-3 pb-4 transition-colors duration-200'
        : 'min-h-screen bg-[#f8fafc] dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-12 px-6 md:px-12 transition-colors duration-200'
      }`}>
      {/* Top Banner decoration */}
      {!isEmbedded && (
        <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-b from-[#4A6CF7]/10 via-[#f8fafc]/5 to-[#f8fafc] dark:via-slate-900/5 dark:to-slate-900 pointer-events-none -z-10" />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Page Header - Hidden inside iframe */}
        {!isEmbedded && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-[#4A6CF7] text-sm font-semibold tracking-wider uppercase mb-2">
                <Sparkles className="w-4 h-4 text-[#4A6CF7] animate-pulse" />
                <span>Self-Improvement Platform</span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                AIPrep Interview Coach
              </h1>
              <p className="text-slate-550 dark:text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">
                Choose a realistic AI engineering interview simulation and receive private, actionable coaching after your session.
              </p>
            </div>
          </div>
        )}

        {/* Errors banner */}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl mb-8 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CSS grid of 7 interview modules (3 columns) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            <BookOpen className="w-4 h-4 text-[#4A6CF7]" />
            <span>Select Practice Loop</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Row 1, Col 1: General Introduction */}
            {renderCard('GENERAL_INTRO')}

            {/* Row 1, Col 2: Targeted Job Description Intro */}
            {renderCard('JOB_DESCRIPTION_INTRO')}

            {/* Row 1, Col 3: Targeted Practice (JD text area input — inline, no card) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm flex flex-col h-full justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#4A6CF7]" />
                  <span>Targeted Practice</span>
                </h3>
                <p className="text-slate-550 dark:text-slate-400 text-xs mb-3 leading-relaxed">
                  Paste the role description here to unlock the <strong>Targeted Job Description Intro</strong> assessment module.
                </p>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the target job description here..."
                  rows={4}
                  aria-label="Target job description"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#4A6CF7]/20 focus:border-[#4A6CF7] transition-colors duration-200 resize-none min-h-[90px]"
                />
              </div>
              <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Once a description is added, select <strong>Start Practice</strong> on the Targeted JD Intro card.
              </p>
            </div>

            {/* Row 2, Col 1: Recruiter Phone Screen */}
            {renderCard('RECRUITER')}

            {/* Row 2, Col 2: Hiring Manager Conversation */}
            {renderCard('HIRING_MANAGER')}

            {/* Row 2, Col 3: Recent Practice History (list of past sessions) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-[#4A6CF7]" />
                    <span>Recent Practice</span>
                  </h3>
                  {history.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      Latest {Math.min(history.length, 5)}
                    </span>
                  )}
                </div>

                {isLoadingHistory ? (
                  <div className="space-y-2 py-1">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="h-10 bg-slate-100 dark:bg-slate-950 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {history.slice(0, 5).map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded-xl bg-slate-55/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 transition-all ${item.status === 'COMPLETED' ? 'hover:border-[#4A6CF7]/50 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-900/80' : ''}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {item.assessment_type.replace(/_/g, ' ')}
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${item.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                              item.status === 'FAILED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
                                'bg-sky-500/10 border-sky-500/20 text-sky-600 animate-pulse'
                            }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                    No practice sessions recorded yet. Launch your first session!
                  </div>
                )}
              </div>
              <button
                type="button"
                className="w-full mt-3 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#4A6CF7]/30 bg-[#4A6CF7]/5 hover:bg-[#4A6CF7]/10 text-xs font-bold text-[#3857d4] dark:text-[#8ca1ff] transition-all"
              >
                <span>View All Practice History</span>
                <History className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Row 3, Col 1: Technical Theory */}
            {renderCard('TECHNICAL')}

            {/* Row 3, Col 2: AI System Design */}
            {renderCard('SYSTEM_DESIGN')}

            {/* Row 3, Col 3: HR & Behavioral Screen */}
            {renderCard('HR')}
          </div>
        </div>
      </div>

      {/* Mode Selection Modal overlay */}
      {showModeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-8 relative animate-zoom-in">
            {isLaunching ? (
              <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-200">
                <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-[#4A6CF7] animate-spin mb-6" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Initializing Setup Wizard</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs text-center mt-2">Preparing the device check and consent page...</p>
              </div>
            ) : (
              <>
                {/* Close button */}
                <button
                  onClick={() => { setShowModeModal(false); setPendingType(null); }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Select Practice Mode</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8">
                  Choose how you would like to conduct this interactive assessment.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Video + Audio */}
                  <div
                    onClick={() => confirmLaunch('VIDEO_AUDIO')}
                    className="group border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 bg-white dark:bg-slate-800 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Video className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Video + Audio</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Full visual simulation with facial stance tracking. Requires webcam & mic.
                    </p>
                  </div>
                  {/* Card 2: Audio Only */}
                  <div
                    onClick={() => confirmLaunch('AUDIO_ONLY')}
                    className="group border border-slate-200 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-6 bg-white dark:bg-slate-800 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-650 dark:text-sky-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Mic className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Audio Only</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Voice-only practice room mimicking a telephone call. Requires mic only.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
