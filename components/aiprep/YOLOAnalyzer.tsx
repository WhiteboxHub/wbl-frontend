/**
 * YOLOAnalyzer — Client-side AI Proctoring (MediaPipe FaceLandmarker + YOLOv8n-pose fallback)
 * Tracks face visibility, gaze direction, and sitting posture in real-time.
 */
'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { aiprepApi } from '@/lib/aiprep-api';
import { IconEye, IconEyeOff, IconUserCheck, IconAlertTriangle } from '@tabler/icons-react';

// ── URLs ──────────────────────────────────────────────────────────────────────
const MEDIAPIPE_ESM_URL  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm';
const MEDIAPIPE_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
const FACE_MODEL_URL     = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';
const YOLO_POSE_MODEL_URL = '/models/yolov8n-pose.onnx';

// ── Configurable Types ────────────────────────────────────────────────────────
export interface YOLOThresholds {
  slouch: number;    
  leanLeft: number;  
  leanRight: number;  
  tooClose: number;  
  tooFar: number;    
  yawMin: number;    
  yawMax: number;    
  pitchUp: number;    
  pitchDown: number;  
  nodDelta: number;  
}

export interface YOLOBoundingBoxPad {
  padX: number;       // horizontal padding (fraction of face width)   default 0.42
  padYTop: number;    // top padding (fraction of face height)          default 0.35
  /** Bottom padding — KEEP ≤ 0.35. Old value 1.65 extended to chest (NOT acceptable). */
  padYBottom: number; // bottom padding (fraction of face height)       default 0.30
}

const DEFAULT_THRESHOLDS: YOLOThresholds = {
  slouch: 0.65, leanLeft: 0.20, leanRight: 0.80,
  tooClose: 0.32, tooFar: 0.035,
  yawMin: 0.45, yawMax: 2.2,
  pitchUp: 0.38, pitchDown: 1.45,
  nodDelta: 0.015,
};

const DEFAULT_BBOX_PAD: YOLOBoundingBoxPad = { padX: 0.42, padYTop: 0.35, padYBottom: 0.30 };

// ── Props ─────────────────────────────────────────────────────────────────────
export interface YOLOAnalyzerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled: boolean;
  assessmentId: number;
  thresholds?: Partial<YOLOThresholds>;
  bboxPad?: Partial<YOLOBoundingBoxPad>;
  onMetricsUpdate?: (m: {
    face_visible_pct: number;
    head_nods_count: number;
    frame_stability_score: number;
    sitting_position?: string;
    gaze_direction?: string;
  }) => void;
  onFaceStatusChange?: (s: { faceDetected: boolean; isStraight: boolean; message: string }) => void;
}

export type MediaPipeFaceAnalyzerProps = YOLOAnalyzerProps;
export type YOLOv8ProctorAnalyzerProps = YOLOAnalyzerProps;

// ── Posture decision table ────────────────────────────────────────────────────
type PostureEntry = {
  check: (ctx: {
    hasMultiple: boolean; centerX: number; centerY: number;
    isTooClose: boolean; isTooFar: boolean;
    isLookingUp: boolean; isLookingDown: boolean; isLookingAway: boolean;
    T: YOLOThresholds;
  }) => boolean;
  position: string;
  stability: number;
  message: string;
  label: string;
};

const POSTURE_RULES: PostureEntry[] = [
  { check: ({ hasMultiple }) => hasMultiple,
    position: 'MULTIPLE_PERSONS_DETECTED', stability: 0,  label: 'MULTIPLE_FACES',
    message: ' MULTIPLE PERSONS DETECTED! Only candidate allowed in frame.' },
  { check: ({ centerY, T }) => centerY > T.slouch,
    position: 'SLOUCHING',               stability: 50, label: 'SLOUCHING',
    message: ' Slouching - Please sit up straight' },
  { check: ({ centerX, T }) => centerX < T.leanLeft,
    position: 'LEANING_LEFT',            stability: 60, label: 'LEANING_LEFT',
    message: ' Leaning left - Move body slightly right' },
  { check: ({ centerX, T }) => centerX > T.leanRight,
    position: 'LEANING_RIGHT',           stability: 60, label: 'LEANING_RIGHT',
    message: ' Leaning right - Move body slightly left' },
  { check: ({ isTooClose }) => isTooClose,
    position: 'TOO_CLOSE',               stability: 60, label: 'TOO_CLOSE',
    message: ' Too close to camera - Move back slightly' },
  { check: ({ isTooFar }) => isTooFar,
    position: 'TOO_FAR',                 stability: 60, label: 'TOO_FAR',
    message: ' Too far - Move closer to camera' },
  { check: ({ isLookingUp }) => isLookingUp,
    position: 'LOOKING_UP',              stability: 70, label: 'UPRIGHT',
    message: ' Looking up - Please look straight' },
  { check: ({ isLookingDown }) => isLookingDown,
    position: 'PHONE_OR_DOWNWARD_GAZE',  stability: 40, label: 'UPRIGHT',
    message: ' Phone / Downward Gaze Detected! Look straight at screen' },
  { check: ({ isLookingAway }) => isLookingAway,
    position: 'LOOKING_AWAY_OR_DEVICE',  stability: 45, label: 'UPRIGHT',
    message: ' Side Gaze Detected! Please focus on screen' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const YOLOAnalyzer: React.FC<YOLOAnalyzerProps> = memo(({
  videoRef, enabled, assessmentId,
  thresholds: thresholdOverrides, bboxPad: bboxPadOverrides,
  onMetricsUpdate, onFaceStatusChange,
}) => {
  const T: YOLOThresholds    = { ...DEFAULT_THRESHOLDS, ...thresholdOverrides };
  const P: YOLOBoundingBoxPad = { ...DEFAULT_BBOX_PAD, ...bboxPadOverrides };

  const [modelLoaded,          setModelLoaded]          = useState(false);
  const [loadError,            setLoadError]            = useState<string | null>(null);
  const [faceVisible,          setFaceVisible]          = useState(false);
  const [bbox,                 setBbox]                 = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [coachingMsg,          setCoachingMsg]          = useState('Aligning face...');
  const [gazeDir,              setGazeDir]              = useState('CENTER');
  const [postureLabel,         setPostureLabel]         = useState('UPRIGHT');
  const [multipleFacesDetected, setMultipleFacesDetected] = useState(false);

  // Telemetry accumulators
  const faceVisibleFrames = useRef(0);
  const totalFrames       = useRef(0);
  const headNods          = useRef(0);
  const stabilityScore    = useRef(100);
  const lastCenterY       = useRef<number | null>(null);
  const lastSittingPos    = useRef('CENTERED');
  const lastDetectionTime = useRef(0);
  const lookDirection     = useRef<'straight' | 'up' | 'down' | 'away'>('straight');

  const landmarkerRef    = useRef<any>(null);
  const yoloSessionRef   = useRef<any>(null);
  const animFrameId      = useRef<number | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const stopLoop = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
  };

  const submitTelemetry = async () => {
    if (!assessmentId || totalFrames.current === 0) return;
    try {
      await aiprepApi.saveVisionTelemetry({
        assessment_id: assessmentId,
        face_visible_pct: Math.round((faceVisibleFrames.current / totalFrames.current) * 100),
        head_nods_count: headNods.current,
        frame_stability_score: stabilityScore.current,
        sitting_position: lastSittingPos.current,
      });
    } catch (err) { console.error('Vision telemetry submit failed:', err); }
  };

  // ── Tracking loop ─────────────────────────────────────────────────────────
  const startLoop = () => {
    const track = (now: number) => {
      const video    = videoRef.current;
      const detector = landmarkerRef.current;

      if (!video || !detector || video.paused || video.ended) {
        animFrameId.current = requestAnimationFrame(track);
        return;
      }

      // ~8 FPS throttle
      if (now - lastDetectionTime.current >= 120 && video.videoWidth > 0 && video.readyState >= 2) {
        lastDetectionTime.current = now;
        try {
          const result = detector.detectForVideo(video, performance.now());
          totalFrames.current++;

          if (result?.faceLandmarks?.length > 0) {
            faceVisibleFrames.current++;
            setFaceVisible(true);

            const hasMultiple = result.faceLandmarks.length > 1;
            setMultipleFacesDetected(hasMultiple);

            const lm   = result.faceLandmarks[0];
            const xs   = lm.map((p: any) => p.x);
            const ys   = lm.map((p: any) => p.y);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            const w    = maxX - minX, h = maxY - minY;
            const centerX = minX + w / 2, centerY = minY + h / 2;
            const faceArea = w * h;

            // Gaze: yaw
            const pNose = lm[4], pLeft = lm[234], pRight = lm[454];
            let isLookingAway = false, isLookingUp = false, isLookingDown = false;
            if (pNose && pLeft && pRight) {
              const yaw = Math.abs(pNose.x - pLeft.x) / (Math.abs(pRight.x - pNose.x) || 0.0001);
              if (yaw < T.yawMin)      { isLookingAway = true; setGazeDir('RIGHT'); }
              else if (yaw > T.yawMax) { isLookingAway = true; setGazeDir('LEFT');  }
              else                     { setGazeDir('CENTER'); }
            }

            // Gaze: pitch
            const pForehead = lm[10], pChin = lm[152];
            if (pNose && pForehead && pChin) {
              const pitch = Math.abs(pNose.y - pForehead.y) / (Math.abs(pChin.y - pNose.y) || 0.0001);
              if (pitch < T.pitchUp)      { isLookingUp   = isLookingAway = true; setGazeDir('UP');   }
              else if (pitch > T.pitchDown) { isLookingDown = isLookingAway = true; setGazeDir('DOWN'); }
            }

            lookDirection.current = isLookingUp ? 'up' : isLookingDown ? 'down' : isLookingAway ? 'away' : 'straight';

            // Posture decision via lookup table
            const ctx = { hasMultiple, centerX, centerY, isTooClose: faceArea > T.tooClose,
              isTooFar: faceArea < T.tooFar, isLookingUp, isLookingDown, isLookingAway, T };

            const matched = POSTURE_RULES.find(r => r.check(ctx));
            const position   = matched?.position  ?? 'UPRIGHT';
            const stability  = matched?.stability  ?? 100;
            const message    = matched?.message    ?? 'Sitting Posture: Upright & Centered';
            const label      = matched?.label      ?? 'UPRIGHT';

            setPostureLabel(label);
            setCoachingMsg(message);
            lastSittingPos.current = position;

            // Nod count
            if (lastCenterY.current !== null && Math.abs(centerY - lastCenterY.current) > T.nodDelta)
              headNods.current++;
            lastCenterY.current = centerY;

            // Exponential moving average for stability
            stabilityScore.current = Math.round(stabilityScore.current * 0.9 + stability * 0.1);

            // Bounding box — face + neck only (padYBottom ≤ 0.35 intentional)
            const fullMinX = Math.max(0, minX - w * P.padX);
            const fullMaxX = Math.min(1, maxX + w * P.padX);
            const fullMinY = Math.max(0, minY - h * P.padYTop);
            const fullMaxY = Math.min(1, maxY + h * P.padYBottom);
            setBbox({
              left:   (1 - fullMaxX) * 100,   // mirrored for CSS -scale-x-100
              top:    fullMinY * 100,
              width:  (fullMaxX - fullMinX) * 100,
              height: (fullMaxY - fullMinY) * 100,
            });

            onFaceStatusChange?.({ faceDetected: true, isStraight: !hasMultiple && position === 'UPRIGHT', message });
            onMetricsUpdate?.({
              face_visible_pct:    Math.round((faceVisibleFrames.current / totalFrames.current) * 100),
              head_nods_count:     headNods.current,
              frame_stability_score: stabilityScore.current,
              sitting_position:    lastSittingPos.current,
              gaze_direction:      gazeDir,
            });

          } else {
            setFaceVisible(false);
            setMultipleFacesDetected(false);
            setBbox(null);
            setCoachingMsg('Candidate not detected in frame');
            setGazeDir('AWAY');
            setPostureLabel('NOT_DETECTED');
            stabilityScore.current = Math.max(0, stabilityScore.current - 12);
            onFaceStatusChange?.({ faceDetected: false, isStraight: false, message: 'No candidate detected in camera frame' });
          }
        } catch (err) { console.error('Face detection error:', err); }
      }

      animFrameId.current = requestAnimationFrame(track);
    };
    animFrameId.current = requestAnimationFrame(track);
  };

  // ── Load MediaPipe ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      if (totalFrames.current > 0) submitTelemetry();
      stopLoop();
      return;
    }

    let active = true;

    (async () => {
      try {
        setLoadError(null);
        const { FaceLandmarker, FilesetResolver } = await import(/* webpackIgnore: true */ MEDIAPIPE_ESM_URL as any);
        const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        if (!active) return;

        let lm;
        const opts = (delegate: 'GPU' | 'CPU') => ({
          baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate },
          runningMode: 'VIDEO' as const,
          numFaces: 2,
        });
        try      { lm = await FaceLandmarker.createFromOptions(fileset, opts('GPU')); }
        catch    { lm = await FaceLandmarker.createFromOptions(fileset, opts('CPU')); }

        if (!active) { lm.close(); return; }
        landmarkerRef.current = lm;
        setModelLoaded(true);
        startLoop();
      } catch (err) {
        console.error('MediaPipe load failed:', err);
        setLoadError('AI Face/Eye model failed to initialize.');
      }
    })();

    return () => {
      active = false;
      stopLoop();
      try { landmarkerRef.current?.close(); } catch (_) {}
      landmarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── Load YOLOv8 (optional enhancement) ───────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    let active = true;

    (async () => {
      try {
        if (typeof window === 'undefined') return;
        const head = await fetch(YOLO_POSE_MODEL_URL, { method: 'HEAD' }).catch(() => null);
        if (!head?.ok || head.headers.get('content-type')?.includes('text/html')) return;

        if (!(window as any).ort) {
          const s = Object.assign(document.createElement('script'), {
            src: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.min.js',
            async: true,
          });
          await new Promise((res, rej) => { s.onload = res; s.onerror = rej; document.head.appendChild(s); });
        }

        const ort = (window as any).ort;
        if (!ort) return;
        ort.env.wasm.simd = true;
        const session = await ort.InferenceSession.create(YOLO_POSE_MODEL_URL, { executionProviders: ['webgl', 'wasm'] });
        if (active) { yoloSessionRef.current = session; }
      } catch { /* YOLOv8 optional — MediaPipe covers posture */ }
    })();

    return () => { active = false; yoloSessionRef.current = null; };
  }, [enabled]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!enabled) return null;

  const isUpright = faceVisible && !multipleFacesDetected && postureLabel === 'UPRIGHT' && lookDirection.current === 'straight';
  const bboxColor = multipleFacesDetected ? 'rose' : isUpright ? 'emerald' : 'rose';

  const colorMap = bboxColor === 'emerald' ? {
    border: 'border-emerald-400/90',
    bg: 'bg-emerald-500/5',
    labelBg: 'bg-emerald-600/90',
    dividerBg: 'bg-emerald-400/70',
    shoulderBg: 'bg-emerald-950/80',
    shoulderText: 'text-emerald-300',
    shoulderBorder: 'border-emerald-500/40'
  } : {
    border: 'border-rose-400/90',
    bg: 'bg-rose-500/5',
    labelBg: 'bg-rose-600/90',
    dividerBg: 'bg-rose-400/70',
    shoulderBg: 'bg-rose-950/80',
    shoulderText: 'text-rose-300',
    shoulderBorder: 'border-rose-500/40'
  };

  return (
    <>
      {/* Status badge — top-right */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/60 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-200 backdrop-blur-md shadow-md">
        {loadError ? (
          <><IconAlertTriangle size={14} className="text-amber-400" /><span className="text-amber-300">{loadError}</span></>
        ) : modelLoaded ? (
          <><IconUserCheck size={14} className="text-emerald-400" /><span className="font-semibold">YOLO Pose &amp; Vision</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /></>
        ) : (
          <><div className="h-2 w-2 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" /><span className="text-indigo-300">Initializing AI...</span></>
        )}

        {modelLoaded && !loadError && (
          <span className={`border-l border-slate-700/60 pl-1.5 ml-0.5 font-medium flex items-center gap-1.5 ${
            multipleFacesDetected ? 'text-rose-400 font-bold animate-pulse' : faceVisible ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {multipleFacesDetected ? (
              <><IconAlertTriangle size={14} /><span>⚠️ MULTIPLE PERSONS DETECTED</span></>
            ) : faceVisible ? (
              <><IconEye size={14} /><span>Gaze: {gazeDir}</span><span className="text-slate-500">|</span>
                <span className={`font-bold ${postureLabel === 'UPRIGHT' ? 'text-emerald-400' : 'text-rose-400'}`}>Sitting: {postureLabel}</span></>
            ) : (
              <><IconEyeOff size={14} /> Candidate Lost</>
            )}
          </span>
        )}
      </div>

      {/* Face bounding box — face + neck only */}
      {modelLoaded && bbox && (
        <div
          className={`absolute z-10 border-2 rounded-2xl transition-all duration-75 flex flex-col items-center justify-between pointer-events-none
            ${colorMap.border} shadow-[0_0_20px_rgba(0,0,0,0.3)] ${colorMap.bg}`}
          style={{ left: `${bbox.left}%`, top: `${bbox.top}%`, width: `${bbox.width}%`, height: `${bbox.height}%` }}
        >
          <span className={`text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-b-lg text-white shadow-md flex items-center gap-1.5 ${colorMap.labelBg} ${multipleFacesDetected ? 'animate-pulse' : ''}`}>
            <span>🪑</span><span>{coachingMsg}</span>
          </span>
          <div className="w-full px-4 mb-3 flex items-center justify-between opacity-75">
            <div className={`h-0.5 flex-1 rounded-full ${colorMap.dividerBg}`} />
            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded mx-1 ${colorMap.shoulderBg} ${colorMap.shoulderText} ${colorMap.shoulderBorder}`}>
              Shoulder Level
            </span>
            <div className={`h-0.5 flex-1 rounded-full ${colorMap.dividerBg}`} />
          </div>
        </div>
      )}
    </>
  );
});

export const MediaPipeFaceAnalyzer  = YOLOAnalyzer;
export const YOLOv8ProctorAnalyzer  = YOLOAnalyzer;
export default YOLOAnalyzer;
