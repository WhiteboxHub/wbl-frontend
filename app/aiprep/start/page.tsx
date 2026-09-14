"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Info,
  ChevronRight,
  ChevronLeft,
  Lock,
  User,
  Briefcase,
  Users,
  Code2,
  Building2,
  Server,
  Terminal,
  Heart,
  Mic,
  Video,
  Camera,
  Monitor,
  Wifi,
  Speaker,
  CheckCircle2,
  XCircle,
  Play,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";

// ─── Types ──────────────────────────────────────────────────────────────────

type MediaType = "VIDEO" | "AUDIO";

interface ConsentState {
  videoAnalytics: boolean;
  saveRecording: boolean;
  saveTranscript: boolean;
}

type ModalKey = "intro" | "videoAnalytics" | "saveRecording" | "saveTranscript" | null;

// ─── Step Indicator ──────────────────────────────────────────────────────────

const STEPS = [
  "Assessment Type",
  "Media & Consent",
  "Device Check",
  "Practice & Start",
  "Confirmation",
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                  done
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : active
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap ${
                  active ? "text-indigo-600 font-semibold" : done ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mb-5 mx-1 ${
                  i < current ? "bg-indigo-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-4 mt-0.5"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Assessment Type ─────────────────────────────────────────────────

const ASSESSMENT_TYPES = [
  {
    id: "INTRO",
    label: "Intro",
    subtitle: "Tell Me About Yourself",
    duration: "3-5 mins",
    icon: User,
    locked: false,
  },
  {
    id: "JD_WALKTHROUGH",
    label: "JD Walkthrough",
    subtitle: "Understand the Job & Fit",
    duration: "3-5 mins",
    icon: Briefcase,
    locked: true,
  },
  {
    id: "RECRUITER",
    label: "Recruiter",
    subtitle: "Recruiter Interview",
    duration: "~15 mins",
    icon: Users,
    locked: true,
  },
  {
    id: "TECHNICAL",
    label: "Technical",
    subtitle: "Technical Interview",
    duration: "~15 mins",
    icon: Code2,
    locked: true,
  },
  {
    id: "HIRING_MANAGER",
    label: "Hiring Manager",
    subtitle: "Role Fit & Experience",
    duration: "~15 mins",
    icon: Building2,
    locked: true,
  },
  {
    id: "SYSTEM_DESIGN",
    label: "System Design",
    subtitle: "Design a Scalable System",
    duration: "~15 mins",
    icon: Server,
    locked: true,
  },
  {
    id: "CODING",
    label: "Coding",
    subtitle: "Live Coding Assessment",
    duration: "~60 mins",
    icon: Terminal,
    locked: true,
  },
  {
    id: "HR",
    label: "HR",
    subtitle: "HR Interview",
    duration: "~15 mins",
    icon: Heart,
    locked: true,
  },
];

function Step1({
  selected,
  onSelect,
  onNext,
  router,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Choose Your Assessment Type</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Each assessment type is designed for a specific purpose. Select an assessment to
            continue, or click Info to understand what to expect.
          </p>
        </div>
        <button
          onClick={() => router.push("/aiprep")}
          className="text-sm text-indigo-600 hover:underline whitespace-nowrap ml-4"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {ASSESSMENT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;
          return (
            <div
              key={type.id}
              onClick={() => !type.locked && onSelect(type.id)}
              className={`relative bg-white rounded-2xl border-2 p-4 transition-all ${
                type.locked
                  ? "opacity-60 cursor-not-allowed border-gray-100"
                  : isSelected
                  ? "border-indigo-500 cursor-pointer shadow-md"
                  : "border-gray-100 cursor-pointer hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}

              {/* Lock badge */}
              {type.locked && (
                <span className="absolute top-3 right-3 bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock size={9} /> Coming Soon
                </span>
              )}

              <div className="bg-indigo-50 rounded-xl w-10 h-10 flex items-center justify-center mb-3">
                <Icon size={18} className="text-indigo-600" />
              </div>

              <p className="font-semibold text-gray-900 text-sm">{type.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{type.subtitle}</p>
              <p className="text-xs text-gray-400 mt-1">{type.duration}</p>

              {!type.locked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoOpen(true);
                  }}
                  className="mt-2 text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Info size={11} /> Info
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

      {/* Info Modal */}
      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Intro Assessment Details"
        subtitle="Tell Me About Yourself"
      >
        <p className="text-sm text-gray-600 mb-5">
          The Intro Assessment is a 3–5 minute AI-powered interview designed to help you craft
          a compelling, structured self-introduction. It simulates a real recruiter conversation
          so you can practice articulating your background, skills, and career story with
          confidence.
        </p>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-purple-800 mb-2">Purpose</p>
          <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
            <li>Build a clear, confident, and structured self-introduction</li>
            <li>Highlight your professional background and career journey</li>
            <li>Demonstrate your communication and storytelling skills</li>
            <li>Showcase your AI/ML knowledge and technical experience</li>
            <li>Set the right impression for future interviews</li>
          </ul>
        </div>

        <p className="text-sm font-semibold text-gray-800 mb-3">What to Cover</p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-700 mb-2">Background & Experience</p>
            <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
              <li>Your current role</li>
              <li>Past roles</li>
              <li>Career graph</li>
              <li>Education</li>
            </ul>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs font-bold text-green-700 mb-2">AI Engineering</p>
            <ul className="text-xs text-green-600 space-y-1 list-disc list-inside">
              <li>Agentic AI</li>
              <li>RAG/vector databases</li>
              <li>MCP/tool calling</li>
              <li>Prompting</li>
              <li>Evaluations</li>
              <li>Governance</li>
              <li>LangChain/LangGraph/ADK</li>
            </ul>
          </div>
          <div className="bg-orange-50 rounded-xl p-3">
            <p className="text-xs font-bold text-orange-700 mb-2">Software Engineering & More</p>
            <ul className="text-xs text-orange-600 space-y-1 list-disc list-inside">
              <li>Traditional SE experience</li>
              <li>Languages/frameworks</li>
              <li>System design exposure</li>
              <li>QA/data/DevOps/MLOps</li>
            </ul>
          </div>
        </div>

        <p className="text-sm font-semibold text-gray-800 mb-2">What to Expect</p>
        <div className="grid grid-cols-2 gap-2 mb-5 text-xs text-gray-600">
          <div className="bg-gray-50 rounded-lg p-2">⏱ Duration: 3–5 mins</div>
          <div className="bg-gray-50 rounded-lg p-2">🤖 Conversational AI interviewer</div>
          <div className="bg-gray-50 rounded-lg p-2">❓ Questions based on areas above</div>
          <div className="bg-gray-50 rounded-lg p-2">📊 Real-time feedback</div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">Example</p>
          <p className="text-xs text-gray-500 mb-2">Example Intro and Transcript</p>
          <a href="#" className="text-xs text-indigo-600 hover:underline">
            View Example Intro →
          </a>
        </div>
      </Modal>
    </div>
  );
}

// ─── Step 2: Media & Consent ─────────────────────────────────────────────────

function Step2({
  mediaType,
  consent,
  onMediaType,
  onConsent,
  onBack,
  onNext,
}: {
  mediaType: MediaType;
  consent: ConsentState;
  onMediaType: (m: MediaType) => void;
  onConsent: (key: keyof ConsentState, val: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [modal, setModal] = useState<ModalKey>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Media & Consent</h1>
      <p className="text-sm text-gray-500 mb-6">
        Choose how you&apos;d like to take the assessment and review the consent options below.
      </p>

      {/* Media type */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {(
          [
            {
              id: "AUDIO" as MediaType,
              label: "Audio Only",
              desc: "Voice-based interview. No camera required.",
              Icon: Mic,
            },
            {
              id: "VIDEO" as MediaType,
              label: "Video + Audio",
              desc: "Includes camera and voice. Recommended for a better experience.",
              Icon: Video,
            },
          ] as { id: MediaType; label: string; desc: string; Icon: React.ElementType }[]
        ).map(({ id, label, desc, Icon }) => (
          <button
            key={id}
            onClick={() => onMediaType(id)}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
              mediaType === id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                mediaType === id ? "bg-indigo-600" : "bg-gray-100"
              }`}
            >
              <Icon size={18} className={mediaType === id ? "text-white" : "text-gray-500"} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                mediaType === id ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
              }`}
            >
              {mediaType === id && (
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Consent */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 text-sm">Consent Options</p>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          We&apos;ll only use your data for assessment and feedback purposes. You can change these
          anytime in Settings.
        </p>

        {(
          [
            {
              key: "videoAnalytics" as keyof ConsentState,
              label: "Enable AI Video Analytics",
              desc: "Analyze face presence, identity verification, gaze, posture and engagement.",
              badge: "Recommended",
              modalKey: "videoAnalytics" as ModalKey,
            },
            {
              key: "saveRecording" as keyof ConsentState,
              label: "Save Interview Recording",
              desc: "Store the full video and audio recording for future review and feedback.",
              badge: null,
              modalKey: "saveRecording" as ModalKey,
            },
            {
              key: "saveTranscript" as keyof ConsentState,
              label: "Save Interview Transcript",
              desc: "Store the full transcript and AI evaluation results in your account.",
              badge: null,
              modalKey: "saveTranscript" as ModalKey,
            },
          ] as {
            key: keyof ConsentState;
            label: string;
            desc: string;
            badge: string | null;
            modalKey: ModalKey;
          }[]
        ).map(({ key, label, desc, badge, modalKey }) => (
          <div key={key} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
            <input
              type="checkbox"
              checked={consent[key]}
              onChange={(e) => onConsent(key, e.target.checked)}
              className="mt-0.5 accent-indigo-600 w-4 h-4 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-800">{label}</span>
                <button
                  onClick={() => setModal(modalKey)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Info size={13} />
                </button>
                {badge && (
                  <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-4 py-2"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Next: Device Check <ChevronRight size={16} />
        </button>
      </div>

      {/* Info Modals */}
      <Modal
        open={modal === "videoAnalytics"}
        onClose={() => setModal(null)}
        title="About AI Video Analytics"
      >
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold text-gray-800 mb-1">What it does</p>
            <p>
              Uses YOLO and MediaPipe to analyze your video feed in real time. It detects face
              presence, monitors eye contact, head pose, body posture, and overall engagement
              and attention levels during the interview.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">Why we use it</p>
            <p>
              To provide richer feedback on your interview presence, help you understand how
              you come across non-verbally, and give you actionable improvement tips alongside
              your verbal performance.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === "saveRecording"}
        onClose={() => setModal(null)}
        title="About Interview Recording"
      >
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold text-gray-800 mb-1">What we save</p>
            <p>
              The full video and audio recording of your assessment session. Recordings are
              encrypted at rest and are accessible only to you. They are used to provide
              playback for your own review and detailed feedback.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">Your control</p>
            <p>
              You can delete your recordings at any time from your account settings. We will
              never share your recordings with third parties.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === "saveTranscript"}
        onClose={() => setModal(null)}
        title="About Interview Transcript"
      >
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold text-gray-800 mb-1">What we save</p>
            <p>
              The complete Q&A transcript along with AI evaluation results. Transcripts are
              stored securely and used to track your progress, provide written feedback, and
              help you improve over time.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">Your control</p>
            <p>
              You can delete your transcripts at any time from your account settings. Transcripts
              are never shared with third parties.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Step 3: Device Check ────────────────────────────────────────────────────

function DeviceRow({
  label,
  passed,
}: {
  label: string;
  passed: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      {passed ? (
        <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
          <CheckCircle2 size={14} /> Passed
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-500 text-xs font-semibold">
          <XCircle size={14} /> Not found
        </span>
      )}
    </div>
  );
}

function Step3({
  mediaType,
  videoAnalytics,
  onBack,
  onNext,
}: {
  mediaType: MediaType;
  videoAnalytics: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const isVideo = mediaType === "VIDEO";

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isVideo ? "Check Your Devices" : "Check Your Audio Devices"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isVideo
              ? "Let's make sure your camera, microphone, and speaker are ready."
              : "Let's make sure your microphone and speaker are ready."}
          </p>
        </div>
        <a href="#" className="text-xs text-indigo-600 hover:underline whitespace-nowrap ml-4">
          Need help?
        </a>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Preview */}
        <div>
          <div className="bg-gray-100 rounded-2xl aspect-video flex flex-col items-center justify-center gap-2 mb-4">
            {isVideo ? (
              <>
                <Camera size={32} className="text-gray-400" />
                <span className="text-xs text-gray-400">Camera preview</span>
              </>
            ) : (
              <>
                <Mic size={32} className="text-gray-400" />
                <span className="text-xs text-gray-400">Audio only mode</span>
              </>
            )}
          </div>

          {/* Device selectors */}
          <div className="space-y-3">
            {isVideo && (
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-gray-400 flex-shrink-0" />
                <select className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700">
                  <option>FaceTime HD Camera (Built-in)</option>
                </select>
                <button className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                  Test
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Mic size={14} className="text-gray-400 flex-shrink-0" />
              <select className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700">
                <option>MacBook Pro Microphone (Built-in)</option>
              </select>
              <button className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                Test
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Speaker size={14} className="text-gray-400 flex-shrink-0" />
              <select className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700">
                <option>MacBook Pro Speakers (Built-in)</option>
              </select>
              <button className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                Test
              </button>
            </div>
          </div>
        </div>

        {/* Status panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Device Status
            </p>
            <DeviceRow label="Browser support" passed={true} />
            <DeviceRow label="Internet connection" passed={true} />
            <DeviceRow label="Camera" passed={isVideo} />
            <DeviceRow label="Microphone" passed={true} />
            <DeviceRow label="Speaker" passed={true} />
          </div>

          {videoAnalytics && isVideo && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Live Analytics
              </p>
              {[
                "Face detected",
                "Eyes on screen",
                "Good lighting",
                "Centered",
                "Head pose",
              ].map((item) => (
                <div key={item} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{item}</span>
                  <CheckCircle2 size={14} className="text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status message */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 mb-6">
        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-700 font-medium">
          All devices are working correctly! You&apos;re ready to continue.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-4 py-2"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Next: Confirmation <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Practice & Start ────────────────────────────────────────────────

function Step4({
  mediaType,
  onBack,
  onNext,
}: {
  mediaType: MediaType;
  onBack: () => void;
  onNext: () => void;
}) {
  const isVideo = mediaType === "VIDEO";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {isVideo
          ? "Try a short test assessment (Video)"
          : "Try a short practice assessment (Audio Only)"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Record a short practice clip to confirm your setup is working correctly before starting
        the real assessment.
      </p>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left: recording area */}
        <div>
          <div className="bg-gray-900 rounded-2xl aspect-video flex flex-col items-center justify-center gap-3 mb-3 relative overflow-hidden">
            {isVideo ? (
              <Camera size={36} className="text-gray-500" />
            ) : (
              <Mic size={36} className="text-gray-500" />
            )}
            <span className="text-xs text-gray-500">
              {isVideo ? "Preview" : "Audio Only Mode"}
            </span>
            <span className="absolute top-3 left-3 bg-gray-700/80 text-gray-200 text-[10px] px-2 py-0.5 rounded-full">
              {isVideo ? "Preview" : "Audio Only Mode"}
            </span>
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors mb-4">
            <Play size={16} />
            Start Recording
          </button>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-2 font-medium">Play back your recording</p>
            <div className="flex items-center gap-2">
              <button className="text-gray-500 hover:text-gray-700">
                <Play size={14} />
              </button>
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div className="bg-indigo-600 h-1.5 rounded-full w-0" />
              </div>
              <span className="text-xs text-gray-400 tabular-nums">00:00 / 00:30</span>
            </div>
          </div>

          <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              {isVideo ? "Video and audio look good!" : "Audio looks good!"}
            </p>
          </div>

          <p className="text-[11px] text-gray-400 mt-2 text-center">
            This is just a test. Your recording will not be saved.
          </p>
        </div>

        {/* Right: sample question & tips */}
        <div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                Sample Question
              </span>
            </div>
            <p className="text-sm font-medium text-gray-800">
              Tell us about a time you solved a challenging problem.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Tips for a great recording</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                Find a quiet place with good lighting
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                Look directly at the camera, not the screen
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                Speak clearly and at a moderate pace
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                Keep your face centered in the frame
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                Take a breath before answering — you have time
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-4 py-2"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onNext}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-4 py-2"
          >
            <SkipForward size={14} /> Skip Practice
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Start Assessment <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Confirmation ────────────────────────────────────────────────────

function Step5({
  assessmentType,
  mediaType,
  consent,
  onBack,
  onStart,
  starting,
}: {
  assessmentType: string;
  mediaType: MediaType;
  consent: ConsentState;
  onBack: () => void;
  onStart: () => void;
  starting: boolean;
}) {
  const typeLabel =
    ASSESSMENT_TYPES.find((t) => t.id === assessmentType)?.label ?? assessmentType;

  const rows = [
    { label: "Assessment Type", value: typeLabel },
    { label: "Mode", value: mediaType === "VIDEO" ? "Video + Audio" : "Audio Only" },
    {
      label: "AI Video Analytics",
      value: consent.videoAnalytics ? "Enabled" : "Disabled",
    },
    {
      label: "Save Recording",
      value: consent.saveRecording ? "Yes" : "No",
    },
    {
      label: "Save Transcript",
      value: consent.saveTranscript ? "Yes" : "No",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Ready to Start?</h1>
      <p className="text-sm text-gray-500 mb-6">
        Review your selections below, then start your assessment.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 max-w-lg">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Your Selections
        </p>
        <div className="space-y-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-lg">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Before you begin:</span> Make sure you&apos;re in a
          quiet space with good lighting. The AI interviewer will guide you through the
          assessment. You can pause but not restart once it begins.
        </p>
      </div>

      <div className="flex justify-between max-w-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-4 py-2"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={onStart}
          disabled={starting}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {starting ? "Starting…" : "Start Assessment"}
          {!starting && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AIPrepStartPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [assessmentType, setAssessmentType] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("VIDEO");
  const [consent, setConsent] = useState<ConsentState>({
    videoAnalytics: true,
    saveRecording: true,
    saveTranscript: true,
  });
  const [starting, setStarting] = useState(false);

  function handleConsent(key: keyof ConsentState, val: boolean) {
    setConsent((prev) => ({ ...prev, [key]: val }));
  }

  async function handleStart() {
    if (!assessmentType) return;
    setStarting(true);
    try {
      const res = await aiPrepApi.createAssessment(assessmentType, mediaType);
      router.push(`/aiprep/session/${res.assessment_uuid}`);
    } catch (err) {
      console.error("Failed to create assessment", err);
      setStarting(false);
    }
  }

  return (
    <div className="p-8">
      <StepBar current={step} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-5xl mx-auto">
        {step === 0 && (
          <Step1
            selected={assessmentType}
            onSelect={setAssessmentType}
            onNext={() => setStep(1)}
            router={router}
          />
        )}
        {step === 1 && (
          <Step2
            mediaType={mediaType}
            consent={consent}
            onMediaType={setMediaType}
            onConsent={handleConsent}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step3
            mediaType={mediaType}
            videoAnalytics={consent.videoAnalytics}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step4
            mediaType={mediaType}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Step5
            assessmentType={assessmentType ?? "INTRO"}
            mediaType={mediaType}
            consent={consent}
            onBack={() => setStep(3)}
            onStart={handleStart}
            starting={starting}
          />
        )}
      </div>
    </div>
  );
}
