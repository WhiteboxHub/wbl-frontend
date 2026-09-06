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
import { createPortal } from 'react-dom';
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
  ArrowLeft,
  Video,
  RefreshCw,
  Briefcase,
  FileText,
  Eye,
  Lock,
  ShieldAlert,
  X,
  ChevronDown,
  Play,
  Globe,
} from 'lucide-react';

import { AssessmentConfig } from './AssessmentCard';
import { ConsentStep } from './ConsentModal';
import { aiprepApi, AssessmentDetails, AssessmentType } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';

const cleanDeviceLabel = (label: string, fallback: string = 'Device') => {
  if (!label) return fallback;
  let cleaned = label
    .replace(/^(Default|Communications)\s*-\s*/i, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\{[^}]*\}/g, '')
    .trim();
  if (cleaned.length > 30) {
    cleaned = cleaned.substring(0, 28) + '...';
  }
  return cleaned || fallback;
};

const filterUniqueDevices = (devs: MediaDeviceInfo[], defaultFallback: string) => {
  const seen = new Set<string>();
  const result: { deviceId: string; label: string }[] = [];
  for (const d of devs) {
    const cleaned = cleanDeviceLabel(d.label, defaultFallback);
    if (!seen.has(cleaned)) {
      seen.add(cleaned);
      result.push({ deviceId: d.deviceId, label: cleaned });
    }
  }
  return result;
};

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
  const [assessmentType, setAssessmentType] = useState<AssessmentType>((initialType as AssessmentType) || 'INTRO');
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

  const [consentSaveRecording, setConsentSaveRecording] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('aiprep_consent_recording') !== 'false';
  });

  const [consentSaveTranscript, setConsentSaveTranscript] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('aiprep_consent_transcript') !== 'false';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aiprep_active_mode', videoEnabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY');
      sessionStorage.setItem('aiprep_consent_mic', consentMic ? 'true' : 'false');
      sessionStorage.setItem('aiprep_consent_camera', consentCamera ? 'true' : 'false');
      sessionStorage.setItem('aiprep_consent_yolo', videoAnalyticsEnabled ? 'true' : 'false');
      sessionStorage.setItem('aiprep_consent_recording', consentSaveRecording ? 'true' : 'false');
      sessionStorage.setItem('aiprep_consent_transcript', consentSaveTranscript ? 'true' : 'false');
    }
  }, [videoEnabled, consentMic, consentCamera, videoAnalyticsEnabled, consentSaveRecording, consentSaveTranscript]);

  // Full-screen Viewport Expansion (hides parent left sidebar, top header & bottom footer ONLY during DEVICE_CHECK & CONFIRMATION steps)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isFullScreenStep = step === 'DEVICE_CHECK' || step === 'CONFIRMATION';
    if (!isFullScreenStep) return;

    // Lock local body overflow
    const origBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let parentIframe: HTMLElement | null = null;
    let origIframeCssText = '';
    let origParentBodyOverflow = '';

    // If hosted inside CandidateDashboard iframe
    if (window.parent && window.parent !== window) {
      try {
        const parentDoc = window.parent.document;
        origParentBodyOverflow = parentDoc.body.style.overflow;
        parentDoc.body.style.setProperty('overflow', 'hidden', 'important');

        const iframes = parentDoc.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
          const f = iframes[i];
          if (f.contentWindow === window || (f.src && f.src.includes('aiprep'))) {
            parentIframe = f as HTMLElement;
            break;
          }
        }

        if (parentIframe) {
          origIframeCssText = parentIframe.style.cssText;
          parentIframe.style.setProperty('position', 'fixed', 'important');
          parentIframe.style.setProperty('top', '0px', 'important');
          parentIframe.style.setProperty('left', '0px', 'important');
          parentIframe.style.setProperty('width', '100vw', 'important');
          parentIframe.style.setProperty('height', '100vh', 'important');
          parentIframe.style.setProperty('z-index', '999999', 'important');
          parentIframe.style.setProperty('margin', '0px', 'important');
          parentIframe.style.setProperty('padding', '0px', 'important');
        }
      } catch (e) {
        console.warn('Full-screen parent iframe expansion note:', e);
      }
    }

    return () => {
      document.body.style.overflow = origBodyOverflow;
      if (window.parent && window.parent !== window) {
        try {
          if (parentIframe) {
            parentIframe.style.cssText = origIframeCssText;
          }
          window.parent.document.body.style.overflow = origParentBodyOverflow;
        } catch (e) { }
      }
    };
  }, [step]);

  // 3. Hardware Diagnostic States
  // Media Device UI State: 'disabled' | 'enabling' | 'enabled' | 'error'
  const [deviceState, setDeviceState] = useState<'disabled' | 'enabling' | 'enabled' | 'error'>('disabled');
  const [deviceErrorMsg, setDeviceErrorMsg] = useState<string | null>(null);

  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [speakerOk, setSpeakerOk] = useState<boolean | null>(null);
  const [bandwidthKbps, setBandwidthKbps] = useState<number>(0);
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const [bandwidthChecking, setBandwidthChecking] = useState<boolean>(false);
  const [browserResult, setBrowserResult] = useState<{ ok: boolean; name: string } | null>(null);
  const [hardwareError, setHardwareError] = useState<string | null>(null);
  const [errorModalDismissed, setErrorModalDismissed] = useState<boolean>(false);
  const [manualErrorModalType, setManualErrorModalType] = useState<'MIC' | 'CAMERA' | 'SPEAKER' | 'ALL' | null>(null);

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
  const [micTesting, setMicTesting] = useState<boolean>(false);
  const [micTested, setMicTested] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speechRecRef = useRef<any>(null);
  const micTestingRef = useRef<boolean>(false);

  // Speaker Audio Chime Test State
  const [speakerTestState, setSpeakerTestState] = useState<'idle' | 'playing' | 'confirming'>('idle');
  const [speakerTested, setSpeakerTested] = useState<boolean>(false);



  // Real-Time Hardware Hot-Plugging / Unplugging Detection (Decoupled Camera & Audio)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

    const handleDeviceChange = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const rawVDevs = devs.filter((d: any) => d.kind === 'videoinput');
        const rawADevs = devs.filter((d: any) => d.kind === 'audioinput');
        const vDevs = filterUniqueDevices(rawVDevs, 'Integrated Webcam');
        const aDevs = filterUniqueDevices(rawADevs, 'Default Microphone');
        setVideoDevices(vDevs);
        setAudioDevices(aDevs);

        // 1. Maintain camera if it is healthy, or reconnect to default if disconnected
        const camTrack = cameraStreamRef.current?.getVideoTracks()[0];
        const isCamAlive = camTrack && camTrack.readyState === 'live' && !camTrack.muted;
        if (!isCamAlive && videoEnabled && vDevs.length > 0) {
          const nextVid = selectedVideoDevice && vDevs.some((d) => d.deviceId === selectedVideoDevice)
            ? selectedVideoDevice
            : vDevs[0].deviceId;
          setSelectedVideoDevice(nextVid);
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: nextVid ? { deviceId: { exact: nextVid } } : true });
            cameraStreamRef.current = stream;
            setCameraStream(stream);
            setCameraOk(true);
          } catch (e) { }
        }

        // 2. If headset / mic was unplugged, cleanly switch to default built-in mic without interrupting camera
        if (selectedAudioDevice && !aDevs.some((d) => d.deviceId === selectedAudioDevice)) {
          const nextAud = aDevs.length > 0 ? aDevs[0].deviceId : '';
          setSelectedAudioDevice(nextAud);
          try {
            cleanup('AUDIO_ONLY');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: nextAud ? { deviceId: { exact: nextAud } } : true });
            micStreamRef.current = stream;
            setMicOk(true);
          } catch (e) { }
        }
      } catch (e) {
        console.warn('Real-time devicechange listener error:', e);
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [selectedVideoDevice, selectedAudioDevice, videoEnabled]);

  // Dynamic Candidate Profile loaded from backend API (Instant cache-first load on reload)
  const [candidateProfile, setCandidateProfile] = useState<{ id?: number; name?: string; email?: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem('aiprep_cached_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

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
          const profile = { id: candidateId, name: candidateName, email };
          setCandidateProfile(profile);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('aiprep_cached_profile', JSON.stringify(profile));
          }
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

  // 4. Stream & Resource Scoped Cleanup (Decoupled)
  const cleanup = (scope: 'ALL' | 'AUDIO_ONLY' | 'VIDEO_ONLY' = 'ALL') => {
    if (scope === 'ALL' || scope === 'VIDEO_ONLY') {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      setCameraStream(null);
    }

    if (scope === 'ALL' || scope === 'AUDIO_ONLY') {
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
      micTestingRef.current = false;
      setMicLevel(0);
      setSpeakerTestState('idle');
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

  // 5. Diagnostics Runner (Step 3) - High-Speed Concurrent Execution
  const runDiagnostics = async () => {
    setHardwareError(null);
    setErrorModalDismissed(false);
    setTranscriptionText('');
    // Scoped cleanup of audio only so live camera stream is not interrupted on audio device changes
    cleanup('AUDIO_ONLY');

    // Browser Detection (Instant)
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let bName = 'Browser';
      if (ua.includes('Chrome')) bName = 'Google Chrome';
      else if (ua.includes('Firefox')) bName = 'Mozilla Firefox';
      else if (ua.includes('Safari')) bName = 'Apple Safari';
      else if (ua.includes('Edg')) bName = 'Microsoft Edge';
      setBrowserResult({ ok: true, name: bName });
    }

    // Fast Instant Bandwidth Baseline + Non-blocking Background Measurement
    const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    const fastKbps = conn && conn.downlink && conn.downlink > 0 ? Math.round(conn.downlink * 1000) : 10000;
    setBandwidthKbps(fastKbps);

    // Run active speed test asynchronously in the background so it doesn't delay hardware initialization
    (async () => {
      setBandwidthChecking(true);
      try {
        const startTime = performance.now();
        const response = await fetch(`/favicon.ico?cb=${Date.now()}`, { cache: 'no-store' });
        const blob = await response.blob();
        const durationSeconds = Math.max((performance.now() - startTime) / 1000, 0.05);
        const bitsLoaded = blob.size * 8;
        let realKbps = Math.round((bitsLoaded / durationSeconds) / 1024);
        if (conn && conn.downlink && conn.downlink > 0) {
          realKbps = Math.max(realKbps, Math.round(conn.downlink * 1000));
        }
        setBandwidthKbps(realKbps);
      } catch (bwErr) {
        setBandwidthKbps(fastKbps);
      } finally {
        setBandwidthChecking(false);
      }
    })();

    // Concurrent Parallel Media Stream Acquisition & Device Enumeration with Resilient Fallbacks
    const videoPromise = (videoEnabled && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia)
      ? (async () => {
        // If camera stream is already running and healthy, preserve it without interruption
        const existingTrack = cameraStreamRef.current?.getVideoTracks()[0];
        const existingDeviceId = existingTrack?.getSettings?.()?.deviceId;
        if (existingTrack && existingTrack.readyState === 'live' && !existingTrack.muted) {
          if (!selectedVideoDevice || existingDeviceId === selectedVideoDevice) {
            return cameraStreamRef.current;
          }
        }
        cleanup('VIDEO_ONLY');
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
          });
        } catch (vErr: any) {
          return await navigator.mediaDevices.getUserMedia({ video: true });
        }
      })()
      : Promise.resolve(null);

    const audioPromise = (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia)
      ? (async () => {
        try {
          return await navigator.mediaDevices.getUserMedia({
            audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
          });
        } catch (aErr: any) {
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      })()
      : Promise.reject(new Error('MediaDevices unavailable'));

    const enumPromise = (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices)
      ? navigator.mediaDevices.enumerateDevices()
      : Promise.resolve([]);

    const [vRes, aRes, dRes] = await Promise.allSettled([videoPromise, audioPromise, enumPromise]);

    let anyError = false;

    // Handle Camera Stream Result
    if (videoEnabled) {
      if (vRes.status === 'fulfilled' && vRes.value) {
        const stream = vRes.value as MediaStream;
        const videoTracks = stream.getVideoTracks();
        if (!videoTracks || videoTracks.length === 0 || !videoTracks[0].enabled || videoTracks[0].readyState !== 'live') {
          anyError = true;
          setCameraOk(false);
          setCameraStream(null);
          setDeviceErrorMsg('Camera track is inactive, turned off, or unavailable.');
          setHardwareError('Camera track is inactive, turned off, or unavailable.');
        } else {
          const track = videoTracks[0];
          track.onended = () => {
            setCameraOk(false);
            setCameraStream(null);
          };
          track.onmute = () => {
            setCameraOk(false);
          };
          track.onunmute = () => {
            setCameraOk(true);
          };

          cameraStreamRef.current = stream;
          setCameraStream(stream);
          setCameraOk(true);
        }
      } else if (vRes.status === 'rejected') {
        anyError = true;
        setCameraOk(false);
        setCameraStream(null);
        const err: any = vRes.reason;
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setDeviceErrorMsg('Permission denied. Please allow camera access in browser settings.');
          setHardwareError('Permission denied. Please allow camera access in browser settings.');
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          setDeviceErrorMsg('No camera found on this device.');
          setHardwareError('No camera found on this device.');
        } else {
          setDeviceErrorMsg(err?.message || 'Camera is off or unavailable.');
          setHardwareError(err?.message || 'Camera is off or unavailable.');
        }
      }
    } else {
      setCameraOk(false);
      setCameraStream(null);
    }

    // Handle Microphone Stream Result & Level Analyzer
    if (aRes.status === 'fulfilled' && aRes.value) {
      const micStream = aRes.value as MediaStream;
      micStreamRef.current = micStream;

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
          if (!micTestingRef.current) {
            setMicLevel(0);
            animFrameRef.current = requestAnimationFrame(updateLevel);
            return;
          }
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          // Apply a noise floor threshold (ignore ambient noise below 18)
          if (avg < 18) {
            setMicLevel(0);
          } else {
            const normalized = Math.min(100, Math.round(((avg - 18) / 90) * 100));
            setMicLevel(normalized);
          }
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }
    } else if (aRes.status === 'rejected') {
      anyError = true;
      setMicOk(false);
      setMicTested(true);
      const err: any = aRes.reason;
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setDeviceErrorMsg('Permission denied. Please allow camera/mic access in browser settings.');
        setHardwareError('Permission denied. Please allow camera/mic access in browser settings.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setDeviceErrorMsg('No camera or microphone found on this device.');
        setHardwareError('No camera or microphone found on this device.');
      } else {
        setDeviceErrorMsg(err?.message || 'Microphone verification failed: Requested device not found.');
        setHardwareError(err?.message || 'Microphone verification failed: Requested device not found.');
      }
    }

    // Populate Enumerate Devices
    try {
      let devs: MediaDeviceInfo[] = [];
      if (dRes.status === 'fulfilled' && (dRes.value as any[]).length > 0) {
        devs = dRes.value as MediaDeviceInfo[];
      }
      if ((!devs.length || !devs.some((d) => d.label)) && navigator.mediaDevices?.enumerateDevices) {
        devs = await navigator.mediaDevices.enumerateDevices();
      }
      const rawVDevs = devs.filter((d: any) => d.kind === 'videoinput');
      const rawADevs = devs.filter((d: any) => d.kind === 'audioinput');
      const vDevs = filterUniqueDevices(rawVDevs, 'Integrated Webcam');
      const aDevs = filterUniqueDevices(rawADevs, 'Default Microphone');
      setVideoDevices(vDevs);
      setAudioDevices(aDevs);
      if (vDevs.length && !selectedVideoDevice) setSelectedVideoDevice(vDevs[0].deviceId);
      if (aDevs.length && !selectedAudioDevice) setSelectedAudioDevice(aDevs[0].deviceId);
    } catch (e) { }

    if (anyError) {
      setDeviceState('error');
    } else {
      setDeviceState('enabled');
      setDeviceErrorMsg(null);
    }
  };

  const enableDevices = async () => {
    setDeviceErrorMsg(null);
    setDeviceState('enabling');
    await runDiagnostics();
  };

  const disableDevices = () => {
    cleanup();
    setCameraOk(false);
    setMicOk(false);
    setMicTested(false);
    setDeviceState('disabled');
  };

  const [testingCamera, setTestingCamera] = useState<boolean>(false);

  const testCamera = async () => {
    if (testingCamera || !videoEnabled) return;
    setTestingCamera(true);
    setManualErrorModalType(null);
    try {
      cleanup('VIDEO_ONLY');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setCameraOk(true);
      setDeviceState('enabled');
    } catch (err: any) {
      console.warn('Camera verification error:', err);
      setCameraOk(false);
      setCameraStream(null);
      setErrorModalDismissed(false);
      if (micOk === false) {
        setManualErrorModalType('ALL');
      } else {
        setManualErrorModalType('CAMERA');
      }
    } finally {
      setTestingCamera(false);
    }
  };

  const testMicrophone = async () => {
    if (micTesting) return;
    micTestingRef.current = true;
    setMicTesting(true);
    setTranscriptionText('');
    setManualErrorModalType(null);

    try {
      let stream = micStreamRef.current;
      if (!stream || !stream.active || stream.getAudioTracks().length === 0 || stream.getAudioTracks()[0].readyState !== 'live') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
        });
        micStreamRef.current = stream;
      }

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0 || audioTracks[0].readyState !== 'live') {
        throw new Error('Microphone is inactive or unavailable.');
      }

      // Start Speech Recognition ONLY when Test Mic is clicked
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          if (speechRecRef.current) {
            try { speechRecRef.current.stop(); } catch (e) { }
          }
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';
          rec.onresult = (e: any) => {
            const lastIdx = e.results.length - 1;
            const latestChunk = e.results[lastIdx]?.[0]?.transcript || '';
            if (latestChunk.trim()) {
              setTranscriptionText(latestChunk.trim());
            }
          };
          rec.onerror = () => { };
          rec.onend = () => { };
          rec.start();
          speechRecRef.current = rec;
        } catch (e) { }
      }

      // Listening test window: 4 seconds for user to speak
      await new Promise((res) => setTimeout(res, 4000));

      if (speechRecRef.current) {
        try { speechRecRef.current.stop(); } catch (e) { }
        speechRecRef.current = null;
      }

      setMicOk(true);
      setMicTested(true);
      setDeviceState('enabled');
      setDeviceErrorMsg(null);
      setManualErrorModalType(null);
    } catch (err: any) {
      console.warn('Microphone verification error:', err);
      setMicOk(false);
      setMicTested(true);
      setDeviceErrorMsg(err?.message || 'Microphone test failed.');
      setErrorModalDismissed(false);
      if (videoEnabled && cameraOk === false) {
        setManualErrorModalType('ALL');
      } else {
        setManualErrorModalType('MIC');
      }
    } finally {
      micTestingRef.current = false;
      setMicLevel(0);
      setMicTesting(false);
    }
  };

  useEffect(() => {
    if (step === 'DEVICE_CHECK') {
      if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
        (navigator as any).permissions
          .query({ name: 'microphone' as any })
          .then((status: any) => {
            if (status.state === 'denied') {
              setDeviceErrorMsg('Permission denied. Please allow camera/mic access in browser settings.');
              setDeviceState('error');
            }
          })
          .catch(() => { });

        (navigator as any).permissions
          .query({ name: 'speaker-selection' as any })
          .then((status: any) => {
            if (status.state === 'denied') {
              setSpeakerOk(false);
              setSpeakerTested(true);
            }
          })
          .catch(() => { });
      }
      runDiagnostics();
    } else {
      cleanup();
    }
  }, [step, videoEnabled, selectedVideoDevice, selectedAudioDevice]);

  useEffect(() => {
    if (videoRef.current) {
      if (cameraStream) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraStream]);

  // Harmonic chime tone generator for speaker testing (C5 -> E5 -> G5 -> C6)
  const playChimeTone = async () => {
    if (speakerTestState === 'playing') return;

    setSpeakerTestState('playing');

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Audio playback is not supported on this browser.');
      }

      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // If site sound is blocked/turned off in browser settings, AudioContext remains suspended
      if (ctx.state !== 'running') {
        throw new Error('Sound is turned off or blocked in browser settings.');
      }

      // Test HTML5 Audio element playability for site permission verification
      try {
        const testAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        testAudio.volume = 0.05;
        const playP = testAudio.play();
        if (playP !== undefined) {
          await playP;
          testAudio.pause();
        }
      } catch (audioErr) {
        console.warn('HTML5 Audio playback blocked:', audioErr);
        throw new Error('Sound is blocked by browser site permissions.');
      }

      // 4-note melodic ascending chime (C5 -> E5 -> G5 -> C6)
      const notes = [
        { freq: 523.25, time: 0, duration: 0.3 },
        { freq: 659.25, time: 0.12, duration: 0.3 },
        { freq: 783.99, time: 0.24, duration: 0.4 },
        { freq: 1046.50, time: 0.36, duration: 0.55 },
      ];

      const now = ctx.currentTime;
      notes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.2, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration + 0.05);
      });

      setTimeout(() => {
        setSpeakerTestState('confirming');
        try { ctx.close(); } catch (e) { }
      }, 950);
    } catch (e: any) {
      console.warn('Chime playback error / Sound blocked:', e);
      setSpeakerTestState('idle');
      setSpeakerTested(true);
      setSpeakerOk(false);
    }
  };

  const allChecksPass =
    !!browserResult?.ok &&
    !bandwidthChecking &&
    bandwidthKbps > 0 &&
    micOk === true &&
    micTested === true &&
    speakerOk === true &&
    speakerTested === true &&
    (!videoEnabled || cameraOk === true);

  // 6. Navigation Handlers
  const handleNext = async () => {
    if (step === 'CONFIGURATION') {
      changeStep('CONSENT');
    } else if (step === 'CONSENT') {
      changeStep('DEVICE_CHECK');
    } else if (step === 'DEVICE_CHECK') {
      if (onPrepareConfirmation) {
        setIsConfirmingFromBackend(true);
        try {
          await onPrepareConfirmation({
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
        } catch (e) {
          console.error('Confirmation payload prep error:', e);
        } finally {
          setIsConfirmingFromBackend(false);
        }
      }
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
    <div
      className={
        step === 'DEVICE_CHECK' || step === 'CONFIRMATION'
          ? "fixed inset-0 z-[99999] w-screen h-screen bg-slate-100/80 dark:bg-[#070b14] flex items-center justify-center p-2 sm:p-3 overflow-hidden select-none"
          : "w-full h-full flex-1 flex flex-col p-1 sm:p-2 select-none"
      }
    >
      {/* SINGLE UNIFIED WIZARD CARD - FULL WIDTH, COMPACT HEIGHT */}
      <div
        className={
          step === 'DEVICE_CHECK' || step === 'CONFIRMATION'
            ? "w-full max-w-[98vw] 2xl:max-w-[1700px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/70 overflow-hidden flex flex-col max-h-[88vh] my-auto transition-all animate-in fade-in duration-200"
            : "w-full flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all animate-in fade-in duration-200"
        }
      >

        {/* Top Bar Header: Non-interactive Step Indicator Pills */}
        <div className="relative px-4 sm:px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center shrink-0">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            {[
              { key: 'CONFIGURATION', num: 1, label: 'Assessment Type' },
              { key: 'CONSENT', num: 2, label: 'Media & Consent' },
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
        <div className={`flex-1 min-h-0 overflow-y-auto ${step === 'CONSENT' || step === 'CONFIGURATION' ? 'p-2 sm:p-4 justify-start' : 'p-3 sm:p-5 justify-center'} flex flex-col items-center`}>

          {/* ═══════════════ STEP 1: CONFIGURATION ═══════════════ */}
          {step === 'CONFIGURATION' && (
            <div className="w-full max-w-6xl xl:max-w-7xl mx-auto my-auto flex flex-col py-1">
              <AssessmentConfig
                assessmentType={assessmentType}
                setAssessmentType={setAssessmentType}
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
            <div className="w-full max-w-6xl mx-auto mt-0 mb-auto flex flex-col py-0">
              <ConsentStep
                videoEnabled={videoEnabled}
                setVideoEnabled={setVideoEnabled}
                consentMic={consentMic}
                setConsentMic={setConsentMic}
                consentCamera={consentCamera}
                setConsentCamera={setConsentCamera}
                videoAnalyticsEnabled={videoAnalyticsEnabled}
                setVideoAnalyticsEnabled={setVideoAnalyticsEnabled}
                consentSaveRecording={consentSaveRecording}
                setConsentSaveRecording={setConsentSaveRecording}
                consentSaveTranscript={consentSaveTranscript}
                setConsentSaveTranscript={setConsentSaveTranscript}
                onBack={handlePrevious}
                onNext={handleNext}
              />
            </div>
          )}

          {/* ═══════════════ STEP 3: DEVICE CHECK (Hardware Checks) ═══════════════ */}
          {step === 'DEVICE_CHECK' && (
            <div className="w-full max-w-full px-4 sm:px-6 py-2 space-y-3 animate-in fade-in duration-200">
              {/* ── Top-Center Alert Popup Banner (WBL Style) ── */}
              {(() => {
                const activeType = manualErrorModalType;
                if (!activeType || errorModalDismissed) return null;

                let alertTitle = 'Microphone Access Blocked';
                let alertDeviceName = 'Microphone';
                let alertIconLabel = 'microphone';

                if (activeType === 'CAMERA') {
                  alertTitle = 'Camera Access Blocked';
                  alertDeviceName = 'Camera';
                  alertIconLabel = 'camera';
                } else if (activeType === 'ALL') {
                  alertTitle = 'Camera & Mic Access Blocked';
                  alertDeviceName = 'Camera and Microphone';
                  alertIconLabel = 'camera & microphone';
                } else if (activeType === 'SPEAKER') {
                  alertTitle = 'Audio Output Unverified';
                  alertDeviceName = 'Sound / Speakers';
                  alertIconLabel = 'sound';
                }

                const getPortalTarget = () => {
                  if (typeof window === 'undefined') return null;
                  try {
                    if (window.parent && window.parent !== window && window.parent.document?.body) {
                      return window.parent.document.body;
                    }
                  } catch (e) { }
                  return document.body;
                };

                const modalContent = (
                  <div className="fixed inset-0 z-[99999999] bg-slate-950/45 dark:bg-black/65 backdrop-blur-md flex items-center justify-center pb-16 sm:pb-24 p-4 animate-in fade-in duration-200">
                    {/* Modal Backdrop Overlay */}
                    <div
                      className="absolute inset-0 transition-opacity"
                      onClick={() => {
                        setErrorModalDismissed(true);
                        setManualErrorModalType(null);
                      }}
                    />

                    {/* Modal Dialog Card */}
                    <div className="relative z-10 w-full max-w-[430px] sm:max-w-[440px] bg-white dark:bg-slate-900 rounded-2xl border-none shadow-2xl p-5 sm:p-6 text-left animate-in zoom-in-95 duration-200">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                            {alertTitle}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorModalDismissed(true);
                            setManualErrorModalType(null);
                          }}
                          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Step-by-Step Instructions */}
                      <div className="mt-4 bg-[#F8F6FE] dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                          <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-[10.5px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            1
                          </span>
                          <p className="leading-snug">
                            Go to the <span className="font-bold text-slate-950 dark:text-white">top-left</span> of your browser and click the <span className="font-bold text-slate-950 dark:text-white">🔒 lock</span> or{' '}
                            <span className="font-bold text-slate-950 dark:text-white">{alertIconLabel}</span> icon in the address bar.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                          <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-[10.5px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            2
                          </span>
                          <p className="leading-snug">
                            Set <span className="font-bold text-slate-950 dark:text-white">{alertDeviceName}</span> permission to{' '}
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Allow</span>.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                          <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-[10.5px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            3
                          </span>
                          <p className="leading-snug">
                            Click <span className="font-bold text-purple-600 dark:text-purple-400">Try Again</span> below to verify.
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setErrorModalDismissed(true);
                            setManualErrorModalType(null);
                          }}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setErrorModalDismissed(false);
                            if (activeType === 'MIC') {
                              await testMicrophone();
                            } else if (activeType === 'CAMERA') {
                              await testCamera();
                            } else if (activeType === 'SPEAKER') {
                              await playChimeTone();
                            } else {
                              setManualErrorModalType(null);
                              await runDiagnostics();
                            }
                          }}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/25 active:scale-95 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Try Again</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );

                const portalTarget = getPortalTarget();
                return portalTarget ? createPortal(modalContent, portalTarget) : modalContent;
              })()}

              {/* Main Workspace 2-Column Grid (Reference Design) */}
              <div className="grid grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-start lg:items-center w-full max-w-full mx-auto my-auto">
                {/* Left Column: Video Frame & Hardware Selectors */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col space-y-2.5">

                  {/* Header: Check Your Devices */}
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {!videoEnabled ? 'Check Your Audio Devices' : 'Check Your Video & Audio Devices'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {!videoEnabled
                        ? 'Make sure your microphone and speaker are working properly.'
                        : 'Make sure your camera, microphone, and speaker are working properly.'}
                    </p>
                  </div>

                  {/* Video Viewport Frame / Audio-Only Card */}
                  <div className={`relative w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-center ${!videoEnabled ? 'h-[270px] sm:h-[290px] lg:h-[300px] bg-[#F7F9FE] dark:bg-slate-900/90' : 'aspect-[16/9] min-h-[260px] max-h-[300px] bg-slate-950'}`}>
                    {!videoEnabled ? (
                      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center select-none w-full h-full">
                        {/* Concentric ripple rings matching exact reference screenshot */}
                        <div className="relative flex items-center justify-center my-1">
                          <div className="w-28 h-28 rounded-full border border-blue-200/50 dark:border-blue-900/40 flex items-center justify-center bg-blue-50/30 dark:bg-blue-950/20">
                            <div className="w-20 h-20 rounded-full border border-blue-200/70 dark:border-blue-900/60 flex items-center justify-center bg-blue-50/50 dark:bg-blue-950/40">
                              <div className="w-13 h-13 rounded-full border border-blue-300/80 dark:border-blue-800/60 flex items-center justify-center bg-white dark:bg-slate-900 shadow-xs">
                                <Mic className="w-6 h-6 text-[#4A6CF7] dark:text-blue-400 stroke-[2.2]" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">
                            AUDIO-ONLY MODE
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                            Microphone and speaker diagnostics active.
                          </p>
                        </div>
                      </div>
                    ) : (!cameraStream && cameraOk === false) ? (
                      <div className="flex flex-col items-center justify-center gap-2 p-5 text-center w-full h-full select-none bg-slate-900">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-100">
                            Camera is off or unavailable.
                          </p>
                          <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                            Allow camera permissions in browser settings.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={(el) => {
                            videoRef.current = el;
                            if (el && cameraStream && el.srcObject !== cameraStream) {
                              el.srcObject = cameraStream;
                              el.play().catch(() => { });
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${cameraStream ? 'opacity-100' : 'opacity-0'
                            }`}
                        />
                      </>
                    )}
                  </div>

                  {/* 3. Hardware Selectors (Horizontal Grid matching reference mockup) */}
                  <div className={`grid gap-3 sm:gap-4 pt-2 ${videoEnabled ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 max-w-2xl'}`}>
                    
                    {/* Column 1: Camera (When Video Enabled) */}
                    {videoEnabled && (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                          Camera
                        </span>

                        {/* Camera Dropdown */}
                        <div className="relative w-full">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Video className="w-4 h-4" />
                          </div>
                          {videoDevices.length > 0 ? (
                            <select
                              value={selectedVideoDevice}
                              onChange={(e) => setSelectedVideoDevice(e.target.value)}
                              className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-7 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer truncate shadow-2xs"
                            >
                              {videoDevices.map((dev, idx) => (
                                <option key={dev.deviceId || idx} value={dev.deviceId}>
                                  {cleanDeviceLabel(dev.label, `FaceTime HD Camera`)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="w-full h-9 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-7 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs truncate">
                              FaceTime HD Camera
                            </div>
                          )}
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Test Camera Button */}
                        <div className="mt-2 flex items-center">
                          <button
                            type="button"
                            onClick={() => testCamera()}
                            disabled={testingCamera}
                            className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#4A6CF7] dark:text-blue-400 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Video className="w-4 h-4 shrink-0 text-[#4A6CF7] dark:text-blue-400" />
                            <span>{testingCamera ? 'Testing...' : 'Test Camera'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Column 2: Microphone */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                        Microphone
                      </span>

                      {/* Mic Dropdown */}
                      <div className="relative w-full">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Mic className="w-4 h-4" />
                        </div>
                        {audioDevices.length > 0 ? (
                          <select
                            value={selectedAudioDevice}
                            onChange={(e) => setSelectedAudioDevice(e.target.value)}
                            className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-7 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer truncate shadow-2xs"
                          >
                            {audioDevices.map((dev, idx) => (
                              <option key={dev.deviceId || idx} value={dev.deviceId}>
                                {cleanDeviceLabel(dev.label, `MacBook Pro Microphone`)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full h-9 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-7 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs truncate">
                            MacBook Pro Microphone
                          </div>
                        )}
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Combined Test Mic Button + Live Equalizer Meter */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => testMicrophone()}
                          disabled={micTesting}
                          className={`h-9 px-4 rounded-lg border text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0 ${micTesting
                            ? 'bg-[#4A6CF7] text-white border-[#4A6CF7] animate-pulse'
                            : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#4A6CF7] dark:text-blue-400 border-slate-200 dark:border-slate-700'
                            }`}
                        >
                          <Mic className={`w-4 h-4 shrink-0 ${micTesting ? 'text-white' : 'text-[#4A6CF7] dark:text-blue-400'}`} />
                          <span>{micTesting ? 'Listening...' : 'Test Mic'}</span>
                        </button>

                        {/* Equalizer Live Level Meter Bars (Inline) */}
                        <div className="flex items-center gap-1 px-1 py-1 shrink-0">
                          {Array.from({ length: 9 }).map((_, i) => {
                            const threshold = (i / 9) * 100;
                            const active = micTesting ? micLevel > threshold : micTested && micOk ? i < 7 : false;
                            return (
                              <div
                                key={i}
                                className={`w-1 rounded-full transition-all duration-75 ${active
                                  ? 'bg-emerald-500 h-4 shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-700 h-1.5'
                                  }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Speaker */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                        Speaker
                      </span>

                      {/* Speaker Dropdown */}
                      <div className="relative w-full">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div className="w-full h-9 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-7 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs truncate">
                          MacBook Pro Speakers
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Test Sound Button or Heard? [Yes] [No] */}
                      <div className="mt-2 flex items-center">
                        {speakerTestState === 'confirming' ? (
                          <div className="h-9 inline-flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 shadow-2xs animate-in fade-in">
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              Heard?
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSpeakerTestState('idle');
                                  setSpeakerTested(true);
                                  setSpeakerOk(true);
                                }}
                                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-0.5 shadow-2xs cursor-pointer transition-colors"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Yes</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSpeakerTestState('idle');
                                  setSpeakerTested(true);
                                  setSpeakerOk(false);
                                }}
                                className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-0.5 shadow-2xs cursor-pointer transition-colors"
                              >
                                <X className="w-3 h-3 stroke-[3]" />
                                <span>No</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => playChimeTone()}
                            className={`h-9 px-4 rounded-lg border text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${speakerTestState === 'playing'
                              ? 'bg-[#4A6CF7] text-white border-[#4A6CF7] animate-pulse'
                              : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#4A6CF7] dark:text-blue-400 border-slate-200 dark:border-slate-700'
                              }`}
                          >
                            <Volume2 className={`w-4 h-4 shrink-0 ${speakerTestState === 'playing' ? 'text-white' : 'text-[#4A6CF7] dark:text-blue-400'}`} />
                            <span>
                              {speakerTestState === 'playing' ? 'Playing...' : 'Test Sound'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: System Checklist + CTA */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col justify-center space-y-4 my-auto self-center">

                  {/* 1. Device Status Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">

                    {/* Clean Header: Device Status */}
                    <div className="px-5 pt-4 pb-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                        Device Status
                      </h3>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {/* Item 1: Browser support */}
                      <div className="flex items-center justify-between px-5 py-2.5 sm:py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                            Browser support
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100 dark:fill-emerald-950" />
                            <span>Passed</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>

                      {/* Item 2: Internet connection */}
                      <div className="flex items-center justify-between px-5 py-2.5 sm:py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${bandwidthChecking
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                            : bandwidthKbps > 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                            }`}>
                            <Wifi className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                            Internet connection
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {bandwidthChecking ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              <span>Testing...</span>
                            </span>
                          ) : bandwidthKbps > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100 dark:fill-emerald-950" />
                              <span>Passed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>

                      {/* Item 3: Camera */}
                      {videoEnabled && (
                        <div
                          onClick={() => {
                            if (cameraOk === false) {
                              setErrorModalDismissed(false);
                              setManualErrorModalType('CAMERA');
                            }
                          }}
                          className="flex items-center justify-between px-5 py-2.5 sm:py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cameraOk === true
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                              : cameraOk === false
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                              }`}>
                              <Video className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                              Camera
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {cameraOk === true ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100 dark:fill-emerald-950" />
                                <span>Passed</span>
                              </span>
                            ) : cameraOk === false ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Failed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                <span>Testing...</span>
                              </span>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>
                      )}

                      {/* Item 4: Microphone */}
                      <div
                        onClick={() => {
                          if (micOk === false) {
                            setErrorModalDismissed(false);
                            setManualErrorModalType('MIC');
                          } else {
                            testMicrophone();
                          }
                        }}
                        className="flex items-center justify-between px-5 py-2.5 sm:py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${micTesting
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                            : (micTested && micOk === true)
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                              : micOk === false
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                            <Mic className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                            Microphone
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {micTesting ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                              <span>Testing...</span>
                            </span>
                          ) : (micTested && micOk === true) ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100 dark:fill-emerald-950" />
                              <span>Passed</span>
                            </span>
                          ) : micOk === false ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              <span>Click to test</span>
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>

                      {/* Item 5: Speaker */}
                      <div
                        onClick={() => playChimeTone()}
                        className="flex items-center justify-between px-5 py-2.5 sm:py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${speakerTestState === 'playing' || speakerTestState === 'confirming'
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                            : speakerTested && speakerOk === false
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                              : speakerTested && speakerOk === true
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                            <Volume2 className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                            Speaker
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {speakerTestState === 'playing' || speakerTestState === 'confirming' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                              <span>{speakerTestState === 'playing' ? 'Playing...' : 'Awaiting...'}</span>
                            </span>
                          ) : speakerTested && speakerOk === true ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100 dark:fill-emerald-950" />
                              <span>Passed</span>
                            </span>
                          ) : speakerTested && speakerOk === false ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              <span>Click to test</span>
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* 2. All Checks Passed Notification Banner (Exact reference mockup match) */}
                  {allChecksPass && (
                    <div className="bg-[#F6F2FF] dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 shadow-2xs animate-in fade-in duration-200">
                      <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#6D28D9] dark:text-purple-300 leading-tight">
                          {!videoEnabled
                            ? 'All audio devices are working correctly!'
                            : 'All video and audio devices are working correctly!'}
                        </p>
                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          You&apos;re ready to continue.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* 3. Bottom Full-Width Navigation Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full mt-2">
                {/* Left Bottom End: Back */}
                <button
                  type="button"
                  onClick={() => {
                    cleanup();
                    changeStep('CONSENT');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>← Back</span>
                </button>

                {/* Right Bottom End: Next: Confirmation */}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!allChecksPass}
                  className={`px-7 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 ${allChecksPass
                    ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-75'
                    }`}
                >
                  {!allChecksPass && <Lock className="w-3.5 h-3.5" />}
                  <span>Next: Confirmation</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

            </div>
          )}

          {/* ═══════════════ STEP 4: CONFIRMATION ═══════════════ */}
          {step === 'CONFIRMATION' && (
            <div className="w-full max-w-5xl mx-auto my-auto px-4 sm:px-6 py-3 space-y-3 animate-in fade-in duration-200">

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
                    icon: <Mic className="w-3.5 h-3.5" />,
                    label: 'Microphone',
                    value: micPass ? 'Passed' : 'Not Ready',
                    passed: !!micPass,
                  },
                  ...(isVideo
                    ? [
                      {
                        icon: <Wifi className="w-3.5 h-3.5" />,
                        label: 'Network Bandwidth',
                        value: bw ? `${bw.toLocaleString()} Kbps` : 'Verified',
                        passed: true,
                      },
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
                  {
                    icon: <FileText className="w-3.5 h-3.5" />,
                    label: 'Transcript Storage',
                    value: consentSaveTranscript ? 'Enabled' : 'Disabled',
                    passed: true,
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
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 transition-all duration-200 shadow-md shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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

      {/* JOB DESCRIPTION UPLOAD MODAL DIALOG */}
      {showJdModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs transition-opacity" onClick={() => setShowJdModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
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

    </div>
  );
};

export default DeviceCheckWizard;
