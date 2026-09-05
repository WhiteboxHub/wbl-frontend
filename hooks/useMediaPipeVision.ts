/**
 * Client-Side MediaPipe Vision Telemetry Hook (Browser Side) - Production Version
 * Integrates MediaPipe Face Landmarker & MediaPipe Pose Landmarker as per AIPrep_Contracts_signature.pdf.
 *
 * Capabilities:
 * 1. MediaPipe Face Landmarker: 478 face mesh landmarks + 52 facial blendshapes for face visibility,
 *    eye gaze contact ratio, facial engagement, head nod pitch tracking, and expression variety.
 * 2. MediaPipe Pose Landmarker: 33 body pose landmarks for upper-body posture alignment score.
 * 3. Welford's O(1) memory online running variance algorithm for expression variety tracking.
 * 4. Dual key alias compliance (face_visibility_pct & face_visible_pct, head_nods_count & acknowledgement_count).
 */

import React, { useRef, useState, useCallback, useEffect, type RefObject } from 'react';
import {
    FilesetResolver,
    FaceLandmarker,
    PoseLandmarker,
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

interface TelemetryAccumulator {
    totalFrames: number;
    faceVisibleFrames: number;
    eyeContactFrames: number;
    screenAttentionFrames: number;
    distractionFrames: number;
    facialEngagementSum: number;
    postureScoreSum: number;
    headNodsCount: number;
    // Welford's algorithm running variance tracking (O(1) memory)
    varCount: number;
    varMean: number;
    varM2: number;
}

export function useMediaPipeVision(videoRef?: RefObject<HTMLVideoElement | null>) {
    const [isReady, setIsReady] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [realtimeTelemetry, setRealtimeTelemetry] = useState<Partial<VideoTelemetry>>({});

    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);

    const accumulatorRef = useRef<TelemetryAccumulator>({
        totalFrames: 0,
        faceVisibleFrames: 0,
        eyeContactFrames: 0,
        screenAttentionFrames: 0,
        distractionFrames: 0,
        facialEngagementSum: 0,
        postureScoreSum: 0,
        headNodsCount: 0,
        varCount: 0,
        varMean: 0,
        varM2: 0,
    });

    const lastPitchRef = useRef<number | null>(null);
    const lastNodTimestampRef = useRef<number>(0);
    const pitchDirectionRef = useRef<'UP' | 'DOWN' | null>(null);

    /**
     * Initializes MediaPipe Face Landmarker & Pose Landmarker WASM models asynchronously
     */
    useEffect(() => {
        let isMounted = true;

        async function initMediaPipeLandmarkers() {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
                );

                if (!isMounted) return;

                // Initialize Face Landmarker with 478 face mesh landmarks + 52 facial blendshapes
                const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath:
                            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                        delegate: 'GPU',
                    },
                    runningMode: 'VIDEO',
                    numFaces: 1,
                    outputFaceBlendshapes: true,
                });

                // Initialize Pose Landmarker with 33 upper body pose landmarks
                const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath:
                            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                        delegate: 'GPU',
                    },
                    runningMode: 'VIDEO',
                    numPoses: 1,
                });

                if (isMounted) {
                    faceLandmarkerRef.current = faceLandmarker;
                    poseLandmarkerRef.current = poseLandmarker;
                    setIsReady(true);
                }
            } catch (err) {
                console.warn('MediaPipe WASM initialization fallback to manual frame mode:', err);
                if (isMounted) {
                    setIsReady(true);
                }
            }
        }

        initMediaPipeLandmarkers();

        return () => {
            isMounted = false;
            if (faceLandmarkerRef.current) {
                faceLandmarkerRef.current.close();
                faceLandmarkerRef.current = null;
            }
            if (poseLandmarkerRef.current) {
                poseLandmarkerRef.current.close();
                poseLandmarkerRef.current = null;
            }
        };
    }, []);

    /**
     * Resets all accumulated telemetry state to initial zero values
     */
    const resetTelemetry = useCallback(() => {
        accumulatorRef.current = {
            totalFrames: 0,
            faceVisibleFrames: 0,
            eyeContactFrames: 0,
            screenAttentionFrames: 0,
            distractionFrames: 0,
            facialEngagementSum: 0,
            postureScoreSum: 0,
            headNodsCount: 0,
            varCount: 0,
            varMean: 0,
            varM2: 0,
        };
        lastPitchRef.current = null;
        pitchDirectionRef.current = null;
        setRealtimeTelemetry({});
    }, []);

    /**
     * Evaluates pitch oscillation to detect head nods with face-height distance normalization and time debounce
     */
    const detectHeadNod = useCallback((nose: LandmarkPoint, chin: LandmarkPoint, forehead?: LandmarkPoint) => {
        const faceHeight = forehead ? Math.abs(chin.y - forehead.y) : Math.abs(chin.y - nose.y) * 2;
        if (faceHeight < 0.05) return; // Ignore if face is invalid / too far

        const normalizedPitch = (chin.y - nose.y) / faceHeight;
        const lastPitch = lastPitchRef.current;
        const now = Date.now();

        if (lastPitch !== null) {
            const diff = normalizedPitch - lastPitch;
            if (diff > 0.04 && pitchDirectionRef.current !== 'DOWN') {
                pitchDirectionRef.current = 'DOWN';
            } else if (diff < -0.04 && pitchDirectionRef.current === 'DOWN') {
                pitchDirectionRef.current = 'UP';
                // Time debounce: head nods must be at least 300ms apart
                if (now - lastNodTimestampRef.current > 300) {
                    accumulatorRef.current.headNodsCount += 1;
                    lastNodTimestampRef.current = now;
                }
            }
        }
        lastPitchRef.current = normalizedPitch;
    }, []);

    /**
     * Calculates eye pupil gaze ratio relative to inner and outer eye corners
     */
    const calculateEyeGazeRatio = useCallback(
        (pupil: LandmarkPoint, innerCorner: LandmarkPoint, outerCorner: LandmarkPoint): number => {
            const eyeWidth = Math.abs(outerCorner.x - innerCorner.x);
            if (eyeWidth < 0.005) return 0.5; // Default centered ratio if eye is unclear
            const minX = Math.min(innerCorner.x, outerCorner.x);
            return (pupil.x - minX) / eyeWidth;
        },
        []
    );

    /**
     * Core telemetry metric calculation logic operating on extracted landmarks
     */
    const processFrame = useCallback(
        (
            faceLandmarks?: LandmarkPoint[][], // MediaPipe Face Landmarker (478 points)
            blendshapes?: BlendshapeResult[],  // MediaPipe Face Blendshapes (52 categories)
            poseLandmarks?: LandmarkPoint[][]  // MediaPipe Pose Landmarker (33 points)
        ) => {
            const acc = accumulatorRef.current;
            acc.totalFrames += 1;

            if (!faceLandmarks || faceLandmarks.length === 0 || !faceLandmarks[0]) {
                acc.distractionFrames += 1;
                return;
            }

            // 1. Face Visibility, Bounding Box & Frame Centering Analysis
            acc.faceVisibleFrames += 1;
            const landmarks = faceLandmarks[0];

            const nose = landmarks[1];
            const chin = landmarks[152];
            const forehead = landmarks[10];

            const leftCheek = landmarks[234];
            const rightCheek = landmarks[454];

            // Calculate precise face bounding box (minX, maxX, minY, maxY)
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
            const currentFaceBox = {
                x: Math.max(0, minX - padX),
                y: Math.max(0, minY - padY),
                width: Math.min(1, (maxX - minX) + padX * 2),
                height: Math.min(1, (maxY - minY) + padY * 2),
            };

            // Pupil and eye corners landmarks (Face Landmarker Iris / Eye mesh)
            const leftPupil = landmarks[468];
            const leftInner = landmarks[133];
            const leftOuter = landmarks[33];

            const rightPupil = landmarks[473];
            const rightInner = landmarks[362];
            const rightOuter = landmarks[263];

            // Centering check: nose x between 0.15 and 0.85, y between 0.10 and 0.85
            const isCentered = nose ? (nose.x >= 0.15 && nose.x <= 0.85 && nose.y >= 0.10 && nose.y <= 0.85) : false;

            // Natural Head Pose Orientation Checks (Yaw, Pitch, Roll)
            let isFaceStraight = true;
            if (nose && chin && forehead && leftCheek && rightCheek && leftOuter && rightOuter) {
                // Yaw check (Left / Right head turn)
                const leftDist = Math.abs(nose.x - leftCheek.x);
                const rightDist = Math.abs(rightCheek.x - nose.x);
                const yawRatio = leftDist / Math.max(0.0001, leftDist + rightDist);
                const isYawStraight = yawRatio >= 0.35 && yawRatio <= 0.65;

                // Pitch check (Up / Down head tilt)
                const upperHeight = Math.abs(nose.y - forehead.y);
                const lowerHeight = Math.abs(chin.y - nose.y);
                const pitchRatio = lowerHeight / Math.max(0.0001, upperHeight + lowerHeight);
                const isPitchStraight = pitchRatio >= 0.42 && pitchRatio <= 0.78;

                // Roll check (Sideways head tilt)
                const eyeTilt = Math.abs(leftOuter.y - rightOuter.y);
                const isRollLevel = eyeTilt <= 0.05;

                isFaceStraight = isYawStraight && isPitchStraight && isRollLevel;
            }

            // 2. Normalized Head Nod Recognition
            if (nose && chin) {
                detectHeadNod(nose, chin, forehead);
            }

            // 3. Eye Contact & Screen Attention Ratio Calculation
            if (leftPupil && leftInner && leftOuter && rightPupil && rightInner && rightOuter) {
                const leftRatio = calculateEyeGazeRatio(leftPupil, leftInner, leftOuter);
                const rightRatio = calculateEyeGazeRatio(rightPupil, rightInner, rightOuter);
                const avgRatio = (leftRatio + rightRatio) / 2;

                if (avgRatio >= 0.30 && avgRatio <= 0.70 && isCentered) {
                    acc.eyeContactFrames += 1;
                    acc.screenAttentionFrames += 1;
                } else {
                    acc.distractionFrames += 1;
                }
            } else {
                if (isCentered) {
                    acc.screenAttentionFrames += 1;
                } else {
                    acc.distractionFrames += 1;
                }
            }

            // 4. Facial Engagement & Dynamic Expression Variety (Welford O(1) Running Variance)
            if (blendshapes && blendshapes.length > 0 && blendshapes[0].categories) {
                const scores = blendshapes[0].categories;
                const smileLeft = scores.find((c) => c.categoryName.includes('mouthSmileLeft'))?.score || 0;
                const smileRight = scores.find((c) => c.categoryName.includes('mouthSmileRight'))?.score || 0;
                const jaw = scores.find((c) => c.categoryName.includes('jawOpen'))?.score || 0;

                const currentEngagement = Math.min(100, ((smileLeft + smileRight) * 25 + jaw * 50) * 100);
                acc.facialEngagementSum += currentEngagement;

                // Online running variance (Welford's algorithm)
                acc.varCount += 1;
                const delta = currentEngagement - acc.varMean;
                acc.varMean += delta / acc.varCount;
                const delta2 = currentEngagement - acc.varMean;
                acc.varM2 += delta * delta2;
            }

            // 5. Posture Score from MediaPipe Pose Landmarker (Upper-Body Shoulder Alignment)
            let framePostureScore = 85.0;
            if (!isCentered || !isFaceStraight) {
                framePostureScore = 40.0;
            } else if (poseLandmarks && poseLandmarks.length > 0 && poseLandmarks[0]) {
                const leftShoulder = poseLandmarks[0][11];
                const rightShoulder = poseLandmarks[0][12];

                if (leftShoulder && rightShoulder && (leftShoulder.visibility ?? 1) > 0.4) {
                    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
                    framePostureScore = Math.max(0, Math.min(100, 100 - shoulderTilt * 300));
                }
            }
            acc.postureScoreSum += framePostureScore;

            // Update real-time display telemetry every 3 frames
            const currentInstantStraight = isCentered && isFaceStraight && framePostureScore >= 60;

            if (acc.totalFrames % 3 === 0) {
                const total = Math.max(1, acc.totalFrames);
                const visible = Math.max(1, acc.faceVisibleFrames);
                const faceVis = Number(((acc.faceVisibleFrames / total) * 100).toFixed(1));
                const headNods = acc.headNodsCount;

                setRealtimeTelemetry({
                    face_visibility_pct: faceVis,
                    face_visible_pct: faceVis,
                    eye_contact_pct: Number(((acc.eyeContactFrames / total) * 100).toFixed(1)),
                    head_nods_count: headNods,
                    acknowledgement_count: headNods,
                    posture_score: Number((acc.postureScoreSum / visible).toFixed(1)),
                    sitting_position: currentInstantStraight ? 'Upright Centered' : 'Slouched / Offset',
                    is_instant_straight: currentInstantStraight,
                    face_box: currentFaceBox,
                });
            }
        },
        [detectHeadNod, calculateEyeGazeRatio]
    );

    /**
     * Processes a video element frame directly using MediaPipe Face Landmarker & Pose Landmarker
     */
    const detectVideoFrame = useCallback(
        (videoElement: HTMLVideoElement, timestamp: number) => {
            if (!videoElement || videoElement.readyState < 2) return;

            let faceLandmarks: LandmarkPoint[][] | undefined;
            let blendshapes: BlendshapeResult[] | undefined;
            let poseLandmarks: LandmarkPoint[][] | undefined;

            // Run MediaPipe Face Landmarker
            if (faceLandmarkerRef.current) {
                try {
                    const faceRes = faceLandmarkerRef.current.detectForVideo(videoElement, timestamp);
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
                } catch (_) { }
            }

            // Run MediaPipe Pose Landmarker
            if (poseLandmarkerRef.current) {
                try {
                    const poseRes = poseLandmarkerRef.current.detectForVideo(videoElement, timestamp);
                    if (poseRes.landmarks && poseRes.landmarks.length > 0) {
                        poseLandmarks = poseRes.landmarks as LandmarkPoint[][];
                    }
                } catch (_) { }
            }

            processFrame(faceLandmarks, blendshapes, poseLandmarks);
        },
        [processFrame]
    );

    /**
     * Finalizes and aggregates complete video telemetry JSON payload
     */
    const getFinalTelemetry = useCallback((): VideoTelemetry => {
        const acc = accumulatorRef.current;
        const total = Math.max(1, acc.totalFrames);
        const visibleTotal = Math.max(1, acc.faceVisibleFrames);

        const face_visibility_pct = Number(((acc.faceVisibleFrames / total) * 100).toFixed(1));
        const eye_contact_pct = Number(((acc.eyeContactFrames / total) * 100).toFixed(1));
        const screen_attention_pct = Number(((acc.screenAttentionFrames / total) * 100).toFixed(1));
        const distraction_level_pct = Number((100 - screen_attention_pct).toFixed(1));
        const facial_engagement_pct = Number((acc.facialEngagementSum / visibleTotal).toFixed(1));
        const posture_score = Number((acc.postureScoreSum / visibleTotal).toFixed(1));

        // Calculate expression variety from running variance
        let expression_variety_pct = 75.0;
        if (acc.varCount > 1) {
            const variance = acc.varM2 / (acc.varCount - 1);
            const stdDev = Math.sqrt(variance);
            expression_variety_pct = Math.min(100, Math.max(20, Number((stdDev * 4 + 50).toFixed(1))));
        }

        const visual_engagement_pct = Number(
            (eye_contact_pct * 0.4 + posture_score * 0.3 + facial_engagement_pct * 0.3).toFixed(1)
        );

        return {
            is_video_mode: true,
            face_visibility_pct,
            face_visible_pct: face_visibility_pct,
            eye_contact_pct,
            screen_attention_pct,
            distraction_level_pct,
            facial_engagement_pct,
            head_nods_count: acc.headNodsCount,
            acknowledgement_count: acc.headNodsCount,
            expression_variety_pct,
            posture_score,
            visual_engagement_pct,
            frame_stability_score: 95.0,
        };
    }, []);

    return {
        isReady,
        setIsReady,
        isTracking,
        setIsTracking,
        processFrame,
        detectVideoFrame,
        resetTelemetry,
        realtimeTelemetry,
        getFinalTelemetry,
    };
}

export default useMediaPipeVision;
