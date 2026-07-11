/**
 * useMediaStream — Production-grade media device hook
 */

import { useState, useEffect, useRef, useCallback } from "react";

export type PermissionState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

let _audioStreamCache: MediaStream | null = null;
let _videoStreamCache: MediaStream | null = null;
let _audioRequestInFlight: Promise<MediaStream | null> | null = null;
let _videoRequestInFlight: Promise<MediaStream | null> | null = null;

async function acquireMicStream(): Promise<MediaStream | null> {
  if (_audioStreamCache && _audioStreamCache.getAudioTracks().some(t => t.readyState === "live")) {
    return _audioStreamCache;
  }
  if (_audioRequestInFlight) return _audioRequestInFlight;

  const runAudioRequest = async (): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
        },
      });
    } catch (firstErr: any) {
      if (
        firstErr?.name === "NotFoundError" ||
        firstErr?.name === "OverconstrainedError" ||
        firstErr?.name === "NotReadableError"
      ) {
        await new Promise(r => setTimeout(r, 300));
        return navigator.mediaDevices.getUserMedia({ audio: true });
      }
      throw firstErr;
    }
  };

  _audioRequestInFlight = runAudioRequest()
    .then((stream) => {
      _audioStreamCache = stream;
      return stream;
    })
    .catch((err) => {
      _audioStreamCache = null;
      throw err;
    })
    .finally(() => {
      _audioRequestInFlight = null;
    });

  return _audioRequestInFlight;
}

async function acquireCameraStream(): Promise<MediaStream | null> {
  if (_videoStreamCache && _videoStreamCache.getVideoTracks().some(t => t.readyState === "live")) {
    return _videoStreamCache;
  }
  if (_videoRequestInFlight) return _videoRequestInFlight;

  const runVideoRequest = async (): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: "user" },
        },
      });
    } catch (firstErr: any) {
      if (
        firstErr?.name === "NotFoundError" ||
        firstErr?.name === "OverconstrainedError" ||
        firstErr?.name === "NotReadableError"
      ) {
        await new Promise(r => setTimeout(r, 300));
        return navigator.mediaDevices.getUserMedia({ video: true });
      }
      throw firstErr;
    }
  };

  _videoRequestInFlight = runVideoRequest()
    .then((stream) => {
      _videoStreamCache = stream;
      return stream;
    })
    .catch((err) => {
      _videoStreamCache = null;
      throw err;
    })
    .finally(() => {
      _videoRequestInFlight = null;
    });

  return _videoRequestInFlight;
}

function classifyError(err: any): { state: "denied" | "unavailable"; message: string } {
  if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
    return { state: "denied", message: "Access denied by browser or OS settings." };
  }
  if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
    return { state: "unavailable", message: "Device not found." };
  }
  return { state: "unavailable", message: `Device error: ${err?.message || err?.name || "Unknown error"}` };
}

export function useMediaStream(requestOnMount = true) {
  const mountedRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [micPermission, setMicPermission] = useState<PermissionState>("idle");
  const [cameraPermission, setCameraPermission] = useState<PermissionState>("idle");
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [videoError, setVideoError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioState = micPermission === "granted" ? "granted" : micPermission === "denied" || micPermission === "unavailable" ? "denied" : "prompt";
  const videoState = cameraPermission === "granted" ? "granted" : cameraPermission === "denied" || cameraPermission === "unavailable" ? "denied" : "prompt";

  const rebuildStream = useCallback(() => {
    const tracks: MediaStreamTrack[] = [];
    if (_audioStreamCache) tracks.push(..._audioStreamCache.getAudioTracks().filter(t => t.readyState === "live"));
    if (_videoStreamCache) tracks.push(..._videoStreamCache.getVideoTracks().filter(t => t.readyState === "live"));
    if (tracks.length > 0) {
      const combined = new MediaStream(tracks);
      streamRef.current = combined;
      setStream(combined);
    } else {
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const requestAudio = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) return;
    setMicPermission("requesting");
    setAudioError("");
    try {
      await acquireMicStream();
      if (!mountedRef.current) return;
      setMicPermission("granted");
      setMicEnabled(true);
      rebuildStream();
    } catch (err: any) {
      if (!mountedRef.current) return;
      const { state, message } = classifyError(err);
      setMicPermission(state);
      setAudioError(message);
    }
  }, [rebuildStream]);

  const requestVideo = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) return;
    setCameraPermission("requesting");
    setVideoError("");
    try {
      await acquireCameraStream();
      if (!mountedRef.current) return;
      setCameraPermission("granted");
      setCameraEnabled(true);
      rebuildStream();
    } catch (err: any) {
      if (!mountedRef.current) return;
      const { state, message } = classifyError(err);
      setCameraPermission(state);
      setVideoError(message);
    }
  }, [rebuildStream]);

  const requestMedia = useCallback(async () => {
    await Promise.allSettled([requestAudio(), requestVideo()]);
  }, [requestAudio, requestVideo]);

  useEffect(() => {
    mountedRef.current = true;
    if (requestOnMount) requestMedia();
    return () => { mountedRef.current = false; };
  }, [requestOnMount, requestMedia]);

  const stopMedia = useCallback(() => {
    if (_audioStreamCache) {
      _audioStreamCache.getTracks().forEach(t => t.stop());
      _audioStreamCache = null;
    }
    if (_videoStreamCache) {
      _videoStreamCache.getTracks().forEach(t => t.stop());
      _videoStreamCache = null;
    }
    streamRef.current = null;
    setStream(null);
    setMicEnabled(false);
    setCameraEnabled(false);
    setIsSpeaking(false);
  }, []);

  const toggleAudio = useCallback((enabled: boolean) => {
    if (_audioStreamCache) _audioStreamCache.getAudioTracks().forEach(t => { t.enabled = enabled; });
    if (streamRef.current) streamRef.current.getAudioTracks().forEach(t => { t.enabled = enabled; });
    setMicEnabled(enabled);
    if (!enabled) setIsSpeaking(false);
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    if (_videoStreamCache) _videoStreamCache.getVideoTracks().forEach(t => { t.enabled = enabled; });
    if (streamRef.current) streamRef.current.getVideoTracks().forEach(t => { t.enabled = enabled; });
    setCameraEnabled(enabled);
  }, []);

  return {
    stream,
    micPermission, cameraPermission, micEnabled, cameraEnabled,
    audioError, videoError, isSpeaking,
    audioState, videoState,
    requestMedia, requestAudio, requestVideo, stopMedia, toggleAudio, toggleVideo,
  };
}
