/**
 * DeviceCheckWizard Component
 *
 * Target Workspace: wbl-frontend
 * Primary Developer: Narasimha (FE1)
 *
 * Flow: DEVICE_CHECK → REVIEW_INSTRUCTIONS → Start Assessment
 *
 * Layout (Device Check):
 *   Left  (3/5) – Camera preview + mic equalizer underneath
 *   Right (2/5) – Device selectors stacked above Readiness checklist
 *
 * Uses ONLY valid Tailwind CSS scale values so dark mode works correctly.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { YOLOAnalyzer } from './YOLOAnalyzer';

// ─── Types ──────────────────────────────────────────────────────────────────
interface DeviceCheckWizardProps {
  assessmentId: number;
  audioOnly?: boolean;
  onComplete: (results: {
    browser_info: string;
    os_info: string;
    camera_permission: boolean;
    mic_permission: boolean;
    speaker_ok: boolean;
    bandwidth_kbps: number;
  }) => void;
  onCancel: () => void;
}

type WizardStep = 'DEVICE_CHECK' | 'REVIEW_INSTRUCTIONS';

// ─── Small reusable pieces ──────────────────────────────────────────────────
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
      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  if (status)
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-3 h-3" /> {passLabel}
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
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
    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
      {icon}
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="
          w-full appearance-none
          text-[12px] font-medium
          bg-slate-50 dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          rounded-lg py-2 pl-3 pr-8
          text-slate-800 dark:text-slate-100
          focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors
        "
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
    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-350">{label}</span>
    {badge}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export const DeviceCheckWizard: React.FC<DeviceCheckWizardProps> = ({
  assessmentId,
  audioOnly = false,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<WizardStep>('DEVICE_CHECK');

  // Browser / OS
  const [browserResult, setBrowserResult] = useState<{
    ok: boolean;
    name: string;
    os: string;
  } | null>(null);

  // Devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');

  // Camera
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [faceVerified, setFaceVerified] = useState(false);

  // Mic
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [transcriptionText, setTranscriptionText] = useState('');

  // Speaker
  const [speakerTested, setSpeakerTested] = useState(false);
  const [speakerOk, setSpeakerOk] = useState<boolean | null>(null);
  const [isPlayingTone, setIsPlayingTone] = useState(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);

  // Network
  const [bandwidthKbps, setBandwidthKbps] = useState(0);
  const [bandwidthChecking, setBandwidthChecking] = useState(false);

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

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Browser detection
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

    runDiagnostics();

    const handleDeviceChange = () => {
      const micTrack = micStreamRef.current?.getAudioTracks()[0];
      if (!micTrack || micTrack.readyState === 'ended' || micTrack.muted) {
        setMicOk(false);
        setHardwareError("Hardware disconnection detected: Please check your microphone/headset cable.");
      }
    };

    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => { cleanup(); };
  }, []);

  // ── Debounced device switching ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedVideoDevice || selectedVideoDevice === prevVideoDeviceRef.current) return;
    if (videoDebounceRef.current) clearTimeout(videoDebounceRef.current);
    videoDebounceRef.current = setTimeout(() => {
      prevVideoDeviceRef.current = selectedVideoDevice;
      startCamera(selectedVideoDevice);
    }, 400);
  }, [selectedVideoDevice]);

  useEffect(() => {
    if (!selectedAudioDevice || selectedAudioDevice === prevAudioDeviceRef.current) return;
    if (audioDebounceRef.current) clearTimeout(audioDebounceRef.current);
    audioDebounceRef.current = setTimeout(() => {
      prevAudioDeviceRef.current = selectedAudioDevice;
      startMic(selectedAudioDevice);
    }, 400);
  }, [selectedAudioDevice]);

  // ── Re-attach camera when navigating BACK to device check ────────────────
  // When the user goes to Review Guidelines then clicks Back, the <video>
  // element unmounts and remounts. The stream is still alive in cameraStreamRef
  // but srcObject is lost. Re-bind it after React has re-rendered the DOM.
  useEffect(() => {
    if (step === 'DEVICE_CHECK') {
      const stream = cameraStreamRef.current;
      if (stream && stream.active) {
        // Give React one tick to finish painting the video element
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


  // ── Helpers ─────────────────────────────────────────────────────────────
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

  const runDiagnostics = () => {
    startMic();
    if (!audioOnly) startCamera();
    checkBandwidth();
  };

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
      loadDevices();
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraOk(false);
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
            // Auto-restart if the mic stream is still active
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
    } catch (err) {
      console.error('Mic error:', err);
      setMicOk(false);
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

  // ── Navigation ───────────────────────────────────────────────────────────
  const allChecksPass =
    !!browserResult?.ok &&
    bandwidthKbps >= 100 &&
    !!micOk &&
    !!speakerOk &&
    (audioOnly || !!cameraOk);

  const handleNext = () => {
    // Re-verify microphone track before advancing or completing
    const micTrack = micStreamRef.current?.getAudioTracks()[0];
    const isMicActive = micTrack && micTrack.readyState === 'live' && !micTrack.muted;

    if (!isMicActive) {
      setMicOk(false);
      setHardwareError("Microphone or headset cable was disconnected! Please reconnect your audio device to proceed.");
      setStep('DEVICE_CHECK');
      return;
    }

    if (!audioOnly) {
      const camTrack = cameraStreamRef.current?.getVideoTracks()[0];
      const isCamActive = camTrack && camTrack.readyState === 'live' && !camTrack.muted;
      if (!isCamActive) {
        setCameraOk(false);
        setHardwareError("Camera was disconnected! Please reconnect your webcam to proceed.");
        setStep('DEVICE_CHECK');
        return;
      }
    }

    setHardwareError(null);

    if (step === 'DEVICE_CHECK') {
      setStep('REVIEW_INSTRUCTIONS');
    } else {
      cleanup();
      onComplete({
        browser_info: browserResult?.name ?? 'Unknown',
        os_info: browserResult?.os ?? 'Unknown',
        camera_permission: !audioOnly && !!cameraOk,
        mic_permission: !!micOk,
        speaker_ok: !!speakerOk,
        bandwidth_kbps: bandwidthKbps,
      });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[94vh] w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden">

      {/* ── TOP HEADER BAR ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
              <Laptop className="w-3 h-3" /> Secure Proctoring Check
            </p>
          </div>
        </div>

        {/* Step indicators — centered */}
        <div className="flex items-center gap-2">
          {/* Step 1 */}
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${step === 'DEVICE_CHECK'
              ? 'bg-indigo-600 text-white'
              : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
              }`}>
              {step === 'REVIEW_INSTRUCTIONS' ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
            </span>
            <span className={`text-[11px] font-bold transition-colors ${step === 'DEVICE_CHECK' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
              }`}>
              Device Check
            </span>
          </div>

          <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />

          {/* Step 2 */}
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${step === 'REVIEW_INSTRUCTIONS'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}>
              2
            </span>
            <span className={`text-[11px] font-bold transition-colors ${step === 'REVIEW_INSTRUCTIONS' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
              }`}>
              Guidelines
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="w-40" />
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden px-6 py-4">

        {/* ═══════════════ STEP 1: DEVICE CHECK ════════════════════════════ */}
        {step === 'DEVICE_CHECK' && (
          <div className="h-full grid grid-cols-5 gap-5">

            {/* ── LEFT: Camera + Mic Visualizer ───────────────────────────── */}
            <div className="col-span-3 flex flex-col gap-3 min-h-0">

              {/* Camera feed */}
              <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md flex items-center justify-center">
                {audioOnly ? (
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <Mic className="w-6 h-6 text-indigo-400 animate-pulse  mt-3" />
                    </div>
                    <p className="text-sm font-bold text-white">Audio-Only</p>
                    <p className="text-xs text-slate-400">No camera required for this session.</p>
                  </div>
                ) : cameraOk === false ? (
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <XCircle className="w-10 h-10 text-red-400" />
                    <p className="text-sm font-bold text-white">Camera Access Denied</p>
                    <p className="text-xs text-slate-400">Click the camera icon in your browser's address bar and allow access.</p>
                  </div>
                ) : cameraOk ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                    {cameraStream && (
                      <YOLOAnalyzer
                        videoRef={videoRef}
                        enabled
                        assessmentId={assessmentId}
                        onFaceStatusChange={(s) =>
                          setFaceVerified(s.faceDetected && s.isStraight)
                        }
                      />
                    )}
                    {/* Face status pill */}
                    <div className="absolute bottom-3 left-3 z-20">
                      {faceVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-900/80 border border-emerald-600 text-emerald-300 backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Face correctly framed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-900/80 border border-amber-600 text-amber-300 backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Align face in frame
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Camera className="w-8 h-8 text-indigo-400/40 animate-pulse" />
                    <p className="text-xs animate-pulse">Starting camera…</p>
                  </div>
                )}
              </div>

              {/* Mic equalizer card */}
              <div className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm">
                {/* Single row: icon · bars · transcript · badge */}
                <div className="flex items-center gap-3">

                  {/* Mic icon + label */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Mic className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">
                      Mic
                    </span>
                  </div>

                  {/* Equalizer bars — 24 slim bars */}
                  <div className="flex items-end gap-[2px] h-6 shrink-0">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const threshold = (i / 24) * 100;
                      const active = micLevel > threshold;
                      const col =
                        i < 14
                          ? active ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-emerald-100 dark:bg-emerald-900/40'
                          : i < 20
                            ? active ? 'bg-amber-400 dark:bg-amber-300' : 'bg-amber-100 dark:bg-amber-900/40'
                            : active ? 'bg-red-500 dark:bg-red-400' : 'bg-red-100 dark:bg-red-900/40';
                      return (
                        <div
                          key={i}
                          className={`w-[3px] rounded-[1px] transition-all duration-[60ms] ${col}`}
                          style={{
                            height: active
                              ? `${Math.max(20, Math.min(100, 20 + micLevel * 0.80))}%`
                              : '14%',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Transcription text — same row, fills remaining space */}
                  <div className="flex-1 min-w-0">
                    {transcriptionText ? (
                      <p className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-md px-2 py-0.5 truncate">
                        🎙 &ldquo;{transcriptionText}&rdquo;
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate">
                        {micOk ? 'Speak to test mic…' : 'Allow mic access'}
                      </p>
                    )}
                  </div>

                  {/* Status badge — right-anchored */}
                  <div className="shrink-0">
                    <StatusBadge status={micOk} passLabel="Active" failLabel="Blocked" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Device Config + Checklist ────────────────────────── */}
            <div className="col-span-2 flex flex-col gap-4 min-h-0 overflow-y-auto pr-0.5">

              {/* ── Device Configuration card ─────────────────────────────── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4 shrink-0">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" /> Device Configuration
                </h3>

                {/* Webcam */}
                {!audioOnly && (
                  <DeviceSelect
                    label="Webcam"
                    icon={<Camera className="w-3 h-3" />}
                    value={selectedVideoDevice}
                    onChange={setSelectedVideoDevice}
                    disabled={!cameraOk}
                    options={
                      videoDevices.length
                        ? videoDevices.map((d, i) => ({
                          value: d.deviceId,
                          label: d.label || `Camera ${i + 1}`,
                        }))
                        : [{ value: '', label: 'Default Camera' }]
                    }
                  />
                )}

                {/* Microphone */}
                <DeviceSelect
                  label="Microphone"
                  icon={<Mic className="w-3 h-3" />}
                  value={selectedAudioDevice}
                  onChange={setSelectedAudioDevice}
                  disabled={!micOk}
                  options={
                    audioDevices.length
                      ? audioDevices.map((d, i) => ({
                        value: d.deviceId,
                        label: d.label || `Microphone ${i + 1}`,
                      }))
                      : [{ value: '', label: 'Default Microphone' }]
                  }
                />

                {/* Speaker */}
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <Volume2 className="w-3 h-3" /> Speakers
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 text-[12px] font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-slate-500 dark:text-slate-400 opacity-70 select-none">
                      System Default
                    </div>
                    <button
                      onClick={playTestTone}
                      disabled={isPlayingTone}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] font-bold text-indigo-700 dark:text-indigo-300 transition-all shrink-0 active:scale-95 disabled:opacity-75"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingTone ? 'animate-bounce text-indigo-600 dark:text-indigo-400' : ''}`} />
                      <span>{isPlayingTone ? 'Playing...' : 'Test'}</span>
                    </button>
                  </div>

                  {/* Hear the beep? */}
                  {speakerTested && (
                    <div className="flex items-center justify-between mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-350">Did you hear it?</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSpeakerOk(true)}
                          className={`px-3 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${speakerOk === true
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                            }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setSpeakerOk(false)}
                          className={`px-3 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${speakerOk === false
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-400'
                            }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Readiness Checklist card ───────────────────────────────── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5" /> Readiness Checklist
                  </h3>
                  <button
                    onClick={runDiagnostics}
                    className="px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <Zap className="w-3 h-3" /> Re-scan Devices
                  </button>
                </div>

                <ChecklistRow
                  label="Browser"
                  badge={
                    <StatusBadge
                      status={browserResult?.ok ?? null}
                      passLabel={browserResult?.name ?? 'Supported'}
                      failLabel="Unsupported Browser"
                    />
                  }
                />

                <ChecklistRow
                  label="Network"
                  badge={
                    bandwidthChecking ? (
                      <span className="text-[10px] font-semibold text-indigo-500 animate-pulse flex items-center gap-1">
                        <Wifi className="w-3 h-3" /> Checking…
                      </span>
                    ) : (
                      <StatusBadge
                        status={bandwidthKbps >= 100}
                        passLabel={`${bandwidthKbps.toLocaleString()} Kbps`}
                        failLabel="Too Slow"
                      />
                    )
                  }
                />

                {!audioOnly && (
                  <ChecklistRow
                    label="Webcam"
                    badge={<StatusBadge status={cameraOk} passLabel="Active" failLabel="Blocked" />}
                  />
                )}

                <ChecklistRow
                  label="Microphone"
                  badge={<StatusBadge status={micOk} passLabel="Verified" failLabel="Blocked" />}
                />

                <ChecklistRow
                  label="Speaker"
                  badge={
                    speakerOk === null ? (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                        Not tested — click Test above
                      </span>
                    ) : (
                      <StatusBadge status={speakerOk} passLabel="Audible" failLabel="No Sound" />
                    )
                  }
                />

                {/* Overall status */}
                <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold transition-colors ${allChecksPass
                  ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  }`}>
                  {allChecksPass ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      All checks passed — ready to proceed
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Complete all checks above to continue
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 2: REVIEW GUIDELINES ═══════════════════════ */}
        {step === 'REVIEW_INSTRUCTIONS' && (
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-lg space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Before You Begin
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Read these guidelines carefully before starting your session.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
                {[
                  {
                    icon: <Lock className="w-4 h-4" />,
                    title: 'Single Attempt Only',
                    body: 'Once the session starts, refreshing or navigating away will end your attempt.',
                  },
                  {
                    icon: <UserCheck className="w-4 h-4" />,
                    title: 'Stay in Frame',
                    body: 'Keep your face centred in the camera at all times. Look-aways are logged automatically.',
                  },
                  {
                    icon: <VolumeX className="w-4 h-4" />,
                    title: 'Speak Clearly',
                    body: 'Respond in a quiet room. Background noise and music can affect transcription accuracy.',
                  },
                  {
                    icon: <Zap className="w-4 h-4" />,
                    title: 'Instant AI Evaluation',
                    body: 'Your answers are evaluated in real time. Results will be available immediately after submission.',
                  },
                ].map(({ icon, title, body }) => (
                  <div key={title} className="flex items-start gap-4 px-5 py-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                      {icon}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 flex items-center justify-between">

        {/* Left */}
        {step === 'DEVICE_CHECK' ? (
          <button
            onClick={() => { cleanup(); onCancel(); }}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel Setup
          </button>
        ) : (
          <button
            onClick={() => setStep('DEVICE_CHECK')}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ← Back
          </button>
        )}

        {/* Right */}
        <button
          onClick={handleNext}
          disabled={step === 'DEVICE_CHECK' && !allChecksPass}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[12px] font-black text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          {step === 'DEVICE_CHECK' ? 'Next Step' : 'Start Practice'}
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

export default DeviceCheckWizard;
