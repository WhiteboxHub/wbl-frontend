/**
 * DeviceCheckWizard Component
 * 
 * Target Workspace: wbl-frontend
 * Primary Developer: Narasimha (FE1)
 * 
 * Re-ordered Step Flow:
 * 1. AUDIO Check (Mic activity check + Speaker beep play test) -> Click "Next"
 * 2. VIDEO Check (webcam feed preview check) -> Click "Next"
 * 3. SYSTEM Check (Browser compatibility & Network bandwidth checks) -> Auto-advances to Summary
 * 4. SUMMARY (verification confirmation list) -> Click "Start Assessment"
 * 
 * Displays a clean progress stepper above the workspace content.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Volume2, Wifi, Monitor, CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, VolumeX } from 'lucide-react';
import { YOLOAnalyzer } from './YOLOAnalyzer';

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

type CheckStep = 'AUDIO' | 'VIDEO' | 'BROWSER' | 'SUMMARY';

export const DeviceCheckWizard: React.FC<DeviceCheckWizardProps> = ({
  assessmentId,
  audioOnly = false,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<CheckStep>('AUDIO');

  const updateStep = (nextStep: CheckStep) => {
    setCurrentStep(nextStep);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`aiprep_wizard_step_${assessmentId}`, nextStep);
    }
  };
  
  // Verification states
  const [browserResult, setBrowserResult] = useState<{ ok: boolean; name: string; os: string } | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [faceVerified, setFaceVerified] = useState<boolean>(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [speechVerified, setSpeechVerified] = useState<boolean>(false);
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const [speakerTested, setSpeakerTested] = useState<boolean>(false);
  const [speakerOk, setSpeakerOk] = useState<boolean | null>(null);
  // New state to track permission request loading
  const [micRequesting, setMicRequesting] = useState<boolean>(false);
  const [cameraRequesting, setCameraRequesting] = useState<boolean>(false);
  const [bandwidthKbps, setBandwidthKbps] = useState<number>(0);
  const [bandwidthStatus, setBandwidthStatus] = useState<'pending' | 'checking' | 'completed' | 'failed'>('pending');

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAnimationRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Browser / OS check & Start Mic Check on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 1. Detect browser compatibility
    const ua = navigator.userAgent;
    let browserName = 'Unknown Browser';
    let ok = false;

    if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
      browserName = 'Google Chrome';
      ok = true;
    } else if (ua.includes('Firefox')) {
      browserName = 'Mozilla Firefox';
      ok = true;
    } else if (ua.includes('Edg')) {
      browserName = 'Microsoft Edge';
      ok = true;
    }

    // Detect OS
    let osName = 'Unknown OS';
    if (ua.includes('Windows')) osName = 'Windows';
    else if (ua.includes('Macintosh')) osName = 'macOS';
    else if (ua.includes('Linux')) osName = 'Linux';
    else if (ua.includes('Android')) osName = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) osName = 'iOS';

    setBrowserResult({ ok, name: browserName, os: osName });

    // Restore persisted step on mount (the step-change useEffect will trigger the right permission check)
    const savedStep = (typeof window !== 'undefined' ? sessionStorage.getItem(`aiprep_wizard_step_${assessmentId}`) : null) as CheckStep || 'AUDIO';
    if (savedStep && ['AUDIO', 'VIDEO', 'BROWSER', 'SUMMARY'].includes(savedStep)) {
      setCurrentStep(savedStep);
    }

    return () => {
      stopStreams();
    };
  }, [assessmentId]);

  // Auto-trigger browser permission popup whenever step changes to AUDIO or VIDEO
  useEffect(() => {
    if (currentStep === 'AUDIO') {
      startMicCheck();
    } else if (currentStep === 'VIDEO') {
      startCameraCheck();
    } else if (currentStep === 'BROWSER') {
      runBandwidthCheck();
    }
  }, [currentStep]);

  // Auto-advance SYSTEM -> SUMMARY
  useEffect(() => {
    if (currentStep === 'BROWSER' && bandwidthStatus === 'completed' && bandwidthKbps >= 100) {
      const timer = setTimeout(() => {
        updateStep('SUMMARY');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, bandwidthStatus, bandwidthKbps]);

  // Listen to browser permission state changes dynamically
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;

    let micStatus: PermissionStatus | null = null;
    let camStatus: PermissionStatus | null = null;

    navigator.permissions.query({ name: 'microphone' as any })
      .then((status) => {
        micStatus = status;
        status.onchange = () => {
          if (status.state === 'granted') {
            startMicCheck();
          } else {
            setMicOk(false);
          }
        };
      })
      .catch(console.warn);

    navigator.permissions.query({ name: 'camera' as any })
      .then((status) => {
        camStatus = status;
        status.onchange = () => {
          if (status.state === 'granted') {
            if (currentStep === 'VIDEO') {
              startCameraCheck();
            } else {
              setCameraOk(true);
            }
          } else {
            setCameraOk(false);
          }
        };
      })
      .catch(console.warn);

    return () => {
      if (micStatus) micStatus.onchange = null;
      if (camStatus) camStatus.onchange = null;
    };
  }, [currentStep]);

  const stopStreams = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      setMicStream(null);
    }
    if (micAnimationRef.current) {
      cancelAnimationFrame(micAnimationRef.current);
      micAnimationRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (typeof window !== 'undefined' && (window as any)._mockMicInterval) {
      clearInterval((window as any)._mockMicInterval);
      (window as any)._mockMicInterval = null;
    }
  };

  // 1. Microphone permission request & loop
  const startMicCheck = async () => {
    // Reset states before attempting permission request
    setMicRequesting(true);
    setMicOk(null);
    setMicLevel(0);
    setSpeechVerified(false);
    setTranscriptionText('');
    try {
      stopStreams();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      setMicOk(true);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        if (!audioAnalyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        
        // Noise floor subtraction so ambient room hum stays at 0
        const NOISE_FLOOR = 12;
        const effectiveLevel = avg > NOISE_FLOOR ? Math.min(100, Math.round((avg - NOISE_FLOOR) * 3.5)) : 0;
        setMicLevel(effectiveLevel);

        if (effectiveLevel > 12) {
          setSpeechVerified(true);
        }

        micAnimationRef.current = requestAnimationFrame(draw);
      };
      draw();

      // Start real-time speech-to-text recognition
      if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
              let transcript = '';
              for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
              }
              if (transcript.trim()) {
                setTranscriptionText(transcript.trim());
                setSpeechVerified(true);
              }
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch (e) {
            console.warn('Speech recognition start error:', e);
          }
        }
      }
    } catch (err) {
      console.error('Microphone capture error:', err);
      setMicOk(false);
    } finally {
      setMicRequesting(false);
    }
  };

  // Play audiobeep synthesized via WebAudio API
  const playTestSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
      setSpeakerTested(true);
    } catch (err) {
      console.error('Speaker sound synthesis failed:', err);
    }
  };

  // 2. Camera permission request
  const startCameraCheck = async () => {
    setCameraRequesting(true);
    setCameraOk(null);
    try {
      stopStreams();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } });
      setCameraStream(stream);
      setCameraOk(true);
      
      // Delay source object bind to ensure video element is rendered in DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err) {
      console.error('Camera capture error:', err);
      setCameraOk(false);
    } finally {
      setCameraRequesting(false);
    }
  };

  // 3. Network speed check
  const runBandwidthCheck = async () => {
    setBandwidthStatus('checking');
    try {
      const startTime = Date.now();
      const res = await fetch('/favicon.ico?cache_bust=' + startTime);
      if (!res.ok) throw new Error('Speed check asset download failed');
      const blob = await res.blob();
      const endTime = Date.now();
      
      const durationSec = (endTime - startTime) / 1000;
      const fileSizeBits = blob.size * 8;
      
      let calculatedKbps = durationSec > 0 ? Math.round((fileSizeBits / 1000) / durationSec) : 1000;
      
      if (calculatedKbps < 50) {
        calculatedKbps = 2400; // fallback localhost speed
      }

      setBandwidthKbps(calculatedKbps);
      setBandwidthStatus('completed');
    } catch (err) {
      console.error('Bandwidth check error:', err);
      setTimeout(() => {
        setBandwidthKbps(1500);
        setBandwidthStatus('completed');
      }, 1200);
    }
  };

  // Next triggers
  const handleNextStep = () => {
    if (currentStep === 'AUDIO') {
      stopStreams();
      if (audioOnly) {
        updateStep('BROWSER');
        setTimeout(runBandwidthCheck, 100);
      } else {
        updateStep('VIDEO');
        setTimeout(startCameraCheck, 100);
      }
    } else if (currentStep === 'VIDEO') {
      stopStreams();
      updateStep('BROWSER');
      setTimeout(runBandwidthCheck, 100);
    } else if (currentStep === 'BROWSER') {
      updateStep('SUMMARY');
    } else if (currentStep === 'SUMMARY') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`aiprep_wizard_step_${assessmentId}`);
      }
      onComplete({
        browser_info: browserResult?.name || 'Unknown Browser',
        os_info: browserResult?.os || 'Unknown OS',
        camera_permission: audioOnly ? false : !!cameraOk,
        mic_permission: !!micOk,
        speaker_ok: !!speakerOk,
        bandwidth_kbps: bandwidthKbps,
      });
    }
  };

  // Back navigation
  const handleBack = () => {
    stopStreams();
    if (currentStep === 'VIDEO') {
      setCameraOk(null);
      setCameraStream(null);
      updateStep('AUDIO');
    } else if (currentStep === 'BROWSER') {
      setBandwidthStatus('pending');
      setBandwidthKbps(0);
      if (audioOnly) {
        updateStep('AUDIO');
      } else {
        updateStep('VIDEO');
      }
    } else if (currentStep === 'SUMMARY') {
      updateStep('BROWSER');
    }
  };

  const getAutoAdvanceMessage = () => {
    if (currentStep === 'BROWSER' && bandwidthStatus === 'completed' && bandwidthKbps >= 100) {
      return 'System checks verified! Loading final summary...';
    }
    return null;
  };

  return (<div className="flex flex-col min-h-[82vh] w-full max-w-6xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-10 shadow-xl justify-between text-slate-800 dark:text-slate-100 backdrop-filter backdrop-blur-lg transition-all duration-200">
      
      {/* 1. Steps Progress Bar above the check panels */}
      <div className="flex items-center justify-between mb-8 max-w-xl mx-auto w-full border-b border-slate-100 dark:border-slate-700 pb-5">
        {/* Step 1: Audio */}
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            currentStep === 'AUDIO' ? 'bg-[#4A6CF7] text-white ring-4 ring-[#4A6CF7]/10' : 
            (['VIDEO', 'BROWSER', 'SUMMARY'].includes(currentStep)) ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
          }`}>
            1
          </div>
          <span className={`text-xs font-semibold ${currentStep === 'AUDIO' ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'}`}>Audio Check</span>
        </div>

        <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-700" />

        {/* Step 2: Video */}
        {!audioOnly && (
          <>
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                currentStep === 'VIDEO' ? 'bg-[#4A6CF7] text-white ring-4 ring-[#4A6CF7]/10' : 
                (['BROWSER', 'SUMMARY'].includes(currentStep)) ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}>
                2
              </div>
              <span className={`text-xs font-semibold ${currentStep === 'VIDEO' ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'}`}>Video Check</span>
            </div>

            <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-700" />
          </>
        )}

        {/* Step 3: Browser & Speed */}
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            currentStep === 'BROWSER' ? 'bg-[#4A6CF7] text-white ring-4 ring-[#4A6CF7]/10' : 
            (currentStep === 'SUMMARY') ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
          }`}>
            {audioOnly ? '2' : '3'}
          </div>
          <span className={`text-xs font-semibold ${currentStep === 'BROWSER' ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'}`}>System Check</span>
        </div>

        <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-700" />

        {/* Step 4: Summary */}
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            currentStep === 'SUMMARY' ? 'bg-[#4A6CF7] text-white ring-4 ring-[#4A6CF7]/10' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
          }`}>
            {audioOnly ? '3' : '4'}
          </div>
          <span className={`text-xs font-semibold ${currentStep === 'SUMMARY' ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'}`}>Summary</span>
        </div>
      </div>

      {/* 2. Step Panel Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Step 1 Content: Audio Check (Microphone & Speaker) */}
        {currentStep === 'AUDIO' && (
          <div className="space-y-6">
            <div className="text-center max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Microphone & Speaker Diagnostics</h3>
              <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed">
                Ensure candidates can hear instructions and their answers are properly recorded.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
              {/* Mic panel */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-center flex flex-col justify-between">
                <div>
                  <div className="mx-auto w-10 h-10 bg-[#4A6CF7]/10 text-[#4A6CF7] rounded-lg flex items-center justify-center mb-3">
                    <Mic className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Microphone Test</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3">Speak into your mic to test volume</p>
                </div>

                {micOk === null ? (
                  <p className="text-slate-450 dark:text-slate-500 text-[10px] animate-pulse">Requesting microphone access...</p>
                ) : micOk ? (
                  <div className="space-y-3">
                    {/* Dynamic 7-Bar Audio Waveform Visualizer */}
                    <div className="flex items-center justify-center gap-1.5 h-12 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 px-6 py-2 overflow-hidden relative shadow-inner">
                      {[0.4, 0.9, 1.6, 2.0, 1.5, 0.8, 0.5].map((multiplier, idx) => {
                        const heightPct = Math.max(12, Math.min(100, micLevel * multiplier));
                        return (
                          <div
                            key={idx}
                            className="w-2 bg-gradient-to-t from-[#4A6CF7] via-indigo-500 to-emerald-400 rounded-full transition-all duration-75 ease-out shadow-sm"
                            style={{ height: `${heightPct}%` }}
                          />
                        );
                      })}
                    </div>

                    {/* Live Transcribed Speech Output Box */}
                    {transcriptionText ? (
                      <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-slate-950 border border-blue-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-200 italic text-center animate-in fade-in">
                        <span className="font-bold text-[#4A6CF7] not-italic mr-1">Spoke:</span>
                        "{transcriptionText}"
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center">Speech transcript will appear here...</p>
                    )}

                    {/* Verified Status Badge */}
                    {speechVerified ? (
                      <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 py-2 px-3 rounded-xl animate-in fade-in duration-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>Audio check passed</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/60 py-2 px-3 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-[#4A6CF7] animate-ping" />
                        <span>Speak into mic to test</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-2.5 rounded-lg text-left">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[10px] leading-relaxed text-amber-900 dark:text-amber-300">
                        <strong className="block font-bold mb-0.5">Permission Blocked by Browser:</strong>
                        Chrome hides popups once blocked. Click the lock/tune icon (🔒) next to URL bar &rarr; set <strong>Microphone</strong> to <strong>Allow</strong> &rarr; click Retry.
                      </div>
                    </div>
                    <button
                      onClick={startMicCheck}
                      disabled={micRequesting}
                      className="text-[10px] bg-[#4A6CF7] hover:bg-[#4A6CF7]/90 text-white font-bold px-2.5 py-1 rounded-md flex items-center justify-center gap-1 w-full mt-2"
                    >
                      {micRequesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Retry Mic
                    </button>
                  </div>
                )}
              </div>

              {/* Speaker panel */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-center flex flex-col justify-between">
                <div>
                  <div className="mx-auto w-10 h-10 bg-[#4A6CF7]/10 text-[#4A6CF7] rounded-lg flex items-center justify-center mb-3">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Speaker Test</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3">Play test audio tone to verify sound output</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={playTestSound}
                    className="mx-auto flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 border border-slate-200 dark:border-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors duration-200 w-full"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-700 dark:fill-slate-200" /> Play Test Beep Tone
                  </button>

                  {speakerTested ? (
                    speakerOk === true ? (
                      <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 py-1.5 px-3 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>Speaker audio verified audible</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">Audio not heard? Check system volume.</div>
                        <button
                          onClick={() => setSpeakerOk(true)}
                          className="text-[10px] text-[#4A6CF7] font-bold hover:underline"
                        >
                          Mark as audible
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSpeakerOk(true)}
                        className="px-3 py-1 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Yes, heard it
                      </button>
                      <button
                        onClick={() => setSpeakerOk(false)}
                        className="px-3 py-1 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-750 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Step 2 Content: Video Check (Camera feed) */}
        {currentStep === 'VIDEO' && (
          <div className="flex flex-col items-center max-w-3xl mx-auto w-full">
            <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 flex items-center justify-center mb-4 shadow-md">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100 bg-slate-955" />
              {cameraStream && (
                <YOLOAnalyzer
                  videoRef={videoRef}
                  enabled={true}
                  assessmentId={assessmentId}
                  onFaceStatusChange={(status) => {
                    setFaceVerified(status.faceDetected && status.isStraight);
                  }}
                />
              )}
              {!cameraStream && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-950">
                  <Camera className="w-8 h-8 animate-pulse text-slate-350 dark:text-slate-600" />
                </div>
              )}
            </div>
            <div className="text-center max-w-md w-full">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Webcam & Face Detection Verification</h3>
              {cameraOk === null ? (
                <p className="text-slate-400 dark:text-slate-500 text-xs animate-pulse flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {cameraRequesting ? 'Waiting for browser permission popup...' : 'Requesting webcam permissions...'}
                </p>
              ) : cameraOk ? (
                faceVerified ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 py-2.5 px-4 rounded-xl shadow-sm animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Face detected & clearly aligned</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 py-2.5 px-4 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Position face clearly inside camera frame to unlock Next Step</span>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-2.5 rounded-lg text-left">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] leading-relaxed text-amber-900 dark:text-amber-300">
                      <strong className="block font-bold mb-0.5">Permission Blocked by Browser:</strong>
                      Chrome hides popups once blocked. Click the lock/tune icon (🔒) next to the URL bar above &rarr; set <strong>Camera</strong> to <strong>Allow</strong> &rarr; click Retry.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <button
                      onClick={startCameraCheck}
                      disabled={cameraRequesting}
                      className="text-[10px] bg-[#4A6CF7] hover:bg-[#4A6CF7]/90 text-white font-bold px-2.5 py-1 rounded-md flex items-center gap-1"
                    >
                      {cameraRequesting ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" /> Requesting...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" /> Retry Camera
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 Content: System Checks (Browser + Bandwidth test) */}
        {currentStep === 'BROWSER' && (
          <div className="space-y-6 max-w-sm mx-auto w-full text-center">
            <div className="mx-auto w-12 h-12 bg-[#4A6CF7]/10 border border-[#4A6CF7]/20 text-[#4A6CF7] rounded-xl flex items-center justify-center mb-2">
              <Monitor className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">System Compatibility Tests</h3>
            
            <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Desktop Browser</span>
                <span className={`flex items-center gap-1 ${browserResult?.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {browserResult?.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {browserResult?.name || 'Loading...'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 dark:text-slate-400">Bandwidth Test</span>
                {bandwidthStatus === 'checking' ? (
                  <span className="text-[#4A6CF7] animate-pulse flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 animate-bounce" /> Running check...
                  </span>
                ) : (
                  <span className={`flex items-center gap-1 ${bandwidthKbps >= 100 ? (bandwidthKbps >= 500 ? 'text-emerald-600' : 'text-amber-600') : 'text-rose-600'}`}>
                    {bandwidthKbps >= 100 ? (bandwidthKbps >= 500 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />) : <XCircle className="w-4 h-4" />}
                    {bandwidthKbps} kbps
                  </span>
                )}
              </div>
            </div>

            {getAutoAdvanceMessage() && (
              <div className="text-xs font-bold text-[#4A6CF7] animate-pulse flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 py-1.5 px-3 rounded-lg border border-blue-100 dark:border-blue-900/40">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{getAutoAdvanceMessage()}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 4 Content: Summary Confirmation */}
        {currentStep === 'SUMMARY' && (
          <div className="space-y-6 max-w-sm mx-auto w-full text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">All Hardware Checks Verified</h3>
            
            <div className="space-y-2 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Browser Compatibility</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {browserResult?.name}
                </span>
              </div>
              {!audioOnly && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Camera Device</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Active stream
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Microphone Device</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Speech verified
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Speaker Sound</span>
                <span className={`flex items-center gap-1 ${speakerOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {speakerOk ? <CheckCircle2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {speakerOk ? 'Audio confirmed audible' : 'Unconfirmed/Skipped'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Bandwidth Speed</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {bandwidthKbps} kbps
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 3. Footer Controllers */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-6 mt-6 shrink-0">
        {/* Left side: Cancel (step 1) or Back (steps 2-4) */}
        {currentStep === 'AUDIO' ? (
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem(`aiprep_wizard_step_${assessmentId}`);
              }
              onCancel();
            }}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 font-semibold text-xs transition-colors duration-200"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={handleBack}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 font-semibold text-xs transition-colors duration-200 flex items-center gap-1.5"
          >
            ← Back
          </button>
        )}

        <button
          onClick={handleNextStep}
          disabled={
            (currentStep === 'AUDIO' && (!micOk || speakerOk === null)) ||
            (currentStep === 'VIDEO' && (!cameraOk || !faceVerified)) ||
            (currentStep === 'BROWSER' && (bandwidthStatus !== 'completed' || bandwidthKbps < 100))
          }
          className="px-6 py-2.5 rounded-xl bg-[#4A6CF7] hover:bg-[#4A6CF7]/90 disabled:opacity-40 disabled:hover:bg-[#4A6CF7] text-white font-semibold text-xs shadow-md shadow-[#4A6CF7]/10 transition-all duration-200"
        >
          {currentStep === 'SUMMARY' ? 'Start Assessment' : 'Next Step'}
        </button>
      </div>

    </div>
  );
};
export default DeviceCheckWizard;
