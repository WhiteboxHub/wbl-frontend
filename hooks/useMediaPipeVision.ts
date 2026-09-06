/**
 * Client-Side MediaPipe Vision Telemetry Hook (Browser Side) - Production Version
 * Integrates MediaPipe Face Landmarker & MediaPipe Pose Landmarker.
 *
 * Capabilities:
 * 1. MediaPipe Face Landmarker: 478 face mesh landmarks + 52 facial blendshapes for face visibility,
 *    eye gaze contact ratio, screen attention, and stress level detection.
 * 2. MediaPipe Pose Landmarker: Upper-body shoulder alignment tracking for real-time posture check and sitting position.
 * 3. RobustTensionTracker: Biometric rolling-window stress engine with spectacles & low-res camera resilience.
 * 4. Real-time UI metrics: face bounding box, is_instant_straight, sitting_position, and stress_level.
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
    face_visibility_pct: number;
    eye_contact_pct: number;
    screen_attention_pct: number;
    distraction_level_pct: number;
    stress_level: 'Normal' | 'Tensed';
    sitting_position?: string;
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

export interface TensionFrameSample {
    timestampMs: number;
    isBlink: boolean;
    browDown: number;
    lipPress: number;
    jitter: number;
    eyeConfidence: number;
    glareFlag: boolean;
    lowResFlag: boolean;
}

export interface StressEvent {
    startTimeSec: number;
    endTimeSec: number;
    durationSec: number;
    peakTensionPct: number;
}

export interface TensionSummaryReport {
    currentTensionPct: number;
    currentLabel: 'Normal' | 'Slightly Tensed' | 'Tensed';
    totalInterviewDurationSec: number;
    totalStressedDurationSec: number;
    stressTimePercentage: number;
    peakTensionPct: number;
    detectedSpectaclesLikelihood: boolean;
    detectedLowResolutionCamera: boolean;
    stressEvents: StressEvent[];
}

export class RobustTensionTracker {
    private readonly windowDurationMs: number = 30 * 1000;
    private readonly rollingSamples: TensionFrameSample[] = [];

    private rollingBlinkCount = 0;
    private rollingBrowDownSum = 0;
    private rollingLipPressSum = 0;
    private rollingJitterSum = 0;
    private rollingEyeConfidenceSum = 0;
    private rollingGlareCount = 0;
    private rollingLowResCount = 0;

    private smoothedNosePos: { x: number; y: number } | null = null;
    private wasBlinkingLastFrame = false;
    private startTimestampMs: number | null = null;

    private readonly eyeHistoryLen = 10;
    private leftBlinkHistory: number[] = [];
    private rightBlinkHistory: number[] = [];

    private sessionGlareFrames = 0;
    private sessionLowResFrames = 0;

    private baseline = {
        blinkRatePerMin: 18.0,
        avgBrowDown: 0.12,
        avgLipPress: 0.10,
        avgJitter: 0.003,
        isWarmedUp: false,
    };
    private readonly warmupFrames = 150;
    private frameCount = 0;

    private stressEvents: StressEvent[] = [];
    private currentActiveEvent: { startTimeSec: number; peakTension: number } | null = null;
    private peakTensionRecorded = 0;

    private totalStressedTimeMs = 0;
    private lastProcessedTimestampMs: number | null = null;

    public reset() {
        this.rollingSamples.length = 0;
        this.rollingBlinkCount = 0;
        this.rollingBrowDownSum = 0;
        this.rollingLipPressSum = 0;
        this.rollingJitterSum = 0;
        this.rollingEyeConfidenceSum = 0;
        this.rollingGlareCount = 0;
        this.rollingLowResCount = 0;
        this.smoothedNosePos = null;
        this.wasBlinkingLastFrame = false;
        this.startTimestampMs = null;
        this.leftBlinkHistory.length = 0;
        this.rightBlinkHistory.length = 0;
        this.sessionGlareFrames = 0;
        this.sessionLowResFrames = 0;
        this.baseline = {
            blinkRatePerMin: 18.0,
            avgBrowDown: 0.12,
            avgLipPress: 0.10,
            avgJitter: 0.003,
            isWarmedUp: false,
        };
        this.frameCount = 0;
        this.stressEvents = [];
        this.currentActiveEvent = null;
        this.peakTensionRecorded = 0;
        this.totalStressedTimeMs = 0;
        this.lastProcessedTimestampMs = null;
    }

    public processFrame(
        landmarks: LandmarkPoint[] | undefined,
        categories: BlendshapeCategory[] | undefined,
        timestampMs: number = Date.now()
    ): { tensionPct: number; label: 'Normal' | 'Slightly Tensed' | 'Tensed' } | null {
        if (!landmarks || landmarks.length === 0 || !categories || categories.length === 0) {
            return null;
        }

        if (!this.startTimestampMs) {
            this.startTimestampMs = timestampMs;
        }
        this.frameCount++;

        const getScore = (name: string) => categories.find((c) => c.categoryName === name)?.score ?? 0;

        const blendBlinkL = getScore('eyeBlinkLeft');
        const blendBlinkR = getScore('eyeBlinkRight');

        this.leftBlinkHistory.push(blendBlinkL);
        this.rightBlinkHistory.push(blendBlinkR);
        if (this.leftBlinkHistory.length > this.eyeHistoryLen) this.leftBlinkHistory.shift();
        if (this.rightBlinkHistory.length > this.eyeHistoryLen) this.rightBlinkHistory.shift();

        let earL = 0.25;
        let earR = 0.25;
        if (landmarks[159] && landmarks[145] && landmarks[33] && landmarks[133]) {
            const eyeH = Math.abs(landmarks[159].y - landmarks[145].y);
            const eyeW = Math.abs(landmarks[133].x - landmarks[33].x);
            earL = eyeH / Math.max(0.001, eyeW);
        }
        if (landmarks[386] && landmarks[374] && landmarks[362] && landmarks[263]) {
            const eyeH = Math.abs(landmarks[386].y - landmarks[374].y);
            const eyeW = Math.abs(landmarks[263].x - landmarks[362].x);
            earR = eyeH / Math.max(0.001, eyeW);
        }

        const glareDetected = Math.abs(blendBlinkL - blendBlinkR) > 0.45;
        const isLeftClosed = blendBlinkL > 0.55 || earL < 0.14;
        const isRightClosed = blendBlinkR > 0.55 || earR < 0.14;

        let isBlinkingNow: boolean;
        if (glareDetected) {
            const leftVolatility = this.volatility(this.leftBlinkHistory);
            const rightVolatility = this.volatility(this.rightBlinkHistory);

            if (leftVolatility > rightVolatility) {
                isBlinkingNow = isRightClosed;
            } else if (rightVolatility > leftVolatility) {
                isBlinkingNow = isLeftClosed;
            } else {
                isBlinkingNow = isLeftClosed && isRightClosed;
            }
        } else {
            isBlinkingNow = isLeftClosed && isRightClosed;
        }

        const isNewBlink = isBlinkingNow && !this.wasBlinkingLastFrame;
        this.wasBlinkingLastFrame = isBlinkingNow;

        const eyeConfidence = glareDetected ? 0.5 : 1.0;

        const rawNose = landmarks[1];
        let jitter = 0;
        let lowResFlagThisFrame = false;

        if (rawNose) {
            if (!this.smoothedNosePos) {
                this.smoothedNosePos = { x: rawNose.x, y: rawNose.y };
            } else {
                const smoothAlpha = 0.3;
                const smoothedX = (1 - smoothAlpha) * this.smoothedNosePos.x + smoothAlpha * rawNose.x;
                const smoothedY = (1 - smoothAlpha) * this.smoothedNosePos.y + smoothAlpha * rawNose.y;

                const rawDelta = Math.hypot(smoothedX - this.smoothedNosePos.x, smoothedY - this.smoothedNosePos.y);

                const SENSOR_NOISE_DEADBAND = 0.0028;
                if (rawDelta > SENSOR_NOISE_DEADBAND) {
                    jitter = rawDelta - SENSOR_NOISE_DEADBAND;
                } else {
                    jitter = 0;
                }

                if (rawDelta > 0.0015 && rawDelta < SENSOR_NOISE_DEADBAND) {
                    lowResFlagThisFrame = true;
                }

                this.smoothedNosePos = { x: smoothedX, y: smoothedY };
            }
        }

        const browDown = (getScore('browDownLeft') + getScore('browDownRight')) / 2;
        const lipPress = (getScore('mouthPressLeft') + getScore('mouthPressRight')) / 2;

        if (glareDetected) this.sessionGlareFrames++;
        if (lowResFlagThisFrame) this.sessionLowResFrames++;

        const newSample: TensionFrameSample = {
            timestampMs,
            isBlink: isNewBlink,
            browDown,
            lipPress,
            jitter,
            eyeConfidence,
            glareFlag: glareDetected,
            lowResFlag: lowResFlagThisFrame,
        };

        this.rollingSamples.push(newSample);
        if (isNewBlink) this.rollingBlinkCount++;
        this.rollingBrowDownSum += browDown;
        this.rollingLipPressSum += lipPress;
        this.rollingJitterSum += jitter;
        this.rollingEyeConfidenceSum += eyeConfidence;
        if (glareDetected) this.rollingGlareCount++;
        if (lowResFlagThisFrame) this.rollingLowResCount++;

        const cutoffTime = timestampMs - this.windowDurationMs;
        while (this.rollingSamples.length > 0 && this.rollingSamples[0].timestampMs < cutoffTime) {
            const evicted = this.rollingSamples.shift()!;
            if (evicted.isBlink) this.rollingBlinkCount--;
            this.rollingBrowDownSum -= evicted.browDown;
            this.rollingLipPressSum -= evicted.lipPress;
            this.rollingJitterSum -= evicted.jitter;
            this.rollingEyeConfidenceSum -= evicted.eyeConfidence;
            if (evicted.glareFlag) this.rollingGlareCount--;
            if (evicted.lowResFlag) this.rollingLowResCount--;
        }

        this.rollingBrowDownSum = Math.max(0, this.rollingBrowDownSum);
        this.rollingLipPressSum = Math.max(0, this.rollingLipPressSum);
        this.rollingJitterSum = Math.max(0, this.rollingJitterSum);
        this.rollingBlinkCount = Math.max(0, this.rollingBlinkCount);
        this.rollingGlareCount = Math.max(0, this.rollingGlareCount);
        this.rollingLowResCount = Math.max(0, this.rollingLowResCount);

        const windowCount = Math.max(1, this.rollingSamples.length);
        const windowDurationMin = Math.max(0.08, (timestampMs - this.rollingSamples[0].timestampMs) / 60000);

        const currentBlinkRate = this.rollingBlinkCount / windowDurationMin;
        const currentBrowDown = this.rollingBrowDownSum / windowCount;
        const currentLipPress = this.rollingLipPressSum / windowCount;
        const currentJitter = this.rollingJitterSum / windowCount;
        const avgEyeConfidence = this.rollingEyeConfidenceSum / windowCount;

        if (this.frameCount >= this.warmupFrames) {
            this.baseline.isWarmedUp = true;
        }
        if (!this.baseline.isWarmedUp) {
            this.lastProcessedTimestampMs = timestampMs;
            return null;
        }

        const b = this.baseline;
        const wBlink = 0.40 * avgEyeConfidence;
        const wBrow = 0.30 + (0.40 - wBlink) * 0.5;
        const wLip = 0.20 + (0.40 - wBlink) * 0.5;
        const wJitter = 0.10;

        const blinkDev = this.clamp01((currentBlinkRate - b.blinkRatePerMin) / Math.max(6, b.blinkRatePerMin));
        const browDev = this.clamp01((currentBrowDown - b.avgBrowDown) / Math.max(0.08, b.avgBrowDown + 0.05));
        const lipDev = this.clamp01((currentLipPress - b.avgLipPress) / Math.max(0.08, b.avgLipPress + 0.05));
        const jitterDev = this.clamp01((currentJitter - b.avgJitter) / Math.max(0.004, b.avgJitter + 0.002));

        const tensionIndex = (blinkDev * wBlink) + (browDev * wBrow) + (lipDev * wLip) + (jitterDev * wJitter);
        const tensionPct = Number((tensionIndex * 100).toFixed(1));

        let label: 'Normal' | 'Slightly Tensed' | 'Tensed';
        if (tensionPct < 28) label = 'Normal';
        else if (tensionPct < 55) label = 'Slightly Tensed';
        else label = 'Tensed';

        if (label !== 'Tensed') {
            const alpha = 0.0005;
            this.baseline.blinkRatePerMin = (1 - alpha) * this.baseline.blinkRatePerMin + alpha * currentBlinkRate;
            this.baseline.avgBrowDown = (1 - alpha) * this.baseline.avgBrowDown + alpha * currentBrowDown;
            this.baseline.avgLipPress = (1 - alpha) * this.baseline.avgLipPress + alpha * currentLipPress;
            this.baseline.avgJitter = (1 - alpha) * this.baseline.avgJitter + alpha * currentJitter;
        }

        if (tensionPct > this.peakTensionRecorded) {
            this.peakTensionRecorded = tensionPct;
        }

        const elapsedSec = Math.floor((timestampMs - this.startTimestampMs) / 1000);

        if (this.lastProcessedTimestampMs !== null) {
            const frameDeltaMs = timestampMs - this.lastProcessedTimestampMs;
            if (label === 'Tensed' && frameDeltaMs > 0 && frameDeltaMs < 5000) {
                this.totalStressedTimeMs += frameDeltaMs;
            }
        }
        this.lastProcessedTimestampMs = timestampMs;

        if (label === 'Tensed') {
            if (!this.currentActiveEvent) {
                this.currentActiveEvent = { startTimeSec: elapsedSec, peakTension: tensionPct };
            } else if (tensionPct > this.currentActiveEvent.peakTension) {
                this.currentActiveEvent.peakTension = tensionPct;
            }
        } else {
            if (this.currentActiveEvent) {
                const duration = elapsedSec - this.currentActiveEvent.startTimeSec;
                if (duration >= 3) {
                    this.stressEvents.push({
                        startTimeSec: this.currentActiveEvent.startTimeSec,
                        endTimeSec: elapsedSec,
                        durationSec: duration,
                        peakTensionPct: this.currentActiveEvent.peakTension,
                    });
                }
                this.currentActiveEvent = null;
            }
        }

        return { tensionPct, label };
    }

    public getFinalSummary(): TensionSummaryReport {
        const totalDurationSec = this.startTimestampMs
            ? Math.max(1, Math.floor((Date.now() - this.startTimestampMs) / 1000))
            : 1;

        if (this.currentActiveEvent) {
            this.stressEvents.push({
                startTimeSec: this.currentActiveEvent.startTimeSec,
                endTimeSec: totalDurationSec,
                durationSec: totalDurationSec - this.currentActiveEvent.startTimeSec,
                peakTensionPct: this.currentActiveEvent.peakTension,
            });
            this.currentActiveEvent = null;
        }

        const totalStressedSec = Math.min(totalDurationSec, Math.round(this.totalStressedTimeMs / 1000));
        const stressTimePercentage = Number(((totalStressedSec / totalDurationSec) * 100).toFixed(1));

        const detectedSpectaclesLikelihood =
            this.frameCount > 0 && this.sessionGlareFrames / this.frameCount > 0.05;
        const detectedLowResolutionCamera =
            this.frameCount > 0 && this.sessionLowResFrames / this.frameCount > 0.05;

        return {
            currentTensionPct: this.peakTensionRecorded,
            currentLabel: stressTimePercentage >= 20.0 ? 'Tensed' : 'Normal',
            totalInterviewDurationSec: totalDurationSec,
            totalStressedDurationSec: totalStressedSec,
            stressTimePercentage,
            peakTensionPct: this.peakTensionRecorded,
            detectedSpectaclesLikelihood,
            detectedLowResolutionCamera,
            stressEvents: this.stressEvents,
        };
    }

    private clamp01(v: number): number {
        return Math.max(0, Math.min(1, v));
    }

    private volatility(history: number[]): number {
        if (history.length < 3) return 0;
        const mean = history.reduce((sum, v) => sum + v, 0) / history.length;
        const variance = history.reduce((sum, v) => sum + (v - mean) ** 2, 0) / history.length;
        return Math.sqrt(variance);
    }
}

export const MIN_LANDMARKS_WITH_IRIS = 478;

interface TelemetryAccumulator {
    totalFrames: number;
    faceVisibleFrames: number;
    eyeContactFrames: number;
    screenAttentionFrames: number;
    distractionFrames: number;
    trackingLostFrames: number;
    postureScoreSum: number;
}

export function useMediaPipeVision(videoRef?: RefObject<HTMLVideoElement | null>) {
    const [isReady, setIsReady] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [realtimeTelemetry, setRealtimeTelemetry] = useState<Partial<VideoTelemetry>>({});

    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const tensionTrackerRef = useRef<RobustTensionTracker>(new RobustTensionTracker());
    const lastVideoTimestampRef = useRef<number>(0);

    const accumulatorRef = useRef<TelemetryAccumulator>({
        totalFrames: 0,
        faceVisibleFrames: 0,
        eyeContactFrames: 0,
        screenAttentionFrames: 0,
        distractionFrames: 0,
        trackingLostFrames: 0,
        postureScoreSum: 0,
    });

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

                // Helper to load models with specified delegate
                const loadModels = async (delegate: 'GPU' | 'CPU') => {
                    const face = await FaceLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath:
                                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                            delegate,
                        },
                        runningMode: 'VIDEO',
                        numFaces: 1,
                        outputFaceBlendshapes: true,
                    });

                    const pose = await PoseLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath:
                                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                            delegate,
                        },
                        runningMode: 'VIDEO',
                        numPoses: 1,
                    });

                    return { face, pose };
                };

                let models: { face: FaceLandmarker; pose: PoseLandmarker } | null = null;
                try {
                    // Primary attempt: GPU acceleration
                    models = await loadModels('GPU');
                } catch (gpuErr) {
                    console.warn('MediaPipe GPU acceleration unavailable, retrying with CPU delegate:', gpuErr);
                    try {
                        // Secondary fallback: WebAssembly CPU execution
                        models = await loadModels('CPU');
                    } catch (cpuErr) {
                        console.error('MediaPipe CPU delegate initialization also failed:', cpuErr);
                    }
                }

                if (isMounted && models) {
                    faceLandmarkerRef.current = models.face;
                    poseLandmarkerRef.current = models.pose;
                    setIsReady(true);
                } else if (isMounted) {
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
            trackingLostFrames: 0,
            postureScoreSum: 0,
        };
        lastVideoTimestampRef.current = 0;
        tensionTrackerRef.current.reset();
        setRealtimeTelemetry({});
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
                acc.trackingLostFrames += 1;
                return;
            }

            // 1. Face Visibility, Bounding Box & Frame Centering Analysis
            acc.faceVisibleFrames += 1;
            const landmarks = faceLandmarks[0];
            const hasIrisLandmarks = landmarks.length >= MIN_LANDMARKS_WITH_IRIS;

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

            // Centering check: nose x between 0.15 and 0.85, y between 0.10 and 0.85
            const isCentered = nose ? (nose.x >= 0.15 && nose.x <= 0.85 && nose.y >= 0.10 && nose.y <= 0.85) : false;

            // Pupil and eye corners landmarks (Face Landmarker Iris / Eye mesh)
            const leftPupil = landmarks[468];
            const leftInner = landmarks[133];
            const leftOuter = landmarks[33];

            const rightPupil = landmarks[473];
            const rightInner = landmarks[362];
            const rightOuter = landmarks[263];

            // -------------------------------------------------------------------------
            // STEP A: HEAD ROTATION / ORIENTATION (Yaw, Pitch, Roll)
            // -------------------------------------------------------------------------
            let isHeadFacingScreen = true;
            if (nose && chin && forehead && leftCheek && rightCheek && leftOuter && rightOuter) {
                // Yaw check (Left / Right head turn)
                const leftDist = Math.abs(nose.x - leftCheek.x);
                const rightDist = Math.abs(rightCheek.x - nose.x);
                const yawRatio = leftDist / Math.max(0.0001, leftDist + rightDist);
                const isYawStraight = yawRatio >= 0.32 && yawRatio <= 0.68;

                // Pitch check (Up / Down head tilt) - upper bound relaxed to 0.84 to tolerate jaw-drops while speaking
                const upperHeight = Math.abs(nose.y - forehead.y);
                const lowerHeight = Math.abs(chin.y - nose.y);
                const pitchRatio = lowerHeight / Math.max(0.0001, upperHeight + lowerHeight);
                const isPitchStraight = pitchRatio >= 0.36 && pitchRatio <= 0.84;

                // Roll check (Sideways head tilt)
                const eyeTilt = Math.abs(leftOuter.y - rightOuter.y);
                const isRollLevel = eyeTilt <= 0.08;

                isHeadFacingScreen = isYawStraight && isPitchStraight && isRollLevel;
            }
            const isFaceStraight = isHeadFacingScreen;

            // -------------------------------------------------------------------------
            // STEP B & C: EYE CONTACT & SCREEN ATTENTION (SPECTACLES & GLARE-ROBUST)
            // -------------------------------------------------------------------------
            let hasDirectEyeContact = false;
            let areEyesOnScreen = false;

            if (hasIrisLandmarks && leftPupil && rightPupil && leftInner && rightInner && leftOuter && rightOuter) {
                const leftRatio = calculateEyeGazeRatio(leftPupil, leftInner, leftOuter);
                const rightRatio = calculateEyeGazeRatio(rightPupil, rightInner, rightOuter);

                // Strict gaze centering for direct eye contact (looking directly into camera/top bezel)
                const isLeftGazeCentered = leftRatio >= 0.35 && leftRatio <= 0.65;
                const isRightGazeCentered = rightRatio >= 0.35 && rightRatio <= 0.65;

                // Wider screen gaze zone (looking at interview content, questions, slides across screen)
                const isLeftOnScreen = leftRatio >= 0.20 && leftRatio <= 0.80;
                const isRightOnScreen = rightRatio >= 0.20 && rightRatio <= 0.80;

                // Detect single-lens spectacle reflection glare (one eye pupil tracker distorts/drifts while other stays stable)
                const hasGlareAsymmetry = Math.abs(leftRatio - rightRatio) > 0.25;

                if (isLeftGazeCentered && isRightGazeCentered) {
                    // Case 1: Both eyes clear and looking directly at camera
                    hasDirectEyeContact = isCentered && isHeadFacingScreen;
                    areEyesOnScreen = true;
                } else if (hasGlareAsymmetry && (isLeftGazeCentered || isRightGazeCentered) && isHeadFacingScreen) {
                    // Case 2: Spectacles Glare Fallback - Trust non-glare eye when head orientation is directly forward
                    hasDirectEyeContact = isCentered;
                    areEyesOnScreen = true;
                } else {
                    // Case 3: Eyes reading screen or viewing UI
                    areEyesOnScreen = (isLeftOnScreen && isRightOnScreen) || (hasGlareAsymmetry && (isLeftOnScreen || isRightOnScreen));
                }
            } else {
                // Fallback when iris mesh is missing, occluded, or washed out by reflection glare
                // If head is upright and directly facing screen, candidate is focused on the display
                if (isHeadFacingScreen && isCentered) {
                    areEyesOnScreen = true;
                    hasDirectEyeContact = true;
                }
            }

            // Direct eye contact: looking directly towards camera with straight head
            if (hasDirectEyeContact) {
                acc.eyeContactFrames += 1;
            }

            // Screen attention: candidate is attentive if looking at camera OR reading screen while facing it
            const isAttentiveToScreen = isCentered && (hasDirectEyeContact || (isHeadFacingScreen && areEyesOnScreen));

            if (isAttentiveToScreen) {
                acc.screenAttentionFrames += 1;
            } else {
                acc.distractionFrames += 1;
            }

            // 3. Biometric Tension & Stress Tracking
            let liveStressStatus: 'Normal' | 'Tensed' = 'Normal';
            if (landmarks && blendshapes && blendshapes.length > 0) {
                const stressRes = tensionTrackerRef.current.processFrame(
                    landmarks,
                    blendshapes[0].categories,
                    Date.now()
                );
                if (stressRes) {
                    liveStressStatus = stressRes.label === 'Tensed' ? 'Tensed' : 'Normal';
                }
            }

            // 4. Posture Alignment Check (Upper-Body Shoulder Alignment)
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
                const faceVis = Number(((acc.faceVisibleFrames / total) * 100).toFixed(1));

                setRealtimeTelemetry({
                    is_video_mode: true,
                    face_visibility_pct: faceVis,
                    eye_contact_pct: Number(((acc.eyeContactFrames / total) * 100).toFixed(1)),
                    screen_attention_pct: Number(((acc.screenAttentionFrames / total) * 100).toFixed(1)),
                    distraction_level_pct: Number((100 - (acc.screenAttentionFrames / total) * 100).toFixed(1)),
                    stress_level: liveStressStatus,
                    sitting_position: currentInstantStraight ? 'Upright Centered' : 'Slouched / Offset',
                    is_instant_straight: currentInstantStraight,
                    face_box: currentFaceBox,
                });
            }
        },
        [calculateEyeGazeRatio]
    );

    /**
     * Processes a video element frame directly using MediaPipe Face Landmarker & Pose Landmarker
     */
    const detectVideoFrame = useCallback(
        (videoElement: HTMLVideoElement, timestamp: number) => {
            if (!videoElement || videoElement.readyState < 2) return;

            // Enforce strictly monotonically increasing timestamps for MediaPipe WASM runtime
            const safeTimestamp = Math.max(timestamp, lastVideoTimestampRef.current + 1);
            lastVideoTimestampRef.current = safeTimestamp;

            let faceLandmarks: LandmarkPoint[][] | undefined;
            let blendshapes: BlendshapeResult[] | undefined;
            let poseLandmarks: LandmarkPoint[][] | undefined;

            // Run MediaPipe Face Landmarker
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
                } catch (_) { }
            }

            // Run MediaPipe Pose Landmarker
            if (poseLandmarkerRef.current) {
                try {
                    const poseRes = poseLandmarkerRef.current.detectForVideo(videoElement, safeTimestamp);
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

        const face_visibility_pct = Number(((acc.faceVisibleFrames / total) * 100).toFixed(1));
        const eye_contact_pct = Number(((acc.eyeContactFrames / total) * 100).toFixed(1));
        const screen_attention_pct = Number(((acc.screenAttentionFrames / total) * 100).toFixed(1));
        const distraction_level_pct = Number((100 - screen_attention_pct).toFixed(1));

        // Evaluate overall interview stress from the tension tracker
        const summary = tensionTrackerRef.current.getFinalSummary();
        const stress_level: 'Normal' | 'Tensed' = summary.stressTimePercentage >= 20.0 ? 'Tensed' : 'Normal';

        return {
            is_video_mode: true,
            face_visibility_pct,
            eye_contact_pct,
            screen_attention_pct,
            distraction_level_pct,
            stress_level,
        };
    }, []);

    /**
     * Helper to retrieve only face visibility percentage at any time
     */
    const getFaceVisibilityPercentage = useCallback((): number => {
        const acc = accumulatorRef.current;
        const total = Math.max(1, acc.totalFrames);
        return Number(((acc.faceVisibleFrames / total) * 100).toFixed(1));
    }, []);

    /**
     * Helper to retrieve only eye contact percentage at any time
     */
    const getEyeContactPercentage = useCallback((): number => {
        const acc = accumulatorRef.current;
        const total = Math.max(1, acc.totalFrames);
        return Number(((acc.eyeContactFrames / total) * 100).toFixed(1));
    }, []);

    return {
        isReady,
        setIsReady,
        isTracking,
        setIsTracking,
        processFrame,
        detectVideoFrame,
        resetTelemetry,
        resetFaceVisibilityAccumulator: resetTelemetry,
        getFaceVisibilityPercentage,
        getEyeContactPercentage,
        realtimeTelemetry,
        getFinalTelemetry,
    };
}

export default useMediaPipeVision;
