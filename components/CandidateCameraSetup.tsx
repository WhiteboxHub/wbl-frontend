"use client";

import { useEffect, useRef, useState } from "react";

interface CandidateCameraSetupProps {
  onSuccess: () => void;
}

export default function CandidateCameraSetup({ onSuccess }: CandidateCameraSetupProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null); // hidden source
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // visible preview
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const faceDetectorRef = useRef<any | null>(null);

  const [status, setStatus] = useState<"idle" | "preview" | "checking" | "success" | "failed">("idle");
  const [message, setMessage] = useState("Adjust your face inside the frame and click Validate Camera.");
  const [failureReason, setFailureReason] = useState<"permission" | "device" | "noface" | "unknown" | null>(null);

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    faceDetectorRef.current = null;
  };

  const startPreview = async () => {
    setFailureReason(null);
    setMessage("Starting camera...");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("failed");
        setFailureReason("unknown");
        setMessage("Camera API is not supported. Use a modern browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      // keep video hidden visually; it still feeds the canvas
      v.playsInline = true;
      v.muted = true;
      await v.play();

      // try to init FaceDetector if available
      if ("FaceDetector" in window) {
        try {
          faceDetectorRef.current = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        } catch {
          faceDetectorRef.current = null;
        }
      } else {
        faceDetectorRef.current = null;
      }

      setStatus("preview");
      setMessage("Camera active. Position your face inside the frame.");
      requestAnimationFrame(drawLoop);
    } catch (err: any) {
      console.error(err);
      cleanup();
      setStatus("failed");
      let reason: typeof failureReason = "unknown";
      let msg = "Camera access denied or not available. Please allow camera access.";
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          reason = "permission";
          msg = "Camera permission denied. Allow camera access in your browser.";
        } else if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
          reason = "device";
          msg = "No camera found. Connect a webcam and try again.";
        }
      }
      setFailureReason(reason);
      setMessage(msg);
    }
  };

  const drawLoop = async () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    // size canvas to video while maintaining crispness
    const vw = v.videoWidth || 640;
    const vh = v.videoHeight || 480;
    if (c.width !== vw || c.height !== vh) {
      c.width = vw;
      c.height = vh;
      c.style.width = `${vw}px`;
      c.style.height = `${vh}px`;
    }

    const ctx = c.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(v, 0, 0, c.width, c.height);

    // draw guide / detection
    if (faceDetectorRef.current) {
      try {
        const faces = await faceDetectorRef.current.detect(c);
        if (faces?.length) {
          const f = faces[0].boundingBox;
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 3;
          ctx.strokeRect(f.x, f.y, f.width, f.height);
        }
      } catch {
        // ignore detection errors
      }
    } else {
      // draw a translucent center guide rectangle
      const boxW = c.width * 0.5;
      const boxH = c.height * 0.6;
      const boxX = (c.width - boxW) / 2;
      const boxY = (c.height - boxH) / 2;
      ctx.strokeStyle = "rgba(34,197,94,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);
    }

    rafRef.current = requestAnimationFrame(drawLoop);
  };

  const validateCamera = async () => {
    setStatus("checking");
    setMessage("Validating camera — looking for a face...");
    try {
      if (!streamRef.current) {
        await startPreview();
      }

      if (faceDetectorRef.current) {
        const start = performance.now();
        let found = false;
        while (performance.now() - start < 3000) {
          try {
            const c = canvasRef.current!;
            const faces = await faceDetectorRef.current.detect(c);
            if (faces?.length) {
              found = true;
              break;
            }
          } catch {
            // ignore
          }
          await new Promise((r) => setTimeout(r, 150));
        }

        if (found) {
          setStatus("success");
          setMessage("Face detected. Camera validated.");
          setFailureReason(null);
          cleanup();
          onSuccess();
          return;
        } else {
          setStatus("failed");
          setFailureReason("noface");
          setMessage("No face detected. Center your face and try again.");
          return;
        }
      }

      // fallback: if stream playing and canvas has pixels, consider success
      const v = videoRef.current!;
      if (v && v.readyState >= 2 && v.videoWidth > 0) {
        setStatus("success");
        setMessage("Camera is active. (Face detection unavailable in this browser.)");
        setFailureReason(null);
        cleanup();
        onSuccess();
        return;
      }

      setStatus("failed");
      setFailureReason("unknown");
      setMessage("Camera is active but could not validate; try again or use another browser.");
    } catch (err) {
      console.error(err);
      setStatus("failed");
      setFailureReason("unknown");
      setMessage("Camera validation failed. Check console for details.");
    }
  };

  return (
    <div className="w-full min-h-[520px] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl border p-8 w-[900px]">
        <h1 className="text-2xl font-bold text-center">📷 Camera Setup</h1>
        <p className="text-center text-gray-500 mt-2">Before starting your AI interview, please adjust your camera.</p>

        <div className="mt-6 flex justify-center">
          <div style={{ width: 560 }} className="rounded-lg overflow-hidden border bg-gray-50 flex justify-center items-center">
            {/* Hidden video: used as the stream source only */}
            <video ref={videoRef} style={{ display: "none" }} playsInline muted />

            {/* Visible canvas: only one visible preview */}
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button onClick={startPreview} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded">Start Camera</button>
          <button onClick={validateCamera} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">Validate Camera</button>
          <button onClick={() => { cleanup(); setStatus("idle"); setMessage("Adjust your face inside the frame and click Validate Camera."); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded">Stop</button>
        </div>

        <div className="mt-6 text-center">
          {status === "checking" && <p className="text-gray-600">{message}</p>}
          {status === "preview" && <p className="text-gray-600">{message}</p>}
          {status === "success" && <p className="text-green-600 font-semibold">{message}</p>}
          {status === "failed" && (
            <div>
              <p className="text-red-600 font-semibold">
                {failureReason === "permission" ? "❌ Camera Permission Denied" : failureReason === "device" ? "❌ Camera Not Found" : failureReason === "noface" ? "❌ No Face Detected" : "❌ Camera Error"}
              </p>
              <p className="mt-2 text-gray-600">{message}</p>
              <p className="mt-2 text-sm text-gray-500">Tip: allow camera access or try another browser (Chrome/Edge recommended).</p>
            </div>
          )}
          {status === "idle" && <p className="text-gray-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}