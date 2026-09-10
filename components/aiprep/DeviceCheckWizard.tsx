/**
 * DeviceCheckWizard Component - Target Workspace: wbl-frontend
 * 4-Step Onboarding & Hardware Verification Wizard (Compact & Hook-driven)
 */
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Mic, MicOff, Volume2, VolumeX, Check, ChevronRight, ShieldCheck, CheckCircle2, XCircle, Wifi, WifiOff, Video, VideoOff, AlertTriangle, RefreshCw, Eye, Lock, ShieldAlert, X, ChevronDown, Globe, ArrowDown, Activity } from 'lucide-react';
import { AssessmentConfig } from './AssessmentCard';
import { ConsentStep, getInitialConsentState, syncConsentToSessionStorage } from './ConsentModal';
import  PracticeStep  from './PracticeStep';
import { AssessmentType, aiPrepApi } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { useMediaPipeVision } from '@/hooks/useMediaPipeVision';

export type WizardStep = 'CONFIGURATION' | 'CONSENT' | 'DEVICE_CHECK' | 'PRACTICE_START';
interface MediaDev { deviceId: string; label: string; }
const STEP_TO_SLUG: Record<WizardStep, string> = {
  CONFIGURATION: 'assessment-type', CONSENT: 'consent', DEVICE_CHECK: 'device-check', PRACTICE_START: 'practice',
};
const SLUG_TO_STEP: Record<string, WizardStep> = {
  'assesment-type': 'CONFIGURATION', 'assessment-type': 'CONFIGURATION', 'configuration': 'CONFIGURATION',
  'consent': 'CONSENT', 'device-check': 'DEVICE_CHECK', 'devicecheck': 'DEVICE_CHECK',
  'practice': 'PRACTICE_START', 'practice-start': 'PRACTICE_START',
};

const cleanLabel = (label: string, fallback: string) => {
  if (!label || !label.trim()) return fallback;
  let c = label.replace(/^(Default|Communications)\s*-\s*/i, '').replace(/\s*[\(\[\{][^\)\]\}]*[\)\]\}]/g, '').trim();
  const words = c.split(/\s+/).filter(Boolean);
  return (words.length > 2 ? words.slice(0, 2).join(' ') : c) || fallback;
};
const filterDevs = (devs: any[], kind: string, fallback: string): MediaDev[] => {
  const seen = new Set<string>();
  const list = devs.filter((d) => d.kind === kind).map((d, i) => {
    const devId = d.deviceId || (i === 0 ? 'default' : `dev-${i}`);
    const rawLabel = d.label && d.label.trim() ? d.label.trim() : `${fallback} ${i + 1}`;
    return { deviceId: devId, label: cleanLabel(rawLabel, fallback) };
  }).filter((d) => !seen.has(d.label) ? (seen.add(d.label), true) : false);
  return list.length > 0 ? list : [{ deviceId: 'default', label: fallback }];
};
interface DeviceCheckWizardProps {
  assessmentId?: number;
  assessmentType?: string;
  assessmentMode?: string;
  audioOnly?: boolean;
  initialStep?: WizardStep;
  onPrepareConfirmation?: (results: any) => Promise<number>;
  onComplete?: (results: any) => void;
  onCancel?: () => void;
}
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
  const pathname = usePathname();
  const [step, setStep] = useState<WizardStep>(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname.toLowerCase();
      let topPath = '';
      try {
        if (window.top && window.top.location) {
          topPath = window.top.location.pathname.toLowerCase();
        }
      } catch { }
      const activePath = topPath || currentPath;
      // When accessing /aiprep directly or assessment type route, always start at Step 1 (Assessment Type)
      if (activePath === '/aiprep' || activePath === '/aiprep/' || activePath.includes('/assesment-type') || activePath.includes('/assessment-type')) {
        return 'CONFIGURATION';
      }
      // Check URL route slugs
      for (const [slugKey, s] of Object.entries(SLUG_TO_STEP)) {
        if (activePath.includes(`/${slugKey}`) || activePath.endsWith(`/${slugKey}`)) {
          return s;
        }
      }
      const urlParams = new URLSearchParams(window.location.search);
      const urlStep = urlParams.get('step') as WizardStep | null;
      if (urlStep && ['CONFIGURATION', 'CONSENT', 'DEVICE_CHECK', 'PRACTICE_START'].includes(urlStep)) {
        return urlStep;
      }
      // Check sessionStorage fallback
      const savedStep = sessionStorage.getItem('aiprep_wizard_step') as WizardStep | null;
      if (savedStep && ['CONFIGURATION', 'CONSENT', 'DEVICE_CHECK', 'PRACTICE_START'].includes(savedStep)) {
        return savedStep;
      }
    }
    return initialStep;
  });
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(() => {
    if (typeof window !== 'undefined') {
      const savedType = sessionStorage.getItem('aiprep_active_type') as AssessmentType | null;
      if (savedType === 'INTRO') return 'INTRO';
    }
    return 'INTRO';
  });
  // 2. Consent State (Centralized in ConsentModal module)
  const initialConsent = useMemo(() => {
    return getInitialConsentState(audioOnly);
  }, [audioOnly]);
  const [videoEnabled, setVideoEnabled] = useState<boolean>(initialConsent.videoEnabled);
  const [videoAnalyticsEnabled, setVideoAnalyticsEnabled] = useState<boolean>(initialConsent.videoAnalyticsEnabled);
  const [consentMic, setConsentMic] = useState<boolean>(initialConsent.consentMic);
  const [consentCamera, setConsentCamera] = useState<boolean>(initialConsent.consentCamera);
  const [consentSaveRecording, setConsentSaveRecording] = useState<boolean>(initialConsent.consentSaveRecording);
  const [consentSaveTranscript, setConsentSaveTranscript] = useState<boolean>(initialConsent.consentSaveTranscript);
  const [jdText, setJdText] = useState<string>(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('aiprep_jd_text') || '';
    return '';
  });
  const isPopStateRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('aiprep_wizard_step', step);
    sessionStorage.setItem('aiprep_active_type', assessmentType);
    syncConsentToSessionStorage({
      videoEnabled,
      consentMic,
      consentCamera,
      videoAnalyticsEnabled,
      consentSaveRecording,
      consentSaveTranscript,
    });
    if (jdText) sessionStorage.setItem('aiprep_jd_text', jdText);
    const slug = STEP_TO_SLUG[step] || 'assessment-type';
    const isPop = isPopStateRef.current;
    isPopStateRef.current = false;
    try {
      const isAiprepBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/aiprep');
      const basePath = isAiprepBase ? '/aiprep' : '/user_dashboard/ai-prep';
      const newPath = `${basePath}/${slug}`;
      const win = (window.top && window.top !== window) ? window.top : window;
      const currentPath = win.location.pathname;

      if (currentPath !== newPath) {
        if (isPop) win.history.replaceState({ aiprep_step: step }, '', `${newPath}${win.location.search}`); else {
          const isInitial = !sessionStorage.getItem('aiprep_history_initialized');
          if (isInitial) {
            sessionStorage.setItem('aiprep_history_initialized', 'true');
            win.history.replaceState({ aiprep_step: step }, '', `${newPath}${win.location.search}`);
          } else {
            win.history.pushState({ aiprep_step: step }, '', `${newPath}${win.location.search}`);
          }
        }
      }
      window.dispatchEvent(new CustomEvent('aiprep-layout-mode', { detail: { fullscreen: true, step, slug } }));
    } catch (e) {
      console.warn('[DeviceCheckWizard] Address bar sync error:', e);
    }
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('step')) {
        url.searchParams.delete('step');
        window.history.replaceState(null, '', url.toString());
      }
    } catch { }
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'AIPREP_STEP_CHANGE', step, slug }, '*');
    } catch { }
  }, [step, assessmentType, videoEnabled, consentMic, consentCamera, videoAnalyticsEnabled, consentSaveRecording, consentSaveTranscript, jdText]);
  const cleanupRef = useRef<(scope?: 'ALL' | 'AUDIO_ONLY' | 'VIDEO_ONLY') => void>(() => { });
  useEffect(() => {
    if (step === 'CONFIGURATION' && !audioOnly) {
      const savedMode = typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_active_mode') : null;
      if (!savedMode) {
        setVideoEnabled(true);
        setConsentCamera(true);
        syncConsentToSessionStorage({ videoEnabled: true, consentCamera: true });
      }
    }
  }, [step, audioOnly]);
  // Synchronize wizard step with Next.js router pathname
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const curPath = (window.top && window.top !== window ? window.top.location.pathname : (pathname || window.location.pathname)).toLowerCase();
    for (const [slugKey, s] of Object.entries(SLUG_TO_STEP)) {
      if (curPath.includes(`/${slugKey}`) || curPath.endsWith(`/${slugKey}`)) {
        setStep((currentStep) => {
          if (currentStep !== s) {
            if (currentStep === 'DEVICE_CHECK' && s !== 'DEVICE_CHECK') {
              cleanupRef.current?.();
            }
            return s;
          }
          return currentStep;
        });
        return;
      }
    }
  }, [pathname]);

  // Support navigation / browser back-forward buttons & messages from parent
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'AIPREP_SET_STEP' && e.data.step) {
        const nextStep = e.data.step as WizardStep;
        if (['CONFIGURATION', 'CONSENT', 'DEVICE_CHECK', 'PRACTICE_START'].includes(nextStep)) {
          setStep(nextStep);
        }
      }
    };
    const handlePopState = (e: PopStateEvent) => {
      try {
        isPopStateRef.current = true;
        const targetPath = (window.top && window.top !== window ? window.top.location.pathname : window.location.pathname).toLowerCase();
        let matchedStep: WizardStep | null = null;
        for (const [slugKey, s] of Object.entries(SLUG_TO_STEP)) {
          if (targetPath.includes(`/${slugKey}`) || targetPath.endsWith(`/${slugKey}`)) {
            matchedStep = s;
            break;
          }
        }
        if (matchedStep) setStep(matchedStep); else if (targetPath.endsWith('/ai-prep') || targetPath.endsWith('/aiprep') || targetPath.endsWith('/aiprep/')) {
          sessionStorage.removeItem('aiprep_history_initialized');
          cleanupRef.current?.();
          onCancel();
        }
      } catch { }
    };

    window.addEventListener('message', handleMsg);
    window.addEventListener('popstate', handlePopState);
    if (window.top && window.top !== window) {
      try {
        window.top.addEventListener('popstate', handlePopState);
      } catch { }
    }

    return () => {
      window.removeEventListener('message', handleMsg);
      window.removeEventListener('popstate', handlePopState);
      if (window.top && window.top !== window) {
        try {
          window.top.removeEventListener('popstate', handlePopState);
        } catch { }
      }
    };
  }, [onCancel]);

  // Fullscreen container behavior (applies to all wizard steps)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent('aiprep-layout-mode', { detail: { fullscreen: true } }));
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let parentIframe: HTMLElement | null = null;
    let origIframeCss = '', origParentOverflow = '';
    const modifiedAncestors: { el: HTMLElement; origCss: string }[] = [];

    if (window.parent && window.parent !== window) {
      try {
        const parentDoc = window.parent.document;
        origParentOverflow = parentDoc.body.style.overflow;
        parentDoc.body.style.setProperty('overflow', 'hidden', 'important');
        const iframes = parentDoc.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
          const f = iframes[i];
          try {
            if (f.contentWindow === window || (f.src && (f.src.includes('aiprep') || f.src.includes('device-check')))) {
              parentIframe = f as HTMLElement;
              break;
            }
          } catch { }
        }
        if (parentIframe) {
          origIframeCss = parentIframe.style.cssText;
          ['position:fixed', 'top:0px', 'left:0px', 'width:100vw', 'height:100vh', 'z-index:2147483647', 'margin:0px', 'padding:0px', 'border:none'].forEach((r) => {
            const [k, v] = r.split(':');
            parentIframe!.style.setProperty(k, v, 'important');
          });

          // Reset any CSS transforms, animations, or containment on ancestor nodes that trap fixed positioning
          let ancestor = parentIframe.parentElement;
          while (ancestor && ancestor !== parentDoc.body && ancestor !== parentDoc.documentElement) {
            modifiedAncestors.push({ el: ancestor, origCss: ancestor.style.cssText });
            ancestor.style.setProperty('transform', 'none', 'important');
            ancestor.style.setProperty('animation', 'none', 'important');
            ancestor.style.setProperty('contain', 'none', 'important');
            ancestor.style.setProperty('filter', 'none', 'important');
            ancestor.style.setProperty('perspective', 'none', 'important');
            ancestor.style.setProperty('will-change', 'auto', 'important');
            ancestor = ancestor.parentElement;
          }
        }
      } catch (e) {
        console.warn('Parent iframe expansion warning:', e);
      }
    }

    return () => {
      document.body.style.overflow = origOverflow;
      window.dispatchEvent(new CustomEvent('aiprep-layout-mode', { detail: { fullscreen: false } }));
      if (window.parent && window.parent !== window) {
        try {
          if (parentIframe) parentIframe.style.cssText = origIframeCss;
          modifiedAncestors.forEach(({ el, origCss }) => {
            el.style.cssText = origCss;
          });
          if (origParentOverflow) {
            window.parent.document.body.style.overflow = origParentOverflow;
          }
        } catch { }
      }
    };
  }, []);

  // 3. Hardware Diagnostics & Streams (Initialized from sessionStorage for refresh persistence)
  const [cameraOk, setCameraOk] = useState<boolean | null>(() => typeof window !== 'undefined' && sessionStorage.getItem('aiprep_test_camera_ok') === 'true' ? true : null);
  const [micOk, setMicOk] = useState<boolean | null>(() => typeof window !== 'undefined' && sessionStorage.getItem('aiprep_test_mic_ok') === 'true' ? true : null);
  const [speakerOk, setSpeakerOk] = useState<boolean | null>(() => typeof window !== 'undefined' && sessionStorage.getItem('aiprep_test_speaker_ok') === 'true' ? true : null);
  const [cameraTested, setCameraTested] = useState<boolean>(() => typeof window !== 'undefined' && sessionStorage.getItem('aiprep_test_camera_ok') === 'true');
  const [micTested, setMicTested] = useState<boolean>(() => typeof window !== 'undefined' && sessionStorage.getItem('aiprep_test_mic_ok') === 'true');
  const [speakerTested, setSpeakerTested] = useState<boolean>(() => typeof window !== 'undefined' && sessionStorage.getItem('aiprep_test_speaker_ok') === 'true');
  const [analyticsOk, setAnalyticsOk] = useState<boolean | null>(() => typeof window !== 'undefined' && sessionStorage.getItem('aiprep_test_analytics_ok') === 'true' ? true : null);
  const [analyticsTested, setAnalyticsTested] = useState<boolean>(() => typeof window !== 'undefined' && sessionStorage.getItem('aiprep_test_analytics_ok') === 'true');
  const [analyticsTesting, setAnalyticsTesting] = useState<boolean>(false);

  const [bandwidthKbps, setBandwidthKbps] = useState<number>(0);
  const [networkPingMs, setNetworkPingMs] = useState<number>(0);
  const [isRealInternetOnline, setIsRealInternetOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [bandwidthChecking, setBandwidthChecking] = useState<boolean>(false);
  const [browserResult, setBrowserResult] = useState<{ ok: boolean; name: string } | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState<boolean>(false);
  const [permissionGuideTarget, setPermissionGuideTarget] = useState<'camera' | 'mic' | 'network' | 'all'>('camera');

  // Real Internet Connectivity Probe (Probes external endpoints to verify real WAN reachability)
  const checkRealInternet = useCallback(async (): Promise<{ online: boolean; kbps: number; latencyMs: number }> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsRealInternetOnline(false);
      setBandwidthKbps(0);
      setNetworkPingMs(999);
      return { online: false, kbps: 0, latencyMs: 999 };
    }

    const probes = [
      'https://www.google.com/generate_204', 'https://connectivitycheck.gstatic.com/generate_204', 'https://1.1.1.1/cdn-cgi/trace'
    ];

    const probeEndpoint = async (url: string): Promise<number> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const start = performance.now();
      try {
        await fetch(`${url}?_cb=${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, {
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return Math.max(Math.round(performance.now() - start), 10);
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    let minLatency = 999;
    let success = false;

    try {
      minLatency = await Promise.any(probes.map((url) => probeEndpoint(url)));
      success = true;
    } catch {
      success = false;
    }

    if (!success) {
      setIsRealInternetOnline(false);
      setBandwidthKbps(0);
      setNetworkPingMs(999);
      return { online: false, kbps: 0, latencyMs: 999 };
    }

    const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    const reportedDownlink = conn?.downlink ? Math.round(conn.downlink * 1000) : null;
    const reportedRtt = conn?.rtt ? conn.rtt : null;

    const trueLatency = reportedRtt || (minLatency < 999 ? minLatency : 0);
    let trueKbps = reportedDownlink || 0;
    if (!trueKbps && trueLatency > 0) {
      trueKbps = Math.round(Math.max(250, Math.min(50000, (1000 / Math.max(trueLatency, 20)) * 300)));
    }

    setIsRealInternetOnline(true);
    setBandwidthKbps(trueKbps);
    setNetworkPingMs(trueLatency);
    return { online: true, kbps: trueKbps, latencyMs: trueLatency };
  }, []);

  const [videoDevices, setVideoDevices] = useState<MediaDev[]>([{ deviceId: 'default', label: 'Integrated Webcam' }]);
  const [audioDevices, setAudioDevices] = useState<MediaDev[]>([{ deviceId: 'default', label: 'Default Microphone' }]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('default');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('default');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Vision Hook Integration
  const { isReady: isVisionReady, detectVideoFrame, realtimeTelemetry } = useMediaPipeVision();
  const lastTelemetryUpdateRef = useRef<number>(0);
  const [isFaceLive, setIsFaceLive] = useState<boolean>(false);

  // Connect active camera stream to video tag immediately
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play().catch(() => { });
      }
    }
  }, [cameraStream]);

  // High-Speed Real-time Vision Tracking Loop (processes frames continuously at ~25fps)
  useEffect(() => {
    if (step !== 'DEVICE_CHECK' || !videoEnabled || !cameraOk || !cameraStream || !isVisionReady) return;

    let animId: number;
    let lastTime = 0;
    let lastLightingTime = 0;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const loop = (time: number) => {
      if (time - lastTime >= 40) {
        lastTime = time;
        const video = videoRef.current;
        if (video && video.readyState >= 2 && !video.paused && !video.ended) {
          try {
            detectVideoFrame(video, time);
          } catch { }

          // Sample camera brightness every ~300ms
          if (time - lastLightingTime >= 300 && ctx && video.videoWidth > 0) {
            lastLightingTime = time;
            try {
              ctx.drawImage(video, 0, 0, 32, 32);
              const imgData = ctx.getImageData(0, 0, 32, 32).data;
              let totalBrightness = 0;
              for (let i = 0; i < imgData.length; i += 4) {
                totalBrightness += imgData[i] * 0.299 + imgData[i + 1] * 0.587 + imgData[i + 2] * 0.114;
              }
              const avg = totalBrightness / (32 * 32);
              setIsGoodLighting(avg >= 30 && avg <= 240);
            } catch { }
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [step, videoEnabled, cameraOk, cameraStream, isVisionReady, detectVideoFrame]);

  // Monitor live telemetry emissions to track real-time face presence
  useEffect(() => {
    if (realtimeTelemetry && Object.keys(realtimeTelemetry).length > 0 && realtimeTelemetry.face_box) {
      lastTelemetryUpdateRef.current = Date.now();
      setIsFaceLive(true);
    }
  }, [realtimeTelemetry]);

  // Fast Watchdog: clears bounding box within 350ms if user leaves frame
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastTelemetryUpdateRef.current > 350) {
        setIsFaceLive(false);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Auto-detect and update Video Analytics status automatically without requiring manual button click
  useEffect(() => {
    if (step !== 'DEVICE_CHECK' || !videoEnabled || !videoAnalyticsEnabled) return;
    if (cameraOk === true && cameraStream?.active) {
      const hasLiveBox = !!realtimeTelemetry?.face_box && (realtimeTelemetry?.face_box?.width ?? 0) > 0;
      const hasVisibility = (realtimeTelemetry?.face_visibility_pct ?? 0) > 0 || (realtimeTelemetry?.face_visible_pct ?? 0) > 0;
      const hasPresence = realtimeTelemetry?.is_instant_face_present === true || isFaceLive;

      if (hasLiveBox || hasVisibility || hasPresence || isVisionReady) {
        setAnalyticsOk(true);
        setAnalyticsTested(true);
        if (typeof window !== 'undefined') sessionStorage.setItem('aiprep_test_analytics_ok', 'true');
      }
    } else if (cameraOk === false) {
      setAnalyticsOk(false);
      setAnalyticsTested(true);
      if (typeof window !== 'undefined') sessionStorage.setItem('aiprep_test_analytics_ok', 'false');
    }
  }, [step, videoEnabled, videoAnalyticsEnabled, cameraOk, cameraStream, realtimeTelemetry, isFaceLive, isVisionReady]);

  const [micLevel, setMicLevel] = useState<number>(0);
  const [micTesting, setMicTesting] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const micTestingRef = useRef<boolean>(false);
  const maxLevelSeenRef = useRef<number>(0);
  const knownAudioDeviceCountRef = useRef<number>(0);

  const [speakerTestState, setSpeakerTestState] = useState<'idle' | 'playing' | 'confirming'>('idle');
  const [testingCamera, setTestingCamera] = useState<boolean>(false);
  const [isGoodLighting, setIsGoodLighting] = useState<boolean>(true);
  const [isConfirmingFromBackend, setIsConfirmingFromBackend] = useState<boolean>(false);

  // Sync test results with sessionStorage so they persist on page refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (cameraOk !== null) sessionStorage.setItem('aiprep_test_camera_ok', String(cameraOk));
    else sessionStorage.removeItem('aiprep_test_camera_ok');
    sessionStorage.setItem('aiprep_test_camera_tested', String(cameraTested));

    if (micOk !== null) sessionStorage.setItem('aiprep_test_mic_ok', String(micOk));
    else sessionStorage.removeItem('aiprep_test_mic_ok');
    sessionStorage.setItem('aiprep_test_mic_tested', String(micTested));

    if (speakerOk !== null) sessionStorage.setItem('aiprep_test_speaker_ok', String(speakerOk));
    else sessionStorage.removeItem('aiprep_test_speaker_ok');
    sessionStorage.setItem('aiprep_test_speaker_tested', String(speakerTested));

    if (analyticsOk !== null) sessionStorage.setItem('aiprep_test_analytics_ok', String(analyticsOk));
    else sessionStorage.removeItem('aiprep_test_analytics_ok');
    sessionStorage.setItem('aiprep_test_analytics_tested', String(analyticsTested));
  }, [cameraOk, cameraTested, micOk, micTested, speakerOk, speakerTested, analyticsOk, analyticsTested]);

  // Cleanup helper
  const cleanup = useCallback((scope: 'ALL' | 'AUDIO_ONLY' | 'VIDEO_ONLY' = 'ALL') => {
    if (scope === 'ALL' || scope === 'VIDEO_ONLY') {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      setCameraStream(null);
      setIsFaceLive(false);
      lastTelemetryUpdateRef.current = 0;
    }
    if (scope === 'ALL' || scope === 'AUDIO_ONLY') {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => { });
        audioContextRef.current = null;
      }
      micTestingRef.current = false;
      setMicLevel(0);
      setSpeakerTestState('idle');
    }
  }, []);

  useEffect(() => {
    cleanupRef.current = cleanup;
    return () => cleanup();
  }, [cleanup]);

  const selectedVideoDeviceRef = useRef(selectedVideoDevice);
  selectedVideoDeviceRef.current = selectedVideoDevice;
  const selectedAudioDeviceRef = useRef(selectedAudioDevice);
  selectedAudioDeviceRef.current = selectedAudioDevice;
  const micOkRef = useRef(micOk);
  micOkRef.current = micOk;

  // Bind and attach disconnection listeners to Microphone stream
  const bindMicStream = useCallback((stream: MediaStream) => {
    micStreamRef.current = stream;
    stream.getAudioTracks().forEach((track) => {
      const handleEnded = () => {
        console.warn('[DeviceCheckWizard] Microphone disconnected or audio track ended');
        setMicOk(false);
        setMicTested(true);
        micTestingRef.current = false;
        setMicLevel(0);
        cleanup('AUDIO_ONLY');
      };
      track.onended = handleEnded;
      track.onmute = () => {
        console.warn('[DeviceCheckWizard] Audio track muted (device detached or hardware muted)');
        handleEnded();
      };
    });
  }, [cleanup]);

  // Bind and attach disconnection listeners to Camera stream
  const bindCameraStream = useCallback((stream: MediaStream) => {
    cameraStreamRef.current = stream;
    setCameraStream(stream);

    stream.getVideoTracks().forEach((track) => {
      const handleEnded = () => {
        console.warn('[DeviceCheckWizard] Camera disconnected or video track ended');
        setCameraOk(false);
        setCameraTested(true);
        setCameraStream(null);
        cleanup('VIDEO_ONLY');
      };
      track.onended = handleEnded;
      track.onmute = () => {
        if (track.readyState === 'ended' || !track.enabled) handleEnded();
      };
    });
  }, [cleanup]);

  // Diagnostics Runner
  const runDiagnostics = useCallback(async () => {
    setShowPermissionGuide(false);
    cleanup('AUDIO_ONLY');

    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      const bName = ua.includes('Chrome') ? 'Google Chrome' : ua.includes('Firefox') ? 'Mozilla Firefox' : ua.includes('Safari') ? 'Apple Safari' : ua.includes('Edg') ? 'Microsoft Edge' : 'Browser';
      setBrowserResult({ ok: true, name: bName });
    }

    setBandwidthChecking(true);
    checkRealInternet().finally(() => {
      setBandwidthChecking(false);
    });

    // 1. Enumerate all connected devices from browser first
    let rawVideoCount = 0;
    let rawAudioCount = 0;
    let vDevs: MediaDev[] = [];
    let aDevs: MediaDev[] = [];

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        rawVideoCount = devs.filter((d) => d.kind === 'videoinput').length;
        rawAudioCount = devs.filter((d) => d.kind === 'audioinput').length;
        vDevs = filterDevs(devs, 'videoinput', 'Integrated Webcam');
        aDevs = filterDevs(devs, 'audioinput', 'Default Microphone');
        if (vDevs.length > 0) {
          setVideoDevices(vDevs);
          setSelectedVideoDevice((prev) => (vDevs.some((d) => d.deviceId === prev) ? prev : vDevs[0].deviceId));
        }
        if (aDevs.length > 0) {
          setAudioDevices(aDevs);
          setSelectedAudioDevice((prev) => (aDevs.some((d) => d.deviceId === prev) ? prev : aDevs[0].deviceId));
        }
        knownAudioDeviceCountRef.current = rawAudioCount;
      } catch (e) {
        console.warn('[runDiagnostics] Device enumeration failed:', e);
      }
    }

    // 2. Read previous test results from sessionStorage
    const savedCamOk = typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_test_camera_ok') : null;
    const savedCamTested = typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_test_camera_tested') === 'true' : false;
    const savedMicroOk = typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_test_mic_ok') : null;
    const savedMicroTested = typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_test_mic_tested') === 'true' : false;
    const savedSpkOk = typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_test_speaker_ok') : null;
    const savedSpkTested = typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_test_speaker_tested') === 'true' : false;

    // 3. Camera diagnostics
    if (videoEnabled) {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          cleanup('VIDEO_ONLY');
          const camId = (vDevs.length > 0 ? vDevs[0].deviceId : null) || (selectedVideoDeviceRef.current !== 'default' ? selectedVideoDeviceRef.current : null);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: camId ? { deviceId: { exact: camId } } : true,
          });
          bindCameraStream(stream);
          setShowPermissionGuide(false);
          // If video stream is actively received, mark camera passed
          setCameraOk(true);
          setCameraTested(true);
        } catch {
          setCameraStream(null);
          setCameraOk(false);
          setCameraTested(true);
        }
      } else {
        setCameraOk(false);
        setCameraTested(true);
      }
    }

    // 4. Microphone diagnostics
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const micId = (aDevs.length > 0 ? aDevs[0].deviceId : null) || (selectedAudioDeviceRef.current !== 'default' ? selectedAudioDeviceRef.current : null);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: micId ? { deviceId: { exact: micId } } : true,
        });
        bindMicStream(stream);
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const actx = new AudioCtx();
          audioContextRef.current = actx;
          const source = actx.createMediaStreamSource(stream);
          const analyser = actx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;
          const data = new Uint8Array(analyser.frequencyBinCount);
          const update = () => {
            if (!analyserRef.current) return;
            if (!micTestingRef.current) { setMicLevel(0); animFrameRef.current = requestAnimationFrame(update); return; }
            analyserRef.current.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            const lvl = avg < 18 ? 0 : Math.min(100, Math.round(((avg - 18) / 90) * 100));
            setMicLevel(lvl);
            if (lvl > maxLevelSeenRef.current) maxLevelSeenRef.current = lvl;
            animFrameRef.current = requestAnimationFrame(update);
          };
          update();
        }
        setMicOk(true);
        setMicTested(true);
      } catch {
        setMicOk(false);
        setMicTested(true);
      }
    } else {
      setMicOk(false);
      setMicTested(true);
    }

    // 5. Speaker diagnostics (Auto-test via Web Audio API or device presence)
    if (typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const testCtx = new AudioCtx();
          if (testCtx.state !== 'closed') {
            setSpeakerOk(true);
            setSpeakerTested(true);
            try { testCtx.close(); } catch { }
          }
        } else if (rawAudioCount > 0) {
          setSpeakerOk(true);
          setSpeakerTested(true);
        }
      } catch {
        if (savedSpkOk === 'true' && savedSpkTested) {
          setSpeakerOk(true);
          setSpeakerTested(true);
        }
      }
    }
  }, [cleanup, videoEnabled, bindCameraStream, bindMicStream, checkRealInternet]);

  // Listen for audio / video hardware changes (e.g. plug in / unplug headset/mic/webcam)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.addEventListener) return;
    const handleDeviceChange = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const rawAudioCount = devs.filter((d) => d.kind === 'audioinput').length;
        const rawVideoCount = devs.filter((d) => d.kind === 'videoinput').length;

        const vDevs = filterDevs(devs, 'videoinput', 'Integrated Webcam');
        const aDevs = filterDevs(devs, 'audioinput', 'Default Microphone');
        if (vDevs.length > 0) setVideoDevices(vDevs);
        if (aDevs.length > 0) setAudioDevices(aDevs);

        // Check if Microphone device was disconnected or ended
        const micTracks = micStreamRef.current?.getAudioTracks() || [];
        const isMicTrackDead = !micStreamRef.current?.active || micTracks.length === 0 || micTracks.some((t) => t.readyState === 'ended' || t.muted);
        const isSelectedMicGone = selectedAudioDevice !== 'default' && !devs.some((d) => d.kind === 'audioinput' && d.deviceId === selectedAudioDevice);
        const isAudioDeviceDetached = knownAudioDeviceCountRef.current > 0 && rawAudioCount < knownAudioDeviceCountRef.current;

        if (rawAudioCount === 0 || isMicTrackDead || isSelectedMicGone || isAudioDeviceDetached) {
          console.warn('[DeviceChange] Microphone unplugged / disconnected');
          setMicOk(false);
          setMicTested(true);
          cleanup('AUDIO_ONLY');
          if (aDevs.length > 0 && aDevs[0].deviceId) setSelectedAudioDevice(aDevs[0].deviceId);
        }
        knownAudioDeviceCountRef.current = rawAudioCount;

        // Check if Camera device was disconnected or ended (if video is enabled)
        if (videoEnabled) {
          const camTracks = cameraStreamRef.current?.getVideoTracks() || [];
          const isCamTrackDead = camTracks.length === 0 || camTracks.every((t) => t.readyState === 'ended');
          const isSelectedCamGone = selectedVideoDevice !== 'default' && !devs.some((d) => d.kind === 'videoinput' && d.deviceId === selectedVideoDevice);

          if (rawVideoCount === 0 || isCamTrackDead || isSelectedCamGone) {
            console.warn('[DeviceChange] Camera unplugged / disconnected');
            setCameraOk(false);
            setCameraTested(true);
            setCameraStream(null);
            cleanup('VIDEO_ONLY');
            if (vDevs.length > 0 && vDevs[0].deviceId) setSelectedVideoDevice(vDevs[0].deviceId);
          }
        }
      } catch (e) {
        console.warn('[handleDeviceChange] error:', e);
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [cleanup, videoEnabled, selectedAudioDevice, selectedVideoDevice]);

  // Test Camera & AI Video Analytics
  const testCamera = async () => {
    if (testingCamera || !videoEnabled) return;
    setTestingCamera(true);
    try {
      cleanup('VIDEO_ONLY');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideoDevice && selectedVideoDevice !== 'default' ? { deviceId: { exact: selectedVideoDevice } } : true,
      });
      bindCameraStream(stream);
      await new Promise((r) => setTimeout(r, 600));
      if (videoRef.current && isVisionReady) {
        try {
          detectVideoFrame(videoRef.current, performance.now());
        } catch { }
      }
      setCameraOk(true);
      setCameraTested(true);
      setShowPermissionGuide(false);
    } catch {
      setCameraOk(false);
      setCameraTested(true);
      setCameraStream(null);
      setAnalyticsOk(false);
      setAnalyticsTested(true);
      if (typeof window !== 'undefined') sessionStorage.setItem('aiprep_test_analytics_ok', 'false');
    } finally {
      setTestingCamera(false);
    }
  };

  // Test AI Video Analytics (validates MediaPipe face tracking & frame processing on live camera stream)
  const testAnalytics = async () => {
    if (analyticsTesting || !videoEnabled) return;
    setAnalyticsTesting(true);
    try {
      let activeStream = cameraStreamRef.current;
      if (!activeStream || !cameraOk) {
        // Attempt to probe camera first
        try {
          cleanup('VIDEO_ONLY');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: selectedVideoDevice && selectedVideoDevice !== 'default' ? { deviceId: { exact: selectedVideoDevice } } : true,
          });
          bindCameraStream(stream);
          activeStream = stream;
          setCameraOk(true);
          setCameraTested(true);
          setShowPermissionGuide(false);
        } catch {
          setCameraOk(false);
          setCameraTested(true);
          setCameraStream(null);
          setAnalyticsOk(false);
          setAnalyticsTested(true);
          if (typeof window !== 'undefined') sessionStorage.setItem('aiprep_test_analytics_ok', 'false');
          return;
        }
      }

      // If camera stream is not live or has no active video tracks, analytics MUST fail
      if (!activeStream || !activeStream.active || !activeStream.getVideoTracks().length || activeStream.getVideoTracks()[0].readyState !== 'live') {
        setAnalyticsOk(false);
        setAnalyticsTested(true);
        if (typeof window !== 'undefined') sessionStorage.setItem('aiprep_test_analytics_ok', 'false');
        return;
      }

      // Sample frames over 1.4 seconds to verify live face detection on the active camera feed
      let faceFound = false;
      const startTime = Date.now();
      while (Date.now() - startTime < 1400) {
        if (videoRef.current && isVisionReady) {
          try {
            detectVideoFrame(videoRef.current, performance.now());
          } catch { }
        }
        const hasLiveBox = !!realtimeTelemetry?.face_box && (realtimeTelemetry?.face_box?.width ?? 0) > 0;
        const hasVisibility = (realtimeTelemetry?.face_visibility_pct ?? 0) > 0 || (realtimeTelemetry?.face_visibility_pct ?? 0) > 0;
        if (hasLiveBox || hasVisibility || realtimeTelemetry?.is_instant_face_present === true) {
          faceFound = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 120));
      }

      if (faceFound && activeStream.active) {
        setAnalyticsOk(true);
        setAnalyticsTested(true);
        if (typeof window !== 'undefined') sessionStorage.setItem('aiprep_test_analytics_ok', 'true');
      } else {
        // No face detected / dark or blocked feed
        setAnalyticsOk(false);
        setAnalyticsTested(true);
        if (typeof window !== 'undefined') sessionStorage.setItem('aiprep_test_analytics_ok', 'false');
      }
    } catch (e) {
      console.warn('[testAnalytics] Analytics test warning:', e);
      setAnalyticsOk(false);
      setAnalyticsTested(true);
      if (typeof window !== 'undefined') sessionStorage.setItem('aiprep_test_analytics_ok', 'false');
    } finally {
      setAnalyticsTesting(false);
    }
  };

  // Test Microphone
  const testMicrophone = async () => {
    if (micTesting) return;
    micTestingRef.current = true;
    maxLevelSeenRef.current = 0;
    setMicTesting(true);
    try {
      let stream = micStreamRef.current;
      if (!stream?.active || !stream.getAudioTracks().length || stream.getAudioTracks()[0].readyState !== 'live') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioDevice && selectedAudioDevice !== 'default' ? { deviceId: { exact: selectedAudioDevice } } : true,
        });
        bindMicStream(stream);
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        const actx = audioContextRef.current;
        if (actx.state === 'suspended') {
          await actx.resume();
        }

        try {
          const source = actx.createMediaStreamSource(stream);
          const analyser = actx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;

          const data = new Uint8Array(analyser.frequencyBinCount);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

          let currentSmoothed = 0;
          const update = () => {
            if (!analyserRef.current) return;
            if (!micTestingRef.current) {
              setMicLevel(0);
              return;
            }
            analyserRef.current.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            const targetLvl = avg < 6 ? 0 : Math.min(100, Math.round(((avg - 6) / 50) * 100));
            // Gentle, medium exponential decay and rise (smooth lerp)
            currentSmoothed = currentSmoothed * 0.75 + targetLvl * 0.25;
            const lvl = Math.round(currentSmoothed);
            setMicLevel(lvl);
            if (lvl > maxLevelSeenRef.current) maxLevelSeenRef.current = lvl;
            animFrameRef.current = requestAnimationFrame(update);
          };
          update();
        } catch (audioErr) {
          console.warn('[testMicrophone] Analyser attach error:', audioErr);
        }
      }

      await new Promise((r) => setTimeout(r, 2600));
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        try {
          const currentDevs = await navigator.mediaDevices.enumerateDevices();
          knownAudioDeviceCountRef.current = currentDevs.filter((d) => d.kind === 'audioinput').length;
        } catch { }
      }
      if (maxLevelSeenRef.current > 0 || stream?.active) {
        setMicOk(true);
        setMicTested(true);
        setShowPermissionGuide(false);
      } else {
        setMicOk(false);
        setMicTested(true);
        setShowPermissionGuide(false);
      }
    } catch {
      setMicOk(false);
      setMicTested(true);
      setShowPermissionGuide(false);
    } finally {
      micTestingRef.current = false;
      setMicLevel(0);
      setMicTesting(false);
    }
  };

  // Test Speaker Chime
  const playChimeTone = async () => {
    if (speakerTestState === 'playing') return;
    setSpeakerTestState('playing');
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) throw new Error('Audio unsupported');
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') await ctx.resume();
      const notes = [
        { freq: 523.25, time: 0, dur: 0.25 }, { freq: 659.25, time: 0.12, dur: 0.25 },
        { freq: 783.99, time: 0.24, dur: 0.35 }, { freq: 1046.50, time: 0.36, dur: 0.45 },
      ];
      const now = ctx.currentTime;
      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now + time);
        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.18, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + time); osc.stop(now + time + dur + 0.05);
      });
      setTimeout(() => { setSpeakerTestState('confirming'); try { ctx.close(); } catch { } }, 850);
    } catch {
      setSpeakerTestState('idle'); setSpeakerTested(true); setSpeakerOk(false);
    }
  };

  // Step Change & Mount Run
  useEffect(() => {
    if (step === 'DEVICE_CHECK') runDiagnostics();
    else cleanup();
  }, [step, runDiagnostics, cleanup]);

  useEffect(() => {
    if (videoRef.current) {
      if (cameraStream) {
        if (videoRef.current.srcObject !== cameraStream) {
          videoRef.current.srcObject = cameraStream;
        }
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraStream, step, cameraOk]);



  // Real-time Network & Hardware Heartbeat Listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      setIsRealInternetOnline(false);
      setBandwidthKbps(0);
      setNetworkPingMs(999);
    };

    const handleOnline = () => {
      setBandwidthChecking(true);
      checkRealInternet().finally(() => setBandwidthChecking(false));
    };

    const handleConnChange = () => {
      checkRealInternet();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = (navigator as any)?.connection;
    if (conn?.addEventListener) conn.addEventListener('change', handleConnChange);

    // Periodic Heartbeat check (every 1.5 seconds on DEVICE_CHECK step for real-time network and hardware sanity)
    let intervalId: any = null;
    if (step === 'DEVICE_CHECK') {
      intervalId = setInterval(() => {
        checkRealInternet();

        // Hardware sanity check: if mic was marked OK but tracks are dead/unplugged
        if (micOk === true) {
          const micTracks = micStreamRef.current?.getAudioTracks() || [];
          const isDead = !micStreamRef.current?.active || micTracks.length === 0 || micTracks.some((t) => t.readyState === 'ended' || t.muted);
          if (isDead) {
            console.warn('[Heartbeat] Microphone track is disconnected / dead');
            setMicOk(false);
            setMicTested(true);
            cleanup('AUDIO_ONLY');
          } else if (navigator.mediaDevices?.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then((devs) => {
              const currentAudioCount = devs.filter((d) => d.kind === 'audioinput').length;
              const isSelectedMicGone = selectedAudioDevice !== 'default' && !devs.some((d) => d.kind === 'audioinput' && d.deviceId === selectedAudioDevice);
              if (currentAudioCount === 0 || (knownAudioDeviceCountRef.current > 0 && currentAudioCount < knownAudioDeviceCountRef.current) || isSelectedMicGone) {
                console.warn('[Heartbeat] Audio input device disconnected');
                setMicOk(false);
                setMicTested(true);
                cleanup('AUDIO_ONLY');
              }
              knownAudioDeviceCountRef.current = currentAudioCount;
            }).catch(() => { });
          }
        }

        // Camera sanity check: if camera was marked OK but tracks are dead/unplugged
        if (videoEnabled && cameraOk === true) {
          const camTracks = cameraStreamRef.current?.getVideoTracks() || [];
          if (camTracks.length === 0 || camTracks.every((t) => t.readyState === 'ended' || t.muted)) {
            console.warn('[Heartbeat] Camera track is disconnected / dead');
            setCameraOk(false);
            setCameraTested(true);
            setCameraStream(null);
            cleanup('VIDEO_ONLY');
          }
        }
      }, 1500);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn?.removeEventListener) conn.removeEventListener('change', handleConnChange);
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, checkRealInternet, micOk, cameraOk, videoEnabled, cleanup, selectedAudioDevice]);

  const internetStatus = useMemo<'checking' | 'passed' | 'unstable' | 'failed'>(() => {
    if (bandwidthChecking && bandwidthKbps === 0) return 'checking';
    if (!isRealInternetOnline) return 'failed';
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'failed';
    if (bandwidthKbps <= 0) return 'failed';

    const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    if (
      bandwidthKbps < 500 ||
      (conn?.downlink !== undefined && conn.downlink > 0 && conn.downlink < 0.5) ||
      conn?.effectiveType === '2g' ||
      conn?.effectiveType === 'slow-2g' ||
      networkPingMs > 600 ||
      (conn?.rtt && conn.rtt > 800) ||
      conn?.saveData
    ) {
      return 'unstable';
    }
    return 'passed';
  }, [bandwidthChecking, isRealInternetOnline, bandwidthKbps, networkPingMs]);

  // Navigation handlers
  const allChecksPass = internetStatus !== 'checking' && internetStatus !== 'failed' && micOk === true && micTested === true && speakerOk === true && speakerTested === true && (!videoEnabled || (cameraOk === true && cameraTested === true && (!videoAnalyticsEnabled || (analyticsOk === true && analyticsTested === true))));

  // Candidate resolution & backend assessment creation
  const getCandidateId = async (): Promise<number | undefined> => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed?.candidate_id || parsed?.id) return parsed.candidate_id || parsed.id;
      }
      const userResponse = await apiFetch("user_dashboard");
      if (userResponse?.candidate_id || userResponse?.id) return userResponse.candidate_id || userResponse.id;
    } catch (err) {
      console.warn("[DeviceCheckWizard] Could not resolve candidate profile:", err);
    }
    return undefined;
  };

  const handlePrepareConfirmationInternal = async (results: any): Promise<number> => {
    if (onPrepareConfirmation) {
      return await onPrepareConfirmation(results);
    }
    const cid = await getCandidateId();
    const targetType = assessmentType || (sessionStorage.getItem('aiprep_active_type') as any) || 'INTRO';
    const assessment = await aiPrepApi.createAssessment({
      assessment_type: targetType,
      assessment_mode: results.video_enabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY',
      candidate_id: cid,
      job_description_text: jdText || null,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    });

    if (!assessment || !assessment.id) {
      throw new Error('Failed to initialize assessment session on server.');
    }
    const targetId = assessment.id;
    sessionStorage.setItem('aiprep_active_id', String(targetId));
    sessionStorage.setItem('aiprep_active_type', targetType);
    sessionStorage.setItem('aiprep_hardware_check', JSON.stringify(results));
    return targetId;
  };

  // 6. Navigation Handlers
  const handleCompleteAssessment = async () => {
    const results = {
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
    };

    if (onComplete) {
      onComplete(results);
      return;
    }

    try {
      let targetId = initialAssessmentId || (typeof window !== 'undefined' && sessionStorage.getItem('aiprep_active_id') ? parseInt(sessionStorage.getItem('aiprep_active_id')!, 10) : null);
      if (!targetId) {
        targetId = await handlePrepareConfirmationInternal(results);
      }

      const statusRes = await aiPrepApi.updateAssessmentStatus(targetId, 'IN_PROGRESS');
      if (!statusRes || statusRes.status !== 'IN_PROGRESS') {
        throw new Error('Failed to launch the practice assessment room. Please retry.');
      }

      const isEmbedded = typeof window !== 'undefined' && (window.self !== window.top || window.location.search.includes('embed=true'));
      const targetSessionUrl = isEmbedded ? `/aiprep/session/${targetId}?embed=true` : `/aiprep/session/${targetId}`;

      sessionStorage.removeItem('aiprep_wizard_step');
      sessionStorage.setItem('aiprep_active_id', String(targetId));

      window.location.href = targetSessionUrl;
    } catch (err: any) {
      console.error('[DeviceCheckWizard] Failed to start assessment:', err);
      alert(err?.message || 'Failed to start assessment. Please try again.');
    }
  };

  const handleNext = async () => {
    if (step === 'CONFIGURATION') {
      if (!audioOnly) {
        setVideoEnabled(true);
        setConsentCamera(true);
        syncConsentToSessionStorage({ videoEnabled: true, consentCamera: true });
      }
      setStep('CONSENT');
    } else if (step === 'CONSENT') {
      setStep('DEVICE_CHECK');
    } else if (step === 'DEVICE_CHECK') {
      // Live Pre-flight Hardware Verification: ensure microphone and camera are still physically connected and live
      try {
        const netCheck = await checkRealInternet();
        if (!netCheck.online || netCheck.kbps <= 0) {
          setIsRealInternetOnline(false);
          return;
        }

        const devs = await navigator.mediaDevices.enumerateDevices();
        const rawAudioCount = devs.filter((d) => d.kind === 'audioinput').length;
        const rawVideoCount = devs.filter((d) => d.kind === 'videoinput').length;

        // Microphone physical presence & live stream check
        if (rawAudioCount === 0) {
          console.warn('[handleNext] No microphone found in system');
          setMicOk(false);
          setMicTested(true);
          cleanup('AUDIO_ONLY');
          return;
        }

        const activeMicTrack = micStreamRef.current?.getAudioTracks().find((t) => t.readyState === 'live' && !t.muted);
        if (!activeMicTrack) {
          // Attempt to probe microphone
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
            });
            bindMicStream(stream);
          } catch (micErr) {
            console.warn('[handleNext] Failed to acquire microphone stream:', micErr);
            setMicOk(false);
            setMicTested(true);
            cleanup('AUDIO_ONLY');
            return;
          }
        }

        // Camera physical presence & live stream check (if video is enabled)
        if (videoEnabled) {
          if (rawVideoCount === 0) {
            console.warn('[handleNext] No camera found in system');
            setCameraOk(false);
            setCameraTested(true);
            setCameraStream(null);
            cleanup('VIDEO_ONLY');
            return;
          }

          const activeCamTrack = cameraStreamRef.current?.getVideoTracks().find((t) => t.readyState === 'live' && !t.muted);
          if (!activeCamTrack) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
              });
              bindCameraStream(stream);
            } catch (camErr) {
              console.warn('[handleNext] Failed to acquire camera stream:', camErr);
              setCameraOk(false);
              setCameraTested(true);
              setCameraStream(null);
              cleanup('VIDEO_ONLY');
              return;
            }
          }
        }
      } catch (err) {
        console.error('[handleNext] Hardware pre-flight error:', err);
        setMicOk(false);
        setMicTested(true);
        return;
      }

      // Final gate: verify all required states are valid
      if (micOk !== true || micTested !== true || speakerOk !== true || speakerTested !== true || (videoEnabled && (cameraOk !== true || cameraTested !== true))) {
        return;
      }

      setIsConfirmingFromBackend(true);
      try {
        await handlePrepareConfirmationInternal({
          browser_info: browserResult?.name || 'Standard Browser', os_info: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown OS',
          camera_permission: !!cameraOk, mic_permission: !!micOk, speaker_ok: !!speakerOk, bandwidth_kbps: bandwidthKbps,
          yolo_consent: videoAnalyticsEnabled, assessment_type: assessmentType, audio_enabled: true, video_enabled: videoEnabled, jd_text: jdText,
        });
      } catch (err) {
        console.error('[DeviceCheckWizard] Error preparing session:', err);
      } finally {
        setIsConfirmingFromBackend(false);
      }
      setStep('PRACTICE_START');
    } else if (step === 'PRACTICE_START') {
      handleCompleteAssessment();
    }
  };

  const handlePrevious = () => {
    if (step === 'CONSENT') {
      if (!audioOnly) {
        setVideoEnabled(true);
        setConsentCamera(true);
        syncConsentToSessionStorage({ videoEnabled: true, consentCamera: true });
      }
      setStep('CONFIGURATION');
    } else if (step === 'DEVICE_CHECK') {
      cleanup();
      setStep('CONSENT');
    } else if (step === 'PRACTICE_START') {
      setStep('DEVICE_CHECK');
    }
  };

  // Vision Telemetry status metrics with real-time instantaneous evaluation
  const isFaceDetected = isFaceLive && (realtimeTelemetry?.is_instant_face_present === true || (realtimeTelemetry?.face_visibility_pct ?? 0) > 0 || (realtimeTelemetry?.face_visibility_pct ?? 0) > 0 || !!realtimeTelemetry?.face_box);
  const isCentered = isFaceDetected && (realtimeTelemetry?.sitting_position === 'Upright Centered' || realtimeTelemetry?.sitting_position === 'Centered' || !!realtimeTelemetry?.is_instant_straight);
  const isEyesOnScreen = isFaceDetected && (realtimeTelemetry?.is_instant_eyes_attentive === true || (realtimeTelemetry?.screen_attention_pct ?? 0) >= 20 || (realtimeTelemetry?.eye_contact_pct ?? 0) >= 15 || !!realtimeTelemetry?.is_instant_straight);
  const isHeadPoseOk = isFaceDetected && (realtimeTelemetry?.is_instant_straight === true || isCentered);
  const hasGoodLighting = !!cameraStream && isGoodLighting;

  const isFullScreenStep = step === 'DEVICE_CHECK' || step === 'PRACTICE_START';

  return (
    <div
      className={
        isFullScreenStep
          ? "fixed inset-0 z-[9999] w-screen h-screen flex flex-col bg-white dark:bg-slate-900 select-none overflow-hidden"
          : "w-full h-full flex-1 flex flex-col bg-white dark:bg-slate-900 select-none overflow-hidden"
      } >
      <div className="w-full h-full flex-1 bg-white dark:bg-slate-900 border-0 overflow-hidden flex flex-col transition-all duration-200">

        {/* MAIN CONTENT WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white dark:bg-slate-900">

          {/* Top Bar Header */}
          <div className="relative w-full px-3 sm:px-6 py-2 sm:py-2.5 min-h-[44px] sm:min-h-[50px] border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0">
            <div className="flex items-center justify-center gap-1.5 sm:gap-3 flex-1 sm:flex-none">
              {[
                { key: 'CONFIGURATION', num: 1, label: 'Assessment Type', shortLabel: 'Type' },
                { key: 'CONSENT', num: 2, label: 'Consent', shortLabel: 'Consent' },
                { key: 'DEVICE_CHECK', num: 3, label: 'Device Check', shortLabel: 'Device' },
                { key: 'PRACTICE_START', num: 4, label: 'Practice & Start', shortLabel: 'Practice' },
              ].map(({ key, num, label, shortLabel }, idx, arr) => {
                const isActive = step === key, isDone = arr.findIndex((s) => s.key === step) > idx;
                return (
                  <div key={key} className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span className={`w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black border-2 transition-all shadow-sm ${isActive ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-400/20' : isDone ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600'}`}>
                        {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : num}
                      </span>
                      <span className={`text-[11px] sm:text-xs font-bold whitespace-nowrap ${isActive ? 'text-slate-900 dark:text-white inline' : isDone ? 'text-slate-500 dark:text-slate-400 hidden sm:inline' : 'text-slate-400 dark:text-slate-500 hidden sm:inline'}`}>
                        <span className="hidden md:inline">{label}</span>
                        <span className="inline md:hidden">{shortLabel}</span></span>
                    </div>
                    {idx < arr.length - 1 && <div className={`w-2 sm:w-4 h-0.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                  </div>);
              })}
            </div></div>

          {/* Content Body */}
          <div className={`flex-1 min-h-0 flex flex-col items-center w-full ${step === 'DEVICE_CHECK' ? 'overflow-hidden px-3 sm:px-6 py-1.5 sm:py-2' : 'overflow-y-auto p-2 sm:p-4 md:px-6 md:py-4'}`}>

            {/* STEP 1: CONFIGURATION */}
            {step === 'CONFIGURATION' && (
              <div className="w-full max-w-6xl xl:max-w-7xl mx-auto mt-0 mb-auto flex flex-col pt-0 pb-1">
                <AssessmentConfig
                  assessmentType={assessmentType} setAssessmentType={setAssessmentType}
                  onNext={handleNext} onCancel={() => { cleanup(); onCancel(); }} />
              </div>
            )}

            {/* STEP 2: CONSENT */}
            {step === 'CONSENT' && (
              <div className="w-full max-w-6xl mx-auto mt-0 mb-auto flex flex-col py-0"><ConsentStep
                videoEnabled={videoEnabled} setVideoEnabled={setVideoEnabled} consentMic={consentMic} setConsentMic={setConsentMic}
                consentCamera={consentCamera} setConsentCamera={setConsentCamera} videoAnalyticsEnabled={videoAnalyticsEnabled} setVideoAnalyticsEnabled={setVideoAnalyticsEnabled}
                consentSaveRecording={consentSaveRecording} setConsentSaveRecording={setConsentSaveRecording} consentSaveTranscript={consentSaveTranscript} setConsentSaveTranscript={setConsentSaveTranscript}
                onBack={handlePrevious} onNext={handleNext} /></div>
            )}

            {/* STEP 3: DEVICE CHECK */}
            {step === 'DEVICE_CHECK' && (() => {
              const hasVisibleErrorCard = (
                (internetStatus === 'unstable' || internetStatus === 'failed') ||
                (videoEnabled && cameraTested && cameraOk === false) ||
                (micTested && micOk === false) ||
                (speakerTested && speakerOk === false));

              return (
                <div className="w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col justify-between flex-1 min-h-0 space-y-2 sm:space-y-3 animate-in fade-in duration-200">
                  {/* Top Left Header (Shown when no error cards) */}
                  {!hasVisibleErrorCard && (
                    <div className="space-y-0.5 text-left w-full shrink-0">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Device Check</h2>
                      <h5 className="text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400">Check and verify your equipment settings before continuing.</h5>
                    </div>
                  )}

                  {/* Main Workspace Grid (Responsive 1-col on mobile/tablet, 2-col on desktop) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start w-full mx-auto flex-1 min-h-0">
                    <div className={`col-span-1 lg:col-span-8 xl:col-span-8 flex flex-col ${allChecksPass ? 'space-y-3 sm:space-y-3.5' : 'space-y-2 sm:space-y-2.5'}`}>
                      {/* Video Viewport Frame / Audio-Only Card */}
                      <div
                        style={{ minHeight: !videoEnabled ? (hasVisibleErrorCard ? '250px' : '320px') : (hasVisibleErrorCard ? '265px' : '345px'), height: !videoEnabled ? (hasVisibleErrorCard ? '250px' : '320px') : (hasVisibleErrorCard ? '265px' : '345px'), }}
                        className={`relative w-full shrink-0 rounded-3xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all duration-200 ${!videoEnabled ? 'bg-[#F7F9FE] dark:bg-slate-900/90' : 'bg-slate-950'}`} >
                        {!videoEnabled ? (
                          <div className={`flex flex-col items-center justify-center text-center select-none w-full h-full ${hasVisibleErrorCard ? 'gap-2 p-4' : 'gap-3 p-6 sm:p-8'}`}>
                            {speakerTested && speakerOk === false ? (
                              <div className="flex flex-col items-center justify-center animate-in fade-in duration-200">
                                {/* Concentric Pulsing Red Rings with Speaker icon */}
                                <div className={`relative flex items-center justify-center ${hasVisibleErrorCard ? 'mb-1.5' : 'mb-2.5'}`}>
                                  <div className={`${hasVisibleErrorCard ? 'w-14 h-14' : 'w-16 h-16 sm:w-18 sm:h-18'} rounded-full bg-rose-50/90 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40 flex items-center justify-center animate-pulse`}>
                                    <div className={`${hasVisibleErrorCard ? 'w-10 h-10' : 'w-11 h-11 sm:w-12 sm:h-12'} rounded-full bg-rose-100/90 border border-rose-200/90 dark:bg-rose-900/50 dark:border-rose-800 flex items-center justify-center`}>
                                      <div className={`${hasVisibleErrorCard ? 'w-7 h-7' : 'w-8 h-8 sm:w-9 sm:h-9'} rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm`}><VolumeX className={`${hasVisibleErrorCard ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} /></div></div></div></div>
                                <h3 className={`${hasVisibleErrorCard ? 'text-xs sm:text-sm font-bold mt-1' : 'text-sm sm:text-base font-bold mt-1.5'} text-slate-900 dark:text-white`}>Unable to play test sound</h3>
                                <p className={`${hasVisibleErrorCard ? 'text-[11px] sm:text-xs mt-0.5' : 'text-xs sm:text-sm mt-1'} text-slate-500 dark:text-slate-400 font-medium max-w-md`}>We couldn&apos;t play the test sound from your speakers.</p>
                              </div>
                            ) : micTested && micOk === false ? (
                              <div className="flex flex-col items-center justify-center animate-in fade-in duration-200">
                                {/* Concentric Pulsing Red Rings */}
                                <div className={`relative flex items-center justify-center ${hasVisibleErrorCard ? 'mb-1.5' : 'mb-2'}`}>
                                  <div className={`${hasVisibleErrorCard ? 'w-12 h-12' : 'w-14 h-14'} rounded-full bg-rose-50/90 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40 flex items-center justify-center animate-pulse`}>
                                    <div className={`${hasVisibleErrorCard ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-rose-100/90 border border-rose-200/90 dark:bg-rose-900/50 dark:border-rose-800 flex items-center justify-center`}>
                                      <div className={`${hasVisibleErrorCard ? 'w-6 h-6' : 'w-7 h-7'} rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm`}><MicOff className={`${hasVisibleErrorCard ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} /></div></div></div></div>
                                <h3 className={`${hasVisibleErrorCard ? 'text-xs sm:text-sm font-bold mt-1' : 'text-xs sm:text-sm font-bold mt-1.5'} text-rose-600 dark:text-rose-400`}>Microphone not found</h3>
                                <p className={`${hasVisibleErrorCard ? 'text-[11px] sm:text-xs mt-0.5' : 'text-[11px] sm:text-xs mt-0.5'} text-slate-500 dark:text-slate-400 font-medium`}>No microphone detected or no audio input found.</p>
                                {/* Segmented Level Visualizer */}
                                <div className="flex items-center gap-1 mt-1 px-2 py-0.5 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
                                  {Array.from({ length: 20 }).map((_, i) => (<div key={i} className={`w-1 rounded-full transition-all duration-75 ${micTesting && micLevel > (i / 20) * 100 ? 'bg-rose-500 h-2.5' : i === 0 ? 'bg-rose-500 h-2' : 'bg-slate-200 dark:bg-slate-700 h-1'}`} />))}
                                </div></div>
                            ) : (
                              <>
                                {/* Actionable Microphone Icon Button */}
                                <button
                                  type="button"
                                  onClick={() => testMicrophone()}
                                  disabled={micTesting}
                                  title={micTesting ? 'Listening to microphone...' : micTested && micOk ? 'Click to re-test microphone' : 'Click to test microphone'}
                                  className={`group relative flex items-center justify-center ${allChecksPass ? 'mb-2' : 'mb-1.5'} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-3xl transition-all`} >
                                  {/* Pulsing Ripple rings when testing mic */}
                                  {micTesting && (
                                    <div className="absolute inset-0 -m-3 rounded-full bg-blue-500/20 animate-ping pointer-events-none" />
                                  )}
                                  {micTesting && (
                                    <div className="absolute inset-0 -m-1.5 rounded-full bg-blue-500/30 animate-pulse pointer-events-none" />
                                  )}

                                  <div className={`${allChecksPass ? 'w-18 h-18 sm:w-20 sm:h-20' : 'w-14 h-14 sm:w-16 sm:h-16'} rounded-3xl border flex items-center justify-center shadow-2xs transition-all duration-200 ${micTesting ? 'bg-[#4A6CF7] border-[#4A6CF7] text-white scale-105 shadow-md shadow-blue-500/25' : micTested && micOk ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-100/80' : 'bg-[#EBF0FE] dark:bg-indigo-950/50 border-indigo-100/80 dark:border-indigo-900/40 text-[#4A6CF7] group-hover:scale-105 group-hover:bg-[#DEE7FD] dark:group-hover:bg-indigo-900/60'}`}><Mic className={`${allChecksPass ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-6 h-6 sm:w-7 sm:h-7'} transition-transform duration-200 ${micTesting ? 'animate-bounce' : 'group-hover:scale-110'}`} /></div>

                                  {/* Subtle Status Badge */}
                                  {micTested && micOk && !micTesting && (
                                    <div className={`absolute -bottom-1 -right-1 ${allChecksPass ? 'w-5.5 h-5.5' : 'w-4.5 h-4.5'} rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-xs`}><Check className={`${allChecksPass ? 'w-3 h-3' : 'w-2.5 h-2.5'} stroke-[3]`} /></div>
                                  )}
                                </button>
                                <h3 className={`${allChecksPass ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-extrabold text-slate-900 dark:text-white ${allChecksPass ? 'mt-2' : 'mt-1'}`}>Audio-Only Assessment</h3>
                                <p className={`${allChecksPass ? 'text-xs sm:text-sm' : 'text-xs sm:text-[13px]'} text-slate-500 dark:text-slate-400 max-w-sm mt-1 font-medium`}>
                                  {micTesting
                                    ? 'Listening... speak into your microphone to test.'
                                    : 'Camera is turned off for this assessment mode.'}
                                </p>
                              </>
                            )}
                          </div>
                        ) : (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              onLoadedMetadata={(e) => {
                                (e.target as HTMLVideoElement).play().catch(() => { });
                              }}
                              className={`w-full h-full object-cover scale-x-[-1] ${cameraOk ? '' : 'hidden'}`} />
                            {cameraOk && (
                              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Camera preview{videoAnalyticsEnabled ? ' (Analytics active)' : ''}</span>
                              </div>
                            )}

                            {/* Live Analytics Overlay Sidebar inside video preview (Right-aligned inside video) */}
                            {videoEnabled && videoAnalyticsEnabled && cameraOk && (
                              <div className="absolute top-3 right-3 z-10 w-48 sm:w-52 bg-slate-950/85 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 sm:p-4 text-white shadow-2xl animate-in fade-in duration-200 flex flex-col gap-3">
                                <div className="flex items-center justify-between pb-2 border-b border-white/15">
                                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">Live Analytics</span>
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                </div>
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium">
                                    <span className="text-slate-200">Face detected</span>
                                    {isFaceDetected ? <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" /> : <span className="text-rose-400 text-xs font-bold">No</span>}
                                  </div>
                                  <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium">
                                    <span className="text-slate-200">Eyes on screen</span>
                                    {isEyesOnScreen ? <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" /> : <span className="text-amber-400 text-xs font-semibold">Look here</span>}
                                  </div>
                                  <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium">
                                    <span className="text-slate-200">Good lighting</span>
                                    {hasGoodLighting ? <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" /> : <span className="text-amber-400 text-xs font-semibold">Low</span>}
                                  </div>
                                  <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium">
                                    <span className="text-slate-200">Centered</span>
                                    {isCentered ? <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" /> : <span className="text-amber-400 text-xs font-semibold">Adjust</span>}
                                  </div>
                                  <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium">
                                    <span className="text-slate-200">Head pose</span>
                                    {!isFaceDetected ? <span className="text-rose-400 text-xs font-bold">No</span> : isHeadPoseOk ? <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" /> : <span className="text-amber-400 text-xs font-semibold">Adjust</span>}
                                  </div></div></div>
                            )}

                            {/* Real-time Green Face Detection Bounding Box & Status Tag Overlay */}
                            {cameraOk && isFaceDetected && isFaceLive && realtimeTelemetry?.face_box && (() => {
                              const rawBox = realtimeTelemetry.face_box;
                              const padX = rawBox.width * 0.22;
                              const padY = rawBox.height * 0.32;
                              const wPct = Math.min(100, (rawBox.width + padX * 2) * 100);
                              const hPct = Math.min(100, (rawBox.height + padY * 2) * 100);
                              const leftPct = Math.max(0, Math.min(100 - wPct, (1 - (rawBox.x + rawBox.width + padX)) * 100));
                              const topPct = Math.max(0, Math.min(100 - hPct, (rawBox.y - padY) * 100));

                              return (
                                <div className="absolute pointer-events-none transition-all duration-75 ease-out z-20 border-2 border-emerald-400 bg-transparent rounded-2xl shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                                  style={{
                                    left: `${leftPct}%`,
                                    top: `${topPct}%`,
                                    width: `${wPct}%`,
                                    height: `${hPct}%`,
                                  }} >
                                  {/* 4 Glowing Corner Markers */}
                                  <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-300 rounded-tl-md shadow-xs" />
                                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-300 rounded-tr-md shadow-xs" />
                                  <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-300 rounded-bl-md shadow-xs" />
                                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-300 rounded-br-md shadow-xs" />

                                  {/* Floating Green Pill Card Header on Face */}
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-emerald-500/60 text-[10px] font-bold text-emerald-400 shadow-md whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    <span>{isCentered ? 'Face Centered' : 'Face Detected'}</span>
                                  </div></div>);
                            })()}
                            {!cameraOk && (
                              <div className="flex flex-col items-center justify-center gap-2 p-4 text-center select-none w-full h-full bg-slate-900">
                                {/* Concentric Pulsing Red Rings */}
                                <div className="relative flex items-center justify-center">
                                  <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center animate-pulse">
                                    <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                                      <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm"><VideoOff className="w-3.5 h-3.5" /></div></div></div></div>
                                <h3 className="text-xs sm:text-sm font-bold text-white mt-1">Camera unavailable</h3>
                                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Camera is blocked or not connected.</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {/* Troubleshooting Alert Cards: Show max 1 active card at a time in priority sequence (Network -> Camera -> Mic -> Speaker) */}
                      {(() => {
                        const showNetworkCard = internetStatus === 'unstable' || internetStatus === 'failed';
                        const showCameraCard = !showNetworkCard && videoEnabled && cameraTested && cameraOk === false;
                        const showMicCard = !showNetworkCard && !showCameraCard && micTested && micOk === false;
                        const showSpeakerCard = !showNetworkCard && !showCameraCard && !showMicCard && speakerTested && speakerOk === false;

                        return (
                          <>
                            {/* Network Quality Troubleshooting Alert Card */}
                            {showNetworkCard && (
                              <div className="w-full bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 rounded-xl py-2 px-3 sm:py-2.5 sm:px-3.5 text-left space-y-2 animate-in fade-in duration-200 shadow-2xs">
                                {/* Metric Badges Header */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-1.5 border-b border-rose-200/60 dark:border-rose-900/40">
                                  <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 rounded-lg p-1.5 border border-rose-100 dark:border-rose-900/30">
                                    <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0"><WifiOff className="w-3.5 h-3.5 stroke-[2.5]" /></div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs sm:text-[13px] font-extrabold text-rose-600 dark:text-rose-400 leading-tight truncate">{internetStatus === 'failed' ? 'Disconnected' : 'Unstable'}</div>
                                      <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Status</div></div></div>

                                  <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 rounded-lg p-1.5 border border-rose-100 dark:border-rose-900/30">
                                    <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0"><ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" /></div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs sm:text-[13px] font-extrabold text-rose-600 dark:text-rose-400 leading-tight truncate">
                                        {bandwidthKbps > 1000 ? `${(bandwidthKbps / 1000).toFixed(1)} Mbps` : `${bandwidthKbps} Kbps`}
                                      </div>
                                      <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Speed</div></div></div>

                                  <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 rounded-lg p-1.5 border border-rose-100 dark:border-rose-900/30 col-span-2 sm:col-span-1">
                                    <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0"><Activity className="w-3.5 h-3.5 stroke-[2.5]" /></div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs sm:text-[13px] font-extrabold text-rose-600 dark:text-rose-400 leading-tight truncate">{internetStatus === 'failed' ? 'Offline' : `${networkPingMs} ms`}</div>
                                      <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Latency</div></div></div></div>

                                {/* Alert Card Header & Advice List with Try Again button */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
                                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                    <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5"><WifiOff className="w-3.5 h-3.5 stroke-[2.5]" /></div>
                                    <div className="space-y-0.5 flex-1 min-w-0">
                                      <h4 className="text-[11.5px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 leading-tight">{internetStatus === 'failed' ? 'Internet connection offline. Please check:' : 'Your connection may lead to a poor interview experience. Try:'}</h4>
                                      <ul className="space-y-0.5 text-[10.5px] sm:text-[11.5px] text-slate-700 dark:text-slate-200 font-medium">
                                        <li className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                          <span>Switch to a wired Ethernet connection or move closer to Wi-Fi router.</span>
                                        </li>
                                        <li className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                          <span>Stop other downloads or video streaming, or try a mobile hotspot.</span>
                                        </li>
                                      </ul>
                                    </div></div>

                                  {/* Try Again Button placed in card */}
                                  <div className="self-end sm:self-center shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBandwidthChecking(true);
                                        checkRealInternet().finally(() => setBandwidthChecking(false));
                                      }}
                                      disabled={bandwidthChecking}
                                      className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-[11px] sm:text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60" >
                                      <RefreshCw className={`w-3 h-3 ${bandwidthChecking ? 'animate-spin' : ''}`} />
                                      <span>{bandwidthChecking ? 'Checking...' : 'Try Again'}</span>
                                    </button>
                                  </div></div></div>
                            )}

                            {/* Camera Troubleshooting Alert Card */}
                            {showCameraCard && (
                              <div className="w-full bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 rounded-xl py-2 px-3 sm:py-2.5 sm:px-3.5 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in duration-200 shadow-2xs">
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs"><VideoOff className="w-3.5 h-3.5 stroke-[2.5]" /></div>
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <h4 className="text-[11.5px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 leading-tight">Camera not detected or access blocked. Please check:</h4>
                                    <ul className="space-y-0.5 text-[10.5px] sm:text-[11.5px] text-slate-700 dark:text-slate-200 font-medium">
                                      <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <span>Your webcam is plugged out or lens cover is closed.</span>
                                      </li>
                                      <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <span>Browser permission is not allowed (click the lock 🔒 icon in your URL bar).</span>
                                      </li>
                                      <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <span>Select your preferred device from the Camera dropdown below.</span>
                                      </li>
                                    </ul>
                                  </div></div>
                                <div className="self-end sm:self-center shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => testCamera()}
                                    disabled={testingCamera}
                                    className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-[11px] sm:text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60" >
                                    <RefreshCw className={`w-3 h-3 ${testingCamera ? 'animate-spin' : ''}`} />
                                    <span>{testingCamera ? 'Testing...' : 'Try Again'}</span>
                                  </button>
                                </div></div>
                            )}

                            {/* Microphone Troubleshooting Alert Card */}
                            {showMicCard && (
                              <div className="w-full bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 rounded-xl py-2 px-3 sm:py-2.5 sm:px-3.5 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in duration-200 shadow-2xs">
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs"><MicOff className="w-3.5 h-3.5 stroke-[2.5]" /></div>
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <h4 className="text-[11.5px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 leading-tight">Microphone not detected or no audio received. Please check:</h4>
                                    <ul className="space-y-0.5 text-[10.5px] sm:text-[11.5px] text-slate-700 dark:text-slate-200 font-medium">
                                      <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <span>Your microphone is plugged out or hardware mute switch is on.</span>
                                      </li>
                                      <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <span>Browser permission is not allowed (click the lock 🔒 icon in your URL bar).</span>
                                      </li>
                                      <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <span>Select your preferred device from the Microphone dropdown below.</span>
                                      </li>
                                    </ul>
                                  </div></div>
                                <div className="self-end sm:self-center shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => testMicrophone()}
                                    disabled={micTesting}
                                    className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-[11px] sm:text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60" >
                                    <RefreshCw className={`w-3 h-3 ${micTesting ? 'animate-spin' : ''}`} />
                                    <span>{micTesting ? 'Testing...' : 'Try Again'}</span>
                                  </button>
                                </div></div>
                            )}

                            {/* Speaker Troubleshooting Alert Card */}
                            {showSpeakerCard && (
                              <div className="w-full bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 rounded-xl py-2 px-3 sm:py-2.5 sm:px-3.5 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in duration-200 shadow-2xs">
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs"><VolumeX className="w-3.5 h-3.5 stroke-[2.5]" /></div>
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <h4 className="text-[11.5px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 leading-tight">We couldn&apos;t play the test sound. Please check:</h4>
                                    <ul className="space-y-0.5 text-[10.5px] sm:text-[11.5px] text-slate-700 dark:text-slate-200 font-medium">
                                      <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <span>Your speakers are plugged out or volume is muted.</span>
                                      </li>
                                      <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <span>Browser permission is not allowed to play sound.</span>
                                      </li>
                                      <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <span>Try selecting a different speaker output device.</span>
                                      </li>
                                    </ul>
                                  </div></div>
                                <div className="self-end sm:self-center shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => playChimeTone()}
                                    disabled={speakerTestState === 'playing'}
                                    className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-[11px] sm:text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60" >
                                    <RefreshCw className={`w-3 h-3 ${speakerTestState === 'playing' ? 'animate-spin' : ''}`} />
                                    <span>{speakerTestState === 'playing' ? 'Playing...' : 'Try Again'}</span>
                                  </button>
                                </div></div>
                            )}
                          </>);
                      })()}

                      {/* Hardware Selectors (Bottom) */}
                      {(() => {
                        const activeVideoValue = videoDevices.some((d) => d.deviceId === selectedVideoDevice)
                          ? selectedVideoDevice
                          : (videoDevices[0]?.deviceId || 'default');
                        const activeAudioValue = audioDevices.some((d) => d.deviceId === selectedAudioDevice)
                          ? selectedAudioDevice
                          : (audioDevices[0]?.deviceId || 'default');

                        return (
                          <div className={`grid ${videoEnabled ? 'gap-3.5 sm:gap-4.5 pt-1.5 sm:pt-2 mt-3 sm:mt-3.5 grid-cols-1 sm:grid-cols-3' : allChecksPass ? 'gap-4 sm:gap-5 pt-2 sm:pt-2.5 mt-3 sm:mt-4 grid-cols-1 sm:grid-cols-2 max-w-2xl' : 'gap-3.5 sm:gap-4.5 pt-1.5 sm:pt-2 mt-3 sm:mt-3.5 grid-cols-1 sm:grid-cols-2 max-w-2xl'}`}>
                            {videoEnabled && (
                              <div className="flex flex-col space-y-2.5 sm:space-y-3">
                                <div>
                                  <span className="text-xs sm:text-[13.5px] font-extrabold text-slate-950 dark:text-white mb-1.5 block">Camera</span>
                                  <div className="relative w-full">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 pointer-events-none"><Video className="w-3.5 h-3.5" /></div>
                                    <select
                                      value={activeVideoValue}
                                      onChange={(e) => {
                                        setSelectedVideoDevice(e.target.value);
                                        setCameraOk(null);
                                        setCameraTested(false);
                                        setAnalyticsOk(null);
                                        setAnalyticsTested(false);
                                        cleanup('VIDEO_ONLY');
                                      }}
                                      className="w-full h-10 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-7 text-xs sm:text-[13px] font-semibold text-slate-950 dark:text-white appearance-none cursor-pointer truncate shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600" >
                                      {videoDevices.length > 0 ? (
                                        videoDevices.map((d, i) => (
                                          <option key={d.deviceId || `cam-${i}`} value={d.deviceId} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1 font-medium">{d.label || `Camera ${i + 1}`}</option>
                                        ))
                                      ) : (
                                        <option value="default" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1 font-medium">Integrated Webcam</option>
                                      )}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div></div>

                                {cameraTested && cameraOk === false && (
                                  <p className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 -mt-1 flex items-center gap-1.5 animate-in fade-in duration-150"><VideoOff className="w-3.5 h-3.5 text-rose-500 shrink-0 stroke-[2.5]" /> Camera not working or access blocked</p>
                                )}

                                <div className="flex justify-start w-full">
                                  <button type="button" onClick={() => testCamera()} disabled={testingCamera} className={`w-full max-w-[180px] h-10 sm:h-10.5 px-4 rounded-xl font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${testingCamera ? 'bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'}`}>
                                    {testingCamera ? (<span className="w-2 h-2 rounded-full bg-white animate-ping mr-0.5" />) : (<Video className="w-4 h-4 text-white stroke-[2.5]" />)}
                                    <span className="whitespace-nowrap">{testingCamera ? 'Testing...' : cameraTested && cameraOk ? 'Retest Camera' : 'Test Camera'}</span>
                                  </button>
                                </div></div>
                            )}

                            <div className="flex flex-col space-y-2.5 sm:space-y-3">
                              <div>
                                <span className="text-xs sm:text-[13.5px] font-extrabold text-slate-950 dark:text-white mb-1.5 block">Microphone</span>
                                <div className="relative w-full">
                                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 pointer-events-none"><Mic className="w-3.5 h-3.5" /></div>
                                  <select
                                    value={activeAudioValue}
                                    onChange={(e) => {
                                      setSelectedAudioDevice(e.target.value);
                                      setMicOk(null);
                                      setMicTested(false);
                                      cleanup('AUDIO_ONLY');
                                    }}
                                    className="w-full h-10 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-7 text-xs sm:text-[13px] font-semibold text-slate-950 dark:text-white appearance-none cursor-pointer truncate shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600" >
                                    {audioDevices.length > 0 ? (
                                      audioDevices.map((d, i) => (
                                        <option key={d.deviceId || `mic-${i}`} value={d.deviceId} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1 font-medium">{d.label || `Microphone ${i + 1}`}</option>
                                      ))
                                    ) : (
                                      <option value="default" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1 font-medium">Default Microphone</option>
                                    )}
                                  </select>
                                  <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div></div>

                              {micTested && micOk === false && (
                                <p className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 -mt-1 flex items-center gap-1.5 animate-in fade-in duration-150"><MicOff className="w-3.5 h-3.5 text-rose-500 shrink-0 stroke-[2.5]" /> Microphone not working or no audio</p>
                              )}

                              <div className="flex items-center justify-start gap-1.5 w-full">
                                <button type="button" onClick={() => testMicrophone()} disabled={micTesting} className={`w-full max-w-[145px] h-10 sm:h-10.5 px-3 rounded-xl font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${micTesting ? 'bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'}`}>
                                  {micTesting ? (<Mic className="w-4 h-4 text-white stroke-[2.5] animate-pulse" />) : (<Mic className="w-4 h-4 text-white stroke-[2.5]" />)}
                                  <span className="whitespace-nowrap">{micTesting ? 'Testing...' : micTested && micOk ? 'Retest Mic' : 'Test Mic'}</span>
                                </button>
                                <div className="h-10 sm:h-10.5 px-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1 shrink-0 shadow-xs">
                                  {[5, 12, 20, 30, 42, 55, 70, 85].map((threshold, i) => {
                                    const isLit = micTesting && micLevel >= threshold;
                                    return (
                                      <div
                                        key={i}
                                        className={`w-1 rounded-full transition-all duration-200 ease-out ${isLit ? 'bg-emerald-500 dark:bg-emerald-400 h-5 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-slate-300 dark:bg-slate-600 h-2.5'}`} />);
                                  })}
                                </div></div></div>

                            <div className="flex flex-col space-y-2.5 sm:space-y-3">
                              <div>
                                <span className="text-xs sm:text-[13.5px] font-extrabold text-slate-950 dark:text-white mb-1.5 block">Speaker</span>
                                <div className="relative w-full">
                                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 pointer-events-none"><Volume2 className="w-3.5 h-3.5" /></div>
                                  <div className="w-full h-10 pl-10 pr-3 text-xs sm:text-[13px] flex items-center bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-semibold text-slate-950 dark:text-white truncate shadow-xs">Default Speaker</div></div></div>

                              {speakerTested && speakerOk === false && (
                                <p className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 -mt-1 flex items-center gap-1.5 animate-in fade-in duration-150"><VolumeX className="w-3.5 h-3.5 text-rose-500 shrink-0 stroke-[2.5]" /> Speaker not working or no sound</p>
                              )}

                              {speakerTestState === 'confirming' ? (
                                <div className="w-full max-w-[180px] mr-auto h-10 sm:h-10.5 px-2.5 rounded-xl text-xs inline-flex items-center justify-between bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 shadow-xs">
                                  <span className="font-bold text-[11.5px] text-slate-900 dark:text-white whitespace-nowrap">Hear sound?</span>
                                  <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => { setSpeakerTestState('idle'); setSpeakerTested(true); setSpeakerOk(true); }} className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer">Yes</button>
                                    <button type="button" onClick={() => { setSpeakerTestState('idle'); setSpeakerTested(true); setSpeakerOk(false); }} className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer">No</button>
                                  </div></div>
                              ) : (
                                <div className="flex justify-start w-full">
                                  <button type="button" onClick={() => playChimeTone()} className={`w-full max-w-[180px] h-10 sm:h-10.5 px-4 rounded-xl font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${speakerTestState === 'playing' ? 'bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'}`}>
                                    {speakerTestState === 'playing' ? (
                                      <Volume2 className="w-4 h-4 text-white stroke-[2.5] animate-pulse" />
                                    ) : (
                                      <Volume2 className="w-4 h-4 text-white stroke-[2.5]" />
                                    )}
                                    <span className="whitespace-nowrap">{speakerTestState === 'playing' ? 'Playing...' : speakerTested && speakerOk ? 'Retest Speaker' : 'Test Speaker'}</span>
                                  </button>
                                </div>
                              )}
                            </div></div>);
                      })()}
                    </div>
                    {/* Right Column: Device Status Card OR Permission Guide Card */}
                    <div className="col-span-1 lg:col-span-4 xl:col-span-4 flex flex-col space-y-1.5 sm:space-y-2">
                      {showPermissionGuide ? (
                        /* Browser Permissions Required Notice Card (Camera / Microphone) */
                        <div className="bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3.5 animate-in fade-in zoom-in-95 duration-200 shadow-2xs text-left relative overflow-hidden">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5"><ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" /></div>
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 leading-tight">{permissionGuideTarget === 'mic' ? 'Microphone Permission Required' : permissionGuideTarget === 'camera' ? 'Camera Permission Required' : 'Browser Permissions Required'}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                                  {permissionGuideTarget === 'mic'
                                    ? 'Your browser blocked microphone access. Please allow permission to capture your voice during the assessment.'
                                    : permissionGuideTarget === 'camera'
                                      ? 'Your browser blocked camera access. Please allow permission for AI video proctoring.'
                                      : 'Please allow camera and microphone access in your browser to continue.'}
                                </p>
                              </div></div>
                            <button
                              type="button"
                              onClick={() => setShowPermissionGuide(false)}
                              className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-colors"
                              title="Back to Device Status" >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Quick Step-by-Step Instructions */}
                          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 rounded-xl p-3 border border-rose-200/60 dark:border-rose-900/40">
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-[#5E48E8] text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs mt-0.5">1</span>
                              <span>Look at your browser URL / address bar at the top and click the <strong>Lock / Settings icon</strong> (🔒).</span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-[#5E48E8] text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs mt-0.5">2</span>
                              <span>Set <strong>{permissionGuideTarget === 'mic' ? 'Microphone' : permissionGuideTarget === 'camera' ? 'Camera' : 'Camera & Microphone'}</strong> to <strong>Allow</strong>.</span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-[#5E48E8] text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs mt-0.5">3</span>
                              <span>Click <strong>Try Again</strong> below to re-verify your device.</span>
                            </div></div>

                          <div className="pt-2.5 flex items-center justify-end gap-2 border-t border-rose-200/60 dark:border-rose-900/40">
                            <button
                              type="button"
                              onClick={() => setShowPermissionGuide(false)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer" >
                              Dismiss
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPermissionGuide(false);
                                runDiagnostics();
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer" >
                              <RefreshCw className="w-3 h-3" />
                              <span>Try Again</span>
                            </button>
                          </div></div>
                      ) : (
                        /* Default Device Status Card */
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs animate-in fade-in duration-200">
                          <div className="px-5 pt-3 pb-2">
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight text-sm sm:text-[15px]">Device Status</h3>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            <div className="flex items-center justify-between px-5 py-2.5 sm:py-2.75">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Globe className="w-4 h-4" /></div>
                                <span className="text-xs sm:text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 truncate">Browser support</span>
                              </div>
                              <span className="inline-flex items-center gap-1 text-xs sm:text-[13px] font-semibold text-emerald-600 shrink-0 ml-2">
                                <CheckCircle2 className="w-4 h-4" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              </span>
                            </div>
                            <div
                              onClick={() => {
                                if (internetStatus === 'unstable' || internetStatus === 'failed') {
                                  setBandwidthChecking(true);
                                  checkRealInternet().finally(() => setBandwidthChecking(false));
                                }
                              }}
                              className={`flex items-center justify-between px-5 py-2.5 sm:py-2.75 transition-colors ${internetStatus === 'unstable' || internetStatus === 'failed' ? 'cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20' : ''}`} >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${internetStatus === 'passed' ? 'bg-emerald-50 text-emerald-600' : internetStatus === 'unstable' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : internetStatus === 'checking' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                                  {internetStatus === 'failed' ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                                </div>
                                <span className="text-xs sm:text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 truncate">Internet connection</span>
                              </div>
                              <span className={`inline-flex items-center gap-1 text-xs sm:text-[13px] font-semibold shrink-0 ml-2 ${internetStatus === 'passed' ? 'text-emerald-600' : internetStatus === 'unstable' ? 'text-amber-600 dark:text-amber-400' : internetStatus === 'checking' ? 'text-purple-600' : 'text-rose-600'}`}>
                                {internetStatus === 'checking' ? (
                                  'Testing...'
                                ) : internetStatus === 'passed' ? (
                                  <><CheckCircle2 className="w-4 h-4" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                ) : internetStatus === 'unstable' ? (
                                  <><AlertTriangle className="w-4 h-4" /> Unstable <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                ) : (
                                  <><XCircle className="w-4 h-4" /> Failed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                )}
                              </span>
                            </div>
                            {videoEnabled && (
                              <div
                                onClick={() => {
                                  if (cameraTested && cameraOk === false) {
                                    setPermissionGuideTarget('camera');
                                    setShowPermissionGuide(true);
                                  } else {
                                    testCamera();
                                  }
                                }}
                                className={`flex items-center justify-between px-5 py-2.5 sm:py-2.75 transition-colors cursor-pointer ${cameraTested && cameraOk === false ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'}`} >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cameraTested && cameraOk === false ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : cameraTested && cameraOk ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    {cameraTested && cameraOk === false ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                  </div>
                                  <span className="text-xs sm:text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 truncate">Camera</span>
                                </div>
                                <span className={`inline-flex items-center gap-1 text-xs sm:text-[13px] font-semibold shrink-0 ml-2 ${testingCamera ? 'text-purple-600' : cameraTested && cameraOk ? 'text-emerald-600' : cameraTested && cameraOk === false ? 'text-rose-600' : 'text-blue-600'}`}>
                                  {testingCamera ? (
                                    'Testing...'
                                  ) : cameraTested && cameraOk ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                  ) : cameraTested && cameraOk === false ? (
                                    <><XCircle className="w-4 h-4" /> Failed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                  ) : (
                                    'Click to test'
                                  )}
                                </span>
                              </div>
                            )}
                            <div
                              onClick={() => {
                                if (micTested && micOk === false) {
                                  setPermissionGuideTarget('mic');
                                  setShowPermissionGuide(true);
                                } else {
                                  testMicrophone();
                                }
                              }}
                              className={`flex items-center justify-between px-5 py-2.5 sm:py-2.75 transition-colors cursor-pointer ${micTested && micOk === false ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'}`} >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${micTested && micOk === false ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : micTested && micOk ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                  {micTested && micOk === false ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </div>
                                <span className="text-xs sm:text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 truncate">Microphone</span>
                              </div>
                              <span className={`inline-flex items-center gap-1 text-xs sm:text-[13px] font-semibold shrink-0 ml-2 ${micTesting ? 'text-purple-600' : micTested && micOk ? 'text-emerald-600' : micTested && micOk === false ? 'text-rose-600' : 'text-slate-500'}`}>
                                {micTesting ? (
                                  'Testing...'
                                ) : micTested && micOk ? (
                                  <><CheckCircle2 className="w-4 h-4" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                ) : micTested && micOk === false ? (
                                  <><XCircle className="w-4 h-4" /> Failed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                ) : (
                                  'Click to test'
                                )}
                              </span>
                            </div>
                            <div
                              onClick={() => playChimeTone()}
                              className={`flex items-center justify-between px-5 py-2.5 sm:py-2.75 cursor-pointer transition-colors ${speakerTested && speakerOk === false ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'}`} >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${speakerTested && speakerOk === false ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : speakerTested && speakerOk ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                  {speakerTested && speakerOk === false ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </div>
                                <span className="text-xs sm:text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 truncate">Speaker</span>
                              </div>
                              <span className={`inline-flex items-center gap-1 text-xs sm:text-[13px] font-semibold shrink-0 ml-2 ${speakerTestState === 'playing' ? 'text-purple-600' : speakerTestState === 'confirming' ? 'text-amber-600' : speakerTested && speakerOk ? 'text-emerald-600' : speakerTested && speakerOk === false ? 'text-rose-600' : 'text-slate-500'}`}>
                                {speakerTestState === 'playing' ? (
                                  'Playing...'
                                ) : speakerTestState === 'confirming' ? (
                                  <span className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[11px] text-slate-500">Heard?</span>
                                    <button type="button" onClick={() => { setSpeakerTestState('idle'); setSpeakerTested(true); setSpeakerOk(true); }} className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold transition-colors">Yes</button>
                                    <button type="button" onClick={() => { setSpeakerTestState('idle'); setSpeakerTested(true); setSpeakerOk(false); }} className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10.5px] font-bold transition-colors">No</button>
                                  </span>
                                ) : speakerTested && speakerOk ? (
                                  <><CheckCircle2 className="w-4 h-4" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                ) : speakerTested && speakerOk === false ? (
                                  <><XCircle className="w-4 h-4" /> Failed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                ) : (
                                  'Click to test'
                                )}
                              </span>
                            </div>
                            {videoEnabled && videoAnalyticsEnabled && (
                              <div
                                onClick={testAnalytics}
                                className={`flex items-center justify-between px-5 py-2.5 sm:py-2.75 transition-colors cursor-pointer ${analyticsTested && analyticsOk === false ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'}`} >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${analyticsTested && analyticsOk === false ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : analyticsTested && analyticsOk ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}><Activity className="w-4 h-4" /></div>
                                  <span className="text-xs sm:text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 truncate">Video analytics</span>
                                </div>
                                <span className={`inline-flex items-center gap-1 text-xs sm:text-[13px] font-semibold shrink-0 ml-2 ${analyticsTesting ? 'text-purple-600' : analyticsTested && analyticsOk ? 'text-emerald-600' : analyticsTested && analyticsOk === false ? 'text-rose-600' : 'text-blue-600'}`}>
                                  {analyticsTesting ? (
                                    'Testing...'
                                  ) : analyticsTested && analyticsOk ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                  ) : analyticsTested && analyticsOk === false ? (
                                    <><XCircle className="w-4 h-4" /> Failed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                                  ) : (
                                    'Click to test'
                                  )}
                                </span>
                              </div>
                            )}
                          </div></div>
                      )}
                      {allChecksPass && (
                        <div className="bg-[#F6F2FF] dark:bg-purple-950/30 border border-purple-200/80 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 shadow-2xs">
                          <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-xs"><Check className="w-4.5 h-4.5 stroke-[3]" /></div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-[#6D28D9] dark:text-purple-300">All checks passed!</p>
                            <p className="text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">{videoEnabled && videoAnalyticsEnabled ? 'Video analytics are working correctly.' : "All audio equipment is verified and ready."}</p>
                          </div></div>
                      )}
                    </div></div>

                  <div className="sticky bottom-0 z-30 flex items-center justify-between gap-3 pt-1.5 sm:pt-2 pb-1 sm:pb-1.5 border-t border-slate-100 dark:border-slate-800/80 w-full mt-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shrink-0">
                    <button type="button" onClick={() => { cleanup(); setStep('CONSENT'); }} className="px-4 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer shadow-2xs">
                      ← Back
                    </button>
                    <button type="button" onClick={handleNext} disabled={!allChecksPass} className={`px-5 sm:px-6 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${allChecksPass ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md cursor-pointer active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-75'}`}>
                      {!allChecksPass && <Lock className="w-3.5 h-3.5" />}
                      <span>Next: Practice &amp; Start</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div></div>);
            })()}

            {step === 'PRACTICE_START' && (
              <div className="flex-1 flex flex-col h-full w-full">
                <PracticeStep
                  videoEnabled={videoEnabled}
                  videoAnalyticsEnabled={videoAnalyticsEnabled}
                  cameraStream={cameraStream}
                  selectedAudioLabel={audioDevices.find((d) => d.deviceId === selectedAudioDevice)?.label || 'Microphone'}
                  selectedVideoLabel={videoDevices.find((d) => d.deviceId === selectedVideoDevice)?.label || 'Camera'}
                  onBack={handlePrevious}
                  onStartAssessment={handleCompleteAssessment}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DeviceCheckWizard;

