"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { toast, Toaster } from "sonner";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { ViewModal } from "./ViewModal";
import { ResumeRenderer } from "@/components/templates/ResumeRenderer";
import { normalizeResume } from "@/utils/resumeNormalizer";
import { validateResumeStructure } from "@/utils/resumeValidator";
import AiSetupTab from "./setup/AiSetupTab";
import {
    Mail,
    Upload,
    Phone,
    Calendar,
    Award,
    TrendingUp,
    Filter,
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    Briefcase,
    Target,
    Activity,
    BarChart3,
    Home,
    PlayCircle,
    Search,
    ExternalLink,
    MessageSquare,
    Video,
    Check,
    ChevronRight,
    LogOut,
    Settings,
    LayoutDashboard,
    Puzzle,
    Sparkles,
    Plus,

    ClipboardCheck,
    CalendarCheck,
    EyeIcon,
    EditIcon,
    KeyRound,
    Eye,
    Code2,
    FileText,
    MousePointerClick,
    Send,
    Zap,
    ClipboardList,
    Download,
    RefreshCw,
    Loader2,
    Edit3,
} from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/admin_ui/dropdown-menu";
import { apiFetch, API_BASE_URL, setupApi } from "@/lib/api";
import { TimePicker } from "@/components/admin_ui/TimePicker";
import { useAuth } from "@/utils/AuthContext";
import CandidateGrid from "./CandidateGrid";
import { CandidateSetupWizard } from "./CandidateSetupWizard";
import { CandidateLlmKeysPanel } from "./CandidateLlmKeysPanel";

import CandidateOnboarding from "./CandidateOnboarding";

import { ColDef, ValueFormatterParams } from "ag-grid-community";

interface DashboardData {
    basic_info: {
        id: number;
        full_name: string;
        email: string;
        phone: string;
        status: string;
        enrolled_date: string;
        batch_name: string;
        login_count: number;
        fee_paid: number;
    };
    journey: {
        enrolled: { completed: boolean; date: string; days_since: number };
        preparation: { completed: boolean; active: boolean; start_date: string; duration_days: number };
        marketing: { completed: boolean; active: boolean; start_date: string; duration_days: number };
        placement: { completed: boolean; active: boolean; company: string; position: string; date?: string };
    };
    phase_metrics: {
        enrolled: { date: string; batch_name: string; status: string };
        preparation?: { status: string; rating: string; communication: string; duration_days: number };
        marketing?: { total_interviews: number; positive_interviews: number; success_rate: number; duration_days: number };
        placement?: { company: string; position: string; base_salary: number; placement_date?: string };
    };
    team_info: {
        preparation: { instructors: Array<{ name: string; email: string; role: string }> };
        marketing: { manager?: { name: string; email: string } };
    };
    interview_stats: {
        total: number;
        positive: number;
        pending: number;
        negative: number;
        success_rate: number;
    };
    interviews: Array<{
        id: number;
        company: string;
        interview_date: string;
        type_of_interview: string;
        feedback: string;
        source_job_id?: string;
    }>;
    alerts: Array<{ type: string; phase: string; message: string }>;
    candidate_stats?: {
        total_days_in_system: number;
        days_in_preparation: number;
        days_in_marketing: number;
        days_since_placement: number;
        total_interviews: number;
        interview_success_rate: number;
        job_listings_clicked: number;
        outreach_counter: number;
        easy_apply_counter: number;
    };
}

interface UserProfile {
    uname: string;
    full_name: string;
    phone: string;
    login_count: number;
    last_login?: string;
    candidate_id?: number;
}

interface Session {
    sessionid: number;
    title: string;
    sessiondate: string;
    link?: string;
    videoid?: string;
    type: string;
    subject: string;
}

interface ApiError {
    message?: string;
    detail?: string;
    body?: {
        detail?: string;
        message?: string;
    };
    status?: number;
}

type TabType = 'overview' | 'sessions' | 'interviews' | 'jobs' | 'smartprep' | 'my_llm_key' | 'my_applications' | 'ai_setup' | 'my_resume';

const extractErrorMessage = (err: ApiError, defaultMessage: string): string => {
    return err.body?.detail || err.body?.message || err.detail || err.message || defaultMessage;
};


const FilterHeaderComponent = ({
    selectedItems,
    setSelectedItems,
    options,
    label,
    color = "blue",
    displayName,
    renderOption = (option: any) => option,
    getOptionValue = (option: any) => option,
    getOptionKey = (option: any) => option,
}: {
    selectedItems: any[];
    setSelectedItems: React.Dispatch<React.SetStateAction<any[]>>;
    options: any[];
    label: string;
    color?: string;
    displayName?: string;
    renderOption?: (option: any) => React.ReactNode;
    getOptionValue?: (option: any) => any;
    getOptionKey?: (option: any) => any;
}) => {
    const handleItemChange = (item: any) => {
        const value = getOptionValue(item);
        setSelectedItems((prev: any[]) => {
            const isSelected = prev.some((i) => getOptionValue(i) === value);
            return isSelected
                ? prev.filter((i) => getOptionValue(i) !== value)
                : [...prev, item];
        });
        setFilterVisible(false);
    };

    const filterButtonRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [filterVisible, setFilterVisible] = useState(false);

    const toggleFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (filterButtonRef.current) {
            const rect = filterButtonRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + window.scrollY,
                left: Math.max(0, rect.left + window.scrollX - 100),
            });
        }
        setFilterVisible((v) => !v);
    };

    const colorMap: Record<string, string> = {
        blue: "bg-blue-500",
        green: "bg-green-500",
        purple: "bg-purple-500",
        red: "bg-red-500",
        orange: "bg-orange-500",
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                filterButtonRef.current &&
                !filterButtonRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setFilterVisible(false);
            }
        };
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setFilterVisible(false);
            }
        };
        if (filterVisible) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [filterVisible]);

    return (
        <div className="ag-cell-label-container" role="presentation">
            <div className="ag-header-cell-label" role="presentation">
                <span className="ag-header-cell-text">{displayName || label}</span>
                <div
                    ref={filterButtonRef}
                    className="ag-header-icon ag-header-label-icon"
                    onClick={toggleFilter}
                    style={{
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        marginLeft: "4px",
                    }}
                >
                    {selectedItems.length > 0 && (
                        <span
                            className={`${colorMap[color]} min-w-[20px] rounded-full px-2 py-0.5 text-center text-[10px] text-white`}
                            style={{ marginRight: "4px" }}
                        >
                            {selectedItems.length}
                        </span>
                    )}
                    <Filter className="h-3.5 w-3.5" style={{ color: selectedItems.length > 0 ? "#3b82f6" : "#9ca3af" }} />
                </div>
            </div>

            {filterVisible &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="filter-dropdown pointer-events-auto fixed flex w-40 flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                        style={{
                            top: dropdownPos.top + 8,
                            left: dropdownPos.left,
                            zIndex: 9999,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="max-h-[300px] overflow-y-auto p-1.5">
                            {options.map((option) => {
                                const value = getOptionValue(option);
                                const isSelected = selectedItems.some((i) => getOptionValue(i) === value);
                                return (
                                    <div
                                        key={value}
                                        onClick={() => handleItemChange(option)}
                                        className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${isSelected
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <span>{renderOption(option)}</span>
                                        {isSelected && <Check className="h-4 w-4" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};

const StatusRenderer = ({ value }: { value?: string }) => {
    const status = value?.toLowerCase() || "";
    const variantMap: Record<string, string> = {
        open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
        closed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
        on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        duplicate: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
        invalid: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
        default: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    };
    const formatted = (value || "")
        .toString()
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

    return (
        <div className="flex items-center h-full">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${variantMap[status] || variantMap.default}`}>
                {formatted || "N/A"}
            </span>
        </div>
    );
};

export default function CandidateDashboard() {
    const router = useRouter();
    const pathname = usePathname();
    const { userRole } = useAuth() as { userRole: string };

    const getAiPrepApiUrl = () => {
        const isClient = typeof window !== "undefined";
        const isLocalhost = isClient && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
        return isLocalhost ? "http://localhost:8001/api" : (process.env.NEXT_PUBLIC_AIPREP_API_URL || "https://ai-backend-560359652969.us-central1.run.app/api");
    };
    const AIPREP_API = getAiPrepApiUrl();

    // --- CLICK TRACKING LOGIC (SW EDITION) ---
    const handleJobClick = useCallback(async (jobListingId: number, url: string) => {
        // 1. Save to local IndexedDB instantly (main thread)
        const { trackLocalClick } = await import('@/utils/clickTracker');
        await trackLocalClick(jobListingId);

        // 2. Notify Service Worker (runs in background)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'TRACK_CLICK',
                id: jobListingId
            });
        }

        // 3. Open link
        window.open(url, '_blank');
    }, []);

    // ----------------------------

    // ----------------------------

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [candidateId, setCandidateId] = useState<number | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [hasMissingFields, setHasMissingFields] = useState(true);
    const [agreementStatus, setAgreementStatus] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const getInitialTab = (): TabType => {
        if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            const t = searchParams.get("tab");
            if (t === "my_resume") return "my_resume";
        }
        return "jobs";
    };
    const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
    const [setupWizardOpen, setSetupWizardOpen] = useState(false);

    const goToTab = (tab: TabType) => {
        setSetupWizardOpen(false);
        setActiveTab(tab);
    };
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Sessions state
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);


    // Jobs state
    const [positions, setPositions] = useState<any[]>([]);
    const [filteredPositions, setFilteredPositions] = useState<any[]>([]);
    const [positionsLoading, setPositionsLoading] = useState(false);
    const [selectedModes, setSelectedModes] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [jobSearchTerm, setJobSearchTerm] = useState("");
    const [showAddInterview, setShowAddInterview] = useState(false);
    const [addInterviewForm, setAddInterviewForm] = useState({
        company: "",
        interview_date: "",
        interview_time: "10:00",
        interviewer_emails: "",
        position_title: "",
        mode_of_interview: "Virtual",
        type_of_interview: "Recruiter Call",
        interviewer_linkedin: "",
        interviewer_contact: "",
        job_description: "",
    });
    const [addInterviewLoading, setAddInterviewLoading] = useState(false);
    const [setupStatus, setSetupStatus] = useState<{ resume_uploaded: boolean; api_keys_configured: boolean; setup_complete: boolean; has_binary_resume?: boolean; binary_resume_filename?: string | null } | null>(null);
    const [setupWizardManageMode, setSetupWizardManageMode] = useState(false);
    const [prefetchedSession, setPrefetchedSession] = useState<{ sessionId: string; summaryData: any } | null>(null);
    const [prefetchDone, setPrefetchDone] = useState(false);

    const [viewResumeOpen, setViewResumeOpen] = useState(false);
    const [uploadResumeOpen, setUploadResumeOpen] = useState(false);
    
    // Inline Resume states & refs
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeUploadLoading, setResumeUploadLoading] = useState(false);
    const [resumeDragOver, setResumeDragOver] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState("elegant");
    const [showTemplates, setShowTemplates] = useState(false);
    const inlineFileInputRef = useRef<HTMLInputElement>(null);
    const inlineResumeRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [isEditingJson, setIsEditingJson] = useState(false);
    const [editJsonText, setEditJsonText] = useState("");
    const [editJsonError, setEditJsonError] = useState<string | null>(null);
    const [editJsonSaving, setEditJsonSaving] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [editInterviewForm, setEditInterviewForm] = useState<any>({});
    const [editInterviewLoading, setEditInterviewLoading] = useState(false);
    const [viewData, setViewData] = useState<any>(null);

    const handleInlineFileValidate = (file: File): boolean => {
        const allowedExtensions = [".pdf", ".doc", ".docx"];
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            toast.error("Invalid file format. Please upload a PDF, DOC, or DOCX file.");
            return false;
        }
        return true;
    };

    const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (handleInlineFileValidate(selectedFile)) {
                void handleInlineUpload(selectedFile);
            }
        }
    };

    const handleInlineUpload = async (fileToUpload: File) => {
        setResumeUploadLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : "";
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const uploadUrl = backendUrl.endsWith("/api")
            ? `${backendUrl}/candidates/${candidateId}/marketing/upload-resume`
            : `${backendUrl}/api/candidates/${candidateId}/marketing/upload-resume`;
            
        const formData = new FormData();
        formData.append("file", fileToUpload);

        try {
            const response = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to upload resume");
            }

            toast.success("Resume uploaded successfully!");
            setResumeFile(fileToUpload);
            setShowTemplates(false);
            setSetupStatus(prev => {
                const base = prev || { resume_uploaded: false, api_keys_configured: false, setup_complete: false };
                return {
                    ...base,
                    has_binary_resume: true,
                    binary_resume_filename: fileToUpload.name
                };
            });

            // Reload setup summary to fetch parsed JSON immediately
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const email = payload.sub || payload.email || payload.uname || "candidate";
                const resSummary = await fetch(`${AIPREP_API}/setup/init-and-summary`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ candidate_id: candidateId, wbl_email: email, name: email }),
                });
                if (resSummary.ok) {
                    const dataSummary = await resSummary.json();
                    if (dataSummary.summary) {
                        setPrefetchedSession({ sessionId: dataSummary.session_id, summaryData: dataSummary.summary });
                    }
                }
            } catch (reloadErr) {
                console.error("Failed to reload summary after upload:", reloadErr);
            }
        } catch (err: any) {
            toast.error(err.message || "Something went wrong during upload.");
            setResumeFile(null);
        } finally {
            setResumeUploadLoading(false);
        }
    };

    const handleSaveEditedJson = async () => {
        try {
            let parsed = null;
            try {
                parsed = JSON.parse(editJsonText);
            } catch (err: any) {
                setEditJsonError(`Syntax Error: ${err.message}`);
                return;
            }

            setEditJsonSaving(true);
            const prepToken = typeof window !== "undefined" ? localStorage.getItem("prep_token") : null;
            if (!prepToken) {
                throw new Error("No active session found.");
            }

            const formData = new FormData();
            const blob = new Blob([editJsonText], { type: "application/json" });
            formData.append("file", blob, "resume.json");
            formData.append("session_id", prepToken);

            const res = await fetch(`${AIPREP_API}/setup/resume`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to update resume JSON on server.");
            }

            toast.success("Resume JSON updated successfully!");
            
            if (prefetchedSession) {
                setPrefetchedSession({
                    ...prefetchedSession,
                    summaryData: {
                        ...prefetchedSession.summaryData,
                        resume_json: parsed,
                    }
                });
            }
            setIsEditingJson(false);
        } catch (err: any) {
            setEditJsonError(err.message || "An unexpected error occurred while saving.");
        } finally {
            setEditJsonSaving(false);
        }
    };

    const handleValidateJson = () => {
        const resumeJson = prefetchedSession?.summaryData?.resume_json;
        if (!resumeJson) {
            toast.error("No resume JSON data found to validate.");
            return;
        }

        const { isValid, errors, warnings } = validateResumeStructure(resumeJson);

        if (!isValid) {
            toast.error(`Validation Failed. Missing mandatory fields: ${errors.join(", ")}`);
        } else if (warnings.length > 0) {
            toast.warning(`Validation Passed with Warnings. Recommended fields missing: ${warnings.join(", ")}`);
        } else {
            toast.success("Validation Passed! JSON resume structure is perfectly valid.");
        }
    };

    const handleDownloadJson = () => {
        const jsonStr = JSON.stringify(prefetchedSession?.summaryData?.resume_json || {}, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = (prefetchedSession?.summaryData?.binary_resume_filename?.replace(/\.[^/.]+$/, "") || "resume") + ".json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleInlineDownload = () => {
        if (!inlineResumeRef.current) return;

        let candidateName = "Candidate";
        const rawResumeJson = prefetchedSession?.summaryData?.resume_json || null;
        if (rawResumeJson) {
            try {
                const parsed = normalizeResume(rawResumeJson);
                if (parsed?.fullName) {
                    candidateName = parsed.fullName;
                }
            } catch (e) {
                // ignore
            }
        }

        const opt = {
            margin:       0,
            filename:     `${candidateName.replace(/\s+/g, "_")}_Resume.pdf`,
            image:        { type: "jpeg", quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true,
                letterRendering: true
            },
            jsPDF:        { unit: "in", format: "letter", orientation: "portrait" }
        };

        const runHtml2Pdf = () => {
            const element = inlineResumeRef.current;
            (window as any).html2pdf().set(opt).from(element).save();
        };

        if (!(window as any).html2pdf) {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.onload = runHtml2Pdf;
            document.head.appendChild(script);
        } else {
            runHtml2Pdf();
        }
    };

    useEffect(() => {
        setMounted(true);
    }, [setMounted]);


    useEffect(() => {
        setupApi.getStatus()
            .then((d: any) => setSetupStatus(d))
            .catch(() => setSetupStatus(null));
    }, []);

    useEffect(() => {
        if (setupStatus?.has_binary_resume) {
            setShowTemplates(true);
        }
    }, [setupStatus]);

    // Pre-fetch AI prep session as soon as candidateId is available so the
    // wizard opens instantly when user clicks "Manage" (no 4-5s wait).
    useEffect(() => {
        if (!candidateId || prefetchDone) return;
        const run = async () => {
            try {
                const token = localStorage.getItem("access_token") || "";
                const payload = JSON.parse(atob(token.split(".")[1]));
                const email = payload.sub || payload.email || payload.uname || "candidate";

                const res = await fetch(`${AIPREP_API}/setup/init-and-summary`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ candidate_id: candidateId, wbl_email: email, name: email }),
                });
                if (!res.ok) return;
                const data = await res.json();
                const sid: string = data.session_id;
                const summaryData = data.summary;

                if (!sid) return;
                localStorage.setItem("prep_token", sid);

                setPrefetchedSession({ sessionId: sid, summaryData });
                setPrefetchDone(true);

                // Also update status badges
                const hasKeys = summaryData.has_api_key === true || (Array.isArray(summaryData.llm_keys) && summaryData.llm_keys.length > 0);
                const hasResume = summaryData.resume_text === "Exists" || (summaryData.resume_json != null && typeof summaryData.resume_json === "object");
                setSetupStatus({
                    resume_uploaded: hasResume,
                    api_keys_configured: hasKeys,
                    setup_complete: hasResume && hasKeys,
                    has_binary_resume: !!summaryData.has_binary_resume,
                    binary_resume_filename: summaryData.binary_resume_filename || null,
                });
            } catch {
                // Silently fail — wizard will fall back to its own fetch
            }
        };
        void run();
    }, [candidateId, prefetchDone]);

    useEffect(() => {
        if (!setupWizardOpen) {
            setSetupWizardManageMode(false);
            // Don't clear prefetchedSession — keep it for next open
        }
    }, [setupWizardOpen]);

    const refreshSetupStatus = async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                const d: any = await setupApi.getStatus();
                setSetupStatus(d);
                if (d?.setup_complete) {
                    return;
                }
            } catch {
                setSetupStatus(null);
                return;
            }
            await new Promise((r) => setTimeout(r, 150));
        }
    };

    const statusOptions = ['open', 'closed', 'on_hold', 'duplicate', 'invalid'];
    const typeOptions = ['full_time', 'contract', 'contract_to_hire', 'internship'];
    const modeOptions = ['All', 'Onsite', 'Hybrid', 'Remote'];
    const interviewColumnDefs: ColDef[] = useMemo(() => [
        {
            field: "company",
            headerName: "Company",
            flex: 2,
            minWidth: 200,
            pinned: 'left',
            cellRenderer: (params: any) => (
                <div className="flex items-center h-full">
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-[13px]">{params.value}</span>
                </div>
            )
        },
        {
            field: "type_of_interview",
            headerName: "Interview Round",
            flex: 1.5,
            minWidth: 160,
            cellRenderer: (params: any) => (
                <div className="flex items-center h-full gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        <Target className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{params.value || "Technical Round"}</span>
                </div>
            )
        },
        {
            field: "interview_date",
            headerName: "Schedule",
            flex: 1.5,
            minWidth: 160,
            cellRenderer: (params: any) => (
                <div className="flex items-center h-full gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {params.value ? format(parseISO(params.value), 'MMM dd, yyyy') : "TBD"}
                    </span>
                </div>
            )
        },
        {
            field: "mode_of_interview",
            headerName: "Mode",
            flex: 1,
            minWidth: 130,
            cellRenderer: (params: any) => (
                <div className="flex items-center h-full gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        <Video className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{params.value || "Virtual"}</span>
                </div>
            )
        },
        {
            field: "feedback",
            headerName: "Feedback",
            flex: 1,
            minWidth: 130,
            cellRenderer: (params: any) => {
                const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const newVal = e.target.value;
                    try {
                        await apiFetch(`/api/candidates/interviews/${params.data.id}/feedback?feedback=${newVal}`, {
                            method: "PATCH"
                        });
                        params.data.feedback = newVal;
                        params.api.refreshCells({ rowNodes: [params.node], force: true });
                    } catch (err) {
                        console.error("Failed to update feedback", err);
                    }
                };


                return (
                    <div className="flex items-center h-full gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <select
                            defaultValue={params.value || "Pending"}
                            onChange={handleChange}
                            className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Positive">Positive</option>
                            <option value="Negative">Negative</option>
                        </select>
                    </div>
                );
            }
        },
        {
            field: "feedback_text",
            headerName: "Feedback Text",
            flex: 2,
            minWidth: 250,
            editable: true,
            cellEditor: "agLargeTextCellEditor",
            cellEditorPopup: true,
            onCellValueChanged: async (params: any) => {
                const newVal = params.newValue;
                if (newVal === params.oldValue) return;

                try {
                    await apiFetch(`/api/interviews/${params.data.id}`, {
                        method: "PUT",
                        body: { feedback_text: newVal }
                    });
                    toast.success("Feedback saved!");
                } catch (err) {
                    console.error("Failed to update feedback text", err);
                    toast.error("Failed to save feedback.");
                }
            },
            cellRenderer: (params: any) => (
                <div className="flex items-center h-full gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate">
                        {params.value || <span className="italic opacity-50">Click to add feedback...</span>}
                    </div>
                </div>
            )
        },




    ], [candidateId]);

    const jobColumnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", width: 80, sortable: true, filter: "agNumberColumnFilter" },
        {
            field: "title",
            headerName: "Title",
            flex: 2,
            minWidth: 200,
            sortable: true,
            filter: "agTextColumnFilter",
            cellRenderer: (params: any) => {
                const rawJobId = params.data.source_job_id || params.data.source_uid;
                const jobId = (rawJobId && rawJobId !== 'undefined' && rawJobId !== 'null') ? rawJobId : null;
                const source = params.data.source?.toLowerCase() || "";
                const url = params.data.job_url ||
                    (jobId ? (source.includes('trueup')
                        ? `https://trueup.io/jobs/${jobId}`
                        : source.includes('hiring') || source.includes('cafe')
                            ? `https://hiring.cafe/viewjob/${jobId}`
                            : source.includes('jobright')
                                ? `https://jobright.ai/jobs/info/${jobId}`
                                : `https://www.linkedin.com/jobs/view/${jobId}`) : null);

                if (!url) {
                    return (
                        <div className="flex items-center h-full">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{params.value}</span>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center h-full">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                                e.preventDefault();
                                handleJobClick(params.data.id, url);
                            }}
                            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline decoration-blue-400 group flex items-center gap-1.5"
                        >
                            <span>{params.value}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    </div>
                );
            }
        },
        {
            field: "employment_mode",
            headerName: "Mode",
            width: 130,
            sortable: true,
            filter: false,
            headerComponent: FilterHeaderComponent,
            headerComponentParams: {
                selectedItems: selectedModes,
                setSelectedItems: (val: any) => {
                    const arr = typeof val === 'function' ? val(selectedModes) : val;
                    setSelectedModes(arr.includes('All') ? [] : arr);
                },
                options: modeOptions,
                label: "Mode",
                displayName: "Mode",
                color: "purple",
                renderOption: (opt: string) => opt
            },
            cellRenderer: (params: any) => {
                if (!params.value) return <span className="text-gray-400">-</span>;
                const mode = params.value.toLowerCase();
                const config: any = {
                    remote: {
                        bg: "bg-green-50 dark:bg-green-900/20",
                        text: "text-green-700 dark:text-green-400",
                        border: "border-green-100 dark:border-green-800/50",
                        dot: "bg-green-500"
                    },
                    hybrid: {
                        bg: "bg-blue-50 dark:bg-blue-900/20",
                        text: "text-blue-700 dark:text-blue-400",
                        border: "border-blue-100 dark:border-blue-800/50",
                        dot: "bg-blue-500"
                    },
                    onsite: {
                        bg: "bg-orange-50 dark:bg-orange-900/20",
                        text: "text-orange-700 dark:text-orange-400",
                        border: "border-orange-100 dark:border-orange-800/50",
                        dot: "bg-orange-500"
                    }
                };
                const style = config[mode] || {
                    bg: "bg-gray-50 dark:bg-gray-800",
                    text: "text-gray-600 dark:text-gray-400",
                    border: "border-gray-100 dark:border-gray-700",
                    dot: "bg-gray-400"
                };

                const formattedValue = params.value.charAt(0).toUpperCase() + params.value.slice(1).toLowerCase();

                return (
                    <div className="flex items-center h-full">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${style.bg} ${style.text} ${style.border}`}>
                            {formattedValue}
                        </span>
                    </div>
                );
            }
        },
        { field: "company_name", headerName: "Company", flex: 1.5, minWidth: 150, sortable: true, filter: "agTextColumnFilter" },
        {
            field: "position_type",
            headerName: "Type",
            width: 140,
            sortable: true,
            filter: false,
            headerComponent: FilterHeaderComponent,
            headerComponentParams: {
                selectedItems: selectedTypes,
                setSelectedItems: setSelectedTypes,
                options: typeOptions,
                label: "Type",
                displayName: "Type",
                color: "blue",
                renderOption: (opt: string) => opt.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            },
            valueFormatter: (params) => params.value ? params.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : "",
        },
        {
            field: "job_url_type",
            headerName: "Job URL Type",
            width: 130,
            sortable: true,
            filter: "agTextColumnFilter"
        },
        {
            headerName: "Location",
            flex: 1.5,
            minWidth: 150,
            sortable: true,
            filter: "agTextColumnFilter",
            valueGetter: (params: any) => {
                const city = params.data.city;
                const loc = params.data.location;
                if (city && loc) {
                    if (loc.toLowerCase().includes(city.toLowerCase())) return loc;
                    return `${city}, ${loc}`;
                }
                return city || loc || "";
            }
        },
        {
            field: "created_at",
            headerName: "Date",
            width: 120,
            sortable: true,
            filter: "agDateColumnFilter",
            filterParams: {
                comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
                    if (!cellValue) return -1;
                    const datePart = typeof cellValue === 'string' ? cellValue.split('T')[0] : new Date(cellValue).toISOString().split('T')[0];
                    const [year, month, day] = datePart.split('-');
                    const cellDate = new Date(Number(year), Number(month) - 1, Number(day));

                    if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                        return 0;
                    }
                    if (cellDate < filterLocalDateAtMidnight) {
                        return -1;
                    }
                    if (cellDate > filterLocalDateAtMidnight) {
                        return 1;
                    }
                },
            },
            valueFormatter: ({ value }: ValueFormatterParams) => {
                if (!value) return "-";
                const datePart = typeof value === 'string' ? value.split('T')[0] : new Date(value).toISOString().split('T')[0];
                const [year, month, day] = datePart.split('-');
                return `${month ?? ''}/${day ?? ''}/${year ?? ''}`;
            }
        },
        {
            headerName: "Apply",
            width: 100,
            cellRenderer: (params: any) => {
                const rawJobId = params.data.source_job_id || params.data.source_uid;
                const jobId = (rawJobId && rawJobId !== 'undefined' && rawJobId !== 'null') ? rawJobId : null;
                if (!jobId && !params.data.job_url) return <span className="text-gray-400">-</span>;

                const source = params.data.source?.toLowerCase() || "";
                const url = params.data.job_url ||
                    (jobId ? (source.includes('trueup')
                        ? `https://trueup.io/jobs/${jobId}`
                        : source.includes('hiring') || source.includes('cafe')
                            ? `https://hiring.cafe/viewjob/${jobId}`
                            : source.includes('jobright')
                                ? `https://jobright.ai/jobs/info/${jobId}`
                                : `https://www.linkedin.com/jobs/view/${jobId}`) : null);

                return (
                    <div className="flex items-center h-full">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                                e.preventDefault();
                                handleJobClick(params.data.id, url);
                            }}
                            className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs"
                        >
                            <span>Apply</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                );
            }
        },
    ], [selectedModes, selectedStatuses, selectedTypes]);

    useEffect(() => {
        let filtered = [...positions];

        // Apply Mode Filter — empty means 'All'
        if (selectedModes.length > 0 && !selectedModes.includes('All')) {
            filtered = filtered.filter(p =>
                p.employment_mode && selectedModes.some(m => p.employment_mode.toLowerCase() === m.toLowerCase())
            );
        }

        // Apply Status Filter
        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(p =>
                p.status && selectedStatuses.some(s => p.status.toLowerCase() === s.toLowerCase())
            );
        }

        // Apply Type Filter
        if (selectedTypes.length > 0) {
            filtered = filtered.filter(p =>
                p.position_type && selectedTypes.some(t => p.position_type.toLowerCase() === t.toLowerCase())
            );
        }

        // Apply Source Filter

        // Apply Search Term Filter
        if (jobSearchTerm.trim() !== "") {
            const lower = jobSearchTerm.toLowerCase();
            filtered = filtered.filter((p) =>
                (p.title?.toLowerCase().includes(lower)) ||
                (p.company_name?.toLowerCase().includes(lower)) ||
                (p.location?.toLowerCase().includes(lower))
            );
        }

        setFilteredPositions(filtered);
    }, [positions, selectedModes, selectedStatuses, selectedTypes, jobSearchTerm]);

    const handleAddInterview = async () => {
        const { company, interview_date, interviewer_emails, mode_of_interview, type_of_interview, position_title, job_description } = addInterviewForm;

        if (!company || !interview_date || !position_title || !mode_of_interview || !type_of_interview) {
            toast.error("Please fill in all mandatory fields (*)");
            return;
        }

        if (!candidateId) {
            toast.error("Candidate session not found. Please log in again.");
            return;
        }
        try {
            setAddInterviewLoading(true);
            await apiFetch(`/api/interviews`, {
                method: "POST",
                body: {
                    candidate_id: candidateId,
                    ...addInterviewForm
                }
            });

            toast.success("Interview added successfully!");
            setShowAddInterview(false);
            setAddInterviewForm({
                company: "", interview_date: "", interview_time: "10:00",
                interviewer_emails: "", position_title: "",
                mode_of_interview: "Virtual", type_of_interview: "Recruiter Call",
                interviewer_linkedin: "", interviewer_contact: "", job_description: ""
            });
            loadDashboard();
        } catch (err: any) {
            toast.error(err?.message || "Failed to add interview");
        } finally {
            setAddInterviewLoading(false);
        }
    };

    const handleEditInterview = async () => {
        if (!editData?.id) return;

        const requiredFields = {
            company: "Company",
            position_title: "Position Title",
            interview_date: "Interview Date",
            interview_time: "Interview Time",
            mode_of_interview: "Mode of Interview",
            type_of_interview: "Type of Interview"
        };
        for (const [field, label] of Object.entries(requiredFields)) {
            if (!editInterviewForm[field as keyof typeof editInterviewForm]) {
                toast.error(`${label} is required`);
                return;
            }
        }
        setEditInterviewLoading(true);
        try {
            const {
                id, candidate_full_name, instructor1_name, instructor2_name, instructor3_name,
                position_company, gcal_event_id, last_mod_datetime, candidate, ...updatePayload
            } = editInterviewForm;
            await apiFetch(`/api/interviews/${editData.id}`, {
                method: "PUT",
                body: updatePayload,
            });
            toast.success("Interview updated!");
            setEditData(null);
            loadDashboard();
        } catch {
            toast.error("Failed to update interview.");
        } finally {
            setEditInterviewLoading(false);
        }
    };
    const loadUserProfile = async () => {
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (!token) throw new Error("No token found");

            const data = await apiFetch("user_dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUserProfile(data);
            return data;
        } catch (err: any) {
            console.error("Error loading user profile:", err);
            return null;
        }
    };



    const getCandidateId = async (): Promise<number> => {
        try {
            if (typeof window !== "undefined") {
                const searchParams = new URLSearchParams(window.location.search);
                const queryCid = searchParams.get("candidateId");
                if (queryCid) {
                    const num = Number(queryCid);
                    if (!isNaN(num) && num > 0) return num;
                }
            }
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (!token) throw new Error("No token found");

            const userResponse = await apiFetch("user_dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!userResponse || !userResponse.uname) {
                throw new Error("User information not found");
            }

            if (userResponse.candidate_id) {
                return userResponse.candidate_id;
            }

            const userEmail = userResponse.uname;

            try {
                const candidateResponse = await apiFetch(
                    `candidates/search-names/${encodeURIComponent(userEmail)}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                let candidates = [];
                if (Array.isArray(candidateResponse)) {
                    candidates = candidateResponse;
                } else if (candidateResponse?.data && Array.isArray(candidateResponse.data)) {
                    candidates = candidateResponse.data;
                } else if (candidateResponse?.candidates && Array.isArray(candidateResponse.candidates)) {
                    candidates = candidateResponse.candidates;
                }

                if (candidates.length > 0) {
                    const exactMatch = candidates.find(
                        (c: any) => c.email?.toLowerCase() === userEmail.toLowerCase()
                    );

                    if (exactMatch && exactMatch.id) {
                        return exactMatch.id;
                    }

                    if (candidates[0] && candidates[0].id) {
                        return candidates[0].id;
                    }
                }
            } catch (searchErr: any) {
                console.warn(" Candidate search by email failed:", searchErr);
            }

            throw new Error("Candidate ID not found. Please ensure your account is linked to a candidate profile.");
        } catch (err: any) {
            console.error(" Error getting candidate ID:", err);
            throw new Error(extractErrorMessage(err, "Failed to get candidate ID. Please log in again."));
        }
    };

    const loadSessions = async () => {
        const fullName = data?.basic_info?.full_name;
        if (!fullName) return;

        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const firstName = fullName.split(" ")[0];

        try {
            setSessionsLoading(true);

            const searchQuery = firstName.toLowerCase();
            const params = new URLSearchParams({ search_title: searchQuery });
            const sessionData = await apiFetch(`session?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const sessionsList =
                sessionData?.sessions || sessionData?.data || (Array.isArray(sessionData) ? sessionData : []);

            const candidateSessions = Array.isArray(sessionsList)
                ? sessionsList.filter((session: Session) => {
                    if (!session || !session.sessiondate || !session.title) return false;

                    const titleLower = session.title.toLowerCase();
                    const firstNameLower = firstName.toLowerCase();
                    const fullNameLower = fullName.toLowerCase();

                    return titleLower.includes(firstNameLower) || titleLower.includes(fullNameLower);
                })
                : [];

            setSessions(candidateSessions);
        } catch (err) {
            console.error("Error loading sessions:", err);
            setSessions([]);
        } finally {
            setSessionsLoading(false);
        }
    };

    const loadPositions = async () => {
        try {
            setPositionsLoading(true);
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const posData = await apiFetch("positions/?limit=500", {
                headers: { Authorization: `Bearer ${token}` },
            });

                if (process.env.NODE_ENV === 'development') { console.log("🔍 API Response - Total jobs received:", posData?.length || 0); }
            if (process.env.NODE_ENV === 'development') { console.log("🔍 API Response - Sample job data:", posData?.[0] || {}); }

            // Filter to show jobs from LinkedIn, Hiring Cafe, TrueUp, or Jobright
            const filteredData = (posData || []).filter((pos: any) => {
                const src = pos.source?.toLowerCase() || "";
                const shouldInclude = src.includes('linkedin') || src.includes('hiring') || src.includes('cafe') || src.includes('trueup') || src.includes('jobright');

                // Add a check to confirm the job actually has an actionable link id or url
                const hasLink = Boolean(pos.source_job_id || pos.source_uid || pos.job_url);
                return shouldInclude && hasLink;
            });

            if (process.env.NODE_ENV === 'development') { console.log("📊 Final filtered positions count:", filteredData.length); }

            // Debug: Show source distribution
            const sourceCounts = filteredData.reduce((acc: any, pos: any) => {
                const src = pos.source?.toLowerCase() || 'unknown';
                acc[src] = (acc[src] || 0) + 1;
                return acc;
            }, {});

            if (process.env.NODE_ENV === 'development') { console.log("📈 Source distribution:", sourceCounts); }

            setPositions(filteredData);
        } catch (err) {
            console.error("❌ Error loading positions:", err);
        } finally {
            setPositionsLoading(false);
        }
    };


    const loadDashboard = async (retryCount = 0) => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("access_token") || localStorage.getItem("token");

            if (!token) {
                router.push("/login");
                return;
            }

            const profile = await loadUserProfile();
            const id = await getCandidateId();
            setCandidateId(id);

            if (!id) {
                throw new Error("Could not retrieve candidate ID");
            }

            // Fetch full profile to check for missing required fields
            const fullProfile = await apiFetch(`candidates/${id}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const requiredFields = [
                'full_name', 'email', 'phone', 'workstatus',
                'dob', 'github_link', 'workexperience', 'address',
                'linkedin_id'
            ];

            const profileData = {
                full_name: fullProfile?.personal_info?.full_name,
                email: fullProfile?.personal_info?.email,
                phone: fullProfile?.personal_info?.phone,
                workstatus: fullProfile?.personal_info?.workstatus,
                dob: fullProfile?.personal_info?.dob,
                github_link: fullProfile?.personal_info?.github_link,
                workexperience: fullProfile?.personal_info?.workexperience,
                address: fullProfile?.personal_info?.address,
                linkedin_id: fullProfile?.personal_info?.linkedin_id
            };

            // Use login_count from profile (UserDashboard) or Candidate profile
            const loginCount = profile?.login_count ?? profile?.logincount ?? 0;

            const isMissingRequiredFields = (loginCount <= 1) || requiredFields.some(field => !profileData[field as keyof typeof profileData]);

            setHasMissingFields(isMissingRequiredFields);

            const status = fullProfile?.enrollment?.agreement || 'N';
            setAgreementStatus(status);
            const isApproved = status === 'Y';
            const isSkipped = sessionStorage.getItem('onboarding_skipped') === 'true';


            // GATING LOGIC:
            // 1. If approved, only show onboarding if fields are missing (Step 1).
            // 2. If not approved, always show onboarding unless skipped in this session.
            // 3. After 10 logins, skip is no longer allowed.

            if (!isApproved) {
                // Not approved yet (N or P)
                if (!isSkipped || loginCount >= 10) {
                    setShowOnboarding(true);
                } else {
                    setShowOnboarding(false);
                }
            } else {
                // Approved (Y)
                if (isMissingRequiredFields) {
                    setShowOnboarding(true);
                } else {
                    setShowOnboarding(false);
                }
            }

            const dashboardData = await apiFetch(`candidates/${id}/dashboard/overview`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!dashboardData) {
                throw new Error("No data received from server");
            }

            setData(dashboardData);
        } catch (err: any) {
            console.error("Dashboard loading error:", err);

            const errorMessage = extractErrorMessage(err, "Failed to load dashboard");
            setError(errorMessage);

            if (retryCount === 0 && err.status >= 500) {
                setTimeout(() => loadDashboard(1), 2000);
                return;
            }

            if (err.status === 401 || err.status === 403) {
                localStorage.clear();
                router.push("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data) {
            const timeoutId = setTimeout(() => {
                loadSessions();
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    }, [data]);

    useEffect(() => {
        if (activeTab === 'jobs' && positions.length === 0) {
            loadPositions();
        }
        if (activeTab === 'interviews') {
            // Auto-refresh interview data when switching to this tab
            // so employee UI changes (feedback, notes) are visible immediately
            loadDashboard();
        }
        if (activeTab === 'my_resume' && candidateId) {
            const run = async () => {
                try {
                    const token = localStorage.getItem("access_token") || "";
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    const email = payload.sub || payload.email || payload.uname || "candidate";

                    const res = await fetch(`${AIPREP_API}/setup/init-and-summary`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ candidate_id: candidateId, wbl_email: email, name: email }),
                    });
                    if (res.ok) {
                        const dataSummary = await res.json();
                        const sid = dataSummary.session_id;
                        const summaryData = dataSummary.summary;
                        if (sid) {
                            localStorage.setItem("prep_token", sid);
                            setPrefetchedSession({ sessionId: sid, summaryData });
                            
                            const hasKeys = summaryData.has_api_key === true || (Array.isArray(summaryData.llm_keys) && summaryData.llm_keys.length > 0);
                            const hasResume = summaryData.resume_text === "Exists" || (summaryData.resume_json != null && typeof summaryData.resume_json === "object");
                            setSetupStatus({
                                resume_uploaded: hasResume,
                                api_keys_configured: hasKeys,
                                setup_complete: hasResume && hasKeys,
                                has_binary_resume: !!summaryData.has_binary_resume,
                                binary_resume_filename: summaryData.binary_resume_filename || null,
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to refresh setup status on tab switch:", err);
                }
            };
            void run();
        }
    }, [activeTab, candidateId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        if (isProfileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileOpen]);

    useEffect(() => {
        sessionStorage.removeItem('onboarding_skipped');
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Loading Dashboard...</h2>
                    <div className="flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[400px] flex items-center justify-center px-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 text-center max-w-md">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Connection Failed</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "Unable to load dashboard data"}</p>
                    <button
                        onClick={() => loadDashboard()}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-semibold"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (showOnboarding && candidateId) {
        return (
            <CandidateOnboarding
                candidateId={candidateId}
                loginCount={userProfile?.login_count || 0}
                currentAgreementStatus={agreementStatus || 'N'}
                initialHasMissingFields={hasMissingFields}
                onComplete={() => {
                    localStorage.setItem('onboarding_completed', 'true');
                    setShowOnboarding(false);
                    loadDashboard(); // Reload to see if approved
                }}
                onSkip={() => {
                    sessionStorage.setItem('onboarding_skipped', 'true');
                    setShowOnboarding(false);
                }}
            />
        );
    }

    const firstName = data.basic_info.full_name.split(" ")[0];

    const tabs = [
        { id: 'overview' as TabType, name: 'Overview', icon: Home },
        { id: 'jobs' as TabType, name: 'Job Board', icon: Briefcase },
        { id: 'ai_setup' as TabType, name: 'My LLM Setup', icon: Settings },
        { id: 'my_resume' as TabType, name: 'My Resume', icon: FileText },
        { id: 'sessions' as TabType, name: 'My Sessions', icon: PlayCircle },
        { id: 'interviews' as TabType, name: 'My Interviews', icon: MessageSquare },
        { id: 'my_applications' as TabType, name: 'My Applications', icon: ClipboardList },
    ];

    return (
        <div className="flex h-screen bg-[#f4f6f9] dark:bg-gray-950 overflow-hidden">
            {/* Hidden identity tag for browser extension telemetry */}
            {data?.basic_info?.email && (
                <div id="wbl-user-identity" data-email={data.basic_info.email} style={{ display: 'none' }} />
            )}

            {/* ==================== SIDEBAR ==================== */}
            <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30 shadow-sm">
                {/* Logo */}
                <div className="p-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">Whitebox</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navigation</p>
                        <div className="space-y-0.5">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <React.Fragment key={tab.id}>
                                        <button
                                            onClick={() => goToTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${isActive
                                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
                                            <span>{tab.name}</span>
                                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                        </button>

                                    </React.Fragment>
                                );
                            })}
                            <a
                                href="/coderpad"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
                            >
                                <Code2 className="w-4 h-4 flex-shrink-0 text-gray-400" aria-hidden />
                                <span>Coderpad</span>
                            </a>
                            <button
                                onClick={() => goToTab('smartprep')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${activeTab === 'smartprep'
                                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
                                    }`}
                            >
                                <Sparkles className={`w-4 h-4 flex-shrink-0 ${activeTab === 'smartprep' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`} />
                                <span>WBL SmartPrep</span>
                                {activeTab === 'smartprep' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                            </button>
                        </div>
                    </div>

                </nav>

            </aside>

            {/* ==================== MAIN CONTENT ==================== */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Top Bar */}
                <header className={`${activeTab === 'overview' ? 'min-h-[80px] lg:min-h-[100px] py-3' : 'min-h-[56px] lg:min-h-[64px] py-2'} flex items-center justify-between px-4 lg:px-6 bg-[#f4f6f9] dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 z-20 flex-shrink-0`}>
                    <div className="flex items-center gap-4 flex-1">
                        {/* Mobile logo */}
                        <div className="lg:hidden flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Briefcase className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        {/* Candidate Details Card - show only on Overview tab */}
                        {activeTab === 'overview' && !viewResumeOpen && !setupWizardOpen && !pathname?.includes('resume') && (
                            <div className="hidden sm:flex items-center gap-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-8 py-5 shadow-sm">
                            {/* Greeting + Name + Email */}
                            <div className="flex items-center gap-4 pr-6 border-r border-gray-100 dark:border-gray-700">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md">
                                    {data.basic_info.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                    {activeTab === 'overview' ? (
                                        <>
                                            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-0.5">Welcome back</p>
                                            <h1 className="text-lg font-extrabold text-gray-900 dark:text-white leading-none whitespace-nowrap">Hi, {firstName}</h1>
                                        </>
                                    ) : (
                                        <h1 className="text-lg font-extrabold text-gray-900 dark:text-white leading-none whitespace-nowrap">{data.basic_info.full_name}</h1>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1 truncate">{data.basic_info.email}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            {[
                                { icon: Award, label: "Batch", value: data.basic_info.batch_name || "N/A", color: "text-purple-500", widthClass: "w-40" },
                                { icon: Calendar, label: "Enrolled", value: data.basic_info.enrolled_date ? format(parseISO(data.basic_info.enrolled_date), "MMM dd, yyyy") : "N/A", color: "text-green-500", widthClass: "w-36" },
                                { icon: Briefcase, label: "Fee Paid", value: `$${data.basic_info.fee_paid || 0}`, color: "text-emerald-500", widthClass: "w-24" },
                                { icon: Activity, label: "Logins", value: `${userProfile?.login_count || 0}`, color: "text-orange-500", widthClass: "w-24" },
                            ].map(({ icon: Icon, label, value, color, widthClass }) => (
                                <div key={label} className={`hidden lg:flex flex-col gap-1 ${widthClass || "min-w-0"}`}>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                                    <div className="flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{value}</span>
                                    </div>
                                </div>
                            ))}
                            </div>
                        )}

                    </div>

                    {activeTab === 'jobs' && (
                        <div className="flex items-center gap-3">
                            <a
                                href="https://chromewebstore.google.com/detail/talentscreen-whitebox-lea/bebdlhhpgmegdebdballinfmfnlpmeio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative hidden lg:flex items-center p-[2px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 hover:shadow-[0_8px_25px_-5px_rgba(168,85,247,0.7)] active:scale-95"
                            >
                                <div className="flex items-center gap-2.5 px-5 py-2 bg-purple-100 dark:bg-[#1c1822] rounded-full group-hover:bg-transparent transition-colors duration-300 w-full h-full">
                                    <Sparkles className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors duration-300" />
                                    <span className="font-medium text-purple-600 group-hover:text-white text-[15px] whitespace-nowrap transition-colors duration-300">
                                        Autofill Extension
                                    </span>
                                    <ChevronRight className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                            </a>
                        </div>
                    )}

                </header>

                {/* Mobile Tab Bar */}
                <div className="lg:hidden flex gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-x-auto flex-shrink-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <React.Fragment key={tab.id}>
                                <button
                                    onClick={() => goToTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-bold transition-all flex-shrink-0 ${isActive
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {tab.name}
                                </button>

                            </React.Fragment>
                        );
                    })}
                    <a
                        href="/coderpad"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-bold transition-all flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    >
                        <Puzzle className="w-3.5 h-3.5" />
                        CoderPad
                    </a>
                    <button
                        onClick={() => goToTab('smartprep')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-bold transition-all flex-shrink-0 ${activeTab === 'smartprep'
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        WBL SmartPrep
                    </button>
                </div>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-hidden flex flex-col">

                    {/* Alerts Banner */}
                    {data.alerts && data.alerts.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-4 lg:px-6 pt-4">
                            {data.alerts.map((alert, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium flex-1 min-w-[200px] ${alert.type === "warning"
                                        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300"
                                        }`}
                                >
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{alert.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ==================== TAB CONTENT ==================== */}
                    <div className="flex-1 overflow-hidden flex flex-col animate-fadeIn">
                        {setupWizardOpen ? (
                            <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4 lg:p-6">
                                <CandidateSetupWizard
                                    variant="embedded"
                                    candidateId={candidateId ?? undefined}
                                    manageMode={setupWizardManageMode}
                                    prefetchedSession={prefetchedSession}
                                    onSetupComplete={async () => {
                                        await refreshSetupStatus();
                                        // Invalidate prefetch so next open re-fetches fresh data
                                        setPrefetchDone(false);
                                        setPrefetchedSession(null);
                                        goToTab("smartprep");
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                {activeTab === 'ai_setup' && (
                                    <div className="flex-1 overflow-y-auto h-full w-full">
                                        <AiSetupTab candidateId={candidateId ?? undefined} onFinishSetup={() => goToTab('smartprep')} />
                                    </div>
                                )}
                                {activeTab === 'overview' && (
                                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                                        {/* Phase Cards Row */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <PhaseCard
                                                title="Enrolled"
                                                icon={<CheckCircle className="w-5 h-5" />}
                                                color="gray"
                                                completed={data.journey.enrolled.completed}
                                                daysSince={data.journey.enrolled.days_since}
                                                batchName={data.basic_info.batch_name}
                                                date={data.journey.enrolled.date ? format(parseISO(data.journey.enrolled.date), "MMM dd, yyyy") : undefined}
                                            />
                                            <PhaseCard
                                                title="Preparation"
                                                icon={<Target className="w-5 h-5" />}
                                                color="gray"
                                                active={data.journey.preparation.active}
                                                completed={data.journey.preparation.completed}
                                                durationDays={data.journey.preparation.duration_days}
                                            />
                                            <PhaseCard
                                                title="Marketing"
                                                icon={<TrendingUp className="w-5 h-5" />}
                                                color="gray"
                                                active={data.journey.marketing.active}
                                                completed={data.journey.marketing.completed}
                                                durationDays={data.journey.marketing.duration_days}
                                            />
                                            <PhaseCard
                                                title="Placement"
                                                icon={<Briefcase className="w-5 h-5" />}
                                                color="gray"
                                                active={data.journey.placement.active}
                                                completed={data.journey.placement.completed}
                                                company={data.phase_metrics.placement?.company}
                                                date={data.journey.placement.date ? format(parseISO(data.journey.placement.date), "MMM dd, yyyy") : undefined}
                                            />
                                        </div>


                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                            {/* JOURNEY SECTION */}
                                            <div className="lg:col-span-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                                <div className="mb-5">
                                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Your Career Journey</h2>
                                                    <p className="text-xs text-gray-400 mt-0.5">Track your progress from enrollment to placement.</p>
                                                </div>

                                                <div className="relative px-2 py-1">
                                                    {/* Line Background */}
                                                    <div className="hidden md:block absolute top-[18px] left-8 right-8 h-0.5 bg-gray-100 dark:bg-gray-800 rounded-full z-0" />
                                                    {/* Active Progress Line */}
                                                    <div
                                                        className="hidden md:block absolute top-[18px] left-8 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full z-0 transition-all duration-1000"
                                                        style={{
                                                            width: `calc(${(data.journey.placement.completed ? 100 :
                                                                data.journey.placement.active ? 87.5 :
                                                                    data.journey.marketing.completed ? 75 :
                                                                        data.journey.marketing.active ? 62.5 :
                                                                            data.journey.preparation.completed ? 50 :
                                                                                data.journey.preparation.active ? 37.5 :
                                                                                    data.journey.enrolled.completed ? 25 : 0)
                                                                }% - 4rem)`
                                                        }}
                                                    />
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-10">
                                                        {[
                                                            {
                                                                id: 'enrolled',
                                                                title: 'Enrolled',
                                                                date: data.journey.enrolled.date,
                                                                status: (data.journey.enrolled.completed || data.journey.preparation.active || data.journey.preparation.completed) ? 'completed' : 'active',
                                                                icon: CheckCircle,
                                                                description: data.basic_info.batch_name
                                                            },
                                                            {
                                                                id: 'preparation',
                                                                title: 'Preparation',
                                                                date: data.journey.preparation.start_date,
                                                                status: (data.journey.preparation.completed || data.journey.marketing.active || data.journey.marketing.completed) ? 'completed' : data.journey.preparation.active ? 'active' : 'upcoming',
                                                                icon: Target,
                                                                duration: data.journey.preparation.duration_days
                                                            },
                                                            {
                                                                id: 'marketing',
                                                                title: 'Marketing',
                                                                date: data.journey.marketing.start_date,
                                                                status: (data.journey.marketing.completed || data.journey.placement.active || data.journey.placement.completed) ? 'completed' : data.journey.marketing.active ? 'active' : 'upcoming',
                                                                icon: TrendingUp,
                                                                duration: data.journey.marketing.duration_days
                                                            },
                                                            {
                                                                id: 'placement',
                                                                title: 'Placement',
                                                                date: data.journey.placement.date,
                                                                status: data.journey.placement.completed ? 'completed' : data.journey.placement.active ? 'active' : 'upcoming',
                                                                icon: Briefcase,
                                                                company: data.phase_metrics?.placement?.company
                                                            }
                                                        ].map((step, idx) => (
                                                            <div key={idx} className="flex flex-row md:flex-col items-center group relative">
                                                                {idx !== 3 && (
                                                                    <div className="md:hidden absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-700 -z-10" />
                                                                )}
                                                                <div
                                                                    className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm border-2 ${step.status === 'completed'
                                                                        ? 'bg-blue-500 border-blue-400 text-white group-hover:scale-110'
                                                                        : step.status === 'active'
                                                                            ? 'bg-white dark:bg-gray-900 border-blue-500 text-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30'
                                                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300'
                                                                        }`}
                                                                >
                                                                    <step.icon className={`w-4 h-4 ${step.status === 'active' ? 'animate-pulse' : ''}`} />
                                                                </div>
                                                                <div className="ml-4 md:ml-0 md:mt-3 text-left md:text-center flex-1">
                                                                    <div className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${step.status === 'completed' ? 'text-blue-500' : step.status === 'active' ? 'text-blue-400' : 'text-gray-300'}`}>
                                                                        Step 0{idx + 1}
                                                                    </div>
                                                                    <h3 className={`text-xs font-bold mb-1 ${step.status === 'upcoming' ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                                        {step.title}
                                                                    </h3>
                                                                    <div className="min-h-[28px] flex flex-col justify-start md:items-center">
                                                                        {step.date ? (
                                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-[9px] font-medium text-gray-500">
                                                                                <Calendar className="w-2.5 h-2.5" />
                                                                                {format(parseISO(step.date), "MMM dd, yyyy")}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[9px] text-gray-300 italic">{step.status === 'upcoming' ? 'Upcoming' : 'Pending'}</span>
                                                                        )}
                                                                        {step.status === 'active' && step.duration && (
                                                                            <span className="mt-0.5 text-[9px] font-bold text-orange-500 uppercase tracking-wide">Day {step.duration}</span>
                                                                        )}
                                                                        {step.company && (
                                                                            <span className="mt-0.5 text-[9px] font-bold text-blue-500 truncate">{step.company}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* MY TEAM SECTION */}
                                            <div className="lg:col-span-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">My Team</h2>
                                                <p className="text-xs text-gray-400 mb-4">Your professional support network.</p>

                                                <div className="space-y-4">
                                                    <div>
                                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Instructors</h3>
                                                        <div className="space-y-2">
                                                            {data.team_info.preparation.instructors.map((instructor, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs flex-shrink-0">
                                                                        {instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{instructor.name}</h4>
                                                                        <p className="text-[10px] text-gray-400 truncate">{instructor.role || "Instructor"}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {data.team_info.marketing.manager && (
                                                        <div>
                                                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Marketing</h3>
                                                            <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                                                                <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs flex-shrink-0">
                                                                    {data.team_info.marketing.manager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{data.team_info.marketing.manager.name}</h4>
                                                                    <p className="text-[10px] text-gray-400">Marketing Manager</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'sessions' && (
                                    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                                <div>
                                                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <PlayCircle className="w-4 h-4 text-blue-500" />
                                                        Sessions
                                                    </h2>
                                                    <p className="text-xs text-gray-400 mt-0.5">Your recorded and upcoming sessions.</p>
                                                </div>
                                            </div>

                                            {sessionsLoading ? (
                                                <div className="text-center py-12">
                                                    <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                                                    <p className="text-sm text-gray-400">Loading your sessions...</p>
                                                </div>
                                            ) : sessions.length === 0 ? (
                                                <div className="text-center py-16">
                                                    <PlayCircle className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">No Sessions Found</h3>
                                                    <p className="text-sm text-gray-400">
                                                        {`No sessions found for ${firstName} yet`}
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-xs text-gray-400 mb-3">Found <span className="font-bold text-blue-600">{sessions.length}</span> sessions</p>
                                                    <div className="overflow-hidden border border-gray-100 dark:border-gray-800 rounded-xl">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                                                    <th className="px-4 py-2.5">Session Title</th>
                                                                    <th className="px-4 py-2.5 hidden sm:table-cell">Date</th>
                                                                    <th className="px-4 py-2.5 text-right">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                                                {sessions.map((session) => (
                                                                    <tr key={session.sessionid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                                        <td className="px-4 py-2.5 max-w-xs sm:max-w-md">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{session.title || "Untitled"}</span>
                                                                                <span className="text-[10px] text-gray-400 sm:hidden">
                                                                                    {session.sessiondate ? format(parseISO(session.sessiondate), "MMM dd, yyyy") : "N/A"}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-gray-500">
                                                                            {session.sessiondate ? format(parseISO(session.sessiondate), "MMM dd, yyyy") : "N/A"}
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-right">
                                                                            {session.link ? (
                                                                                <a href={session.link} target="_blank" rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors text-[11px] font-bold">
                                                                                    <PlayCircle size={13} />
                                                                                    Watch
                                                                                </a>
                                                                            ) : (
                                                                                <span className="text-[10px] text-gray-300">N/A</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'interviews' && (
                                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2">
                                                    <MessageSquare className="w-5 h-5 text-blue-600" />
                                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Interviews</h2>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => loadDashboard()}
                                                        disabled={loading}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                                        title="Refresh interviews"
                                                    >
                                                        <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        Refresh
                                                    </button>
                                                    <button
                                                        onClick={() => setShowAddInterview(true)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
                                                    >
                                                        <Plus className="w-4 h-4" /> Schedule Interview
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Add Interview Modal Overlay */}
                                            {showAddInterview && (
                                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                                                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-blue-300 dark:border-blue-800 w-full max-w-4xl overflow-hidden">

                                                        {/* Header: matches Employee UI exactly */}
                                                        <div className="flex items-center justify-between px-6 py-3 border-b border-blue-100 dark:border-blue-900 bg-white dark:bg-gray-900">
                                                            <h3 className="text-[15px] font-bold text-blue-600 dark:text-blue-400">Add New Interviews</h3>
                                                            <button onClick={() => setShowAddInterview(false)} className="text-blue-300 hover:text-blue-500 transition-colors text-2xl font-light">×</button>
                                                        </div>

                                                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">

                                                                {/* Column 1: Basic Information */}
                                                                <div className="space-y-4">
                                                                    <div className="border-b border-blue-100 dark:border-blue-900 pb-1 mb-4">
                                                                        <h4 className="text-[14px] font-bold text-blue-600">Company Information</h4>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Company <span className="text-red-500 font-bold">*</span></label>
                                                                        <input type="text" value={addInterviewForm.company} onChange={e => setAddInterviewForm(p => ({ ...p, company: e.target.value }))}
                                                                            className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" placeholder="Search company..." />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Position Title</label>
                                                                        <input type="text" value={addInterviewForm.position_title} onChange={e => setAddInterviewForm(p => ({ ...p, position_title: e.target.value }))}
                                                                            className="w-full rounded-lg border border-blue-100 dark:border-blue-800 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interview Date <span className="text-red-500 font-bold">*</span></label>
                                                                        <input type="date" value={addInterviewForm.interview_date} onChange={e => setAddInterviewForm(p => ({ ...p, interview_date: e.target.value }))}
                                                                            className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interview Time <span className="text-red-500 font-bold">*</span></label>
                                                                        <TimePicker
                                                                            value={addInterviewForm.interview_time}
                                                                            onChange={(time) => setAddInterviewForm(p => ({ ...p, interview_time: time }))}
                                                                        />
                                                                    </div>
                                                                </div>



                                                                {/* Column 2: Contact Information */}
                                                                <div className="space-y-4">
                                                                    <div className="border-b border-blue-100 dark:border-blue-900 pb-1 mb-4">
                                                                        <h4 className="text-[14px] font-bold text-blue-600">Interviewer Information</h4>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interviewer Emails</label>
                                                                        <input type="email" value={addInterviewForm.interviewer_emails} onChange={e => setAddInterviewForm(p => ({ ...p, interviewer_emails: e.target.value }))}
                                                                            className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interviewer Contact</label>
                                                                        <input type="text" value={addInterviewForm.interviewer_contact} onChange={e => setAddInterviewForm(p => ({ ...p, interviewer_contact: e.target.value }))}
                                                                            className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interviewer LinkedIn</label>
                                                                        <input type="text" value={addInterviewForm.interviewer_linkedin} onChange={e => setAddInterviewForm(p => ({ ...p, interviewer_linkedin: e.target.value }))}
                                                                            className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" />
                                                                    </div>
                                                                </div>

                                                                {/* Column 4: Other */}
                                                                <div className="space-y-4">
                                                                    <div className="border-b border-blue-100 dark:border-blue-900 pb-1 mb-4">
                                                                        <h4 className="text-[14px] font-bold text-blue-600">Interview Details</h4>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Mode of Interview <span className="text-red-500 font-bold">*</span></label>
                                                                        <select value={addInterviewForm.mode_of_interview} onChange={e => setAddInterviewForm(p => ({ ...p, mode_of_interview: e.target.value }))}
                                                                            className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm">
                                                                            <option>Virtual</option><option>In Person</option><option>Phone</option><option>Assessment</option><option>AI Interview</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Type of Interview <span className="text-red-500 font-bold">*</span></label>
                                                                        <select value={addInterviewForm.type_of_interview} onChange={e => setAddInterviewForm(p => ({ ...p, type_of_interview: e.target.value }))}
                                                                            className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm">
                                                                            <option>Recruiter Call</option><option>Technical</option><option>HR</option><option>Prep Call</option>
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                </div>
                                                                {/* Job Description Field */}
                                                                <div className="mt-8 border-t border-blue-50 dark:border-blue-900/50 pt-6">
                                                                    <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-2">
                                                                        Job Description
                                                                    </label>
                                                                    <textarea
                                                                        value={addInterviewForm.job_description}
                                                                        onChange={e => setAddInterviewForm(p => ({ ...p, job_description: e.target.value }))}
                                                                        placeholder="Enter Job Description..."
                                                                        className="w-full h-32 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm resize-none placeholder:text-gray-400" />
                                                                </div>
                                                            </div>

                                                            {/* Footer Buttons */}
                                                            <div className="mt-10 pt-4 border-t border-blue-50 dark:border-blue-900 flex justify-end gap-3">
                                                                <button onClick={() => setShowAddInterview(false)}
                                                                    className="px-6 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all">
                                                                    Cancel
                                                                </button>
                                                                <button onClick={handleAddInterview} disabled={addInterviewLoading}
                                                                    className="px-8 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50">
                                                                    {addInterviewLoading ? "Saving..." : "Schedule Interview"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* View Interview Modal */}
                                            {mounted && viewData && createPortal(
                                                (
                                                    <div
                                                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                                                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                                                    >
                                                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-blue-300 dark:border-blue-800 w-full max-w-4xl overflow-hidden">
                                                            <div className="flex items-center justify-between px-6 py-2.5 border-b border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-darklight dark:via-dark dark:to-darklight">
                                                                <h3 className="text-base font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">View Interview</h3>
                                                                <button onClick={() => setViewData(null)} className="text-blue-300 hover:text-blue-500 transition-colors text-2xl font-light">×</button>
                                                            </div>
                                                            <div className="p-6 max-h-[80vh] overflow-y-auto">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">
                                                                    <div className="space-y-4">
                                                                        <div className="border-b border-blue-100 dark:border-blue-900 pb-1 mb-4"><h4 className="text-[14px] font-bold text-blue-600">Company Information</h4></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Company <span className="text-red-600 font-black">*</span></label>
                                                                            <input type="text" readOnly value={viewData.company ?? ''} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none cursor-default" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Position Title <span className="text-red-600 font-black">*</span></label>
                                                                            <input type="text" readOnly value={viewData.position_title ?? ''} className="w-full rounded-lg border border-blue-100 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none cursor-default" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interview Date <span className="text-red-600 font-black">*</span></label>
                                                                            <input type="text" readOnly value={viewData.interview_date ?? ''} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none cursor-default" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interview Time <span className="text-red-600 font-black">*</span></label>
                                                                            <input type="text" readOnly value={viewData.interview_time ? new Date(`1970-01-01T${viewData.interview_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true, }) : ''} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none cursor-default" /></div>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <div className="border-b border-blue-100 dark:border-blue-900 pb-1 mb-4"><h4 className="text-[14px] font-bold text-blue-600">Interviewer Information</h4></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interviewer Email</label>
                                                                            <input type="email" readOnly value={viewData.interviewer_emails ?? ''} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none cursor-default" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interviewer Contact</label>
                                                                            <input type="text" readOnly value={viewData.interviewer_contact ?? ''} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none cursor-default" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interviewer LinkedIn</label>
                                                                            <input type="text" readOnly value={viewData.interviewer_linkedin ?? ''} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none cursor-default" /></div>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <div className="border-b border-blue-100 dark:border-blue-900 pb-1 mb-4"><h4 className="text-[14px] font-bold text-blue-600">Interview Details</h4></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Mode of Interview <span className="text-red-600 font-black">*</span></label>
                                                                            <input type="text" readOnly value={viewData.mode_of_interview ?? ''} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none cursor-default" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Type of Interview <span className="text-red-600 font-black">*</span></label>
                                                                            <input type="text" readOnly value={viewData.type_of_interview ?? ''} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none cursor-default" /></div>
                                                                        <div>
                                                                            <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Feedback</label>
                                                                            <input type="text" readOnly value={viewData.feedback ?? 'Pending'} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none cursor-default" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-8 border-t border-blue-50 dark:border-blue-900/50 pt-6">
                                                                    <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-2">Job Description</label>
                                                                    <textarea readOnly value={viewData.job_description ?? ''} className="w-full h-32 rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm focus:outline-none resize-none cursor-default" />
                                                                </div>
                                                                <div className="mt-4">
                                                                    <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-2">Feedback Text</label>
                                                                    <textarea readOnly value={viewData.feedback_text ?? ''} className="w-full h-32 rounded-lg border border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm focus:outline-none resize-none cursor-default" />
                                                                </div>
                                                                <div className="mt-10 pt-4 border-t border-blue-50 dark:border-blue-900 flex justify-end gap-3">
                                                                    <button onClick={() => setViewData(null)} className="px-8 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md">Close</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                                document.body
                                            )}

                                            {/* Edit Interview Modal */}
                                            {mounted && editData && createPortal(
                                                (
                                                    <div
                                                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                                                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                                                    >
                                                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-blue-300 dark:border-blue-800 w-full max-w-4xl overflow-hidden">
                                                            <div className="flex items-center justify-between px-6 py-2.5 border-b border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-darklight dark:via-dark dark:to-darklight">
                                                                <h3 className="text-base font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Edit Interview</h3>
                                                                <button onClick={() => setEditData(null)} className="text-blue-300 hover:text-blue-500 transition-colors text-2xl font-light">×</button>
                                                            </div>
                                                            <div className="p-6 max-h-[80vh] overflow-y-auto">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">
                                                                    <div className="space-y-4">
                                                                        <div className="border-b border-blue-100 dark:border-blue-900 pb-1 mb-4"><h4 className="text-[14px] font-bold text-blue-600">Company Information</h4></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Company <span className="text-red-600 font-black">*</span></label>
                                                                            <input type="text" value={editInterviewForm.company ?? ''} onChange={e => setEditInterviewForm((p: any) => ({ ...p, company: e.target.value }))} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Position Title <span className="text-red-600 font-black">*</span></label>
                                                                            <input type="text" value={editInterviewForm.position_title ?? ''} onChange={e => setEditInterviewForm((p: any) => ({ ...p, position_title: e.target.value }))} className="w-full rounded-lg border border-blue-100 dark:border-blue-800 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interview Date <span className="text-red-600 font-black">*</span></label>
                                                                            <input type="date" value={editInterviewForm.interview_date ?? ''} onChange={e => setEditInterviewForm((p: any) => ({ ...p, interview_date: e.target.value }))} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interview Time <span className="text-red-600 font-black">*</span></label>
                                                                            <TimePicker
                                                                                value={editInterviewForm.interview_time}
                                                                                onChange={(time) => setEditInterviewForm((p: any) => ({ ...p, interview_time: time }))}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <div className="border-b border-blue-100 dark:border-blue-900 pb-1 mb-4"><h4 className="text-[14px] font-bold text-blue-600">Interviewer Information</h4></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interviewer Emails</label>
                                                                            <input type="email" value={editInterviewForm.interviewer_emails ?? ''} onChange={e => setEditInterviewForm((p: any) => ({ ...p, interviewer_emails: e.target.value }))} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interviewer Contact</label>
                                                                            <input type="text" value={editInterviewForm.interviewer_contact ?? ''} onChange={e => setEditInterviewForm((p: any) => ({ ...p, interviewer_contact: e.target.value }))} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" /></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Interviewer LinkedIn</label>
                                                                            <input type="text" value={editInterviewForm.interviewer_linkedin ?? ''} onChange={e => setEditInterviewForm((p: any) => ({ ...p, interviewer_linkedin: e.target.value }))} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm" /></div>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <div className="border-b border-blue-100 dark:border-blue-900 pb-1 mb-4"><h4 className="text-[14px] font-bold text-blue-600">Interview Details</h4></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Mode of Interview <span className="text-red-600 font-black">*</span></label>
                                                                            <select value={editInterviewForm.mode_of_interview ?? ''} onChange={e => setEditInterviewForm((p: any) => ({ ...p, mode_of_interview: e.target.value }))} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm">
                                                                                <option>Virtual</option><option>In Person</option><option>Phone</option><option>Assessment</option><option>AI Interview</option>
                                                                            </select></div>
                                                                        <div><label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Type of Interview <span className="text-red-600 font-black">*</span></label>
                                                                            <select value={editInterviewForm.type_of_interview ?? ''} onChange={e => setEditInterviewForm((p: any) => ({ ...p, type_of_interview: e.target.value }))} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm">
                                                                                <option>Recruiter Call</option><option>Technical</option><option>HR</option><option>Prep Call</option>
                                                                            </select></div>
                                                                        <div>
                                                                            <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-1">Feedback</label>
                                                                            <select value={editInterviewForm.feedback ?? 'Pending'} onChange={e => setEditInterviewForm((p: any) => ({ ...p, feedback: e.target.value }))} className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm">
                                                                                <option value="Pending">Pending</option>
                                                                                <option value="Positive">Positive</option>
                                                                                <option value="Negative">Negative</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-8 border-t border-blue-50 dark:border-blue-900/50 pt-6">
                                                                    <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-2">Job Description</label>
                                                                    <textarea value={editInterviewForm.job_description ?? ''} onChange={e => setEditInterviewForm((p: any) => ({ ...p, job_description: e.target.value }))} placeholder="Enter Job Description..." className="w-full h-32 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm resize-none placeholder:text-gray-400" />
                                                                </div>
                                                                <div className="mt-4">
                                                                    <label className="block text-[14px] font-bold text-blue-600 dark:text-blue-400 mb-2">Feedback Text</label>
                                                                    <textarea value={editInterviewForm.feedback_text ?? ''} onChange={e => setEditInterviewForm((p: any) => ({ ...p, feedback_text: e.target.value }))} placeholder="Enter interview feedback..." className="w-full h-32 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-blue-300 shadow-sm resize-none placeholder:text-gray-400" />
                                                                </div>
                                                                <div className="mt-10 pt-4 border-t border-blue-50 dark:border-blue-900 flex justify-end gap-3">
                                                                    <button onClick={() => setEditData(null)} className="px-6 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
                                                                    <button onClick={handleEditInterview} disabled={editInterviewLoading} className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#4facfe] to-[#00f2fe] hover:shadow-lg hover:scale-[1.02] text-white text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50">
                                                                        {editInterviewLoading ? "Saving..." : "Save Changes"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                                document.body
                                            )}

                                            <div className="space-y-4">
                                                {data.interviews.filter(i => i.interview_date && new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0))).length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Upcoming Rounds</h3>
                                                        </div>
                                                        <div className="h-[300px]">
                                                            <CandidateGrid
                                                                rowData={data.interviews.filter(i => i.interview_date && new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0))).sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())}
                                                                columnDefs={interviewColumnDefs.filter(col => col.field !== 'feedback_text')}
                                                                height="300px"
                                                                rowHeight={60}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Interview History</h3>
                                                        <div className="hidden sm:flex items-center gap-5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upcoming</span>
                                                                <span className={`text-sm font-bold ${data.interviews.filter((i: any) => i.interview_date && new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0))).length > 0 ? "text-green-600" : "text-gray-300"}`}>
                                                                    {data.interviews.filter((i: any) => i.interview_date && new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0))).length}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="h-[400px]">
                                                        <CandidateGrid
                                                            rowData={data.interviews.filter((i: any) => !i.interview_date || (new Date(i.interview_date).getTime() < new Date(new Date().setHours(0, 0, 0, 0)).getTime())).sort((a: any, b: any) => new Date(b.interview_date).getTime() - new Date(a.interview_date).getTime())}
                                                            columnDefs={interviewColumnDefs}
                                                            height="400px"
                                                            rowHeight={60}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'jobs' && (
                                    <div className="flex-1 flex flex-col px-4 lg:px-6 mt-4 sm:mt-8 pb-8 w-full min-h-0">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-6 pt-4 w-full">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                                                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    Jobs <span className="text-gray-400 font-medium">({positions.length})</span>
                                                </h2>
                                            </div>
                                            <div className="w-full sm:w-[400px]">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                    <Input
                                                        id="job-search"
                                                        type="text"
                                                        value={jobSearchTerm}
                                                        placeholder="Search by title, company, location..."
                                                        onChange={(e) => setJobSearchTerm(e.target.value)}
                                                        className="pl-10 h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl"
                                                    />
                                                </div>
                                            </div>

                                        </div>
                                        <div className="flex-1 w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 min-h-0 flex flex-col">
                                            <CandidateGrid
                                                rowData={filteredPositions}
                                                columnDefs={jobColumnDefs}
                                                loading={positionsLoading}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'smartprep' && (
                                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">

                                        {/* AI Profile Setup Card */}
                                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                                                        <Settings className="w-4 h-4 text-violet-500" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-gray-800 dark:text-white">Manage AI Profile</span>
                                                        <p className="text-[11px] text-gray-400 mt-0.5">Configure your resume and API keys for AI interviews</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSetupWizardManageMode(Boolean(setupStatus?.setup_complete));
                                                        setSetupWizardOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg"
                                                >
                                                    {setupStatus?.setup_complete ? "Manage" : "Complete Setup"}
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Resume Status */}
                                                <div className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl border transition-all ${setupStatus === null
                                                    ? "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                                                    : setupStatus.resume_uploaded
                                                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50"
                                                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50"
                                                    }`}>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${setupStatus === null ? "bg-gray-100 dark:bg-gray-700" : setupStatus.resume_uploaded ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
                                                        {setupStatus === null ? <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" /> : setupStatus.resume_uploaded ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resume</p>
                                                        <p className={`text-xs font-bold mt-0.5 ${setupStatus === null ? "text-gray-400" : setupStatus.resume_uploaded ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                                            {setupStatus === null ? "Loading..." : setupStatus.resume_uploaded ? "Uploaded ✓" : "Not added"}
                                                        </p>
                                                    </div>
                                                    {setupStatus?.resume_uploaded && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewResumeOpen(true)}
                                                            className="ml-auto flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors px-2.5 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            View Resume
                                                        </button>
                                                    )}
                                                </div>
                                                {/* API Keys Status */}
                                                <div className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl border transition-all ${setupStatus === null
                                                    ? "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                                                    : setupStatus.api_keys_configured
                                                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50"
                                                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50"
                                                    }`}>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${setupStatus === null ? "bg-gray-100 dark:bg-gray-700" : setupStatus.api_keys_configured ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
                                                        {setupStatus === null ? <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" /> : setupStatus.api_keys_configured ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">API Keys</p>
                                                        <p className={`text-xs font-bold mt-0.5 ${setupStatus === null ? "text-gray-400" : setupStatus.api_keys_configured ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                                            {setupStatus === null ? "Loading..." : setupStatus.api_keys_configured ? "Configured ✓" : "Not added"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Start Preparation / Complete Setup Button */}
                                            {setupStatus && !setupWizardOpen && (
                                                <div className="flex-1 flex items-center justify-center mt-8">
                                                    {setupStatus.setup_complete ? (
                                                        <button
                                                            onClick={async () => {
                                                                const getAiPrepUrl = () => {
                                                                    const url = process.env.NEXT_PUBLIC_AIPREP_FRONTEND_URL;

                                                                    if (url) {
                                                                        return url;
                                                                    }
                                                                    
                                                                    return "https://ai-prep.whitebox-learning.com";
                                                                };
                                                                const baseUrl = getAiPrepUrl();
                                                                const token = localStorage.getItem("prep_token");

                                                                if (token) {
                                                                    window.open(`${baseUrl}/auth?token=${token}`, '_blank');
                                                                } else {
                                                                    window.open(baseUrl, '_blank');
                                                                }
                                                            }}
                                                            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-full text-sm transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                                                        >
                                                            <PlayCircle className="w-4 h-4" />
                                                            Start Preparation
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSetupWizardManageMode(false);
                                                                setSetupWizardOpen(true);
                                                            }}
                                                            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-full text-sm transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                                                        >
                                                            <Sparkles className="w-4 h-4" />
                                                            Complete Setup
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                )}

                                {activeTab === 'my_llm_key' && <CandidateLlmKeysPanel />}

                                {activeTab === 'my_applications' && (
                                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 lg:p-8">
                                            {/* Header */}
                                            <div className="mb-8">
                                                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <BarChart3 className="w-5 h-5 text-blue-500" />
                                                    Application Analytics
                                                </h2>
                                                <p className="text-xs text-gray-400 mt-1">Real-time statistics for your job search, outreaches, and applications.</p>
                                            </div>

                                            {/* Cards Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {/* Card 1: Job Listing Clicked */}
                                                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-gray-800/40 dark:to-gray-900/40 border border-blue-100/50 dark:border-gray-700/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.02] group">
                                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
                                                        <MousePointerClick className="w-24 h-24 text-blue-500" />
                                                    </div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                                                            <MousePointerClick className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full">Clicks</span>
                                                    </div>
                                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Job Board Clicks</h3>
                                                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                                        {data.candidate_stats?.job_listings_clicked ?? 0}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-2">Total clicks on job listings from the Job Board</p>
                                                </div>

                                                {/* Card 2: Outreach Counter */}
                                                <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-gray-800/40 dark:to-gray-900/40 border border-purple-100/50 dark:border-gray-700/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.02] group">
                                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
                                                        <Send className="w-24 h-24 text-purple-500" />
                                                    </div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="w-10 h-10 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                                                            <Send className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded-full">Outreach</span>
                                                    </div>
                                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Campaign Outreaches</h3>
                                                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                                        {data.candidate_stats?.outreach_counter ?? 0}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-2">Emails sent to vendors and hiring managers</p>
                                                </div>

                                                {/* Card 3: Easy Apply Counter */}
                                                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-gray-800/40 dark:to-gray-900/40 border border-emerald-100/50 dark:border-gray-700/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.02] group">
                                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
                                                        <Zap className="w-24 h-24 text-emerald-500" />
                                                    </div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                                                            <Zap className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">Easy Apply</span>
                                                    </div>
                                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Easy Applies</h3>
                                                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                                        {data.candidate_stats?.easy_apply_counter ?? 0}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-2">Auto-filled forms and quick-applied positions</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'my_resume' && (
                                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 lg:p-8 animate-in fade-in duration-200">
                                            {!showTemplates ? (
                                                <div className="space-y-6 animate-in fade-in duration-200">
                                                    {/* Header */}
                                                    <div className="mb-6">
                                                        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
                                                            Upload Resume
                                                        </h2>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Provide your resume in pdf, doc, docx format.
                                                        </p>
                                                    </div>

                                                    {/* Conditional display based on LLM setup status */}
                                                    {!(userRole === 'employee' || setupStatus?.api_keys_configured || prefetchedSession?.summaryData?.has_api_key || (prefetchedSession?.summaryData?.llm_keys && prefetchedSession.summaryData.llm_keys.length > 0)) ? (
                                                        <div className="flex flex-col items-center justify-center border border-dashed border-red-200 dark:border-red-900/50 rounded-2xl p-10 min-h-[300px] bg-red-50/5 dark:bg-red-950/5 text-center">
                                                            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mb-4">
                                                                <KeyRound size={22} className="text-red-600 dark:text-red-400" />
                                                            </div>
                                                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                                                                LLM API Key Required
                                                            </h3>
                                                            <p className="text-xs text-gray-400 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
                                                                To upload and parse your resume using AI, you must configure at least one active API key in the LLM setup tab first.
                                                            </p>
                                                            <button
                                                                onClick={() => setActiveTab('ai_setup')}
                                                                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors rounded-xl shadow-md cursor-pointer"
                                                            >
                                                                <Settings size={14} />
                                                                <span>Configure LLM Key</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        /* Full-width dashed uploader zone */
                                                        <div className="w-full">
                                                            <div
                                                                onDragOver={(e) => { e.preventDefault(); setResumeDragOver(true); }}
                                                                onDragLeave={() => setResumeDragOver(false)}
                                                                onDrop={(e) => {
                                                                    e.preventDefault();
                                                                    setResumeDragOver(false);
                                                                    if (resumeUploadLoading || setupStatus?.has_binary_resume) return;
                                                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                                                        const droppedFile = e.dataTransfer.files[0];
                                                                        if (handleInlineFileValidate(droppedFile)) {
                                                                            void handleInlineUpload(droppedFile);
                                                                        }
                                                                    }
                                                                }}
                                                                onClick={() => {
                                                                    if (resumeUploadLoading || setupStatus?.has_binary_resume) return;
                                                                    inlineFileInputRef.current?.click();
                                                                }}
                                                                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-20 min-h-[350px] transition-all duration-200 group ${
                                                                    setupStatus?.has_binary_resume
                                                                        ? "border-emerald-500/80 bg-emerald-50/10 dark:bg-emerald-900/5 cursor-default"
                                                                        : resumeDragOver
                                                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 cursor-pointer"
                                                                        : "border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 cursor-pointer"
                                                                }`}
                                                            >
                                                                <input
                                                                    type="file"
                                                                    ref={inlineFileInputRef}
                                                                    onChange={handleInlineFileChange}
                                                                    accept=".pdf,.doc,.docx"
                                                                    className="hidden"
                                                                />

                                                                {resumeUploadLoading ? (
                                                                    <div className="flex flex-col items-center text-center animate-in fade-in duration-150">
                                                                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                                                                        <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                                                            Uploading resume...
                                                                        </p>
                                                                        <p className="text-xs text-gray-400 mt-1">
                                                                            Please wait while we store your resume.
                                                                        </p>
                                                                    </div>
                                                                ) : setupStatus?.has_binary_resume ? (
                                                                    <div className="flex flex-col items-center text-center animate-in fade-in duration-200">
                                                                        <div className="relative mb-4">
                                                                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-2xl flex items-center justify-center">
                                                                                <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                                                                            </div>
                                                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                                                                ✓
                                                                            </div>
                                                                        </div>

                                                                        <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100 mb-3">
                                                                            Selected file uploaded
                                                                        </p>

                                                                        <div className="inline-flex items-center bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-450 font-semibold px-4 py-1.5 rounded-full text-xs border border-blue-100 dark:border-blue-800/60 mb-6 max-w-xs truncate">
                                                                            {setupStatus.binary_resume_filename || "Uploaded Resume"}
                                                                        </div>

                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSetupStatus(prev => prev ? { ...prev, has_binary_resume: false } : null);
                                                                                setShowTemplates(false);
                                                                                setResumeFile(null);
                                                                                setTimeout(() => inlineFileInputRef.current?.click(), 50);
                                                                            }}
                                                                            className="flex items-center gap-1.5 px-6 py-2.5 border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-50/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm cursor-pointer"
                                                                        >
                                                                            <Upload size={14} className="text-gray-405" />
                                                                            Upload another file
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSetupStatus(prev => prev ? { ...prev, has_binary_resume: false } : null);
                                                                                setShowTemplates(false);
                                                                                setResumeFile(null);
                                                                            }}
                                                                            className="text-xs font-semibold text-gray-400 hover:text-gray-500 dark:text-gray-500 hover:dark:text-gray-455 underline cursor-pointer mt-4"
                                                                        >
                                                                            Start over or upload a different file
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center text-center">
                                                                        <div className="p-4 bg-blue-50/40 dark:bg-blue-950/20 text-blue-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                                                            <Upload className="w-8 h-8" />
                                                                        </div>
                                                                        <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                                                            Upload pdf, doc, docx
                                                                        </p>
                                                                        <p className="text-xs text-gray-400 mt-1">
                                                                            Click to browse your computer
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Bottom Navigation Buttons */}
                                                    <div className="flex justify-end items-center pt-4 border-t border-gray-150 dark:border-gray-800/80 mt-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowTemplates(true)}
                                                            disabled={!setupStatus?.has_binary_resume || resumeUploadLoading}
                                                            className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all"
                                                        >
                                                            <span>Next</span>
                                                            <span>&gt;</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : isEditingJson ? (
                                                <div className="space-y-6 animate-in fade-in duration-200">
                                                    {/* Editor Header */}
                                                    <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-4">
                                                        <div>
                                                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
                                                                Edit Resume JSON
                                                            </h2>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Edit your structured resume fields directly. Changes will update the template rendering in real-time.
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsEditingJson(false)}
                                                                disabled={editJsonSaving}
                                                                className="px-4 py-2 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 disabled:opacity-50 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-800 transition-all shadow-sm cursor-pointer"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleSaveEditedJson}
                                                                disabled={editJsonSaving}
                                                                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors rounded-xl shadow-md cursor-pointer"
                                                            >
                                                                {editJsonSaving ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        <span>Saving...</span>
                                                                    </>
                                                                ) : (
                                                                    <span>Save Changes</span>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {editJsonError && (
                                                        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs font-bold text-red-650 dark:text-red-400 flex items-center gap-2">
                                                            <span>⚠️</span>
                                                            <span>{editJsonError}</span>
                                                        </div>
                                                    )}

                                                    <div className="border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-inner">
                                                        <textarea
                                                            value={editJsonText}
                                                            onChange={(e) => {
                                                                setEditJsonText(e.target.value);
                                                                setEditJsonError(null);
                                                            }}
                                                            disabled={editJsonSaving}
                                                            className="w-full min-h-[500px] text-xs font-mono p-6 bg-white text-sky-600 dark:bg-white dark:text-sky-600 focus:outline-none resize-y leading-relaxed"
                                                            placeholder="{}"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Header */}
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <div>
                                                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
                                                                My Resume
                                                            </h2>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Choose your template and Download the resume
                                                            </p>
                                                        </div>
                                                        {prefetchedSession?.summaryData?.resume_json && (
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleValidateJson}
                                                                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-br from-indigo-900 to-purple-400 hover:opacity-90 active:opacity-85 transition-all rounded-xl shadow-md cursor-pointer"
                                                                >
                                                                    <ClipboardCheck size={14} />
                                                                    <span>Validate JSON</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Control bar */}
                                                    <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                Template Layout:
                                                            </span>
                                                            <select
                                                                value={selectedTemplate}
                                                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                                                className="text-sm font-semibold bg-white dark:bg-gray-900 text-gray-850 dark:text-gray-250 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                                                            >
                                                                {[
                                                                    { id: "academic", name: "Academic" },
                                                                    { id: "classy", name: "Classy" },
                                                                    { id: "elegant", name: "Elegant" },
                                                                    { id: "even", name: "Even" },
                                                                    { id: "flat", name: "Flat" },
                                                                    { id: "lowmess", name: "Lowmess" },
                                                                    { id: "macchiato", name: "Macchiato" },
                                                                    { id: "onepage-plus", name: "Onepage Plus" },
                                                                    { id: "professional", name: "Professional" },
                                                                    { id: "ats-friendly", name: "ATS Friendly" },
                                                                    { id: "stackoverflow", name: "Stackoverflow" },
                                                                    { id: "stackoverflowed", name: "Stackoverflowed" },
                                                                    { id: "straightforward", name: "Straightforward" },
                                                                    { id: "waterfall", name: "Waterfall" },
                                                                    { id: "raw", name: "Raw JSON" }
                                                                ].map((t) => (
                                                                    <option key={t.id} value={t.id}>
                                                                        {t.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="flex items-center gap-2.5">
                                                            {prefetchedSession?.summaryData?.resume_json && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditJsonText(JSON.stringify(prefetchedSession?.summaryData?.resume_json || {}, null, 2));
                                                                            setEditJsonError(null);
                                                                            setIsEditingJson(true);
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-755 dark:text-gray-305 hover:bg-gray-105 dark:hover:bg-gray-805 border border-gray-200 dark:border-gray-700 transition-colors rounded-xl shadow-sm"
                                                                    >
                                                                        <Edit3 size={15} className="text-blue-500" />
                                                                        <span>Edit JSON</span>
                                                                    </button>

                                                                    {selectedTemplate === "raw" ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={handleDownloadJson}
                                                                            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
                                                                        >
                                                                            <Download size={15} />
                                                                            <span>Download JSON</span>
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={handleInlineDownload}
                                                                            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
                                                                        >
                                                                            <Download size={15} />
                                                                            <span>Download PDF</span>
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Main viewer block */}
                                                    {!prefetchedSession?.summaryData?.resume_json ? (
                                                        <div className="text-center py-16 bg-gray-50/50 dark:bg-gray-900/10 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl text-gray-400 dark:text-gray-500 text-sm">
                                                            No structured resume data found.
                                                        </div>
                                                    ) : selectedTemplate === "raw" ? (
                                                        <div className="space-y-4">
                                                            <pre className="w-full text-xs font-mono bg-gray-50/80 dark:bg-darklight p-5 rounded-2xl border border-gray-100 dark:border-gray-850 overflow-auto max-h-[70vh] text-gray-700 dark:text-gray-250 whitespace-pre-wrap">
                                                                {JSON.stringify(prefetchedSession.summaryData.resume_json, null, 2)}
                                                            </pre>
                                                        </div>
                                                    ) : (
                                                        <div className="border border-gray-200 dark:border-gray-800/80 rounded-3xl overflow-hidden bg-white max-h-[80vh] overflow-y-auto p-4 md:p-6 shadow-inner">
                                                            <div ref={inlineResumeRef} className="origin-top transform scale-[0.95] w-full">
                                                                <ResumeRenderer 
                                                                    data={(() => {
                                                                        try {
                                                                            return normalizeResume(prefetchedSession.summaryData.resume_json);
                                                                        } catch (e) {
                                                                            return null;
                                                                        }
                                                                    })()} 
                                                                    templateId={selectedTemplate} 
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
            {viewResumeOpen && (
                <ViewModal
                    isOpen={true}
                    onClose={() => setViewResumeOpen(false)}
                    data={{
                        resume_json: prefetchedSession?.summaryData?.resume_json || {}
                    }}
                    title="View Resume"
                    onReupload={() => {
                        setViewResumeOpen(false);
                        setUploadResumeOpen(true);
                    }}
                />
            )}
            {uploadResumeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload Resume</h3>
                            <button onClick={() => setUploadResumeOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
                        </div>
                        <div className="w-full space-y-5">
                            <div
                                onDragOver={(e) => { e.preventDefault(); setResumeDragOver(true); }}
                                onDragLeave={() => setResumeDragOver(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setResumeDragOver(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                        const droppedFile = e.dataTransfer.files[0];
                                        if (handleInlineFileValidate(droppedFile)) {
                                            setResumeFile(droppedFile);
                                        }
                                    }
                                }}
                                onClick={() => inlineFileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-200 group ${
                                    resumeDragOver
                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                                        : resumeFile
                                        ? "border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-900/5"
                                        : "border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
                                }`}
                            >
                                <input
                                    type="file"
                                    ref={inlineFileInputRef}
                                    onChange={handleInlineFileChange}
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                />

                                {resumeFile ? (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="p-4 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-3">
                                            <FileText className="w-8 h-8 animate-pulse" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-250 max-w-[240px] truncate">
                                            {resumeFile.name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center">
                                        <Upload className="w-8 h-8 text-blue-500 mb-2" />
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                            Drag and drop your resume here
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            or <span className="text-blue-500 font-semibold">browse files</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={async () => {
                                        if (!resumeFile) return;
                                        setResumeUploadLoading(true);
                                        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : "";
                                        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
                                        const uploadUrl = backendUrl.endsWith("/api")
                                            ? `${backendUrl}/candidates/${candidateId}/marketing/upload-resume`
                                            : `${backendUrl}/api/candidates/${candidateId}/marketing/upload-resume`;
                                        const formData = new FormData();
                                        formData.append("file", resumeFile);
                                        try {
                                            const response = await fetch(uploadUrl, {
                                                method: "POST",
                                                headers: { Authorization: `Bearer ${token}` },
                                                body: formData,
                                            });
                                            if (!response.ok) throw new Error("Failed to upload");
                                            toast.success("Resume uploaded successfully!");
                                            setResumeFile(null);
                                            setUploadResumeOpen(false);
                                            setupApi.getStatus()
                                                .then((d: any) => {
                                                    setSetupStatus(d);
                                                    setViewResumeOpen(true);
                                                });
                                        } catch (err: any) {
                                            toast.error(err.message || "Upload failed");
                                        } finally {
                                            setResumeUploadLoading(false);
                                        }
                                    }}
                                    disabled={!resumeFile || resumeUploadLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold shadow-md"
                                >
                                    {resumeUploadLoading ? "Uploading..." : "Upload Resume"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
const PhaseCard = ({
    title, icon, color, completed, active, daysSince, durationDays, batchName, rating, company, date,
}: {
    title: string; icon: React.ReactNode; color: string; completed?: boolean; active?: boolean; daysSince?: number;
    durationDays?: number; batchName?: string; rating?: string; company?: string; date?: string;
}) => {
    // Highly simplified color mapping - just for the icon/line color
    const accentColor = active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500";
    const borderColor = active ? "border-blue-200 dark:border-blue-800" : "border-gray-100 dark:border-gray-800";

    return (
        <div className={`bg-white dark:bg-gray-800 border ${borderColor} rounded-xl p-3 shadow-sm transition-all duration-200`}>
            <div className="flex items-center gap-2.5 mb-3">
                <div className={`${accentColor}`}>{icon}</div>
                <h3 className="text-xs font-extrabold text-gray-900 dark:text-gray-100 tracking-tight uppercase leading-tight">{title}</h3>
            </div>

            <div className="space-y-3">
                <div className="flex items-center h-5">
                    {active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-blue-500 text-white shadow-sm shadow-blue-500/20 animate-pulse">
                            Active Now
                        </span>
                    ) : completed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                            Completed
                        </span>
                    ) : (
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300 dark:text-gray-600">
                            Upcoming Step
                        </span>
                    )}
                </div>

                <div className="pt-2 border-t border-gray-50 dark:border-gray-700 space-y-1.5">
                    {daysSince !== undefined && daysSince !== null && (
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{daysSince} days total</p>
                    )}
                    {durationDays !== undefined && durationDays !== null && (
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{durationDays} days duration</p>
                    )}
                    {date && (
                        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {date}
                        </p>
                    )}
                    {batchName && <p className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate flex items-center gap-1.5">
                        <span className="text-blue-500"></span> {batchName}
                    </p>}
                    {company && (
                        <p className="text-xs font-extrabold text-blue-700 dark:text-blue-300 mt-2 p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl truncate flex items-center gap-1.5">
                            <span></span> {company}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
