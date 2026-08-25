'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { VideoPreview } from '@/components/aiprep/VideoPreview';
import { RecordingControls } from '@/components/aiprep/RecordingControls';
import { ChunkedUploader } from '@/components/aiprep/ChunkedUploader';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { useChunkUploadQueue } from '@/hooks/useChunkUploadQueue';
import type { AssessmentType, AssessmentMode } from '@/lib/aiprep-api';
import {
  IconCamera,
  IconMicrophone,
  IconRefresh,
  IconSparkles,
  IconShieldCheck,
  IconTerminal2,
} from '@tabler/icons-react';

/**
 * AIPrep Interview Simulation & Calibration Studio (FE2 Production Engine)
 * Professional candidate-facing preview for media capture, chunk streaming, and telemetry verification.
 */
export default function AIPrepInterviewStudio() {
  const { data: session } = useSession();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('TECHNICAL');
  const [mode, setMode] = useState<AssessmentMode>('VIDEO_AUDIO');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Dynamically resolve logged-in user's first name
  const candidateName =
    session?.user?.name?.split(' ')[0] ||
    (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}')?.first_name : null) ||
    'Candidate';

  const chunksBufferRef = useRef<Blob[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogMessages(prev => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // Request Camera & Mic permissions
  const initMedia = async (selectedMode: AssessmentMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setPermissionError(null);
      addLog(`Initializing ${selectedMode === 'VIDEO_AUDIO' ? 'Video & Audio' : 'Audio Only'} stream...`);

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: selectedMode === 'VIDEO_AUDIO' ? { width: 1280, height: 720 } : false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      addLog(`Hardware synchronized: ${mediaStream.getTracks().map(t => t.kind).join(', ')} active.`);
    } catch (err: any) {
      const errorMsg = err?.message || 'Unable to access camera or microphone. Please check browser permissions.';
      setPermissionError(errorMsg);
      addLog(`Device error: ${errorMsg}`);
    }
  };

  useEffect(() => {
    initMedia(mode);
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Hook 1: Upload Queue Manager
  const { state: uploadState, enqueueChunk, retryFailedChunks, resetQueue } =
    useChunkUploadQueue({
      assessmentId: 999,
      onError: (err) => addLog(`Sync notification: ${err.message}`),
    });

  // Hook 2: MediaRecorder Engine (Configured for 10s chunks during testing for rapid feedback)
  const {
    recordingState,
    elapsedSeconds,
    chunkCount,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useMediaRecorder({
    stream,
    mode,
    chunkDurationMs: 30000, // 30s intervals per Contract 2
    onChunkReady: (chunkBlob, chunkNumber) => {
      addLog(`Secured 30s media slice #${chunkNumber + 1} (${Math.round(chunkBlob.size / 1024)} KB)`);
      chunksBufferRef.current.push(chunkBlob);
      enqueueChunk(chunkBlob, chunkNumber);
    },
    onError: (err) => addLog(`Recorder Error: ${err.message}`),
    onDeviceDisconnected: () => addLog('Alert: Hardware audio/video input disconnected.'),
  });

  const handleStart = () => {
    setRecordedBlob(null);
    chunksBufferRef.current = [];
    resetQueue();
    startRecording();
    addLog('Interview response recording started.');
  };

  const handleStop = async () => {
    addLog('Finalizing response and compiling media buffer...');
    const totalChunks = await stopRecording();
    addLog(`Response finalized (${totalChunks} secure media chunks processed).`);

    if (chunksBufferRef.current.length > 0) {
      const fullBlob = new Blob(chunksBufferRef.current, {
        type: mode === 'AUDIO_ONLY' ? 'audio/webm' : 'video/webm',
      });
      setRecordedBlob(fullBlob);
      addLog(`Answer playback generated (${Math.round(fullBlob.size / 1024)} KB).`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0b0f19] text-gray-900 dark:text-white pt-28 sm:pt-32 pb-16 px-4 sm:px-6 flex flex-col items-center transition-colors">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Professional Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200 dark:border-[#333756] gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary">
              <IconSparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>AI Interview Practice Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-indigo-500 to-purple-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
              Interview Simulation & Device Calibration
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-body-color">
              Verify your camera framing, audio clarity, and interview recording settings in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => initMedia(mode)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#1D2144] hover:bg-gray-100 dark:hover:bg-[#1D2144]/80 border border-gray-200 dark:border-[#333756] rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-sm transition-all active:scale-95"
            >
              <IconRefresh className="w-4 h-4 text-primary" />
              <span>Recalibrate Devices</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="p-5 bg-white dark:bg-[#1D2144] rounded-2xl border border-gray-200 dark:border-[#333756] shadow-md grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">
              Target Interview Track
            </label>
            <select
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
              disabled={recordingState !== 'inactive'}
              className="w-full bg-gray-50 dark:bg-[#121723] border border-gray-200 dark:border-[#333756] rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="TECHNICAL">Technical Round (Pause Allowed)</option>
              <option value="GENERAL_INTRO">Elevator Pitch / General Intro (Continuous Flow)</option>
              <option value="JOB_DESCRIPTION_INTRO">Role Alignment Intro (Continuous Flow)</option>
              <option value="SYSTEM_DESIGN">System Design & Architecture (Pause Allowed)</option>
              <option value="RECRUITER">Recruiter Screening (Pause Allowed)</option>
              <option value="HIRING_MANAGER">Hiring Manager Round (Pause Allowed)</option>
              <option value="HR">Behavioral & Leadership (Pause Allowed)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider block mb-1.5">
              Interview Format
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('VIDEO_AUDIO')}
                disabled={recordingState !== 'inactive'}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  mode === 'VIDEO_AUDIO'
                    ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:text-white'
                    : 'bg-gray-50 dark:bg-[#121723] border-gray-200 dark:border-[#333756] text-gray-600 dark:text-gray-400'
                }`}
              >
                <IconCamera className="w-4 h-4" />
                <span>Video + Audio</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('AUDIO_ONLY')}
                disabled={recordingState !== 'inactive'}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  mode === 'AUDIO_ONLY'
                    ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:text-white'
                    : 'bg-gray-50 dark:bg-[#121723] border-gray-200 dark:border-[#333756] text-gray-600 dark:text-gray-400'
                }`}
              >
                <IconMicrophone className="w-4 h-4" />
                <span>Audio Only</span>
              </button>
            </div>
          </div>
        </div>

        {permissionError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <IconShieldCheck className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{permissionError}</span>
          </div>
        )}

        {/* Live Camera Feed & Playback Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span>Live Video Feed</span>
            </h3>
            <VideoPreview
              stream={stream}
              isAudioOnly={mode === 'AUDIO_ONLY'}
              candidateName={candidateName}
            />
          </div>

          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span>Answer Playback & Review</span>
            </h3>
            <VideoPreview
              playbackBlob={recordedBlob}
              isAudioOnly={mode === 'AUDIO_ONLY'}
              candidateName={candidateName}
            />
          </div>
        </div>

        {/* Recording Controls & Uploader Bar */}
        <div className="flex flex-col items-center justify-center gap-4 pt-2">
          <RecordingControls
            assessmentType={assessmentType}
            recordingState={recordingState}
            elapsedSeconds={elapsedSeconds}
            maxSeconds={90}
            onStart={handleStart}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onStop={handleStop}
            disabled={!stream}
          />

          <ChunkedUploader
            uploadState={uploadState}
            onRetryFailed={retryFailedChunks}
          />
        </div>

        {/* Diagnostics Toggle Bar */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowDiagnostics(prev => !prev)}
            className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors mx-auto"
          >
            <IconTerminal2 className="w-4 h-4" />
            <span>{showDiagnostics ? 'Hide Sync Diagnostics' : 'View Sync & Telemetry Logs'}</span>
          </button>
        </div>

        {/* Telemetry Log Window (Collapsible) */}
        {showDiagnostics && (
          <div className="p-5 bg-white dark:bg-[#1D2144] border border-gray-200 dark:border-[#333756] rounded-2xl space-y-2.5 shadow-md transition-all">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1.5">
                <IconTerminal2 className="w-3.5 h-3.5 text-primary" />
                <span>Media Stream & Chunk Telemetry</span>
              </span>
              <span className="font-mono text-primary font-bold">Chunks Streamed: {chunkCount}</span>
            </div>

            <div className="h-32 overflow-y-auto font-mono text-xs text-gray-800 dark:text-gray-200 space-y-1 bg-gray-50 dark:bg-[#121723] p-3.5 rounded-xl border border-gray-200 dark:border-[#333756]/80">
              {logMessages.length === 0 ? (
                <span className="text-gray-400 dark:text-gray-500">Telemetry logs will stream here during response recording...</span>
              ) : (
                logMessages.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">{log}</div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
