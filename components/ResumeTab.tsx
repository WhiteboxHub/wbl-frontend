"use client";

import React, { useRef, useState, useCallback } from "react";
import {
    Upload,
    FileText,
    Download,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Eye,
    Edit3,
    ChevronDown,
    ChevronUp,
    LayoutTemplate,
    RefreshCw,
    X,
} from "lucide-react";
import { ResumeRenderer, templateMap } from "@/components/templates/ResumeRenderer";
import { normalizeResume } from "@/utils/resumeNormalizer";
import { validateResumeStructure } from "@/utils/resumeValidator";
import { ResumeData } from "@/types/resume";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface SetupStatus {
    resume_uploaded: boolean;
    api_keys_configured: boolean;
    setup_complete: boolean;
    has_binary_resume?: boolean;
    binary_resume_filename?: string | null;
}

interface PrefetchedSession {
    sessionId: string;
    summaryData: any;
}

interface ResumeTabProps {
    candidateId: number | null;
    setupStatus: SetupStatus | null;
    prefetchedSession: PrefetchedSession | null;
    selectedTemplate: string;
    setSelectedTemplate: (t: string) => void;
    onUpload: (file: File) => Promise<void>;
    resumeUploadLoading: boolean;
    onSaveJson: () => Promise<void>;
    onValidateJson: () => void;
    onDownloadPdf: () => void;
    onDownloadJson: () => void;
    editJsonText: string;
    setEditJsonText: (s: string) => void;
    editJsonError: string | null;
    editJsonSaving: boolean;
    inlineResumeRef: React.RefObject<HTMLDivElement>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Template display names
// ──────────────────────────────────────────────────────────────────────────────

const TEMPLATE_LABELS: Record<string, string> = {
    academic: "Academic",
    classy: "Classy",
    elegant: "Elegant",
    even: "Even",
    flat: "Flat",
    professional: "Professional",
    "ats-friendly": "ATS Friendly",
    stackoverflow: "Stack Overflow",
    straightforward: "Straightforward",
    waterfall: "Waterfall",
    macchiato: "Macchiato",
    "onepage-plus": "One Page+",
    lowmess: "Low Mess",
    stackoverflowed: "Stack Over...",
};

const TEMPLATE_IDS = Object.keys(templateMap);

// ──────────────────────────────────────────────────────────────────────────────
// Helper: get normalized resume data from session
// ──────────────────────────────────────────────────────────────────────────────

function getNormalizedResume(prefetchedSession: PrefetchedSession | null): ResumeData | null {
    const rawJson = prefetchedSession?.summaryData?.resume_json;
    if (!rawJson || typeof rawJson !== "object") return null;
    try {
        return normalizeResume(rawJson);
    } catch {
        return null;
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-component: Upload Zone
// ──────────────────────────────────────────────────────────────────────────────

function UploadZone({
    setupStatus,
    loading,
    onUpload,
    candidateId,
}: {
    setupStatus: SetupStatus | null;
    loading: boolean;
    onUpload: (file: File) => Promise<void>;
    candidateId: number | null;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const validate = (file: File): boolean => {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (![".pdf", ".doc", ".docx"].includes(ext)) return false;
        return true;
    };

    const handleFile = useCallback(
        (file: File) => {
            if (!validate(file)) return;
            void onUpload(file);
        },
        [onUpload]
    );

    const hasFile = setupStatus?.has_binary_resume;
    const filename = setupStatus?.binary_resume_filename;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">Resume File</h3>
                    <p className="text-[11px] text-gray-400">PDF, DOC, or DOCX — max 10 MB</p>
                </div>
            </div>

            {/* Status tag */}
            {hasFile && filename ? (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">{filename}</p>
                        <p className="text-[10px] text-emerald-500">Uploaded &amp; parsed</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">No resume uploaded yet</p>
                </div>
            )}

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                }}
                onClick={() => candidateId && fileRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200 ${
                    dragOver
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
                } ${loading ? "pointer-events-none opacity-60" : ""}`}
            >
                <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                        e.target.value = "";
                    }}
                />
                {loading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-sm font-semibold text-gray-500">Uploading &amp; parsing…</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-1">
                            <Upload className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {hasFile ? "Replace resume" : "Upload your resume"}
                        </p>
                        <p className="text-xs text-gray-400">
                            Drag &amp; drop or <span className="text-blue-500 font-semibold">browse files</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-component: Template Picker
// ──────────────────────────────────────────────────────────────────────────────

function TemplatePicker({
    selected,
    onSelect,
}: {
    selected: string;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                    <LayoutTemplate className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">Resume Template</h3>
                    <p className="text-[11px] text-gray-400">Choose how your resume looks</p>
                </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {TEMPLATE_IDS.map((id) => (
                    <button
                        key={id}
                        onClick={() => onSelect(id)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-center transition-all duration-150 ${
                            selected === id
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                                : "border-gray-100 dark:border-gray-800 hover:border-violet-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                    >
                        <div
                            className={`w-8 h-10 rounded flex items-center justify-center text-[8px] font-bold ${
                                selected === id
                                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            }`}
                        >
                            A
                        </div>
                        <span
                            className={`text-[9px] font-bold leading-tight max-w-[54px] truncate ${
                                selected === id ? "text-violet-700 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            {TEMPLATE_LABELS[id] ?? id}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-component: JSON Editor Panel
// ──────────────────────────────────────────────────────────────────────────────

function JsonEditorPanel({
    prefetchedSession,
    editJsonText,
    setEditJsonText,
    editJsonError,
    editJsonSaving,
    onSave,
    onValidate,
    onDownloadJson,
}: {
    prefetchedSession: PrefetchedSession | null;
    editJsonText: string;
    setEditJsonText: (s: string) => void;
    editJsonError: string | null;
    editJsonSaving: boolean;
    onSave: () => Promise<void>;
    onValidate: () => void;
    onDownloadJson: () => void;
}) {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        if (!open) {
            // Pre-fill with current JSON if editor is empty
            const raw = prefetchedSession?.summaryData?.resume_json;
            if (raw && !editJsonText) {
                setEditJsonText(JSON.stringify(raw, null, 2));
            }
        }
        setOpen((v) => !v);
    };

    const hasJson = Boolean(prefetchedSession?.summaryData?.resume_json);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <button
                onClick={handleOpen}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                        <Edit3 className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white">Edit Resume JSON</h3>
                        <p className="text-[11px] text-gray-400">
                            {hasJson ? "View and edit the parsed resume data" : "No parsed JSON available yet"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasJson && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDownloadJson(); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Download JSON"
                        >
                            <Download className="w-3 h-3" />
                            JSON
                        </button>
                    )}
                    {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-5">
                    {!hasJson ? (
                        <div className="text-center py-8">
                            <FileText className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Upload your resume first to see the parsed JSON.</p>
                        </div>
                    ) : (
                        <>
                            <textarea
                                value={editJsonText}
                                onChange={(e) => setEditJsonText(e.target.value)}
                                rows={14}
                                spellCheck={false}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3 text-xs font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/40 transition resize-none"
                                placeholder='{ "basics": { "name": "..." }, ... }'
                            />
                            {editJsonError && (
                                <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1.5">
                                    <X className="w-3 h-3" /> {editJsonError}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    onClick={onValidate}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Validate
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={editJsonSaving || !editJsonText.trim()}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-xl transition-colors"
                                >
                                    {editJsonSaving ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-3.5 h-3.5" />
                                    )}
                                    {editJsonSaving ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main: ResumeTab
// ──────────────────────────────────────────────────────────────────────────────

export default function ResumeTab(props: ResumeTabProps) {
    const {
        candidateId,
        setupStatus,
        prefetchedSession,
        selectedTemplate,
        setSelectedTemplate,
        onUpload,
        resumeUploadLoading,
        onSaveJson,
        onValidateJson,
        onDownloadPdf,
        onDownloadJson,
        editJsonText,
        setEditJsonText,
        editJsonError,
        editJsonSaving,
        inlineResumeRef,
    } = props;

    const normalized = getNormalizedResume(prefetchedSession);
    const hasResume = Boolean(normalized);

    return (
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Resume</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Upload, preview, and manage your resume</p>
                    </div>
                </div>

                {/* Top-right actions — only when resume exists */}
                {hasResume && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onDownloadPdf}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download PDF
                        </button>
                    </div>
                )}
            </div>

            {/* Two-column layout on large screens */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                {/* Left column: controls */}
                <div className="xl:col-span-2 space-y-5">
                    {/* Upload card */}
                    <UploadZone
                        setupStatus={setupStatus}
                        loading={resumeUploadLoading}
                        onUpload={onUpload}
                        candidateId={candidateId}
                    />

                    {/* Template picker */}
                    <TemplatePicker selected={selectedTemplate} onSelect={setSelectedTemplate} />

                    {/* JSON editor */}
                    <JsonEditorPanel
                        prefetchedSession={prefetchedSession}
                        editJsonText={editJsonText}
                        setEditJsonText={setEditJsonText}
                        editJsonError={editJsonError}
                        editJsonSaving={editJsonSaving}
                        onSave={onSaveJson}
                        onValidate={onValidateJson}
                        onDownloadJson={onDownloadJson}
                    />
                </div>

                {/* Right column: live preview */}
                <div className="xl:col-span-3">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        {/* Preview header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Live Preview</span>
                                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full capitalize">
                                    {TEMPLATE_LABELS[selectedTemplate] ?? selectedTemplate}
                                </span>
                            </div>
                            {hasResume && (
                                <button
                                    onClick={onDownloadPdf}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    <Download className="w-3 h-3" />
                                    Export
                                </button>
                            )}
                        </div>

                        {/* Preview body */}
                        <div className="p-4 overflow-auto max-h-[70vh]">
                            {!hasResume ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                                        <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">No Resume Data</h3>
                                    <p className="text-sm text-gray-400 max-w-xs">
                                        Upload your resume file to see a live preview rendered on the selected template.
                                    </p>
                                </div>
                            ) : (
                                <div
                                    ref={inlineResumeRef}
                                    className="origin-top"
                                    style={{ transform: "scale(0.85)", transformOrigin: "top center" }}
                                >
                                    <ResumeRenderer
                                        templateId={selectedTemplate}
                                        data={normalized as ResumeData}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
