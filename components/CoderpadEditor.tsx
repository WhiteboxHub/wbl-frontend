"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Play, Save, Trash2, Copy, Check, ChevronDown, ChevronRight, Send,
  FileCode2, Clock, Terminal, TestTube2, Share2, History,
  Loader2, AlertCircle, CheckCircle2, XCircle, Code2, Settings,
  ShieldAlert, ShieldCheck, Shield, Maximize2, EyeOff, Eye,
  MonitorOff, Minimize2, LayoutPanelLeft, AlertTriangle,
  FolderOpen, FilePlus, FolderPlus,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
}

const DEFAULT_PROBLEM_STATEMENT =
  "Write a recursive function factorial(n) that returns n! for a non-negative integer n. Use recursion only and print factorial(n) from stdin input.";

const DEFAULT_FACTORIAL_TESTS: TestCase[] = [
  { description: "n = 0", input: "0", expected_output: "1" },
  { description: "n = 1", input: "1", expected_output: "1" },
  { description: "n = 5 (hidden)", input: "5", expected_output: "120", locked: true },
  { description: "n = 7 (hidden)", input: "7", expected_output: "5040", locked: true },
];

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

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

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
        const widthRatio = window.innerWidth / window.screen.width;
        const heightRatio = window.innerHeight / window.screen.height;
        if (widthRatio < 0.75 || heightRatio < 0.80) {
          addEvent(
            "window_resize",
            `Possible split-screen detected — window is ${Math.round(widthRatio * 100)}% width, ${Math.round(heightRatio * 100)}% height of screen`
          );
        }
      }, 500);
    };
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

function useTypingAnalyzer(addEvent: (type: ViolationType, msg: string) => void) {
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
    const onPaste = (e: ClipboardEvent) => {
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

    const onCut = () => {
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

    document.addEventListener("paste", onPaste);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    return () => {
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
    };
  }, [addEvent]);

  // ── 3. Monaco: keydown (WPM + backspace) + idle-burst fallback via content change
  const setupEditor = useCallback((editor: any) => {
    disposables.current.forEach(d => d?.dispose());
    disposables.current = [];

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
  }, [addEvent]);

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
  const [loggedInUsername, setLoggedInUsername] = useState("User");
  // ── Snippets
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [snippetSearch, setSnippetSearch] = useState("");

  // ── Editor
  const [code, setCode] = useState(LANGUAGES.python.starter);
  const [language, setLanguage] = useState("python");
  const [title, setTitle] = useState(DEFAULT_SNIPPET_TITLE);
  const [description, setDescription] = useState(DEFAULT_PROBLEM_STATEMENT);
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
  const [testCases, setTestCases] = useState<TestCase[]>(DEFAULT_FACTORIAL_TESTS);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  // ── UI Tabs (right panel)
  const [rightTab, setRightTab] = useState<"server" | "shell" | "console" | "logs">("shell");
  const [autoSave, setAutoSave] = useState(true);

  // ── Execution logs
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Modals / states
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [filesCollapsed, setFilesCollapsed] = useState(false);
  const [testsCollapsed, setTestsCollapsed] = useState(false);
  const [showAllTests, setShowAllTests] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // ── Security (always on by default)
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [secPanelTab, setSecPanelTab]   = useState<"events" | "analytics">("events");
  const security       = useSecurityMonitor(true);
  const typingAnalyzer = useTypingAnalyzer(security.addEvent);

  const editorRef = useRef<any>(null);
  const langDropRef = useRef<HTMLDivElement>(null);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchSnippets(); }, []);
  useEffect(() => { setLoggedInUsername(getLoggedInUsername()); }, []);

  // Auto-enter fullscreen on mount (proctoring always on)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          // Browser may block if no prior interaction — will be available after first click
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

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

  const fetchSnippets = async () => {
    try {
      const data = await apiFetch("/coderpad/snippets");
      setSnippets(data);
    } catch (err: any) {
      if (err.status !== 401) toast.error("Failed to load snippets");
    }
  };

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

  const loadSnippet = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet);
    setCode(snippet.code);
    setLanguage(snippet.language);
    setTitle(snippet.title);
    setDescription(snippet.description || "");
    setTestCases(snippet.test_cases || []);
    setOutput("");
    setError("");
    setTestResults(null);
    setExecStatus("idle");
    setExecTime(null);
    setIsDirty(false);
  };

  const createNew = (titleOverride?: string) => {
    const cfg = LANGUAGES[language] || LANGUAGES.python;
    setSelectedSnippet(null);
    setCode(cfg.starter);
    setTitle(titleOverride || DEFAULT_SNIPPET_TITLE);
    setDescription(DEFAULT_PROBLEM_STATEMENT);
    setTestCases(DEFAULT_FACTORIAL_TESTS);
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
      const body = { title, description, language, code, test_cases: testCases, execution_timeout: 10, is_shared: false };
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
      fetchSnippets();
      return true;
    } catch (err: any) {
      if (!opts?.silent) toast.error(err.message || "Save failed");
      return false;
    } finally {
      setSaving(false);
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
        execBody.test_cases = testCases;
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
    if (data.test_results) {
      setTestResults(data.test_results);
      setRightTab("console");
      if (opts?.openModal) {
        setShowResultModal(true);
      }
    }
  };

  const runTestCases = async () => {
    if (!code.trim()) { toast.error("Write some code first!"); return; }
    setRunBusy("run");
    setOutput("");
    setError("");
    setTestResults(null);
    setExecStatus("running");
    setShowResultModal(false);
    setRightTab("shell");
    try {
      await performExecute({ openModal: false });
    } catch (err: any) {
      const msg = err.message || "Execution failed";
      setError(msg);
      setExecStatus("error");
      toast.error(msg);
    } finally {
      setRunBusy(false);
    }
  };

  const submitSolution = async () => {
    if (!code.trim()) { toast.error("Write some code first!"); return; }
    if (!title.trim()) { toast.error("Please enter a title before submitting"); return; }
    setRunBusy("submit");
    setOutput("");
    setError("");
    setTestResults(null);
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
      fetchSnippets();
    } catch (err: any) {
      toast.error("Delete failed");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Test Case Helpers ─────────────────────────────────────────────────────
  const updateTestCase = (i: number, field: keyof TestCase, val: string) => {
    setTestCases(prev => prev.map((tc, idx) => idx === i ? { ...tc, [field]: val } : tc));
    setIsDirty(true);
  };
  const removeTestCase = (i: number) => {
    if (testCases[i]?.locked) return;
    setTestCases(prev => prev.filter((_, idx) => idx !== i));
    setIsDirty(true);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const langCfg = LANGUAGES[language] || LANGUAGES.python;
  const filteredSnippets = snippets.filter(s =>
    s.title.toLowerCase().includes(snippetSearch.toLowerCase()) ||
    s.language.toLowerCase().includes(snippetSearch.toLowerCase())
  );
  const passCount = testResults?.filter(r => r.passed).length ?? 0;
  const totalTests = testResults?.length ?? 0;
  const visibleTestCases = showAllTests ? testCases : testCases.slice(0, 2);
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
            {!security.isFullscreen && (
              <button className="sec-fs-btn" onClick={security.requestFullscreen}>
                <Maximize2 size={11} /> Re-enter Fullscreen
              </button>
            )}
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

      {/* ── SIDEBAR (file explorer style) ───────────────────────── */}
      <aside className="coderpad-sidebar">
        <div className="sidebar-problem-card">
          <div className="sidebar-problem-title">Problem Statement</div>
          <p className="sidebar-problem-text">{description || DEFAULT_PROBLEM_STATEMENT}</p>
        </div>
        <div className="explorer-top">
          <div className="explorer-files-header">
            <FolderOpen size={14} className="explorer-files-icon" />
            <span>Files</span>
            <div className="explorer-files-actions">
              <button
                type="button"
                className="explorer-icon-btn"
                onClick={() => setFilesCollapsed(v => !v)}
                title={filesCollapsed ? "Expand files" : "Collapse files"}
              >
                {filesCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
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
        <>
        <div className="sidebar-search-wrap">
          <input
            className="sidebar-search"
            placeholder="Search snippets…"
            value={snippetSearch}
            onChange={e => setSnippetSearch(e.target.value)}
          />
        </div>

        <div className="snippet-list explorer-tree">
          {filteredSnippets.length === 0 ? (
            <div className="snippet-empty">
              <FileCode2 size={28} className="empty-icon" />
              <p>No snippets yet</p>
              <button className="btn-ghost-sm" onClick={() => setShowNewModal(true)}>Create one</button>
            </div>
          ) : (
            filteredSnippets.map(s => {
              const lc = LANGUAGES[s.language];
              const active = selectedSnippet?.id === s.id;
              return (
                <button
                  key={s.id}
                  className={`snippet-item snippet-file ${active ? "snippet-item--active" : ""}`}
                  onClick={() => loadSnippet(s)}
                >
                  <div className="snippet-item-row snippet-item-row--file">
                    {lc?.iconSrc ? (
                      <img src={lc.iconSrc} alt="" className="snippet-lang-logo" width={16} height={16} />
                    ) : (
                      <FileCode2 size={15} className="snippet-file-icon" style={{ color: lc?.color ?? "#888" }} />
                    )}
                    <span className="snippet-title">
                      {s.title}
                      <span className="snippet-ext">
                        .{s.language === "cpp" ? "cpp" : s.language === "javascript" ? "js" : s.language === "typescript" ? "ts" : s.language}
                      </span>
                    </span>
                    <span className="time-badge snippet-file-time"><Clock size={10} />{timeAgo(s.updated_at)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
        </>
        )}
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────── */}
      <div className="coderpad-main">
        {/* ── TOP BAR ────────────────────────────── */}
        <header className="coderpad-topbar">
          <div className="topbar-left">
            {/* Title */}
            <input
              className="snippet-title-input"
              value={title}
              onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
              placeholder={DEFAULT_SNIPPET_TITLE}
            />
            {isDirty && <span className="dirty-dot" title="Unsaved changes" />}
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
            <span className="topbar-user-chip" title="Logged in user">
              {loggedInUsername}
            </span>
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
            {/* ── Fullscreen toggle ── */}
            <button
              className="btn-icon"
              onClick={security.isFullscreen ? security.exitFullscreen : security.requestFullscreen}
              title={security.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {security.isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button className="btn-icon" onClick={copyCode} title="Copy code">
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            </button>
            {selectedSnippet && (
              <button className="btn-icon btn-danger-hover" onClick={deleteSnippet} title="Delete snippet">
                <Trash2 size={15} />
              </button>
            )}
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

        {/* ── STATUS BAR ─────────────────────────── */}
        <div className="coderpad-statusbar">
          <span className="status-lang"><LangIcon cfg={langCfg} size="sm" /> {langCfg.label}</span>
          {execStatus !== "idle" && <StatusBadge status={execStatus} />}
          {execTime !== null && (
            <span className="status-time"><Clock size={11} />{execTime}ms</span>
          )}
          {testResults && (
            <span className={`status-tests ${passCount === totalTests ? "pass" : "fail"}`}>
              <TestTube2 size={11} />{passCount}/{totalTests} tests
            </span>
          )}
          <span className="status-hint">Ctrl+Enter run tests • Ctrl+Shift+Enter submit • Ctrl+S save</span>
        </div>

        {/* ── RESIZABLE PANELS (editor | preview + terminal) ───── */}
        <div className="coderpad-panels-wrap">
          <PanelGroup direction="horizontal">
            {/* Editor Panel */}
            <Panel defaultSize={60} minSize={30}>
              <div className="editor-panel">
                <div className="editor-toolbar-ide">
                  <button
                    type="button"
                    className="btn-save-ide"
                    onClick={() => saveSnippet()}
                    disabled={saving}
                    title="Save (Ctrl+S)"
                  >
                    {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                    Save
                  </button>
                  <label className="autosave-toggle">
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={e => setAutoSave(e.target.checked)}
                    />
                    <span className="autosave-track" aria-hidden />
                    <span className="autosave-label">Auto-save files</span>
                  </label>
                </div>
                <div className="editor-header">
                  <FileCode2 size={14} />
                  <span>{title || DEFAULT_SNIPPET_TITLE}.{language === "cpp" ? "cpp" : language === "javascript" ? "js" : language === "typescript" ? "ts" : language}</span>
                </div>
                <div className="editor-body">
                  <MonacoEditor
                    height="100%"
                    language={langCfg.monaco}
                    value={code}
                    theme="vs-dark"
                    onChange={(val) => { setCode(val || ""); setIsDirty(true); }}
                    onMount={(editor) => {
                      editorRef.current = editor;
                      typingAnalyzer.setupEditor(editor);
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
                    }}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="resize-handle">
              <div className="resize-handle-bar" />
            </PanelResizeHandle>

            {/* Right column: test cases only */}
            <Panel defaultSize={40} minSize={24}>
              <div className="ide-right-stack">
                <div className="output-panel ide-terminal-panel">
                  <div className="tests-body">
                    <div className="tests-header">
                      <button
                        className="tests-collapse-btn"
                        onClick={() => setTestsCollapsed(v => !v)}
                        title={testsCollapsed ? "Expand tests" : "Collapse tests"}
                      >
                        {testsCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        <span className="tests-count">{testCases.length} test case{testCases.length !== 1 ? "s" : ""}</span>
                      </button>
                      <div className="tests-header-actions">
                        <button className="btn-ghost-sm" onClick={() => setShowAllTests(v => !v)}>
                          {showAllTests ? "Show Fewer" : "Show All"}
                        </button>
                      </div>
                    </div>
                    {!testsCollapsed && (
                    <div className="tests-list">
                      {testCases.length === 0 ? (
                        <div className="tests-empty">
                          <TestTube2 size={28} className="empty-icon" />
                          <p>No test cases</p>
                        </div>
                      ) : (
                        visibleTestCases.map((tc, i) => {
                          const testIdx = i;
                          const result = testResults?.[testIdx];
                          const passed = result?.passed;
                          return (
                            <div key={testIdx} className={`test-case ${result ? (passed ? "test-pass" : "test-fail") : ""}`}>
                              <div className="test-case-header">
                                <div className="test-case-num">
                                  {result ? (
                                    passed
                                      ? <CheckCircle2 size={14} className="text-emerald-400" />
                                      : <XCircle size={14} className="text-red-400" />
                                  ) : (
                                    <span className="test-num-badge">{i + 1}</span>
                                  )}
                                  <input
                                    className="test-desc-input"
                                    value={tc.description || ""}
                                    placeholder={`Test case ${i + 1}`}
                                    onChange={e => updateTestCase(testIdx, "description", e.target.value)}
                                    readOnly={!!tc.locked}
                                  />
                                  {tc.locked && <Lock size={12} className="test-lock-icon" />}
                                </div>
                                {!tc.locked && <button className="btn-remove" onClick={() => removeTestCase(testIdx)}>✕</button>}
                              </div>
                              <div className="test-case-fields">
                                <div className="test-field">
                                  <label>Input</label>
                                  <textarea
                                    className="test-textarea"
                                    value={tc.locked ? "•••• hidden ••••" : (tc.input || "")}
                                    placeholder={tc.locked ? "Locked test input" : "stdin input…"}
                                    rows={2}
                                    onChange={e => updateTestCase(testIdx, "input", e.target.value)}
                                    readOnly={!!tc.locked}
                                  />
                                </div>
                                <div className="test-field">
                                  <label>Expected Output</label>
                                  <textarea
                                    className="test-textarea"
                                    value={tc.locked ? "•••• hidden ••••" : tc.expected_output}
                                    placeholder={tc.locked ? "Locked expected output" : "expected stdout…"}
                                    rows={2}
                                    onChange={e => updateTestCase(testIdx, "expected_output", e.target.value)}
                                    readOnly={!!tc.locked}
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
                    )}
                  </div>
                </div>
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

        /* ── SIDEBAR ── */
        .coderpad-sidebar {
          width: 260px; min-width: 220px; max-width: 280px;
          background: linear-gradient(180deg, #141a22 0%, #0f1419 100%);
          border-right: 1px solid #21262d;
          border-left: 3px solid #306998;
          display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;
          box-shadow: inset -1px 0 0 rgba(255,255,255,0.03);
        }
        .sidebar-problem-card {
          margin: 10px 10px 8px;
          background: #111926;
          border: 1px solid #2b3544;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .sidebar-problem-title {
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
        }
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
        .snippet-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
        .snippet-empty {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 32px 16px; color: #484f58; text-align: center; font-size: 0.8rem;
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

        .snippet-title-input {
          background: #0d1117; border: 1px solid #30363d; outline: none; border-radius: 8px;
          padding: 8px 12px; font-size: 0.88rem; font-weight: 600; color: #e6edf3;
          max-width: min(340px, 42vw); min-width: 160px; font-family: 'Inter', sans-serif;
          transition: border-color .15s, box-shadow .15s;
        }
        .snippet-title-input::placeholder { color: #6e7681; }
        .snippet-title-input:hover { border-color: #484f58; }
        .snippet-title-input:focus {
          border-color: #388bfd; box-shadow: 0 0 0 3px rgba(56,139,253,0.15);
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
        .editor-header {
          display: flex; align-items: center; gap: 7px; padding: 6px 14px;
          background: #0d1117; border-bottom: 1px solid #21262d;
          font-size: 0.78rem; color: #7d8590;
        }
        .editor-body { flex: 1; overflow: hidden; min-height: 0; }
        .ide-right-stack {
          height: 100%;
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: #0d1117;
        }
        .ide-right-stack > div { min-height: 0; }

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
