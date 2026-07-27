"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
  Copy,
  FileJson,
  Loader2,
  Edit3,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/admin_ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
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
    preparation: {
      completed: boolean;
      active: boolean;
      start_date: string;
      duration_days: number;
    };
    marketing: {
      completed: boolean;
      active: boolean;
      start_date: string;
      duration_days: number;
    };
    placement: {
      completed: boolean;
      active: boolean;
      company: string;
      position: string;
      date?: string;
    };
  };
  phase_metrics: {
    enrolled: { date: string; batch_name: string; status: string };
    preparation?: {
      status: string;
      rating: string;
      communication: string;
      duration_days: number;
    };
    marketing?: {
      total_interviews: number;
      positive_interviews: number;
      success_rate: number;
      duration_days: number;
    };
    placement?: {
      company: string;
      position: string;
      base_salary: number;
      placement_date?: string;
    };
  };
  team_info: {
    preparation: {
      instructors: Array<{ name: string; email: string; role: string }>;
    };
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
    daily_outreach: number;
    weekly_outreach: number;
    easy_apply_counter: number;
    classes_joined?: number;
    sessions_joined?: number;
    mocks_joined?: number;
  };
  easy_apply_logs?: Array<{
    id: number;
    company: string;
    role: string;
    date: string | null;
    status: string;
  }>;
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
  joined_candidate_ids?: number[];
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

type TabType =
  | "overview"
  | "my-sessions"
  | "my-interviews"
  | "job-board"
  | "wbl-smartprep"
  | "my-llm-key"
  | "my-applications"
  | "my-llm-setup"
  | "my-resume";

const extractErrorMessage = (err: ApiError, defaultMessage: string): string => {
  return (
    err.body?.detail ||
    err.body?.message ||
    err.detail ||
    err.message ||
    defaultMessage
  );
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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>(
    { top: 0, left: 0 },
  );
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
      window.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true,
      });
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
          <Filter
            className="h-3.5 w-3.5"
            style={{ color: selectedItems.length > 0 ? "#3b82f6" : "#9ca3af" }}
          />
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
                const isSelected = selectedItems.some(
                  (i) => getOptionValue(i) === value,
                );
                return (
                  <div
                    key={value}
                    onClick={() => handleItemChange(option)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                      isSelected
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
          document.body,
        )}
    </div>
  );
};

const StatusRenderer = ({ value }: { value?: string }) => {
  const status = value?.toLowerCase() || "";
  const variantMap: Record<string, string> = {
    open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
    closed:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
    on_hold:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    duplicate:
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    invalid:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    default:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  };
  const formatted = (value || "")
    .toString()
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return (
    <div className="flex h-full items-center">
      <span
        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize ${
          variantMap[status] || variantMap.default
        }`}
      >
        {formatted || "N/A"}
      </span>
    </div>
  );
};

interface CandidateDashboardProps {
  defaultTab?: string;
}

export default function CandidateDashboard({
  defaultTab = "overview",
}: CandidateDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole } = useAuth() as { userRole: string };

  const getAiPrepApiUrl = () => {
    return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  };
  const AIPREP_API = getAiPrepApiUrl();

  // --- CLICK TRACKING LOGIC (SW EDITION) ---
  const handleJobClick = useCallback(
    async (jobListingId: number, url: string) => {
      // 1. Save to local IndexedDB instantly (main thread)
      const { trackLocalClick } = await import("@/utils/clickTracker");
      await trackLocalClick(jobListingId);

      // 2. Notify Service Worker (runs in background)
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "TRACK_CLICK",
          id: jobListingId,
        });
      }

      // 3. Open link
      window.open(url, "_blank");
    },
    [],
  );

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
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab as TabType);
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab as TabType);
  }, [defaultTab]);

  const goToTab = (tab: TabType) => {
    setSetupWizardOpen(false);
    setForceShowUploader(false);
    setActiveTab(tab);
    if (tab === "overview") {
      setViewApplicationsOpen(true);
    }
    router.push(`/user_dashboard/${tab}`);
  };
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEasyApplyHover, setIsEasyApplyHover] = useState(false);
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
  const [setupStatus, setSetupStatus] = useState<{
    resume_uploaded: boolean;
    api_keys_configured: boolean;
    setup_complete: boolean;
    has_binary_resume?: boolean;
    binary_resume_filename?: string | null;
  } | null>(null);
  const [setupWizardManageMode, setSetupWizardManageMode] = useState(false);
  const [prefetchedSession, setPrefetchedSession] = useState<{
    sessionId: string;
    summaryData: any;
  } | null>(null);
  const [prefetchDone, setPrefetchDone] = useState(false);

  // Resume JSON Viewer/Editor States
  const [isResumeJsonModalOpen, setIsResumeJsonModalOpen] = useState(false);
  const [resumeJsonText, setResumeJsonText] = useState("");
  const [resumeJsonError, setResumeJsonError] = useState<string | null>(null);
  const [isSavingResumeJson, setIsSavingResumeJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openResumeJsonModal = async () => {
    setIsResumeJsonModalOpen(true);
    setResumeJsonError(null);

    let resumeObj = prefetchedSession?.summaryData?.resume_json;
    let sid = prefetchedSession?.sessionId;

    if (!resumeObj || !sid) {
      try {
        const token = localStorage.getItem("access_token") || "";
        const payload = JSON.parse(atob(token.split(".")[1]));
        const email =
          payload.sub || payload.email || payload.uname || "candidate";

        const data = await apiFetch("/api/setup/init-and-summary", {
          method: "POST",
          body: { candidate_id: candidateId, wbl_email: email, name: email },
        });

        sid = data.session_id;
        resumeObj = data.summary?.resume_json;
        if (sid) {
          setPrefetchedSession({ sessionId: sid, summaryData: data.summary });
        }
      } catch (e) {
        console.error("Error loading resume JSON", e);
      }
    }

    if (resumeObj && typeof resumeObj === "object") {
      setResumeJsonText(JSON.stringify(resumeObj, null, 2));
    } else {
      setResumeJsonText("");
    }
  };

  const handleSaveResumeJson = async () => {
    setResumeJsonError(null);
    let parsed = null;
    try {
      parsed = JSON.parse(resumeJsonText);
    } catch (err: any) {
      setResumeJsonError("Invalid JSON format: " + err.message);
      toast.error("Please provide a valid JSON object.");
      return;
    }

    const sid = prefetchedSession?.sessionId;
    if (!sid) {
      toast.error("No active session found. Please try again.");
      return;
    }

    setIsSavingResumeJson(true);
    try {
      const AIPREP_API = process.env.NEXT_PUBLIC_API_URL || "";
      const formData = new FormData();
      const blob = new Blob([resumeJsonText], { type: "application/json" });
      formData.append("file", blob, "resume.json");
      formData.append("session_id", sid);

      const response = await fetch(`${AIPREP_API}/setup/resume`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.detail || "Resume upload failed");
      }

      toast.success("Resume JSON saved successfully!");

      // Update local prefetch state
      if (prefetchedSession) {
        setPrefetchedSession({
          ...prefetchedSession,
          summaryData: {
            ...prefetchedSession.summaryData,
            resume_json: parsed,
            resume_text: "Exists",
          },
        });
      }

      // Update status badge
      setSetupStatus((prev) =>
        prev
          ? { ...prev, resume_uploaded: true }
          : {
              resume_uploaded: true,
              api_keys_configured: false,
              setup_complete: false,
            },
      );

      setIsResumeJsonModalOpen(false);
    } catch (err: any) {
      const detail = err.message || "Failed to save resume";
      setResumeJsonError(detail);
      toast.error(detail);
    } finally {
      setIsSavingResumeJson(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        // Validate if it is valid JSON
        const parsed = JSON.parse(text);
        setResumeJsonText(JSON.stringify(parsed, null, 2));
        setResumeJsonError(null);
        toast.success("JSON file loaded successfully!");
      } catch (err: any) {
        setResumeJsonError("Uploaded file is not a valid JSON: " + err.message);
        toast.error("Invalid JSON file uploaded.");
      }
    };
    reader.readAsText(file);
  };

  const [viewResumeOpen, setViewResumeOpen] = useState(false);
  const [easyApplyPopupOpen, setEasyApplyPopupOpen] = useState(true);
  const [viewApplicationsOpen, setViewApplicationsOpen] = useState(false);
  const [uploadResumeOpen, setUploadResumeOpen] = useState(false);

  // Inline Resume states & refs
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploadLoading, setResumeUploadLoading] = useState(false);
  const [resumeDragOver, setResumeDragOver] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("elegant");
  const [showTemplates, setShowTemplates] = useState(false);
  const [forceShowUploader, setForceShowUploader] = useState(false);
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
      toast.error(
        "Invalid file format. Please upload a PDF, DOC, or DOCX file.",
      );
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
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token") || ""
        : "";
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(
      /\/$/,
      "",
    );
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
      setShowTemplates(true);
      setForceShowUploader(false);
      setSetupStatus((prev) => {
        const base = prev || {
          resume_uploaded: false,
          api_keys_configured: false,
          setup_complete: false,
        };
        return {
          ...base,
          has_binary_resume: true,
          binary_resume_filename: fileToUpload.name,
          resume_uploaded: true,
        };
      });

      // Reload setup summary to fetch parsed JSON immediately
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const email =
          payload.sub || payload.email || payload.uname || "candidate";
        const dataSummary = await apiFetch("/api/setup/init-and-summary", {
          method: "POST",
          body: { candidate_id: candidateId, wbl_email: email, name: email },
        });
        if (dataSummary && dataSummary.summary) {
          setPrefetchedSession({
            sessionId: dataSummary.session_id,
            summaryData: dataSummary.summary,
          });
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
      const candidateId = await getCandidateId();
      if (!candidateId) {
        throw new Error("Candidate ID not found.");
      }

      await apiFetch(`/api/candidates/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: { candidate_json: parsed },
      });

      const prepToken =
        typeof window !== "undefined"
          ? localStorage.getItem("prep_token")
          : null;
      if (prepToken) {
        await apiFetch("/api/setup/resume", {
          method: "PUT",
          body: { resume_json: parsed, session_id: prepToken },
        });
      }

      toast.success("Resume JSON updated successfully!");

      if (prefetchedSession) {
        setPrefetchedSession({
          ...prefetchedSession,
          summaryData: {
            ...prefetchedSession.summaryData,
            resume_json: parsed,
          },
        });
      }
      setSetupStatus((prev) =>
        prev
          ? { ...prev, resume_uploaded: true }
          : {
              resume_uploaded: true,
              api_keys_configured: false,
              setup_complete: false,
            },
      );
      setIsEditingJson(false);
    } catch (err: any) {
      setEditJsonError(
        err.message || "An unexpected error occurred while saving.",
      );
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
      toast.error(
        `Validation Failed. Missing mandatory fields: ${errors.join(", ")}`,
      );
    } else {
      if (warnings.length > 0) {
        toast.warning(
          `Validation Passed with Warnings. Recommended fields missing: ${warnings.join(
            ", ",
          )}`,
        );
      } else {
        toast.success(
          "Validation Passed! JSON resume structure is perfectly valid.",
        );
      }
      setSetupStatus((prev) =>
        prev
          ? { ...prev, resume_uploaded: true }
          : {
              resume_uploaded: true,
              api_keys_configured: false,
              setup_complete: false,
            },
      );
    }
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(
      prefetchedSession?.summaryData?.resume_json || {},
      null,
      2,
    );
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      (prefetchedSession?.summaryData?.binary_resume_filename?.replace(
        /\.[^/.]+$/,
        "",
      ) || "resume") + ".json";
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
      margin: 0,
      filename: `${candidateName.replace(/\s+/g, "_")}_Resume.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    const runHtml2Pdf = () => {
      const element = inlineResumeRef.current;
      (window as any).html2pdf().set(opt).from(element).save();
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = runHtml2Pdf;
      document.head.appendChild(script);
    } else {
      runHtml2Pdf();
    }
  };

  useEffect(() => {
    setMounted(true);
    const handleNavEvent = () => {
      goToTab("overview");
    };
    window.addEventListener("nav-to-overview", handleNavEvent);
    return () => {
      window.removeEventListener("nav-to-overview", handleNavEvent);
    };
  }, []);

  const loadSetupStatus = async () => {
    let hasValidDefaultKey = false;
    let hasAnyKeyInBackend = false;
    try {
      const keys: any = await apiFetch("/api/coderpad/me/llm-keys");
      hasAnyKeyInBackend = keys.length > 0;
      const defaultKey =
        (keys as any[]).find((k: any) => k.is_default) ||
        (keys.length === 1 ? keys[0] : null);

      if (defaultKey) {
        // Check validation cache
        try {
          const raw = localStorage.getItem("wbl_llm_key_validation_v1");
          if (raw) {
            const cache = JSON.parse(raw);
            if (cache[String(defaultKey.id)]?.status === "active") {
              hasValidDefaultKey = true;
            }
          }
        } catch {
          // Ignore localStorage errors
        }
      }
    } catch {
      // fallback
    }

    try {
      const d: any = await setupApi.getStatus();
      // Fallback: if cache miss but they have keys in both places, assume AI prep status
      const isConfigured =
        hasValidDefaultKey ||
        (hasAnyKeyInBackend &&
          (d.has_api_key === true ||
            (Array.isArray(d.llm_keys) && d.llm_keys.length > 0)));
      const resolvedStatus = {
        ...d,
        api_keys_configured: isConfigured,
        setup_complete: d.resume_uploaded && isConfigured,
      };
      return resolvedStatus;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    loadSetupStatus().then(setSetupStatus);
  }, []);

  useEffect(() => {
    if (setupStatus?.has_binary_resume && !forceShowUploader) {
      setShowTemplates(true);
    }
  }, [setupStatus, forceShowUploader]);

  // Pre-fetch AI prep session as soon as candidateId is available so the
  // wizard opens instantly when user clicks "Manage" (no 4-5s wait).
  useEffect(() => {
    if (!candidateId || prefetchDone) return;
    const run = async () => {
      try {
        const token = localStorage.getItem("access_token") || "";
        const payload = JSON.parse(atob(token.split(".")[1]));
        const email =
          payload.sub || payload.email || payload.uname || "candidate";

        const data = await apiFetch("/api/setup/init-and-summary", {
          method: "POST",
          body: { candidate_id: candidateId, wbl_email: email, name: email },
        });

        const sid: string = data.session_id;
        const summaryData = data.summary;

        if (!sid) return;
        localStorage.setItem("prep_token", sid);

        setPrefetchedSession({ sessionId: sid, summaryData });
        setPrefetchDone(true);

        // Re-fetch accurate status after AI prep session is initialized
        const status = await loadSetupStatus();
        if (status) setSetupStatus(status);
      } catch {
        // Silently fail — wizard will fall back to its own fetch
      }
    };
    void run();
  }, [
    candidateId,
    prefetchDone,
    setPrefetchedSession,
    setPrefetchDone,
    loadSetupStatus,
    setSetupStatus,
  ]);

  useEffect(() => {
    if (!setupWizardOpen) {
      setSetupWizardManageMode(false);
      // Don't clear prefetchedSession — keep it for next open
    }
  }, [setupWizardOpen]);

  const refreshSetupStatus = async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const status = await loadSetupStatus();
      setSetupStatus(status);
      if (status?.setup_complete) {
        return;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  };

  const statusOptions = ["open", "closed", "on_hold", "duplicate", "invalid"];
  const typeOptions = [
    "full_time",
    "contract",
    "contract_to_hire",
    "internship",
  ];
  const modeOptions = ["All", "Onsite", "Hybrid", "Remote"];
  const interviewColumnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "company",
        headerName: "Company",
        flex: 2,
        minWidth: 200,
        pinned: "left",
        cellRenderer: (params: any) => (
          <div className="flex h-full items-center">
            <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
              {params.value}
            </span>
          </div>
        ),
      },
      {
        field: "type_of_interview",
        headerName: "Interview Round",
        flex: 1.5,
        minWidth: 160,
        cellRenderer: (params: any) => (
          <div className="flex h-full items-center gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <Target className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {params.value || "Technical Round"}
            </span>
          </div>
        ),
      },
      {
        field: "interview_date",
        headerName: "Schedule",
        flex: 1.5,
        minWidth: 160,
        cellRenderer: (params: any) => (
          <div className="flex h-full items-center gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {params.value
                ? format(parseISO(params.value), "MMM dd, yyyy")
                : "TBD"}
            </span>
          </div>
        ),
      },
      {
        field: "mode_of_interview",
        headerName: "Mode",
        flex: 1,
        minWidth: 130,
        cellRenderer: (params: any) => (
          <div className="flex h-full items-center gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <Video className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {params.value || "Virtual"}
            </span>
          </div>
        ),
      },
      {
        field: "feedback",
        headerName: "Result",
        flex: 1,
        minWidth: 130,
        cellRenderer: (params: any) => {
          const handleChange = async (
            e: React.ChangeEvent<HTMLSelectElement>,
          ) => {
            const newVal = e.target.value;
            try {
              await apiFetch(
                `/api/candidates/interviews/${params.data.id}/feedback?feedback=${newVal}`,
                {
                  method: "PATCH",
                },
              );
              params.data.feedback = newVal;
              params.api.refreshCells({ rowNodes: [params.node], force: true });
            } catch (err) {
              console.error("Failed to update feedback", err);
            }
          };

          return (
            <div className="flex h-full items-center gap-2.5">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <select
                defaultValue={params.value || "Pending"}
                onChange={handleChange}
                className="cursor-pointer border-none bg-transparent text-xs font-medium text-gray-600 outline-none focus:ring-0 dark:text-gray-400"
              >
                <option value="Pending">Pending</option>
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
              </select>
            </div>
          );
        },
      },
      {
        field: "feedback_text",
        headerName: "Detailed Feedback",
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
              body: { feedback_text: newVal },
            });
            toast.success("Feedback saved!");
          } catch (err) {
            console.error("Failed to update feedback text", err);
            toast.error("Failed to save feedback.");
          }
        },
        cellRenderer: (params: any) => (
          <div className="flex h-full items-center gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div className="truncate text-[11px] font-medium text-gray-600 dark:text-gray-400">
              {params.value || (
                <span className="italic opacity-50">
                  Click to add feedback...
                </span>
              )}
            </div>
          </div>
        ),
      },
    ],
    [candidateId],
  );

  const jobColumnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        sortable: true,
        filter: "agNumberColumnFilter",
      },
      {
        field: "title",
        headerName: "Title",
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: "agTextColumnFilter",
        cellRenderer: (params: any) => {
          const rawJobId = params.data.source_job_id || params.data.source_uid;
          const jobId =
            rawJobId && rawJobId !== "undefined" && rawJobId !== "null"
              ? rawJobId
              : null;
          const source = params.data.source?.toLowerCase() || "";
          const url =
            params.data.job_url ||
            (jobId
              ? source.includes("trueup")
                ? `https://trueup.io/jobs/${jobId}`
                : source.includes("hiring") || source.includes("cafe")
                ? `https://hiring.cafe/viewjob/${jobId}`
                : source.includes("jobright")
                ? `https://jobright.ai/jobs/info/${jobId}`
                : `https://www.linkedin.com/jobs/view/${jobId}`
              : null);

          if (!url) {
            return (
              <div className="flex h-full items-center">
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {params.value}
                </span>
              </div>
            );
          }

          return (
            <div className="flex h-full items-center">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  handleJobClick(params.data.id, url);
                }}
                className="group flex items-center gap-1.5 font-semibold text-blue-600 decoration-blue-400 hover:text-blue-800 hover:underline"
              >
                <span>{params.value}</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </div>
          );
        },
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
            const arr = typeof val === "function" ? val(selectedModes) : val;
            setSelectedModes(arr.includes("All") ? [] : arr);
          },
          options: modeOptions,
          label: "Mode",
          displayName: "Mode",
          color: "purple",
          renderOption: (opt: string) => opt,
        },
        cellRenderer: (params: any) => {
          if (!params.value) return <span className="text-gray-400">-</span>;
          const mode = params.value.toLowerCase();
          const config: any = {
            remote: {
              bg: "bg-green-50 dark:bg-green-900/20",
              text: "text-green-700 dark:text-green-400",
              border: "border-green-100 dark:border-green-800/50",
              dot: "bg-green-500",
            },
            hybrid: {
              bg: "bg-blue-50 dark:bg-blue-900/20",
              text: "text-blue-700 dark:text-blue-400",
              border: "border-blue-100 dark:border-blue-800/50",
              dot: "bg-blue-500",
            },
            onsite: {
              bg: "bg-orange-50 dark:bg-orange-900/20",
              text: "text-orange-700 dark:text-orange-400",
              border: "border-orange-100 dark:border-orange-800/50",
              dot: "bg-orange-500",
            },
          };
          const style = config[mode] || {
            bg: "bg-gray-50 dark:bg-gray-800",
            text: "text-gray-600 dark:text-gray-400",
            border: "border-gray-100 dark:border-gray-700",
            dot: "bg-gray-400",
          };

          const formattedValue =
            params.value.charAt(0).toUpperCase() +
            params.value.slice(1).toLowerCase();

          return (
            <div className="flex h-full items-center">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium ${style.bg} ${style.text} ${style.border}`}
              >
                {formattedValue}
              </span>
            </div>
          );
        },
      },
      {
        field: "company_name",
        headerName: "Company",
        flex: 1.5,
        minWidth: 150,
        sortable: true,
        filter: "agTextColumnFilter",
      },
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
          renderOption: (opt: string) =>
            opt
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l: string) => l.toUpperCase()),
        },
        valueFormatter: (params) =>
          params.value
            ? params.value
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase())
            : "",
      },
      {
        field: "job_url_type",
        headerName: "Job URL Type",
        width: 130,
        sortable: true,
        filter: "agTextColumnFilter",
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
        },
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
            const datePart =
              typeof cellValue === "string"
                ? cellValue.split("T")[0]
                : new Date(cellValue).toISOString().split("T")[0];
            const [year, month, day] = datePart.split("-");
            const cellDate = new Date(
              Number(year),
              Number(month) - 1,
              Number(day),
            );

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
          const datePart =
            typeof value === "string"
              ? value.split("T")[0]
              : new Date(value).toISOString().split("T")[0];
          const [year, month, day] = datePart.split("-");
          return `${month ?? ""}/${day ?? ""}/${year ?? ""}`;
        },
      },
      {
        headerName: "Apply",
        width: 100,
        cellRenderer: (params: any) => {
          const rawJobId = params.data.source_job_id || params.data.source_uid;
          const jobId =
            rawJobId && rawJobId !== "undefined" && rawJobId !== "null"
              ? rawJobId
              : null;
          if (!jobId && !params.data.job_url)
            return <span className="text-gray-400">-</span>;

          const source = params.data.source?.toLowerCase() || "";
          const url =
            params.data.job_url ||
            (jobId
              ? source.includes("trueup")
                ? `https://trueup.io/jobs/${jobId}`
                : source.includes("hiring") || source.includes("cafe")
                ? `https://hiring.cafe/viewjob/${jobId}`
                : source.includes("jobright")
                ? `https://jobright.ai/jobs/info/${jobId}`
                : `https://www.linkedin.com/jobs/view/${jobId}`
              : null);

          return (
            <div className="flex h-full items-center">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  handleJobClick(params.data.id, url);
                }}
                className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <span>Apply</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          );
        },
      },
    ],
    [selectedModes, selectedStatuses, selectedTypes],
  );

  useEffect(() => {
    let filtered = [...positions];

    // Apply Mode Filter — empty means 'All'
    if (selectedModes.length > 0 && !selectedModes.includes("All")) {
      filtered = filtered.filter(
        (p) =>
          p.employment_mode &&
          selectedModes.some(
            (m) => p.employment_mode.toLowerCase() === m.toLowerCase(),
          ),
      );
    }

    // Apply Status Filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(
        (p) =>
          p.status &&
          selectedStatuses.some(
            (s) => p.status.toLowerCase() === s.toLowerCase(),
          ),
      );
    }

    // Apply Type Filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(
        (p) =>
          p.position_type &&
          selectedTypes.some(
            (t) => p.position_type.toLowerCase() === t.toLowerCase(),
          ),
      );
    }

    // Apply Source Filter

    // Apply Search Term Filter
    if (jobSearchTerm.trim() !== "") {
      const lower = jobSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(lower) ||
          p.company_name?.toLowerCase().includes(lower) ||
          p.location?.toLowerCase().includes(lower),
      );
    }

    setFilteredPositions(filtered);
  }, [
    positions,
    selectedModes,
    selectedStatuses,
    selectedTypes,
    jobSearchTerm,
  ]);

  const handleAddInterview = async () => {
    const {
      company,
      interview_date,
      interviewer_emails,
      mode_of_interview,
      type_of_interview,
      position_title,
      job_description,
    } = addInterviewForm;

    if (
      !company ||
      !interview_date ||
      !position_title ||
      !mode_of_interview ||
      !type_of_interview
    ) {
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
          ...addInterviewForm,
        },
      });

      toast.success("Interview added successfully!");
      setShowAddInterview(false);
      setAddInterviewForm({
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
      type_of_interview: "Type of Interview",
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
        id,
        candidate_full_name,
        instructor1_name,
        instructor2_name,
        instructor3_name,
        position_company,
        gcal_event_id,
        last_mod_datetime,
        candidate,
        ...updatePayload
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
  const loadUserProfile = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
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
  }, [setUserProfile]);

  const getCandidateId = useCallback(async (): Promise<number> => {
    try {
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const queryCid = searchParams.get("candidateId");
        if (queryCid) {
          const num = Number(queryCid);
          if (!isNaN(num) && num > 0) return num;
        }
      }
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
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
          },
        );

        let candidates = [];
        if (Array.isArray(candidateResponse)) {
          candidates = candidateResponse;
        } else if (
          candidateResponse?.data &&
          Array.isArray(candidateResponse.data)
        ) {
          candidates = candidateResponse.data;
        } else if (
          candidateResponse?.candidates &&
          Array.isArray(candidateResponse.candidates)
        ) {
          candidates = candidateResponse.candidates;
        }

        if (candidates.length > 0) {
          const exactMatch = candidates.find(
            (c: any) => c.email?.toLowerCase() === userEmail.toLowerCase(),
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

      throw new Error(
        "Candidate ID not found. Please ensure your account is linked to a candidate profile.",
      );
    } catch (err: any) {
      console.error(" Error getting candidate ID:", err);
      throw new Error(
        extractErrorMessage(
          err,
          "Failed to get candidate ID. Please log in again.",
        ),
      );
    }
  }, []);

  const loadSessions = async () => {
    const fullName = data?.basic_info?.full_name;
    const candidateId = data?.basic_info?.id;
    if (!fullName || !candidateId) return;

    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    const firstName = fullName.split(" ")[0];

    try {
      setSessionsLoading(true);

      const searchQuery = firstName.toLowerCase();
      const params = new URLSearchParams({ search_title: searchQuery });
      const sessionData = await apiFetch(`session?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const sessionsList =
        sessionData?.sessions ||
        sessionData?.data ||
        (Array.isArray(sessionData) ? sessionData : []);

      const candidateSessions = Array.isArray(sessionsList)
        ? sessionsList.filter((session: Session) => {
            if (!session || !session.sessiondate || !session.title)
              return false;

            // 1. Check explicit association mapping
            if (session.joined_candidate_ids?.includes(candidateId)) {
              return true;
            }

            // 2. Fallback to name-matching logic
            const titleLower = session.title.toLowerCase();
            const firstNameLower = firstName.toLowerCase();
            const fullNameLower = fullName.toLowerCase();

            return (
              titleLower.includes(firstNameLower) ||
              titleLower.includes(fullNameLower)
            );
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

  const loadPositions = useCallback(async () => {
    try {
      setPositionsLoading(true);
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      const posData = await apiFetch("positions/?limit=500", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          "🔍 API Response - Total jobs received:",
          posData?.length || 0,
        );
      }
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 API Response - Sample job data:", posData?.[0] || {});
      }

      // Filter to show jobs from LinkedIn, Hiring Cafe, TrueUp, or Jobright
      const filteredData = (posData || []).filter((pos: any) => {
        const src = pos.source?.toLowerCase() || "";
        const shouldInclude =
          src.includes("linkedin") ||
          src.includes("hiring") ||
          src.includes("cafe") ||
          src.includes("trueup") ||
          src.includes("jobright");

        // Add a check to confirm the job actually has an actionable link id or url
        const hasLink = Boolean(
          pos.source_job_id || pos.source_uid || pos.job_url,
        );
        return shouldInclude && hasLink;
      });

      if (process.env.NODE_ENV === "development") {
        console.log("Final filtered positions count:", filteredData.length);
      }

      // Debug: Show source distribution
      const sourceCounts = filteredData.reduce((acc: any, pos: any) => {
        const src = pos.source?.toLowerCase() || "unknown";
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      }, {});

      if (process.env.NODE_ENV === "development") {
        console.log("Source distribution:", sourceCounts);
      }

      setPositions(filteredData);
    } catch (err) {
      console.error(" Error loading positions:", err);
    } finally {
      setPositionsLoading(false);
    }
  }, [setPositionsLoading, setPositions]);

  const loadDashboard = useCallback(
    async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);

        const token =
          localStorage.getItem("access_token") || localStorage.getItem("token");

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
          "full_name",
          "email",
          "phone",
          "workstatus",
          "dob",
          "github_link",
          "address",
          "linkedin_id",
          "education",
          "zip_code",
        ];

        const profileData = {
          full_name: fullProfile?.personal_info?.full_name,
          email: fullProfile?.personal_info?.email,
          phone: fullProfile?.personal_info?.phone,
          workstatus: fullProfile?.personal_info?.workstatus,
          dob: fullProfile?.personal_info?.dob,
          github_link: fullProfile?.personal_info?.github_link,
          address: fullProfile?.personal_info?.address,
          linkedin_id: fullProfile?.personal_info?.linkedin_id,
          education: fullProfile?.personal_info?.education,
          zip_code: fullProfile?.personal_info?.zip_code,
        };

        // Use login_count from profile (UserDashboard) or Candidate profile
        const loginCount = profile?.login_count ?? profile?.logincount ?? 0;

        const isMissingRequiredFields =
          loginCount <= 1 ||
          requiredFields.some(
            (field) => !profileData[field as keyof typeof profileData],
          );

        setHasMissingFields(isMissingRequiredFields);

        const status = fullProfile?.enrollment?.agreement || "N";
        setAgreementStatus(status);
        const isApproved = status === "Y";
        const isSkipped =
          sessionStorage.getItem("onboarding_skipped") === "true";

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

        const dashboardData = await apiFetch(
          `candidates/${id}/dashboard/overview`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!dashboardData) {
          throw new Error("No data received from server");
        }

        setData(dashboardData);
      } catch (err: any) {
        console.error("Dashboard loading error:", err);

        const errorMessage = extractErrorMessage(
          err,
          "Failed to load dashboard",
        );
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
    },
    [
      router,
      loadUserProfile,
      getCandidateId,
      setCandidateId,
      setHasMissingFields,
      setAgreementStatus,
      setShowOnboarding,
      setData,
      setLoading,
      setError,
    ],
  );

  useEffect(() => {
    if (data) {
      const timeoutId = setTimeout(() => {
        loadSessions();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [data]);

  useEffect(() => {
    if (activeTab === "job-board" && positions.length === 0) {
      loadPositions();
    }
    if (activeTab === "my-interviews") {
      // Auto-refresh interview data when switching to this tab
      // so employee UI changes (feedback, notes) are visible immediately
      loadDashboard();
    }
    if (activeTab === "my-resume" && candidateId) {
      const run = async () => {
        try {
          const token = localStorage.getItem("access_token") || "";
          const payload = JSON.parse(atob(token.split(".")[1]));
          const email =
            payload.sub || payload.email || payload.uname || "candidate";

          const dataSummary = await apiFetch("/api/setup/init-and-summary", {
            method: "POST",
            body: { candidate_id: candidateId, wbl_email: email, name: email },
          });

          const sid = dataSummary.session_id;
          const summaryData = dataSummary.summary;
          if (sid) {
            localStorage.setItem("prep_token", sid);
            setPrefetchedSession({ sessionId: sid, summaryData });

            const hasKeys =
              summaryData.has_api_key === true ||
              (Array.isArray(summaryData.llm_keys) &&
                summaryData.llm_keys.length > 0);
            const hasResume =
              summaryData.resume_text === "Exists" ||
              (summaryData.resume_json != null &&
                typeof summaryData.resume_json === "object");
            setSetupStatus({
              resume_uploaded: hasResume,
              api_keys_configured: hasKeys,
              setup_complete: hasResume && hasKeys,
              has_binary_resume: !!summaryData.has_binary_resume,
              binary_resume_filename:
                summaryData.binary_resume_filename || null,
            });
          }
        } catch (err) {
          console.error("Failed to refresh setup status on tab switch:", err);
        }
      };
      void run();
    }
  }, [
    activeTab,
    candidateId,
    setPrefetchedSession,
    setSetupStatus,
    loadDashboard,
    loadPositions,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
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
    sessionStorage.removeItem("onboarding_skipped");
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
            Loading Dashboard...
          </h2>
          <div className="flex items-center justify-center space-x-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-100">
            Connection Failed
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {error || "Unable to load dashboard data"}
          </p>
          <button
            onClick={() => loadDashboard()}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-semibold text-white transition-all duration-300 hover:from-blue-600 hover:to-purple-600"
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
        currentAgreementStatus={agreementStatus || "N"}
        initialHasMissingFields={hasMissingFields}
        onComplete={() => {
          localStorage.setItem("onboarding_completed", "true");
          setShowOnboarding(false);
          loadDashboard(); // Reload to see if approved
        }}
        onSkip={() => {
          sessionStorage.setItem("onboarding_skipped", "true");
          setShowOnboarding(false);
        }}
      />
    );
  }

  const firstName = data.basic_info.full_name.split(" ")[0];

  const tabs = [
    { id: "overview" as TabType, name: "Overview", icon: Home },
    { id: "job-board" as TabType, name: "Job Board", icon: Briefcase },
    { id: "my-llm-setup" as TabType, name: "My LLM Setup", icon: Settings },
    { id: "my-resume" as TabType, name: "My Resume", icon: FileText },
    { id: "my-sessions" as TabType, name: "My Sessions", icon: PlayCircle },
    {
      id: "my-interviews" as TabType,
      name: "My Interviews",
      icon: MessageSquare,
    },
    {
      id: "my-applications" as TabType,
      name: "My Applications",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f9] dark:bg-gray-950">
      {/* Hidden identity tag for browser extension telemetry */}
      {data?.basic_info?.email && (
        <div
          id="wbl-user-identity"
          data-email={data.basic_info.email}
          style={{ display: "none" }}
        />
      )}

      {/* ==================== SIDEBAR ==================== */}
      <aside className="z-30 hidden w-60 flex-shrink-0 flex-col border-r border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:flex">
        {/* Logo */}
        <div className="border-b border-gray-100 p-5 pb-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
              Whitebox
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-4">
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Navigation
            </p>
            <div className="space-y-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <React.Fragment key={tab.id}>
                    <button
                      onClick={() => goToTab(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 flex-shrink-0 ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400"
                        }`}
                      />
                      <span>{tab.name}</span>
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
              <a
                href="/coderpad"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-150 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-white"
              >
                <Code2
                  className="h-4 w-4 flex-shrink-0 text-gray-400"
                  aria-hidden
                />
                <span>Coderpad</span>
              </a>
              <button
                onClick={() => goToTab("wbl-smartprep")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  activeTab === "wbl-smartprep"
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-white"
                }`}
              >
                <Sparkles
                  className={`h-4 w-4 flex-shrink-0 ${
                    activeTab === "wbl-smartprep"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400"
                  }`}
                />
                <span>WBL SmartPrep</span>
                {activeTab === "wbl-smartprep" && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header
          className={`${
            activeTab === "overview"
              ? "min-h-[80px] py-3 lg:min-h-[100px]"
              : "min-h-[56px] py-2 lg:min-h-[64px]"
          } z-20 flex flex-shrink-0 items-center justify-between border-b border-gray-100 bg-[#f4f6f9] px-4 dark:border-gray-800 dark:bg-gray-950 lg:px-6`}
        >
          <div className="flex flex-1 items-center gap-4">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Candidate Details Card - show only on Overview tab */}
            {activeTab === "overview" &&
              !viewResumeOpen &&
              !setupWizardOpen &&
              !pathname?.includes("resume") && (
                // <div className="hidden sm:flex items-center gap-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-8 py-5 shadow-sm">
                <div className="hidden w-full items-center justify-between rounded-2xl border border-gray-100 bg-white px-8 py-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex">
                  {/* Greeting + Name + Email */}
                  {/* <div className="flex items-center gap-4 pr-6 border-r border-gray-100 dark:border-gray-700"> */}
                  <div className="flex flex-shrink-0 items-center gap-4 border-r border-gray-200 pr-8 dark:border-gray-700">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white shadow-md">
                      {data.basic_info.full_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      {activeTab === "overview" ? (
                        <>
                          <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-blue-500">
                            Welcome back
                          </p>
                          <h1 className="whitespace-nowrap text-lg font-extrabold leading-none text-gray-900 dark:text-white">
                            Hi, {firstName}
                          </h1>
                        </>
                      ) : (
                        <h1 className="whitespace-nowrap text-lg font-extrabold leading-none text-gray-900 dark:text-white">
                          {data.basic_info.full_name}
                        </h1>
                      )}
                      <p className="mt-1 truncate text-xs text-gray-400">
                        {data.basic_info.email}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  {[
                    {
                      icon: Award,
                      label: "Batch",
                      value: data.basic_info.batch_name || "N/A",
                      color: "text-purple-500",
                    },
                    {
                      icon: Calendar,
                      label: "Enrolled",
                      value: data.basic_info.enrolled_date
                        ? format(
                            parseISO(data.basic_info.enrolled_date),
                            "MMM dd, yyyy",
                          )
                        : "N/A",
                      color: "text-green-500",
                    },
                    {
                      icon: Briefcase,
                      label: "Fee Paid",
                      value: `$${data.basic_info.fee_paid || 0}`,
                      color: "text-emerald-500",
                    },
                    {
                      icon: Activity,
                      label: "Logins",
                      value: `${userProfile?.login_count || 0}`,
                      color: "text-orange-500",
                    },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div
                      key={label}
                      className={`hidden flex-1 flex-col items-center justify-center border-r border-gray-200 px-6 text-center last:border-r-0 dark:border-gray-700 lg:flex`}
                    >
                      <span className="block w-full text-center text-[12px] font-bold uppercase tracking-wider text-gray-400">
                        {label}
                      </span>
                      {/* <div className="flex items-center gap-2"> */}
                      <div className="flex items-center justify-center gap-2">
                        <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
                        <span className="whitespace-nowrap text-sm font-bold text-gray-700 dark:text-gray-200">
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {activeTab === "job-board" && (
            <div className="flex translate-y-[3px] items-center gap-3">
              <button
                type="button"
                onClick={openResumeJsonModal}
                className="group relative hidden cursor-pointer items-center rounded-full border-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] transition-all duration-300 hover:shadow-[0_8px_25px_-5px_rgba(168,85,247,0.7)] active:scale-95 lg:flex"
              >
                <div className="flex h-full w-full items-center gap-2.5 rounded-full bg-purple-100 px-5 py-2 transition-colors duration-300 group-hover:bg-transparent dark:bg-[#1c1822]">
                  <Code2 className="h-5 w-5 text-purple-600 transition-colors duration-300 group-hover:text-white" />
                  <span className="whitespace-nowrap text-[15px] font-medium text-purple-600 transition-colors duration-300 group-hover:text-white">
                    Resume JSON
                  </span>
                  <ChevronRight className="h-5 w-5 text-purple-600 transition-colors duration-300 group-hover:text-white" />
                </div>
              </button>

              <a
                href="https://chromewebstore.google.com/detail/talentscreen-whitebox-lea/bebdlhhpgmegdebdballinfmfnlpmeio"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative hidden items-center rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] transition-all duration-300 hover:shadow-[0_8px_25px_-5px_rgba(168,85,247,0.7)] active:scale-95 lg:flex"
              >
                <div className="flex h-full w-full items-center gap-2.5 rounded-full bg-purple-100 px-5 py-2 transition-colors duration-300 group-hover:bg-transparent dark:bg-[#1c1822]">
                  <Sparkles className="h-5 w-5 text-purple-600 transition-colors duration-300 group-hover:text-white" />
                  <span className="whitespace-nowrap text-[15px] font-medium text-purple-600 transition-colors duration-300 group-hover:text-white">
                    Autofill Extension
                  </span>
                  <ChevronRight className="h-5 w-5 text-purple-600 transition-colors duration-300 group-hover:text-white" />
                </div>
              </a>
            </div>
          )}
        </header>

        {/* Mobile Tab Bar */}
        <div className="flex flex-shrink-0 gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <React.Fragment key={tab.id}>
                <button
                  onClick={() => goToTab(tab.id)}
                  className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.name}
                </button>
              </React.Fragment>
            );
          })}
          <a
            href="/coderpad"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 transition-all dark:bg-gray-800 dark:text-gray-400"
          >
            <Puzzle className="h-3.5 w-3.5" />
            CoderPad
          </a>
          <button
            onClick={() => goToTab("wbl-smartprep")}
            className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "wbl-smartprep"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            WBL SmartPrep
          </button>
        </div>

        {/* Scrollable Content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* ==================== TAB CONTENT ==================== */}
          <div className="animate-fadeIn flex flex-1 flex-col overflow-hidden">
            {setupWizardOpen ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 lg:p-6">
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
                    goToTab("wbl-smartprep");
                  }}
                />
              </div>
            ) : (
              <>
                {activeTab === "my-llm-setup" && (
                  <div className="h-full w-full flex-1 overflow-y-auto">
                    <AiSetupTab
                      candidateId={candidateId ?? undefined}
                      onFinishSetup={async () => {
                        await refreshSetupStatus();
                        goToTab("wbl-smartprep");
                      }}
                    />
                  </div>
                )}
                {activeTab === "overview" && (
                  <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
                    {/* Phase Cards Row */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <PhaseCard
                        title="Enrolled"
                        icon={<CheckCircle className="h-5 w-5" />}
                        color="gray"
                        completed={data.journey.enrolled.completed}
                        daysSince={data.journey.enrolled.days_since}
                        batchName={data.basic_info.batch_name}
                        date={
                          data.journey.enrolled.date
                            ? format(
                                parseISO(data.journey.enrolled.date),
                                "MMM dd, yyyy",
                              )
                            : undefined
                        }
                      />
                      <PhaseCard
                        title="Preparation"
                        icon={<Target className="h-5 w-5" />}
                        color="gray"
                        active={data.journey.preparation.active}
                        completed={data.journey.preparation.completed}
                        durationDays={data.journey.preparation.duration_days}
                      />
                      <PhaseCard
                        title="Marketing"
                        icon={<TrendingUp className="h-5 w-5" />}
                        color="gray"
                        active={data.journey.marketing.active}
                        completed={data.journey.marketing.completed}
                        durationDays={data.journey.marketing.duration_days}
                      />
                      <PhaseCard
                        title="Placement"
                        icon={<Briefcase className="h-5 w-5" />}
                        color="gray"
                        active={data.journey.placement.active}
                        completed={data.journey.placement.completed}
                        company={data.phase_metrics.placement?.company}
                        date={
                          data.journey.placement.date
                            ? format(
                                parseISO(data.journey.placement.date),
                                "MMM dd, yyyy",
                              )
                            : undefined
                        }
                      />
                    </div>

                    {/* Easy Applies Card */}
                    {(() => {
                      const easyApplyCount =
                        data.candidate_stats?.easy_apply_counter ?? 0;
                      const isEasyApplyLow = easyApplyCount < 30;
                      return (
                        <div
                          className={`relative overflow-hidden rounded-2xl border p-5 ${
                            isEasyApplyLow
                              ? "border-red-100 bg-gradient-to-br from-red-50 to-rose-50/50 dark:border-red-900/30 dark:from-red-950/10 dark:to-rose-950/10"
                              : "border-emerald-100/50 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:border-gray-700/50 dark:from-gray-800/40 dark:to-gray-900/40"
                          }`}
                        >
                          <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-5">
                            <Zap
                              className={`h-20 w-20 ${
                                isEasyApplyLow
                                  ? "text-red-500"
                                  : "text-emerald-500"
                              }`}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                  isEasyApplyLow
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                <Zap className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Easy Applies Today
                                </p>
                                <p
                                  className={`mt-0.5 text-2xl font-extrabold leading-none ${
                                    isEasyApplyLow
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-gray-900 dark:text-white"
                                  }`}
                                >
                                  {easyApplyCount}
                                  <span className="ml-1 text-xs font-medium text-gray-400">
                                    / 30
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                  isEasyApplyLow
                                    ? "bg-red-500/10 text-red-500"
                                    : "bg-emerald-500/10 text-emerald-500"
                                }`}
                              >
                                {isEasyApplyLow ? "Below Target" : "✓ Reached"}
                              </span>
                              <p
                                className={`mt-1.5 text-[10px] font-semibold ${
                                  isEasyApplyLow
                                    ? "text-red-500"
                                    : "text-emerald-500"
                                }`}
                              >
                                {isEasyApplyLow
                                  ? `⚠ You need ${
                                      30 - easyApplyCount
                                    } applications to reach the daily objective`
                                  : "Daily objective met"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                      {/* JOURNEY SECTION */}
                      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-8">
                        <div className="mb-5">
                          <h2 className="text-base font-bold text-gray-900 dark:text-white">
                            Your Career Journey
                          </h2>
                          <p className="mt-0.5 text-xs text-gray-400">
                            Track your progress from enrollment to placement.
                          </p>
                        </div>

                        <div className="relative px-2 py-1">
                          {/* Line Background */}
                          <div className="absolute left-8 right-8 top-[18px] z-0 hidden h-0.5 rounded-full bg-gray-100 dark:bg-gray-800 md:block" />
                          {/* Active Progress Line */}
                          <div
                            className="absolute left-8 top-[18px] z-0 hidden h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 md:block"
                            style={{
                              width: `calc(${
                                data.journey.placement.completed
                                  ? 100
                                  : data.journey.placement.active
                                  ? 87.5
                                  : data.journey.marketing.completed
                                  ? 75
                                  : data.journey.marketing.active
                                  ? 62.5
                                  : data.journey.preparation.completed
                                  ? 50
                                  : data.journey.preparation.active
                                  ? 37.5
                                  : data.journey.enrolled.completed
                                  ? 25
                                  : 0
                              }% - 4rem)`,
                            }}
                          />
                          <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-4">
                            {[
                              {
                                id: "enrolled",
                                title: "Enrolled",
                                date: data.journey.enrolled.date,
                                status:
                                  data.journey.enrolled.completed ||
                                  data.journey.preparation.active ||
                                  data.journey.preparation.completed
                                    ? "completed"
                                    : "active",
                                icon: CheckCircle,
                                description: data.basic_info.batch_name,
                              },
                              {
                                id: "preparation",
                                title: "Preparation",
                                date: data.journey.preparation.start_date,
                                status:
                                  data.journey.preparation.completed ||
                                  data.journey.marketing.active ||
                                  data.journey.marketing.completed
                                    ? "completed"
                                    : data.journey.preparation.active
                                    ? "active"
                                    : "upcoming",
                                icon: Target,
                                duration:
                                  data.journey.preparation.duration_days,
                              },
                              {
                                id: "marketing",
                                title: "Marketing",
                                date: data.journey.marketing.start_date,
                                status:
                                  data.journey.marketing.completed ||
                                  data.journey.placement.active ||
                                  data.journey.placement.completed
                                    ? "completed"
                                    : data.journey.marketing.active
                                    ? "active"
                                    : "upcoming",
                                icon: TrendingUp,
                                duration: data.journey.marketing.duration_days,
                              },
                              {
                                id: "placement",
                                title: "Placement",
                                date: data.journey.placement.date,
                                status: data.journey.placement.completed
                                  ? "completed"
                                  : data.journey.placement.active
                                  ? "active"
                                  : "upcoming",
                                icon: Briefcase,
                                company: data.phase_metrics?.placement?.company,
                              },
                            ].map((step, idx) => (
                              <div
                                key={idx}
                                className="group relative flex flex-row items-center md:flex-col"
                              >
                                {idx !== 3 && (
                                  <div className="absolute bottom-[-24px] left-[15px] top-8 -z-10 w-0.5 bg-gray-100 dark:bg-gray-700 md:hidden" />
                                )}
                                <div
                                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border-2 shadow-sm transition-all duration-300 ${
                                    step.status === "completed"
                                      ? "border-blue-400 bg-blue-500 text-white group-hover:scale-110"
                                      : step.status === "active"
                                      ? "border-blue-500 bg-white text-blue-500 ring-4 ring-blue-100 dark:bg-gray-900 dark:ring-blue-900/30"
                                      : "border-gray-200 bg-white text-gray-300 dark:border-gray-700 dark:bg-gray-900"
                                  }`}
                                >
                                  <step.icon
                                    className={`h-4 w-4 ${
                                      step.status === "active"
                                        ? "animate-pulse"
                                        : ""
                                    }`}
                                  />
                                </div>
                                <div className="ml-4 flex-1 text-left md:ml-0 md:mt-3 md:text-center">
                                  <div
                                    className={`mb-0.5 text-[9px] font-bold uppercase tracking-widest ${
                                      step.status === "completed"
                                        ? "text-blue-500"
                                        : step.status === "active"
                                        ? "text-blue-400"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    Step 0{idx + 1}
                                  </div>
                                  <h3
                                    className={`mb-1 text-xs font-bold ${
                                      step.status === "upcoming"
                                        ? "text-gray-400"
                                        : "text-gray-900 dark:text-white"
                                    }`}
                                  >
                                    {step.title}
                                  </h3>
                                  <div className="flex min-h-[28px] flex-col justify-start md:items-center">
                                    {step.date ? (
                                      <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[9px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                                        <Calendar className="h-2.5 w-2.5" />
                                        {format(
                                          parseISO(step.date),
                                          "MMM dd, yyyy",
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] italic text-gray-300">
                                        {step.status === "upcoming"
                                          ? "Upcoming"
                                          : "Pending"}
                                      </span>
                                    )}
                                    {step.status === "active" &&
                                      step.duration && (
                                        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-500">
                                          Day {step.duration}
                                        </span>
                                      )}
                                    {step.company && (
                                      <span className="mt-0.5 truncate text-[9px] font-bold text-blue-500">
                                        {step.company}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* MY TEAM SECTION */}
                      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-4">
                        <h2 className="mb-1 text-base font-bold text-gray-900 dark:text-white">
                          My Team
                        </h2>
                        <p className="mb-4 text-xs text-gray-400">
                          Your professional support network.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              Instructors
                            </h3>
                            <div className="space-y-2">
                              {data.team_info.preparation.instructors.map(
                                (instructor, idx) => (
                                  <div
                                    key={idx}
                                    className="group flex items-center gap-3 rounded-xl bg-gray-50 p-2.5 transition-colors hover:bg-blue-50 dark:bg-gray-800/60 dark:hover:bg-blue-900/10"
                                  >
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-xs font-bold text-blue-600 dark:from-blue-900 dark:to-indigo-900 dark:text-blue-400">
                                      {instructor.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="truncate text-xs font-bold text-gray-900 dark:text-white">
                                        {instructor.name}
                                      </h4>
                                      <p className="truncate text-[10px] text-gray-400">
                                        {instructor.role || "Instructor"}
                                      </p>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          {data.team_info.marketing.manager && (
                            <div>
                              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Marketing
                              </h3>
                              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5 transition-colors hover:bg-green-50 dark:bg-gray-800/60 dark:hover:bg-green-900/10">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-teal-100 text-xs font-bold text-green-600 dark:from-green-900 dark:to-teal-900 dark:text-green-400">
                                  {data.team_info.marketing.manager.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate text-xs font-bold text-gray-900 dark:text-white">
                                    {data.team_info.marketing.manager.name}
                                  </h4>
                                  <p className="text-[10px] text-gray-400">
                                    Marketing Manager
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "my-sessions" && (
                  <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                            <PlayCircle className="h-4 w-4 text-blue-500" />
                            Sessions
                          </h2>
                          <p className="mt-0.5 text-xs text-gray-400">
                            Your recorded and upcoming sessions.
                          </p>
                        </div>
                      </div>

                      {/* Attendance Cards Grid in Sessions Tab */}
                      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {/* Card 1: Classes Attended */}
                        <div className="group relative overflow-hidden rounded-2xl border border-blue-100/50 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-md dark:border-gray-700/50 dark:from-gray-800/40 dark:to-gray-900/40">
                          <div className="absolute -bottom-4 -right-4 opacity-5 transition-transform duration-300 group-hover:scale-110">
                            <Video className="h-20 w-20 text-blue-500" />
                          </div>
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                              <Video className="h-4 w-4" />
                            </div>
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                              Classes
                            </span>
                          </div>
                          <h3 className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Classes Attended
                          </h3>
                          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            {data.candidate_stats?.classes_joined ?? 0}
                          </p>
                        </div>

                        {/* Card 2: Sessions Attended */}
                        <div className="group relative overflow-hidden rounded-2xl border border-rose-100/50 bg-gradient-to-br from-rose-50 to-orange-50/50 p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-md dark:border-gray-700/50 dark:from-gray-800/40 dark:to-gray-900/40">
                          <div className="absolute -bottom-4 -right-4 opacity-5 transition-transform duration-300 group-hover:scale-110">
                            <PlayCircle className="h-20 w-20 text-rose-500" />
                          </div>
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                              <PlayCircle className="h-4 w-4" />
                            </div>
                            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-500">
                              Sessions
                            </span>
                          </div>
                          <h3 className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Sessions Attended
                          </h3>
                          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            {data.candidate_stats?.sessions_joined ?? 0}
                          </p>
                        </div>

                        {/* Card 3: Individual Sessions */}
                        <div className="to-yellow-50/50 group relative overflow-hidden rounded-2xl border border-amber-100/50 bg-gradient-to-br from-amber-50 p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-md dark:border-gray-700/50 dark:from-gray-800/40 dark:to-gray-900/40">
                          <div className="absolute -bottom-4 -right-4 opacity-5 transition-transform duration-300 group-hover:scale-110">
                            <Award className="h-20 w-20 text-amber-500" />
                          </div>
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                              <Award className="h-4 w-4" />
                            </div>
                          </div>
                          <h3 className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Individual Sessions
                          </h3>
                          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            {sessions.length}
                          </p>
                        </div>
                      </div>

                      {sessionsLoading ? (
                        <div className="py-12 text-center">
                          <div className="mb-3 inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                          <p className="text-sm text-gray-400">
                            Loading your sessions...
                          </p>
                        </div>
                      ) : sessions.length === 0 ? (
                        <div className="py-16 text-center">
                          <PlayCircle className="mx-auto mb-3 h-14 w-14 text-gray-200 dark:text-gray-700" />
                          <h3 className="mb-1 text-base font-bold text-gray-700 dark:text-gray-300">
                            No Sessions Found
                          </h3>
                          <p className="text-sm text-gray-400">
                            {`No sessions found for ${firstName} yet`}
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="mb-3 text-xs text-gray-400">
                            Found{" "}
                            <span className="font-bold text-blue-600">
                              {sessions.length}
                            </span>{" "}
                            sessions
                          </p>
                          <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                            <table className="w-full border-collapse text-left">
                              <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:border-gray-800 dark:bg-gray-800/50">
                                  <th className="px-4 py-2.5">Session Title</th>
                                  <th className="hidden px-4 py-2.5 sm:table-cell">
                                    Date
                                  </th>
                                  <th className="px-4 py-2.5 text-right">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                                {sessions.map((session) => (
                                  <tr
                                    key={session.sessionid}
                                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                  >
                                    <td className="max-w-xs px-4 py-2.5 sm:max-w-md">
                                      <div className="flex flex-col">
                                        <span className="truncate text-xs font-bold text-gray-900 dark:text-white">
                                          {session.title || "Untitled"}
                                        </span>
                                        <span className="text-[10px] text-gray-400 sm:hidden">
                                          {session.sessiondate
                                            ? format(
                                                parseISO(session.sessiondate),
                                                "MMM dd, yyyy",
                                              )
                                            : "N/A"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="hidden px-4 py-2.5 text-xs text-gray-500 sm:table-cell">
                                      {session.sessiondate
                                        ? format(
                                            parseISO(session.sessiondate),
                                            "MMM dd, yyyy",
                                          )
                                        : "N/A"}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                      {session.link ? (
                                        <a
                                          href={session.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                                        >
                                          <PlayCircle size={13} />
                                          Watch
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-gray-300">
                                          N/A
                                        </span>
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

                {activeTab === "my-interviews" && (
                  <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                      <div className="mb-6 flex items-center justify-between">
                        <div className="flex w-full items-center justify-center gap-2">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Interviews
                          </h2>
                        </div>
                        <div className="flex w-full items-center justify-center gap-2">
                          <button
                            onClick={() => loadDashboard()}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            title="Refresh interviews"
                          >
                            <svg
                              className={`h-3.5 w-3.5 ${
                                loading ? "animate-spin" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Refresh
                          </button>
                          <button
                            onClick={() => setShowAddInterview(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
                          >
                            <Plus className="h-4 w-4" /> Add Interview
                          </button>
                        </div>
                      </div>

                      {/* Add Interview Modal Overlay */}
                      {showAddInterview && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                          <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-blue-300 bg-white shadow-2xl dark:border-blue-800 dark:bg-gray-900">
                            {/* Header: matches Employee UI exactly */}
                            <div className="flex items-center justify-between border-b border-blue-100 bg-white px-6 py-3 dark:border-blue-900 dark:bg-gray-900">
                              <h3 className="text-[15px] font-bold text-blue-600 dark:text-blue-400">
                                Add New Interviews
                              </h3>
                              <button
                                onClick={() => setShowAddInterview(false)}
                                className="text-2xl font-light text-blue-300 transition-colors hover:text-blue-500"
                              >
                                ×
                              </button>
                            </div>

                            <div className="max-h-[80vh] overflow-y-auto p-6">
                              <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                                {/* Column 1: Basic Information */}
                                <div className="space-y-4">
                                  <div className="mb-4 border-b border-blue-100 pb-1 dark:border-blue-900">
                                    <h4 className="text-[14px] font-bold text-blue-600">
                                      Company Information
                                    </h4>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                      Company{" "}
                                      <span className="font-bold text-red-500">
                                        *
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      value={addInterviewForm.company}
                                      onChange={(e) =>
                                        setAddInterviewForm((p) => ({
                                          ...p,
                                          company: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                      placeholder="Search company..."
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                      Position Title
                                    </label>
                                    <input
                                      type="text"
                                      value={addInterviewForm.position_title}
                                      onChange={(e) =>
                                        setAddInterviewForm((p) => ({
                                          ...p,
                                          position_title: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-lg border border-blue-100 bg-gray-50/50 px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800/50"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                      Interview Date{" "}
                                      <span className="font-bold text-red-500">
                                        *
                                      </span>
                                    </label>
                                    <input
                                      type="date"
                                      value={addInterviewForm.interview_date}
                                      onChange={(e) =>
                                        setAddInterviewForm((p) => ({
                                          ...p,
                                          interview_date: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                      Interview Time{" "}
                                      <span className="font-bold text-red-500">
                                        *
                                      </span>
                                    </label>
                                    <TimePicker
                                      value={addInterviewForm.interview_time}
                                      onChange={(time) =>
                                        setAddInterviewForm((p) => ({
                                          ...p,
                                          interview_time: time,
                                        }))
                                      }
                                    />
                                  </div>
                                </div>

                                {/* Column 2: Contact Information */}
                                <div className="space-y-4">
                                  <div className="mb-4 border-b border-blue-100 pb-1 dark:border-blue-900">
                                    <h4 className="text-[14px] font-bold text-blue-600">
                                      Interviewer Information
                                    </h4>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                      Interviewer Emails
                                    </label>
                                    <input
                                      type="email"
                                      value={
                                        addInterviewForm.interviewer_emails
                                      }
                                      onChange={(e) =>
                                        setAddInterviewForm((p) => ({
                                          ...p,
                                          interviewer_emails: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                      Interviewer Contact
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        addInterviewForm.interviewer_contact
                                      }
                                      onChange={(e) =>
                                        setAddInterviewForm((p) => ({
                                          ...p,
                                          interviewer_contact: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                      Interviewer LinkedIn
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        addInterviewForm.interviewer_linkedin
                                      }
                                      onChange={(e) =>
                                        setAddInterviewForm((p) => ({
                                          ...p,
                                          interviewer_linkedin: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                    />
                                  </div>
                                </div>

                                {/* Column 4: Other */}
                                <div className="space-y-4">
                                  <div className="mb-4 border-b border-blue-100 pb-1 dark:border-blue-900">
                                    <h4 className="text-[14px] font-bold text-blue-600">
                                      Interview Details
                                    </h4>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                      Mode of Interview{" "}
                                      <span className="font-bold text-red-500">
                                        *
                                      </span>
                                    </label>
                                    <select
                                      value={addInterviewForm.mode_of_interview}
                                      onChange={(e) =>
                                        setAddInterviewForm((p) => ({
                                          ...p,
                                          mode_of_interview: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                    >
                                      <option>Virtual</option>
                                      <option>In Person</option>
                                      <option>Phone</option>
                                      <option>Assessment</option>
                                      <option>AI Interview</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                      Type of Interview{" "}
                                      <span className="font-bold text-red-500">
                                        *
                                      </span>
                                    </label>
                                    <select
                                      value={addInterviewForm.type_of_interview}
                                      onChange={(e) =>
                                        setAddInterviewForm((p) => ({
                                          ...p,
                                          type_of_interview: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                    >
                                      <option>Recruiter Call</option>
                                      <option>Technical</option>
                                      <option>HR</option>
                                      <option>Prep Call</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                              {/* Job Description Field */}
                              <div className="mt-8 border-t border-blue-50 pt-6 dark:border-blue-900/50">
                                <label className="mb-2 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                  Job Description
                                </label>
                                <textarea
                                  value={addInterviewForm.job_description}
                                  onChange={(e) =>
                                    setAddInterviewForm((p) => ({
                                      ...p,
                                      job_description: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter Job Description..."
                                  className="h-32 w-full resize-none rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm shadow-sm transition placeholder:text-gray-400 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                />
                              </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="mt-10 flex justify-end gap-3 border-t border-blue-50 pt-4 dark:border-blue-900">
                              <button
                                onClick={() => setShowAddInterview(false)}
                                className="rounded-lg border border-gray-200 px-6 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleAddInterview}
                                disabled={addInterviewLoading}
                                className="rounded-lg bg-blue-600 px-8 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50"
                              >
                                {addInterviewLoading
                                  ? "Saving..."
                                  : "Add Interview"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* View Interview Modal */}
                      {mounted &&
                        viewData &&
                        createPortal(
                          <div
                            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                            style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
                          >
                            <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-blue-300 bg-white shadow-2xl dark:border-blue-800 dark:bg-gray-900">
                              <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-6 py-2.5 dark:border-blue-900 dark:from-darklight dark:via-dark dark:to-darklight">
                                <h3 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-base font-bold text-transparent">
                                  View Interview
                                </h3>
                                <button
                                  onClick={() => setViewData(null)}
                                  className="text-2xl font-light text-blue-300 transition-colors hover:text-blue-500"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="max-h-[80vh] overflow-y-auto p-6">
                                <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                                  <div className="space-y-4">
                                    <div className="mb-4 border-b border-blue-100 pb-1 dark:border-blue-900">
                                      <h4 className="text-[14px] font-bold text-blue-600">
                                        Company Information
                                      </h4>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Company{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={viewData.company ?? ""}
                                        className="w-full cursor-default rounded-lg border border-blue-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Position Title{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={viewData.position_title ?? ""}
                                        className="w-full cursor-default rounded-lg border border-blue-100 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Interview Date{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={viewData.interview_date ?? ""}
                                        className="w-full cursor-default rounded-lg border border-blue-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Interview Time{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={
                                          viewData.interview_time
                                            ? new Date(
                                                `1970-01-01T${viewData.interview_time}`,
                                              ).toLocaleTimeString([], {
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true,
                                              })
                                            : ""
                                        }
                                        className="w-full cursor-default rounded-lg border border-blue-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="mb-4 border-b border-blue-100 pb-1 dark:border-blue-900">
                                      <h4 className="text-[14px] font-bold text-blue-600">
                                        Interviewer Information
                                      </h4>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Interviewer Email
                                      </label>
                                      <input
                                        type="email"
                                        readOnly
                                        value={
                                          viewData.interviewer_emails ?? ""
                                        }
                                        className="w-full cursor-default rounded-lg border border-blue-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Interviewer Contact
                                      </label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={
                                          viewData.interviewer_contact ?? ""
                                        }
                                        className="w-full cursor-default rounded-lg border border-blue-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Interviewer LinkedIn
                                      </label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={
                                          viewData.interviewer_linkedin ?? ""
                                        }
                                        className="w-full cursor-default rounded-lg border border-blue-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="mb-4 border-b border-blue-100 pb-1 dark:border-blue-900">
                                      <h4 className="text-[14px] font-bold text-blue-600">
                                        Interview Details
                                      </h4>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Mode of Interview{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={viewData.mode_of_interview ?? ""}
                                        className="w-full cursor-default rounded-lg border border-blue-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Type of Interview{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={viewData.type_of_interview ?? ""}
                                        className="w-full cursor-default rounded-lg border border-blue-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Result
                                      </label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={viewData.feedback ?? "Pending"}
                                        className="w-full cursor-default rounded-lg border border-blue-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-8 border-t border-blue-50 pt-6 dark:border-blue-900/50">
                                  <label className="mb-2 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                    Job Description
                                  </label>
                                  <textarea
                                    readOnly
                                    value={viewData.job_description ?? ""}
                                    className="h-32 w-full cursor-default resize-none rounded-lg border border-blue-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                  />
                                </div>
                                <div className="mt-4">
                                  <label className="mb-2 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                    Detailed Feedback
                                  </label>
                                  <textarea
                                    readOnly
                                    value={viewData.feedback_text ?? ""}
                                    className="h-32 w-full cursor-default resize-none rounded-lg border border-blue-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none dark:border-blue-800 dark:bg-gray-800/50"
                                  />
                                </div>
                                <div className="mt-10 flex justify-end gap-3 border-t border-blue-50 pt-4 dark:border-blue-900">
                                  <button
                                    onClick={() => setViewData(null)}
                                    className="rounded-lg bg-blue-600 px-8 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>,
                          document.body,
                        )}

                      {/* Edit Interview Modal */}
                      {mounted &&
                        editData &&
                        createPortal(
                          <div
                            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                            style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
                          >
                            <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-blue-300 bg-white shadow-2xl dark:border-blue-800 dark:bg-gray-900">
                              <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-6 py-2.5 dark:border-blue-900 dark:from-darklight dark:via-dark dark:to-darklight">
                                <h3 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-base font-bold text-transparent">
                                  Edit Interview
                                </h3>
                                <button
                                  onClick={() => setEditData(null)}
                                  className="text-2xl font-light text-blue-300 transition-colors hover:text-blue-500"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="max-h-[80vh] overflow-y-auto p-6">
                                <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                                  <div className="space-y-4">
                                    <div className="mb-4 border-b border-blue-100 pb-1 dark:border-blue-900">
                                      <h4 className="text-[14px] font-bold text-blue-600">
                                        Company Information
                                      </h4>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Company{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <input
                                        type="text"
                                        value={editInterviewForm.company ?? ""}
                                        onChange={(e) =>
                                          setEditInterviewForm((p: any) => ({
                                            ...p,
                                            company: e.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Position Title{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <input
                                        type="text"
                                        value={
                                          editInterviewForm.position_title ?? ""
                                        }
                                        onChange={(e) =>
                                          setEditInterviewForm((p: any) => ({
                                            ...p,
                                            position_title: e.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-blue-100 bg-gray-50/50 px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800/50"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Interview Date{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <input
                                        type="date"
                                        value={
                                          editInterviewForm.interview_date ?? ""
                                        }
                                        onChange={(e) =>
                                          setEditInterviewForm((p: any) => ({
                                            ...p,
                                            interview_date: e.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Interview Time{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <TimePicker
                                        value={editInterviewForm.interview_time}
                                        onChange={(time) =>
                                          setEditInterviewForm((p: any) => ({
                                            ...p,
                                            interview_time: time,
                                          }))
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="mb-4 border-b border-blue-100 pb-1 dark:border-blue-900">
                                      <h4 className="text-[14px] font-bold text-blue-600">
                                        Interviewer Information
                                      </h4>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Interviewer Emails
                                      </label>
                                      <input
                                        type="email"
                                        value={
                                          editInterviewForm.interviewer_emails ??
                                          ""
                                        }
                                        onChange={(e) =>
                                          setEditInterviewForm((p: any) => ({
                                            ...p,
                                            interviewer_emails: e.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Interviewer Contact
                                      </label>
                                      <input
                                        type="text"
                                        value={
                                          editInterviewForm.interviewer_contact ??
                                          ""
                                        }
                                        onChange={(e) =>
                                          setEditInterviewForm((p: any) => ({
                                            ...p,
                                            interviewer_contact: e.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Interviewer LinkedIn
                                      </label>
                                      <input
                                        type="text"
                                        value={
                                          editInterviewForm.interviewer_linkedin ??
                                          ""
                                        }
                                        onChange={(e) =>
                                          setEditInterviewForm((p: any) => ({
                                            ...p,
                                            interviewer_linkedin:
                                              e.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="mb-4 border-b border-blue-100 pb-1 dark:border-blue-900">
                                      <h4 className="text-[14px] font-bold text-blue-600">
                                        Interview Details
                                      </h4>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Mode of Interview{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <select
                                        value={
                                          editInterviewForm.mode_of_interview ??
                                          ""
                                        }
                                        onChange={(e) =>
                                          setEditInterviewForm((p: any) => ({
                                            ...p,
                                            mode_of_interview: e.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                      >
                                        <option>Virtual</option>
                                        <option>In Person</option>
                                        <option>Phone</option>
                                        <option>Assessment</option>
                                        <option>AI Interview</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Type of Interview{" "}
                                        <span className="font-black text-red-600">
                                          *
                                        </span>
                                      </label>
                                      <select
                                        value={
                                          editInterviewForm.type_of_interview ??
                                          ""
                                        }
                                        onChange={(e) =>
                                          setEditInterviewForm((p: any) => ({
                                            ...p,
                                            type_of_interview: e.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                      >
                                        <option>Recruiter Call</option>
                                        <option>Technical</option>
                                        <option>HR</option>
                                        <option>Prep Call</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        Result
                                      </label>
                                      <select
                                        value={
                                          editInterviewForm.feedback ??
                                          "Pending"
                                        }
                                        onChange={(e) =>
                                          setEditInterviewForm((p: any) => ({
                                            ...p,
                                            feedback: e.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                      >
                                        <option value="Pending">Pending</option>
                                        <option value="Positive">
                                          Positive
                                        </option>
                                        <option value="Negative">
                                          Negative
                                        </option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-8 border-t border-blue-50 pt-6 dark:border-blue-900/50">
                                  <label className="mb-2 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                    Job Description
                                  </label>
                                  <textarea
                                    value={
                                      editInterviewForm.job_description ?? ""
                                    }
                                    onChange={(e) =>
                                      setEditInterviewForm((p: any) => ({
                                        ...p,
                                        job_description: e.target.value,
                                      }))
                                    }
                                    placeholder="Enter Job Description..."
                                    className="h-32 w-full resize-none rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm shadow-sm transition placeholder:text-gray-400 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                  />
                                </div>
                                <div className="mt-4">
                                  <label className="mb-2 block text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                    Detailed Feedback
                                  </label>
                                  <textarea
                                    value={
                                      editInterviewForm.feedback_text ?? ""
                                    }
                                    onChange={(e) =>
                                      setEditInterviewForm((p: any) => ({
                                        ...p,
                                        feedback_text: e.target.value,
                                      }))
                                    }
                                    placeholder="Enter interview feedback..."
                                    className="h-32 w-full resize-none rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm shadow-sm transition placeholder:text-gray-400 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800 dark:bg-gray-800"
                                  />
                                </div>
                                <div className="mt-10 flex justify-end gap-3 border-t border-blue-50 pt-4 dark:border-blue-900">
                                  <button
                                    onClick={() => setEditData(null)}
                                    className="rounded-lg border border-gray-200 px-6 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleEditInterview}
                                    disabled={editInterviewLoading}
                                    className="rounded-xl bg-gradient-to-r from-[#4facfe] to-[#00f2fe] px-6 py-2 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 disabled:opacity-50"
                                  >
                                    {editInterviewLoading
                                      ? "Saving..."
                                      : "Save Changes"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>,
                          document.body,
                        )}

                      <div className="space-y-4">
                        {data.interviews.filter(
                          (i) =>
                            i.interview_date &&
                            new Date(i.interview_date) >=
                              new Date(new Date().setHours(0, 0, 0, 0)),
                        ).length > 0 && (
                          <div>
                            <div className="mb-3 flex items-center gap-2">
                              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                Upcoming Rounds
                              </h3>
                            </div>
                            <div className="h-[300px]">
                              <CandidateGrid
                                rowData={data.interviews
                                  .filter(
                                    (i) =>
                                      i.interview_date &&
                                      new Date(i.interview_date) >=
                                        new Date(
                                          new Date().setHours(0, 0, 0, 0),
                                        ),
                                  )
                                  .sort(
                                    (a, b) =>
                                      new Date(a.interview_date).getTime() -
                                      new Date(b.interview_date).getTime(),
                                  )}
                                columnDefs={interviewColumnDefs.filter(
                                  (col) => col.field !== "feedback_text",
                                )}
                                height="300px"
                                rowHeight={60}
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                              Interview History
                            </h3>
                            <div className="hidden items-center gap-5 sm:flex">
                              <div className="flex w-full items-center justify-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                  Upcoming
                                </span>
                                <span
                                  className={`text-sm font-bold ${
                                    data.interviews.filter(
                                      (i: any) =>
                                        i.interview_date &&
                                        new Date(i.interview_date) >=
                                          new Date(
                                            new Date().setHours(0, 0, 0, 0),
                                          ),
                                    ).length > 0
                                      ? "text-green-600"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {
                                    data.interviews.filter(
                                      (i: any) =>
                                        i.interview_date &&
                                        new Date(i.interview_date) >=
                                          new Date(
                                            new Date().setHours(0, 0, 0, 0),
                                          ),
                                    ).length
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="h-[400px]">
                            <CandidateGrid
                              rowData={data.interviews
                                .filter(
                                  (i: any) =>
                                    !i.interview_date ||
                                    new Date(i.interview_date).getTime() <
                                      new Date(
                                        new Date().setHours(0, 0, 0, 0),
                                      ).getTime(),
                                )
                                .sort(
                                  (a: any, b: any) =>
                                    new Date(b.interview_date).getTime() -
                                    new Date(a.interview_date).getTime(),
                                )}
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

                {activeTab === "job-board" && (
                  <div className="mt-4 flex min-h-0 w-full flex-1 flex-col px-4 pb-8 sm:mt-8 lg:px-6">
                    <div className="mb-6 flex w-full flex-col justify-between gap-4 pt-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                          <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Jobs{" "}
                          <span className="font-medium text-gray-400">
                            ({positions.length})
                          </span>
                        </h2>
                      </div>
                      <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-[320px]">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="job-search"
                            type="text"
                            value={jobSearchTerm}
                            placeholder="Search by title, company, location..."
                            onChange={(e) => setJobSearchTerm(e.target.value)}
                            className="h-10 rounded-xl border-gray-200 bg-white pl-10 transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      className="w-full rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
                      style={{ height: "380px" }}
                    >
                      <CandidateGrid
                        rowData={filteredPositions}
                        columnDefs={jobColumnDefs}
                        loading={positionsLoading}
                        height="380px"
                        paginationPageSize={100}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "wbl-smartprep" && (
                  <div className="flex-1 space-y-5 overflow-y-auto p-4 lg:p-6">
                    {/* AI Profile Setup Card */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                            <Settings className="h-4 w-4 text-violet-500" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-gray-800 dark:text-white">
                              Manage AI Profile
                            </span>
                            <p className="mt-0.5 text-[11px] text-gray-400">
                              Configure your resume and API keys for AI
                              interviews
                            </p>
                          </div>
                        </div>
                        {setupStatus?.setup_complete && (
                          <button
                            type="button"
                            onClick={() => {
                              setSetupWizardManageMode(true);
                              setSetupWizardOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600 transition-colors hover:text-violet-700 dark:bg-violet-900/20"
                          >
                            Manage
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Resume Status */}
                        <div
                          className={`flex flex-1 items-center gap-2.5 rounded-xl border p-3 transition-all ${
                            setupStatus === null
                              ? "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                              : setupStatus.resume_uploaded
                              ? "border-emerald-100 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/20"
                              : "border-amber-100 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                              setupStatus === null
                                ? "bg-gray-100 dark:bg-gray-700"
                                : setupStatus.resume_uploaded
                                ? "bg-emerald-100 dark:bg-emerald-900/40"
                                : "bg-amber-100 dark:bg-amber-900/40"
                            }`}
                          >
                            {setupStatus === null ? (
                              <div className="h-3 w-3 animate-pulse rounded-full bg-gray-300" />
                            ) : setupStatus.resume_uploaded ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Resume
                            </p>
                            <p
                              className={`mt-0.5 text-xs font-bold ${
                                setupStatus === null
                                  ? "text-gray-400"
                                  : setupStatus.resume_uploaded
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {setupStatus === null
                                ? "Loading..."
                                : setupStatus.resume_uploaded
                                ? "Added"
                                : "Not added"}
                            </p>
                          </div>
                          {setupStatus?.resume_uploaded && (
                            <button
                              type="button"
                              onClick={() => setViewResumeOpen(true)}
                              className="ml-auto flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-600 transition-colors hover:text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:text-violet-300"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Resume
                            </button>
                          )}
                        </div>
                        {/* API Keys Status */}
                        <div
                          className={`flex flex-1 items-center gap-2.5 rounded-xl border p-3 transition-all ${
                            setupStatus === null
                              ? "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                              : setupStatus.api_keys_configured
                              ? "border-emerald-100 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/20"
                              : "border-amber-100 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                              setupStatus === null
                                ? "bg-gray-100 dark:bg-gray-700"
                                : setupStatus.api_keys_configured
                                ? "bg-emerald-100 dark:bg-emerald-900/40"
                                : "bg-amber-100 dark:bg-amber-900/40"
                            }`}
                          >
                            {setupStatus === null ? (
                              <div className="h-3 w-3 animate-pulse rounded-full bg-gray-300" />
                            ) : setupStatus.api_keys_configured ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              API Keys
                            </p>
                            <p
                              className={`mt-0.5 text-xs font-bold ${
                                setupStatus === null
                                  ? "text-gray-400"
                                  : setupStatus.api_keys_configured
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {setupStatus === null
                                ? "Loading..."
                                : setupStatus.api_keys_configured
                                ? "Added"
                                : "Not added"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Start Preparation / Complete Setup Button */}
                      {setupStatus && !setupWizardOpen && (
                        <div className="mt-8 flex flex-1 items-center justify-center">
                          {setupStatus.setup_complete ? (
                            <button
                              onClick={async () => {
                                const getAiPrepUrl = () => {
                                  const url =
                                    process.env.NEXT_PUBLIC_AIPREP_FRONTEND_URL;

                                  if (url) {
                                    return url;
                                  }

                                  return "https://ai-prep.whitebox-learning.com";
                                };
                                const baseUrl = getAiPrepUrl();
                                const token =
                                  localStorage.getItem("prep_token");

                                if (token) {
                                  window.open(
                                    `${baseUrl}/auth?token=${token}`,
                                    "_blank",
                                  );
                                } else {
                                  window.open(baseUrl, "_blank");
                                }
                              }}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:from-emerald-500 hover:to-teal-400 hover:shadow-lg"
                            >
                              <PlayCircle className="h-4 w-4" />
                              Start Preparation
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (setupStatus?.api_keys_configured) {
                                  goToTab("my-resume");
                                } else {
                                  goToTab("my-llm-setup");
                                }
                              }}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-lg"
                            >
                              <Sparkles className="h-4 w-4" />
                              Complete Setup
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "my-llm-key" && <CandidateLlmKeysPanel />}

                {activeTab === "my-applications" && (
                  <div className="flex-1 space-y-6 overflow-y-auto p-4 lg:p-6">
                    <div className="relative rounded-3xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 lg:p-8">
                      {viewApplicationsOpen && (
                        <div
                          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                          onClick={() => setViewApplicationsOpen(false)}
                        >
                          <div
                            className="relative h-[500px] w-full max-w-5xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-purple-100 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-6 py-4 dark:border-gray-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                              <h2 className="text-xl font-bold">
                                <span className="text-blue-700 dark:text-blue-400">
                                  Easy Apply (
                                  {data?.easy_apply_logs?.length ?? 0})
                                </span>
                                <span className="text-fuchsia-600">
                                  {" "}
                                  - View Applications
                                </span>
                              </h2>

                              <button
                                type="button"
                                onClick={() => setViewApplicationsOpen(false)}
                                className="rounded-full p-2 text-blue-500 transition hover:bg-blue-100 dark:hover:bg-gray-700"
                              >
                                <X className="h-6 w-6" />
                              </button>
                            </div>

                            {/* Table */}
                            <div className="h-[420px] overflow-y-auto">
                              <table className="w-full border-collapse">
                                <thead className="sticky top-0 z-20 bg-gray-100 shadow-sm dark:bg-gray-800">
                                  <tr>
                                    <th className="px-5 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-200">
                                      Company Name
                                    </th>

                                    <th className="px-5 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-200">
                                      Role
                                    </th>

                                    <th className="px-5 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-200">
                                      Applied Date
                                    </th>

                                    <th className="px-5 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-200">
                                      Status
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {data?.easy_apply_logs?.length ? (
                                    data.easy_apply_logs.map((log) => (
                                      <tr
                                        key={log.id}
                                        className="border-b border-gray-100 transition hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-gray-800"
                                      >
                                        <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                                          {log.company}
                                        </td>

                                        <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                                          {log.role}
                                        </td>

                                        <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                                          {log.date
                                            ? format(
                                                parseISO(log.date),
                                                "dd MMM yyyy",
                                              )
                                            : "N/A"}
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                          <span
                                            className={`{ log.status === "Success" ? "bg-green-100
                                              dark:text-green-400"
                                                } inline-flex rounded-full
                                                px-3 py-1 text-xs font-semibold text-green-700
                                                
                                            
                                              dark:bg-green-900/30`}
                                          >
                                            {log.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={4}
                                        className="py-20 text-center text-gray-500 dark:text-gray-400"
                                      >
                                        No Easy Apply applications found.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Header */}

                      {/* Header */}
                      <div className="mb-8">
                        <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900 dark:text-white">
                          <BarChart3 className="h-5 w-5 text-blue-500" />
                          Application Analytics
                        </h2>
                        <p className="mt-1 text-xs text-gray-400">
                          Real-time statistics for your job search, outreaches,
                          and applications.
                        </p>
                      </div>

                      {/* Cards Grid */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Card 1: Job Listing Clicked */}
                        <div className="group relative overflow-hidden rounded-2xl border border-blue-100/50 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-md dark:border-gray-700/50 dark:from-gray-800/40 dark:to-gray-900/40">
                          <div className="absolute -bottom-4 -right-4 opacity-5 transition-transform duration-300 group-hover:scale-110">
                            <MousePointerClick className="h-24 w-24 text-blue-500" />
                          </div>
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                              <MousePointerClick className="h-5 w-5" />
                            </div>
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                              Clicks
                            </span>
                          </div>
                          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Job Board Clicks
                          </h3>
                          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            {data.candidate_stats?.job_listings_clicked ?? 0}
                          </p>
                          <p className="mt-2 text-[10px] text-gray-400">
                            Total clicks on job listings from the Job Board
                          </p>
                        </div>

                        {/* Card 2: Outreach Counter */}
                        <div className="group relative overflow-hidden rounded-2xl border border-purple-100/50 bg-gradient-to-br from-purple-50 to-pink-50/50 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-md dark:border-gray-700/50 dark:from-gray-800/40 dark:to-gray-900/40">
                          {/* Background Icon */}
                          <div className="absolute -bottom-4 -right-4 opacity-5 transition-transform duration-300 group-hover:scale-110">
                            <Send className="h-24 w-24 text-purple-500" />
                          </div>

                          {/* Header */}
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                              <Send className="h-5 w-5" />
                            </div>

                            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-purple-500">
                              Outreach
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Campaign Outreaches
                          </h3>

                          <div className="mt-1 grid grid-cols-2 gap-2">
                            {/* Daily Outreach */}
                            <div className="rounded-xl bg-white/40 p-4 shadow-sm ring-1 ring-purple-100 transition-all duration-300 hover:shadow-md dark:bg-gray-800/60 dark:ring-gray-700">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                Daily
                              </p>

                              <p className="mt-2 text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                                {data.candidate_stats?.daily_outreach ?? 0}
                              </p>
                            </div>

                            {/* Weekly Outreach */}
                            <div className="rounded-xl bg-white/40 p-4 shadow-sm ring-1 ring-purple-100 transition-all duration-300 hover:shadow-md dark:bg-gray-800/60 dark:ring-gray-700">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                Weekly 
                              </p>

                              <p className="mt-2 text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                                {data.candidate_stats?.weekly_outreach ?? 0}
                              </p>
                            </div>
                          </div>
                          {/* Footer */}
                          <p className="mt-4 text-[10px] text-gray-400">
                            Emails sent to vendors and hiring managers
                          </p>
                        </div>

                        {/* Card 3: Easy Apply Counter */}
                        {(() => {
                          const easyApplyCount =
                            data.candidate_stats?.easy_apply_counter ?? 0;
                          const isEasyApplyLow = easyApplyCount < 30;
                          return (
                            <div
                              className={`relative rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                                isEasyApplyLow
                                  ? "border-red-100 bg-gradient-to-br from-red-50 to-rose-50/50 dark:border-red-900/30 dark:from-red-950/10 dark:to-rose-950/10"
                                  : "border-emerald-100/50 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:border-gray-700/50 dark:from-gray-800/40 dark:to-gray-900/40"
                              }`}
                              onMouseEnter={() => setIsEasyApplyHover(true)}
                              onMouseLeave={() => setIsEasyApplyHover(false)}
                            >
                              <div className="absolute -bottom-4 -right-4 opacity-5 transition-transform duration-300 group-hover:scale-110">
                                <Zap
                                  className={`h-24 w-24 ${
                                    isEasyApplyLow
                                      ? "text-red-500"
                                      : "text-emerald-500"
                                  }`}
                                />
                              </div>

                              <div className="mb-4 flex items-center justify-between">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                    isEasyApplyLow
                                      ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                      : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                                  }`}
                                >
                                  <Zap className="h-5 w-5" />
                                </div>

                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                                    isEasyApplyLow
                                      ? "bg-red-500/10 text-red-500"
                                      : "bg-emerald-500/10 text-emerald-500"
                                  }`}
                                >
                                  Easy Apply
                                </span>
                              </div>
                              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                                Easy Applies
                              </h3>
                              <p
                                className={`text-3xl font-extrabold ${
                                  isEasyApplyLow
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                {easyApplyCount}
                              </p>
                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() => setViewApplicationsOpen(true)}
                                  className="group inline-flex items-center gap-2 bg-transparent px-5 py-2.5 text-sm font-semibold text-gray-400 "
                                >
                                  <Eye className="h-4 w-4" /> View
                                </button>
                              </div>
                              <p className="mt-2 text-[10px] text-gray-400">
                                Auto-filled forms and quick-applied positions
                              </p>
                              <p
                                className={`mt-1 text-[10px] font-semibold ${
                                  isEasyApplyLow
                                    ? "text-red-500"
                                    : "text-emerald-500"
                                }`}
                              >
                                {isEasyApplyLow
                                  ? `⚠ ${
                                      30 - easyApplyCount
                                    } more needed to reach target`
                                  : "✓ Target reached"}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "my-resume" && (
                  <div className="flex-1 space-y-6 overflow-y-auto p-4 lg:p-6">
                    <div className="animate-in fade-in rounded-3xl border border-gray-100 bg-white p-6 shadow-lg duration-200 dark:border-gray-800 dark:bg-gray-900 lg:p-8">
                      {!showTemplates ? (
                        <div className="animate-in fade-in space-y-6 duration-200">
                          {/* Header */}
                          <div className="mb-6">
                            <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-gray-900 dark:text-white">
                              Upload Resume
                            </h2>
                            <p className="mt-1 text-xs text-gray-400">
                              Provide your resume in pdf, doc, docx format.
                            </p>
                          </div>

                          {/* Conditional display based on LLM setup status */}
                          {!(
                            userRole === "employee" ||
                            setupStatus?.api_keys_configured ||
                            prefetchedSession?.summaryData?.has_api_key ||
                            (prefetchedSession?.summaryData?.llm_keys &&
                              prefetchedSession.summaryData.llm_keys.length > 0)
                          ) ? (
                            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/5 p-10 text-center dark:border-red-900/50 dark:bg-red-950/5">
                              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-950/40">
                                <KeyRound
                                  size={22}
                                  className="text-red-600 dark:text-red-400"
                                />
                              </div>
                              <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">
                                LLM API Key Required
                              </h3>
                              <p className="mb-6 max-w-md text-xs leading-relaxed text-gray-400 dark:text-gray-400">
                                To upload and parse your resume using AI, you
                                must configure at least one active API key in
                                the LLM setup tab first.
                              </p>
                              <button
                                onClick={() => goToTab("my-llm-setup")}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-blue-700 active:bg-blue-800"
                              >
                                <Settings size={14} />
                                <span>Configure LLM Key</span>
                              </button>
                            </div>
                          ) : (
                            /* Full-width dashed uploader zone */
                            <div className="w-full">
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setResumeDragOver(true);
                                }}
                                onDragLeave={() => setResumeDragOver(false)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setResumeDragOver(false);
                                  if (
                                    resumeUploadLoading ||
                                    setupStatus?.has_binary_resume
                                  )
                                    return;
                                  if (
                                    e.dataTransfer.files &&
                                    e.dataTransfer.files.length > 0
                                  ) {
                                    const droppedFile = e.dataTransfer.files[0];
                                    if (handleInlineFileValidate(droppedFile)) {
                                      void handleInlineUpload(droppedFile);
                                    }
                                  }
                                }}
                                onClick={() => {
                                  if (
                                    resumeUploadLoading ||
                                    (setupStatus?.has_binary_resume &&
                                      !forceShowUploader)
                                  )
                                    return;
                                  inlineFileInputRef.current?.click();
                                }}
                                className={`group flex min-h-[350px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-20 transition-all duration-200 ${
                                  setupStatus?.has_binary_resume &&
                                  !forceShowUploader
                                    ? "cursor-default border-emerald-500/80 bg-emerald-50/10 dark:bg-emerald-900/5"
                                    : resumeDragOver
                                    ? "cursor-pointer border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                                    : "cursor-pointer border-gray-300 hover:border-blue-500 hover:bg-gray-50/50 dark:border-gray-700 dark:hover:bg-gray-800/20"
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
                                  <div className="animate-in fade-in flex flex-col items-center text-center duration-150">
                                    <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-500" />
                                    <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                      Uploading resume...
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                      Please Wait ...
                                    </p>
                                  </div>
                                ) : setupStatus?.has_binary_resume &&
                                  !forceShowUploader ? (
                                  <div className="animate-in fade-in flex flex-col items-center text-center duration-200">
                                    <div className="relative mb-4">
                                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-950/30">
                                        <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[10px] font-bold text-white shadow-sm dark:border-gray-900">
                                        ✓
                                      </div>
                                    </div>

                                    <p className="mb-3 text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                      Selected file uploaded
                                    </p>

                                    <div className="dark:text-blue-450 mb-6 inline-flex max-w-xs items-center truncate rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:border-blue-800/60 dark:bg-blue-900/10">
                                      {setupStatus.binary_resume_filename ||
                                        "Uploaded Resume"}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSetupStatus((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                has_binary_resume: false,
                                              }
                                            : null,
                                        );
                                        setShowTemplates(false);
                                        setResumeFile(null);
                                        setTimeout(
                                          () =>
                                            inlineFileInputRef.current?.click(),
                                          50,
                                        );
                                      }}
                                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-2.5 text-xs font-bold text-gray-500 shadow-sm transition-colors hover:border-blue-500 hover:bg-gray-50/50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-blue-400"
                                    >
                                      <Upload
                                        size={14}
                                        className="text-gray-405"
                                      />
                                      Upload another file
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSetupStatus((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                has_binary_resume: false,
                                              }
                                            : null,
                                        );
                                        setShowTemplates(false);
                                        setResumeFile(null);
                                      }}
                                      className="hover:dark:text-gray-455 mt-4 cursor-pointer text-xs font-semibold text-gray-400 underline hover:text-gray-500 dark:text-gray-500"
                                    >
                                      Start over or upload a different file
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center text-center">
                                    <div className="mb-4 rounded-2xl bg-blue-50/40 p-4 text-blue-500 transition-transform group-hover:scale-110 dark:bg-blue-950/20">
                                      <Upload className="h-8 w-8" />
                                    </div>
                                    <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                      Upload pdf, doc, docx
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                      Click to browse your computer
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Bottom Navigation Buttons */}
                          <div className="border-gray-150 mt-6 flex items-center justify-end border-t pt-4 dark:border-gray-800/80">
                            <button
                              type="button"
                              onClick={() => setShowTemplates(true)}
                              disabled={
                                !setupStatus?.has_binary_resume ||
                                resumeUploadLoading
                              }
                              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/10 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:from-blue-400 disabled:to-indigo-400"
                            >
                              <span>Next</span>
                              <span>&gt;</span>
                            </button>
                          </div>
                        </div>
                      ) : isEditingJson ? (
                        <div className="animate-in fade-in space-y-6 duration-200">
                          {/* Editor Header */}
                          <div className="border-gray-150 flex items-center justify-between border-b pb-4 dark:border-gray-800">
                            <div>
                              <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-gray-900 dark:text-white">
                                Edit Resume JSON
                              </h2>
                              <p className="mt-1 text-xs text-gray-400">
                                Edit your structured resume fields directly.
                                Changes will update the template rendering in
                                real-time.
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setIsEditingJson(false)}
                                disabled={editJsonSaving}
                                className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50/50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEditedJson}
                                disabled={editJsonSaving}
                                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:bg-blue-400"
                              >
                                {editJsonSaving ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <span>Save Changes</span>
                                )}
                              </button>
                            </div>
                          </div>

                          {editJsonError && (
                            <div className="text-red-650 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                              <span>⚠️</span>
                              <span>{editJsonError}</span>
                            </div>
                          )}

                          <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-inner dark:border-gray-800">
                            <textarea
                              value={editJsonText}
                              onChange={(e) => {
                                setEditJsonText(e.target.value);
                                setEditJsonError(null);
                              }}
                              disabled={editJsonSaving}
                              className="min-h-[500px] w-full resize-y bg-white p-6 font-mono text-xs leading-relaxed text-sky-600 focus:outline-none dark:bg-white dark:text-sky-600"
                              placeholder="{}"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-gray-900 dark:text-white">
                                My Resume
                              </h2>
                              <p className="mt-1 text-xs text-gray-400">
                                Choose your template and Download the resume
                              </p>
                            </div>
                            {prefetchedSession?.summaryData?.resume_json && (
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={handleValidateJson}
                                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-900 to-purple-400 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:opacity-90 active:opacity-85"
                                >
                                  <ClipboardCheck size={14} />
                                  <span>Validate JSON</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Control bar */}
                          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800/80 dark:bg-gray-800/40">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Template Layout:
                              </span>
                              <select
                                value={selectedTemplate}
                                onChange={(e) =>
                                  setSelectedTemplate(e.target.value)
                                }
                                className="text-gray-850 dark:text-gray-250 cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
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
                                  {
                                    id: "stackoverflow",
                                    name: "Stackoverflow",
                                  },
                                  {
                                    id: "stackoverflowed",
                                    name: "Stackoverflowed",
                                  },
                                  {
                                    id: "straightforward",
                                    name: "Straightforward",
                                  },
                                  { id: "waterfall", name: "Waterfall" },
                                  { id: "raw", name: "Raw JSON" },
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
                                      setEditJsonText(
                                        JSON.stringify(
                                          prefetchedSession?.summaryData
                                            ?.resume_json || {},
                                          null,
                                          2,
                                        ),
                                      );
                                      setEditJsonError(null);
                                      setIsEditingJson(true);
                                    }}
                                    className="text-gray-755 dark:text-gray-305 hover:bg-gray-105 dark:hover:bg-gray-805 flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold shadow-sm transition-colors dark:border-gray-700"
                                  >
                                    <Edit3
                                      size={15}
                                      className="text-blue-500"
                                    />
                                    <span>Edit JSON</span>
                                  </button>

                                  {selectedTemplate === "raw" ? (
                                    <button
                                      type="button"
                                      onClick={handleDownloadJson}
                                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/10 transition-colors hover:bg-blue-700 hover:shadow-blue-500/20 active:bg-blue-800"
                                    >
                                      <Download size={15} />
                                      <span>Download JSON</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={handleInlineDownload}
                                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/10 transition-colors hover:bg-blue-700 hover:shadow-blue-500/20 active:bg-blue-800"
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
                            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-gray-900/10 dark:text-gray-500">
                              No structured resume data found.
                            </div>
                          ) : selectedTemplate === "raw" ? (
                            <div className="space-y-4">
                              <pre className="dark:border-gray-850 dark:text-gray-250 max-h-[70vh] w-full overflow-auto whitespace-pre-wrap rounded-2xl border border-gray-100 bg-gray-50/80 p-5 font-mono text-xs text-gray-700 dark:bg-darklight">
                                {JSON.stringify(
                                  prefetchedSession.summaryData.resume_json,
                                  null,
                                  2,
                                )}
                              </pre>
                            </div>
                          ) : (
                            <div className="max-h-[80vh] overflow-hidden overflow-y-auto rounded-3xl border border-gray-200 bg-white p-4 shadow-inner dark:border-gray-800/80 md:p-6">
                              <div
                                ref={inlineResumeRef}
                                className="w-full origin-top scale-[0.95] transform"
                              >
                                <ResumeRenderer
                                  data={(() => {
                                    try {
                                      return normalizeResume(
                                        prefetchedSession.summaryData
                                          .resume_json,
                                      );
                                    } catch (e) {
                                      return null;
                                    }
                                  })()}
                                  templateId={selectedTemplate}
                                />
                              </div>
                            </div>
                          )}

                          {/* Bottom Navigation */}
                          <div className="border-gray-150 mt-6 flex items-center justify-start border-t pt-4 dark:border-gray-800/80">
                            <button
                              type="button"
                              onClick={() => setShowTemplates(false)}
                              className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-6 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <span>&lt;</span>
                              <span>Back</span>
                            </button>
                          </div>
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
            resume_json: prefetchedSession?.summaryData?.resume_json || {},
          }}
          title="View Resume"
          onReupload={() => {
            setViewResumeOpen(false);
            setSetupStatus((prev) =>
              prev ? { ...prev, has_binary_resume: false } : null,
            );
            setShowTemplates(false);
            setResumeFile(null);
            setForceShowUploader(true);
            setActiveTab("my-resume");
          }}
        />
      )}

      {uploadResumeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Upload Resume
              </h3>
              <button
                onClick={() => setUploadResumeOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="w-full space-y-5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setResumeDragOver(true);
                }}
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
                className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-200 ${
                  resumeDragOver
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                    : resumeFile
                    ? "border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-900/5"
                    : "border-gray-300 hover:border-blue-500 hover:bg-gray-50/50 dark:border-gray-700 dark:hover:bg-gray-800/20"
                }`}
              >
                <input
                  type="file"
                  ref={inlineFileInputRef}
                  onChange={handleInlineFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === "overview" &&
        easyApplyPopupOpen &&
        data &&
        (() => {
          const easyApplyCount = data.candidate_stats?.easy_apply_counter ?? 0;
          const isEasyApplyLow = easyApplyCount < 30;
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
              onClick={() => setEasyApplyPopupOpen(false)}
            >
              <div
                className={`animate-in fade-in zoom-in-95 relative w-full max-w-sm overflow-hidden rounded-2xl border p-6 shadow-2xl duration-200 ${
                  isEasyApplyLow
                    ? "border-red-100 bg-gradient-to-br from-red-50 to-rose-50/50 dark:border-red-900/30 dark:from-red-950/10 dark:to-rose-950/10"
                    : "border-emerald-100/50 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:border-gray-700/50 dark:from-gray-800/40 dark:to-gray-900/40"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setEasyApplyPopupOpen(false)}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-gray-500 transition-colors hover:bg-gray-200/50 dark:text-gray-400 dark:hover:bg-gray-700/50"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-5">
                  <Zap
                    className={`h-24 w-24 ${
                      isEasyApplyLow ? "text-red-500" : "text-emerald-500"
                    }`}
                  />
                </div>
                <div className="mb-4 flex items-center justify-between pr-8">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isEasyApplyLow
                        ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    }`}
                  >
                    <Zap className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      isEasyApplyLow
                        ? "bg-red-500/10 text-red-500"
                        : "bg-emerald-500/10 text-emerald-500"
                    }`}
                  >
                    Easy Apply
                  </span>
                </div>
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Easy Applies
                </h3>
                <p
                  className={`text-3xl font-extrabold ${
                    isEasyApplyLow
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {easyApplyCount}
                </p>
                <p className="mt-2 text-[10px] text-gray-400">
                  Auto-filled forms and quick-applied positions
                </p>
                <p
                  className={`mt-1 text-[10px] font-semibold ${
                    isEasyApplyLow ? "text-red-500" : "text-emerald-500"
                  }`}
                >
                  {isEasyApplyLow
                    ? `⚠ You need ${
                        30 - easyApplyCount
                      } applications to reach the daily objective`
                    : "✓ Target reached"}
                </p>
              </div>
            </div>
          );
        })()}

      {isResumeJsonModalOpen && (
        <Dialog
          open={isResumeJsonModalOpen}
          onOpenChange={setIsResumeJsonModalOpen}
        >
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
            <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 flex h-[90vh] w-full max-w-[min(60rem,95vw)] translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl duration-200 dark:border-gray-700 dark:bg-gray-900">
              <DialogPrimitive.Close className="data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-3 top-3 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="hover:text-gray-750 h-4 w-4 text-gray-500 dark:text-gray-400 dark:hover:text-gray-200" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
              {/* ── Header ── */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 pb-4 pl-6 pr-12 pt-5 dark:border-gray-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <FileJson className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Resume JSON
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    View, edit, and copy your resume JSON for use with the
                    Autofill Extension.
                  </div>
                </div>
                <div className="flex w-full items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex h-8 items-center gap-1.5 rounded-lg text-xs font-semibold"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload JSON
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                  />
                </div>
              </div>

              {/* ── Body — grows to fill remaining height ── */}
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 py-5">
                {resumeJsonError && (
                  <div className="shrink-0 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                    {resumeJsonError}
                  </div>
                )}

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-blue-100 bg-blue-50/20 shadow-sm dark:border-blue-900 dark:bg-gray-950/40">
                  {resumeJsonText ? (
                    <textarea
                      value={resumeJsonText}
                      onChange={(e) => setResumeJsonText(e.target.value)}
                      className="h-full w-full flex-1 resize-none overflow-y-auto border-0 bg-transparent p-4 font-mono text-xs leading-6 text-gray-700 outline-none focus:ring-0 dark:text-gray-200"
                      spellCheck={false}
                    />
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center p-12 text-gray-400">
                      <FileJson className="mb-3 h-14 w-14 text-gray-300 dark:text-gray-600" />
                      <p className="text-base font-semibold text-gray-500">
                        Resume JSON is not available yet.
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Upload a JSON file or use the Setup Wizard to generate
                        one.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-950/20">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-lg px-4 text-sm font-semibold"
                  onClick={() => setIsResumeJsonModalOpen(false)}
                >
                  Close
                </Button>

                <div className="flex w-full items-center justify-center gap-2">
                  {resumeJsonText && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(resumeJsonText)
                          .then(() =>
                            toast.success("Resume JSON copied successfully."),
                          )
                          .catch(() =>
                            toast.error("Failed to copy JSON to clipboard."),
                          );
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Copy JSON
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="h-9 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
                    disabled={isSavingResumeJson}
                    onClick={handleSaveResumeJson}
                  >
                    {isSavingResumeJson ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </Dialog>
      )}
    </div>
  );
}
const PhaseCard = ({
  title,
  icon,
  color,
  completed,
  active,
  daysSince,
  durationDays,
  batchName,
  rating,
  company,
  date,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  completed?: boolean;
  active?: boolean;
  daysSince?: number;
  durationDays?: number;
  batchName?: string;
  rating?: string;
  company?: string;
  date?: string;
}) => {
  // Highly simplified color mapping - just for the icon/line color
  const accentColor = active
    ? "text-blue-600 dark:text-blue-400"
    : "text-gray-400 dark:text-gray-500";
  const borderColor = active
    ? "border-blue-200 dark:border-blue-800"
    : "border-gray-100 dark:border-gray-800";

  return (
    <div
      className={`border bg-white dark:bg-gray-800 ${borderColor} rounded-xl p-3 shadow-sm transition-all duration-200`}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`${accentColor}`}>{icon}</div>
        <h3 className="text-xs font-extrabold uppercase leading-tight tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex h-5 items-center">
          {active ? (
            <span className="inline-flex animate-pulse items-center rounded-lg bg-blue-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm shadow-blue-500/20">
              Active Now
            </span>
          ) : completed ? (
            <span className="inline-flex items-center rounded-lg border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
              Completed
            </span>
          ) : (
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300 dark:text-gray-600">
              Upcoming Step
            </span>
          )}
        </div>

        <div className="space-y-1.5 border-t border-gray-50 pt-2 dark:border-gray-700">
          {daysSince !== undefined && daysSince !== null && (
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {daysSince} days total
            </p>
          )}
          {durationDays !== undefined && durationDays !== null && (
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {durationDays} days duration
            </p>
          )}
          {date && (
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              <Calendar className="h-3 w-3" />
              {date}
            </p>
          )}
          {batchName && (
            <p className="flex items-center gap-1.5 truncate text-xs font-bold text-gray-600 dark:text-gray-400">
              <span className="text-blue-500"></span> {batchName}
            </p>
          )}
          {company && (
            <p className="mt-2 flex items-center gap-1.5 truncate rounded-xl bg-blue-50/50 p-2 text-xs font-extrabold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
              <span></span> {company}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
