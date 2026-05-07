"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { DollarSign, Eye, FileText, Trash2, UploadCloud, CheckCircle, Camera } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { getDocuments, uploadDocument } from "@/lib/documentService";
import { motion, AnimatePresence } from "framer-motion";
import {
  OnboardingStatus,
  getOnboardingStatus,
  markIdUploaded,
  persistOnboardingState,
} from "@/lib/onboarding";
import OnboardingBasicInfoModal from "@/components/OnboardingBasicInfoModal";
import PlacementAgreementFlowModal from "@/components/PlacementAgreementFlowModal";
import EnrollmentAgreementFlowModal from "@/components/EnrollmentAgreementFlowModal";

type DocumentItem = {
  uid: string;
  filename: string;
  status: string;
  uploaded_at: string;
  drive_file_id: string;
};

type DocumentsResponse = {
  identity: DocumentItem | null;
  address: DocumentItem | null;
  work_auth: DocumentItem | null;
  recent_activity: DocumentItem[];
  verification?: {
    profile: string;
    documents: string;
  };
};

const emptyDocuments: DocumentsResponse = {
  identity: null,
  address: null,
  work_auth: null,
  recent_activity: [],
};

type PendingUpload = {
  file: File;
  documentType: string;
};

export default function DocumentsTab() {
  const [uid, setUid] = useState<string>("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [signature, setSignature] = useState("");

  const [documents, setDocuments] = useState<DocumentsResponse>(emptyDocuments);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false);

  // ── Toast notification state ──
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  // Helper function to extract email from JWT token
  const getEmailFromToken = () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return null;
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return decoded.sub; // sub contains the username/email
    } catch (e) {
      return null;
    }
  };
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [submissionUid, setSubmissionUid] = useState(() => `UID_${Date.now()}`);
  // const uid = submissionUid;
const generateUID = () => {
  return "UID_" + Date.now();
};

  const sigRef = useRef<any>(null);

  const fetchDocuments = async () => {
    try {
      const tokenEmail = getEmailFromToken();
      const currentEmail = tokenEmail || email || localStorage.getItem("userEmail");
      if (!currentEmail) {
        console.warn("No user email found for fetching documents");
        return;
      }

      console.log(`[DEBUG] Fetching documents for: ${currentEmail}`);
      const docs = await getDocuments(currentEmail);
      console.log("[DEBUG] API Response:", docs);
      if (docs) {
        setDocuments(docs);
      }
    } catch (err) {
      console.error("Error refreshing documents:", err);
    }
  };

  useEffect(() => {
    const tokenEmail = getEmailFromToken();
    const storedEmail = tokenEmail || localStorage.getItem("userEmail");
    const storedUname = localStorage.getItem("username");
    
    if (storedEmail) setEmail(storedEmail);
    if (storedUname) setUsername(storedUname);

  fetchDocuments();

  const interval = setInterval(fetchDocuments, 5000);
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    const tokenEmail = getEmailFromToken();
    const currentEmail = tokenEmail || email || localStorage.getItem("userEmail");
    if (!currentEmail) return;
    getOnboardingStatus(currentEmail)
      .then((state) => {
        setOnboarding(state);
        persistOnboardingState(state);
        if (state.next_step === "basic_info") {
          setShowBasicInfoModal(true);
        }
        if (state.access_restricted && state.next_step === "agreements") {
          setShowEnrollmentModal(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load onboarding status:", err);
      });
  }, [email]);

  const handleUpload = (file: File, documentType: string) => {
    setPendingUploads((prev) => {
      const filtered = prev.filter((item) => item.documentType !== documentType);
      return [...filtered, { file, documentType }];
    });
  };

 const submitPendingUploads = async () => {
  if (isUploading) return;

  const tokenEmail = getEmailFromToken();
  const email = tokenEmail || localStorage.getItem("userEmail");

  if (!email) {
    showToast("User info missing. Please login again.", "error");
    return;
  }

  if (pendingUploads.length === 0) {
    showToast("Please select at least one file to upload.", "info");
    return;
  }

  setIsUploading(true);
  try {
    for (const item of pendingUploads) {
      const formData = new FormData();

      formData.append("uid", submissionUid);
      formData.append("file", item.file);
      formData.append("username", email);
      formData.append("email", email);
      formData.append("document_type", item.documentType);

      await uploadDocument(formData);
    }

    setPendingUploads([]);
    await fetchDocuments();
    const stateResponse = await markIdUploaded(email);
    setOnboarding(stateResponse.onboarding);

    console.log("UPLOAD UID:", submissionUid);
    showToast("Documents uploaded successfully!", "success");
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    showToast("Upload failed. Please try again.", "error");
  } finally {
    // Always reset — whether success or failure
    setIsUploading(false);
  }
};
  const viewStatus = async (uid?: string) => {
    if (!uid) return;

    const res = await fetch(`/api/approval/status?uid=${uid}`);
    const data = await res.json();
    alert(`Status: ${data.status}`);
  };

  const getCombinedStatus = (docs: DocumentsResponse) => {
    const { identity, address, work_auth } = docs;
    const items = [identity, address, work_auth];

    if (items.some(d => d?.status?.toUpperCase() === "APPROVED")) return "APPROVED";
    if (items.some(d => d?.status?.toUpperCase() === "DECLINED")) return "DECLINED";
    if (items.some(d => d?.status?.toUpperCase() === "REJECTED")) return "DECLINED";
    
    // Check if all 3 are uploaded
    if (identity && address && work_auth) return "UPLOADED";
    
    // Fallback for partial
    if (identity || address || work_auth) return "PARTIALLY UPLOADED";

    return "NOT UPLOADED";
  };

  const getStatusLabel = (doc: DocumentItem | null) => {
    if (!doc) return "NOT UPLOADED";
    return doc.status?.toUpperCase() || "PENDING";
  };

const [showSuccess, setShowSuccess] = useState(false);
const [idProof, setIdProof] = useState<File | null>(null);
const [addressProof, setAddressProof] = useState<File | null>(null);
const [workProof, setWorkProof] = useState<File | null>(null);


const mapTypeToFrontendKey = (type: string) => {
  switch (type) {
    case "id_proof":
      return "identity";
    case "address_proof":
      return "address";
    case "work_proof":
      return "work_auth";
    default:
      return "";
  }
};

  const recentActivity = documents?.recent_activity || [];

  return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-purple-500">
            Compliance & Verification
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documents
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Please provide the necessary documentation to proceed with your application.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            {/* ── Re-verification info banner (blue, non-blocking) ── */}
          {onboarding?.is_reverification && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 shadow-sm dark:border-blue-800/50 dark:bg-blue-900/10 dark:text-blue-200">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-blue-100 p-1 dark:bg-blue-800/50">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">Documents Under Review</p>
                  <p className="mt-1 opacity-80">
                    Your updated documents have been submitted and are currently being reviewed by
                    our team. You have full dashboard access while we verify them.
                  </p>
                  <p className="mt-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                    ✓ No action required — we'll notify you once the review is complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Initial onboarding / rejection warning banner (amber, blocking) ── */}
          {onboarding?.access_restricted && !onboarding?.is_reverification && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-amber-100 p-1">
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">Onboarding Requirement</p>
                  <p className="mt-1 opacity-90">
                    Complete the current step to unlock full dashboard access.{" "}
                    {onboarding.next_step === "id_upload" && !onboarding.id_cancel_blocked && (
                      <span className="block mt-1 italic text-xs">You can skip this step {onboarding.id_cancel_limit - onboarding.id_cancel_count} more times.</span>
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (onboarding.next_step === "basic_info") setShowBasicInfoModal(true);
                        if (onboarding.next_step === "agreements") setShowEnrollmentModal(true);
                        if (onboarding.next_step === "id_upload") {
                           // Scroll to upload section
                           document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-sm"
                    >
                      {onboarding.next_step === "id_upload" ? "Upload ID Documents" : `Start: ${onboarding.next_step.replace("_", " ")}`}
                    </button>
                    
                    {onboarding.next_step === "id_upload" && !onboarding.id_cancel_blocked && (
                      <button
                        onClick={async () => {
                          if (!email) return;
                          try {
                            sessionStorage.setItem("skipped_id_upload", "true");
                            const { recordIdCancel } = await import("@/lib/onboarding");
                            const res = await recordIdCancel(email);
                            setOnboarding(res.onboarding);
                            localStorage.setItem("onboarding_status", JSON.stringify(res.onboarding));
                            alert("You can access the dashboard for now. Please complete the ID upload soon.");
                            // Refresh page to clear restriction if server allows
                            window.location.reload();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors shadow-sm"
                      >
                        Skip for now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Identity, Address and Work Proof
            </h3>

          </div>

          <p className="mb-4 text-sm text-gray-400">
            Upload a government ID, recent address proof and work proof.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { label: "ID Proof", type: "id_proof", icon: <Camera className="h-6 w-6 text-blue-500" /> },
              { label: "Address Proof", type: "address_proof", icon: <FileText className="h-6 w-6 text-purple-500" /> },
              { label: "Work Proof", type: "work_proof", icon: <UploadCloud className="h-6 w-6 text-green-500" /> },            
            ].map((item, i) => {
              const selected = pendingUploads.find(p => p.documentType === item.type);
              
              // Backend mapping
              const backendMap: Record<string, DocumentItem | null> = {
                "id_proof": documents.identity,
                "address_proof": documents.address,
                "work_proof": documents.work_auth
              };
              const serverDoc = backendMap[item.type];
              const serverStatus = getStatusLabel(serverDoc);
              
              return (
                <motion.label
                  key={i}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all duration-300 ${
                    selected 
                      ? "border-green-400 bg-green-50/50 dark:border-green-500/50 dark:bg-green-500/5" 
                      : serverDoc 
                      ? "border-blue-200 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-900/10"
                      : "border-gray-200 hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-500"
                  }`}
                >
                  {/* PENDING INDICATOR */}
                  {selected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-2 -top-2 rounded-full bg-green-500 p-1 text-white shadow-lg z-10"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </motion.div>
                  )}

                  {/* SERVER STATUS BADGE */}


                  <div className={`mb-3 rounded-full p-3 ${
                    selected ? "bg-green-100 dark:bg-green-500/20" : 
                    serverDoc ? "bg-blue-100 dark:bg-blue-500/20" :
                    "bg-gray-100 dark:bg-gray-800"
                  }`}>
                    {selected ? <CheckCircle className="h-6 w-6 text-green-600" /> : 
                     (serverStatus === "APPROVED" ? <CheckCircle className="h-6 w-6 text-green-600" /> : item.icon)}
                  </div>

                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    {item.label}
                  </p>
                  
                  {(selected || serverDoc) ? (
                    <div className="mt-2 text-center h-4">
                      {/* File name and status removed per user request */}
                    </div>
                  ) : (
                    <span className="mt-1 text-[10px] text-gray-400">PDF, JPG up to 10MB</span>
                  )}

                  <input
                    id={`uploadInput-${item.type}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg"];
                        const allowedExtensions = [".pdf", ".jpg", ".jpeg"];
                        const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

                        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
                          alert("Invalid file type. Please upload only PDF or JPG/JPEG files.");
                          e.target.value = ""; // Clear the input
                          return;
                        }
                        handleUpload(file, item.type);
                      }
                    }}
                  />
                </motion.label>
              );
            })}
          </div>

          {/* Upload button — only show when there are pending new files to submit,
              OR when no docs have been uploaded to the server yet */}
          {(() => {
            const allServerDocsPresent = !!(documents.identity && documents.address && documents.work_auth);
            const combinedStatus = getCombinedStatus(documents);
            const isApproved = combinedStatus === "APPROVED";
            const isUploaded = combinedStatus === "UPLOADED";

            // If docs are on the server and no new files are staged, show status instead of button
            if (allServerDocsPresent && pendingUploads.length === 0) {
              return (
                <div className={`mt-6 flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold ${
                  isApproved
                    ? "bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-800/50 dark:text-green-400"
                    : "bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/10 dark:border-blue-800/50 dark:text-blue-400"
                }`}>
                  <CheckCircle className={`h-5 w-5 flex-shrink-0 ${isApproved ? "text-green-500" : "text-blue-500"}`} />
                  {isApproved
                    ? "Documents verified — no further action needed."
                    : "Documents submitted and under review. Select new files above only if you need to re-upload."}
                </div>
              );
            }

            // Otherwise show the upload button
            return (
              <motion.button
                whileHover={!isUploading ? { scale: 1.02 } : {}}
                whileTap={!isUploading ? { scale: 0.98 } : {}}
                onClick={submitPendingUploads}
                disabled={pendingUploads.length !== 3 || isUploading}
                className={`mt-6 w-full rounded-2xl py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 md:w-auto md:px-10 flex items-center justify-center gap-2 ${
                  pendingUploads.length === 3 && !isUploading
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/40"
                    : "cursor-not-allowed bg-gray-400 opacity-50 shadow-none"
                }`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </>
                ) : pendingUploads.length === 3 ? (
                  "Upload All 3 Documents"
                ) : (
                  `Select All 3 Documents (${pendingUploads.length}/3)`
                )}
              </motion.button>
            );
          })()}

        </div>




      </div>

      <div className="space-y-6 lg:col-span-4">
        <div className="space-y-4">
          <button
            onClick={() => setShowEnrollmentModal(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-700 bg-[#111827] px-5 py-4 font-medium text-white shadow-sm transition hover:bg-gray-800"
          >
            <FileText className="h-5 w-5 text-indigo-600" />
            Enrollment Terms & Conditions
          </button>

          <button
            onClick={() => setShowTerms(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-700 bg-[#111827] px-5 py-4 font-medium text-white shadow-sm transition hover:bg-gray-800"
          >
            <DollarSign className="h-5 w-5 text-indigo-600" />
            Placement Payment Terms
          </button>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 p-5 text-white shadow-lg shadow-purple-500/20">
          <h3 className="mb-3 font-bold flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Verification Status
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
              <span>Personal Profile</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                documents.verification?.profile === "Verified" ? "bg-green-400 text-green-950" : "bg-yellow-400 text-yellow-950"
              }`}>
                {documents.verification?.profile || "Pending"}
              </span>
            </div>
            <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
              <span>Documents</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                documents.verification?.documents === "Verified" ? "bg-green-400 text-green-950" : 
                documents.verification?.documents === "Rejected" ? "bg-red-400 text-red-950" :
                "bg-yellow-400 text-yellow-950"
              }`}>
                {documents.verification?.documents || "Pending"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 font-bold text-gray-900 dark:text-white">
            Upload Guidelines
          </h3>
          <ul className="mb-4 space-y-2 text-sm text-gray-400">
            <li>All corners must be visible</li>
            <li>Name must match ID</li>
            <li>No password-protected PDFs</li>
          </ul>
        </div>
      </div>

<OnboardingBasicInfoModal
  isOpen={showBasicInfoModal}
  isForceful={onboarding?.access_restricted && onboarding?.next_step === "basic_info"}
  email={email}
  username={username}
  onClose={() => setShowBasicInfoModal(false)}
  onSubmitted={(nextOnboarding) => setOnboarding(nextOnboarding)}
/>

<PlacementAgreementFlowModal
  isOpen={showTerms}
  isForceful={onboarding?.access_restricted && onboarding?.next_step === "agreements"}
  email={email}
  submissionUid={submissionUid}
  onClose={() => setShowTerms(false)}
  onOnboardingChange={(nextOnboarding) => setOnboarding(nextOnboarding)}
  onSubmissionUidChange={(nextUid) => setSubmissionUid(nextUid)}
  onRefreshDocuments={fetchDocuments}
/>

<EnrollmentAgreementFlowModal
  isOpen={showEnrollmentModal}
  isForceful={onboarding?.access_restricted && onboarding?.next_step === "agreements"}
  email={email}
  submissionUid={submissionUid}
  onClose={() => setShowEnrollmentModal(false)}
  onOnboardingChange={(nextOnboarding) => setOnboarding(nextOnboarding)}
  onSubmissionUidChange={(nextUid) => setSubmissionUid(nextUid)}
  onRefreshDocuments={fetchDocuments}
/>

{showSuccess && (
  <motion.div
    className="fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="bg-white rounded-2xl p-10 text-center shadow-xl"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <div className="text-4xl mb-4">✅</div>
      <h2 className="text-xl font-bold mb-2">Submission Successful</h2>
      <p className="text-gray-500 text-sm">
        Your documents have been sent for approval.
      </p>

      <button
        onClick={() => setShowSuccess(false)}
        className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg"
      >
        Close
      </button>
    </motion.div>
  </motion.div>
)}

{/* ── Toast Notification (Relocated & Improved Centering) ── */}
<div className="fixed top-5 inset-x-0 z-[100000] flex justify-center pointer-events-none">
  <AnimatePresence>
    {toast && (
      <motion.div
        key="toast"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-semibold min-w-[280px] max-w-[90vw] md:max-w-[420px] ${
          toast.type === "success"
            ? "bg-white border border-green-200 text-gray-800"
            : toast.type === "error"
            ? "bg-white border border-red-200 text-gray-800"
            : "bg-white border border-blue-200 text-gray-800"
        }`}
      >
        <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
          toast.type === "success" ? "bg-green-100" :
          toast.type === "error" ? "bg-red-100" : "bg-blue-100"
        }`}>
          {toast.type === "success" && (
            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.type === "info" && (
            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
            </svg>
          )}
        </span>
        <span>{toast.message}</span>
        <button
          onClick={() => setToast(null)}
          className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    )}
  </AnimatePresence>
</div>

</div>
    );
    }   
