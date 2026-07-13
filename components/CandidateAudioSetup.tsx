"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface CandidateAudioSetupProps {
  onSuccess: () => void;
}

type Status = "idle" | "recording" | "success" | "failed";
type FailureReason = "permission" | "no_voice" | "device" | "unknown" | null;

const AUDIO_TEST_SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "Bright morning sunlight fills the quiet interview room.",
  "Clear speech helps the system understand every answer.",
  "A confident voice makes the conversation smooth and natural.",
  "The prepared candidate speaks clearly during the interview.",
];

const AUDIO_TEST_SECONDS = 9;

export default function CandidateAudioSetup({ onSuccess }: CandidateAudioSetupProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState("Please speak the sentence clearly while recording.");
  const [audioLevel, setAudioLevel] = useState(0);
  const [failureReason, setFailureReason] = useState<FailureReason>(null);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const intervalRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingRef = useRef(false);

  const cleanupAudio = () => {
    recordingRef.current = false;

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  const resetAudio = () => {
    cleanupAudio();
    setStatus("idle");
    setCountdown(0);
    setAudioLevel(0);
    setFailureReason(null);
    setTranscript("");
    setInterimTranscript("");
    setMessage("Please speak the sentence clearly while recording.");
  };

  const startSpeechRecognition = () => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setMessage("Live speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return null;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript.trim();

        if (result.isFinal) {
          finalText += `${finalText ? " " : ""}${text}`;
        } else {
          interim += `${interim ? " " : ""}${text}`;
        }
      }

      if (finalText) {
        setTranscript((prev) => `${prev ? `${prev} ` : ""}${finalText}`.trim());
      }
      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event: any) => {
      if (event.error && event.error !== "no-speech") {
        setMessage(`Speech recognition issue: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (recordingRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
    }

    return recognition;
  };

  const startAudioTest = async () => {
    resetAudio();

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("failed");
      setFailureReason("unknown");
      setMessage("Your browser does not support microphone access.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      recordingRef.current = true;

      setStatus("recording");
      setCountdown(0);
      setMessage("Listening... please speak the sentence clearly.");
      startSpeechRecognition();

      const AudioContextClass =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("AudioContext is not supported.");
      }

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const startTime = Date.now();

      let noiseSamples: number[] = [];
      let speechFrames = 0;
      let speechFrameStreak = 0;
      let maxVolume = 0;
      let finalSpeechThreshold = 12;

      intervalRef.current = window.setInterval(() => {
        setCountdown((current) => Math.min(current + 1, AUDIO_TEST_SECONDS));
      }, 1000);

      const getVolume = () => {
        analyser.getByteTimeDomainData(dataArray);

        const rms = Math.sqrt(
          dataArray.reduce((sum, value) => {
            const normalized = value / 128 - 1;
            return sum + normalized * normalized;
          }, 0) / dataArray.length
        );

        return rms * 100;
      };

      const checkVoice = () => {
        const elapsed = Date.now() - startTime;
        const volume = getVolume();

        maxVolume = Math.max(maxVolume, volume);
        setAudioLevel(volume);

        if (elapsed < 1000) {
          noiseSamples.push(volume);
          frameRef.current = requestAnimationFrame(checkVoice);
          return;
        }

        const noiseFloor =
          noiseSamples.length > 0
            ? noiseSamples.reduce((sum, value) => sum + value, 0) / noiseSamples.length
            : 0;

        const speechThreshold = Math.max(4, noiseFloor + 2.5);
        finalSpeechThreshold = speechThreshold;

        if (volume >= speechThreshold) {
          speechFrames += 1;
          speechFrameStreak += 1;
        } else {
          speechFrameStreak = 0;
        }

        if (elapsed < AUDIO_TEST_SECONDS * 1000) {
          frameRef.current = requestAnimationFrame(checkVoice);
          return;
        }

        setCountdown(AUDIO_TEST_SECONDS);
        cleanupAudio();

        if (speechFrames >= 3 && maxVolume >= finalSpeechThreshold) {
          setStatus("success");
          setFailureReason(null);
          setMessage("Voice detected. Microphone is working.");
        } else {
          setStatus("failed");
          setFailureReason("no_voice");
          setMessage("No voice was detected. Please speak clearly into the microphone and try again.");
        }
      };

      frameRef.current = requestAnimationFrame(checkVoice);
    } catch (error) {
      console.error(error);
      cleanupAudio();

      let reason: FailureReason = "unknown";
      let errorMessage = "Microphone access denied or not available. Please allow audio access.";

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          reason = "permission";
          errorMessage = "Microphone permission denied. Please allow access in browser settings.";
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          reason = "device";
          errorMessage = "No microphone was found. Please connect a microphone and try again.";
        }
      }

      setStatus("failed");
      setFailureReason(reason);
      setMessage(errorMessage);
    }
  };

  const handleTryAgain = () => {
    setSentenceIndex((current) => (current + 1) % AUDIO_TEST_SENTENCES.length);
    startAudioTest();
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-2 py-1 sm:px-3 sm:py-2">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.24)] sm:p-4">
        <h1 className="text-center text-xl font-bold text-gray-900 sm:text-2xl">Audio Setup</h1>

        <p className="mt-2 text-center text-xs text-gray-500 sm:text-sm">
          Please test your microphone and speak clearly.
        </p>

        <div className="mt-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800">Please read this sentence clearly</h3>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-900">
            “{AUDIO_TEST_SENTENCES[sentenceIndex]}”
          </p>
        </div>

        <div className="mt-4 flex flex-col items-center">
          <button
            onClick={handleTryAgain}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            {status === "recording" ? "Recording..." : "Start Recording"}
          </button>

          <div className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">Live Recognition</p>
              {status === "recording" && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-600">Listening</span>
              )}
            </div>

            <div className="mt-2 min-h-[72px] rounded-lg border border-gray-200 bg-white p-2 text-xs leading-5 text-gray-800 shadow-inner">
              {status === "recording" ? (
                <>
                  <p>{transcript || interimTranscript || "Speak now and your words will appear here."}</p>
                  {interimTranscript && (
                    <p className="mt-1 text-[11px] text-gray-500">{interimTranscript}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Your spoken sentence will appear here once recording starts.</p>
              )}
            </div>
          </div>
        </div>

        {status === "recording" && (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-center text-sm font-bold text-red-600">Recording...</h2>
            </div>

            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-3 bg-green-500 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(5, (audioLevel / 60) * 100))}%`,
                }}
              />
            </div>

            <p className="mt-3 text-center text-sm text-gray-700">{message}</p>
            <p className="mt-1 text-center text-xs text-gray-500">Time Elapsed: {countdown} / {AUDIO_TEST_SECONDS} sec</p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-4 text-center">
            <h2 className="text-lg font-bold text-green-600">Voice Detected</h2>
            <p className="mt-2 text-sm text-gray-700">Microphone working and your words were recognized.</p>
            <p className="mt-1 text-xs text-gray-600">Recognized text: {transcript || interimTranscript}</p>
            <button
              onClick={onSuccess}
              className="mt-4 rounded-xl bg-green-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Continue
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="mt-4 text-center">
            <h2 className="text-lg font-bold text-red-600">
              {failureReason === "permission"
                ? "Microphone Permission Denied"
                : failureReason === "device"
                  ? "Microphone Not Found"
                  : "No Voice Detected"}
            </h2>

            <p className="mt-2 text-sm text-red-600">{message}</p>

            <button
              onClick={startAudioTest}
              className="mt-4 rounded-xl bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}