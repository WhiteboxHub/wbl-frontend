/**
 * DeviceCheckWizard Component
 *
 * Target Workspace: wbl-frontend
 * Primary Developer: Narasimha (FE1)
 *
 * 3-Step High-Fidelity Onboarding Wizard:
 *   Step 1: CONFIGURATION (Select Assessment Type & Preferences - matching mockup)
 *   Step 2: CONSENT (Privacy & Permissions Consent - matching mockup)
 *   Step 3: DEVICE_CHECK (Check & Testing - Camera feed, mic bars, speaker beep, selectors)
 *   Step 4: CONFIRMATION (Configuration review checklist & 3-second test clip recording/replay)
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
  Laptop,
  CheckCircle2,
  XCircle,
  Clock,
  Wifi,
  Monitor,
  ListChecks,
  Lock,
  UserCheck,
  VolumeX,
  Zap,
  AlertTriangle,
  ArrowLeft,
  Video,
  Play,
  Square,
  RefreshCw,
  Info,
  MessageSquare,
  Briefcase,
  Users,
  Code,
  Layout,
  Code2,
  FileText,
  Save,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { YOLOAnalyzer } from './YOLOAnalyzer';
import { AssessmentCard, AssessmentConfig } from './AssessmentCard';
import { ConsentModal } from './ConsentModal';
import { aiprepApi, buildAssessmentCardMetadata, AssessmentType } from '@/lib/aiprep-api';

interface DeviceCheckWizardProps {
  assessmentId: number;
  assessmentType: string;
  assessmentMode: string;
  audioOnly?: boolean;
  initialStep?: WizardStep;
  /** Called when the user passes Device Check. Should create the assessment, save consent & hardware check on backend, and return the new assessmentId. */
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

export type WizardStep = 'CONFIGURATION' | 'CONSENT' | 'DEVICE_CHECK' | 'CONFIRMATION';

const StatusBadge = ({
  status,
  passLabel,
  failLabel,
}: {
  status: boolean | null;
  passLabel: string;
  failLabel?: string;
}) => {
  if (status === null)
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 select-none">
        <Clock className="w-3 h-3 animate-spin" /> Checking
      </span>
    );
  if (status)
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 select-none">
        <CheckCircle2 className="w-3 h-3" /> {passLabel}
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 select-none">
      <XCircle className="w-3 h-3" /> {failLabel ?? 'Failed'}
    </span>
  );
};

const DeviceSelect = ({
  label,
  icon,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-1">
    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
      {icon}
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none text-[12px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px]">
        ▼
      </span>
    </div>
  </div>
);

const ChecklistRow = ({
  label,
  badge,
}: {
  label: string;
  badge: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    {badge}
  </div>
);

export const DeviceCheckWizard: React.FC<DeviceCheckWizardProps> = ({
  assessmentId,
  assessmentType: initialType,
  assessmentMode: initialMode,
  audioOnly: initialAudioOnly = false,
  initialStep,
  onPrepareConfirmation,
  onComplete,
  onCancel,
}) => {
  const router = useRouter();

  // Read persisted wizard step or fall back to URL path / initialStep / CONFIGURATION
  const [step, setStep] = useState<WizardStep>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.endsWith('/consent')) return 'CONSENT';
      if (path.endsWith('/device-check')) return 'DEVICE_CHECK';
      if (path.endsWith('/confirmation')) return 'CONFIRMATION';
      const savedStep = sessionStorage.getItem('aiprep_wizard_step') as WizardStep | null;
      if (savedStep && ['CONFIGURATION', 'CONSENT', 'DEVICE_CHECK', 'CONFIRMATION'].includes(savedStep)) {
        return savedStep;
      }
    }
    return initialStep || 'CONFIGURATION';
  });

  const changeStep = (newStep: WizardStep) => {
    setStep(newStep);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aiprep_wizard_step', newStep);
      const isEmbedded = window.location.search.includes('embed=true');
      const embedQuery = isEmbedded ? '?embed=true' : '';
      let targetPath = '/aiprep';
      if (newStep === 'CONSENT') targetPath = '/aiprep/consent';
      else if (newStep === 'DEVICE_CHECK') targetPath = '/aiprep/device-check';
      else if (newStep === 'CONFIRMATION') targetPath = '/aiprep/confirmation';

      window.history.pushState({ step: newStep }, '', `${targetPath}${embedQuery}`);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.endsWith('/consent')) setStep('CONSENT');
        else if (path.endsWith('/device-check')) setStep('DEVICE_CHECK');
        else if (path.endsWith('/confirmation')) setStep('CONFIRMATION');
        else setStep('CONFIGURATION');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // STEP 1 Configuration States (restored from storage on reload)
  const [assessmentType, setAssessmentType] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('aiprep_active_type');
      if (stored) return stored;
    }
    return initialType || 'GENERAL_INTRO';
  });

  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('aiprep_audio_enabled');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });

  const [videoEnabled, setVideoEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('aiprep_active_mode');
      if (stored !== null) return stored === 'VIDEO_AUDIO';
    }
    return !initialAudioOnly;
  });

  const [videoAnalyticsEnabled, setVideoAnalyticsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('aiprep_yolo_consent');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });



  // Job Description upload modal state
  const [jdText, setJdText] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('aiprep_jd_text') || '';
    }
    return '';
  });
  const [showJdModal, setShowJdModal] = useState(false);

  // CONSENT step state (restored from storage on reload)
  const [consentCamera, setConsentCamera] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('aiprep_consent_camera');
      if (stored !== null) return stored === 'true';
    }
    return !initialAudioOnly;
  });

  const [consentMic, setConsentMic] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('aiprep_consent_mic');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });

  const [consentYolo, setConsentYolo] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('aiprep_consent_yolo') || sessionStorage.getItem('aiprep_yolo_consent');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });
  const consentCanProceed = consentMic && (!videoEnabled || consentCamera);

  // Browser / OS detection
  const [browserResult, setBrowserResult] = useState<{
    ok: boolean;
    name: string;
    os: string;
  } | null>(null);

  // Devices lists
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');

  // Hardware states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [faceVerified, setFaceVerified] = useState(false);

  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [transcriptionText, setTranscriptionText] = useState('');

  const [speakerTested, setSpeakerTested] = useState(false);
  const [speakerOk, setSpeakerOk] = useState<boolean | null>(null);
  const [isPlayingTone, setIsPlayingTone] = useState(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);

  const [bandwidthKbps, setBandwidthKbps] = useState(0);
  const [bandwidthChecking, setBandwidthChecking] = useState(false);

  // 3-second recording test clip (Step 3)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [testVideoUrl, setTestVideoUrl] = useState<string | null>(null);
  const [recordingCountdown, setRecordingCountdown] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAnimRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const prevVideoDeviceRef = useRef('');
  const prevAudioDeviceRef = useRef('');
  const videoDebounceRef = useRef<any>(null);
  const audioDebounceRef = useRef<any>(null);

  // Local assessment ID — starts from prop but gets updated after onPrepareConfirmation resolves
  const [localAssessmentId, setLocalAssessmentId] = useState<number>(assessmentId);

  // Backend-confirmed data fetched when entering CONFIRMATION step
  const [confirmedFromBackend, setConfirmedFromBackend] = useState<{
    assessment_type: string;
    assessment_mode: string;
    hardware?: {
      camera_permission: boolean;
      mic_permission: boolean;
      speaker_ok: boolean;
      bandwidth_kbps: number;
      yolo_model_enabled: boolean;
    };
  } | null>(null);
  const [isConfirmingFromBackend, setIsConfirmingFromBackend] = useState(false);

  // Fetch confirmed data from backend when entering CONFIRMATION step (uses localAssessmentId)
  useEffect(() => {
    if (step !== 'CONFIRMATION' || !localAssessmentId) return;
    let cancelled = false;
    async function fetchBackendConfirmation() {
      setIsConfirmingFromBackend(true);
      try {
        const [assessment, hwChecks] = await Promise.all([
          aiprepApi.getAssessment(localAssessmentId),
          aiprepApi.getHardwareCheck(localAssessmentId).catch(() => null),
        ]);
        if (!cancelled) {
          setConfirmedFromBackend({
            assessment_type: assessment.assessment_type,
            assessment_mode: assessment.assessment_mode,
            hardware: hwChecks ? {
              camera_permission: !!hwChecks.camera_permission,
              mic_permission: !!hwChecks.mic_permission,
              speaker_ok: !!hwChecks.speaker_ok,
              bandwidth_kbps: hwChecks.bandwidth_kbps ?? 0,
              yolo_model_enabled: !!hwChecks.yolo_model_enabled,
            } : undefined,
          });
        }
      } catch (err) {
        console.warn('[Confirmation] Failed to fetch backend-confirmed assessment data:', err);
      } finally {
        if (!cancelled) setIsConfirmingFromBackend(false);
      }
    }
    fetchBackendConfirmation();
    return () => { cancelled = true; };
  }, [step, localAssessmentId]);

  // Ref to track the current step to avoid stale closures in handleDeviceChange
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Browser detection on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent;
    let name = 'Unknown Browser';
    let ok = false;
    if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) { name = 'Google Chrome'; ok = true; }
    else if (ua.includes('Firefox')) { name = 'Mozilla Firefox'; ok = true; }
    else if (ua.includes('Edg')) { name = 'Microsoft Edge'; ok = true; }

    let os = 'Unknown OS';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    setBrowserResult({ ok, name, os });

    const handleDeviceChange = () => {
      if (stepRef.current !== 'DEVICE_CHECK') return;
      const micTrack = micStreamRef.current?.getAudioTracks()[0];
      if (!micTrack || micTrack.readyState === 'ended' || micTrack.muted) {
        setMicOk(false);
        setHardwareError("Hardware disconnection detected: Please check your microphone/headset connection.");
      }
    };

    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => { cleanup(); };
  }, []);

  // Debounced selectors in step 2
  useEffect(() => {
    if (step !== 'DEVICE_CHECK') return;
    if (!selectedVideoDevice || selectedVideoDevice === prevVideoDeviceRef.current) return;
    if (videoDebounceRef.current) clearTimeout(videoDebounceRef.current);
    videoDebounceRef.current = setTimeout(() => {
      prevVideoDeviceRef.current = selectedVideoDevice;
      startCamera(selectedVideoDevice);
    }, 400);
  }, [selectedVideoDevice, step]);

  useEffect(() => {
    if (step !== 'DEVICE_CHECK') return;
    if (!selectedAudioDevice || selectedAudioDevice === prevAudioDeviceRef.current) return;
    if (audioDebounceRef.current) clearTimeout(audioDebounceRef.current);
    audioDebounceRef.current = setTimeout(() => {
      prevAudioDeviceRef.current = selectedAudioDevice;
      startMic(selectedAudioDevice);
    }, 400);
  }, [selectedAudioDevice, step]);

  // Bind video srcObject when entering step 2
  useEffect(() => {
    if (step === 'DEVICE_CHECK') {
      const stream = cameraStreamRef.current;
      if (stream && stream.active) {
        const t = setTimeout(() => {
          if (videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => { });
          }
        }, 80);
        return () => clearTimeout(t);
      }
    }
  }, [step]);

  const cleanup = () => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (micAnimRef.current) cancelAnimationFrame(micAnimRef.current);
    audioContextRef.current?.close().catch(() => { });
    try { recognitionRef.current?.stop(); } catch (_) { }
  };

  const loadDevices = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const vid = all.filter((d) => d.kind === 'videoinput');
      const aud = all.filter((d) => d.kind === 'audioinput');
      setVideoDevices(vid);
      setAudioDevices(aud);
      if (vid.length && !prevVideoDeviceRef.current) {
        setSelectedVideoDevice(vid[0].deviceId);
        prevVideoDeviceRef.current = vid[0].deviceId;
      }
      if (aud.length && !prevAudioDeviceRef.current) {
        setSelectedAudioDevice(aud[0].deviceId);
        prevAudioDeviceRef.current = aud[0].deviceId;
      }
    } catch (e) {
      console.warn('enumerateDevices failed', e);
    }
  };

  const runDiagnostics = (forceVideoEnabled?: boolean) => {
    // Use explicit param when called synchronously after a state update (e.g. from CONSENT step)
    // to avoid reading stale videoEnabled from the React closure.
    const shouldStartCamera = forceVideoEnabled !== undefined ? forceVideoEnabled : (videoEnabled && consentCamera);
    setHardwareError(null);  // Clear any prior errors before re-scan
    startMic();
    if (shouldStartCamera) {
      startCamera();
    } else {
      // Ensure any existing camera tracks are fully stopped in audio-only mode
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      setCameraStream(null);
      setCameraOk(null);
    }
    checkBandwidth();
  };

  // Sync state changes to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aiprep_wizard_step', step);
      sessionStorage.setItem('aiprep_active_type', assessmentType);
      sessionStorage.setItem('aiprep_audio_enabled', String(audioEnabled));
      sessionStorage.setItem('aiprep_active_mode', videoEnabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY');
      sessionStorage.setItem('aiprep_yolo_consent', String(videoAnalyticsEnabled));
      sessionStorage.setItem('aiprep_consent_camera', String(consentCamera));
      sessionStorage.setItem('aiprep_consent_mic', String(consentMic));
      sessionStorage.setItem('aiprep_consent_yolo', String(consentYolo));
      if (jdText) sessionStorage.setItem('aiprep_jd_text', jdText);
    }
  }, [step, assessmentType, audioEnabled, videoEnabled, videoAnalyticsEnabled, consentCamera, consentMic, consentYolo, jdText]);

  // Auto-run diagnostics on entering or reloading into DEVICE_CHECK step
  useEffect(() => {
    if (step === 'DEVICE_CHECK') {
      // Pass explicit value to avoid stale closure reading old videoEnabled
      runDiagnostics(videoEnabled && consentCamera);
    }
  }, [step]);

  const startCamera = async (deviceId?: string) => {
    setCameraOk(null);
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: 640, height: 480 }
          : { width: 640, height: 480 },
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setCameraOk(true);
      if (typeof window !== 'undefined' && sessionStorage.getItem('aiprep_yolo_consent') !== 'true') {
        setFaceVerified(true);
      }
      loadDevices();
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err: any) {
      console.error('Camera stream error:', err);
      setCameraOk(false);
      setHardwareError(`Camera verification failed: ${err.message || 'Webcam is disconnected or blocked. Please grant camera permissions in your browser settings.'}`);
    }
  };

  const startMic = async (deviceId?: string) => {
    setMicOk(null);
    setMicLevel(0);
    setTranscriptionText('');
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (micAnimRef.current) cancelAnimationFrame(micAnimRef.current);
    audioContextRef.current?.close().catch(() => { });
    try { recognitionRef.current?.stop(); } catch (_) { }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      micStreamRef.current = stream;
      setMicOk(true);
      setHardwareError(null);  // Clear stale error once mic is live
      loadDevices();

      // Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      audioAnalyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        if (!audioAnalyserRef.current) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        setMicLevel(avg > 8 ? Math.min(100, Math.round((avg - 8) * 3.8)) : 0);
        micAnimRef.current = requestAnimationFrame(draw);
      };
      draw();

      // Speech recognition
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        try {
          const rec = new SR();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          rec.onresult = (e: any) => {
            let txt = '';
            for (let i = 0; i < e.results.length; i++) {
              txt += e.results[i][0].transcript;
            }
            if (txt.trim()) {
              setTranscriptionText(txt.trim());
            }
          };

          rec.onerror = (err: any) => {
            console.warn('Speech recognition error:', err.error);
          };

          rec.onend = () => {
            if (micStreamRef.current && micStreamRef.current.active) {
              try {
                rec.start();
              } catch (_) { }
            }
          };

          rec.start();
          recognitionRef.current = rec;
        } catch (e) {
          console.warn('SpeechRec start failed:', e);
        }
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMicOk(false);
      setHardwareError(`Microphone verification failed: ${err.message || 'Microphone is disconnected or blocked. Please grant microphone permissions in your browser settings.'}`);
    }
  };

  const checkBandwidth = async () => {
    setBandwidthChecking(true);
    try {
      const t0 = Date.now();
      const res = await fetch('/favicon.ico?cb=' + t0);
      const blob = await res.blob();
      const sec = (Date.now() - t0) / 1000;
      setBandwidthKbps(sec > 0 ? Math.round((blob.size * 8) / 1000 / sec) : 1500);
    } catch {
      setBandwidthKbps(1500);
    } finally {
      setBandwidthChecking(false);
    }
  };

  const playTestTone = async () => {
    try {
      setIsPlayingTone(true);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') await ctx.resume();

      [587, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.5, ctx.currentTime + idx * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.22 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.22);
        osc.stop(ctx.currentTime + idx * 0.22 + 0.35);
      });

      setSpeakerTested(true);
      setTimeout(() => setIsPlayingTone(false), 600);
    } catch {
      setIsPlayingTone(false);
    }
  };

  // 3-second recording test clip
  const startRecordingTest = async () => {
    // Prefer camera stream, fall back to mic — but only if it has active tracks
    const getActiveStream = (): MediaStream | null => {
      const cam = cameraStreamRef.current;
      if (cam && cam.active && cam.getTracks().some(t => t.readyState === 'live')) return cam;
      const mic = micStreamRef.current;
      if (mic && mic.active && mic.getTracks().some(t => t.readyState === 'live')) return mic;
      return null;
    };

    let activeStream = getActiveStream();

    // If no live stream, re-acquire mic
    if (!activeStream) {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = mic;
        activeStream = mic;
      } catch {
        alert('Microphone not accessible. Please allow mic permission and try again.');
        return;
      }
    }

    setRecordedChunks([]);
    setTestVideoUrl(null);
    setIsRecording(true);
    setRecordingCountdown(3);

    // Pick a supported MIME type
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'audio/webm;codecs=opus',
      'audio/webm',
    ];
    const supported = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(activeStream, supported ? { mimeType: supported } : undefined);
    } catch (e) {
      try {
        recorder = new MediaRecorder(activeStream);
      } catch (e2) {
        console.error('MediaRecorder init failed:', e2);
        setIsRecording(false);
        return;
      }
    }

    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };

    recorder.onstop = () => {
      setIsRecording(false);
    };

    recorder.onerror = (e) => {
      console.error('MediaRecorder error:', e);
      setIsRecording(false);
    };

    try {
      recorder.start();
    } catch (e) {
      console.error('recorder.start() failed:', e);
      setIsRecording(false);
      return;
    }

    const interval = setInterval(() => {
      setRecordingCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };


  useEffect(() => {
    if (recordedChunks.length > 0 && recordingCountdown === 0) {
      const blob = new Blob(recordedChunks, { type: !videoEnabled ? 'audio/webm' : 'video/webm' });
      const url = URL.createObjectURL(blob);
      setTestVideoUrl(url);
    }
  }, [recordedChunks, recordingCountdown, videoEnabled]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const allChecksPass =
    !!browserResult?.ok &&
    bandwidthKbps >= 100 &&
    !!micOk &&
    !!speakerOk &&
    // Camera check is skipped when video is disabled or camera consent was not given
    (!videoEnabled || !consentCamera || !!cameraOk);

  const handleNext = () => {
    if (step === 'CONFIGURATION') {
      // Save details to sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('aiprep_active_type', assessmentType);
        sessionStorage.setItem('aiprep_active_mode', videoEnabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY');
        if (assessmentType === 'JOB_DESCRIPTION_INTRO' && jdText) {
          sessionStorage.setItem('aiprep_jd_text', jdText);
        }
        if (!videoEnabled) {
          sessionStorage.setItem('aiprep_consent_camera', 'false');
          sessionStorage.setItem('aiprep_consent_yolo', 'false');
          setConsentCamera(false);
          setConsentYolo(false);
        }
      }
      changeStep('CONSENT');
      return;
    }

    if (step === 'CONSENT') {
      // Compute effective camera state: BOTH the Step 1 video toggle AND the consent checkbox must be true.
      // This prevents consentCamera=true (its default) from re-enabling video when the user chose Audio Only.
      const effectiveCameraEnabled = videoEnabled && consentCamera;
      setVideoEnabled(effectiveCameraEnabled);
      setVideoAnalyticsEnabled(effectiveCameraEnabled && consentYolo);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('aiprep_consent_camera', String(consentCamera));
        sessionStorage.setItem('aiprep_consent_mic', String(consentMic));
        sessionStorage.setItem('aiprep_consent_yolo', String(consentYolo));
      }
      changeStep('DEVICE_CHECK');
      // Pass explicit value — setVideoEnabled is async so runDiagnostics() would read stale state.
      runDiagnostics(effectiveCameraEnabled);
      return;
    }

    if (step === 'DEVICE_CHECK') {
      const micTrack = micStreamRef.current?.getAudioTracks()[0];
      const isMicActive = micTrack && micTrack.readyState === 'live' && !micTrack.muted;

      if (!isMicActive) {
        setMicOk(false);
        setHardwareError("Microphone input signal was disconnected! Please check your connection.");
        return;
      }

      if (videoEnabled) {
        const camTrack = cameraStreamRef.current?.getVideoTracks()[0];
        const isCamActive = camTrack && camTrack.readyState === 'live' && !camTrack.muted;
        if (!isCamActive) {
          setCameraOk(false);
          setHardwareError("Camera stream was disconnected! Please reconnect your webcam.");
          return;
        }
      }

      setHardwareError(null);

      // If onPrepareConfirmation is provided, run backend writes before showing confirmation.
      // This ensures the CONFIRMATION step can display server-verified data.
      if (onPrepareConfirmation) {
        setIsConfirmingFromBackend(true);
        const results = {
          browser_info: browserResult?.name ?? 'Unknown',
          os_info: browserResult?.os ?? 'Unknown',
          camera_permission: videoEnabled && !!cameraOk,
          mic_permission: !!micOk,
          speaker_ok: !!speakerOk,
          bandwidth_kbps: bandwidthKbps,
          yolo_consent: videoAnalyticsEnabled,
          assessment_type: assessmentType,
          audio_enabled: audioEnabled,
          video_enabled: videoEnabled,
          jd_text: jdText,
        };
        onPrepareConfirmation(results)
          .then((newId) => {
            setLocalAssessmentId(newId);
            changeStep('CONFIRMATION');
          })
          .catch((err) => {
            console.error('[DeviceCheckWizard] onPrepareConfirmation failed:', err);
            setHardwareError('Failed to save results to server. Please try again.');
            setIsConfirmingFromBackend(false);
          });
      } else {
        changeStep('CONFIRMATION');
      }
      return;
    }

    // step === 'CONFIRMATION' — assessment already created, just finalize + redirect
    cleanup();
    onComplete({
      browser_info: browserResult?.name ?? 'Unknown',
      os_info: browserResult?.os ?? 'Unknown',
      camera_permission: videoEnabled && !!cameraOk,
      mic_permission: !!micOk,
      speaker_ok: !!speakerOk,
      bandwidth_kbps: bandwidthKbps,
      yolo_consent: videoAnalyticsEnabled,
      assessment_type: assessmentType,
      audio_enabled: audioEnabled,
      video_enabled: videoEnabled,
      jd_text: jdText,
    });
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
    <div className="flex flex-1 min-h-[85vh] w-full bg-slate-50 dark:bg-slate-950 text-slate-100 transition-colors duration-200 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-7xl mx-auto">

      {/* ── MAIN CONTENT WORKSPACE (Full Width) ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">

        {/* Top bar header: steps centered, WBL button pinned right */}
        <div className="relative px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center shrink-0">

          {/* Step pills — absolutely centered */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {[
              { key: 'CONFIGURATION', num: 1, label: 'Assessment Type' },
              { key: 'CONSENT', num: 2, label: 'Privacy & Consent' },
              { key: 'DEVICE_CHECK', num: 3, label: 'Check & Testing' },
              { key: 'CONFIRMATION', num: 4, label: 'Confirmation' },
            ].map(({ key, num, label }, idx, arr) => {
              const isActive = step === key;
              const isDone = arr.findIndex(s => s.key === step) > idx;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all shadow-sm ${isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-400/20'
                      : isDone
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600'
                      }`}>
                      {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : num}
                    </span>
                    <span className={`text-[11px] font-bold whitespace-nowrap ${isActive ? 'text-slate-900 dark:text-white' : isDone ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'
                      }`}>{label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`w-4 h-0.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* WBL Back Button — pinned to right */}
          <div className="ml-auto">
            <button
              onClick={() => { cleanup(); onCancel(); }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to WBL</span>
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4">

          {/* ═══════════════ STEP 1: CONFIGURATION (Mockup Style) ════════════════ */}
          {step === 'CONFIGURATION' && (
            <AssessmentConfig
              assessmentType={assessmentType}
              setAssessmentType={setAssessmentType as any}
              videoEnabled={videoEnabled}
              setVideoEnabled={setVideoEnabled}
              videoAnalyticsEnabled={videoAnalyticsEnabled}
              setVideoAnalyticsEnabled={setVideoAnalyticsEnabled}
              jdText={jdText}
              setShowJdModal={setShowJdModal}
            />
          )}

          {/* ═══════════════ STEP 2: PRIVACY & CONSENT ════════════════ */}
          {step === 'CONSENT' && (
            <div className="max-w-2xl mx-auto w-full space-y-5 animate-in fade-in duration-200">

              <ConsentModal
                isOpen={true}
                onClose={handlePrevious}
                onConfirm={() => { }}
                inline={true}
                audioOnly={!videoEnabled}
                consentCamera={consentCamera}
                setConsentCamera={setConsentCamera}
                consentMic={consentMic}
                setConsentMic={setConsentMic}
                consentYolo={consentYolo}
                setConsentYolo={setConsentYolo}
              />

            </div>
          )}

          {/* ═══════════════ STEP 3: DEVICE CHECK (Hardware Checks) ════════════════ */}
          {step === 'DEVICE_CHECK' && (
            <div className="h-full grid grid-cols-5 gap-5">

              {/* Left side visualizers */}
              <div className="col-span-3 flex flex-col gap-3 min-h-0">
                <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md flex items-center justify-center">
                  {/* Audio-only placeholder: shown when video disabled OR camera consent denied */}
                  {(!videoEnabled || !consentCamera) ? (
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
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                      {cameraStream && videoAnalyticsEnabled && (
                        <YOLOAnalyzer
                          videoRef={videoRef}
                          enabled
                          assessmentId={assessmentId}
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

                {/* Microphone equalizer bars */}
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
                        const col = i < 14 ? active ? 'bg-emerald-500' : 'bg-emerald-100 dark:bg-emerald-950/20' : i < 20 ? active ? 'bg-amber-400' : 'bg-amber-100 dark:bg-amber-950/20' : active ? 'bg-red-500' : 'bg-red-100 dark:bg-red-950/20';
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

              {/* Right side configuration checklists */}
              <div className="col-span-2 flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5">
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
                      options={videoDevices.length ? videoDevices.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` })) : [{ value: '', label: 'Default Camera' }]}
                    />
                  )}

                  <DeviceSelect
                    label="Microphone Source"
                    icon={<Mic className="w-3 h-3" />}
                    value={selectedAudioDevice}
                    onChange={setSelectedAudioDevice}
                    disabled={!micOk}
                    options={audioDevices.length ? audioDevices.map((d, i) => ({ value: d.deviceId, label: d.label || `Microphone ${i + 1}` })) : [{ value: '', label: 'Default Microphone' }]}
                  />

                  {/* Speaker Oscillator Tone */}
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
                        className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[11px] font-bold cursor-pointer ${isPlayingTone ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'
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
                              setHardwareError((prev) => (prev && prev.includes("Speaker") ? null : prev));
                            }}
                            className={`px-3 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${speakerOk === true ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'}`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => {
                              setSpeakerOk(false);
                              setHardwareError("Speaker verification failed: Audio tone test failed. Please verify your system volume and output devices.");
                            }}
                            className={`px-3 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${speakerOk === false ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-500'}`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checklist status card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5" /> Readiness Checklist
                    </h3>
                    <button
                      type="button"
                      onClick={() => runDiagnostics()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4A6CF7] hover:bg-[#3858d6] text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Re-scan</span>
                    </button>
                  </div>

                  <ChecklistRow label="Browser" badge={<StatusBadge status={browserResult?.ok ?? null} passLabel={browserResult?.name ?? 'OK'} />} />
                  <ChecklistRow
                    label="Network bandwidth"
                    badge={bandwidthChecking ? <span className="text-[10px] font-semibold text-indigo-500 animate-pulse">Checking…</span> : <StatusBadge status={bandwidthKbps >= 100} passLabel={`${bandwidthKbps.toLocaleString()} Kbps`} />}
                  />
                  {videoEnabled && <ChecklistRow label="Webcam stream" badge={<StatusBadge status={cameraOk} passLabel="Active" />} />}
                  <ChecklistRow label="Microphone equalizers" badge={<StatusBadge status={micOk} passLabel="Verified" />} />
                  <ChecklistRow label="Speaker tested chime" badge={speakerOk === null ? <span className="text-xs italic text-slate-500">Not tested</span> : <StatusBadge status={speakerOk} passLabel="Audible" />} />
                </div>
              </div>

            </div>
          )}

          {/* ═══════════════ STEP 4: CONFIRMATION ═══════════════════════ */}
          {step === 'CONFIRMATION' && (
            <div className="max-w-2xl mx-auto w-full space-y-5 animate-in fade-in duration-200">

              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-widest text-[#4A6CF7] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Confirmation Checklist
                </span>
                {isConfirmingFromBackend && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Loading from server…
                  </span>
                )}
              </div>

              {/* Loading skeleton while backend data is being fetched */}
              {isConfirmingFromBackend && !confirmedFromBackend && (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl animate-pulse">
                      <div className="h-3 w-28 bg-slate-300 dark:bg-slate-700 rounded-full" />
                      <div className="h-3 w-16 bg-slate-300 dark:bg-slate-700 rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {/* Server-verified banner */}
              {confirmedFromBackend && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-3 py-2 rounded-xl">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  All tests passed
                </div>
              )}

              {(confirmedFromBackend || !isConfirmingFromBackend) && (
                <div className="space-y-2 text-sm">

                  {/* Assessment Type — backend */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Assessment Type</span>
                    </div>
                    <span className="font-bold text-[#4A6CF7]">
                      {(confirmedFromBackend?.assessment_type ?? assessmentType).replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Input Mode — backend */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Input Mode</span>
                    </div>
                    <span className="font-bold text-[#4A6CF7]">
                      {confirmedFromBackend
                        ? (confirmedFromBackend.assessment_mode === 'VIDEO_AUDIO' ? 'VIDEO & AUDIO' : 'AUDIO ONLY')
                        : (videoEnabled ? 'VIDEO & AUDIO' : 'AUDIO ONLY')
                      }
                    </span>
                  </div>

                  {/* Network Bandwidth — backend hardware check */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Network Bandwidth</span>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {confirmedFromBackend?.hardware
                        ? `${confirmedFromBackend.hardware.bandwidth_kbps.toLocaleString()} Kbps`
                        : (bandwidthKbps ? `${bandwidthKbps} Kbps` : 'Verified')
                      }
                    </span>
                  </div>

                  {/* Microphone — backend hardware check */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Microphone</span>
                    </div>
                    {(() => {
                      const ok = confirmedFromBackend?.hardware ? confirmedFromBackend.hardware.mic_permission : micOk;
                      return <span className={`font-bold ${ok ? 'text-emerald-600' : 'text-red-500'}`}>{ok ? 'Verified' : 'Not Ready'}</span>;
                    })()}
                  </div>

                  {/* Webcam — backend hardware check (only if video mode) */}
                  {(confirmedFromBackend
                    ? confirmedFromBackend.assessment_mode === 'VIDEO_AUDIO'
                    : videoEnabled
                  ) && (
                    <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-500">Webcam</span>
                      </div>
                      {(() => {
                        const ok = confirmedFromBackend?.hardware ? confirmedFromBackend.hardware.camera_permission : cameraOk;
                        return <span className={`font-bold ${ok ? 'text-emerald-600' : 'text-red-500'}`}>{ok ? 'Active' : 'Not Ready'}</span>;
                      })()}
                    </div>
                  )}

                  {/* Video Analytics / YOLO — backend hardware check */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">AI Vision Analytics</span>
                    </div>
                    {(() => {
                      const enabled = confirmedFromBackend?.hardware
                        ? confirmedFromBackend.hardware.yolo_model_enabled
                        : videoAnalyticsEnabled;
                      return <span className={`font-bold ${enabled ? 'text-emerald-600' : 'text-slate-400'}`}>{enabled ? 'Enabled' : 'Disabled'}</span>;
                    })()}
                  </div>



                  {/* Speaker test — local only (no backend field) */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <span className="font-semibold text-slate-500">Speaker Test</span>
                    <span className={`font-bold ${speakerOk ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {speakerOk === null ? 'Not tested' : speakerOk ? 'Audible' : 'Not Ready'}
                    </span>
                  </div>

                  {jdText && (
                    <div className="flex items-center justify-between p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                      <span className="font-semibold text-slate-500">Job Description</span>
                      <span className="font-bold text-amber-600">Added ✓</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


        </div>

        {/* ── ACTIONS FOOTER ROW ── */}
        <div className="flex justify-between items-center px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">

          {/* Left */}
          {step === 'CONFIGURATION' ? (
            <button
              onClick={() => { cleanup(); onCancel(); }}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm cursor-pointer"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handlePrevious}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm cursor-pointer"
            >
              ← Back
            </button>
          )}

          {/* Hardware warning flag */}
          {step === 'DEVICE_CHECK' && hardwareError && (
            <div className="text-[11px] text-red-600 font-bold flex items-center gap-1 shrink max-w-sm leading-tight">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
              <span>{hardwareError}</span>
            </div>
          )}

          <button
            onClick={handleNext}
            disabled={
              (step === 'CONSENT' && !consentCanProceed) ||
              (step === 'DEVICE_CHECK' && !allChecksPass)
            }
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
          >
            {step === 'CONFIGURATION' ? 'Next: Privacy & Consent' : step === 'CONSENT' ? 'Next: Check & Testing' : step === 'DEVICE_CHECK' ? 'Next: Confirmation' : 'Start Assessment'}
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

      </div>

      {/* ── JOB DESCRIPTION UPLOAD MODAL DIALOG ── */}
      {showJdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowJdModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Add Job Description</h3>
              </div>
              <button
                onClick={() => setShowJdModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
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
                onClick={() => { setJdText(''); setShowJdModal(false); }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowJdModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Save &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeviceCheckWizard;
