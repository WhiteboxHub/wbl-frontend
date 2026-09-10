export interface MediaPipeTelemetry {
  faceDetected?: boolean;
  eyeContact?: boolean;
  lightingQuality?: string;
  headPose?: { pitch: number; yaw: number; roll: number };
  confidence?: number;
  face_box?: { x: number; y: number; width: number; height: number } | null;
  face_visibility_pct?: number;
  face_visible_pct?: number;
  is_instant_face_present?: boolean;
  sitting_position?: string;
  is_instant_straight?: boolean;
  is_instant_eyes_attentive?: boolean;
  screen_attention_pct?: number;
  eye_contact_pct?: number;
  [key: string]: any;
}

export function useMediaPipeVision() {
  const dummyTelemetry: MediaPipeTelemetry = {
    faceDetected: true,
    eyeContact: true,
    lightingQuality: 'good',
    confidence: 0.98,
    face_box: { x: 0.25, y: 0.2, width: 0.5, height: 0.6 },
    face_visibility_pct: 100,
    face_visible_pct: 100,
    is_instant_face_present: true,
    sitting_position: 'good',
    is_instant_straight: true,
    is_instant_eyes_attentive: true,
    screen_attention_pct: 95,
    eye_contact_pct: 95,
  };

  return {
    isReady: true,
    isLoading: false,
    error: null as string | null,
    detectVideoFrame: (_video?: HTMLVideoElement | null, _timestamp?: number): MediaPipeTelemetry | null => {
      return dummyTelemetry;
    },
    realtimeTelemetry: dummyTelemetry,
  };
}

export default useMediaPipeVision;
