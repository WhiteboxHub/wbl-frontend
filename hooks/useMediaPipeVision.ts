/**
 * Client-Side MediaPipe Vision Pre-Check Diagnostics Hook (Browser Side) - Fixed Version
 * Integrates MediaPipe Face Landmarker for real-time Device Check diagnostics:
 * - Robust Frontal Face Detection with 3D Z-depth verification (eliminates back-of-head false positives)
 * - True Eye Openness (EAR + Blendshape blink detection) & Gaze Iris Attention
 * - Candidate Centering & Bounding Box Guide
 * - Head Pose Alignment (Yaw, Pitch, Roll straightness)
 */

import React, { useRef, useState, useCallback, useEffect, type RefObject } from 'react';
import {
    FilesetResolver,
    FaceLandmarker,
} from '@mediapipe/tasks-vision';

export interface FaceBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface VideoTelemetry {
    is_video_mode: boolean;
    face_visible_pct: number;
    face_visibility_pct: number;
    eye_contact_pct: number;
    screen_attention_pct: number;
    distraction_level_pct: number;
    facial_engagement_pct: number;
    head_nods_count: number;
    acknowledgement_count: number;
    expression_variety_pct: number;
    posture_score: number;
    visual_engagement_pct: number;
    frame_stability_score?: number;
    sitting_position?: string;
    gaze_direction?: string;
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

export function useMediaPipeVision(videoRef?: RefObject<HTMLVideoElement | null>) {
    const [isReady, setIsReady] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [realtimeTelemetry, setRealtimeTelemetry] = useState<Partial<VideoTelemetry>>({});

    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const consecutiveNoFaceFramesRef = useRef<number>(0);
    const lastProcessedTimestampRef = useRef<number>(0);

    /**
     * Initializes MediaPipe Face Landmarker WASM model asynchronously
     */
    useEffect(() => {
        let isMounted = true;

        async function initMediaPipeLandmarker() {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
                );

                if (!isMounted) return;

                // High confidence thresholds to eliminate false positives on back of heads / hair
                const modelOptions = {
                    baseOptions: {
                        modelAssetPath:
                            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                        delegate: 'GPU' as const,
                    },
                    runningMode: 'VIDEO' as const,
                    numFaces: 1,
                    outputFaceBlendshapes: true,
                    minFaceDetectionConfidence: 0.60,
                    minFacePresenceConfidence: 0.60,
                    minTrackingConfidence: 0.60,
                };

                let faceLandmarker: FaceLandmarker | null = null;
                try {
                    faceLandmarker = await FaceLandmarker.createFromOptions(vision, modelOptions);
                } catch (gpuErr) {
                    console.warn('[useMediaPipeVision] GPU delegate unavailable, falling back to CPU:', gpuErr);
                    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                        ...modelOptions,
                        baseOptions: {
                            ...modelOptions.baseOptions,
                            delegate: 'CPU',
                        },
                    });
                }

                if (isMounted && faceLandmarker) {
                    faceLandmarkerRef.current = faceLandmarker;
                    setIsReady(true);
                }
            } catch (err) {
                console.warn('MediaPipe WASM initialization fallback:', err);
                if (isMounted) {
                    setIsReady(true);
                }
            }
        }

        initMediaPipeLandmarker();

        return () => {
            isMounted = false;
            if (faceLandmarkerRef.current) {
                faceLandmarkerRef.current.close();
                faceLandmarkerRef.current = null;
            }
        };
    }, []);

    /**
     * Resets diagnostic telemetry state
     */
    const resetTelemetry = useCallback(() => {
        consecutiveNoFaceFramesRef.current = 0;
        lastProcessedTimestampRef.current = 0;
        setRealtimeTelemetry({});
    }, []);

    /**
     * Calculates eye pupil gaze ratio relative to inner and outer eye corners
     */
    const calculateEyeGazeRatio = useCallback(
        (pupil: LandmarkPoint, innerCorner: LandmarkPoint, outerCorner: LandmarkPoint): number => {
            const eyeWidth = Math.abs(outerCorner.x - innerCorner.x);
            if (eyeWidth < 0.005) return 0.5;
            const minX = Math.min(innerCorner.x, outerCorner.x);
            return (pupil.x - minX) / eyeWidth;
        },
        []
    );

    /**
     * Core diagnostic check operating on extracted face landmarks
     */
    const processFrame = useCallback(
        (
            faceLandmarks?: LandmarkPoint[][],
            blendshapes?: BlendshapeResult[]
        ) => {
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
                        face_visible_pct: 0,
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

            // 1. ANATOMICAL FRONT-FACING VERIFICATION (Filters back-of-head hallucinations)
            // In a genuine frontal face, nose tip Z-depth is physically closer to camera than cheek boundaries
            const noseZ = nose?.z ?? 0;
            const leftCheekZ = leftCheek?.z ?? 0;
            const rightCheekZ = rightCheek?.z ?? 0;
            const isGenuineFrontFace = nose && chin && forehead && leftCheek && rightCheek &&
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

            // 2. Face Bounding Box & Centering
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

            // 3. Head Pose Orientation (Yaw, Pitch, Roll)
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

            // 4. EYE OPENNESS DETECTION (Checks both Eye Blink Blendshapes & Eyelid Aspect Ratio)
            let isEyesOpen = true;

            // Check A: Blendshape blink scores (if available)
            if (blendshapes && blendshapes.length > 0 && blendshapes[0].categories) {
                const categories = blendshapes[0].categories;
                const blinkLeft = categories.find((c) => c.categoryName.includes('eyeBlinkLeft'))?.score ?? 0;
                const blinkRight = categories.find((c) => c.categoryName.includes('eyeBlinkRight'))?.score ?? 0;
                if (blinkLeft > 0.45 && blinkRight > 0.45) {
                    isEyesOpen = false;
                }
            }

            // Check B: Geometric Eye Aspect Ratio (EAR) validation
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

            // 5. GAZE & ATTENTION (Must be OPEN and looking towards screen)
            const leftPupil = landmarks[468];
            const rightPupil = landmarks[473];
            let isInstantEyesAttentive = false;

            if (isEyesOpen && leftPupil && rightPupil && leftInner && leftOuter && rightInner && rightOuter) {
                const leftRatio = calculateEyeGazeRatio(leftPupil, leftInner, leftOuter);
                const rightRatio = calculateEyeGazeRatio(rightPupil, rightInner, rightOuter);
                const avgRatio = (leftRatio + rightRatio) / 2;

                // Gaze must be in centered forward range AND eyes must be open
                isInstantEyesAttentive = avgRatio >= 0.28 && avgRatio <= 0.72;
            } else {
                // If eyes are closed or turned away, attention is FALSE
                isInstantEyesAttentive = false;
            }

            const currentInstantStraight = isCentered && isFaceStraight;

            setRealtimeTelemetry({
                is_video_mode: true,
                is_instant_face_present: true,
                is_instant_eyes_attentive: isInstantEyesAttentive,
                face_visible_pct: 100,
                face_visibility_pct: 100,
                eye_contact_pct: isInstantEyesAttentive ? 100 : 0,
                screen_attention_pct: isInstantEyesAttentive ? 100 : 0,
                distraction_level_pct: isInstantEyesAttentive ? 0 : 100,
                posture_score: currentInstantStraight ? 85 : (isCentered ? 70 : 40),
                sitting_position: currentInstantStraight ? 'Upright Centered' : (isCentered ? 'Centered' : 'Adjust Frame'),
                is_instant_straight: currentInstantStraight,
                face_box: currentFaceBox,
            });
        },
        [calculateEyeGazeRatio]
    );

    /**
     * Processes a video element frame directly using MediaPipe Face Landmarker
     */
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
                        blendshapes = faceRes.faceBlendshapes.map((b) => ({
                            categories: b.categories.map((c) => ({
                                categoryName: c.categoryName,
                                score: c.score,
                            })),
                        }));
                    }
                } catch (faceErr) {
                    console.debug('[useMediaPipeVision] FaceLandmarker frame error:', faceErr);
                }
            }

            processFrame(faceLandmarks, blendshapes);
        },
        [processFrame]
    );

    return {
        isReady,
        setIsReady,
        isTracking,
        setIsTracking,
        processFrame,
        detectVideoFrame,
        resetTelemetry,
        realtimeTelemetry,
    };
}

export default useMediaPipeVision;
