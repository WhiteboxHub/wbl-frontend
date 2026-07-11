import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, CheckCircle2, AlertCircle, Volume2, RotateCcw, Loader2, Headphones, Waves, Play, Pause, Check } from "lucide-react";
import { useMediaStream } from "../../hooks/useMediaStream";
import { toast } from "sonner";

export default function AudioCheckStep({ onNext }: { onNext: () => void, onRetry?: () => void }) {
  const { audioState, requestAudio, micPermission, stopMedia, stream, audioError } = useMediaStream(false);
  const [state, setState] = useState<"idle" | "recording" | "playback" | "failed">("idle");
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Visualizer Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      stopMedia();
    };
  }, [stopMedia]);

  const startRecording = () => {
    if (!stream) {
      toast.error("Microphone stream not active. Please enable microphone access.");
      return;
    }
    chunksRef.current = [];
    setAudioUrl(null);
    setState("recording");
    setRecordingProgress(0);

    try {
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Stop visualizer animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("playback");

        // Auto play back
        const audio = new Audio(url);
        audioRef.current = audio;
        setIsPlaying(true);
        audio.play().catch(() => setIsPlaying(false));
        audio.onended = () => setIsPlaying(false);
      };

      recorder.start();

      // Setup Web Audio API Analyser for Rainbow Equalizer Visualizer
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 128; // Generates 64 frequency bars
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = audioContext;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const drawWaveform = () => {
          if (!canvasRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          animationFrameRef.current = requestAnimationFrame(drawWaveform);
          analyser.getByteFrequencyData(dataArray);

          // Clear Canvas
          ctx.fillStyle = "rgba(249, 250, 251, 1)"; // Light gray background match
          if (document.documentElement.classList.contains("dark")) {
            ctx.fillStyle = "rgba(17, 24, 39, 1)"; // Dark gray background match
          }
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const gap = 2;
          const barWidth = (canvas.width / bufferLength) - gap;
          
          for (let i = 0; i < bufferLength; i++) {
            // Normalize frequency value (0-255)
            const percent = dataArray[i] / 255.0;
            
            // Limit minimum height to 3px so it looks alive even in silence
            const barHeight = Math.max(percent * canvas.height * 0.95, 3);

            // Rainbow HSL color scheme matching the screenshot
            const hue = (i / bufferLength) * 280;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

            const x = i * (canvas.width / bufferLength);
            const y = canvas.height - barHeight;

            // Draw vertical bar
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        };

        // Delay animation loop slightly to verify canvas is fully rendered in DOM
        setTimeout(() => {
          drawWaveform();
        }, 50);
      } catch (vizErr) {
        console.warn("Could not start visualizer:", vizErr);
      }

      // 4 Seconds Timer
      let elapsed = 0;
      const duration = 4000; 
      const interval = 100;
      intervalRef.current = setInterval(() => {
        elapsed += interval;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setRecordingProgress(progress);

        if (elapsed >= duration) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          recorder.stop();
        }
      }, interval);
    } catch (err: any) {
      console.error("Recording error:", err);
      toast.error("Failed to start recording: " + err.message);
      setState("failed");
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleSuccess = () => {
    stopMedia();
    onNext();
  };

  const handleRetry = () => {
    setState("idle");
    setAudioUrl(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
          <Headphones className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Audio Check</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Verify your microphone is working</p>
        </div>
      </div>

      {micPermission !== "granted" ? (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-5">
          <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
            <Mic className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Microphone Access Required</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
              Please click the button below and grant Chrome permission to access your microphone.
            </p>
          </div>

          <button
            onClick={requestAudio}
            disabled={micPermission === "requesting"}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {micPermission === "requesting" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Requesting Chrome Access...
              </>
            ) : (
              "Enable Microphone"
            )}
          </button>

          {audioError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-100 text-red-600 text-[10px]">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {audioError}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">Read This Aloud</span>
            </div>
            <p className="text-xl font-bold text-blue-800 dark:text-blue-400">"Testing my microphone for the upcoming interview."</p>
          </div>

          <div className="flex flex-col items-center gap-4 py-4">
            <AnimatePresence mode="wait">
              {state === "idle" && (
                <motion.div key="idle" className="flex flex-col items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-blue-700 shadow-md flex items-center justify-center transition-all"
                  >
                    <Mic className="w-6 h-6 text-white" />
                  </motion.button>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">Click mic to record a 4-second clip</p>
                </motion.div>
              )}

              {state === "recording" && (
                <motion.div key="recording" className="flex flex-col items-center gap-4 w-full max-w-xs">
                  <div className="relative w-16 h-16 rounded-full bg-red-600 border-2 border-red-700 shadow-md flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-red-500"
                      animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <Waves className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-red-500 font-medium animate-pulse">Recording... Speak now!</p>
                  
                  {/* Waveform Canvas */}
                  <canvas 
                    ref={canvasRef} 
                    width={320} 
                    height={80} 
                    className="w-full h-20 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-inner"
                  />

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                </motion.div>
              )}

              {state === "playback" && (
                <motion.div key="playback" className="flex flex-col items-center gap-6 w-full">
                  <div className="flex items-center gap-4">
                    {/* Play/Pause Button */}
                    <button
                      onClick={handlePlayPause}
                      className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>

                    {/* Retry Button */}
                    <button
                      onClick={handleRetry}
                      className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Did you hear your voice playback clearly?</p>
                    <p className="text-xs text-gray-500">If yes, confirm below to proceed to Video Check.</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      No, Record Again
                    </button>
                    <button
                      onClick={handleSuccess}
                      className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Check className="w-4 h-4" /> Yes, It Works!
                    </button>
                  </div>
                </motion.div>
              )}

              {state === "failed" && (
                <motion.div key="failed" className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleRetry}
                    className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 flex items-center justify-center transition-all"
                  >
                    <RotateCcw className="w-6 h-6 text-orange-500" />
                  </button>
                  <p className="text-sm text-orange-500 font-medium">Recording failed. Try again.</p>
                  <button
                    onClick={onNext}
                    className="mt-2 px-4 py-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Force Skip (Hardware Issue)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  );
}
