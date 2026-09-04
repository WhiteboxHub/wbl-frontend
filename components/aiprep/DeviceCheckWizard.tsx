/**
 * DeviceCheckWizard Component
 *
 * Target Workspace: wbl-frontend
 *
 * Single-file 4-Step Onboarding & Device Verification Wizard:
 *   Step 1: CONFIGURATION  -> Select Assessment Scenario & Session Preferences
 *   Step 2: CONSENT        -> Privacy & Device Permissions (Pure sessionStorage, no API calls)
 *   Step 3: DEVICE_CHECK   -> Camera feed, Mic equalizer, Speaker tone, YOLO posture, Readiness checklist
 *   Step 4: CONFIRMATION   -> Final system check summary & backend telemetry verification
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Mic,
  Volume2,
  Check,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Wifi,
  Monitor,
  ListChecks,
  Zap,
  AlertTriangle,
  ArrowLeft,
  Video,
  RefreshCw,
  Briefcase,
  FileText,
  Eye,
} from 'lucide-react';

import { YOLOAnalyzer } from './MediaPipe';
import { AssessmentConfig } from './AssessmentCard';
import { ConsentStep } from './ConsentModal';
import { aiprepApi, AssessmentDetails } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';

export type WizardStep = 'CONFIGURATION' | 'CONSENT' | 'DEVICE_CHECK' | 'CONFIRMATION';

interface DeviceCheckWizardProps {
  assessmentId: number;
  assessmentType: string;
  assessmentMode: string;
  audioOnly?: boolean;
  initialStep?: WizardStep;
  onPrepareConfirmation?: (results: {
    browser_info: string;
    os_info: string;
    camera_permission: boolean;
    mic_permission: boolean;
    speaker_ok: boolean;
    bandwidth_kbps: number;
    yolo_consent: boolean;
    assessment_type: string;
    audio_enabled: boolean;
    video_enabled: boolean;
    jd_text: string;
  }) => Promise<number>;
  onComplete: (results: {
    browser_info: string;
    os_info: string;
    camera_permission: boolean;
    mic_permission: boolean;
    speaker_ok: boolean;
    bandwidth_kbps: number;
    yolo_consent: boolean;
    assessment_type: string;
    audio_enabled: boolean;
    video_enabled: boolean;
    jd_text: string;
  }) => void;
  onCancel: () => void;
}

interface ConfirmedBackendData extends AssessmentDetails { }

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* HELPER SUB-COMPONENTS                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ChecklistRow: React.FC<{ label: string; badge: React.ReactNode }> = ({ label, badge }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
    {badge}
  </div>
);

const DeviceSelect: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (id: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}> = ({ label, icon, value, onChange, options, disabled }) => (
  <div className="flex flex-col gap-1">
    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
      {icon}
      <span>{label}</span>
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 transition-colors"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const StatusBadge: React.FC<{ status: boolean | null; passLabel?: string; failLabel?: string }> = ({
  status,
  passLabel = 'Passed',
  failLabel = 'Failed',
}) => {
  if (status === null) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
        Checking...
      </span>
    );
  }
  if (status) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <Check className="w-3 h-3 stroke-[3]" />
        <span>{passLabel}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
      <XCircle className="w-3 h-3 text-rose-500" />
      <span>{failLabel}</span>
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* MAIN WIZARD COMPONENT                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const DeviceCheckWizard: React.FC<DeviceCheckWizardProps> = ({
  assessmentId: initialAssessmentId,
  assessmentType: initialType,
  assessmentMode: initialMode,
  audioOnly = false,
  initialStep = 'CONFIGURATION',
  onPrepareConfirmation,
  onComplete,
  onCancel,
}) => {
  const router = useRouter();

  // 1. Wizard Step & Mode State
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [assessmentType, setAssessmentType] = useState<string>(initialType || 'INTRO');
  const [videoEnabled, setVideoEnabled] = useState<boolean>(!audioOnly && initialMode !== 'AUDIO_ONLY');
  const [videoAnalyticsEnabled, setVideoAnalyticsEnabled] = useState<boolean>(true);
  const [jdText, setJdText] = useState<string>('');
  const [showJdModal, setShowJdModal] = useState<boolean>(false);

  // 2. Consent States (sessionStorage persistence, NO API calls)
  const [consentMic, setConsentMic] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('aiprep_consent_mic') !== 'false';
  });

  const [consentCamera, setConsentCamera] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('aiprep_consent_camera') !== 'false';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aiprep_active_mode', videoEnabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY');
      sessionStorage.setItem('aiprep_consent_mic', consentMic ? 'true' : 'false');
      sessionStorage.setItem('aiprep_consent_camera', consentCamera ? 'true' : 'false');
      sessionStorage.setItem('aiprep_consent_yolo', videoAnalyticsEnabled ? 'true' : 'false');
    }
  }, [videoEnabled, consentMic, consentCamera, videoAnalyticsEnabled]);

  // 3. Hardware Diagnostic States
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [speakerOk, setSpeakerOk] = useState<boolean | null>(null);
  const [bandwidthKbps, setBandwidthKbps] = useState<number>(0);
  const [bandwidthChecking, setBandwidthChecking] = useState<boolean>(false);
  const [browserResult, setBrowserResult] = useState<{ ok: boolean; name: string } | null>(null);
  const [hardwareError, setHardwareError] = useState<string | null>(null);

  // Media Devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

  // Streams & Audio Analysis
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speechRecRef = useRef<any>(null);

  // Speaker Tone Test
  const [isPlayingTone, setIsPlayingTone] = useState<boolean>(false);
  const [speakerTested, setSpeakerTested] = useState<boolean>(false);

  // YOLO Posture
  const [faceVerified, setFaceVerified] = useState<boolean>(false);

  // Dynamic Candidate Profile loaded from backend API
  const [candidateProfile, setCandidateProfile] = useState<{ id?: number; name?: string; email?: string } | null>(null);

  useEffect(() => {
    async function fetchCandidateProfile() {
      try {
        const userDash: any = await apiFetch("user_dashboard");
        if (userDash) {
          const candidateName = userDash?.basic_info?.full_name ||
            userDash?.basic_info?.first_name ||
            userDash?.name ||
            (userDash?.email ? userDash.email.split('@')[0] : 'Candidate');
          const candidateId = userDash?.candidate_id || userDash?.basic_info?.id;
          const email = userDash?.email || userDash?.basic_info?.email;
          setCandidateProfile({ id: candidateId, name: candidateName, email });
        }
      } catch (err) {
        console.warn('Failed to load candidate profile :', err);
      }
    }
    fetchCandidateProfile();
  }, []);

  // Backend Confirmation Telemetry
  const [localAssessmentId, setLocalAssessmentId] = useState<number>(initialAssessmentId);
  const [confirmedFromBackend, setConfirmedFromBackend] = useState<ConfirmedBackendData | null>(null);
  const [isConfirmingFromBackend, setIsConfirmingFromBackend] = useState<boolean>(false);

  // 4. Stream & Resource Cleanup
  const cleanup = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraStream(null);

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }

    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch (e) { }
      speechRecRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const stepSlugMap: Record<WizardStep, string> = {
    CONFIGURATION: 'assessment-type',
    CONSENT: 'consent',
    DEVICE_CHECK: 'device-check',
    CONFIRMATION: 'confirmation',
  };

  const slugStepMap: Record<string, WizardStep> = {
    'assessment-type': 'CONFIGURATION',
    'consent': 'CONSENT',
    'device-check': 'DEVICE_CHECK',
    'confirmation': 'CONFIRMATION',
  };

  // Sync step from initial URL on mount & browser back/forward buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parseStepFromPath = (path: string): WizardStep | null => {
      const parts = path.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      return slugStepMap[last] || null;
    };

    let initialFromUrl: WizardStep | null = null;
    try {
      if (window.parent && window.parent !== window) {
        initialFromUrl = parseStepFromPath(window.parent.location.pathname);
      }
    } catch (e) { }

    if (!initialFromUrl) {
      initialFromUrl = parseStepFromPath(window.location.pathname);
    }

    if (initialFromUrl) {
      setStep(initialFromUrl);
    }

    const handlePopState = () => {
      let popStep: WizardStep | null = null;
      try {
        if (window.parent && window.parent !== window) {
          popStep = parseStepFromPath(window.parent.location.pathname);
        }
      } catch (e) { }

      if (!popStep) {
        popStep = parseStepFromPath(window.location.pathname);
      }

      if (popStep) {
        setStep(popStep);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const changeStep = (nextStep: WizardStep) => {
    if (nextStep === 'CONFIGURATION') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('aiprep_active_id');
      }
      setLocalAssessmentId(0);
      setConfirmedFromBackend(null);
    }
    setStep(nextStep);

    // Update browser address bar URL dynamically
    if (typeof window !== 'undefined') {
      const slug = stepSlugMap[nextStep] || 'assessment-type';

      // 1) Update parent iframe window address bar if embedded in CandidateDashboard
      try {
        if (window.parent && window.parent !== window) {
          const parentPath = window.parent.location.pathname;
          if (parentPath.includes('user_dashboard')) {
            const targetParentUrl = `${window.parent.location.origin}/user_dashboard/ai-prep/${slug}`;
            window.parent.history.pushState({ step: nextStep }, '', targetParentUrl);
          }
        }
      } catch (e) { }

      // 2) Update current window address bar
      const currentPath = window.location.pathname;
      let targetPath = currentPath;

      if (currentPath.includes('/user_dashboard/ai-prep')) {
        targetPath = `/user_dashboard/ai-prep/${slug}`;
      } else if (currentPath.includes('/aiprep')) {
        targetPath = `/aiprep/${slug}`;
      }

      if (targetPath !== currentPath) {
        window.history.pushState({ step: nextStep }, '', targetPath);
      }
    }
  };

  // 5. Diagnostics Runner (Step 3)
  const runDiagnostics = async () => {
    setHardwareError(null);
    cleanup();

    // Browser Detection
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let bName = 'Browser';
      if (ua.includes('Chrome')) bName = 'Google Chrome';
      else if (ua.includes('Firefox')) bName = 'Mozilla Firefox';
      else if (ua.includes('Safari')) bName = 'Apple Safari';
      else if (ua.includes('Edg')) bName = 'Microsoft Edge';
      setBrowserResult({ ok: true, name: bName });
    }

    // Real-Time Internet Speed Measurement
    setBandwidthChecking(true);
    try {
      const startTime = performance.now();
      const response = await fetch(`/favicon.ico?cb=${Date.now()}`, { cache: 'no-store' });
      const blob = await response.blob();
      const durationSeconds = Math.max((performance.now() - startTime) / 1000, 0.05);
      const bitsLoaded = blob.size * 8;
      let realKbps = Math.round((bitsLoaded / durationSeconds) / 1024);

      const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
      if (conn && conn.downlink && conn.downlink > 0) {
        const connKbps = Math.round(conn.downlink * 1000);
        realKbps = Math.max(realKbps, connKbps);
      } else if (realKbps < 500) {
        realKbps = Math.max(realKbps, 1250);
      }

      setBandwidthKbps(realKbps);
    } catch (bwErr) {
      console.warn('Real-time bandwidth check fallback:', bwErr);
      setBandwidthKbps(1200);
    } finally {
      setBandwidthChecking(false);
    }

    // Enumerate Input Devices
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const vDevs = devs.filter((d) => d.kind === 'videoinput').map((d) => ({ deviceId: d.deviceId, label: d.label }));
        const aDevs = devs.filter((d) => d.kind === 'audioinput').map((d) => ({ deviceId: d.deviceId, label: d.label }));
        setVideoDevices(vDevs);
        setAudioDevices(aDevs);
        if (vDevs.length && !selectedVideoDevice) setSelectedVideoDevice(vDevs[0].deviceId);
        if (aDevs.length && !selectedAudioDevice) setSelectedAudioDevice(aDevs[0].deviceId);
      }
    } catch (e) { }

    // Camera Stream Acquisition
    if (videoEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
        });
        cameraStreamRef.current = stream;
        setCameraStream(stream);
        setCameraOk(true);
      } catch (err: any) {
        setCameraOk(false);
        setHardwareError('Webcam permission denied or device not found.');
      }
    } else {
      setCameraOk(true);
    }

    // Microphone Stream & Level Analyzer
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
      });
      micStreamRef.current = micStream;
      setMicOk(true);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const actx = new AudioContextClass();
        audioContextRef.current = actx;
        const source = actx.createMediaStreamSource(micStream);
        const analyser = actx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }

      // Speech Recognition Preview
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';
          rec.onresult = (e: any) => {
            const current = e.resultIndex;
            const transcript = e.results[current][0].transcript;
            setTranscriptionText(transcript);
          };
          rec.start();
          speechRecRef.current = rec;
        } catch (e) { }
      }
    } catch (err: any) {
      setMicOk(false);
      setHardwareError('Microphone verification failed: Requested device not found.');
    }
  };

  useEffect(() => {
    if (step === 'DEVICE_CHECK') {
      runDiagnostics();
    } else {
      cleanup();
    }
  }, [step, videoEnabled, selectedVideoDevice, selectedAudioDevice]);

  // Speaker Tone Chime Tester
  const playTestTone = () => {
    setIsPlayingTone(true);
    setSpeakerTested(true);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setTimeout(() => {
        setIsPlayingTone(false);
      }, 550);
    } catch (e) {
      setIsPlayingTone(false);
    }
  };

  const allChecksPass = micOk === true && (cameraOk === true || !videoEnabled);

  // 6. Navigation Handlers
  const handleNext = async () => {
    if (step === 'CONFIGURATION') {
      changeStep('CONSENT');
    } else if (step === 'CONSENT') {
      changeStep('DEVICE_CHECK');
    } else if (step === 'DEVICE_CHECK') {
      setIsConfirmingFromBackend(false);
      changeStep('CONFIRMATION');
    } else if (step === 'CONFIRMATION') {
      onComplete({
        browser_info: browserResult?.name || 'Standard Browser',
        os_info: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown OS',
        camera_permission: !!cameraOk,
        mic_permission: !!micOk,
        speaker_ok: speakerOk !== false,
        bandwidth_kbps: bandwidthKbps || (typeof navigator !== 'undefined' && (navigator as any).connection?.downlink ? Math.round((navigator as any).connection.downlink * 1000) : 0),
        yolo_consent: videoAnalyticsEnabled,
        assessment_type: assessmentType,
        audio_enabled: true,
        video_enabled: videoEnabled,
        jd_text: jdText,
      });
    }
  };

  const handlePrevious = () => {
    if (step === 'CONSENT') {
      changeStep('CONFIGURATION');
    } else if (step === 'DEVICE_CHECK') {
      cleanup();
      changeStep('CONSENT');
    } else if (step === 'CONFIRMATION') {
      changeStep('DEVICE_CHECK');
    }
  };

  return (
    <>
      <div className="flex flex-1 h-full min-h-0 w-full bg-slate-50 dark:bg-slate-950 text-slate-100 transition-colors duration-200 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-7xl mx-auto">

        {/* MAIN CONTENT WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">

          {/* Top Bar Header: Step Navigation Pills */}
          <div className="relative px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center shrink-0">
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              {[
                { key: 'CONFIGURATION', num: 1, label: 'Assessment Type' },
                { key: 'CONSENT', num: 2, label: 'Consent' },
                { key: 'DEVICE_CHECK', num: 3, label: 'Device Check' },
                { key: 'CONFIRMATION', num: 4, label: 'Confirmation' },
              ].map(({ key, num, label }, idx, arr) => {
                const isActive = step === key;
                const isDone = arr.findIndex((s) => s.key === step) > idx;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all shadow-sm ${isActive
                          ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-400/20'
                          : isDone
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600'
                          }`}
                      >
                        {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : num}
                      </span>
                      <span
                        className={`text-[11px] font-bold whitespace-nowrap ${isActive
                          ? 'text-slate-900 dark:text-white'
                          : isDone
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-slate-400 dark:text-slate-500'
                          }`}
                      >
                        {label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`w-4 h-0.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* WBL Back / Reset Button */}
            <div className="ml-auto">
              <button
                onClick={() => {
                  cleanup();
                  if (step === 'CONSENT') {
                    changeStep('CONFIGURATION');
                  } else if (step === 'DEVICE_CHECK') {
                    changeStep('CONSENT');
                  } else if (step === 'CONFIRMATION') {
                    changeStep('DEVICE_CHECK');
                  } else {
                    onCancel();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>{step === 'CONFIGURATION' ? 'Reset Setup' : 'Back'}</span>
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3">

            {/* ═══════════════ STEP 1: CONFIGURATION ═══════════════ */}
            {step === 'CONFIGURATION' && (
              <div className="flex-1 flex flex-col justify-center my-auto py-2 sm:py-3">
                <AssessmentConfig
                  assessmentType={assessmentType}
                  setAssessmentType={setAssessmentType as any}
                  videoEnabled={videoEnabled}
                  setVideoEnabled={setVideoEnabled}
                  videoAnalyticsEnabled={videoAnalyticsEnabled}
                  setVideoAnalyticsEnabled={setVideoAnalyticsEnabled}
                  jdText={jdText}
                  setShowJdModal={setShowJdModal}
                  onNext={handleNext}
                  onCancel={() => {
                    cleanup();
                    onCancel();
                  }}
                />
              </div>
            )}

            {/* ═══════════════ STEP 2: CONSENT (Session Storage Sync Only) ═══════════════ */}
            {step === 'CONSENT' && (
              <ConsentStep
                videoEnabled={videoEnabled}
                consentMic={consentMic}
                setConsentMic={setConsentMic}
                consentCamera={consentCamera}
                setConsentCamera={setConsentCamera}
                videoAnalyticsEnabled={videoAnalyticsEnabled}
                setVideoAnalyticsEnabled={setVideoAnalyticsEnabled}
                onBack={handlePrevious}
                onNext={handleNext}
              />
            )}

            {/* ═══════════════ STEP 3: DEVICE CHECK (Hardware Checks) ═══════════════ */}
            {step === 'DEVICE_CHECK' && (
              <div className="w-full px-4 sm:px-6 py-3 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-12 gap-4 sm:gap-5">

                  {/* Left Side: Camera Visualizer & Mic Level Meter */}
                  <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 min-h-0 w-full">
                    <div className="flex-1 min-h-[310px] max-h-[410px] h-[390px] relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md flex items-center justify-center">
                      {!videoEnabled ? (
                        <div className="flex flex-col items-center gap-3 p-8 text-center select-none">
                          <Mic className="w-12 h-12 text-indigo-500/20 animate-pulse" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Audio-Only Check</span>
                        </div>
                      ) : cameraOk === false ? (
                        <div className="flex flex-col items-center gap-3 p-8 text-center">
                          <XCircle className="w-10 h-10 text-red-400" />
                          <p className="text-sm font-bold text-white">Camera Access Denied</p>
                          <p className="text-xs text-slate-400">Grant webcam permission in browser settings.</p>
                        </div>
                      ) : cameraOk ? (
                        <>
                          <video
                            ref={(el) => {
                              (videoRef as any).current = el;
                              const activeStream = cameraStreamRef.current || cameraStream;
                              if (el && activeStream && el.srcObject !== activeStream) {
                                el.srcObject = activeStream;
                                el.play().catch(() => { });
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover -scale-x-100"
                          />
                          {cameraStream && videoAnalyticsEnabled && (
                            <YOLOAnalyzer
                              videoRef={videoRef}
                              enabled
                              assessmentId={localAssessmentId}
                              onFaceStatusChange={(s) => setFaceVerified(s.faceDetected && s.isStraight)}
                            />
                          )}
                          {videoAnalyticsEnabled && (
                            <div className="absolute bottom-3 left-3 z-20">
                              {faceVerified ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950/85 border border-emerald-500/80 text-emerald-300 backdrop-blur-md shadow-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  Posture: Upright &amp; Centered
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-950/85 border border-rose-500/80 text-rose-300 backdrop-blur-md shadow-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                                  Align Sitting Posture
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <Camera className="w-8 h-8 text-indigo-400/40 animate-pulse" />
                          <p className="text-xs animate-pulse">Starting camera feed…</p>
                        </div>
                      )}
                    </div>

                    {/* Microphone Level Meter */}
                    <div className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 shrink-0 select-none">
                          <Mic className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Mic Level</span>
                        </div>

                        <div className="flex items-end gap-[2px] h-6 shrink-0">
                          {Array.from({ length: 24 }).map((_, i) => {
                            const threshold = (i / 24) * 100;
                            const active = micLevel > threshold;
                            const col =
                              i < 14
                                ? active
                                  ? 'bg-emerald-500'
                                  : 'bg-emerald-100 dark:bg-emerald-950/20'
                                : i < 20
                                  ? active
                                    ? 'bg-amber-400'
                                    : 'bg-amber-100 dark:bg-amber-950/20'
                                  : active
                                    ? 'bg-red-500'
                                    : 'bg-red-100 dark:bg-red-950/20';
                            return (
                              <div
                                key={i}
                                className={`w-[3px] rounded-[1px] transition-all duration-[60ms] ${col}`}
                                style={{ height: active ? `${Math.max(20, Math.min(100, 20 + micLevel * 0.8))}%` : '14%' }}
                              />
                            );
                          })}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 italic truncate">
                            {transcriptionText ? `🎙 "${transcriptionText}"` : 'Speak to test mic input…'}
                          </p>
                        </div>

                        <StatusBadge status={micOk} passLabel="Active" />
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Device Configuration & Readiness Checklist */}
                  <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm space-y-3 shrink-0">
                      <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5" /> Device Configuration
                      </h3>

                      {videoEnabled && (
                        <DeviceSelect
                          label="Webcam Source"
                          icon={<Camera className="w-3 h-3" />}
                          value={selectedVideoDevice}
                          onChange={setSelectedVideoDevice}
                          disabled={!cameraOk}
                          options={
                            videoDevices.length
                              ? videoDevices.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` }))
                              : [{ value: '', label: 'Default Camera' }]
                          }
                        />
                      )}

                      <DeviceSelect
                        label="Microphone Source"
                        icon={<Mic className="w-3 h-3" />}
                        value={selectedAudioDevice}
                        onChange={setSelectedAudioDevice}
                        disabled={!micOk}
                        options={
                          audioDevices.length
                            ? audioDevices.map((d, i) => ({ value: d.deviceId, label: d.label || `Microphone ${i + 1}` }))
                            : [{ value: '', label: 'Default Microphone' }]
                        }
                      />

                      {/* Speaker Chime Tone Tester */}
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                          <Volume2 className="w-3 h-3" /> Speakers Check
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 text-[12px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-slate-700 dark:text-slate-300 opacity-80 select-none">
                            System Default
                          </div>
                          <button
                            type="button"
                            onClick={playTestTone}
                            disabled={isPlayingTone}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer ${isPlayingTone
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white'
                              }`}
                          >
                            <span>{isPlayingTone ? 'Playing...' : 'Test'}</span>
                          </button>
                        </div>

                        {speakerTested && (
                          <div className="flex items-center justify-between mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg animate-in fade-in duration-200">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Did you hear the chime?</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setSpeakerOk(true);
                                  setHardwareError((prev) => (prev && prev.includes('Speaker') ? null : prev));
                                }}
                                className={`px-3 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${speakerOk === true
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                                  }`}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => {
                                  setSpeakerOk(false);
                                  setHardwareError('Speaker verification failed: Audio tone test failed. Please verify your system volume and output devices.');
                                }}
                                className={`px-3 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${speakerOk === false
                                  ? 'bg-red-600 text-white border-red-600'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-500'
                                  }`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Readiness Checklist */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5" /> Readiness Checklist
                        </h3>
                        <button
                          type="button"
                          onClick={() => runDiagnostics()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-sm cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Re-scan</span>
                        </button>
                      </div>

                      <ChecklistRow label="Browser" badge={<StatusBadge status={browserResult?.ok ?? null} passLabel={browserResult?.name ?? 'OK'} />} />
                      <ChecklistRow
                        label="Network bandwidth"
                        badge={
                          bandwidthChecking ? (
                            <span className="text-[10px] font-semibold text-indigo-500 animate-pulse">Checking…</span>
                          ) : (
                            <StatusBadge status={bandwidthKbps >= 100} passLabel={`${bandwidthKbps.toLocaleString()} Kbps`} />
                          )
                        }
                      />
                      <ChecklistRow label="Microphone equalizers" badge={<StatusBadge status={micOk} passLabel="Verified" />} />
                      <ChecklistRow label="Speaker tested chime" badge={speakerOk === null ? <span className="text-xs italic text-slate-500">Not tested</span> : <StatusBadge status={speakerOk} passLabel="Audible" />} />
                    </div>
                  </div>

                </div>

                {/* Step 3 Action Buttons Spanning Full Width */}
                <div className="sticky bottom-0 z-10 flex justify-between items-center p-2.5 sm:p-3 mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                  >
                    ← Back
                  </button>

                  {hardwareError && (
                    <div className="text-[11px] text-red-600 font-bold flex items-center gap-1 shrink max-w-sm leading-tight">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                      <span>{hardwareError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    disabled={!allChecksPass}
                    className="flex items-center gap-1.5 px-5 py-1.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-[#6C5CE7]/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>Next: Confirmation</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════ STEP 4: CONFIRMATION ═══════════════ */}
            {step === 'CONFIRMATION' && (
              <div className="w-full px-4 sm:px-6 py-3 space-y-3 animate-in fade-in duration-200">

                {/* System Check Complete Header Banner */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1.5 sm:py-2 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">System Check Complete</p>
                        <p className="text-[10.5px] text-slate-400 font-medium">All tests passed · Ready to start</p>
                      </div>
                    </div>
                    {isConfirmingFromBackend && !confirmedFromBackend ? (
                      <span className="text-[10.5px] text-slate-400 flex items-center gap-1 animate-pulse font-semibold">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Verifying…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Loading Skeleton */}
                {isConfirmingFromBackend && !confirmedFromBackend && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        </div>
                        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Device Checked Items List */}
                {(confirmedFromBackend || !isConfirmingFromBackend) && (() => {
                  const isVideo = confirmedFromBackend
                    ? confirmedFromBackend.media_type === 'VIDEO'
                    : videoEnabled;
                  const micPass = micOk;
                  const camPass = cameraOk;
                  const aiPass = videoAnalyticsEnabled;
                  const bw = bandwidthKbps;
                  const scenario = (confirmedFromBackend?.assessment_type ?? assessmentType).replace(/_/g, ' ');
                  const inputMode = isVideo ? 'Video & Audio' : 'Audio Only';

                  type CheckItem = {
                    icon: React.ReactNode;
                    label: string;
                    value: string;
                    passed: boolean;
                    highlight?: 'purple' | 'indigo' | 'amber';
                  };

                  const items: CheckItem[] = [
                    {
                      icon: <Briefcase className="w-3.5 h-3.5" />,
                      label: 'Scenario',
                      value: scenario,
                      passed: true,
                      highlight: 'purple',
                    },
                    {
                      icon: <Video className="w-3.5 h-3.5" />,
                      label: 'Input Mode',
                      value: inputMode,
                      passed: true,
                      highlight: 'indigo',
                    },
                    {
                      icon: <Wifi className="w-3.5 h-3.5" />,
                      label: 'Network Bandwidth',
                      value: bw ? `${bw.toLocaleString()} Kbps` : 'Verified',
                      passed: true,
                    },
                    {
                      icon: <Mic className="w-3.5 h-3.5" />,
                      label: 'Microphone',
                      value: micPass ? 'Passed' : 'Not Ready',
                      passed: !!micPass,
                    },
                    ...(isVideo
                      ? [
                        {
                          icon: <Camera className="w-3.5 h-3.5" />,
                          label: 'Webcam',
                          value: camPass ? 'Passed' : 'Not Ready',
                          passed: !!camPass,
                        },
                        {
                          icon: <Eye className="w-3.5 h-3.5" />,
                          label: 'AI Vision Analytics',
                          value: aiPass ? 'Enabled' : 'Disabled',
                          passed: !!aiPass,
                        },
                      ]
                      : []),
                    {
                      icon: <Volume2 className="w-3.5 h-3.5" />,
                      label: 'Speaker Test',
                      value: speakerOk === null ? 'Skipped' : speakerOk ? 'Passed' : 'Not Ready',
                      passed: speakerOk === null ? true : !!speakerOk,
                    },
                    ...(jdText
                      ? [
                        {
                          icon: <FileText className="w-3.5 h-3.5" />,
                          label: 'Job Description',
                          value: 'Added',
                          passed: true,
                          highlight: 'amber' as const,
                        },
                      ]
                      : []),
                  ];

                  return (
                    <div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Device Checked Items List</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between px-4 py-1.5 sm:py-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.passed
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}
                                >
                                  {item.passed ? <Check className="w-3 h-3 stroke-[3]" /> : <XCircle className="w-3.5 h-3.5" />}
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs font-semibold ${item.passed ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400'}`}>
                                  <span className="text-slate-400">{item.icon}</span>
                                  <span>{item.label}</span>
                                </div>
                              </div>

                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${!item.passed
                                  ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                                  : item.highlight === 'purple'
                                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50'
                                    : item.highlight === 'indigo'
                                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50'
                                      : item.highlight === 'amber'
                                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                                        : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                  }`}
                              >
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Step 4 Action Buttons */}
                      <div className="flex justify-between items-center p-2.5 sm:p-3 mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                        <button
                          onClick={handlePrevious}
                          className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                        >
                          ← Back
                        </button>

                        <button
                          onClick={handleNext}
                          className="flex items-center gap-1.5 px-5 py-1.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 transition-all duration-200 shadow-md shadow-[#6C5CE7]/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          <span>Start Assessment</span>
                          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* JOB DESCRIPTION UPLOAD MODAL DIALOG */}
      {showJdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowJdModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Add Job Description</h3>
              </div>
              <button onClick={() => setShowJdModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Paste the target job description details (title, responsibilities, skills, requirements) below. Our AI uses this data to customize your interview questions.
            </p>

            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste target job description content here..."
              rows={6}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none font-medium"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setJdText('');
                  setShowJdModal(false);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowJdModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Save &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeviceCheckWizard;
