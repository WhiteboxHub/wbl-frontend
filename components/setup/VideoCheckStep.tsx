import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, VideoOff, CheckCircle2, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { useMediaStream } from "../../hooks/useMediaStream";

export default function VideoCheckStep({ onNext, onRetry }: { onNext: () => void, onRetry?: () => void }) {
  const { videoState, requestVideo, cameraPermission, stream, stopMedia } = useMediaStream(true);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  useEffect(() => {
    if (videoRef.current && stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const videoStream = new MediaStream([videoTrack]);
        videoRef.current.srcObject = videoStream;
      }
    }
  }, [stream]);

  const handleConfirm = () => {
    setHasConfirmed(true);
    setTimeout(() => {
      onNext();
    }, 1500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Video Check</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Verify your camera is positioned correctly.</p>
        </div>
      </div>

      <div className="relative max-w-md mx-auto w-full aspect-video bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center shadow-inner">
        {cameraPermission === "requesting" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <span className="text-xs text-gray-400">Requesting camera access...</span>
          </div>
        )}

        {videoState === "denied" && (
          <div className="flex flex-col items-center gap-2 text-orange-400">
            <VideoOff className="w-6 h-6" />
            <span className="text-xs">Camera access denied.</span>
            <button onClick={() => { onRetry?.(); requestVideo(); }} className="flex items-center gap-2 px-3 py-1.5 mt-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-xs font-medium transition-colors border border-gray-600">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${videoState === "granted" ? "opacity-100" : "opacity-0"}`} />

        {videoState === "granted" && !hasConfirmed && <div className="absolute inset-0 border-2 border-blue-400/50 rounded-xl pointer-events-none animate-pulse" />}

        <AnimatePresence>
          {hasConfirmed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </motion.div>
              <p className="text-green-400 text-sm font-semibold">Camera verified!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
        <motion.button
          whileHover={videoState === "granted" && !hasConfirmed ? { scale: 1.02 } : {}}
          whileTap={videoState === "granted" && !hasConfirmed ? { scale: 0.98 } : {}}
          onClick={handleConfirm}
          disabled={videoState !== "granted" || hasConfirmed}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          I Can See Myself <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
