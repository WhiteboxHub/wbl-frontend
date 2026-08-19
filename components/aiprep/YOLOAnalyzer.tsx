/**
 * YOLOAnalyzer Component
 * 
 * Target Workspace: wbl-frontend
 * Primary Developer: Fatima (ML1) / Karthik (FE2) / Narasimha (FE1)
 * 
 * Runs a REAL client-side face landmark proctoring model inside the browser using MediaPipe.
 * Draws a real bounding box outline directly on the camera stream:
 * - Green (Stable) when the candidate is centered and straight.
 * - Red (Not Straight / Adjust posture) when off-center, too close/far, or face is lost.
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { aiprepApi } from '@/lib/aiprep-api';
import { Eye, EyeOff, UserCheck, AlertTriangle } from 'lucide-react';

interface YOLOAnalyzerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled: boolean;
  assessmentId: number;
  onMetricsUpdate?: (metrics: {
    face_visible_pct: number;
    head_nods_count: number;
    frame_stability_score: number;
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

export const YOLOAnalyzer: React.FC<YOLOAnalyzerProps> = ({
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

  const landmarkerRef = useRef<any>(null);
  const animationFrameId = useRef<number | null>(null);

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
        // Dynamically import MediaPipe Vision tasks from jsdelivr CDN
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
        } catch (e) {}
        landmarkerRef.current = null;
      }
    };
  }, [enabled]);

  const startTrackingLoop = () => {
    const track = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !landmarker || video.paused || video.ended) {
        animationFrameId.current = requestAnimationFrame(track);
        return;
      }

      // Check if video frame is fully loaded and ready
      if (video.videoWidth > 0 && video.readyState >= 2) {
        try {
          const timestamp = performance.now();
          const result = landmarker.detectForVideo(video, timestamp);
          totalFrames.current++;

          if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            faceVisibleFrames.current++;
            setFaceVisible(true);

            // Extract landmarks for the first detected face
            const landmarks = result.faceLandmarks[0];

            // Calculate bounding box in normalized coordinates (0 to 1)
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

            // Proctoring calibration metrics
            const isCentered = centerX >= 0.35 && centerX <= 0.65;
            const isTooClose = faceArea > 0.32;
            const isTooFar = faceArea < 0.035;

            // Rotation checks: Horizontal (Yaw) + Vertical (Pitch looking UP/DOWN)
            const pNose = landmarks[4];
            const pLeft = landmarks[234];
            const pRight = landmarks[454];
            const pForehead = landmarks[10];
            const pChin = landmarks[152];

            let isLookingAway = false;
            let isLookingUp = false;
            let isLookingDown = false;

            // 1. Horizontal Yaw check (Left / Right turn)
            if (pNose && pLeft && pRight) {
              const dLeft = Math.abs(pNose.x - pLeft.x);
              const dRight = Math.abs(pRight.x - pNose.x);
              const yawRatio = dLeft / (dRight || 0.0001);
              if (yawRatio < 0.45 || yawRatio > 2.2) {
                isLookingAway = true;
              }
            }

            // 2. Vertical Pitch check (Looking UP / DOWN)
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

            let currentStability = 100;
            let currentMessage = 'Straight / Stable';

            if (!isCentered) {
              currentStability = 50;
              currentMessage = centerX < 0.35 ? 'Move slightly right' : 'Move slightly left';
            } else if (isTooClose) {
              currentStability = 60;
              currentMessage = 'Move slightly away';
            } else if (isTooFar) {
              currentStability = 60;
              currentMessage = 'Move closer to camera';
            } else if (isLookingUp) {
              currentStability = 40;
              currentMessage = 'Looking up - Please look straight';
            } else if (isLookingDown) {
              currentStability = 40;
              currentMessage = 'Looking down - Please look straight';
            } else if (isLookingAway) {
              currentStability = 45;
              currentMessage = 'Please look straight at screen';
            }

            // Head Nod detection
            if (lastCenterY.current !== null) {
              const dy = Math.abs(centerY - lastCenterY.current);
              if (dy > 0.015) {
                headNods.current += 1;
              }
            }
            lastCenterY.current = centerY;

            // Update stability running score
            stabilityScore.current = Math.round((stabilityScore.current * 0.9) + (currentStability * 0.1));
            setCoachingMsg(currentMessage);

            // Expand bounding box for full face & head profile coverage
            const padX = width * 0.16;
            const padYTop = height * 0.38;
            const padYBottom = height * 0.12;

            const fullMinX = Math.max(0, minX - padX);
            const fullMaxX = Math.min(1, maxX + padX);
            const fullMinY = Math.max(0, minY - padYTop);
            const fullMaxY = Math.min(1, maxY + padYBottom);

            const fullWidth = fullMaxX - fullMinX;
            const fullHeight = fullMaxY - fullMinY;

            // Scale to percentages for full-face overlay layout
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

          // Emit metrics to parent
          if (onMetricsUpdate) {
            const visiblePct = Math.round((faceVisibleFrames.current / totalFrames.current) * 100);
            onMetricsUpdate({
              face_visible_pct: visiblePct,
              head_nods_count: headNods.current,
              frame_stability_score: stabilityScore.current,
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

      // Check if in mock mode
      const isMockMode = typeof window !== 'undefined' && (window.location.search.includes('mock=true') || (!localStorage.getItem('token') && !localStorage.getItem('access_token')));
      if (isMockMode) return;

      await aiprepApi.saveVisionTelemetry({
        assessment_id: assessmentId,
        face_visible_pct: visiblePct,
        head_nods_count: headNods.current,
        frame_stability_score: stabilityScore.current,
      });
    } catch (err) {
      console.error('Error submitting vision telemetry:', err);
    }
  };

  if (!enabled) return null;

  // Add ref to track overall orientation state
  const lookDirection = useRef<'straight' | 'up' | 'down' | 'away'>('straight');

  // Existing isStraight calculation updated to consider lookDirection
  const isStraight = faceVisible && stabilityScore.current >= 80 && lookDirection.current === 'straight';

  return (
    <>
      {/* 1. Status Overlay Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-700 backdrop-blur-sm shadow-sm">
        {loadError ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-600">{loadError}</span>
          </>
        ) : modelLoaded ? (
          <>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Full Face Model Active</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </>
        ) : (
          <>
            <div className="h-2 w-2 rounded-full border-2 border-[#4A6CF7] border-t-transparent animate-spin shrink-0" />
            <span className="text-[#4A6CF7]">Initializing AI Vision...</span>
          </>
        )}

        {modelLoaded && !loadError && (
          <span className={`border-l border-slate-200 pl-1.5 ml-1 font-semibold flex items-center gap-1 ${faceVisible ? 'text-slate-700' : 'text-rose-600'}`}>
            {faceVisible ? (
              <>
                <Eye className="w-3 h-3 text-slate-500" /> Detected
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 text-rose-600" /> Lost
              </>
            )}
          </span>
        )}
      </div>

      {/* 2. Visual Face Bounding Box (Red if not straight/stable, Green if straight/stable) */}
      {modelLoaded && bbox && (
        <div
          className={`absolute z-10 border-2 rounded-xl transition-all duration-75 flex flex-col items-center justify-start pointer-events-none
            ${isStraight 
              ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)] bg-emerald-500/5' 
              : 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.25)] bg-rose-500/5'
            }`}
          style={{
            left: `${bbox.left}%`,
            top: `${bbox.top}%`,
            width: `${bbox.width}%`,
            height: `${bbox.height}%`,
          }}
        >
          <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-b text-white shrink-0 shadow-sm
            ${isStraight ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}
          >
            {coachingMsg}
          </span>
        </div>
      )}
    </>
  );
};

export default YOLOAnalyzer;
