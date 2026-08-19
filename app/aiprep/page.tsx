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
import { useRouter } from 'next/navigation';
import { aiprepApi, Assessment, AssessmentType, AssessmentMode } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { AssessmentCard, AssessmentMetadata } from '@/components/aiprep/AssessmentCard';
import ThemeToggler from '@/components/Header/ThemeToggler';
import ConsentModal from '@/components/aiprep/ConsentModal';
import { Video, Mic, History, Sparkles, BookOpen, AlertTriangle, FileText, ChevronRight } from 'lucide-react';

const ASSESSMENT_CARDS_META: AssessmentMetadata[] = [
  {
    type: 'GENERAL_INTRO',
    title: 'General Intro Screen',
    description: 'A brief, friendly introductory dialogue covering your professional background and interests. Pausing is disabled to mimic live flow.',
    timeLimit: '90s per question',
    questionCount: '3-5 Questions',
    pauseAllowed: false,
    requiresJd: false,
  },
  {
    type: 'JOB_DESCRIPTION_INTRO',
    title: 'Targeted JD Intro Screen',
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

export default function AIPrepDashboard() {
  const router = useRouter();

  // App state
  const [selectedMode, setSelectedMode] = useState<AssessmentMode>('VIDEO_AUDIO');
  const [jdText, setJdText] = useState<string>('');
  const [selectedType, setSelectedType] = useState<AssessmentType | null>(null);
  
  // Modals / Status
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [history, setHistory] = useState<Assessment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch History on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const isMockMode = typeof window !== 'undefined' && (window.location.search.includes('mock=true') || (!localStorage.getItem('token') && !localStorage.getItem('access_token')));
        
        let candidateId = 7;
        try {
          const userResponse = await apiFetch("user_dashboard");
          if (userResponse?.candidate_id) {
            candidateId = userResponse.candidate_id;
          }
        } catch (profileErr) {
          console.error("Failed to retrieve candidateId, falling back to 7", profileErr);
        }

        if (isMockMode) {
          setHistory([
            {
              id: 101,
              candidate_id: candidateId,
              assessment_type: 'TECHNICAL',
              assessment_mode: 'VIDEO_AUDIO',
              status: 'COMPLETED',
              attempt_number: 1,
              created_at: new Date().toISOString(),
              questions: []
            },
            {
              id: 102,
              candidate_id: candidateId,
              assessment_type: 'GENERAL_INTRO',
              assessment_mode: 'AUDIO_ONLY',
              status: 'FAILED',
              attempt_number: 1,
              created_at: new Date(Date.now() - 86400000).toISOString(),
              questions: []
            }
          ]);
          setIsLoadingHistory(false);
          return;
        }

        const data = await aiprepApi.getDashboard(candidateId);
        // Map history from dashboard response assessments if available
        if (data?.executive_summary?.assessments) {
          setHistory(data.executive_summary.assessments);
        }
      } catch (err) {
        console.error('Error loading assessment history, falling back to mocks:', err);
        // Fallback with correct candidateId
        let fallbackCid = 7;
        try {
          const userResponse = await apiFetch("user_dashboard");
          if (userResponse?.candidate_id) {
            fallbackCid = userResponse.candidate_id;
          }
        } catch {}
        setHistory([
          {
            id: 101,
            candidate_id: fallbackCid,
            assessment_type: 'TECHNICAL',
            assessment_mode: 'VIDEO_AUDIO',
            status: 'COMPLETED',
            attempt_number: 1,
            created_at: new Date().toISOString(),
            questions: []
          }
        ]);
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

    const isMock = typeof window !== 'undefined' && window.location.search.includes('mock=true');
    const mockQuery = isMock ? '&mock=true' : '';
    
    // Save JD text in sessionStorage for retrieval in device-check
    if (type === 'JOB_DESCRIPTION_INTRO') {
      sessionStorage.setItem('aiprep_jd_text', jdText);
    }

    window.open(`/aiprep/device-check?type=${type}&mode=${selectedMode}${mockQuery}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-12 px-6 md:px-12 transition-colors duration-200">
      {/* Top Banner decoration */}
      <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-b from-[#4A6CF7]/10 via-[#f8fafc]/5 to-[#f8fafc] dark:via-slate-900/5 dark:to-slate-900 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-[#4A6CF7] text-sm font-semibold tracking-wider uppercase mb-2">
              <Sparkles className="w-4 h-4 text-[#4A6CF7] animate-pulse" />
              <span>Self-Improvement Platform</span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              AIPrep Interview Coach
            </h1>
            <p className="text-slate-550 dark:text-slate-400 text-sm mt-1 max-w-xl">
              Simulate realistic AI engineering interview stages and receive automated, LLM-powered feedback loops.
            </p>
          </div>

          {/* Mode Selector & Theme Toggle */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl shadow-sm">
              <button
                onClick={() => setSelectedMode('VIDEO_AUDIO')}
                className={`flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${selectedMode === 'VIDEO_AUDIO' ? 'bg-[#4A6CF7] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                <Video className="w-4 h-4" />
                <span>Video + Audio</span>
              </button>
              <button
                onClick={() => setSelectedMode('AUDIO_ONLY')}
                className={`flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${selectedMode === 'AUDIO_ONLY' ? 'bg-[#4A6CF7] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                <Mic className="w-4 h-4" />
                <span>Audio Only</span>
              </button>
            </div>
            <ThemeToggler />
          </div>
        </div>

        {/* Errors banner */}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl mb-8 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Grid: Selector Card Matrix + Details panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cards Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
              <BookOpen className="w-4 h-4 text-[#4A6CF7]" />
              <span>Select Practice Loop</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ASSESSMENT_CARDS_META.map(meta => (
                <AssessmentCard
                  key={meta.type}
                  metadata={meta}
                  selectedMode={selectedMode}
                  onLaunch={handleLaunchAssessment}
                  isSelected={selectedType === meta.type}
                  jdText={jdText}
                />
              ))}
            </div>
          </div>

          {/* Sidebar Panel: JD Paste Box + Practice History */}
          <div className="space-y-8">
            {/* Job Description Textbox */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#4A6CF7]" />
                <span>Job Description Setup</span>
              </h3>
              <p className="text-slate-550 dark:text-slate-400 text-xs mb-4 leading-relaxed">
                Pasting a JD is required for the <strong>Targeted JD Intro Screen</strong>. We use the requirements to build tailored questions.
              </p>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the target job description here..."
                rows={6}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#4A6CF7] transition-colors duration-200 resize-none"
              />
            </div>

            {/* History Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-[#4A6CF7]" />
                <span>Your Practice History</span>
              </h3>

              {isLoadingHistory ? (
                <div className="space-y-4 py-4">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-10 bg-slate-100 dark:bg-slate-950 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map(item => (
                    <div
                      key={item.id}
                      onClick={() => window.open(`/aiprep/reports/${item.id}`, '_blank')}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/60 hover:bg-slate-100/80 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#4A6CF7] dark:group-hover:text-[#4A6CF7] transition-colors">
                          {item.assessment_type.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          item.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-405' :
                          item.status === 'FAILED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-405' :
                          'bg-sky-500/10 border-sky-500/20 text-sky-600 animate-pulse'
                        }`}>
                          {item.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                  No practice sessions recorded yet. Launch your first session above!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
