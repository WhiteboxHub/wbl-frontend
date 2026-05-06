"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import { getUserTeamRole } from "@/utils/auth";
import {
  Play, Save, Trash2, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Send, Plus,
  FileCode2, Clock, Terminal, TestTube2, Share2, History,
  Loader2, AlertCircle, CheckCircle2, XCircle, Code2, Settings,
  ShieldAlert, ShieldCheck, Shield, EyeOff, Eye,
  MonitorOff, LayoutPanelLeft, AlertTriangle,
  FolderOpen, FilePlus, FolderPlus,
  Lock, Search, X, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { createPortal } from "react-dom";

// Dynamically import components to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/** Clipboard events from Monaco’s root — used to block copy/paste of code only (not test inputs / modals). */
function isClipboardTargetMonacoEditor(e: Event): boolean {
  const t = e.target;
  if (!t || typeof (t as Node).nodeType !== "number") return false;
  const el = t instanceof Element ? t : (t as Node).parentElement;
  return !!el?.closest?.(".monaco-editor");
}

/** Employee "Add/Update problem statement" modal — copy/paste is normal; do not score as exam violations. */
function isCoderpadStaffAuthoringField(target: EventTarget | null): boolean {
  if (!target || typeof (target as Node).nodeType !== "number") return false;
  const el = target instanceof Element ? target : (target as Node).parentElement;
  return !!el?.closest?.(".assignment-modal");
}

function isSelectionInCoderpadStaffAuthoring(): boolean {
  if (typeof window === "undefined") return false;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const node = sel.anchorNode;
  if (!node) return false;
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  return !!el?.closest?.(".assignment-modal");
}

let lastCoderpadClipboardToastAt = 0;
function toastCoderpadClipboardDenied(message: string) {
  const t = Date.now();
  if (t - lastCoderpadClipboardToastAt < 600) return;
  lastCoderpadClipboardToastAt = t;
  toast.error(message);
}

/** Default snippet / workspace title (replaces generic "Untitled") */
const DEFAULT_SNIPPET_TITLE = "White-box learning";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    null
  );
}

function getLoggedInUsername(): string {
  const token = getToken();
  if (!token) return "User";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const rawName =
      payload?.sub ||
      payload?.username ||
      payload?.uname ||
      payload?.email ||
      "User";
    return String(rawName).trim() || "User";
  } catch {
    return "User";
  }
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authtoken: token, Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errBody: any;
    try { errBody = await res.json(); } catch { errBody = { detail: `HTTP ${res.status}` }; }
    throw Object.assign(new Error(errBody?.detail || `HTTP ${res.status}`), { status: res.status, body: errBody });
  }
  if (res.status === 204) return {};
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestCase {
  input?: string;
  expected_output: string;
  description?: string;
  locked?: boolean;
  /** Filled only after a test run (stdout); not persisted to API */
  actual_output?: string | null;
}

interface AssignableCandidate {
  id: number;
  username: string;
  display_name: string;
}

/** Row from `GET /coderpad/questions` — employees create these via the UI; candidates pick from the list. */
interface CoderpadAssignmentQuestion {
  id: number;
  sno?: number;
  question?: string;
  title?: string;
  sort_order?: number;
  is_active?: boolean;
  problem_statement?: string;
  language?: string;
  starter_code?: string;
  test_cases?: unknown;
  assigned_candidate_ids?: number[] | null;
}

function getDisplayQuestionNumber(q: CoderpadAssignmentQuestion, index: number): number {
  if (typeof q.sno === "number" && Number.isFinite(q.sno) && q.sno > 0) return q.sno;
  return index + 1;
}

/** Problem / question text from API — preserves empty string (does not fall back to sample text). */
function problemTextFromApi(q: { problem_statement?: string; question?: string } | null | undefined): string {
  if (!q) return "";
  if (q.problem_statement != null) return String(q.problem_statement);
  if (q.question != null) return String(q.question);
  return "";
}

function normalizeTestsFromApi(raw: unknown): TestCase[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((t: any) => ({
    input: t.input ?? "",
    expected_output: String(t.expected_output ?? ""),
    description: t.description ?? "",
    locked: !!t.locked,
    actual_output: null,
  }));
}

/** Merge per-index actual stdout from execution results; missing indices → null */
function applyActualOutputsFromResults(cases: TestCase[], results: TestResult[] | null | undefined): TestCase[] {
  if (!results?.length) {
    return cases.map(tc => ({ ...tc, actual_output: null }));
  }
  const byIdx = new Map<number, TestResult>();
  for (const r of results) {
    byIdx.set(r.test_case_index, r);
  }
  return cases.map((tc, idx) => {
    const r = byIdx.get(idx);
    if (!r) return { ...tc, actual_output: null };
    const actual = r.actual !== undefined && r.actual !== null ? String(r.actual) : null;
    return { ...tc, actual_output: actual };
  });
}

function testsForAssignmentApi(tcs: TestCase[]) {
  return tcs.map(tc => ({
    input: tc.input ?? "",
    expected_output: tc.expected_output,
    description: tc.description ?? "",
    locked: tc.locked === true,
  }));
}

/** Placeholder copy for empty problem textarea (new questions start blank). */
const DEFAULT_PROBLEM_STATEMENT =
  "Write a recursive function factorial(n) that returns n! for a non-negative integer n. Use recursion only and print factorial(n) from stdin input.";

// ─── Security Types ────────────────────────────────────────────────────────────

type ViolationType =
  | "tab_switch" | "window_blur" | "fullscreen_exit" | "window_resize" | "window_focus_restored"
  | "paste_small" | "paste_medium" | "paste_large" | "paste_burst" | "paste_dominant"
  | "code_copy_small" | "code_copy" | "code_cut" | "copy_burst"
  | "idle_burst" | "fast_entry";

interface SecurityEvent {
  id: number;
  type: ViolationType;
  message: string;
  timestamp: Date;
  severity: "low" | "medium" | "high";
}

const VIOLATION_META: Record<ViolationType, { label: string; severity: "low" | "medium" | "high"; color: string }> = {
  tab_switch:           { label: "Tab Switch",          severity: "high",   color: "#f85149" },
  window_blur:          { label: "Window Lost Focus",   severity: "high",   color: "#f0883e" },
  fullscreen_exit:      { label: "Fullscreen Exit",     severity: "high",   color: "#f85149" },
  window_resize:        { label: "Split-Screen",        severity: "medium", color: "#d29922" },
  window_focus_restored:{ label: "Window Restored",     severity: "low",    color: "#3fb950" },
  paste_small:          { label: "Paste (small)",       severity: "low",    color: "#8b949e" },
  paste_medium:         { label: "Paste (medium)",      severity: "medium", color: "#d29922" },
  paste_large:          { label: "Paste (large)",       severity: "high",   color: "#f85149" },
  paste_burst:          { label: "Paste Burst",         severity: "high",   color: "#f85149" },
  paste_dominant:       { label: "Paste-Heavy Session", severity: "high",   color: "#f85149" },
  code_copy_small:      { label: "Copy (small)",        severity: "low",    color: "#8b949e" },
  code_copy:            { label: "Copy From Editor",    severity: "medium", color: "#d29922" },
  code_cut:             { label: "Cut From Editor",     severity: "medium", color: "#f0883e" },
  copy_burst:           { label: "Copy Burst",          severity: "medium", color: "#d29922" },
  idle_burst:           { label: "Idle Then Burst",     severity: "high",   color: "#f0883e" },
  fast_entry:           { label: "Abnormal Speed",      severity: "medium", color: "#d29922" },
};

interface TypingStats {
  keystrokeCount: number;
  backspaceCount: number;
  pasteCount: number;
  totalPastedChars: number;
  copyCount: number;
  cutCount: number;
  totalCopiedChars: number;
  currentWPM: number;
  peakWPM: number;
  idleSeconds: number;
  lastPasteSize: number;
  lastCopySize: number;
}

interface TestResult {
  test_case_index: number;
  input?: string;
  expected: string;
  actual?: string;
  error?: string;
  passed: boolean;
}

interface ExecutionLog {
  id: number;
  language: string;
  code_executed: string;
  status: string;
  execution_time_ms?: number;
  created_at: string;
}

interface CodeSnippet {
  id: number;
  title: string;
  language: string;
  description?: string;
  code: string;
  test_cases?: TestCase[];
  execution_timeout: number;
  is_shared: boolean;
  updated_at: string;
  last_executed_at?: string;
}

// ─── Language Config ───────────────────────────────────────────────────────────

interface LangConfig {
  label: string;
  monaco: string;
  color: string;
  /** Emoji fallback when `iconSrc` is not set */
  icon: string;
  /** Official mark (e.g. Python logo SVG) */
  iconSrc?: string;
  starter: string;
}

function LangIcon({ cfg, size = "md" }: { cfg?: LangConfig; size?: "sm" | "md" | "lg" }) {
  if (!cfg) return null;
  const dim = size === "sm" ? 14 : size === "lg" ? 20 : 18;
  if (cfg.iconSrc) {
    return (
      <img
        src={cfg.iconSrc}
        alt=""
        width={dim}
        height={dim}
        draggable={false}
        className="lang-icon-img"
        style={{ width: dim, height: dim }}
      />
    );
  }
  return <span className="lang-emoji">{cfg.icon}</span>;
}

const LANGUAGES: Record<string, LangConfig> = {
  python: {
    label: "Python",
    monaco: "python",
    color: "#3776AB",
    icon: "",
    iconSrc: "/images/logos/python.svg",
    starter: ``,
  },
  javascript: {
    label: "JavaScript",
    monaco: "javascript",
    color: "#f59e0b",
    icon: "⚡",
    starter: `// JavaScript\nfunction solution(n) {\n  return n * 2;\n}\n\nconsole.log(solution(5));\n`,
  },
  typescript: {
    label: "TypeScript",
    monaco: "typescript",
    color: "#60a5fa",
    icon: "📘",
    starter: `// TypeScript\nfunction solution(n: number): number {\n  return n * 2;\n}\n\nconsole.log(solution(5));\n`,
  },
  java: {
    label: "Java",
    monaco: "java",
    color: "#f97316",
    icon: "☕",
    starter: `public class Main {\n    public static int solution(int n) {\n        return n * 2;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(solution(5));\n    }\n}\n`,
  },
  cpp: {
    label: "C++",
    monaco: "cpp",
    color: "#8b5cf6",
    icon: "⚙️",
    starter: `#include <iostream>\nusing namespace std;\n\nint solution(int n) {\n    return n * 2;\n}\n\nint main() {\n    cout << solution(5) << endl;\n    return 0;\n}\n`,
  },
  c: {
    label: "C",
    monaco: "c",
    color: "#6366f1",
    icon: "🔧",
    starter: `#include <stdio.h>\n\nint solution(int n) {\n    return n * 2;\n}\n\nint main() {\n    printf("%d\\n", solution(5));\n    return 0;\n}\n`,
  },
  go: {
    label: "Go",
    monaco: "go",
    color: "#06b6d4",
    icon: "🐹",
    starter: `package main\n\nimport "fmt"\n\nfunc solution(n int) int {\n\treturn n * 2\n}\n\nfunc main() {\n\tfmt.Println(solution(5))\n}\n`,
  },
  rust: {
    label: "Rust",
    monaco: "rust",
    color: "#f43f5e",
    icon: "⚙️",
    starter: `fn solution(n: i32) -> i32 {\n    n * 2\n}\n\nfn main() {\n    println!("{}", solution(5));\n}\n`,
  },
  bash: {
    label: "Bash",
    monaco: "shell",
    color: "#10b981",
    icon: "🖥️",
    starter: `#!/bin/bash\n\nsolution() {\n    echo $(( $1 * 2 ))\n}\n\nsolution 5\n`,
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    success: { icon: <CheckCircle2 size={12} />, cls: "text-emerald-400 bg-emerald-400/10" },
    error: { icon: <XCircle size={12} />, cls: "text-red-400 bg-red-400/10" },
    timeout: { icon: <Clock size={12} />, cls: "text-amber-400 bg-amber-400/10" },
  };
  const cfg = map[status] || map.error;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>
      {cfg.icon} {status}
    </span>
  );
}

// ─── Security Monitor Hook ────────────────────────────────────────────────────

function useSecurityMonitor(enabled: boolean) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeWarning, setActiveWarning] = useState<SecurityEvent | null>(null);
  const eventIdRef = useRef(0);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasSplitRef = useRef(false);

  const addEvent = useCallback((type: ViolationType, message: string) => {
    if (!enabled) return;
    const meta = VIOLATION_META[type];
    const evt: SecurityEvent = {
      id: ++eventIdRef.current,
      type,
      message,
      timestamp: new Date(),
      severity: meta.severity,
    };
    setEvents(prev => [evt, ...prev].slice(0, 100));
    if (meta.severity !== "low") {
      setActiveWarning(evt);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => setActiveWarning(null), 4000);
    }
    return evt;
  }, [enabled]);

  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen();
  }, []);

  // Fullscreen change
  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      const nowFull = !!document.fullscreenElement;
      setIsFullscreen(nowFull);
      if (!nowFull) addEvent("fullscreen_exit", "Exited fullscreen — this is flagged as suspicious");
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [enabled, addEvent]);

  // Tab / page visibility
  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      if (document.hidden) addEvent("tab_switch", "Switched to another tab while session was active");
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [enabled, addEvent]);

  // Window blur / focus
  useEffect(() => {
    if (!enabled) return;
    const onBlur = () => addEvent("window_blur", "Browser window lost focus — possible app switch");
    const onFocus = () => addEvent("window_focus_restored", "Window focus restored");
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, addEvent]);

  // Window resize — detect split screen
  useEffect(() => {
    if (!enabled) return;
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const widthRatio = window.outerWidth / Math.max(window.screen.availWidth || window.screen.width, 1);
        const heightRatio = window.outerHeight / Math.max(window.screen.availHeight || window.screen.height, 1);
        const splitDetected = widthRatio <= 0.95 || heightRatio <= 0.95;
        if (splitDetected && !wasSplitRef.current) {
          addEvent(
            "window_resize",
            `Split-screen is not allowed — window is ${Math.round(widthRatio * 100)}% width, ${Math.round(heightRatio * 100)}% height of screen`
          );
        }
        wasSplitRef.current = splitDetected;
      }, 500);
    };
    handler();
    window.addEventListener("resize", handler);
    return () => { window.removeEventListener("resize", handler); clearTimeout(resizeTimer); };
  }, [enabled, addEvent]);

  const highCount  = events.filter(e => e.severity === "high").length;
  const medCount   = events.filter(e => e.severity === "medium").length;
  const totalCount = events.filter(e => e.severity !== "low").length;

  return {
    events, isFullscreen, activeWarning,
    addEvent, requestFullscreen, exitFullscreen,
    highCount, medCount, totalCount,
    dismissWarning: () => setActiveWarning(null),
  };
}

// ─── Typing Analyzer Hook ─────────────────────────────────────────────────────

function useTypingAnalyzer(
  addEvent: (type: ViolationType, msg: string) => void,
  /** When false, no clipboard or Monaco typing monitoring (e.g. staff editing assignment). */
  monitoringEnabled: boolean,
) {
  const [stats, setStats] = useState<TypingStats>({
    keystrokeCount: 0,
    backspaceCount: 0,
    pasteCount: 0,
    totalPastedChars: 0,
    copyCount: 0,
    cutCount: 0,
    totalCopiedChars: 0,
    currentWPM: 0,
    peakWPM: 0,
    idleSeconds: 0,
    lastPasteSize: 0,
    lastCopySize: 0,
  });

  const keystampBuf  = useRef<number[]>([]);
  const lastKeyTime  = useRef<number>(0);
  const lastActivity = useRef<number>(Date.now());
  const pasteHistory = useRef<number[]>([]);
  const copyHistory  = useRef<number[]>([]);
  const disposables  = useRef<any[]>([]);
  const idleFlagged  = useRef<boolean>(false);
  const pasteDominantReported = useRef<boolean>(false);

  // ── 1. Native DOM paste — severity by size + burst / idle / paste-heavy session
  useEffect(() => {
    if (!monitoringEnabled) return;
    const onPaste = (e: ClipboardEvent) => {
      if (isClipboardTargetMonacoEditor(e)) {
        e.preventDefault();
        e.stopPropagation();
        addEvent("paste_small", "Paste blocked in CoderPad");
        toastCoderpadClipboardDenied("Paste is disabled in CoderPad");
        return;
      }
      if (isCoderpadStaffAuthoringField(e.target)) {
        lastActivity.current = Date.now();
        return;
      }
      const text = e.clipboardData?.getData("text") ?? "";
      const chars = text.length;
      const now   = Date.now();

      const idleMs  = now - lastActivity.current;
      const wasIdle = idleMs > 30_000;

      pasteHistory.current = [...pasteHistory.current, now].filter(t => now - t < 60_000);
      const freq = pasteHistory.current.length;

      if (wasIdle && chars > 0) {
        addEvent("idle_burst",
          `Idle for ${Math.round(idleMs / 1000)}s, then pasted ${chars} character${chars !== 1 ? "s" : ""}`);
        idleFlagged.current = true;
      }

      const sizeLabel = chars === 0
        ? "empty clipboard"
        : chars < 20  ? `${chars} chars (small)`
        : chars < 100 ? `${chars} chars (medium)`
        : `${chars} chars (large)`;

      if (chars === 0) {
        addEvent("paste_small", `Paste attempted: ${sizeLabel}`);
      } else if (chars < 20) {
        addEvent("paste_small", `Paste: ${sizeLabel}`);
      } else if (chars < 100) {
        addEvent("paste_medium", `Paste: ${sizeLabel}`);
      } else {
        addEvent("paste_large", `Paste: ${sizeLabel}`);
      }

      if (freq >= 3) {
        addEvent("paste_burst", `${freq} paste events in the last 60 seconds`);
      }

      lastActivity.current = now;
      idleFlagged.current  = false;

      setStats(prev => {
        const nextPaste = prev.pasteCount + 1;
        const nextTotal = prev.totalPastedChars + chars;
        const nextKs    = prev.keystrokeCount;
        const inputVol  = nextTotal + nextKs;
        if (!pasteDominantReported.current && inputVol >= 400 && nextTotal / inputVol >= 0.72) {
          pasteDominantReported.current = true;
          const pct = Math.round((nextTotal / inputVol) * 100);
          queueMicrotask(() =>
            addEvent("paste_dominant",
              `~${pct}% of input volume is from pastes (${nextTotal} pasted chars, ${nextKs} keystrokes)`));
        }
        return {
          ...prev,
          pasteCount:       nextPaste,
          totalPastedChars: nextTotal,
          lastPasteSize:    chars,
        };
      });
    };

    const onCopy = (_ev: ClipboardEvent) => {
      if (isClipboardTargetMonacoEditor(_ev)) {
        _ev.preventDefault();
        _ev.stopPropagation();
        addEvent("code_copy_small", "Copy blocked in CoderPad");
        toastCoderpadClipboardDenied("Copy is disabled in CoderPad");
        return;
      }
      if (isCoderpadStaffAuthoringField(_ev.target) || isSelectionInCoderpadStaffAuthoring()) {
        lastActivity.current = Date.now();
        return;
      }
      const sel = window.getSelection()?.toString() ?? "";
      const chars = sel.length;
      const now = Date.now();
      lastActivity.current = now;

      copyHistory.current = [...copyHistory.current, now].filter(t => now - t < 60_000);
      const copyFreq = copyHistory.current.length;

      if (chars < 28) {
        addEvent("code_copy_small",
          `Copied ${chars} character${chars !== 1 ? "s" : ""} from editor`);
      } else if (chars < 200) {
        addEvent("code_copy",
          `Copied ${chars} character${chars !== 1 ? "s" : ""} from editor${copyFreq > 1 ? ` (copy #${copyFreq} in 60s)` : ""}`);
      } else {
        addEvent("code_copy", `Large copy-out: ${chars} characters from editor`);
      }

      if (copyFreq >= 4) {
        addEvent("copy_burst", `${copyFreq} copy events in the last 60 seconds`);
      }

      setStats(prev => ({
        ...prev,
        copyCount: prev.copyCount + 1,
        totalCopiedChars: prev.totalCopiedChars + chars,
        lastCopySize: chars,
      }));
    };

    const onCut = (e: ClipboardEvent) => {
      if (isClipboardTargetMonacoEditor(e)) {
        e.preventDefault();
        e.stopPropagation();
        addEvent("code_cut", "Cut blocked in CoderPad");
        toastCoderpadClipboardDenied("Cut is disabled in CoderPad");
        return;
      }
      if (isCoderpadStaffAuthoringField(e.target) || isSelectionInCoderpadStaffAuthoring()) {
        lastActivity.current = Date.now();
        return;
      }
      const chars = window.getSelection()?.toString().length ?? 0;
      const now = Date.now();
      lastActivity.current = now;
      addEvent("code_cut", `Cut ${chars} character${chars !== 1 ? "s" : ""} from editor`);
      setStats(prev => ({
        ...prev,
        cutCount: prev.cutCount + 1,
        totalCopiedChars: prev.totalCopiedChars + chars,
        lastCopySize: chars,
      }));
    };

    document.addEventListener("paste", onPaste, true);
    document.addEventListener("copy", onCopy, true);
    document.addEventListener("cut", onCut, true);
    return () => {
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("copy", onCopy, true);
      document.removeEventListener("cut", onCut, true);
    };
  }, [addEvent, monitoringEnabled]);

  // ── 3. Monaco: keydown (WPM + backspace) + idle-burst fallback via content change
  const setupEditor = useCallback((editor: any) => {
    disposables.current.forEach(d => d?.dispose());
    disposables.current = [];
    if (!monitoringEnabled) return;

    // ── Content change — ONLY for idle-burst fallback (paste already caught by DOM event)
    const d1 = editor.onDidChangeModelContent((e: any) => {
      const now          = Date.now();
      const timeSinceKey = now - lastKeyTime.current;
      for (const change of e.changes) {
        const added = change.text.length;
        if (added === 0) continue;
        const idleMs  = now - lastActivity.current;
        const wasIdle = idleMs > 30_000;
        if (wasIdle && added > 30 && timeSinceKey > 1000 && !idleFlagged.current) {
          addEvent("idle_burst",
            `Idle for ${Math.round(idleMs / 1000)}s then ${added} characters entered at once`);
          idleFlagged.current = true;
        }
        lastActivity.current = now;
        idleFlagged.current  = false;
      }
    });

    // ── Keydown: typing speed + backspace tracking
    const d2 = editor.onKeyDown((e: any) => {
      const now = Date.now();
      lastKeyTime.current  = now;
      lastActivity.current = now;
      idleFlagged.current  = false;

      // Track keystroke buffer (sliding window of 20)
      keystampBuf.current = [...keystampBuf.current.slice(-19), now];

      // WPM = (chars / 5) / (elapsed minutes), min 5 keystrokes
      if (keystampBuf.current.length >= 5) {
        const buf = keystampBuf.current;
        const elapsed = (buf[buf.length - 1] - buf[0]) / 60_000; // minutes
        const wpm = elapsed > 0 ? Math.round((buf.length / 5) / elapsed) : 0;

        if (wpm > 350) {
          addEvent("fast_entry",
            `Abnormal typing speed: ~${wpm} WPM detected (human max ~150 WPM)`);
        }

        setStats(prev => ({
          ...prev,
          currentWPM: wpm,
          peakWPM: Math.max(prev.peakWPM, wpm),
          keystrokeCount: prev.keystrokeCount + 1,
          backspaceCount: e.keyCode === 1 ? prev.backspaceCount + 1 : prev.backspaceCount,
        }));
      } else {
        setStats(prev => ({
          ...prev,
          keystrokeCount: prev.keystrokeCount + 1,
          backspaceCount: e.keyCode === 1 ? prev.backspaceCount + 1 : prev.backspaceCount,
        }));
      }
    });

    disposables.current = [d1, d2];
  }, [addEvent, monitoringEnabled]);

  // ── Idle timer: update idle seconds every 5s
  useEffect(() => {
    const iv = setInterval(() => {
      const idle = Math.floor((Date.now() - lastActivity.current) / 1000);
      setStats(prev => ({ ...prev, idleSeconds: idle }));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // ── Cleanup disposables on unmount
  useEffect(() => () => { disposables.current.forEach(d => d?.dispose()); }, []);

  return { stats, setupEditor };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const CoderpadEditor: React.FC = () => {
  const [loggedInUsername, setLoggedInUsername] = useState(() =>
    typeof window !== "undefined" ? getLoggedInUsername() : "User"
  );
  // ── Workspace (saved snippet id for API; no file history list in sidebar)
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);

  // ── Editor
  const [code, setCode] = useState(LANGUAGES.python.starter);
  const [language, setLanguage] = useState("python");
  const [title, setTitle] = useState(DEFAULT_SNIPPET_TITLE);
  const [description, setDescription] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // ── Execution
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [execStatus, setExecStatus] = useState<"idle" | "running" | "success" | "error" | "timeout">("idle");
  const [execTime, setExecTime] = useState<number | null>(null);
  /** false = idle; run = Run test cases; submit = save + run */
  const [runBusy, setRunBusy] = useState<false | "run" | "submit">(false);

  // ── Input / Test Cases
  const [inputData, setInputData] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  // ── UI Tabs (right panel)
  const [rightTab, setRightTab] = useState<"server" | "shell" | "console" | "logs">("shell");
  const [autoSave, setAutoSave] = useState(true);

  // ── Execution logs
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Modals / states
  const [saving, setSaving] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [filesCollapsed, setFilesCollapsed] = useState(true);
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  /** Synced with resizable Panel collapse — default collapsed (narrow rail on the right). */
  const [testsCollapsed, setTestsCollapsed] = useState(true);
  const [showAllTests, setShowAllTests] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  /** Shown once when opening CoderPad (session intro + role) */
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  /** JWT role: admin | employee | candidate — employees get CoderPad authoring UI */
  const [teamRole, setTeamRole] = useState<ReturnType<typeof getUserTeamRole>>(() =>
    typeof window !== "undefined" ? getUserTeamRole() : null
  );
  const [llmTopic, setLlmTopic] = useState("");
  const [llmGenerating, setLlmGenerating] = useState(false);
  const [llmValidating, setLlmValidating] = useState(false);
  const [showLlmResultModal, setShowLlmResultModal] = useState(false);
  const [llmResult, setLlmResult] = useState<{
    passed: boolean | null;
    summary: string;
    feedback: string;
    confidence?: string | null;
    error?: string | null;
  } | null>(null);
  const [assignmentId, setAssignmentId] = useState<number | null>(null);
  /** Published problems from the API (employees add rows; candidates choose one to solve). */
  const [assignmentQuestions, setAssignmentQuestions] = useState<CoderpadAssignmentQuestion[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [candidateAssignSearch, setCandidateAssignSearch] = useState("");
  /** DB-backed typeahead results for the assignment modal */
  const [candidateSuggestions, setCandidateSuggestions] = useState<AssignableCandidate[]>([]);
  const [candidateSearchLoading, setCandidateSearchLoading] = useState(false);
  const [candidateLabelById, setCandidateLabelById] = useState<Record<number, AssignableCandidate>>({});
  /** all = everyone; single = one ID + search; multiple = many IDs + search */
  const [assignmentTargetMode, setAssignmentTargetMode] = useState<"all" | "single" | "multiple">("all");
  const [draftProblemStatement, setDraftProblemStatement] = useState("");
  const [draftTestCases, setDraftTestCases] = useState<TestCase[]>([]);
  /** Assignment modal: collapse long test-case grid */
  const [assignmentModalTestsCollapsed, setAssignmentModalTestsCollapsed] = useState(true);
  const [draftSelectedCandidateIds, setDraftSelectedCandidateIds] = useState<number[]>([]);

  // ── Security: off while staff has "Add/Update problem statement" open (no copy/paste/exam signals)
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [secPanelTab, setSecPanelTab]   = useState<"events" | "analytics">("events");
  const suspendProctoringWhileStaffEditsAssignment =
    (teamRole === "admin" || teamRole === "employee") && showAssignmentModal;
  const security       = useSecurityMonitor(!suspendProctoringWhileStaffEditsAssignment);
  const typingAnalyzer = useTypingAnalyzer(security.addEvent, !suspendProctoringWhileStaffEditsAssignment);

  const editorRef = useRef<any>(null);
  const testsPanelRef = useRef<ImperativePanelHandle>(null);

  const toggleTestsPanel = useCallback(() => {
    const p = testsPanelRef.current;
    if (!p) return;
    if (p.isCollapsed()) p.expand(34);
    else p.collapse();
  }, []);

  useLayoutEffect(() => {
    testsPanelRef.current?.collapse();
  }, []);
  const prevSuspendProctoringRef = useRef(suspendProctoringWhileStaffEditsAssignment);
  useEffect(() => {
    if (prevSuspendProctoringRef.current === suspendProctoringWhileStaffEditsAssignment) return;
    prevSuspendProctoringRef.current = suspendProctoringWhileStaffEditsAssignment;
    const ed = editorRef.current;
    if (ed) typingAnalyzer.setupEditor(ed);
  }, [suspendProctoringWhileStaffEditsAssignment, typingAnalyzer.setupEditor]);
  const langDropRef = useRef<HTMLDivElement>(null);
  const wasSplitScreenRef = useRef(false);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { setLoggedInUsername(getLoggedInUsername()); }, []);
  useEffect(() => { setTeamRole(getUserTeamRole()); }, []);

  /** Keep draft test rows in sync with runtime stdout captured on main testCases after Run */
  useEffect(() => {
    if (!showAssignmentModal) return;
    setDraftTestCases(prev =>
      prev.map((tc, i) => ({
        ...tc,
        actual_output: testCases[i]?.actual_output ?? null,
      }))
    );
  }, [testCases, showAssignmentModal]);

  const applyCoderpadQuestionState = useCallback((q: CoderpadAssignmentQuestion, mode: "initial" | "switch") => {
    setAssignmentId(q.id);
    setDescription(problemTextFromApi(q));
    setTestCases(normalizeTestsFromApi(q.test_cases));
    setSelectedCandidateIds(Array.isArray(q.assigned_candidate_ids) ? q.assigned_candidate_ids : []);
    const langKey = q.language && LANGUAGES[q.language] ? q.language : "python";
    setLanguage(langKey);
    const fallbackStarter = (LANGUAGES[langKey] || LANGUAGES.python).starter;
    if (mode === "switch") {
      const next =
        typeof q.starter_code === "string" && q.starter_code.trim() ? q.starter_code : fallbackStarter;
      setCode(next);
    } else if (typeof q.starter_code === "string" && q.starter_code.trim()) {
      setCode(prev => (prev.trim() ? prev : q.starter_code!));
    }
    setIsDirty(false);
    setTestResults(null);
    setOutput("");
    setError("");
    setExecStatus("idle");
  }, []);

  const refreshAssignmentQuestions = useCallback(async () => {
    try {
      const list = await apiFetch("/coderpad/questions");
      if (!Array.isArray(list)) return;
      if (list.length === 0) {
        setAssignmentQuestions([]);
        return;
      }
      const active = [...list]
        .filter((q: { is_active?: boolean }) => q.is_active !== false)
        .sort(
          (
            a: { sno?: number; sort_order?: number; id?: number },
            b: { sno?: number; sort_order?: number; id?: number }
          ) => (a.sno ?? a.sort_order ?? a.id ?? 0) - (b.sno ?? b.sort_order ?? b.id ?? 0)
        ) as CoderpadAssignmentQuestion[];
      setAssignmentQuestions(active);
    } catch {
      /* ignore */
    }
  }, []);

  /** Load published assignments; candidates restore last chosen problem from localStorage when possible */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch("/coderpad/questions");
        if (cancelled || !Array.isArray(list)) return;
        if (list.length === 0) {
          if (!cancelled) setAssignmentQuestions([]);
          return;
        }
        const active = [...list]
          .filter((q: { is_active?: boolean }) => q.is_active !== false)
          .sort(
            (
              a: { sno?: number; sort_order?: number; id?: number },
              b: { sno?: number; sort_order?: number; id?: number }
            ) => (a.sno ?? a.sort_order ?? a.id ?? 0) - (b.sno ?? b.sort_order ?? b.id ?? 0)
          ) as CoderpadAssignmentQuestion[];
        if (cancelled) return;
        setAssignmentQuestions(active);
        let chosen: CoderpadAssignmentQuestion | undefined = active[0];
        const role = getUserTeamRole();
        if (role === "candidate" && typeof window !== "undefined") {
          const raw = localStorage.getItem("coderpad_selected_question_id");
          const pid = raw ? parseInt(raw, 10) : NaN;
          if (!Number.isNaN(pid)) {
            const found = active.find(x => x.id === pid);
            if (found) chosen = found;
          }
        }
        if (!chosen) return;
        applyCoderpadQuestionState(chosen, "initial");
      } catch {
        /* keep defaults */
      }
    })();
    return () => { cancelled = true; };
  }, [applyCoderpadQuestionState]);

  const selectCoderpadQuestion = useCallback(
    (id: number) => {
      const q = assignmentQuestions.find(x => x.id === id);
      if (!q || q.id === assignmentId) return;
      applyCoderpadQuestionState(q, "switch");
      if (getUserTeamRole() === "candidate" && typeof window !== "undefined") {
        localStorage.setItem("coderpad_selected_question_id", String(id));
      }
    },
    [assignmentQuestions, assignmentId, applyCoderpadQuestionState]
  );

  const startNewCoderpadProblem = useCallback(() => {
    if (teamRole !== "admin" && teamRole !== "employee") return;
    setAssignmentId(null);
    setDescription("");
    setTestCases([]);
    setSelectedCandidateIds([]);
    setCode(LANGUAGES.python.starter);
    setLanguage("python");
    setIsDirty(false);
    setTestResults(null);
    setOutput("");
    setError("");
    setExecStatus("idle");
    toast.info('Drafting a new problem — open "Change problem statement" to edit, then save to publish.');
  }, [teamRole]);

  // Detect split-screen/windowed usage and adapt layout without forcing fullscreen.
  useEffect(() => {
    const checkSplitScreen = () => {
      const widthRatio = window.outerWidth / Math.max(window.screen.availWidth || window.screen.width, 1);
      const heightRatio = window.outerHeight / Math.max(window.screen.availHeight || window.screen.height, 1);
      const split = widthRatio <= 0.95 || heightRatio <= 0.95;
      setIsSplitScreen(split);
      if (split && !wasSplitScreenRef.current) {
        setFilesCollapsed(true);
      }
      wasSplitScreenRef.current = split;
    };
    checkSplitScreen();
    window.addEventListener("resize", checkSplitScreen);
    return () => window.removeEventListener("resize", checkSplitScreen);
  }, []);

  const mergeCandidateLabels = useCallback((rows: AssignableCandidate[]) => {
    setCandidateLabelById(prev => {
      const next = { ...prev };
      for (const r of rows) {
        next[r.id] = r;
      }
      return next;
    });
  }, []);

  /** Typeahead: search candidates in DB while assignment modal is open */
  useEffect(() => {
    if (!showAssignmentModal || assignmentTargetMode === "all") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setCandidateSearchLoading(true);
        try {
          const params = new URLSearchParams({ limit: "50" });
          const q = candidateAssignSearch.trim();
          if (q) params.set("search", q);
          const rows = await apiFetch(`/coderpad/assignable-candidates?${params.toString()}`);
          if (cancelled) return;
          if (Array.isArray(rows)) {
            setCandidateSuggestions(rows);
            mergeCandidateLabels(rows);
          }
        } catch {
          if (!cancelled) setCandidateSuggestions([]);
        } finally {
          if (!cancelled) setCandidateSearchLoading(false);
        }
      })();
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [candidateAssignSearch, showAssignmentModal, assignmentTargetMode, mergeCandidateLabels]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropRef.current && !langDropRef.current.contains(e.target as Node)) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── API calls ─────────────────────────────────────────────────────────────

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const params = selectedSnippet ? `?snippet_id=${selectedSnippet.id}&limit=20` : "?limit=20";
      const data = await apiFetch(`/coderpad/execution-logs${params}`);
      setLogs(data);
    } catch {
      /* ignore */
    } finally {
      setLogsLoading(false);
    }
  };

  const createNew = (titleOverride?: string) => {
    const cfg = LANGUAGES[language] || LANGUAGES.python;
    setSelectedSnippet(null);
    setCode(cfg.starter);
    setTitle(titleOverride || DEFAULT_SNIPPET_TITLE);
    setOutput("");
    setError("");
    setTestResults(null);
    setExecStatus("idle");
    setExecTime(null);
    setIsDirty(false);
    setShowNewModal(false);
    setNewTitle("");
  };

  const saveSnippet = async (opts?: { silent?: boolean }): Promise<boolean> => {
    if (!title.trim()) {
      if (!opts?.silent) toast.error("Please enter a title");
      return false;
    }
    setSaving(true);
    try {
      const body = {
      title,
      description,
      language,
      code,
      test_cases: testCases.map(({ actual_output: _a, ...tc }) => tc),
      execution_timeout: 10,
      is_shared: false,
    };
      if (selectedSnippet) {
        const updated = await apiFetch(`/coderpad/snippets/${selectedSnippet.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setSelectedSnippet(updated);
        if (!opts?.silent) toast.success("Saved");
      } else {
        const created = await apiFetch("/coderpad/snippets", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setSelectedSnippet(created);
        if (!opts?.silent) toast.success("Snippet created");
      }
      setIsDirty(false);
      return true;
    } catch (err: any) {
      if (!opts?.silent) toast.error(err.message || "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveCoderpadAssignment = async (payload?: {
    problemStatement?: string;
    assignmentTestCases?: TestCase[];
    assignedCandidateIds?: number[];
    /** When true, store null so every candidate receives the assignment */
    assignToAll?: boolean;
  }): Promise<boolean> => {
    const isStaff = teamRole === "admin" || teamRole === "employee";
    if (!isStaff) return false;
    const nextProblemStatement = payload?.problemStatement ?? description;
    const nextTestCases = payload?.assignmentTestCases ?? testCases;
    const assignToAll = payload?.assignToAll === true;
    const rawIds = payload?.assignedCandidateIds ?? selectedCandidateIds;
    const nextAssignedCandidateIds = assignToAll ? [] : rawIds;
    setSavingAssignment(true);
    try {
      const body = {
        title: "CoderPad assignment",
        problem_statement: nextProblemStatement,
        language,
        starter_code: code,
        test_cases: testsForAssignmentApi(nextTestCases),
        assigned_candidate_ids:
          assignToAll || nextAssignedCandidateIds.length === 0 ? null : nextAssignedCandidateIds,
        execution_timeout: 10,
        is_active: true,
        sort_order: 0,
      };
      if (assignmentId != null) {
        const updated = await apiFetch(`/coderpad/questions/${assignmentId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setAssignmentId(updated.id);
        setDescription(nextProblemStatement ?? "");
        setTestCases(nextTestCases);
        setSelectedCandidateIds(assignToAll ? [] : nextAssignedCandidateIds);
        await refreshAssignmentQuestions();
        toast.success("Assignment updated");
      } else {
        const created = await apiFetch("/coderpad/questions", { method: "POST", body: JSON.stringify(body) });
        setAssignmentId(created.id);
        setDescription(nextProblemStatement ?? "");
        setTestCases(nextTestCases);
        setSelectedCandidateIds(assignToAll ? [] : nextAssignedCandidateIds);
        await refreshAssignmentQuestions();
        toast.success("Assignment published");
      }
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to save assignment");
      return false;
    } finally {
      setSavingAssignment(false);
    }
  };

  const saveSnippetRef = useRef(saveSnippet);
  saveSnippetRef.current = saveSnippet;
  useEffect(() => {
    if (!autoSave || !selectedSnippet || !isDirty) return;
    const t = setTimeout(() => { saveSnippetRef.current({ silent: true }); }, 1600);
    return () => clearTimeout(t);
  }, [code, title, description, testCases, language, autoSave, selectedSnippet?.id, isDirty]);

  const performExecute = async (opts?: { openModal?: boolean }) => {
    let data: any;
    if (selectedSnippet) {
      const params = new URLSearchParams();
      if (inputData) params.set("input_data", inputData);
      params.set("run_tests", testCases.length > 0 ? "true" : "false");
      data = await apiFetch(`/coderpad/snippets/${selectedSnippet.id}/execute?${params}`, { method: "POST" });
    } else {
      const execBody: Record<string, unknown> = {
        code,
        language,
        input_data: inputData || null,
        timeout: 10,
      };
      if (testCases.length > 0) {
        execBody.test_cases = testCases.map(({ actual_output: _a, ...tc }) => tc);
      }
      data = await apiFetch("/coderpad/execute", {
        method: "POST",
        body: JSON.stringify(execBody),
      });
    }
    setOutput(data.output || "");
    setError(data.error || "");
    setExecTime(data.execution_time_ms ?? null);
    setExecStatus(data.status || "error");
    if (data.test_results && Array.isArray(data.test_results)) {
      setTestResults(data.test_results);
      setTestCases(prev => applyActualOutputsFromResults(prev, data.test_results));
      setRightTab("console");
      if (opts?.openModal) {
        setShowResultModal(true);
      }
    } else {
      setTestResults(null);
      if (testCases.length > 0) {
        setTestCases(prev => prev.map(tc => ({ ...tc, actual_output: null })));
      }
    }
    return data;
  };

  const runLlmValidate = async (opts?: { testCasesOverride?: TestCase[] }) => {
    const q =
      assignmentId == null ? null : assignmentQuestions.find((x) => x.id === assignmentId) ?? null;
    const problemStatement = (q ? problemTextFromApi(q) : String(description ?? "")).trim();
    if (!problemStatement) {
      toast.error("No problem statement loaded");
      return;
    }
    if (!code.trim()) {
      toast.error("Write some code first");
      return;
    }
    const casesForLlm = opts?.testCasesOverride ?? testCases;
    setLlmValidating(true);
    setLlmResult(null);
    try {
      const body: Record<string, unknown> = {
        problem_statement: problemStatement,
        code,
        language,
        /** Full assignment tests + optional actual_output from last run for the LLM */
        test_cases: casesForLlm.map((tc) => ({
          input: tc.input ?? null,
          expected_output: tc.expected_output ?? "",
          description: tc.description,
          locked: tc.locked,
          actual_output: tc.actual_output ?? null,
        })),
      };
      const data = await apiFetch("/coderpad/llm-validate", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setLlmResult({
        passed: data.passed ?? null,
        summary: data.summary || "",
        feedback: data.feedback || "",
        confidence: data.confidence ?? null,
        error: data.error ?? null,
      });
      setShowLlmResultModal(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "LLM validation failed";
      setLlmResult({
        passed: null,
        summary: "",
        feedback: "",
        error: message,
      });
      setShowLlmResultModal(true);
    } finally {
      setLlmValidating(false);
    }
  };

  const runTestCases = async () => {
    if (!code.trim()) { toast.error("Write some code first!"); return; }
    const panel = testsPanelRef.current;
    if (panel?.isCollapsed()) {
      panel.expand(34);
      setTestsCollapsed(false);
    }
    setRunBusy("run");
    setOutput("");
    setError("");
    setTestResults(null);
    setTestCases(prev => prev.map(tc => ({ ...tc, actual_output: null })));
    setExecStatus("running");
    setShowResultModal(false);
    setRightTab("shell");
    try {
      const data = await performExecute({ openModal: false });
      if (
        data?.test_results &&
        Array.isArray(data.test_results) &&
        data.test_results.length > 0 &&
        testCases.length > 0
      ) {
        const merged = applyActualOutputsFromResults(testCases, data.test_results);
        await runLlmValidate({ testCasesOverride: merged });
      }
    } catch (err: any) {
      const msg = err.message || "Execution failed";
      setError(msg);
      setExecStatus("error");
      toast.error(msg);
    } finally {
      setRunBusy(false);
    }
  };

  const generateFromLlm = async () => {
    if (!llmTopic.trim()) { toast.error("Please enter a topic first"); return; }
    setLlmGenerating(true);
    try {
      const body = { topic: llmTopic, language };
      const data = await apiFetch("/coderpad/llm-generate", {
        method: "POST",
        body: JSON.stringify(body),
      });
      // Set the generated fields
      setDraftProblemStatement(data.problem_statement || "");
      setCode(data.starter_code || "");
      setIsDirty(true);
      if (data.language) setLanguage(data.language);
      if (data.test_cases && Array.isArray(data.test_cases)) {
        setDraftTestCases(data.test_cases);
      }
      toast.success("AI Generation Complete! Review and click Save Assignment.");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate assignment");
    } finally {
      setLlmGenerating(false);
    }
  };

  const submitSolution = async () => {
    if (!code.trim()) { toast.error("Write some code first!"); return; }
    if (!title.trim()) { toast.error("Please enter a title before submitting"); return; }
    setRunBusy("submit");
    setOutput("");
    setError("");
    setTestResults(null);
    setTestCases(prev => prev.map(tc => ({ ...tc, actual_output: null })));
    setExecStatus("running");
    setShowResultModal(false);
    setRightTab("shell");
    try {
      const saved = await saveSnippet({ silent: true });
      if (!saved) {
        setExecStatus("error");
        return;
      }
      await performExecute({ openModal: true });
      setShowResultModal(true);
      toast.success("Solution submitted");
    } catch (err: any) {
      const msg = err.message || "Submit failed";
      setError(msg);
      setExecStatus("error");
      setShowResultModal(true);
      toast.error(msg);
    } finally {
      setRunBusy(false);
    }
  };

  // Keyboard: Ctrl+Enter = run tests, Ctrl+Shift+Enter = submit, Ctrl+S = save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          void submitSolution();
        } else {
          void runTestCases();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void saveSnippet();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [code, language, title, description, testCases, selectedSnippet, inputData]);

  const deleteSnippet = async () => {
    if (!selectedSnippet) return;
    if (!window.confirm(`Delete "${selectedSnippet.title}"?`)) return;
    try {
      await apiFetch(`/coderpad/snippets/${selectedSnippet.id}`, { method: "DELETE" });
      toast.success("Snippet deleted");
      createNew();
    } catch (err: any) {
      toast.error("Delete failed");
    }
  };

  // ── Test Case Helpers ─────────────────────────────────────────────────────
  const isStaff = teamRole === "admin" || teamRole === "employee";

  const updateTestCase = (i: number, field: keyof TestCase, val: string | boolean) => {
    setTestCases(prev => prev.map((tc, idx) => idx === i ? { ...tc, [field]: val } : tc));
    setIsDirty(true);
  };
  const addTestCase = () => {
    if (!isStaff) return;
    setTestCases(prev => [...prev, { input: "", expected_output: "", description: "", locked: false, actual_output: null }]);
    setIsDirty(true);
  };

  const addDraftSelectedCandidate = (c: AssignableCandidate) => {
    mergeCandidateLabels([c]);
    setCandidateAssignSearch("");
    setDraftSelectedCandidateIds(prev => {
      if (assignmentTargetMode === "single") return [c.id];
      return prev.includes(c.id) ? prev : [...prev, c.id];
    });
  };
  const removeDraftSelectedCandidate = (id: number) => {
    setDraftSelectedCandidateIds(prev => prev.filter(x => x !== id));
  };
  const updateDraftTestCase = (i: number, field: keyof TestCase, val: string | boolean) => {
    setDraftTestCases(prev => prev.map((tc, idx) => idx === i ? { ...tc, [field]: val } : tc));
  };
  const addDraftTestCase = () => {
    setDraftTestCases(prev => [...prev, { input: "", expected_output: "", description: "", locked: false, actual_output: null }]);
  };
  const removeDraftTestCase = (i: number) => {
    setDraftTestCases(prev => prev.filter((_, idx) => idx !== i));
  };
  const resolveAssignmentCandidateLabels = useCallback(async (ids: number[]) => {
    if (ids.length === 0) return;
    try {
      const params = new URLSearchParams({ limit: "50" });
      params.set("resolve_ids", ids.join(","));
      const rows = await apiFetch(`/coderpad/assignable-candidates?${params.toString()}`);
      if (Array.isArray(rows)) mergeCandidateLabels(rows);
    } catch {
      /* ignore */
    }
  }, [mergeCandidateLabels]);
  const openAssignmentModal = () => {
    const activeQuestion = assignmentId == null
      ? null
      : assignmentQuestions.find(q => q.id === assignmentId) ?? null;
    const modalProblem = activeQuestion
      ? problemTextFromApi(activeQuestion).trim()
      : String(description ?? "").trim();
    const modalTests = activeQuestion
      ? normalizeTestsFromApi(activeQuestion.test_cases)
      : (testCases.length > 0 ? testCases : []);
    const modalSelectedIds = activeQuestion
      ? (Array.isArray(activeQuestion.assigned_candidate_ids) ? activeQuestion.assigned_candidate_ids : [])
      : selectedCandidateIds;

    setDraftProblemStatement(modalProblem);
    setDraftTestCases(modalTests);
    setDraftSelectedCandidateIds(modalSelectedIds);
    if (modalSelectedIds.length === 0) setAssignmentTargetMode("all");
    else if (modalSelectedIds.length === 1) setAssignmentTargetMode("single");
    else setAssignmentTargetMode("multiple");
    setCandidateAssignSearch("");
    setCandidateSuggestions([]);
    setAssignmentModalTestsCollapsed(true);
    setShowAssignmentModal(true);
    void resolveAssignmentCandidateLabels(modalSelectedIds);
  };
  const loadDraftFromQuestion = useCallback((nextQuestion: CoderpadAssignmentQuestion) => {
    applyCoderpadQuestionState(nextQuestion, "switch");
    const nextSelectedIds = Array.isArray(nextQuestion.assigned_candidate_ids) ? nextQuestion.assigned_candidate_ids : [];
    setDraftProblemStatement(problemTextFromApi(nextQuestion).trim());
    setDraftTestCases(normalizeTestsFromApi(nextQuestion.test_cases));
    setDraftSelectedCandidateIds(nextSelectedIds);
    if (nextSelectedIds.length === 0) setAssignmentTargetMode("all");
    else if (nextSelectedIds.length === 1) setAssignmentTargetMode("single");
    else setAssignmentTargetMode("multiple");
    setCandidateAssignSearch("");
    setCandidateSuggestions([]);
    void resolveAssignmentCandidateLabels(nextSelectedIds);
  }, [applyCoderpadQuestionState, resolveAssignmentCandidateLabels]);

  const selectModalQuestionById = useCallback((id: number) => {
    const nextQuestion = assignmentQuestions.find(q => q.id === id);
    if (!nextQuestion || nextQuestion.id === assignmentId) return;
    loadDraftFromQuestion(nextQuestion);
  }, [assignmentQuestions, assignmentId, loadDraftFromQuestion]);

  const goToAdjacentModalQuestion = useCallback((direction: -1 | 1) => {
    if (assignmentQuestions.length === 0) return;
    const currentIndex = assignmentId == null
      ? 0
      : assignmentQuestions.findIndex(q => q.id === assignmentId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = safeIndex + direction;
    if (nextIndex < 0 || nextIndex >= assignmentQuestions.length) return;
    const nextQuestion = assignmentQuestions[nextIndex];
    if (!nextQuestion) return;
    loadDraftFromQuestion(nextQuestion);
  }, [assignmentQuestions, assignmentId, loadDraftFromQuestion]);

  const createNextModalQuestion = useCallback(async () => {
    const isStaffUser = teamRole === "admin" || teamRole === "employee";
    if (!isStaffUser || savingAssignment) return;
    let highestSno = assignmentQuestions.reduce(
      (max, q, idx) => Math.max(max, getDisplayQuestionNumber(q, idx)),
      0
    );
    if (highestSno === 0 && assignmentId != null) {
      try {
        const current = await apiFetch(`/coderpad/questions/${assignmentId}`);
        const fromApi = Number(current?.sno ?? current?.sort_order ?? 0);
        if (Number.isFinite(fromApi) && fromApi > 0) highestSno = fromApi;
      } catch {
        /* keep fallback */
      }
    }
    const nextSno = highestSno + 1;
    setSavingAssignment(true);
    try {
      const langCfg = LANGUAGES[language] || LANGUAGES.python;
      const created = await apiFetch("/coderpad/questions", {
        method: "POST",
        body: JSON.stringify({
          title: `CoderPad assignment ${nextSno}`,
          problem_statement: "",
          language,
          starter_code: langCfg.starter,
          test_cases: [],
          assigned_candidate_ids: null,
          execution_timeout: 10,
          is_active: true,
          sort_order: nextSno,
          sno: nextSno,
        }),
      });
      await refreshAssignmentQuestions();
      loadDraftFromQuestion(created as CoderpadAssignmentQuestion);
      toast.success(`Question ${nextSno} created`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create next question");
    } finally {
      setSavingAssignment(false);
    }
  }, [teamRole, savingAssignment, assignmentQuestions, assignmentId, language, refreshAssignmentQuestions, loadDraftFromQuestion]);

  const handleModalNextQuestion = useCallback(() => {
    if (assignmentQuestions.length === 0) {
      void createNextModalQuestion();
      return;
    }
    const currentIndex = assignmentId == null
      ? 0
      : assignmentQuestions.findIndex(q => q.id === assignmentId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    if (safeIndex < assignmentQuestions.length - 1) {
      goToAdjacentModalQuestion(1);
      return;
    }
    void createNextModalQuestion();
  }, [assignmentQuestions, assignmentId, goToAdjacentModalQuestion, createNextModalQuestion]);
  const saveAssignmentFromModal = async (opts?: { closeAfterSave?: boolean }) => {
    const idsForSave =
      assignmentTargetMode === "single"
        ? draftSelectedCandidateIds.slice(0, 1)
        : draftSelectedCandidateIds;
    const ok = await saveCoderpadAssignment({
      problemStatement: draftProblemStatement,
      assignmentTestCases: draftTestCases,
      assignedCandidateIds: idsForSave,
      assignToAll: assignmentTargetMode === "all",
    });
    if (ok && opts?.closeAfterSave) {
      setShowAssignmentModal(false);
    }
  };

  /** Remove saved question from API, or clear unsaved draft in the modal */
  const removeOrClearAssignmentProblem = async () => {
    if (!isStaff) return;
    if (assignmentId == null) {
      if (!window.confirm("Clear this draft? Problem text and test cases will be emptied.")) return;
      setDraftProblemStatement("");
      setDraftTestCases([]);
      toast.success("Draft cleared");
      return;
    }
    if (!window.confirm("Remove this problem from CoderPad? Assigned candidates will no longer see it. This cannot be undone.")) {
      return;
    }
    setSavingAssignment(true);
    try {
      const removedId = assignmentId;
      const prevIndex = assignmentQuestions.findIndex(q => q.id === removedId);
      await apiFetch(`/coderpad/questions/${removedId}`, { method: "DELETE" });
      const list = await apiFetch("/coderpad/questions");
      const active = (Array.isArray(list) ? list : [])
        .filter((q: { is_active?: boolean }) => q.is_active !== false)
        .sort(
          (
            a: { sno?: number; sort_order?: number; id?: number },
            b: { sno?: number; sort_order?: number; id?: number }
          ) => (a.sno ?? a.sort_order ?? a.id ?? 0) - (b.sno ?? b.sort_order ?? b.id ?? 0)
        ) as CoderpadAssignmentQuestion[];
      setAssignmentQuestions(active);
      if (active.length === 0) {
        setAssignmentId(null);
        setDescription("");
        setTestCases([]);
        setDraftProblemStatement("");
        setDraftTestCases([]);
        setSelectedCandidateIds([]);
        setDraftSelectedCandidateIds([]);
        setAssignmentTargetMode("all");
        setCode(LANGUAGES.python.starter);
        setLanguage("python");
        toast.success("Problem removed. Add a new problem when ready.");
      } else {
        const nextIdx = prevIndex <= 0 ? 0 : prevIndex - 1;
        const nextQ = active[Math.min(nextIdx, active.length - 1)];
        if (nextQ) loadDraftFromQuestion(nextQ);
        toast.success("Problem removed");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove problem";
      toast.error(msg);
    } finally {
      setSavingAssignment(false);
    }
  };

  const removeTestCase = (i: number) => {
    if (testCases[i]?.locked && !isStaff) return;
    setTestCases(prev => prev.filter((_, idx) => idx !== i));
    setIsDirty(true);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const langCfg = LANGUAGES[language] || LANGUAGES.python;
  const passCount = testResults?.filter(r => r.passed).length ?? 0;
  const totalTests = testResults?.length ?? 0;
  const candidateVisibleTests = testCases.map((tc, idx) => ({ tc, idx })).filter(({ tc }) => !tc.locked);
  const visibleRows = isStaff
    ? testCases.map((tc, idx) => ({ tc, idx }))
    : (showAllTests ? candidateVisibleTests : candidateVisibleTests.slice(0, 2));
  const flaggedEvents = security.events.filter(evt => evt.severity !== "low");
  const recentFlags = flaggedEvents.slice(0, 3);
  const passRate = totalTests > 0 ? Math.round((passCount / totalTests) * 100) : 0;
  const resultAssessment =
    execStatus === "running"
      ? "Execution in progress..."
      : totalTests === 0
      ? "Run the code to evaluate against test cases."
      : passCount === totalTests
      ? "Code passes all current test cases."
      : passCount === 0
      ? "Code failed all current test cases. Recheck logic and base case."
      : `Code passed ${passCount}/${totalTests} tests. Check failing edge cases.`;
  const problemRailQuestions: CoderpadAssignmentQuestion[] =
    assignmentQuestions.length > 0
      ? assignmentQuestions
      : [
          {
            id: assignmentId ?? 0,
            sno: 1,
            title: title || "Problem",
            problem_statement: description || "",
          },
        ];
  const modalQuestionIndex = assignmentId == null ? -1 : assignmentQuestions.findIndex(q => q.id === assignmentId);
  const modalQuestionNumber = modalQuestionIndex >= 0 ? modalQuestionIndex + 1 : null;
  const modalQuestionTitle = modalQuestionIndex >= 0
    ? (assignmentQuestions[modalQuestionIndex]?.title?.trim() || `Problem #${modalQuestionNumber}`)
    : "New problem";
  const activeQuestion = assignmentId == null ? null : assignmentQuestions.find(q => q.id === assignmentId) ?? null;
  const activeQuestionIndex = activeQuestion ? assignmentQuestions.findIndex(q => q.id === activeQuestion.id) : -1;
  const activeQuestionNumber = activeQuestion && activeQuestionIndex >= 0
    ? getDisplayQuestionNumber(activeQuestion, activeQuestionIndex)
    : 1;
  const modalQuestionStripQuestions: CoderpadAssignmentQuestion[] =
    assignmentQuestions.length > 0
      ? assignmentQuestions
      : problemRailQuestions;
  const canGoToPreviousModalQuestion = modalQuestionIndex > 0;

  /** Product roles: Employee (includes admin) vs Candidate — JWT may still expose admin/employee separately */
  const loginStatusLine =
    teamRole === "candidate"
      ? `Logged in as Candidate — ${loggedInUsername}`
      : teamRole === "admin" || teamRole === "employee"
      ? `Logged in as Employee — ${loggedInUsername}`
      : `Logged in — ${loggedInUsername}`;

  // ─────────────────────────────────────────────────────────────────────────
  //  SECURITY HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const securityStatusColor = security.highCount > 0
    ? "#f85149"
    : security.medCount > 0
    ? "#d29922"
    : "#3fb950";

  const securityLabel = security.totalCount === 0
    ? "🛡 Secure"
    : `⚠ ${security.totalCount} violation${security.totalCount !== 1 ? "s" : ""}`;

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="coderpad-root">

      {typeof document !== "undefined" &&
        showWelcomeModal &&
        createPortal(
          <div
            className="coderpad-overlay coderpad-welcome-overlay"
            style={{ zIndex: 999999 }}
            onClick={() => {
              if (!isStaff) setShowWelcomeModal(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="coderpad-welcome-title"
          >
            <div className="coderpad-modal welcome-modal" onClick={e => e.stopPropagation()}>
              <h3 id="coderpad-welcome-title" className="modal-title">Welcome to CoderPad</h3>
              <p className="welcome-modal-role">{loginStatusLine}</p>
              <p className="welcome-modal-hint">
                {isStaff
                  ? "As an employee you can edit the problem statement, manage test cases, and save the assignment for candidates."
                  : "Read the problem, write your code, use Run test cases to check locally, then Submit for scoring."}
              </p>
              {isStaff ? (
                <div className="welcome-role-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setShowWelcomeModal(false);
                      openAssignmentModal();
                    }}
                  >
                    Add / Update Questions
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowWelcomeModal(false)}
                  >
                    Solve CoderPad Questions
                  </button>
                </div>
              ) : (
                <div className="modal-actions">
                  <button type="button" className="btn-primary" onClick={() => setShowWelcomeModal(false)}>
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ── VIOLATION WARNING OVERLAY ─────────────────────────────── */}
      {security.activeWarning && (
        <div className="sec-warning-overlay" onClick={security.dismissWarning}>
          <div className="sec-warning-card" onClick={e => e.stopPropagation()}>
            <div className="sec-warning-icon">
              <ShieldAlert size={22} color="#f85149" />
            </div>
            <div className="sec-warning-body">
              <div className="sec-warning-title">
                ⚠️ Violation Detected — {VIOLATION_META[security.activeWarning.type].label}
              </div>
              <div className="sec-warning-msg">{security.activeWarning.message}</div>
            </div>
            <button className="sec-warn-close" onClick={security.dismissWarning}>✕</button>
          </div>
        </div>
      )}

      {isSplitScreen && (
        <div className="sec-lock-overlay" role="alert" aria-live="assertive">
          <div className="sec-lock-card">
            <ShieldAlert size={24} color="#f85149" />
            <div className="sec-lock-title">Split-screen blocked</div>
            <p className="sec-lock-msg">
              CoderPad access is locked in split view. Please maximize this tab/window to continue.
            </p>
          </div>
        </div>
      )}

      {/* ── SECURITY VIOLATION PANEL ──────────────────────────────── */}
      {showSecurityPanel && (
        <div className="sec-panel" onClick={e => e.stopPropagation()}>
          <div className="sec-panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <ShieldAlert size={15} color={securityStatusColor} />
              <span style={{ fontWeight: 600, fontSize: "0.83rem" }}>Security Log</span>
              {security.totalCount > 0 && (
                <span className="sec-badge-high">{security.totalCount}</span>
              )}
            </div>
            <button className="btn-icon" style={{ width: 24, height: 24 }} onClick={() => setShowSecurityPanel(false)}>✕</button>
          </div>
          <div className="sec-panel-stats">
            <div className="sec-stat" style={{ color: "#f85149" }}>
              <ShieldAlert size={12} /> <span>{security.highCount} High</span>
            </div>
            <div className="sec-stat" style={{ color: "#d29922" }}>
              <AlertTriangle size={12} /> <span>{security.medCount} Medium</span>
            </div>
          </div>
          {/* Tab bar */}
          <div className="sec-panel-tabs">
            <button
              className={`sec-panel-tab ${secPanelTab === "events" ? "active" : ""}`}
              onClick={() => setSecPanelTab("events")}
            >
              Events {security.totalCount > 0 && <span className="sec-badge-high" style={{ background: securityStatusColor, marginLeft: 4 }}>{security.totalCount}</span>}
            </button>
            <button
              className={`sec-panel-tab ${secPanelTab === "analytics" ? "active" : ""}`}
              onClick={() => setSecPanelTab("analytics")}
            >
              Analytics
            </button>
          </div>
          {secPanelTab === "events" ? (
            <div className="sec-events-list">
              {security.events.length === 0 ? (
                <div className="sec-events-empty">
                  <ShieldCheck size={28} color="#3fb950" />
                  <span>No violations recorded</span>
                </div>
              ) : (
                security.events.map(evt => {
                  const meta = VIOLATION_META[evt.type];
                  return (
                    <div key={evt.id} className="sec-event-item">
                      <div className="sec-event-dot" style={{ background: meta.color }} />
                      <div className="sec-event-content">
                        <div className="sec-event-type" style={{ color: meta.color }}>{meta.label}</div>
                        <div className="sec-event-msg">{evt.message}</div>
                        <div className="sec-event-time">{evt.timestamp.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Analytics tab */
            <div className="sec-analytics">
              <div className="sec-analytics-grid">
                <div className="sec-analytics-card">
                  <div className="sec-analytics-val">{typingAnalyzer.stats.keystrokeCount}</div>
                  <div className="sec-analytics-label">Keystrokes</div>
                </div>
                <div className="sec-analytics-card">
                  <div className="sec-analytics-val" style={{ color: typingAnalyzer.stats.backspaceCount > 50 ? "#3fb950" : "#e6edf3" }}>
                    {typingAnalyzer.stats.backspaceCount}
                  </div>
                  <div className="sec-analytics-label">Backspaces</div>
                </div>
                <div className="sec-analytics-card">
                  <div className="sec-analytics-val" style={{ color: typingAnalyzer.stats.pasteCount > 0 ? "#f85149" : "#e6edf3" }}>
                    {typingAnalyzer.stats.pasteCount}
                  </div>
                  <div className="sec-analytics-label">Pastes</div>
                </div>
                <div className="sec-analytics-card">
                  <div className="sec-analytics-val" style={{ color: typingAnalyzer.stats.totalPastedChars > 200 ? "#f85149" : "#e6edf3" }}>
                    {typingAnalyzer.stats.totalPastedChars}
                  </div>
                  <div className="sec-analytics-label">Chars Pasted</div>
                </div>
                <div className="sec-analytics-card">
                  <div className="sec-analytics-val" style={{ color: typingAnalyzer.stats.copyCount > 0 ? "#d29922" : "#e6edf3" }}>
                    {typingAnalyzer.stats.copyCount}
                  </div>
                  <div className="sec-analytics-label">Copies</div>
                </div>
                <div className="sec-analytics-card">
                  <div className="sec-analytics-val" style={{ color: typingAnalyzer.stats.cutCount > 0 ? "#f0883e" : "#e6edf3" }}>
                    {typingAnalyzer.stats.cutCount}
                  </div>
                  <div className="sec-analytics-label">Cuts</div>
                </div>
                <div className="sec-analytics-card">
                  <div className="sec-analytics-val" style={{ color: typingAnalyzer.stats.currentWPM > 150 ? "#f85149" : typingAnalyzer.stats.currentWPM > 80 ? "#d29922" : "#e6edf3" }}>
                    {typingAnalyzer.stats.currentWPM}
                  </div>
                  <div className="sec-analytics-label">WPM (current)</div>
                </div>
                <div className="sec-analytics-card">
                  <div className="sec-analytics-val" style={{ color: typingAnalyzer.stats.peakWPM > 200 ? "#f85149" : "#e6edf3" }}>
                    {typingAnalyzer.stats.peakWPM}
                  </div>
                  <div className="sec-analytics-label">WPM (peak)</div>
                </div>
                <div className="sec-analytics-card" style={{ gridColumn: "span 2" }}>
                  <div className="sec-analytics-val" style={{ color: typingAnalyzer.stats.idleSeconds > 60 ? "#d29922" : "#e6edf3" }}>
                    {typingAnalyzer.stats.idleSeconds}s
                  </div>
                  <div className="sec-analytics-label">Current Idle Time</div>
                </div>
              </div>
              {typingAnalyzer.stats.lastPasteSize > 0 && (
                <div className="sec-analytics-alert" style={{ borderColor: typingAnalyzer.stats.lastPasteSize > 150 ? "#f85149" : "#d29922" }}>
                  <AlertTriangle size={12} color={typingAnalyzer.stats.lastPasteSize > 150 ? "#f85149" : "#d29922"} />
                  Last paste: <strong>{typingAnalyzer.stats.lastPasteSize} chars</strong>
                  &nbsp;— {typingAnalyzer.stats.lastPasteSize > 150 ? "⚠ High suspicion" : "Moderate suspicion"}
                </div>
              )}
              {typingAnalyzer.stats.lastCopySize > 0 && typingAnalyzer.stats.copyCount + typingAnalyzer.stats.cutCount > 0 && (
                <div className="sec-analytics-alert" style={{ borderColor: typingAnalyzer.stats.lastCopySize > 200 ? "#f0883e" : "#484f58" }}>
                  <AlertTriangle size={12} color={typingAnalyzer.stats.lastCopySize > 200 ? "#f0883e" : "#8b949e"} />
                  Last copy/cut: <strong>{typingAnalyzer.stats.lastCopySize} chars</strong>
                  {typingAnalyzer.stats.totalCopiedChars > 0 && (
                    <span style={{ color: "#484f58" }}>&nbsp;· {typingAnalyzer.stats.totalCopiedChars} total copied out</span>
                  )}
                </div>
              )}
              <div className="sec-typing-bar-wrap">
                <div className="sec-typing-bar-label">
                  <span>Typing Ratio</span>
                  <span style={{ color: "#484f58", fontSize: "0.68rem" }}>
                    {typingAnalyzer.stats.keystrokeCount + typingAnalyzer.stats.totalPastedChars === 0
                      ? "—"
                      : `${Math.round((typingAnalyzer.stats.keystrokeCount / Math.max(1, typingAnalyzer.stats.keystrokeCount + typingAnalyzer.stats.totalPastedChars)) * 100)}% typed`}
                  </span>
                </div>
                <div className="sec-typing-bar-track">
                  <div className="sec-typing-bar-typed" style={{
                    width: typingAnalyzer.stats.keystrokeCount + typingAnalyzer.stats.totalPastedChars === 0
                      ? "100%"
                      : `${Math.round((typingAnalyzer.stats.keystrokeCount / Math.max(1, typingAnalyzer.stats.keystrokeCount + typingAnalyzer.stats.totalPastedChars)) * 100)}%`
                  }} />
                </div>
                <div className="sec-typing-bar-legend">
                  <span><span className="sec-legend-dot typed" />Typed</span>
                  <span><span className="sec-legend-dot pasted" />Pasted</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NEW SNIPPET MODAL ─────────────────────────────────────── */}
      {showNewModal && (
        <div className="coderpad-overlay" onClick={() => setShowNewModal(false)}>
          <div className="coderpad-modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">New Snippet</h3>
            <input
              autoFocus
              className="modal-input"
              placeholder="Snippet title…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createNew(newTitle || DEFAULT_SNIPPET_TITLE); }}
            />
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => createNew(newTitle || DEFAULT_SNIPPET_TITLE)}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT MODAL (shown only after test run completes) ───────────────── */}
      {showResultModal && (
        <div className="coderpad-overlay" onClick={() => setShowResultModal(false)}>
          <div className="coderpad-modal result-modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Test Results</h3>
            <div className="result-summary-card">
              <div className="result-summary-title">Submission Result</div>
              <div className="result-summary-meta">
                <span className={`summary-chip ${execStatus === "success" ? "ok" : execStatus === "error" || execStatus === "timeout" ? "bad" : ""}`}>
                  Status: {execStatus}
                </span>
                <span className={`summary-chip ${passRate >= 80 ? "ok" : passRate >= 50 ? "" : "bad"}`}>
                  Score: {passRate}/100
                </span>
                <span className={`summary-chip ${security.totalCount > 0 ? "bad" : "ok"}`}>
                  Flags: {security.totalCount}
                </span>
              </div>
              <p className="result-summary-text">{resultAssessment}</p>
              <div className="result-summary-meta">
                <span className={`summary-chip ${security.highCount > 0 ? "bad" : "ok"}`}>High violations: {security.highCount}</span>
                <span className={`summary-chip ${security.medCount > 0 ? "bad" : "ok"}`}>Medium violations: {security.medCount}</span>
              </div>
              {recentFlags.length > 0 && (
                <div className="result-flags-list">
                  {recentFlags.map(flag => (
                    <div key={flag.id} className="result-flag-item">
                      <span className="result-flag-type">{VIOLATION_META[flag.type].label}:</span>
                      <span>{flag.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!testResults && (
              <div className="tests-empty">
                <TestTube2 size={28} className="empty-icon" />
                <p>No test results returned</p>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setShowResultModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showLlmResultModal && llmResult && (
        <div className="coderpad-overlay" onClick={() => setShowLlmResultModal(false)}>
          <div className="coderpad-modal result-modal llm-result-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">LLM validation</h3>
            {llmResult.error ? (
              <p className="llm-result-error">{llmResult.error}</p>
            ) : (
              <>
                <div className="result-summary-meta" style={{ marginBottom: 10 }}>
                  {llmResult.passed !== null && (
                    <span className={`summary-chip ${llmResult.passed ? "ok" : "bad"}`}>
                      {llmResult.passed ? "Likely passes" : "Needs work"}
                    </span>
                  )}
                  {llmResult.confidence && (
                    <span className="summary-chip">{llmResult.confidence}</span>
                  )}
                </div>
                {llmResult.summary && <p className="llm-result-summary">{llmResult.summary}</p>}
                {llmResult.feedback && (
                  <pre className="llm-result-feedback">{llmResult.feedback}</pre>
                )}
              </>
            )}
            <div className="modal-actions">
              <button className="btn-primary" type="button" onClick={() => setShowLlmResultModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignmentModal && (
        <div className="coderpad-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="coderpad-modal assignment-modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Add/Update problem statement</h3>
            <div className="assignment-llm-generator" style={{ marginBottom: "1rem", display: "flex", gap: "8px", flexDirection: "column" }}>
              <div className="assignment-modal-subtitle" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={14} className="text-yellow-500" />
                Generate Assignment with AI
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  className="modal-input"
                  style={{ flex: 1, margin: 0 }}
                  placeholder="e.g. Binary Search Tree traversal in Java, or Two Sum from Leetcode..."
                  value={llmTopic}
                  onChange={e => setLlmTopic(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); generateFromLlm(); } }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={generateFromLlm}
                  disabled={llmGenerating}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {llmGenerating ? <><Loader2 size={14} className="spin" /> Generating...</> : "Auto-Generate"}
                </button>
              </div>
            </div>
            <div className="assignment-problem-editor">
              <div className="assignment-modal-number-strip" role="listbox" aria-label="Question numbers">
                {modalQuestionStripQuestions.map((q, idx) => (
                  <button
                    key={q.id}
                    type="button"
                    role="option"
                    aria-selected={modalQuestionStripQuestions.length > 0 ? (assignmentId === q.id || (assignmentQuestions.length === 0 && idx === 0)) : false}
                    className={`assignment-modal-number-btn ${(assignmentId === q.id || (assignmentQuestions.length === 0 && idx === 0)) ? "is-active" : ""}`}
                    onClick={() => {
                      if (assignmentQuestions.length > 0) selectModalQuestionById(q.id);
                    }}
                    title={(q.title && q.title.trim()) || `Question ${getDisplayQuestionNumber(q, idx)}`}
                  >
                    {getDisplayQuestionNumber(q, idx)}
                  </button>
                ))}
              </div>
              <div className="assignment-problem-editor-main">
                <div className="assignment-problem-heading-row">
                  <div className="assignment-modal-subtitle">Problem statement</div>
                  <button
                    type="button"
                    className={assignmentId != null ? "btn-remove-problem" : "btn-ghost-sm assignment-clear-draft-btn"}
                    onClick={() => void removeOrClearAssignmentProblem()}
                    disabled={savingAssignment}
                    title={
                      assignmentId != null
                        ? "Delete this problem from CoderPad"
                        : "Reset draft text and tests to defaults"
                    }
                  >
                    <Trash2 size={14} aria-hidden />
                    {assignmentId != null ? "Remove problem" : "Clear draft"}
                  </button>
                </div>
                <ReactQuill
                  theme="snow"
                  className="assignment-problem-quill"
                  value={draftProblemStatement}
                  onChange={setDraftProblemStatement}
                  placeholder={DEFAULT_PROBLEM_STATEMENT}
                />
              </div>
            </div>

            <div className="assignment-testcases-block">
              <button
                type="button"
                className="assignment-testcases-collapse-trigger"
                onClick={() => setAssignmentModalTestsCollapsed(v => !v)}
                aria-expanded={!assignmentModalTestsCollapsed}
                title={assignmentModalTestsCollapsed ? "Expand test cases" : "Collapse test cases"}
              >
                {assignmentModalTestsCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                <span className="assignment-modal-subtitle assignment-modal-subtitle--inline">Test cases (optional)</span>
                <span className="assignment-testcases-count-badge">{draftTestCases.length}</span>
              </button>
              {!assignmentModalTestsCollapsed && (
                <>
                  <p className="assignment-testcases-hint">
                    Output is stdout from the last <strong>Run test cases</strong> in the editor; empty until you run.
                  </p>
                  <div className="assignment-testcases-list">
                    <div className="assignment-testcase-header" aria-hidden>
                      <span className="assignment-testcase-header-cell assignment-testcase-header-cell--index">#</span>
                      <span className="assignment-testcase-header-cell">Input</span>
                      <span className="assignment-testcase-header-cell">Expected output</span>
                      <span className="assignment-testcase-header-cell">Output</span>
                      <span className="assignment-testcase-header-cell">Description</span>
                      <span className="assignment-testcase-header-cell assignment-testcase-header-cell--meta">Hidden</span>
                      <span className="assignment-testcase-header-cell assignment-testcase-header-cell--action" />
                    </div>
                    {draftTestCases.map((tc, idx) => (
                      <div key={idx} className="assignment-testcase-row">
                        <span className="assignment-testcase-index">{idx + 1}</span>
                        <input
                          className="assignment-testcase-input"
                          placeholder="stdin / input"
                          value={tc.input ?? ""}
                          onChange={e => updateDraftTestCase(idx, "input", e.target.value)}
                          aria-label={`Test ${idx + 1} input`}
                        />
                        <input
                          className="assignment-testcase-input"
                          placeholder="Expected stdout"
                          value={tc.expected_output}
                          onChange={e => updateDraftTestCase(idx, "expected_output", e.target.value)}
                          aria-label={`Test ${idx + 1} expected output`}
                        />
                        <div
                          className="assignment-testcase-actual"
                          title={tc.actual_output || undefined}
                          aria-label={`Test ${idx + 1} actual output`}
                        >
                          {tc.actual_output ? tc.actual_output : "—"}
                        </div>
                        <input
                          className="assignment-testcase-input"
                          placeholder="Label / notes"
                          value={tc.description ?? ""}
                          onChange={e => updateDraftTestCase(idx, "description", e.target.value)}
                          aria-label={`Test ${idx + 1} description`}
                        />
                        <label className="assignment-testcase-lock">
                          <input
                            type="checkbox"
                            checked={tc.locked === true}
                            onChange={e => updateDraftTestCase(idx, "locked", e.target.checked)}
                          />
                          Hidden
                        </label>
                        <button type="button" className="btn-ghost-sm" onClick={() => removeDraftTestCase(idx)}>Remove</button>
                      </div>
                    ))}
                    <button type="button" className="btn-ghost-sm" onClick={addDraftTestCase}>+ Add test case</button>
                  </div>
                </>
              )}
            </div>

            <div className="assignment-modal-subtitle">Target candidates</div>
            <div className="assignment-target-modes" role="radiogroup" aria-label="Who receives this assignment">
              <label className="assignment-target-mode-row">
                <input
                  type="radio"
                  name="coderpad-assignment-target"
                  checked={assignmentTargetMode === "all"}
                  onChange={() => {
                    setAssignmentTargetMode("all");
                    setDraftSelectedCandidateIds([]);
                    setCandidateAssignSearch("");
                    setCandidateSuggestions([]);
                  }}
                />
                <span>Send to all candidates</span>
              </label>
              <label className="assignment-target-mode-row">
                <input
                  type="radio"
                  name="coderpad-assignment-target"
                  checked={assignmentTargetMode === "single"}
                  onChange={() => {
                    setAssignmentTargetMode("single");
                    setDraftSelectedCandidateIds(prev => prev.slice(0, 1));
                    setCandidateAssignSearch("");
                    setCandidateSuggestions([]);
                  }}
                />
                <span>Send to one candidate</span>
              </label>
              <label className="assignment-target-mode-row">
                <input
                  type="radio"
                  name="coderpad-assignment-target"
                  checked={assignmentTargetMode === "multiple"}
                  onChange={() => {
                    setAssignmentTargetMode("multiple");
                  }}
                />
                <span>Send to multiple candidates</span>
              </label>
            </div>
            {(assignmentTargetMode === "single" || assignmentTargetMode === "multiple") && (
              <>
                <p className="assignment-targeting-subtitle">
                  {assignmentTargetMode === "single"
                    ? "Use the search bar below — pick one person from the suggestions."
                    : "Type a name or email — suggestions come from your candidate database."}
                </p>
                <div className="assignment-candidate-search-wrap assignment-candidate-search-wrap--dropdown">
                  <Search size={14} className="assignment-candidate-search-icon" aria-hidden />
                  <input
                    type="search"
                    className="assignment-candidate-search"
                    placeholder={
                      assignmentTargetMode === "single"
                        ? "Search one candidate by name or email…"
                        : "Search candidates by name or email…"
                    }
                    value={candidateAssignSearch}
                    onChange={e => setCandidateAssignSearch(e.target.value)}
                    aria-label={
                      assignmentTargetMode === "single"
                        ? "Search for one candidate to assign"
                        : "Search candidates to assign"
                    }
                    autoComplete="off"
                  />
                  {candidateSearchLoading && (
                    <span className="assignment-candidate-search-spinner"><Loader2 size={14} className="spin" /></span>
                  )}
                </div>
                {candidateSuggestions.length > 0 && (
                  <ul className="assignment-candidate-suggest" role="listbox">
                    {candidateSuggestions
                      .filter(c =>
                        assignmentTargetMode === "single"
                          ? true
                          : !draftSelectedCandidateIds.includes(c.id)
                      )
                      .map(candidate => (
                        <li key={candidate.id} role="option">
                          <button
                            type="button"
                            className="assignment-candidate-suggest-item"
                            onClick={() => addDraftSelectedCandidate(candidate)}
                          >
                            <span className="assignment-candidate-suggest-name">{candidate.display_name}</span>
                            <span className="assignment-candidate-suggest-email">{candidate.username}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
                {!candidateSearchLoading &&
                  candidateAssignSearch.trim().length > 0 &&
                  candidateSuggestions.filter(c =>
                    assignmentTargetMode === "single"
                      ? true
                      : !draftSelectedCandidateIds.includes(c.id)
                  ).length === 0 && (
                    <div className="assignment-candidate-empty">No matching candidates</div>
                  )}
                <div className="assignment-selected-label">
                  {assignmentTargetMode === "single" ? "Selected candidate" : "Selected"}
                </div>
                <div className="assignment-selected-chips">
                  {draftSelectedCandidateIds.length === 0 ? (
                    <span className="assignment-candidate-empty">
                      {assignmentTargetMode === "single"
                        ? "No one selected yet — search and choose one candidate above"
                        : "No one selected yet — pick from suggestions above"}
                    </span>
                  ) : (
                    draftSelectedCandidateIds.map(id => {
                      const row = candidateLabelById[id];
                      const label = row?.display_name ?? `User #${id}`;
                      const sub = row?.username ?? "";
                      return (
                        <span key={id} className="assignment-candidate-chip">
                          <span className="assignment-candidate-chip-text" title={sub}>
                            {label}
                            {sub ? <span className="assignment-candidate-chip-sub"> ({sub})</span> : null}
                          </span>
                          <button
                            type="button"
                            className="assignment-candidate-chip-remove"
                            onClick={() => removeDraftSelectedCandidate(id)}
                            aria-label={`Remove ${label}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
              </>
            )}
            <div className="assignment-modal-footer-nav">
              <button
                type="button"
                className="assignment-modal-nav-btn"
                onClick={() => goToAdjacentModalQuestion(-1)}
                disabled={!canGoToPreviousModalQuestion || savingAssignment}
                title="Previous question"
                aria-label="Previous question"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                className="assignment-modal-nav-btn"
                onClick={handleModalNextQuestion}
                disabled={savingAssignment}
                title="Next question"
                aria-label="Next question"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowAssignmentModal(false)}>Cancel</button>
              <button
                className="btn-ghost"
                onClick={() => void saveAssignmentFromModal({ closeAfterSave: true })}
                disabled={savingAssignment}
              >
                {savingAssignment ? "Saving…" : "Save & exit"}
              </button>
              <button
                className="btn-primary"
                onClick={() => void saveAssignmentFromModal()}
                disabled={savingAssignment}
              >
                {savingAssignment ? "Saving…" : "Save assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR: column 1 = Files (collapsible), column 2 = Problem statement ── */}
      <aside className="coderpad-sidebar">
        <div className="coderpad-sidebar-columns">
          <div className={`coderpad-sidebar-col coderpad-sidebar-col--files ${filesCollapsed ? "is-collapsed" : ""}`}>
            <div className="explorer-top">
              <div className="explorer-files-header">
                <FolderOpen size={14} className="explorer-files-icon" />
                <span className="explorer-files-label">Files</span>
                <div className="explorer-files-actions">
                  <button
                    type="button"
                    className="explorer-icon-btn"
                    onClick={() => setFilesCollapsed(v => !v)}
                    title={filesCollapsed ? "Expand files column" : "Collapse files column"}
                  >
                    {filesCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                  </button>
                  {!filesCollapsed && (
                    <>
                      <button type="button" className="explorer-icon-btn" onClick={() => setShowNewModal(true)} title="New file">
                        <FilePlus size={15} />
                      </button>
                      <button type="button" className="explorer-icon-btn" title="New folder" disabled aria-hidden>
                        <FolderPlus size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!filesCollapsed && (
              <div className="snippet-list explorer-tree">
                <div className="snippet-empty snippet-empty--session">
                  <FileCode2 size={28} className="empty-icon" />
                  <p className="snippet-session-title">Current workspace</p>
                  <p className="snippet-session-hint">
                    Previous files are not listed here. Use Save / Submit to keep your work on the server.
                  </p>
                  <button type="button" className="btn-ghost-sm" onClick={() => setShowNewModal(true)}>
                    New file
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="coderpad-sidebar-col coderpad-sidebar-col--problem">
            <div className="sidebar-problem-card sidebar-problem-card--fill">
              <div className="sidebar-problem-layout">
                {problemRailQuestions.length > 0 && (
                  <div className="sidebar-problem-number-rail" role="listbox" aria-label="CoderPad problem numbers">
                    <span className="sidebar-problem-number-rail-label">Q</span>
                    {problemRailQuestions.map((q, idx) => (
                      <button
                        key={q.id}
                        type="button"
                        role="option"
                        aria-selected={assignmentQuestions.length > 0 ? assignmentId === q.id : idx === 0}
                        className={`sidebar-problem-number-btn ${(assignmentQuestions.length > 0 ? assignmentId === q.id : idx === 0) ? "is-active" : ""}`}
                        title={(q.title && q.title.trim()) || `Problem #${getDisplayQuestionNumber(q, idx)}`}
                        onClick={() => {
                          if (assignmentQuestions.length > 0) selectCoderpadQuestion(q.id);
                        }}
                      >
                        {getDisplayQuestionNumber(q, idx)}
                      </button>
                    ))}
                  </div>
                )}
                <div className="sidebar-problem-main">
                  <div className="sidebar-problem-title">
                    Problem Statement{activeQuestionNumber ? ` #${activeQuestionNumber}` : ""}
                    {isStaff && <span className="sidebar-staff-pill">Authoring</span>}
                  </div>
                  <div 
                    className="sidebar-problem-text coderpad-markdown" 
                    dangerouslySetInnerHTML={{ __html: description.trim() ? description : "No problem statement yet." }}
                  />
                </div>
              </div>
            </div>
            {isStaff && (
              <div className="sidebar-assignment-footer">
                <button
                  type="button"
                  className="btn-save-assignment"
                  onClick={openAssignmentModal}
                >
                  Add/Update problem statement
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────── */}
      <div className="coderpad-main">
        {/* ── TOP BAR ────────────────────────────── */}
        <header className="coderpad-topbar">
          <div className="topbar-left">
            <div className="topbar-left-inner">
              <div className="topbar-title-row">
                <img
                  src="/images/logos/whitebox-learning-logo.png"
                  alt="White Box Learning logo"
                  className="topbar-brand-logo"
                />
                <input
                  className="snippet-title-input"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
                  placeholder={DEFAULT_SNIPPET_TITLE}
                />
                {isDirty && <span className="dirty-dot" title="Unsaved changes" />}
              </div>
              <p className="coderpad-login-line" title="Session role">
                {loginStatusLine}
              </p>
              {teamRole === "candidate" && (
                <div className="coderpad-llm-row">
                  <button
                    type="button"
                    className="btn-llm-validate"
                    onClick={() => void runLlmValidate()}
                    disabled={llmValidating}
                    title="Validate with the server-configured OpenAI key (problem + code + test cases)"
                  >
                    {llmValidating ? (
                      <Loader2 size={14} className="spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    LLM validate
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="topbar-center">
            {/* Language dropdown */}
            <div className="lang-dropdown" ref={langDropRef}>
              <button className="lang-selector" onClick={() => setLanguageOpen(v => !v)}>
                <span className="lang-icon"><LangIcon cfg={langCfg} size="md" /></span>
                <span className="lang-label">{langCfg.label}</span>
                <ChevronDown size={14} className={`lang-chevron ${languageOpen ? "open" : ""}`} />
              </button>
              {languageOpen && (
                <div className="lang-menu">
                  {Object.entries(LANGUAGES).map(([key, lc]) => (
                    <button
                      key={key}
                      className={`lang-option ${language === key ? "lang-option--active" : ""}`}
                      onClick={() => {
                        if (language !== key && !selectedSnippet) {
                          setCode(lc.starter);
                        }
                        setLanguage(key);
                        setLanguageOpen(false);
                        setIsDirty(true);
                      }}
                    >
                      <span className="lang-option-icon-wrap"><LangIcon cfg={lc} size="md" /></span>
                      <span>{lc.label}</span>
                      {language === key && <Check size={12} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="topbar-right">
            {isSplitScreen && (
              <span className="topbar-split-chip" title="Split-screen mode detected">
                Split view
              </span>
            )}
            {/* ── Security Badge ── */}
            <button
              className="sec-status-badge"
              style={{ borderColor: securityStatusColor + "50", color: securityStatusColor }}
              onClick={() => setShowSecurityPanel(v => !v)}
              title="Security monitor"
            >
                {security.highCount > 0
                  ? <ShieldAlert size={13} />
                  : <ShieldCheck size={13} />}
                <span>{securityLabel}</span>
                {security.totalCount > 0 && (
                  <span className="sec-badge-high" style={{ background: securityStatusColor }}>{security.totalCount}</span>
                )}
              </button>
            {selectedSnippet && (
              <button className="btn-icon btn-danger-hover" onClick={deleteSnippet} title="Delete snippet">
                <Trash2 size={15} />
              </button>
            )}
            <button
              type="button"
              className="btn-save"
              onClick={() => saveSnippet()}
              disabled={saving}
              title="Save (Ctrl+S)"
            >
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
              Save
            </button>
            <label className="autosave-toggle autosave-toggle--topbar">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={e => setAutoSave(e.target.checked)}
              />
              <span className="autosave-track" aria-hidden />
              <span className="autosave-label">Auto-save files</span>
            </label>
            <button
              className="btn-run"
              onClick={() => void runTestCases()}
              disabled={runBusy !== false}
              title="Run test cases (Ctrl+Enter)"
            >
              {runBusy === "run" ? <Loader2 size={15} className="spin" /> : <Play size={15} />}
              <span>{runBusy === "run" ? "Running…" : "Run test cases"}</span>
            </button>
            <button
              className="btn-submit"
              onClick={() => void submitSolution()}
              disabled={runBusy !== false}
              title="Save and run tests (Ctrl+Shift+Enter)"
            >
              {runBusy === "submit" ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
              <span>{runBusy === "submit" ? "Submitting…" : "Submit"}</span>
            </button>
          </div>
        </header>

        {/* ── RESIZABLE PANELS (editor | preview + terminal) ───── */}
        <div className="coderpad-panels-wrap coderpad-panels-wrap--vertical">
          <PanelGroup direction="vertical">
            {/* Editor Panel */}
            <Panel defaultSize={60} minSize={30}>
              <div className="editor-panel">
                <div className="editor-body">
                  <MonacoEditor
                    height="100%"
                    language={langCfg.monaco}
                    value={code}
                    theme="vs-dark"
                    onChange={(val) => { setCode(val || ""); setIsDirty(true); }}
                    onMount={(editor, monaco) => {
                      editorRef.current = editor;
                      typingAnalyzer.setupEditor(editor);
                      if (monaco) {
                        const { KeyMod, KeyCode } = monaco;
                        const blockPaste = () =>
                          toastCoderpadClipboardDenied("Paste is disabled in CoderPad");
                        const blockCopy = () =>
                          toastCoderpadClipboardDenied("Copy is disabled in CoderPad");
                        const blockCut = () =>
                          toastCoderpadClipboardDenied("Cut is disabled in CoderPad");
                        editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyV, blockPaste);
                        editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyV, blockPaste);
                        editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyC, blockCopy);
                        editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyX, blockCut);
                      }
                    }}
                    options={{
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                      fontLigatures: true,
                      minimap: { enabled: false },
                      lineNumbers: "on",
                      renderLineHighlight: "all",
                      scrollBeyondLastLine: false,
                      tabSize: 4,
                      insertSpaces: true,
                      wordWrap: "on",
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      bracketPairColorization: { enabled: true },
                      guides: { bracketPairs: true },
                      suggestOnTriggerCharacters: true,
                      dragAndDrop: false,
                    }}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="resize-handle resize-handle-vertical">
              <div className="resize-handle-bar resize-handle-bar-horizontal" />
            </PanelResizeHandle>

            {/* Bottom panel: test cases — collapsible Panel shrinks to a bottom rail */}
            <Panel
              ref={testsPanelRef}
              id="coderpad-tests"
              defaultSize={36}
              minSize={14}
              maxSize={80}
              collapsible
              collapsedSize={6}
              onCollapse={() => setTestsCollapsed(true)}
              onExpand={() => setTestsCollapsed(false)}
            >
              <div className={`ide-bottom-stack ${testsCollapsed ? "ide-bottom-stack--rail" : ""}`}>
                {testsCollapsed ? (
                  <div className="tests-rail tests-rail-horizontal" onClick={toggleTestsPanel} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', borderTop: '1px solid #30363d', background: '#0d1117' }}>
                    <button
                      type="button"
                      className="tests-rail-toggle"
                      title="Expand test cases"
                      aria-expanded={false}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', background: 'transparent', border: 'none' }}
                    >
                      <ChevronUp size={16} aria-hidden />
                      <TestTube2 size={16} aria-hidden />
                      <span className="tests-rail-count">{testCases.length}</span>
                      <span className="tests-rail-label">Tests</span>
                    </button>
                  </div>
                ) : (
                  <div className="output-panel ide-terminal-panel" style={{ borderTop: '1px solid #30363d' }}>
                    <div className="tests-body">
                    <div className="tests-header">
                      <button
                        type="button"
                        className="tests-collapse-btn"
                        onClick={toggleTestsPanel}
                        aria-expanded={!testsCollapsed}
                        title="Collapse test panel"
                      >
                        <ChevronDown size={14} aria-hidden />
                        <span className="tests-count">{testCases.length} test case{testCases.length !== 1 ? "s" : ""}</span>
                      </button>
                      <div className="tests-header-actions">
                        {isStaff && (
                          <button type="button" className="btn-ghost-sm" onClick={addTestCase}>
                            <Plus size={13} /> Add test
                          </button>
                        )}
                        {!isStaff && (
                          <button type="button" className="btn-ghost-sm" onClick={() => setShowAllTests(v => !v)}>
                            {showAllTests ? "Show Fewer" : "Show All"}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="tests-list">
                      {testCases.length === 0 ? (
                        <div className="tests-empty">
                          <TestTube2 size={28} className="empty-icon" />
                          <p>No test cases</p>
                        </div>
                      ) : (
                        visibleRows.map(({ tc, idx: testIdx }, rowNum) => {
                          const result = testResults?.[testIdx];
                          const passed = result?.passed;
                          const hideValues = !!tc.locked && !isStaff;
                          return (
                            <div key={testIdx} className={`test-case ${result ? (passed ? "test-pass" : "test-fail") : ""}`}>
                              <div className="test-case-header">
                                <div className="test-case-num">
                                  {result ? (
                                    passed
                                      ? <CheckCircle2 size={14} className="text-emerald-400" />
                                      : <XCircle size={14} className="text-red-400" />
                                  ) : (
                                    <span className="test-num-badge">{rowNum + 1}</span>
                                  )}
                                  <input
                                    className="test-desc-input"
                                    value={tc.description || ""}
                                    placeholder={`Test case ${testIdx + 1}`}
                                    onChange={e => updateTestCase(testIdx, "description", e.target.value)}
                                    readOnly={!!tc.locked && !isStaff}
                                  />
                                  {tc.locked && <Lock size={12} className="test-lock-icon" />}
                                  {isStaff && (
                                    <label className="test-lock-toggle">
                                      <input
                                        type="checkbox"
                                        checked={!!tc.locked}
                                        onChange={e => updateTestCase(testIdx, "locked", e.target.checked)}
                                      />
                                      <span>Hidden</span>
                                    </label>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="btn-remove"
                                  onClick={() => removeTestCase(testIdx)}
                                  disabled={!!tc.locked && !isStaff}
                                  title={tc.locked && !isStaff ? "Locked" : "Remove"}
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="test-case-fields">
                                <div className="test-field">
                                  <label>Input</label>
                                  <textarea
                                    data-gramm="false"
                                    className="test-textarea"
                                    value={hideValues ? "•••• hidden ••••" : (tc.input || "")}
                                    placeholder={hideValues ? "Hidden from candidate" : "stdin input…"}
                                    rows={2}
                                    onChange={e => updateTestCase(testIdx, "input", e.target.value)}
                                    readOnly={hideValues}
                                  />
                                </div>
                                <div className="test-field">
                                  <label>Expected Output</label>
                                  <textarea
                                    data-gramm="false"
                                    className="test-textarea"
                                    value={hideValues ? "•••• hidden ••••" : tc.expected_output}
                                    placeholder={hideValues ? "Hidden from candidate" : "expected stdout…"}
                                    rows={2}
                                    onChange={e => updateTestCase(testIdx, "expected_output", e.target.value)}
                                    readOnly={hideValues}
                                  />
                                </div>
                                {result && !passed && (
                                  <div className="test-diff">
                                    <div className="diff-row">
                                      <span className="diff-label expected">Expected:</span>
                                      <code className="diff-code">{result.expected}</code>
                                    </div>
                                    <div className="diff-row">
                                      <span className="diff-label actual">Got:</span>
                                      <code className="diff-code">{result.actual ?? "(no output)"}</code>
                                    </div>
                                    {result.error && (
                                      <div className="diff-row">
                                        <span className="diff-label error">Error:</span>
                                        <code className="diff-code error-text">{result.error}</code>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>

      {/* ── STYLES ──────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ──────────────── SECURITY STYLES ──────────────── */

        /* Violation warning toast (top-center) */
        .sec-warning-overlay {
          position: fixed; top: 0; left: 0; right: 0; z-index: 300;
          display: flex; justify-content: center;
          padding-top: 16px;
          pointer-events: none;
          animation: secWarnIn .25s ease;
        }
        @keyframes secWarnIn {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sec-warning-card {
          pointer-events: all;
          display: flex; align-items: center; gap: 12px;
          background: #1c0a0a; border: 1px solid #f8514960;
          border-radius: 12px; padding: 12px 16px;
          box-shadow: 0 8px 32px rgba(248,81,73,.25), 0 0 0 1px rgba(248,81,73,.15);
          max-width: 560px; width: calc(100vw - 40px);
        }
        .sec-warning-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: #f8514918; border: 1px solid #f8514940;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sec-warning-body { flex: 1; min-width: 0; }
        .sec-warning-title { font-size: 0.82rem; font-weight: 700; color: #f85149; margin-bottom: 3px; }
        .sec-warning-msg   { font-size: 0.76rem; color: #8b949e; line-height: 1.4; }
        .sec-warn-close {
          background: transparent; border: none; color: #484f58;
          cursor: pointer; font-size: 0.8rem; padding: 4px 6px;
          border-radius: 4px; transition: all .15s; flex-shrink: 0;
        }
        .sec-warn-close:hover { color: #f85149; background: #f8514915; }
        .sec-lock-overlay {
          position: fixed;
          inset: 0;
          z-index: 340;
          background: rgba(1, 4, 9, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .sec-lock-card {
          width: min(460px, 92vw);
          border: 1px solid #f8514950;
          background: #161b22;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 12px 42px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
        }
        .sec-lock-title {
          color: #f85149;
          font-size: 1rem;
          font-weight: 700;
        }
        .sec-lock-msg {
          margin: 0;
          color: #c9d1d9;
          font-size: 0.82rem;
          line-height: 1.45;
        }
        .sec-lock-actions {
          margin-top: 4px;
          display: flex;
          justify-content: center;
        }

        /* Security badge in topbar */
        .sec-status-badge {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 20px;
          border: 1px solid; background: transparent;
          font-size: 0.73rem; font-weight: 600; cursor: pointer;
          transition: all .2s; white-space: nowrap;
        }
        .sec-status-badge:hover { opacity: .8; }
        .sec-badge-high {
          display: inline-flex; align-items: center; justify-content: center;
          width: 17px; height: 17px; border-radius: 50%;
          font-size: 0.65rem; font-weight: 700; color: #fff;
        }

        /* Floating security panel */
        .sec-panel {
          position: fixed; right: 16px; top: 68px; z-index: 150;
          width: 320px; max-height: calc(100vh - 90px);
          background: #0d1117; border: 1px solid #30363d;
          border-radius: 12px; display: flex; flex-direction: column;
          box-shadow: 0 8px 32px rgba(0,0,0,.5);
          animation: secPanelIn .2s ease;
          overflow: hidden;
        }
        @keyframes secPanelIn {
          from { opacity: 0; transform: translateX(20px) scale(.98); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        .sec-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border-bottom: 1px solid #21262d;
          background: #161b22;
        }
        .sec-panel-stats {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-bottom: 1px solid #21262d;
          background: #0d1117; font-size: 0.74rem; flex-wrap: wrap;
        }
        .sec-stat {
          display: flex; align-items: center; gap: 4px; font-weight: 600;
        }
        .sec-fs-btn {
          display: flex; align-items: center; gap: 5px; margin-left: auto;
          padding: 4px 10px; border-radius: 6px; border: 1px solid #388bfd60;
          background: #1c2a3a; color: #58a6ff; font-size: 0.71rem; cursor: pointer;
          transition: all .15s;
        }
        .sec-fs-btn:hover { background: #233a52; }
        .sec-events-list {
          flex: 1; overflow-y: auto; padding: 8px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .sec-events-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 8px; padding: 32px 16px;
          color: #484f58; font-size: 0.8rem;
        }
        .sec-event-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 9px 10px; border-radius: 8px; border: 1px solid #21262d;
          background: #161b22; transition: border-color .15s;
        }
        .sec-event-item:hover { border-color: #30363d; }
        .sec-event-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
        }
        .sec-event-content { flex: 1; min-width: 0; }
        .sec-event-type { font-size: 0.74rem; font-weight: 700; margin-bottom: 2px; }
        .sec-event-msg  { font-size: 0.72rem; color: #7d8590; line-height: 1.4; word-break: break-word; }
        .sec-event-time { font-size: 0.68rem; color: #484f58; margin-top: 3px; }

        /* Security panel tabs */
        .sec-panel-tabs {
          display: flex; border-bottom: 1px solid #21262d; background: #0d1117; flex-shrink: 0;
        }
        .sec-panel-tab {
          flex: 1; padding: 8px 10px; font-size: 0.74rem; font-weight: 500;
          background: transparent; border: none; color: #7d8590; cursor: pointer;
          border-bottom: 2px solid transparent; transition: all .15s;
          display: flex; align-items: center; justify-content: center; gap: 4px;
        }
        .sec-panel-tab:hover { color: #e6edf3; }
        .sec-panel-tab.active { color: #58a6ff; border-bottom-color: #58a6ff; }

        /* Analytics tab */
        .sec-analytics {
          flex: 1; overflow-y: auto; padding: 10px; display: flex;
          flex-direction: column; gap: 10px;
        }
        .sec-analytics-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
        }
        .sec-analytics-card {
          background: #161b22; border: 1px solid #21262d; border-radius: 8px;
          padding: 10px; text-align: center; transition: border-color .15s;
        }
        .sec-analytics-card:hover { border-color: #30363d; }
        .sec-analytics-val {
          font-size: 1.3rem; font-weight: 700; color: #e6edf3;
          font-family: 'JetBrains Mono', monospace; line-height: 1;
        }
        .sec-analytics-label {
          font-size: 0.65rem; color: #484f58; margin-top: 4px;
          text-transform: uppercase; letter-spacing: .06em;
        }
        .sec-analytics-alert {
          display: flex; align-items: center; gap: 7px; padding: 8px 10px;
          border-radius: 8px; border: 1px solid; background: #1c1206;
          font-size: 0.74rem; color: #8b949e;
        }

        /* Typing ratio bar */
        .sec-typing-bar-wrap { display: flex; flex-direction: column; gap: 5px; }
        .sec-typing-bar-label {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.72rem; color: #7d8590; font-weight: 500;
        }
        .sec-typing-bar-track {
          height: 8px; background: #f8514930; border-radius: 4px; overflow: hidden;
          position: relative;
        }
        .sec-typing-bar-typed {
          height: 100%; background: #3fb950; border-radius: 4px;
          transition: width .6s ease; min-width: 3px;
        }
        .sec-typing-bar-legend {
          display: flex; gap: 12px; font-size: 0.68rem; color: #484f58;
        }
        .sec-legend-dot {
          display: inline-block; width: 8px; height: 8px;
          border-radius: 50%; margin-right: 4px; vertical-align: middle;
        }
        .sec-legend-dot.typed  { background: #3fb950; }
        .sec-legend-dot.pasted { background: #f85149; }
        /* ──────────────── END SECURITY ──────────────── */

        .coderpad-root {
          display: flex;
          height: 100vh;
          width: 100vw;
          background: #0d1117;
          color: #e6edf3;
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
        }

        /* ── OVERLAY / MODAL ── */
        .coderpad-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn .15s ease;
        }
        .coderpad-welcome-overlay { z-index: 500; }
        .welcome-modal { max-width: 420px; width: 92vw; }
        .welcome-modal-role {
          margin: 0;
          font-size: 0.88rem;
          color: #58a6ff;
          font-weight: 600;
        }
        .welcome-modal-hint {
          margin: 0;
          font-size: 0.8rem;
          color: #8b949e;
          line-height: 1.5;
        }
        .welcome-role-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 6px;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .coderpad-modal {
          background: #161b22; border: 1px solid #30363d; border-radius: 12px;
          padding: 24px; width: 380px; display: flex; flex-direction: column; gap: 16px;
          animation: slideUp .2s ease;
        }
        .result-modal {
          width: min(760px, 92vw);
          max-height: 82vh;
        }
        .result-modal-tests {
          max-height: 46vh;
          overflow-y: auto;
          padding: 0;
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-title { font-size: 1rem; font-weight: 600; color: #e6edf3; }
        .modal-input {
          background: #0d1117; border: 1px solid #30363d; border-radius: 8px;
          color: #e6edf3; padding: 10px 12px; font-size: 0.875rem;
          outline: none; transition: border-color .15s;
        }
        .modal-input:focus { border-color: #58a6ff; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }

        /* ── SIDEBAR (two columns: files | problem) ── */
        .coderpad-sidebar {
          flex: 0 0 min(520px, 46vw);
          min-width: 340px;
          max-width: 640px;
          width: min(520px, 46vw);
          background: linear-gradient(180deg, #141a22 0%, #0f1419 100%);
          border-right: 1px solid #21262d;
          border-left: 3px solid #306998;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: inset -1px 0 0 rgba(255,255,255,0.03);
        }
        .coderpad-sidebar-columns {
          display: flex;
          flex-direction: row;
          flex: 1;
          min-height: 0;
          align-items: stretch;
        }
        .coderpad-sidebar-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          min-width: 0;
        }
        .coderpad-sidebar-col--files {
          flex: 1 1 42%;
          max-width: 52%;
          border-right: 1px solid #21262d;
          background: #0f1419;
        }
        .coderpad-sidebar-col--files.is-collapsed {
          flex: 0 0 44px;
          max-width: 44px;
        }
        .coderpad-sidebar-col--files.is-collapsed .explorer-files-label {
          display: none;
        }
        .coderpad-sidebar-col--files.is-collapsed .explorer-top {
          padding: 10px 6px;
        }
        .coderpad-sidebar-col--files.is-collapsed .explorer-files-header {
          flex-direction: column;
          gap: 6px;
          align-items: center;
        }
        .coderpad-sidebar-col--files.is-collapsed .explorer-files-actions {
          margin-left: 0;
          flex-direction: column;
        }
        .coderpad-sidebar-col--problem {
          flex: 1 1 58%;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .coderpad-assignment-picker {
          flex-shrink: 0;
          margin: 10px 10px 0;
          padding: 8px 10px;
          background: #0d1117;
          border: 1px solid #21262d;
          border-radius: 8px;
          max-height: min(220px, 32vh);
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .coderpad-assignment-picker-title {
          font-size: 0.7rem;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .coderpad-assignment-picker-list {
          list-style: none;
          margin: 0;
          padding: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .coderpad-assignment-picker-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          text-align: left;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: #111926;
          color: #c9d1d9;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background .12s, border-color .12s;
        }
        .coderpad-assignment-picker-item:hover {
          background: #161b22;
          border-color: #30363d;
        }
        .coderpad-assignment-picker-item.is-active {
          border-color: #306998;
          background: #1a2332;
          color: #e6edf3;
        }
        .coderpad-assignment-picker-order {
          flex: 0 0 auto;
          min-width: 1.25rem;
          font-variant-numeric: tabular-nums;
          color: #7d8590;
          font-size: 0.68rem;
        }
        .coderpad-assignment-picker-item.is-active .coderpad-assignment-picker-order {
          color: #58a6ff;
        }
        .coderpad-assignment-picker-label {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sidebar-problem-card {
          margin: 10px 10px 8px;
          background: #111926;
          border: 1px solid #2b3544;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .sidebar-problem-layout {
          display: flex;
          gap: 10px;
          height: 100%;
          min-height: 0;
        }
        .sidebar-problem-number-rail {
          flex: 0 0 34px;
          min-width: 34px;
          border-right: 1px solid #2b3544;
          padding-right: 8px;
          padding-top: 2px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow-y: auto;
        }
        .sidebar-problem-number-rail-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 18px;
          font-size: 0.66rem;
          color: #7d8590;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-bottom: 1px solid #2b3544;
          padding-bottom: 2px;
          margin-bottom: 2px;
        }
        .sidebar-problem-number-btn {
          border: 1px solid #30363d;
          border-radius: 6px;
          background: #111926;
          color: #c9d1d9;
          font-size: 0.72rem;
          font-weight: 600;
          min-height: 26px;
          cursor: pointer;
          font-variant-numeric: tabular-nums;
          transition: border-color .12s, color .12s, background .12s;
        }
        .sidebar-problem-number-btn:hover {
          border-color: #30363d;
          color: #c9d1d9;
        }
        .sidebar-problem-number-btn.is-active {
          border-color: #306998;
          background: #1a2332;
          color: #58a6ff;
        }
        .sidebar-problem-main {
          flex: 1;
          min-width: 0;
        }
        .sidebar-problem-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 0.7rem;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 5px;
          font-weight: 600;
        }
        .sidebar-problem-text {
          font-size: 0.78rem;
          color: #e6edf3;
          line-height: 1.45;
          margin: 0;
          white-space: pre-wrap;
        }
        .coderpad-sidebar-col--problem .sidebar-problem-card--fill {
          margin: 10px 10px 8px;
          margin-top: 10px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }
        .sidebar-assignment-footer {
          padding: 0 10px 10px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .btn-new-assignment {
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px dashed #30363d;
          background: transparent;
          color: #8b949e;
          font-size: 0.78rem;
          cursor: pointer;
          transition: border-color .15s, color .15s, background .15s;
        }
        .btn-new-assignment:hover {
          border-color: #58a6ff;
          color: #58a6ff;
          background: rgba(88, 166, 255, 0.06);
        }
        .assignment-targeting-subtitle {
          font-size: 0.72rem;
          color: #7d8590;
          line-height: 1.4;
        }
        .assignment-candidate-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .assignment-candidate-search-icon {
          position: absolute;
          left: 10px;
          color: #7d8590;
          pointer-events: none;
        }
        .assignment-candidate-search {
          width: 100%;
          padding: 8px 10px 8px 32px;
          font-size: 0.78rem;
          border-radius: 8px;
          border: 1px solid #30363d;
          background: #0d1117;
          color: #e6edf3;
          outline: none;
        }
        .assignment-candidate-search::placeholder {
          color: #6e7681;
        }
        .assignment-candidate-search:focus {
          border-color: #58a6ff;
          box-shadow: 0 0 0 2px rgba(56, 139, 253, 0.15);
        }
        .assignment-target-modes {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 4px;
        }
        .assignment-target-mode-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.8rem;
          color: #e6edf3;
          line-height: 1.35;
          cursor: pointer;
          user-select: none;
        }
        .assignment-target-mode-row input {
          accent-color: #58a6ff;
          width: 16px;
          height: 16px;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .assignment-candidate-search-wrap--dropdown {
          margin-top: 4px;
        }
        .assignment-candidate-search-spinner {
          position: absolute;
          right: 10px;
          color: #8b949e;
          display: flex;
          align-items: center;
        }
        .assignment-candidate-suggest {
          list-style: none;
          margin: 0;
          padding: 0;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #30363d;
          border-radius: 8px;
          background: #0d1117;
        }
        .assignment-candidate-suggest-item {
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          border: none;
          border-bottom: 1px solid #21262d;
          background: transparent;
          color: #e6edf3;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.8rem;
        }
        .assignment-candidate-suggest-item:last-child {
          border-bottom: none;
        }
        .assignment-candidate-suggest-item:hover {
          background: #21262d;
        }
        .assignment-candidate-suggest-name { font-weight: 600; }
        .assignment-candidate-suggest-email {
          font-size: 0.72rem;
          color: #8b949e;
        }
        .assignment-selected-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 8px;
        }
        .assignment-selected-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          min-height: 28px;
          align-items: center;
        }
        .assignment-candidate-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 6px 4px 10px;
          border-radius: 999px;
          background: #21262d;
          border: 1px solid #30363d;
          font-size: 0.75rem;
          color: #c9d1d9;
          max-width: 100%;
        }
        .assignment-candidate-chip-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 220px;
        }
        .assignment-candidate-chip-sub {
          color: #8b949e;
          font-weight: 400;
        }
        .assignment-candidate-chip-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border: none;
          border-radius: 50%;
          background: transparent;
          color: #8b949e;
          cursor: pointer;
        }
        .assignment-candidate-chip-remove:hover {
          color: #f85149;
          background: rgba(248, 81, 73, 0.12);
        }
        .assignment-candidate-empty {
          font-size: 0.74rem;
          color: #7d8590;
        }
        .assignment-modal {
          width: min(900px, 96vw);
          max-height: 88vh;
          overflow-y: auto;
        }
        .assignment-modal-question-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: 2px 0 6px;
        }
        .assignment-modal-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #30363d;
          background: #0d1117;
          color: #c9d1d9;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color .12s, color .12s, background .12s;
        }
        .assignment-modal-nav-btn:hover:not(:disabled) {
          border-color: #58a6ff;
          color: #58a6ff;
          background: #161b22;
        }
        .assignment-modal-nav-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .assignment-modal-question-meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .assignment-modal-question-number {
          font-size: 0.72rem;
          font-weight: 600;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .assignment-modal-question-title {
          font-size: 0.8rem;
          color: #c9d1d9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .assignment-modal-number-strip {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 46px;
          min-width: 46px;
          max-height: 240px;
          overflow-y: auto;
          border-right: 1px solid #2b3544;
          padding-right: 8px;
        }
        .assignment-modal-number-btn {
          min-width: 30px;
          height: 30px;
          border-radius: 7px;
          border: 1px solid #30363d;
          background: #0d1117;
          color: #c9d1d9;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color .12s, color .12s, background .12s;
        }
        .assignment-modal-number-btn:hover {
          border-color: #58a6ff;
          color: #58a6ff;
        }
        .assignment-modal-number-btn.is-active {
          border-color: #306998;
          background: #1a2332;
          color: #58a6ff;
        }
        .assignment-problem-editor {
          display: flex;
          gap: 12px;
          align-items: stretch;
        }
        .assignment-problem-editor-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .assignment-problem-heading-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .assignment-problem-heading-row .assignment-modal-subtitle {
          margin: 0;
        }
        .btn-remove-problem {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          padding: 5px 10px;
          font-size: 0.76rem;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid rgba(248, 81, 73, 0.45);
          background: rgba(248, 81, 73, 0.08);
          color: #f85149;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .btn-remove-problem:hover:not(:disabled) {
          background: rgba(248, 81, 73, 0.15);
          border-color: rgba(248, 81, 73, 0.65);
        }
        .btn-remove-problem:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .assignment-clear-draft-btn {
          color: #8b949e;
        }
        .assignment-modal-subtitle {
          font-size: 0.78rem;
          font-weight: 600;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .assignment-problem-input {
          width: 100%;
          min-height: 200px;
          resize: vertical;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 8px;
          color: #e6edf3;
          font-size: 0.84rem;
          line-height: 1.45;
          padding: 10px 12px;
          outline: none;
          font-family: inherit;
        }
        .assignment-problem-input:focus {
          border-color: #58a6ff;
        }
        .assignment-testcases-block {
          margin-top: 6px;
        }
        .assignment-testcases-collapse-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          cursor: pointer;
          color: #c9d1d9;
          text-align: left;
          transition: border-color 0.15s, background 0.15s;
        }
        .assignment-testcases-collapse-trigger:hover {
          border-color: #58a6ff55;
          background: #1c2128;
        }
        .assignment-modal-subtitle--inline {
          margin: 0;
          flex: 1;
          text-align: left;
        }
        .assignment-testcases-count-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          background: #21262d;
          color: #8b949e;
        }
        .assignment-testcases-hint {
          margin: 10px 0 6px;
          font-size: 0.72rem;
          color: #7d8590;
          line-height: 1.4;
        }
        .assignment-testcases-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow: auto;
        }
        .assignment-modal-footer-nav {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 4px;
          margin-bottom: -4px;
        }
        .assignment-testcase-header {
          display: grid;
          grid-template-columns: 38px 1fr 1fr 1fr 1fr auto auto;
          gap: 8px;
          align-items: end;
          padding: 0 2px 4px;
          border-bottom: 1px solid #30363d;
          margin-bottom: 2px;
        }
        .assignment-testcase-header-cell {
          font-size: 0.72rem;
          font-weight: 600;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .assignment-testcase-header-cell--meta {
          text-align: center;
        }
        .assignment-testcase-header-cell--index {
          text-align: center;
        }
        .assignment-testcase-header-cell--action {
          min-width: 52px;
        }
        .assignment-testcase-row {
          display: grid;
          grid-template-columns: 38px 1fr 1fr 1fr 1fr auto auto;
          gap: 8px;
          align-items: center;
        }
        .assignment-testcase-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 34px;
          border-radius: 8px;
          border: 1px solid #30363d;
          background: #0d1117;
          color: #8b949e;
          font-size: 0.74rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .assignment-testcase-actual {
          background: #0d1117;
          border: 1px dashed #30363d;
          border-radius: 8px;
          color: #8b949e;
          padding: 7px 9px;
          font-size: 0.78rem;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          min-height: 34px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .assignment-testcase-input {
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 8px;
          color: #e6edf3;
          padding: 7px 9px;
          font-size: 0.78rem;
          outline: none;
        }
        .assignment-testcase-input:focus {
          border-color: #58a6ff;
        }
        .assignment-testcase-lock {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #8b949e;
          white-space: nowrap;
        }
        .sidebar-staff-pill {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #58a6ff;
          background: rgba(88, 166, 255, 0.12);
          border: 1px solid rgba(88, 166, 255, 0.35);
          border-radius: 999px;
          padding: 2px 8px;
        }
        .btn-save-assignment {
          margin-top: 8px;
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #30363d;
          background: #21262d;
          color: #e6edf3;
        }
        .btn-save-assignment:hover:not(:disabled) { border-color: #58a6ff; color: #58a6ff; }
        .btn-save-assignment:disabled { opacity: 0.5; cursor: not-allowed; }
        .explorer-top {
          padding: 12px 12px 10px;
          border-bottom: 1px solid #21262d;
          background: #121820;
        }
        .explorer-files-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .explorer-files-label { flex: 1; min-width: 0; }
        .explorer-files-icon { color: #d29922; flex-shrink: 0; }
        .explorer-files-actions {
          margin-left: auto;
          display: flex;
          gap: 4px;
        }
        .explorer-icon-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: #7d8590;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .explorer-icon-btn:hover:not(:disabled) {
          background: #21262d;
          border-color: #30363d;
          color: #e6edf3;
        }
        .explorer-icon-btn:disabled { opacity: 0.35; cursor: default; }

        .sidebar-search-wrap { padding: 10px 12px; border-bottom: 1px solid #21262d; }
        .sidebar-search {
          width: 100%; background: #0d1117; border: 1px solid #21262d;
          border-radius: 6px; padding: 7px 10px; font-size: 0.78rem; color: #e6edf3;
          outline: none; transition: border-color .15s;
        }
        .sidebar-search:focus { border-color: #58a6ff; }
        .sidebar-search::placeholder { color: #484f58; }

        .explorer-tree { padding-top: 4px; }
        .coderpad-sidebar-col--files .snippet-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .snippet-empty {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 32px 16px; color: #484f58; text-align: center; font-size: 0.8rem;
        }
        .snippet-empty--session { padding: 20px 14px; gap: 10px; }
        .snippet-session-title { color: #e6edf3; font-weight: 600; font-size: 0.82rem; margin: 0; }
        .snippet-session-hint {
          color: #7d8590; font-size: 0.72rem; line-height: 1.45; margin: 0; max-width: 220px;
        }
        .empty-icon { opacity: .4; }

        .snippet-item {
          width: 100%; text-align: left; background: transparent; border: 1px solid transparent;
          border-radius: 8px; padding: 8px 10px; cursor: pointer; transition: all .15s;
          display: flex; flex-direction: column; gap: 5px;
        }
        .snippet-item:hover { background: #21262d; border-color: #30363d; }
        .snippet-item--active { background: #1c2a3a !important; border-color: #388bfd40 !important; }
        .snippet-item-row { display: flex; align-items: center; gap: 7px; }
        .snippet-lang-logo { object-fit: contain; flex-shrink: 0; border-radius: 3px; }
        .lang-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .snippet-file { flex-direction: row !important; align-items: center !important; justify-content: space-between !important; }
        .snippet-file-icon { flex-shrink: 0; opacity: 0.9; }
        .snippet-title { font-size: 0.8rem; font-weight: 500; color: #e6edf3; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 170px; text-align: left; }
        .coderpad-sidebar-col--files .snippet-title { max-width: min(120px, 100%); }
        .snippet-ext { opacity: 0.45; font-weight: 400; font-size: 0.72rem; }
        .snippet-meta { display: flex; align-items: center; gap: 8px; padding-left: 0; margin-top: 0 !important; }
        .lang-badge { font-size: 0.68rem; color: #7d8590; }
        .time-badge { display: flex; align-items: center; gap: 3px; font-size: 0.68rem; color: #484f58; }

        /* ── MAIN ── */
        .coderpad-main {
          flex: 1; display: flex; flex-direction: column; overflow: hidden;
          background: radial-gradient(120% 80% at 50% -20%, rgba(56,139,253,0.08) 0%, transparent 55%), #0d1117;
        }

        /* ── TOP BAR ── */
        .coderpad-topbar {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 10px 16px; min-height: 54px;
          background: linear-gradient(180deg, #1a222e 0%, #161b22 100%);
          border-bottom: 1px solid #21262d;
          box-shadow: 0 1px 0 rgba(255,255,255,0.04);
          flex-shrink: 0;
        }
        .topbar-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .topbar-left-inner { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
        .topbar-title-row { display: flex; align-items: center; gap: 8px; }
        .topbar-brand-logo {
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          opacity: 0.95;
        }
        .coderpad-login-line {
          margin: 0;
          font-size: 0.72rem;
          color: #8b949e;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        .coderpad-llm-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 10px;
          margin-top: 6px;
        }
        .btn-llm-validate {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          font-size: 0.76rem;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid #388bfd55;
          background: rgba(56, 139, 253, 0.12);
          color: #79c0ff;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .btn-llm-validate:hover:not(:disabled) {
          background: rgba(56, 139, 253, 0.2);
          border-color: #388bfd88;
        }
        .btn-llm-validate:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .btn-llm-validate .spin { animation: coderpad-spin 0.8s linear infinite; }
        @keyframes coderpad-spin { to { transform: rotate(360deg); } }
        .llm-result-modal .llm-result-error {
          color: #f85149;
          font-size: 0.85rem;
          margin: 0 0 12px;
        }
        .llm-result-modal .llm-result-summary {
          color: #c9d1d9;
          font-size: 0.84rem;
          line-height: 1.45;
          margin: 0 0 12px;
        }
        .llm-result-modal .llm-result-feedback {
          margin: 0;
          padding: 10px 12px;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 8px;
          font-size: 0.78rem;
          line-height: 1.45;
          color: #8b949e;
          white-space: pre-wrap;
          max-height: min(50vh, 360px);
          overflow: auto;
        }
        .topbar-center { display: flex; align-items: center; }
        .topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .topbar-user-chip {
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          height: 30px;
          padding: 0 10px;
          border: 1px solid #30363d;
          border-radius: 999px;
          background: #0d1117;
          color: #8b949e;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .topbar-split-chip {
          display: inline-flex;
          align-items: center;
          height: 30px;
          padding: 0 10px;
          border: 1px solid rgba(210, 153, 34, 0.45);
          border-radius: 999px;
          background: rgba(210, 153, 34, 0.15);
          color: #d29922;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .snippet-title-input {
          background: transparent;
          border: none;
          outline: none;
          border-radius: 0;
          padding: 4px 0;
          font-size: 0.88rem;
          font-weight: 600;
          color: #e6edf3;
          max-width: min(340px, 42vw);
          min-width: 160px;
          font-family: 'Inter', sans-serif;
          transition: color 0.15s;
        }
        .snippet-title-input::placeholder { color: #6e7681; }
        .snippet-title-input:hover { color: #f0f6fc; }
        .snippet-title-input:focus {
          box-shadow: none;
          border-bottom: 1px solid #388bfd;
          padding-bottom: 3px;
        }
        .dirty-dot { width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; flex-shrink: 0; }

        /* Language dropdown */
        .lang-dropdown { position: relative; }
        .lang-selector {
          display: flex; align-items: center; gap: 7px; padding: 6px 12px;
          background: #21262d; border: 1px solid #30363d; border-radius: 8px; cursor: pointer;
          color: #e6edf3; font-size: 0.82rem; font-weight: 500; transition: all .15s;
        }
        .lang-selector:hover { border-color: #58a6ff; }
        .lang-icon { font-size: 1rem; display: inline-flex; align-items: center; justify-content: center; }
        .lang-icon-img { display: block; object-fit: contain; flex-shrink: 0; }
        .lang-emoji { font-size: 1rem; line-height: 1; }
        .lang-option-icon-wrap {
          width: 22px; display: inline-flex; align-items: center; justify-content: center;
        }
        .lang-label { font-size: 0.82rem; }
        .lang-chevron { transition: transform .2s; color: #7d8590; }
        .lang-chevron.open { transform: rotate(180deg); }
        .lang-menu {
          position: absolute; top: calc(100% + 6px); left: 0; z-index: 50;
          background: #161b22; border: 1px solid #30363d; border-radius: 10px;
          width: 170px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.4);
          animation: fadeIn .1s ease;
        }
        .lang-option {
          display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 14px;
          background: transparent; border: none; cursor: pointer; color: #c9d1d9;
          font-size: 0.83rem; transition: background .12s;
        }
        .lang-option:hover { background: #21262d; }
        .lang-option--active { background: #1c2a3a; color: #58a6ff; }

        /* Buttons */
        .btn-icon {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid #30363d;
          background: transparent; color: #7d8590; cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: all .15s;
        }
        .btn-icon:hover { background: #21262d; color: #e6edf3; }
        .btn-danger-hover:hover { color: #f85149; border-color: #f8514940; background: #f8514915; }
        .btn-save {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          border-radius: 8px; border: 1px solid #30363d; background: #21262d;
          color: #e6edf3; font-size: 0.82rem; font-weight: 500; cursor: pointer;
          transition: all .15s;
        }
        .btn-save:hover { border-color: #58a6ff; background: #1c2a3a; }
        .btn-save:disabled { opacity: .5; cursor: not-allowed; }
        .btn-run {
          display: flex; align-items: center; gap: 7px; padding: 7px 16px;
          border-radius: 8px; border: none; background: #238636; color: #fff;
          font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all .15s;
        }
        .btn-run:hover { background: #2ea043; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(35,134,54,.4); }
        .btn-run:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-submit {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 600;
          background: #21262d; color: #e6edf3; border: 1px solid #30363d;
          cursor: pointer; transition: all .15s;
        }
        .btn-submit:hover { border-color: #58a6ff; color: #58a6ff; }
        .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
        .btn-ghost {
          padding: 7px 14px; border-radius: 8px; border: 1px solid #30363d;
          background: transparent; color: #7d8590; font-size: 0.82rem; cursor: pointer;
          transition: all .15s;
        }
        .btn-ghost:hover { background: #21262d; color: #e6edf3; }
        .btn-ghost-sm {
          display: flex; align-items: center; gap: 5px; padding: 5px 10px;
          border-radius: 6px; border: 1px solid #30363d; background: transparent;
          color: #7d8590; font-size: 0.75rem; cursor: pointer; transition: all .15s;
        }
        .btn-ghost-sm:hover { background: #21262d; color: #e6edf3; }
        .btn-primary {
          padding: 7px 16px; border-radius: 8px; border: none; background: #238636;
          color: #fff; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all .15s;
        }
        .btn-primary:hover { background: #2ea043; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── STATUS BAR ── */
        .coderpad-statusbar {
          display: flex; align-items: center; gap: 14px; padding: 0 16px; height: 28px;
          background: #0d1117; border-bottom: 1px solid #21262d; font-size: 0.73rem;
          color: #7d8590; flex-shrink: 0;
        }
        .status-lang {
          font-weight: 500; color: #8b949e;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .status-time { display: flex; align-items: center; gap: 3px; }
        .status-tests { display: flex; align-items: center; gap: 3px; }
        .status-tests.pass { color: #3fb950; }
        .status-tests.fail { color: #f85149; }
        .status-hint { margin-left: auto; color: #484f58; }

        /* ── PANELS ── */
        .coderpad-panels-wrap {
          flex: 1;
          overflow: hidden;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .coderpad-panels-wrap > div { height: 100%; min-height: 0; }

        .resize-handle--horizontal {
          width: 100% !important;
          height: 6px;
          cursor: row-resize;
          flex-shrink: 0;
        }
        .resize-handle--horizontal .resize-handle-bar-h {
          width: 48px;
          height: 3px;
          border-radius: 2px;
          background: #30363d;
          margin: 0 auto;
        }
        .resize-handle--horizontal:hover .resize-handle-bar-h { background: #388bfd; }


        .editor-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #0d1117;
          overflow: hidden;
          position: relative;
        }
        .editor-toolbar-ide {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 14px;
          background: #161b22;
          border-bottom: 1px solid #21262d;
          flex-shrink: 0;
        }
        .btn-save-ide {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 6px;
          border: none;
          background: #238636;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .btn-save-ide:hover:not(:disabled) { background: #2ea043; }
        .btn-save-ide:disabled { opacity: 0.6; cursor: not-allowed; }
        .autosave-toggle {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 0.78rem;
          color: #8b949e;
          user-select: none;
        }
        .autosave-toggle--topbar {
          margin: 0 4px;
        }
        .autosave-toggle input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .autosave-track {
          width: 36px;
          height: 20px;
          border-radius: 10px;
          background: #30363d;
          position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .autosave-track::after {
          content: "";
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e6edf3;
          top: 2px;
          left: 2px;
          transition: transform 0.2s;
        }
        .autosave-toggle input:checked + .autosave-track { background: #238636; }
        .autosave-toggle input:checked + .autosave-track::after { transform: translateX(16px); }
        .autosave-label { font-weight: 500; color: #c9d1d9; }
        .editor-body { flex: 1; overflow: hidden; min-height: 0; }
        .ide-right-stack {
          height: 100%;
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: #0d1117;
        }
        .ide-right-stack > div { min-height: 0; }
        .ide-right-stack.ide-right-stack--rail {
          height: 100%;
          min-height: 0;
        }
        .tests-rail {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          height: 100%;
          min-height: 0;
          background: #0d1117;
          border-left: 1px solid #21262d;
          padding: 10px 0;
        }
        .tests-rail-toggle {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 2px 12px;
          background: transparent;
          border: none;
          color: #8b949e;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }
        .tests-rail-toggle:hover {
          background: #21262d;
          color: #e6edf3;
        }
        .tests-rail-chevron {
          color: #58a6ff;
          flex-shrink: 0;
        }
        .tests-rail-icon {
          opacity: 0.85;
          flex-shrink: 0;
        }
        .tests-rail-count {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 8px;
          background: #21262d;
          color: #c9d1d9;
        }
        .tests-rail-label {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #7d8590;
          font-variant-numeric: tabular-nums;
        }

        .preview-result-only {
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          background: #1e1e1e;
          border-bottom: 1px solid #30363d;
          overflow: hidden;
        }
        .preview-running {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #8b949e;
          font-size: 0.85rem;
        }
        .preview-result { padding: 14px 16px; flex: 1; overflow: auto; min-height: 0; }
        .preview-stdout {
          margin: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          line-height: 1.5;
          color: #d4d4d4;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .preview-stderr {
          margin: 12px 0 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          color: #f85149;
          white-space: pre-wrap;
        }

        .ide-terminal-panel {
          border-left: 1px solid #21262d;
        }
        .ide-terminal-tabs.output-tabs {
          background: #161b22;
          padding-left: 4px;
        }
        .shell-tab-body {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
        }
        .shell-idle { flex: 1; }
        .shell-stdin-block {
          border-top: 1px solid #21262d;
          background: #0d1117;
          flex-shrink: 0;
        }
        .server-tab-body {
          padding: 14px 16px;
          font-size: 0.8rem;
          color: #8b949e;
          line-height: 1.55;
        }
        .server-ready {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 10px;
        }
        .server-ready-label {
          color: #3fb950;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
        }
        .server-ready-version { color: #58a6ff; font-weight: 600; }
        .server-meta { margin: 0 0 8px; }
        .server-meta kbd {
          padding: 1px 6px;
          background: #21262d;
          border: 1px solid #30363d;
          border-radius: 4px;
          font-size: 0.72rem;
        }
        .server-hint { margin: 0; font-size: 0.74rem; color: #6e7681; }

        .snippet-item-row--file {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          min-width: 0;
        }
        .snippet-file-time { margin-left: auto; flex-shrink: 0; font-size: 0.62rem !important; }

        .stdin-panel {
          border-top: 1px solid #21262d; background: #161b22; flex-shrink: 0;
        }
        .stdin-header {
          display: flex; align-items: center; gap: 7px; padding: 6px 12px;
          font-size: 0.73rem; color: #7d8590; border-bottom: 1px solid #21262d;
        }
        .stdin-input {
          width: 100%; background: transparent; border: none; outline: none;
          color: #c9d1d9; font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
          padding: 8px 12px; resize: none; line-height: 1.5;
        }
        .stdin-input::placeholder { color: #484f58; }

        /* Resize handle */
        .resize-handle {
          width: 4px; background: #21262d; cursor: col-resize; position: relative;
          display: flex; align-items: center; justify-content: center; transition: background .15s;
        }
        .resize-handle:hover, .resize-handle[data-resize-handle-active] { background: #388bfd; }
        .resize-handle-bar { width: 2px; height: 40px; border-radius: 1px; background: #30363d; }

        /* ── OUTPUT PANEL ── */
        .output-panel { height: 100%; display: flex; flex-direction: column; background: #0d1117; overflow: hidden; }
        .output-tabs {
          display: flex; align-items: center; background: #161b22;
          border-bottom: 1px solid #21262d; flex-shrink: 0;
        }
        .output-tab {
          display: flex; align-items: center; gap: 6px; padding: 10px 16px;
          font-size: 0.78rem; font-weight: 500; border: none; background: transparent;
          color: #7d8590; cursor: pointer; border-bottom: 2px solid transparent;
          transition: all .15s; white-space: nowrap;
        }
        .output-tab:hover { color: #e6edf3; background: #21262d; }
        .output-tab.active { color: #58a6ff; border-bottom-color: #58a6ff; background: transparent; }
        .tab-badge {
          font-size: 0.68rem; padding: 1px 5px; border-radius: 10px; font-weight: 600; margin-left: 2px;
        }
        .tab-badge--pass { background: #238636; color: #fff; }
        .tab-badge--fail { background: #da3633; color: #fff; }

        .output-content { flex: 1; overflow-y: auto; }

        /* Output body */
        .output-body { height: 100%; overflow-y: auto; }
        .output-running {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          height: 100%; color: #7d8590; font-size: 0.875rem;
        }
        .output-idle {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: 100%; gap: 12px; color: #484f58; text-align: center; font-size: 0.82rem; padding: 24px;
        }
        .idle-icon { opacity: .3; }
        .output-idle kbd {
          display: inline-block; padding: 1px 6px; background: #21262d;
          border: 1px solid #30363d; border-radius: 4px; font-size: 0.75rem; color: #8b949e;
        }
        .output-section { padding: 12px 14px; }
        .output-section-label {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em;
          margin-bottom: 6px;
        }
        .output-section-label.stdout { color: #3fb950; }
        .output-section-label.stderr { color: #f85149; }
        .output-pre {
          font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
          white-space: pre-wrap; word-break: break-all; line-height: 1.6;
          background: #161b22; border: 1px solid #21262d; border-radius: 8px;
          padding: 12px 14px; overflow-x: auto;
        }
        .stdout-text { color: #3fb950; }
        .stderr-text { color: #f85149; }

        /* Tests body */
        .tests-body { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .tests-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; border-bottom: 1px solid #21262d; flex-shrink: 0;
          font-size: 0.78rem; color: #7d8590;
        }
        .tests-collapse-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: #9aa4af;
          cursor: pointer;
          font-size: 0.78rem;
        }
        .tests-header-actions { display: inline-flex; align-items: center; gap: 6px; }
        .tests-count { font-weight: 500; }
        .tests-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
        .result-summary-card {
          background: #111926;
          border: 1px solid #2b3544;
          border-radius: 10px;
          padding: 10px 12px;
        }
        .result-summary-title {
          font-size: 0.72rem;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .result-summary-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 7px;
        }
        .summary-chip {
          font-size: 0.7rem;
          border: 1px solid #30363d;
          border-radius: 999px;
          padding: 2px 8px;
          color: #c9d1d9;
          background: #0d1117;
        }
        .summary-chip.ok { border-color: #238636; color: #3fb950; }
        .summary-chip.bad { border-color: #da3633; color: #f85149; }
        .result-summary-text {
          margin: 0;
          font-size: 0.78rem;
          color: #c9d1d9;
          line-height: 1.45;
        }
        .result-flags-list {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .result-flag-item {
          font-size: 0.74rem;
          color: #f0b0a4;
          background: #241214;
          border: 1px solid #4e2329;
          border-radius: 6px;
          padding: 6px 8px;
        }
        .result-flag-type { color: #f85149; font-weight: 600; margin-right: 4px; }
        .tests-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: 100%; gap: 10px; color: #484f58; font-size: 0.8rem; text-align: center;
        }
        .test-case {
          background: #161b22; border: 1px solid #30363d; border-radius: 10px; overflow: hidden;
        }
        .test-pass { border-color: #238636; }
        .test-fail { border-color: #da3633; }
        .test-case-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px; background: #1c2128; border-bottom: 1px solid #21262d;
        }
        .test-case-num { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; }
        .test-num-badge {
          width: 20px; height: 20px; border-radius: 50%; background: #21262d;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 700; color: #8b949e; flex-shrink: 0;
        }
        .test-desc-input {
          background: transparent; border: none; outline: none; color: #c9d1d9;
          font-size: 0.78rem; font-weight: 500; flex: 1; min-width: 0;
          font-family: 'Inter', sans-serif;
        }
        .test-lock-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          color: #8b949e;
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
        }
        .test-lock-toggle input { accent-color: #58a6ff; }
        .test-lock-icon { color: #d29922; flex-shrink: 0; }
        .btn-remove {
          background: transparent; border: none; color: #484f58; cursor: pointer;
          font-size: 0.75rem; padding: 2px 4px; border-radius: 4px; transition: all .15s;
        }
        .btn-remove:hover { color: #f85149; background: #f8514915; }
        .test-case-fields { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
        .test-field { display: flex; flex-direction: column; gap: 4px; }
        .test-field label { font-size: 0.7rem; color: #7d8590; font-weight: 500; text-transform: uppercase; letter-spacing: .05em; }
        .test-textarea {
          background: #0d1117; border: 1px solid #21262d; border-radius: 6px;
          color: #c9d1d9; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
          padding: 6px 8px; resize: vertical; outline: none; transition: border-color .15s;
          min-height: 42px;
        }
        .test-textarea:focus { border-color: #388bfd; }
        .test-textarea[readonly] {
          color: #8b949e;
          background: #11151b;
          border-color: #2a2f36;
          cursor: not-allowed;
        }
        .test-diff {
          background: #0d1117; border: 1px solid #21262d; border-radius: 6px;
          padding: 8px; display: flex; flex-direction: column; gap: 4px;
        }
        .diff-row { display: flex; align-items: flex-start; gap: 8px; }
        .diff-label { font-size: 0.7rem; font-weight: 600; width: 60px; flex-shrink: 0; margin-top: 2px; }
        .diff-label.expected { color: #3fb950; }
        .diff-label.actual { color: #f85149; }
        .diff-label.error { color: #f0883e; }
        .diff-code {
          font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
          color: #c9d1d9; word-break: break-all;
        }
        .error-text { color: #f0883e; }

        /* Logs body */
        .logs-body { height: 100%; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
        .log-entry {
          background: #161b22; border: 1px solid #21262d; border-radius: 8px; overflow: hidden;
          transition: border-color .15s;
        }
        .log-entry:hover { border-color: #30363d; }
        .log-header {
          display: flex; align-items: center; gap: 8px; padding: 8px 12px;
          background: #1c2128; border-bottom: 1px solid #21262d;
          font-size: 0.73rem; color: #7d8590;
        }
        .log-lang {
          font-weight: 500; color: #8b949e;
          display: inline-flex; align-items: center; gap: 5px;
        }
        .log-time { display: flex; align-items: center; gap: 3px; }
        .log-date { margin-left: auto; color: #484f58; }
        .log-code {
          padding: 8px 12px; font-family: 'JetBrains Mono', monospace;
          font-size: 0.73rem; color: #7d8590; white-space: pre-wrap; word-break: break-all;
          line-height: 1.4;
        }

        /* Scrollbars */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #21262d; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #30363d; }
      `}</style>
    </div>
  );
};

export default CoderpadEditor;
