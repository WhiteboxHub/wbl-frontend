/**
 * YOLOAnalyzer Component
 * 
 * Target Workspace: wbl-frontend
 * Primary Developer: Fatima (ML1) / Karthik (FE2) / Narasimha (FE1)
 * 
 * High-Performance Client-Side Face Landmark Proctoring:
 * - Throttled detection loop (120ms cadence) prevents CPU/GPU frame drops
 * - Smooth 60fps video playback without UI lag
 * - Draws bounding box and posture coaching tips in real-time
 */
'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { aiprepApi } from '@/lib/aiprep-api';
import { IconEye, IconEyeOff, IconUserCheck, IconAlertTriangle } from '@tabler/icons-react';

interface YOLOAnalyzerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled: boolean;
  assessmentId: number;
  onMetricsUpdate?: (metrics: {
    face_visible_pct: number;
    head_nods_count: number;
    frame_stability_score: number;
    sitting_position?: string;
  }) => void;
  onFaceStatusChange?: (status: {
    faceDetected: boolean;
    isStraight: boolean;
    message: string;
  }) => void;
}

const MEDIAPIPE_ESM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm';
const MEDIAPIPE_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

export const YOLOAnalyzer: React.FC<YOLOAnalyzerProps> = memo(({
  videoRef,
  enabled,
  assessmentId,
  onMetricsUpdate,
  onFaceStatusChange,
}) => {
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [faceVisible, setFaceVisible] = useState<boolean>(false);
  const [bbox, setBbox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [coachingMsg, setCoachingMsg] = useState<string>('Aligning face...');

  // Running stats
  const faceVisibleFrames = useRef<number>(0);
  const totalFrames = useRef<number>(0);
  const headNods = useRef<number>(0);
  const stabilityScore = useRef<number>(100);
  const lastCenterY = useRef<number | null>(null);
  const lastSittingPosition = useRef<string>('CENTERED');
  const lastDetectionTime = useRef<number>(0);

  const landmarkerRef = useRef<any>(null);
  const animationFrameId = useRef<number | null>(null);
  const lookDirection = useRef<'straight' | 'up' | 'down' | 'away'>('straight');

  // Initialize and load MediaPipe Face Landmarker
  useEffect(() => {
    if (!enabled) {
      if (totalFrames.current > 0) {
        submitTelemetry();
      }
      stopTrackingLoop();
      return;
    }

    let active = true;

    async function loadModel() {
      try {
        setLoadError(null);
        const { FaceLandmarker, FilesetResolver } = await import(/* webpackIgnore: true */ MEDIAPIPE_ESM_URL as any);
        const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

        if (!active) return;

        let landmarker;
        try {
          landmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: FACE_MODEL_URL,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
          });
        } catch (gpuErr) {
          console.warn('YOLOAnalyzer: GPU delegate failed, falling back to CPU.', gpuErr);
          landmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: FACE_MODEL_URL,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
          });
        }

        if (!active) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setModelLoaded(true);
        startTrackingLoop();
      } catch (err: any) {
        console.error('Failed to load MediaPipe Face Landmarker:', err);
        setLoadError('AI Face model failed to initialize.');
      }
    }

    loadModel();

    return () => {
      active = false;
      stopTrackingLoop();
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) { }
        landmarkerRef.current = null;
      }
    };
  }, [enabled]);

  const startTrackingLoop = () => {
    const track = (currentTime: number) => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !landmarker || video.paused || video.ended) {
        animationFrameId.current = requestAnimationFrame(track);
        return;
      }

      // Throttle detection to ~8 FPS (120ms interval) to eliminate GPU/CPU lag completely
      if (currentTime - lastDetectionTime.current >= 120 && video.videoWidth > 0 && video.readyState >= 2) {
        lastDetectionTime.current = currentTime;

        try {
          const timestamp = performance.now();
          const result = landmarker.detectForVideo(video, timestamp);
          totalFrames.current++;

          if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            faceVisibleFrames.current++;
            setFaceVisible(true);

            const landmarks = result.faceLandmarks[0];

            const xs = landmarks.map((p: any) => p.x);
            const ys = landmarks.map((p: any) => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            const width = maxX - minX;
            const height = maxY - minY;
            const faceArea = width * height;
            const centerX = minX + width / 2;
            const centerY = minY + height / 2;

            const isCentered = centerX >= 0.35 && centerX <= 0.65;
            const isTooClose = faceArea > 0.32;
            const isTooFar = faceArea < 0.035;

            const pNose = landmarks[4];
            const pLeft = landmarks[234];
            const pRight = landmarks[454];
            const pForehead = landmarks[10];
            const pChin = landmarks[152];

            let isLookingAway = false;
            let isLookingUp = false;
            let isLookingDown = false;

            if (pNose && pLeft && pRight) {
              const dLeft = Math.abs(pNose.x - pLeft.x);
              const dRight = Math.abs(pRight.x - pNose.x);
              const yawRatio = dLeft / (dRight || 0.0001);
              if (yawRatio < 0.45 || yawRatio > 2.2) {
                isLookingAway = true;
              }
            }

            if (pNose && pForehead && pChin) {
              const dForeheadNose = Math.abs(pNose.y - pForehead.y);
              const dNoseChin = Math.abs(pChin.y - pNose.y);
              const pitchRatio = dForeheadNose / (dNoseChin || 0.0001);

              if (pitchRatio < 0.38) {
                isLookingUp = true;
                isLookingAway = true;
              } else if (pitchRatio > 1.45) {
                isLookingDown = true;
                isLookingAway = true;
              }
            }

            if (isLookingUp) {
              lookDirection.current = 'up';
            } else if (isLookingDown) {
              lookDirection.current = 'down';
            } else if (isLookingAway) {
              lookDirection.current = 'away';
            } else {
              lookDirection.current = 'straight';
            }

            let currentStability = 100;
            let currentMessage = 'Centered & Straight';
            let currentSittingPosition = 'CENTERED';

            if (centerY > 0.58) {
              currentSittingPosition = 'SLOUCHING';
              currentStability = 50;
              currentMessage = 'Slouching - Please sit up straight';
            } else if (centerX < 0.35) {
              currentSittingPosition = 'LEANING_LEFT';
              currentStability = 60;
              currentMessage = 'Leaning left - Move slightly right';
            } else if (centerX > 0.65) {
              currentSittingPosition = 'LEANING_RIGHT';
              currentStability = 60;
              currentMessage = 'Leaning right - Move slightly left';
            } else if (isTooClose) {
              currentSittingPosition = 'TOO_CLOSE';
              currentStability = 60;
              currentMessage = 'Move slightly away';
            } else if (isTooFar) {
              currentSittingPosition = 'TOO_FAR';
              currentStability = 60;
              currentMessage = 'Move closer to camera';
            } else if (isLookingUp) {
              currentSittingPosition = 'LOOKING_UP';
              currentStability = 40;
              currentMessage = 'Looking up - Please look straight';
            } else if (isLookingDown) {
              currentSittingPosition = 'LOOKING_DOWN';
              currentStability = 40;
              currentMessage = 'Looking down - Please look straight';
            } else if (isLookingAway) {
              currentSittingPosition = 'LOOKING_AWAY';
              currentStability = 45;
              currentMessage = 'Please look straight at screen';
            }

            lastSittingPosition.current = currentSittingPosition;

            if (lastCenterY.current !== null) {
              const dy = Math.abs(centerY - lastCenterY.current);
              if (dy > 0.015) {
                headNods.current += 1;
              }
            }
            lastCenterY.current = centerY;

            stabilityScore.current = Math.round((stabilityScore.current * 0.9) + (currentStability * 0.1));
            setCoachingMsg(currentMessage);

            const padX = width * 0.16;
            const padYTop = height * 0.38;
            const padYBottom = height * 0.12;

            const fullMinX = Math.max(0, minX - padX);
            const fullMaxX = Math.min(1, maxX + padX);
            const fullMinY = Math.max(0, minY - padYTop);
            const fullMaxY = Math.min(1, maxY + padYBottom);

            const fullWidth = fullMaxX - fullMinX;
            const fullHeight = fullMaxY - fullMinY;

            setBbox({
              left: fullMinX * 100,
              top: fullMinY * 100,
              width: fullWidth * 100,
              height: fullHeight * 100,
            });

            if (onFaceStatusChange) {
              onFaceStatusChange({
                faceDetected: true,
                isStraight: currentStability >= 80,
                message: currentMessage,
              });
            }
          } else {
            setFaceVisible(false);
            setBbox(null);
            setCoachingMsg('Face not detected');
            stabilityScore.current = Math.max(0, stabilityScore.current - 12);

            if (onFaceStatusChange) {
              onFaceStatusChange({
                faceDetected: false,
                isStraight: false,
                message: 'Face not detected',
              });
            }
          }

          if (onMetricsUpdate) {
            const visiblePct = Math.round((faceVisibleFrames.current / totalFrames.current) * 100);
            onMetricsUpdate({
              face_visible_pct: visiblePct,
              head_nods_count: headNods.current,
              frame_stability_score: stabilityScore.current,
              sitting_position: lastSittingPosition.current,
            });
          }
        } catch (err) {
          console.error('Error running face landmarker:', err);
        }
      }

      animationFrameId.current = requestAnimationFrame(track);
    };

    animationFrameId.current = requestAnimationFrame(track);
  };

  const stopTrackingLoop = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  };

  const submitTelemetry = async () => {
    try {
      if (totalFrames.current === 0) return;
      const visiblePct = Math.round((faceVisibleFrames.current / totalFrames.current) * 100);

      const isMockMode = typeof window !== 'undefined' && (window.location.search.includes('mock=true') || (!localStorage.getItem('token') && !localStorage.getItem('access_token')));
      if (isMockMode) return;

      await aiprepApi.saveVisionTelemetry({
        assessment_id: assessmentId,
        face_visible_pct: visiblePct,
        head_nods_count: headNods.current,
        frame_stability_score: stabilityScore.current,
        sitting_position: lastSittingPosition.current,
      });
    } catch (err) {
      console.error('Error submitting vision telemetry:', err);
    }
  };

  if (!enabled) return null;

  const isStraight = faceVisible && stabilityScore.current >= 80 && lookDirection.current === 'straight';

  return (
    <>
      {/* 1. Status Overlay Badge — Positioned at TOP-RIGHT */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-slate-900/85 dark:bg-slate-950/85 border border-slate-700/60 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-200 backdrop-blur-md shadow-xs transition-all">
        {loadError ? (
          <>
            <IconAlertTriangle size={14} className="text-amber-400" />
            <span className="text-amber-300">{loadError}</span>
          </>
        ) : modelLoaded ? (
          <>
            <IconUserCheck size={14} className="text-emerald-400" />
            <span className="text-slate-200">AI Vision</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </>
        ) : (
          <>
            <div className="h-2 w-2 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
            <span className="text-indigo-300">Initializing...</span>
          </>
        )}

        {modelLoaded && !loadError && (
          <span className={`border-l border-slate-700/60 pl-1.5 ml-0.5 font-medium flex items-center gap-1 ${faceVisible ? 'text-emerald-400' : 'text-rose-400'}`}>
            {faceVisible ? (
              <>
                <IconEye size={14} /> Tracked
              </>
            ) : (
              <>
                <IconEyeOff size={14} /> Lost
              </>
            )}
          </span>
        )}
      </div>

      {/* 2. Visual Face Bounding Box with Sleek Modern Glow */}
      {modelLoaded && bbox && (
        <div
          className={`absolute z-10 border-2 rounded-xl transition-all duration-75 flex flex-col items-center justify-start pointer-events-none
            ${isStraight
              ? 'border-emerald-400/90 shadow-[0_0_15px_rgba(52,211,153,0.3)] bg-emerald-500/5'
              : 'border-rose-500/90 shadow-[0_0_15px_rgba(244,63,94,0.3)] bg-rose-500/5'
            }`}
          style={{
            left: `${bbox.left}%`,
            top: `${bbox.top}%`,
            width: `${bbox.width}%`,
            height: `${bbox.height}%`,
          }}
        >
          <span className={`text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-b text-white shrink-0 shadow-xs
            ${isStraight ? 'bg-emerald-600/90' : 'bg-rose-600/90 animate-pulse'}`}
          >
            {coachingMsg}
          </span>
        </div>
      )}
    </>
  );
});

export default YOLOAnalyzer;
