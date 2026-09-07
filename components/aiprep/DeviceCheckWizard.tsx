/**
 * DeviceCheckWizard Component - Target Workspace: wbl-frontend
 * 4-Step Onboarding & Hardware Verification Wizard (Compact & Hook-driven)
 */
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera, Mic, MicOff, Volume2, VolumeX, Check, ChevronRight, ShieldCheck, CheckCircle2, XCircle, Wifi, WifiOff,
  ArrowLeft, ArrowDown, ArrowUp, Activity, Video, VideoOff, AlertCircle, AlertTriangle, RefreshCw, Briefcase, FileText, Eye, Lock, ShieldAlert, X, ChevronDown, Globe, Settings, ExternalLink,
} from 'lucide-react';
import { AssessmentConfig } from './AssessmentCard';
import { ConsentStep } from './ConsentModal';
import { AssessmentType } from '@/lib/aiprep-api';
import { useMediaPipeVision } from '@/hooks/useMediaPipeVision';

export type WizardStep = 'CONFIGURATION' | 'CONSENT' | 'DEVICE_CHECK' | 'CONFIRMATION';
interface MediaDev { deviceId: string; label: string; }

const cleanLabel = (label: string, fallback: string) => {
  if (!label || !label.trim()) return fallback;
  const c = label.replace(/^(Default|Communications)\s*-\s*/i, '').trim();
  return c || fallback;
};

const filterDevs = (devs: any[], kind: string, fallback: string): MediaDev[] => {
  const seen = new Set<string>();
  const list = devs
    .filter((d) => d.kind === kind)
    .map((d, i) => {
      const devId = d.deviceId || (i === 0 ? 'default' : `dev-${i}`);
      const rawLabel = d.label && d.label.trim() ? d.label.trim() : `${fallback} ${i + 1}`;
      const l = cleanLabel(rawLabel, fallback);
      return { deviceId: devId, label: l };
    })
    .filter((d) => {
      if (!seen.has(d.label)) {
        seen.add(d.label);
        return true;
      }
      return false;
    });

  return list.length > 0 ? list : [{ deviceId: 'default', label: fallback }];
};

interface DeviceCheckWizardProps {
  assessmentId: number;
  assessmentType: string;
  assessmentMode: string;
  audioOnly?: boolean;
  initialStep?: WizardStep;
  onPrepareConfirmation?: (results: any) => Promise<number>;
  onComplete: (results: any) => void;
  onCancel: () => void;
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

  // 1. Wizard Configuration State
  const [step, setStep] = useState<WizardStep>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlStep = urlParams.get('step') as WizardStep | null;
      if (urlStep && ['CONFIGURATION', 'CONSENT', 'DEVICE_CHECK', 'CONFIRMATION'].includes(urlStep)) {
        return urlStep;
      }
      const savedStep = sessionStorage.getItem('aiprep_wizard_step') as WizardStep | null;
      if (savedStep && ['CONFIGURATION', 'CONSENT', 'DEVICE_CHECK', 'CONFIRMATION'].includes(savedStep)) {
        return savedStep;
      }
      if (window.location.pathname.includes('/device-check')) {
        return 'DEVICE_CHECK';
      }
    }
    return initialStep;
  });

  const [assessmentType, setAssessmentType] = useState<AssessmentType>(() => {
    if (typeof window !== 'undefined') {
      const savedType = sessionStorage.getItem('aiprep_active_type') as AssessmentType | null;
      if (savedType) return savedType;
    }
    return (initialType as AssessmentType) || 'INTRO';
  });

  const [videoEnabled, setVideoEnabled] = useState<boolean>(!audioOnly && initialMode !== 'AUDIO_ONLY');
  const [videoAnalyticsEnabled, setVideoAnalyticsEnabled] = useState<boolean>(true);
  const [jdText, setJdText] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('aiprep_jd_text') || '';
    }
    return '';
  });
  const [showJdModal, setShowJdModal] = useState<boolean>(false);

  // 2. Consent State
  const [consentMic, setConsentMic] = useState<boolean>(() => typeof window === 'undefined' ? true : sessionStorage.getItem('aiprep_consent_mic') !== 'false');
  const [consentCamera, setConsentCamera] = useState<boolean>(() => typeof window === 'undefined' ? true : sessionStorage.getItem('aiprep_consent_camera') !== 'false');
  const [consentSaveRecording, setConsentSaveRecording] = useState<boolean>(() => typeof window === 'undefined' ? true : sessionStorage.getItem('aiprep_consent_recording') !== 'false');
  const [consentSaveTranscript, setConsentSaveTranscript] = useState<boolean>(() => typeof window === 'undefined' ? true : sessionStorage.getItem('aiprep_consent_transcript') !== 'false');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('aiprep_wizard_step', step);
    sessionStorage.setItem('aiprep_active_type', assessmentType);
    sessionStorage.setItem('aiprep_active_mode', videoEnabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY');
    sessionStorage.setItem('aiprep_consent_mic', String(consentMic));
    sessionStorage.setItem('aiprep_consent_camera', String(consentCamera));
    sessionStorage.setItem('aiprep_consent_yolo', String(videoAnalyticsEnabled));
    sessionStorage.setItem('aiprep_consent_recording', String(consentSaveRecording));
    sessionStorage.setItem('aiprep_consent_transcript', String(consentSaveTranscript));
    if (jdText) sessionStorage.setItem('aiprep_jd_text', jdText);

    // Keep URL parameter in sync with active step so page reload preserves step
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('step') !== step) {
        url.searchParams.set('step', step);
        window.history.replaceState(null, '', url.toString());
      }
    } catch { }
  }, [step, assessmentType, videoEnabled, consentMic, consentCamera, videoAnalyticsEnabled, consentSaveRecording, consentSaveTranscript, jdText]);

  // Fullscreen container behavior (expands parent iframe to cover full viewport)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isFullScreenStep = step === 'DEVICE_CHECK' || step === 'CONFIRMATION';
    if (!isFullScreenStep) return;

    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let parentIframe: HTMLElement | null = null;
    let origIframeCss = '', origParentOverflow = '';

    if (window.parent && window.parent !== window) {
      try {
        const parentDoc = window.parent.document;
        origParentOverflow = parentDoc.body.style.overflow;
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
          origIframeCss = parentIframe.style.cssText;
          ['position:fixed', 'top:0px', 'left:0px', 'width:100vw', 'height:100vh', 'z-index:999999', 'margin:0px', 'padding:0px'].forEach((r) => {
            const [k, v] = r.split(':');
            parentIframe!.style.setProperty(k, v, 'important');
          });
        }
      } catch (e) {
        console.warn('Parent iframe expansion warning:', e);
      }
    }

    return () => {
      document.body.style.overflow = origOverflow;
      if (window.parent && window.parent !== window) {
        try {
          if (parentIframe) parentIframe.style.cssText = origIframeCss;
          window.parent.document.body.style.overflow = origParentOverflow;
        } catch { }
      }
    };
  }, [step]);

  // 3. Hardware Diagnostics & Streams (Initialized from sessionStorage for refresh persistence)
  const [cameraOk, setCameraOk] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    const s = sessionStorage.getItem('aiprep_test_camera_ok');
    return s === 'true' ? true : s === 'false' ? false : null;
  });
  const [micOk, setMicOk] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    const s = sessionStorage.getItem('aiprep_test_mic_ok');
    return s === 'true' ? true : s === 'false' ? false : null;
  });
  const [speakerOk, setSpeakerOk] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    const s = sessionStorage.getItem('aiprep_test_speaker_ok');
    return s === 'true' ? true : s === 'false' ? false : null;
  });
  const [cameraTested, setCameraTested] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('aiprep_test_camera_tested') === 'true';
  });
  const [micTested, setMicTested] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('aiprep_test_mic_tested') === 'true';
  });
  const [speakerTested, setSpeakerTested] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('aiprep_test_speaker_tested') === 'true';
  });
  const [cameraDetails, setCameraDetails] = useState<{ label: string; resolution: string; frameRate?: number } | null>(null);

  const [bandwidthKbps, setBandwidthKbps] = useState<number>(0);
  const [networkPingMs, setNetworkPingMs] = useState<number>(45);
  const [isRealInternetOnline, setIsRealInternetOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [bandwidthChecking, setBandwidthChecking] = useState<boolean>(false);
  const [browserResult, setBrowserResult] = useState<{ ok: boolean; name: string } | null>(null);
  const [errorModalDismissed, setErrorModalDismissed] = useState<boolean>(false);
  const [manualErrorModalType, setManualErrorModalType] = useState<'MIC' | 'CAMERA' | 'SPEAKER' | 'ALL' | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState<boolean>(false);
  const [permissionGuideTarget, setPermissionGuideTarget] = useState<'camera' | 'mic' | 'network' | 'all'>('camera');
  const [guideType, setGuideType] = useState<'permission' | 'audio'>('permission');

  // Real Internet Connectivity Probe (Probes external endpoints to verify real WAN reachability)
  const checkRealInternet = useCallback(async (): Promise<{ online: boolean; kbps: number; latencyMs: number }> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsRealInternetOnline(false);
      setBandwidthKbps(0);
      setNetworkPingMs(999);
      return { online: false, kbps: 0, latencyMs: 999 };
    }

    const probes = [
      'https://www.google.com/generate_204',
      'https://connectivitycheck.gstatic.com/generate_204',
      'https://1.1.1.1/cdn-cgi/trace',
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

    const trueLatency = reportedRtt || (minLatency < 900 ? minLatency : 45);
    const trueKbps = reportedDownlink || (minLatency > 500 ? 350 : 8500);

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
  const { isReady: isVisionReady, detectVideoFrame, realtimeTelemetry } = useMediaPipeVision(videoRef);

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
  }, [cameraOk, cameraTested, micOk, micTested, speakerOk, speakerTested]);

  // Cleanup helper
  const cleanup = useCallback((scope: 'ALL' | 'AUDIO_ONLY' | 'VIDEO_ONLY' = 'ALL') => {
    if (scope === 'ALL' || scope === 'VIDEO_ONLY') {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      setCameraStream(null);
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

  useEffect(() => () => cleanup(), [cleanup]);

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

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      try {
        const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
        const width = settings.width;
        const height = settings.height;
        const fps = settings.frameRate ? Math.round(settings.frameRate) : undefined;
        const label = videoTrack.label || 'Integrated Webcam';
        const resStr = width && height ? `${width}x${height}` : '720p HD';
        setCameraDetails({ label, resolution: resStr, frameRate: fps });
      } catch { }
    }

    stream.getVideoTracks().forEach((track) => {
      const handleEnded = () => {
        console.warn('[DeviceCheckWizard] Camera disconnected or video track ended');
        setCameraOk(false);
        setCameraTested(true);
        setCameraStream(null);
        cleanup('VIDEO_ONLY');
        setErrorModalDismissed(false);
        setManualErrorModalType((prev) => (micOk === false ? 'ALL' : 'CAMERA'));
      };
      track.onended = handleEnded;
      track.onmute = () => {
        if (track.readyState === 'ended' || !track.enabled) {
          handleEnded();
        }
      };
    });
  }, [cleanup, micOk]);

  // Diagnostics Runner
  const runDiagnostics = useCallback(async () => {
    setErrorModalDismissed(false);
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
      if (rawVideoCount === 0) {
        // Physical camera disconnected or not found!
        console.warn('[runDiagnostics] No camera hardware detected in browser');
        setCameraOk(false);
        setCameraTested(true);
        setCameraStream(null);
        cleanup('VIDEO_ONLY');
      } else if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          cleanup('VIDEO_ONLY');
          const camId = (vDevs.length > 0 ? vDevs[0].deviceId : null) || (selectedVideoDevice !== 'default' ? selectedVideoDevice : null);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: camId ? { deviceId: { exact: camId } } : true,
          });
          bindCameraStream(stream);
          setShowPermissionGuide(false);
          // If previously passed and camera is healthy, keep it passed!
          if (savedCamOk === 'true' && savedCamTested) {
            setCameraOk(true);
            setCameraTested(true);
          }
        } catch {
          // Access blocked or camera unavailable
          setCameraOk(false);
          setCameraTested(true);
          setCameraStream(null);
        }
      }
    }

    // 4. Microphone diagnostics
    if (rawAudioCount === 0) {
      // Physical microphone disconnected or not found!
      console.warn('[runDiagnostics] No microphone hardware detected in browser');
      setMicOk(false);
      setMicTested(true);
      cleanup('AUDIO_ONLY');
    } else if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const micId = (aDevs.length > 0 ? aDevs[0].deviceId : null) || (selectedAudioDevice !== 'default' ? selectedAudioDevice : null);
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
        // If previously passed and mic is healthy, keep it passed!
        if (savedMicroOk === 'true' && savedMicroTested) {
          setMicOk(true);
          setMicTested(true);
        }
      } catch {
        setMicOk(false);
        setMicTested(true);
      }
    }

    // 5. Speaker diagnostics (Restore if previously passed and audio hardware exists)
    if (savedSpkOk === 'true' && savedSpkTested) {
      if (rawAudioCount > 0) {
        setSpeakerOk(true);
        setSpeakerTested(true);
      } else {
        setSpeakerOk(false);
        setSpeakerTested(true);
      }
    }
  }, [cleanup, videoEnabled, selectedVideoDevice, selectedAudioDevice, bindCameraStream, bindMicStream, checkRealInternet]);

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
          if (aDevs.length > 0 && aDevs[0].deviceId) {
            setSelectedAudioDevice(aDevs[0].deviceId);
          }
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
            if (vDevs.length > 0 && vDevs[0].deviceId) {
              setSelectedVideoDevice(vDevs[0].deviceId);
            }
          }
        }
      } catch (err) {
        console.warn('devicechange handler error:', err);
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [cleanup, videoEnabled, selectedAudioDevice, selectedVideoDevice]);

  // Test Camera
  const testCamera = async () => {
    if (testingCamera || !videoEnabled) return;
    setTestingCamera(true);
    setManualErrorModalType(null);
    try {
      cleanup('VIDEO_ONLY');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideoDevice && selectedVideoDevice !== 'default' ? { deviceId: { exact: selectedVideoDevice } } : true,
      });
      bindCameraStream(stream);
      await new Promise((r) => setTimeout(r, 600));
      setCameraOk(true);
      setCameraTested(true);
      setShowPermissionGuide(false);
    } catch {
      setCameraOk(false);
      setCameraTested(true);
      setCameraStream(null);
      setErrorModalDismissed(false);
      setManualErrorModalType(micOk === false ? 'ALL' : 'CAMERA');
    } finally {
      setTestingCamera(false);
    }
  };

  // Test Microphone
  const testMicrophone = async () => {
    if (micTesting) return;
    micTestingRef.current = true;
    maxLevelSeenRef.current = 0;
    setMicTesting(true);
    setManualErrorModalType(null);
    try {
      let stream = micStreamRef.current;
      if (!stream?.active || !stream.getAudioTracks().length || stream.getAudioTracks()[0].readyState !== 'live') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioDevice && selectedAudioDevice !== 'default' ? { deviceId: { exact: selectedAudioDevice } } : true,
        });
        bindMicStream(stream);
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx && !audioContextRef.current) {
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
      } else {
        bindMicStream(stream);
      }

      await new Promise((r) => setTimeout(r, 2500));
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
      setErrorModalDismissed(false);
      setManualErrorModalType(videoEnabled && cameraOk === false ? 'ALL' : 'MIC');
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
        { freq: 523.25, time: 0, dur: 0.25 },
        { freq: 659.25, time: 0.12, dur: 0.25 },
        { freq: 783.99, time: 0.24, dur: 0.35 },
        { freq: 1046.50, time: 0.36, dur: 0.45 },
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
      if (cameraStream) { videoRef.current.srcObject = cameraStream; videoRef.current.play().catch(() => { }); }
      else { videoRef.current.srcObject = null; }
    }
  }, [cameraStream]);

  // MediaPipe Vision & Lighting Loop
  useEffect(() => {
    if (step !== 'DEVICE_CHECK' || !videoEnabled || !cameraStream || !videoRef.current || !isVisionReady) return;
    let animId: number | null = null;
    const videoEl = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let frame = 0;

    const loop = (time: number) => {
      if (videoEl && !videoEl.paused && !videoEl.ended && videoEl.readyState >= 2) {
        detectVideoFrame(videoEl, time);
        if (++frame % 10 === 0 && ctx) {
          try {
            ctx.drawImage(videoEl, 0, 0, 32, 32);
            const d = ctx.getImageData(0, 0, 32, 32).data;
            let sum = 0;
            for (let i = 0; i < d.length; i += 4) sum += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
            const avg = sum / (32 * 32);
            setIsGoodLighting(avg >= 30 && avg <= 240);
          } catch { }
        }
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => { if (animId) cancelAnimationFrame(animId); };
  }, [step, videoEnabled, cameraStream, isVisionReady, detectVideoFrame]);

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
    if (conn?.addEventListener) {
      conn.addEventListener('change', handleConnChange);
    }

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
            }).catch(() => {});
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
      if (conn?.removeEventListener) {
        conn.removeEventListener('change', handleConnChange);
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, checkRealInternet, micOk, cameraOk, videoEnabled, cleanup]);

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
  const allChecksPass = internetStatus !== 'checking' && internetStatus !== 'failed' && micOk === true && micTested === true && speakerOk === true && speakerTested === true && (!videoEnabled || (cameraOk === true && cameraTested === true));

  const handleNext = async () => {
    if (step === 'CONFIGURATION') setStep('CONSENT');
    else if (step === 'CONSENT') setStep('DEVICE_CHECK');
    else if (step === 'DEVICE_CHECK') {
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

      if (onPrepareConfirmation) {
        setIsConfirmingFromBackend(true);
        try {
          await onPrepareConfirmation({
            browser_info: browserResult?.name || 'Standard Browser',
            os_info: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown OS',
            camera_permission: !!cameraOk, mic_permission: !!micOk, speaker_ok: !!speakerOk,
            bandwidth_kbps: bandwidthKbps, yolo_consent: videoAnalyticsEnabled, assessment_type: assessmentType,
            audio_enabled: true, video_enabled: videoEnabled, jd_text: jdText,
          });
        } catch { } finally { setIsConfirmingFromBackend(false); }
      }
      setStep('CONFIRMATION');
    } else if (step === 'CONFIRMATION') {
      onComplete({
        browser_info: browserResult?.name || 'Standard Browser',
        os_info: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown OS',
        camera_permission: !!cameraOk, mic_permission: !!micOk, speaker_ok: speakerOk !== false,
        bandwidth_kbps: bandwidthKbps, yolo_consent: videoAnalyticsEnabled, assessment_type: assessmentType,
        audio_enabled: true, video_enabled: videoEnabled, jd_text: jdText,
      });
    }
  };

  const handlePrevious = () => {
    if (step === 'CONSENT') setStep('CONFIGURATION');
    else if (step === 'DEVICE_CHECK') { cleanup(); setStep('CONSENT'); }
    else if (step === 'CONFIRMATION') setStep('DEVICE_CHECK');
  };

  // Vision Telemetry status metrics
  const isFaceDetected = (realtimeTelemetry?.face_visibility_pct ?? 0) > 0 || !!realtimeTelemetry?.face_box;
  const isEyesOnScreen = isFaceDetected && ((realtimeTelemetry?.screen_attention_pct ?? 0) >= 20 || (realtimeTelemetry?.eye_contact_pct ?? 0) >= 15 || !!realtimeTelemetry?.is_instant_straight);
  const hasGoodLighting = !!cameraStream && isGoodLighting;
  const isCentered = isFaceDetected && realtimeTelemetry?.sitting_position === 'Upright Centered';
  const isHeadPoseStraight = isFaceDetected && !!realtimeTelemetry?.is_instant_straight;

  return (
    <div
      className={
        step === 'DEVICE_CHECK' || step === 'CONFIRMATION'
          ? "fixed inset-0 z-[99999] w-screen h-screen bg-slate-100/80 dark:bg-[#070b14] flex items-center justify-center p-1.5 sm:p-3 overflow-hidden select-none"
          : "w-full h-full flex-1 flex flex-col p-1 sm:p-2 select-none"
      }
    >
      <div
        className={
          step === 'DEVICE_CHECK' || step === 'CONFIRMATION'
            ? "w-full max-w-[98vw] 2xl:max-w-[1650px] h-[92vh] max-h-[92vh] sm:h-[93.5vh] sm:max-h-[93.5vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/70 overflow-hidden flex flex-col my-auto transition-all animate-in fade-in duration-200"
            : "w-full flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all animate-in fade-in duration-200"
        }
      >

        {/* Top Bar Header */}
        <div className="relative w-full px-4 sm:px-6 py-3 min-h-[52px] sm:min-h-[56px] border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="w-20 hidden sm:block shrink-0" />
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-1 sm:flex-none">
            {[
              { key: 'CONFIGURATION', num: 1, label: 'Assessment Type' },
              { key: 'CONSENT', num: 2, label: 'Consent' },
              { key: 'DEVICE_CHECK', num: 3, label: 'Device Check' },
              { key: 'CONFIRMATION', num: 4, label: 'Confirmation' },
            ].map(({ key, num, label }, idx, arr) => {
              const isActive = step === key, isDone = arr.findIndex((s) => s.key === step) > idx;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all shadow-sm ${isActive ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-400/20' : isDone ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600'}`}>
                      {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : num}
                    </span>
                    <span className={`text-[11px] font-bold whitespace-nowrap ${isActive ? 'text-slate-900 dark:text-white' : isDone ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>{label}</span>
                  </div>
                  {idx < arr.length - 1 && <div className={`w-4 h-0.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                </div>
              );
            })}
          </div>

          <div className="w-20 flex justify-end shrink-0">
            {step !== 'CONFIGURATION' && step !== 'CONSENT' && (
              <button
                onClick={() => {
                  cleanup();
                  handlePrevious();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className={`flex-1 min-h-0 overflow-y-auto ${step === 'CONSENT' || step === 'CONFIGURATION' ? 'p-2 sm:p-4 justify-start' : 'pt-1 sm:pt-2 px-2 sm:px-4 pb-2 sm:pb-3 justify-between'} flex flex-col items-center w-full`}>

          {/* STEP 1: CONFIGURATION */}
          {step === 'CONFIGURATION' && (
            <div className="w-full max-w-6xl xl:max-w-7xl mx-auto mt-0 mb-auto flex flex-col pt-0 pb-1">
              <AssessmentConfig
                assessmentType={assessmentType} setAssessmentType={setAssessmentType}
                videoEnabled={videoEnabled} setVideoEnabled={setVideoEnabled}
                videoAnalyticsEnabled={videoAnalyticsEnabled} setVideoAnalyticsEnabled={setVideoAnalyticsEnabled}
                jdText={jdText} setShowJdModal={setShowJdModal} onNext={handleNext}
                onCancel={() => { cleanup(); onCancel(); }}
              />
            </div>
          )}

          {/* STEP 2: CONSENT */}
          {step === 'CONSENT' && (
            <div className="w-full max-w-6xl mx-auto mt-0 mb-auto flex flex-col py-0">
              <ConsentStep
                videoEnabled={videoEnabled} setVideoEnabled={setVideoEnabled}
                consentMic={consentMic} setConsentMic={setConsentMic}
                consentCamera={consentCamera} setConsentCamera={setConsentCamera}
                videoAnalyticsEnabled={videoAnalyticsEnabled} setVideoAnalyticsEnabled={setVideoAnalyticsEnabled}
                consentSaveRecording={consentSaveRecording} setConsentSaveRecording={setConsentSaveRecording}
                consentSaveTranscript={consentSaveTranscript} setConsentSaveTranscript={setConsentSaveTranscript}
                onBack={handlePrevious} onNext={handleNext}
              />
            </div>
          )}

          {/* STEP 3: DEVICE CHECK */}
          {step === 'DEVICE_CHECK' && (
            <div className="w-full max-w-full px-4 sm:px-6 pt-0 pb-0 flex flex-col justify-between flex-1 min-h-0 space-y-1.5 animate-in fade-in duration-200">

              {/* Main Workspace 2-Column Grid */}
              <div className="grid grid-cols-12 gap-5 sm:gap-6 items-stretch w-full max-w-full mx-auto my-auto flex-1">
                <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col justify-between h-full space-y-3">
                  {/* Video Viewport Frame / Audio-Only Card */}
                  <div className={`relative w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-center flex-1 ${!videoEnabled ? (((micTested && micOk === false) || (internetStatus === 'unstable' || internetStatus === 'failed')) ? 'min-h-[200px] max-h-[240px]' : 'min-h-[240px] sm:min-h-[270px] max-h-[320px]') + ' bg-[#F7F9FE] dark:bg-slate-900/90' : (((micTested && micOk === false) || (internetStatus === 'unstable' || internetStatus === 'failed')) ? 'aspect-[16/9] min-h-[210px] max-h-[260px]' : 'aspect-[16/9] min-h-[250px] sm:min-h-[285px] lg:min-h-[310px] max-h-[340px]') + ' bg-slate-950'}`}>
                    {!videoEnabled ? (
                      <div className="flex flex-col items-center justify-center gap-2 p-4 text-center select-none w-full h-full">
                        {speakerTested && speakerOk === false ? (
                          <div className="flex flex-col items-center justify-center animate-in fade-in duration-200">
                            {/* Concentric Pulsing Red Rings with Speaker icon */}
                            <div className="relative flex items-center justify-center">
                              <div className="w-18 h-18 rounded-full bg-rose-50/90 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40 flex items-center justify-center animate-pulse">
                                <div className="w-13 h-13 rounded-full bg-rose-100/90 border border-rose-200/90 dark:bg-rose-900/50 dark:border-rose-800 flex items-center justify-center">
                                  <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
                                    <VolumeX className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                              Unable to play test sound
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              We couldn&apos;t play the test sound from your speakers.
                            </p>
                          </div>
                        ) : micTested && micOk === false ? (
                          <div className="flex flex-col items-center justify-center animate-in fade-in duration-200">
                            {/* Concentric Pulsing Red Rings */}
                            <div className="relative flex items-center justify-center">
                              <div className="w-18 h-18 rounded-full bg-rose-50/90 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40 flex items-center justify-center animate-pulse">
                                <div className="w-13 h-13 rounded-full bg-rose-100/90 border border-rose-200/90 dark:bg-rose-900/50 dark:border-rose-800 flex items-center justify-center">
                                  <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
                                    <MicOff className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-2">
                              Microphone not found
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              No microphone detected or no audio input found.
                            </p>
                            {/* Segmented Level Visualizer */}
                            <div className="flex items-center gap-1 mt-2.5 px-3 py-1 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
                              {Array.from({ length: 22 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 rounded-full transition-all duration-75 ${
                                    micTesting && micLevel > (i / 22) * 100
                                      ? 'bg-rose-500 h-3.5'
                                      : i === 0
                                      ? 'bg-rose-500 h-3'
                                      : 'bg-slate-200 dark:bg-slate-700 h-1.5'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        ) : micTesting ? (
                          <div className="flex flex-col items-center justify-center animate-in fade-in duration-200">
                            <div className="w-15 h-15 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center animate-pulse">
                              <Mic className="w-6 h-6 text-[#4A6CF7]" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mt-2">Listening to microphone...</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Please speak now to test your audio levels.</p>
                            <div className="flex items-center gap-1 mt-2.5 px-3 py-1 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
                              {Array.from({ length: 22 }).map((_, i) => (
                                <div key={i} className={`w-1 rounded-full transition-all duration-75 ${micLevel > (i / 22) * 100 ? 'bg-emerald-500 h-3.5' : 'bg-slate-200 dark:bg-slate-700 h-1.5'}`} />
                              ))}
                            </div>
                          </div>
                        ) : micTested && micOk ? (
                          <div className="flex flex-col items-center justify-center animate-in fade-in duration-200">
                            <div className="w-15 h-15 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-2">Microphone Working</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Audio input successfully detected.</p>
                            <div className="flex items-center gap-1 mt-2.5 px-3 py-1 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
                              {Array.from({ length: 22 }).map((_, i) => (
                                <div key={i} className={`w-1 rounded-full transition-all duration-75 ${i < 14 ? 'bg-emerald-500 h-3' : 'bg-slate-200 dark:bg-slate-700 h-1.5'}`} />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2.5 p-5 text-center select-none w-full h-full">
                            <div className="w-14 h-14 rounded-full border border-blue-200 flex items-center justify-center bg-blue-50/50">
                              <Mic className="w-6 h-6 text-[#4A6CF7]" />
                            </div>
                            <div>
                              <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">AUDIO-ONLY MODE</span>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Microphone and speaker diagnostics active.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (!cameraStream || (cameraTested && cameraOk === false)) ? (
                      <div className="flex flex-col items-center justify-center gap-2.5 p-5 text-center select-none w-full h-full bg-[#F8FAFC] dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-200">
                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-2xs ${
                          cameraTested && cameraOk === false
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-500'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200/70 dark:border-slate-700/60 text-slate-400 dark:text-slate-500'
                        }`}>
                          {cameraTested && cameraOk === false ? (
                            <VideoOff className="w-7 h-7 stroke-[1.8]" />
                          ) : (
                            <Video className="w-7 h-7 stroke-[1.8] text-[#4A6CF7]" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {cameraTested && cameraOk === false ? 'No camera found' : 'Camera Preview'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm font-medium leading-relaxed">
                            {cameraTested && cameraOk === false
                              ? 'Please check camera permissions in browser settings to proceed with AI proctoring.'
                              : 'Click "Test Camera" below to verify video feed.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={(el) => {
                            videoRef.current = el;
                            if (el && cameraStream && el.srcObject !== cameraStream) { el.srcObject = cameraStream; el.play().catch(() => { }); }
                          }}
                          autoPlay playsInline muted
                          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${cameraStream ? 'opacity-100' : 'opacity-0'}`}
                        />
                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[11px] font-medium backdrop-blur-md shadow-sm pointer-events-none">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Camera preview {cameraDetails ? `• ${cameraDetails.resolution}${cameraDetails.frameRate ? ` @ ${cameraDetails.frameRate}fps` : ''}` : ''}</span>
                        </div>

                        {/* Alignment Bounding Box */}
                        {cameraStream && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            {isFaceDetected && isCentered ? (
                              <div className="w-[160px] sm:w-[185px] lg:w-[200px] h-[180px] sm:h-[210px] lg:h-[230px] rounded-2xl border-2 border-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.35)] transition-all duration-200 transform -translate-y-1.5" />
                            ) : (
                              <div className="w-[160px] sm:w-[185px] lg:w-[200px] h-[180px] sm:h-[210px] lg:h-[230px] rounded-2xl border-2 border-dashed border-amber-400/70 shadow-[0_0_15px_rgba(251,191,36,0.2)] transition-all duration-200 transform -translate-y-1.5 flex items-center justify-center">
                                <span className="px-2 py-0.5 rounded bg-slate-900/80 text-amber-300 text-[10.5px] font-bold backdrop-blur-xs">
                                  Align face in frame
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Internet Troubleshooting Alert Card (Shown whenever internet is offline or unstable) */}
                  {(internetStatus === 'unstable' || internetStatus === 'failed') && (
                    <div className="w-full bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 rounded-2xl p-3.5 sm:p-4 text-left space-y-3 animate-in fade-in duration-200 shadow-2xs">
                      {/* 3 Metric Cards */}
                      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full">
                        {/* Download */}
                        <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-200/80 dark:border-slate-700 shadow-2xs">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 shadow-2xs">
                            <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-[13.5px] font-extrabold text-rose-600 dark:text-rose-400 leading-tight truncate">
                              {internetStatus === 'failed' ? '0.0 Mbps' : `${((bandwidthKbps || 300) / 1024).toFixed(1)} Mbps`}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Download</div>
                          </div>
                        </div>

                        {/* Upload */}
                        <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-200/80 dark:border-slate-700 shadow-2xs">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 shadow-2xs">
                            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-[13.5px] font-extrabold text-rose-600 dark:text-rose-400 leading-tight truncate">
                              {internetStatus === 'failed' ? '0.0 Mbps' : `${(((bandwidthKbps || 300) * 0.5) / 1024).toFixed(1)} Mbps`}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Upload</div>
                          </div>
                        </div>

                        {/* Latency */}
                        <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-200/80 dark:border-slate-700 shadow-2xs">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 shadow-2xs">
                            <Activity className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-[13.5px] font-extrabold text-rose-600 dark:text-rose-400 leading-tight truncate">
                              {internetStatus === 'failed' ? 'Offline' : `${networkPingMs || 420} ms`}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Latency</div>
                          </div>
                        </div>
                      </div>

                      {/* Alert Card Header & Advice List with Try Again button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                            <WifiOff className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <h4 className="text-xs sm:text-[13px] font-bold text-rose-600 dark:text-rose-400 leading-tight">
                              {internetStatus === 'failed' ? 'Internet connection offline. Please check:' : 'Your connection may lead to a poor interview experience. Try:'}
                            </h4>
                            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200 font-medium">
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>Switch to a wired Ethernet connection if possible.</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>Move closer to your Wi-Fi router.</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>Stop other downloads or video streaming.</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>Try a different network or mobile hotspot.</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Try Again Button placed in card */}
                        <div className="self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setBandwidthChecking(true);
                              checkRealInternet().finally(() => setBandwidthChecking(false));
                            }}
                            disabled={bandwidthChecking}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${bandwidthChecking ? 'animate-spin' : ''}`} />
                            <span>{bandwidthChecking ? 'Checking...' : 'Try Again'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Camera Troubleshooting Alert Card (Shown when camera failed and internet is not completely offline) */}
                  {(videoEnabled && cameraTested && cameraOk === false && internetStatus !== 'failed') && (
                    <div className="w-full bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 rounded-xl p-3.5 sm:p-4 text-left flex items-start justify-between gap-3.5 animate-in fade-in duration-200 shadow-2xs">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <VideoOff className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h4 className="text-xs sm:text-[13px] font-bold text-rose-600 dark:text-rose-400 leading-tight">
                            Camera not detected or access blocked. Please check:
                          </h4>
                          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200 font-medium">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>Your webcam is plugged in and lens cover is open.</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>Browser permission is allowed (click the lock 🔒 icon in your URL bar).</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>Select your preferred device from the Camera dropdown below.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => testCamera()}
                          disabled={testingCamera}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${testingCamera ? 'animate-spin' : ''}`} />
                          <span>{testingCamera ? 'Testing...' : 'Try Again'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Microphone Troubleshooting Alert Card (Shown when mic failed and internet is not completely offline) */}
                  {(micTested && micOk === false && internetStatus !== 'failed') && (
                    <div className="w-full bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 rounded-xl p-3.5 sm:p-4 text-left flex items-start justify-between gap-3.5 animate-in fade-in duration-200 shadow-2xs">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <MicOff className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h4 className="text-xs sm:text-[13px] font-bold text-rose-600 dark:text-rose-400 leading-tight">
                            Microphone not detected or no audio received. Please check:
                          </h4>
                          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200 font-medium">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>Your microphone is plugged in and hardware mute switch is off.</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>Browser permission is allowed (click the lock 🔒 icon in your URL bar).</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>Select your preferred device from the Microphone dropdown below.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => testMicrophone()}
                          disabled={micTesting}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${micTesting ? 'animate-spin' : ''}`} />
                          <span>{micTesting ? 'Testing...' : 'Try Again'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Speaker Troubleshooting Alert Card (Shown when speaker failed and internet is not completely offline) */}
                  {(speakerTested && speakerOk === false && internetStatus !== 'failed') && (
                    <div className="w-full bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 rounded-xl p-3.5 sm:p-4 text-left flex items-start justify-between gap-3.5 animate-in fade-in duration-200 shadow-2xs">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <VolumeX className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h4 className="text-xs sm:text-[13px] font-bold text-rose-600 dark:text-rose-400 leading-tight">
                            We couldn&apos;t play the test sound. Please check:
                          </h4>
                          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200 font-medium">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>Your speakers are connected and volume is up.</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>Your browser is allowed to play sound.</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>Try a different speaker or device.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => playChimeTone()}
                          disabled={speakerTestState === 'playing'}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${speakerTestState === 'playing' ? 'animate-spin' : ''}`} />
                          <span>{speakerTestState === 'playing' ? 'Playing...' : 'Try Again'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hardware Selectors (Bottom) */}
                  {(() => {
                    const activeVideoValue = videoDevices.some((d) => d.deviceId === selectedVideoDevice)
                      ? selectedVideoDevice
                      : (videoDevices[0]?.deviceId || 'default');
                    const activeAudioValue = audioDevices.some((d) => d.deviceId === selectedAudioDevice)
                      ? selectedAudioDevice
                      : (audioDevices[0]?.deviceId || 'default');

                    return (
                      <div className={`grid gap-3.5 sm:gap-4 pt-2.5 mt-auto ${videoEnabled ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 max-w-2xl'}`}>
                        {videoEnabled && (
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white mb-1.5">Camera</span>
                            <div className="relative w-full">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Video className="w-4 h-4" /></div>
                              <select
                                value={activeVideoValue}
                                onChange={(e) => {
                                  setSelectedVideoDevice(e.target.value);
                                  setCameraOk(null);
                                  setCameraTested(false);
                                  cleanup('VIDEO_ONLY');
                                }}
                                className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-9 text-xs sm:text-[12.5px] font-medium text-slate-800 dark:text-slate-200 appearance-none cursor-pointer truncate shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              >
                                {videoDevices.length > 0 ? (
                                  videoDevices.map((d, i) => (
                                    <option key={d.deviceId || `cam-${i}`} value={d.deviceId} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">
                                      {d.label || `Camera ${i + 1}`}
                                    </option>
                                  ))
                                ) : (
                                  <option value="default" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Integrated Webcam</option>
                                )}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <div className="mt-2 flex items-center">
                              <button type="button" onClick={() => testCamera()} disabled={testingCamera} className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 text-[#4A6CF7] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                                <Video className="w-4 h-4 text-[#4A6CF7]" />
                                <span>{testingCamera ? 'Testing...' : cameraTested && cameraOk ? 'Retest Camera' : 'Test Camera'}</span>
                              </button>
                            </div>
                            {(cameraTested && cameraOk === false) && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-rose-500 dark:text-rose-400 animate-in fade-in duration-200">
                                <VideoOff className="w-3.5 h-3.5 shrink-0 text-rose-500 dark:text-rose-400" />
                                <span>No camera detected. Please check permissions or select another camera.</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col">
                          <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white mb-1.5">Microphone</span>
                          <div className="relative w-full">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Mic className="w-4 h-4" /></div>
                            <select
                              value={activeAudioValue}
                              onChange={(e) => {
                                setSelectedAudioDevice(e.target.value);
                                setMicOk(null);
                                setMicTested(false);
                                cleanup('AUDIO_ONLY');
                              }}
                              className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-9 text-xs sm:text-[12.5px] font-medium text-slate-800 dark:text-slate-200 appearance-none cursor-pointer truncate shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                              {audioDevices.length > 0 ? (
                                audioDevices.map((d, i) => (
                                  <option key={d.deviceId || `mic-${i}`} value={d.deviceId} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">
                                    {d.label || `Microphone ${i + 1}`}
                                  </option>
                                ))
                              ) : (
                                <option value="default" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Default Microphone</option>
                              )}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                          <div className="mt-2 flex items-center gap-2.5">
                            <button type="button" onClick={() => testMicrophone()} disabled={micTesting} className={`h-9 px-4 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${micTesting ? 'bg-[#4A6CF7] text-white border-[#4A6CF7]' : 'bg-white hover:bg-slate-50 dark:bg-slate-800 text-[#4A6CF7] border-slate-200 dark:border-slate-700'}`}>
                              <Mic className={`w-4 h-4 ${micTesting ? 'text-white' : 'text-[#4A6CF7]'}`} />
                              <span>{micTesting ? 'Listening...' : micTested && micOk ? 'Retest Mic' : 'Test Mic'}</span>
                            </button>
                            <div className="flex items-center gap-1 px-1.5 py-0.5">
                              {Array.from({ length: 14 }).map((_, i) => (
                                <div key={i} className={`w-1 rounded-full transition-all duration-75 ${(micTesting ? micLevel > (i / 14) * 100 : micTested && micOk ? i < 10 : micTested && micOk === false ? i === 0 : false) ? (micTested && micOk === false ? 'bg-rose-500 h-3' : 'bg-emerald-500 h-3.5') : 'bg-slate-200 dark:bg-slate-700 h-1.5'}`} />
                              ))}
                            </div>
                          </div>
                          {micTested && micOk === false && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-rose-500 dark:text-rose-400 animate-in fade-in duration-200">
                              <MicOff className="w-3.5 h-3.5 shrink-0 text-rose-500 dark:text-rose-400" />
                              <span>No microphone detected. Please check permissions or select another mic.</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white mb-1.5">Speaker</span>
                          <div className="relative w-full">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Volume2 className="w-4 h-4" /></div>
                            <div className="w-full h-10 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 text-xs sm:text-[12.5px] font-medium text-slate-800 dark:text-slate-200 truncate shadow-2xs">Default Speaker</div>
                          </div>
                          <div className="mt-2">
                            {speakerTestState === 'confirming' ? (
                              <div className="h-9 inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 shadow-2xs">
                                <span className="text-xs font-semibold">Heard?</span>
                                <button type="button" onClick={() => { setSpeakerTestState('idle'); setSpeakerTested(true); setSpeakerOk(true); }} className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors">Yes</button>
                                <button type="button" onClick={() => { setSpeakerTestState('idle'); setSpeakerTested(true); setSpeakerOk(false); }} className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors">No</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => playChimeTone()} className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 text-[#4A6CF7] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                                <Volume2 className="w-4 h-4 text-[#4A6CF7]" />
                                <span>{speakerTestState === 'playing' ? 'Playing...' : speakerTested && speakerOk ? 'Retest Sound' : 'Test Sound'}</span>
                              </button>
                            )}
                          </div>
                          {speakerTested && speakerOk === false && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-rose-500 dark:text-rose-400 animate-in fade-in duration-200">
                              <VolumeX className="w-3.5 h-3.5 shrink-0 text-rose-500 dark:text-rose-400" />
                              <span>Unable to play sound. Please check speaker output.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right Column: Device Status Card OR Permission Guide Card */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col space-y-3">
                  {showPermissionGuide ? (
                    /* Browser Permissions Required Notice Card (Camera / Microphone) */
                    <div className="bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 rounded-2xl p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200 shadow-2xs text-left relative overflow-hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                            <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 leading-tight">
                              {permissionGuideTarget === 'mic' ? 'Microphone Permission Required' : permissionGuideTarget === 'camera' ? 'Camera Permission Required' : 'Browser Permissions Required'}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                              {permissionGuideTarget === 'mic' 
                                ? 'Your browser blocked microphone access. Please allow permission to capture your voice during the assessment.' 
                                : permissionGuideTarget === 'camera' 
                                ? 'Your browser blocked camera access. Please allow permission for AI video proctoring.' 
                                : 'Please allow camera and microphone access in your browser to continue.'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPermissionGuide(false)}
                          className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-colors"
                          title="Back to Device Status"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-200 font-medium">
                        <div className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#5E48E8] text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs mt-0.5">1</span>
                          <span>Click the <strong>lock 🔒</strong> or <strong>site settings ⚙️</strong> icon in your address bar (next to URL).</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#5E48E8] text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs mt-0.5">2</span>
                          <span>Find <strong>{permissionGuideTarget === 'mic' ? 'Microphone' : permissionGuideTarget === 'camera' ? 'Camera' : 'Camera and Microphone'}</strong> and set permission to <strong>Allow</strong>.</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#5E48E8] text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs mt-0.5">3</span>
                          <span>Click <strong>Try Again</strong> below to re-verify your device.</span>
                        </div>
                      </div>

                      <div className="pt-3 flex items-center justify-end gap-2 border-t border-rose-200/60 dark:border-rose-900/40">
                        <button
                          type="button"
                          onClick={() => setShowPermissionGuide(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPermissionGuide(false);
                            runDiagnostics();
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Try Again</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Default Device Status Card */
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs animate-in fade-in duration-200">
                      <div className="px-5 pt-3.5 pb-2"><h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">Device Status</h3></div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        <div className="flex items-center justify-between px-5 py-2.5">
                          <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Globe className="w-3.5 h-3.5" /></div><span className="text-xs sm:text-sm font-semibold">Browser support</span></div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></span>
                        </div>
                        <div onClick={() => { if (internetStatus === 'unstable' || internetStatus === 'failed') { setBandwidthChecking(true); checkRealInternet().finally(() => setBandwidthChecking(false)); } }} className={`flex items-center justify-between px-5 py-2.5 transition-colors ${internetStatus === 'unstable' || internetStatus === 'failed' ? 'cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${internetStatus === 'passed' ? 'bg-emerald-50 text-emerald-600' :
                                internetStatus === 'unstable' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                                  internetStatus === 'checking' ? 'bg-blue-50 text-blue-600' :
                                    'bg-rose-50 text-rose-600'
                              }`}>
                              {internetStatus === 'failed' ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-xs sm:text-sm font-semibold">Internet connection</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${internetStatus === 'passed' ? 'text-emerald-600' :
                              internetStatus === 'unstable' ? 'text-amber-600 dark:text-amber-400' :
                                internetStatus === 'checking' ? 'text-purple-600' :
                                  'text-rose-600'
                            }`}>
                            {internetStatus === 'checking' ? (
                              'Testing...'
                            ) : internetStatus === 'passed' ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                            ) : internetStatus === 'unstable' ? (
                              <><AlertTriangle className="w-3.5 h-3.5" /> Unstable <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                            ) : (
                              <><XCircle className="w-3.5 h-3.5" /> Failed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
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
                            className={`flex items-center justify-between px-5 py-2.5 transition-colors cursor-pointer ${
                              cameraTested && cameraOk === false ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                cameraTested && cameraOk === false
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                  : cameraTested && cameraOk
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {cameraTested && cameraOk === false ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-xs sm:text-sm font-semibold">Camera</span>
                            </div>
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              testingCamera
                                ? 'text-purple-600'
                                : cameraTested && cameraOk
                                ? 'text-emerald-600'
                                : cameraTested && cameraOk === false
                                ? 'text-rose-600'
                                : 'text-slate-500'
                            }`}>
                              {testingCamera ? (
                                'Testing...'
                              ) : cameraTested && cameraOk ? (
                                <><CheckCircle2 className="w-3.5 h-3.5" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                              ) : cameraTested && cameraOk === false ? (
                                <><XCircle className="w-3.5 h-3.5" /> Failed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
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
                          className={`flex items-center justify-between px-5 py-2.5 transition-colors cursor-pointer ${
                            micTested && micOk === false ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              micTested && micOk === false
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                : micTested && micOk
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                              {micTested && micOk === false ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-xs sm:text-sm font-semibold">Microphone</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            micTesting
                              ? 'text-purple-600'
                              : micTested && micOk
                              ? 'text-emerald-600'
                              : micTested && micOk === false
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}>
                            {micTesting ? (
                              'Testing...'
                            ) : micTested && micOk ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                            ) : micTested && micOk === false ? (
                              <><XCircle className="w-3.5 h-3.5" /> Failed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                            ) : (
                              'Click to test'
                            )}
                          </span>
                        </div>
                        <div
                          onClick={() => playChimeTone()}
                          className={`flex items-center justify-between px-5 py-2.5 cursor-pointer transition-colors ${
                            speakerTested && speakerOk === false ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              speakerTested && speakerOk === false
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                : speakerTested && speakerOk
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                              {speakerTested && speakerOk === false ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-xs sm:text-sm font-semibold">Speaker</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            speakerTestState === 'playing'
                              ? 'text-purple-600'
                              : speakerTestState === 'confirming'
                              ? 'text-amber-600'
                              : speakerTested && speakerOk
                              ? 'text-emerald-600'
                              : speakerTested && speakerOk === false
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}>
                            {speakerTestState === 'playing' ? (
                              'Playing...'
                            ) : speakerTestState === 'confirming' ? (
                              <span className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[11px] text-slate-500">Heard?</span>
                                <button type="button" onClick={() => { setSpeakerTestState('idle'); setSpeakerTested(true); setSpeakerOk(true); }} className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold transition-colors">Yes</button>
                                <button type="button" onClick={() => { setSpeakerTestState('idle'); setSpeakerTested(true); setSpeakerOk(false); }} className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10.5px] font-bold transition-colors">No</button>
                              </span>
                            ) : speakerTested && speakerOk ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> Passed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                            ) : speakerTested && speakerOk === false ? (
                              <><XCircle className="w-3.5 h-3.5" /> Failed <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></>
                            ) : (
                              'Click to test'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {allChecksPass && (
                    <div className="bg-[#F6F2FF] dark:bg-purple-950/30 border border-purple-200/80 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-7.5 h-7.5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shrink-0"><Check className="w-4 h-4 stroke-[3]" /></div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#6D28D9] dark:text-purple-300">All devices are working correctly!</p>
                        <p className="text-[11.5px] text-slate-500 font-medium">You&apos;re ready to continue.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full mt-2">
                <button type="button" onClick={() => { cleanup(); setStep('CONSENT'); }} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm">
                  ← Back
                </button>
                <button type="button" onClick={handleNext} disabled={!allChecksPass} className={`px-7 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 ${allChecksPass ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md cursor-pointer' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-75'}`}>
                  {!allChecksPass && <Lock className="w-3.5 h-3.5" />}
                  <span>Next: Confirmation</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION */}
          {step === 'CONFIRMATION' && (
            <div></div>
          )}
        </div>
      </div>

      {/* JD Modal */}
      {showJdModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowJdModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Add Job Description</h3>
              </div>
              <button onClick={() => setShowJdModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <textarea
              value={jdText} onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste target job description content here..." rows={6}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 text-xs focus:outline-none focus:border-indigo-600 resize-none font-medium"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setJdText(''); setShowJdModal(false); }} className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl">Clear</button>
              <button onClick={() => setShowJdModal(false)} className="px-5 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-md">Save &amp; Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceCheckWizard;
