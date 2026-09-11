/**
 * Client-Side MediaPipe Vision Diagnostics Hook
 * - Safe for Next.js SSR & Static Site Generation
 * - Automatic GPU -> CPU fallback
 * - Resilient error handling (never blocks candidates)
 */
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoTelemetry {
  is_video_mode: boolean;
  face_visibility_pct: number;
  eye_contact_pct: number;
  screen_attention_pct: number;
  sitting_position?: string;
  is_instant_straight?: boolean;
  face_box?: FaceBox;
  is_instant_face_present?: boolean;
  is_instant_eyes_attentive?: boolean;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface BlendshapeCategory {
  categoryName: string;
  score: number;
}

export interface BlendshapeResult {
  categories: BlendshapeCategory[];
}

export function useMediaPipeVision() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [realtimeTelemetry, setRealtimeTelemetry] = useState<Partial<VideoTelemetry>>({});

  const faceLandmarkerRef = useRef<any>(null);
  const consecutiveNoFaceFramesRef = useRef<number>(0);
  const lastProcessedTimestampRef = useRef<number>(0);

  // Initialize MediaPipe only on client side (SSR Safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lifecycle = { cancelled: false };
    setIsLoading(true);

    async function createLandmarker() {
      const visionModule = await import('@mediapipe/tasks-vision');
      const { FilesetResolver, FaceLandmarker } = visionModule;

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      const modelOptions = {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU' as const,
        },
        runningMode: 'VIDEO' as const,
        numFaces: 1,
        outputFaceBlendshapes: true,
        minFaceDetectionConfidence: 0.55,
        minFacePresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
      };

      try {
        return await FaceLandmarker.createFromOptions(vision, modelOptions);
      } catch (gpuErr) {
        console.warn('[MediaPipe] GPU unavailable, using CPU fallback:', gpuErr);
        return await FaceLandmarker.createFromOptions(vision, {
          ...modelOptions,
          baseOptions: { ...modelOptions.baseOptions, delegate: 'CPU' },
        });
      }
    }

    createLandmarker()
      .then((instance) => {
        // If unmount happened while we were awaiting, don't adopt the instance —
        // close it right here instead of leaving it to a cleanup that already ran.
        if (lifecycle.cancelled) {
          try { instance.close(); } catch {}
          return;
        }
        faceLandmarkerRef.current = instance;
        setIsReady(true);
        setLoadError(null);
      })
      .catch((err: any) => {
        console.warn('[MediaPipe] Initialization warning:', err);
        if (!lifecycle.cancelled) {
          setIsReady(false);
          setLoadError(err?.message || 'MediaPipe initialization failed');
        }
      })
      .finally(() => {
        if (!lifecycle.cancelled) setIsLoading(false);
      });

    return () => {
      lifecycle.cancelled = true;
      // Handles the case where init already finished before unmount.
      if (faceLandmarkerRef.current) {
        try { faceLandmarkerRef.current.close(); } catch {}
        faceLandmarkerRef.current = null;
      }
      // If init hasn't finished yet, the .then() above will see
      // lifecycle.cancelled === true and close the instance itself.
    };
  }, []);

  const resetTelemetry = useCallback(() => {
    consecutiveNoFaceFramesRef.current = 0;
    lastProcessedTimestampRef.current = 0;
    setRealtimeTelemetry({});
  }, []);

  const calculateEyeGazeRatio = useCallback(
    (pupil: LandmarkPoint, innerCorner: LandmarkPoint, outerCorner: LandmarkPoint): number => {
      const eyeWidth = Math.abs(outerCorner.x - innerCorner.x);
      if (eyeWidth < 0.005) return 0.5;
      const minX = Math.min(innerCorner.x, outerCorner.x);
      return (pupil.x - minX) / eyeWidth;
    },
    []
  );

  const processFrame = useCallback(
    (faceLandmarks?: LandmarkPoint[][], blendshapes?: BlendshapeResult[]) => {
      if (!faceLandmarks || faceLandmarks.length === 0 || !faceLandmarks[0]) {
        consecutiveNoFaceFramesRef.current += 1;
        if (consecutiveNoFaceFramesRef.current >= 4) {
          setRealtimeTelemetry((prev) => ({
            ...prev,
            is_instant_face_present: false,
            is_instant_eyes_attentive: false,
            face_box: undefined,
            sitting_position: 'No Face Detected',
            is_instant_straight: false,
            face_visibility_pct: 0,
            eye_contact_pct: 0,
          }));
        }
        return;
      }

      const landmarks = faceLandmarks[0];
      const nose = landmarks[1];
      const chin = landmarks[152];
      const forehead = landmarks[10];
      const leftCheek = landmarks[234];
      const rightCheek = landmarks[454];

      // 1. ANATOMICAL FRONT-FACING VALIDATION
      const noseZ = nose?.z ?? 0;
      const leftCheekZ = leftCheek?.z ?? 0;
      const rightCheekZ = rightCheek?.z ?? 0;
      const isGenuineFrontFace =
        nose && chin && forehead && leftCheek && rightCheek &&
        (noseZ < leftCheekZ + 0.05 && noseZ < rightCheekZ + 0.05);

      if (!isGenuineFrontFace) {
        consecutiveNoFaceFramesRef.current += 1;
        if (consecutiveNoFaceFramesRef.current >= 4) {
          setRealtimeTelemetry((prev) => ({
            ...prev,
            is_instant_face_present: false,
            is_instant_eyes_attentive: false,
            face_box: undefined,
            sitting_position: 'No Face Detected',
            is_instant_straight: false,
          }));
        }
        return;
      }

      consecutiveNoFaceFramesRef.current = 0;

      // 2. Face Bounding Box
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      const padX = (maxX - minX) * 0.10;
      const padY = (maxY - minY) * 0.12;
      const currentFaceBox: FaceBox = {
        x: Math.max(0, minX - padX),
        y: Math.max(0, minY - padY),
        width: Math.min(1, (maxX - minX) + padX * 2),
        height: Math.min(1, (maxY - minY) + padY * 2),
      };

      const isCentered = nose
        ? (nose.x >= 0.35 && nose.x <= 0.65 && nose.y >= 0.16 && nose.y <= 0.78 && minX >= 0.22 && maxX <= 0.78)
        : false;

      // 3. Head Pose Alignment
      const leftOuter = landmarks[33];
      const rightOuter = landmarks[263];
      const leftDist = Math.abs(nose.x - leftCheek.x);
      const rightDist = Math.abs(rightCheek.x - nose.x);
      const yawRatio = leftDist / Math.max(0.0001, leftDist + rightDist);
      const isYawStraight = yawRatio >= 0.35 && yawRatio <= 0.65;

      const upperHeight = Math.abs(nose.y - forehead.y);
      const lowerHeight = Math.abs(chin.y - nose.y);
      const pitchRatio = lowerHeight / Math.max(0.0001, upperHeight + lowerHeight);
      const isPitchStraight = pitchRatio >= 0.42 && pitchRatio <= 0.78;

      const eyeTilt = Math.abs(leftOuter.y - rightOuter.y);
      const isRollLevel = eyeTilt <= 0.05;
      const isFaceStraight = isYawStraight && isPitchStraight && isRollLevel;

      // 4. Eye Openness (Blendshapes + EAR)
      let isEyesOpen = true;
      if (blendshapes && blendshapes.length > 0 && blendshapes[0].categories) {
        const categories = blendshapes[0].categories;
        const blinkLeft = categories.find((c) => c.categoryName.includes('eyeBlinkLeft'))?.score ?? 0;
        const blinkRight = categories.find((c) => c.categoryName.includes('eyeBlinkRight'))?.score ?? 0;
        if (blinkLeft > 0.45 && blinkRight > 0.45) {
          isEyesOpen = false;
        }
      }

      const leftTopEyelid = landmarks[159];
      const leftBottomEyelid = landmarks[145];
      const leftInner = landmarks[133];
      const rightTopEyelid = landmarks[386];
      const rightBottomEyelid = landmarks[374];
      const rightInner = landmarks[362];

      if (leftTopEyelid && leftBottomEyelid && rightTopEyelid && rightBottomEyelid) {
        const leftEyeHeight = Math.abs(leftTopEyelid.y - leftBottomEyelid.y);
        const leftEyeWidth = Math.abs(leftOuter.x - leftInner.x);
        const leftEAR = leftEyeHeight / Math.max(0.001, leftEyeWidth);

        const rightEyeHeight = Math.abs(rightTopEyelid.y - rightBottomEyelid.y);
        const rightEyeWidth = Math.abs(rightOuter.x - rightInner.x);
        const rightEAR = rightEyeHeight / Math.max(0.001, rightEyeWidth);

        if (leftEAR < 0.12 && rightEAR < 0.12) {
          isEyesOpen = false;
        }
      }

      // 5. Screen Gaze Attention
      const leftPupil = landmarks[468];
      const rightPupil = landmarks[473];
      let isInstantEyesAttentive = false;

      if (isEyesOpen && leftPupil && rightPupil && leftInner && leftOuter && rightInner && rightOuter) {
        const leftRatio = calculateEyeGazeRatio(leftPupil, leftInner, leftOuter);
        const rightRatio = calculateEyeGazeRatio(rightPupil, rightInner, rightOuter);
        const avgRatio = (leftRatio + rightRatio) / 2;
        isInstantEyesAttentive = avgRatio >= 0.28 && avgRatio <= 0.72;
      }

      const currentInstantStraight = isCentered && isFaceStraight;

      setRealtimeTelemetry({
        is_video_mode: true,
        is_instant_face_present: true,
        is_instant_eyes_attentive: isInstantEyesAttentive,
        face_visibility_pct: 100,
        eye_contact_pct: isInstantEyesAttentive ? 100 : 0,
        screen_attention_pct: isInstantEyesAttentive ? 100 : 0,
        sitting_position: currentInstantStraight ? 'Upright Centered' : (isCentered ? 'Centered' : 'Adjust Frame'),
        is_instant_straight: currentInstantStraight,
        face_box: currentFaceBox,
      });
    },
    [calculateEyeGazeRatio]
  );

  const detectVideoFrame = useCallback(
    (videoElement: HTMLVideoElement, timestamp: number) => {
      if (!videoElement || videoElement.readyState < 2) return;

      let safeTimestamp = timestamp;
      if (!safeTimestamp || isNaN(safeTimestamp) || safeTimestamp <= lastProcessedTimestampRef.current) {
        safeTimestamp = lastProcessedTimestampRef.current + 33.33;
      }
      lastProcessedTimestampRef.current = safeTimestamp;

      let faceLandmarks: LandmarkPoint[][] | undefined;
      let blendshapes: BlendshapeResult[] | undefined;

      if (faceLandmarkerRef.current) {
        try {
          const faceRes = faceLandmarkerRef.current.detectForVideo(videoElement, safeTimestamp);
          if (faceRes.faceLandmarks && faceRes.faceLandmarks.length > 0) {
            faceLandmarks = faceRes.faceLandmarks as LandmarkPoint[][];
          }
          if (faceRes.faceBlendshapes && faceRes.faceBlendshapes.length > 0) {
            blendshapes = faceRes.faceBlendshapes.map((b: any) => ({
              categories: b.categories.map((c: any) => ({
                categoryName: c.categoryName,
                score: c.score,
              })),
            }));
          }
        } catch (faceErr) {
          // Ignore individual frame drops silently in production
        }
      }

      processFrame(faceLandmarks, blendshapes);
    },
    [processFrame]
  );

  return {
    isReady,
    isLoading,
    loadError,
    detectVideoFrame,
    resetTelemetry,
    realtimeTelemetry,
  };
}

export default useMediaPipeVision;
