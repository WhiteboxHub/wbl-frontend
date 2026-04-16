"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { DollarSign, Eye, FileText, Trash2, UploadCloud, CheckCircle, Camera } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { getDocuments, uploadDocument } from "@/lib/documentService";
import { motion, AnimatePresence } from "framer-motion";

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
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [showTerms, setShowTerms] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showPlacementSignatureModal, setShowPlacementSignatureModal] = useState(false);
  const [showEnrollmentSignatureModal, setShowEnrollmentSignatureModal] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [enrollmentSignatureFile, setEnrollmentSignatureFile] = useState<File | null>(null);
  const [placementSignatureFile, setPlacementSignatureFile] = useState<File | null>(null);
  const [submissionUid, setSubmissionUid] = useState(() => `UID_${Date.now()}`);
  // const uid = submissionUid;
const generateUID = () => {
  return "UID_" + Date.now();
};
  const [checks, setChecks] = useState({
    id: false,
    address: false,
    work: false,
    agree: false,
  });

  const sigRef = useRef<any>(null);

  const fetchDocuments = async () => {
    try {
      const currentEmail = email || localStorage.getItem("userEmail");
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
    const storedEmail = localStorage.getItem("userEmail");
    const storedUname = localStorage.getItem("username");
    
    if (storedEmail) setEmail(storedEmail);
    if (storedUname) setUsername(storedUname);

  fetchDocuments();

  const interval = setInterval(fetchDocuments, 5000);
  return () => clearInterval(interval);
}, []);

  const handleUpload = (file: File, documentType: string) => {
    setPendingUploads((prev) => {
      const filtered = prev.filter((item) => item.documentType !== documentType);
      return [...filtered, { file, documentType }];
    });
  };

 const submitPendingUploads = async () => {
  const email = localStorage.getItem("userEmail");
  const username = localStorage.getItem("username");

  if (!email || !username) {
    alert("User info missing. Please login again.");
    return;
  }

  if (pendingUploads.length === 0) {
    alert("Please select at least one file to upload.");
    return;
  }

  try {
    for (const item of pendingUploads) {
      const formData = new FormData();

      formData.append("uid", submissionUid);
      formData.append("file", item.file);
      formData.append("username", username);
      formData.append("email", email);
      formData.append("document_type", item.documentType);

      await uploadDocument(formData); // ✅ correct
    }

    setPendingUploads([]);
    await fetchDocuments();

    console.log("UPLOAD UID:", submissionUid);
    alert("Documents uploaded successfully.");
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    alert("Upload failed");
  }
};
const handleSubmit = async () => {
  try {
    const uid = "UID_" + Date.now();

    console.log("EMAIL:", email);
    console.log("USERNAME:", username);
    console.log("SIGNATURE LENGTH:", signature?.length);
    console.log("UID:", uid);

    // ✅ validation
    if (!email || !username) {
      alert("Missing user info");
      return;
    }

    if (!signature || signature.length < 50) {
      alert("Please draw signature first");
      return;
    }

  const res = await axios.post(
    "http://127.0.0.1:8000/api/approval/upload",
    FormData
  );

    console.log("SUCCESS:", res.data);
     setUid(res.data.uid);
  } catch (err: any) {
    console.error("FULL ERROR:", err.response?.data);
  }


  console.log("SENDING:");
  console.log("email:", email);
  console.log("username:", username);
  console.log("uid:", submissionUid);
  console.log("signature:", signatureData?.slice(0, 20));
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
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUpload(file, item.type);
                      }
                    }}
                  />
                </motion.label>
              );
            })}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={submitPendingUploads}
            disabled={pendingUploads.length !== 3}
            className={`mt-6 w-full rounded-2xl py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 md:w-auto md:px-10 ${
              pendingUploads.length === 3
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/40"
                : "cursor-not-allowed bg-gray-400 opacity-50 shadow-none"
            }`}
          >
            {pendingUploads.length === 3 
              ? "Upload All 3 Documents"
              : `Select All 3 Documents (${pendingUploads.length}/3)`}
          </motion.button>
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

<AnimatePresence>
  {showTerms && (
    <motion.div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#f8fafc] w-[720px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl"
        initial={{ scale: 0.9, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 40, opacity: 0 }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
        }}
      >
        {/* HEADER */}
        <div className="p-6 border-b">
          <p className="text-xs tracking-widest text-indigo-600 font-semibold">
            LEGAL & COMPLIANCE
          </p>

          <div className="flex justify-between items-center mt-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Placement Payment Terms
            </h2>

            <button
              onClick={() => setShowTerms(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-600 hover:text-black"
            >
              ×
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 text-gray-700">
          {/* OVERVIEW */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Payment Guidelines and Placement Terms
            </h3>
            <p className="text-sm leading-relaxed">
              This document outlines the payment structure, placement fees, and re support terms for candidates 
              enrolled with our training and placement services, with a focus on IT roles including AI and ML positions.
            </p>
          </div>

          {/* SECTION 1 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              1. Post Placement Fees
            </h3>
            <p className="text-sm leading-relaxed">
              After successful placement, a placement fee of <strong>13%</strong> from your offered annual salary will be applicable.
            </p>
          </div>

          {/* SECTION 2 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              2. Payment Method and Installments
            </h3>
            <div className="text-sm space-y-2 leading-relaxed">
              <p>The post placement fee may be paid in three installments using <strong>postpaid checks</strong>.</p>
              <p>All checks must be handed over before background check clearance and before onboarding date.</p>
              <p>The first check will be deposited before the candidate's job start date.</p>
              <p>All remaining checks will be deposited within two months from the candidate's start date.</p>
            </div>

            {/* ILLUSTRATION BOX */}
            <div className="bg-indigo-50 p-4 rounded-xl mt-4">
              <p className="font-semibold text-indigo-900 mb-2 text-xs uppercase tracking-wider">
                💡 Illustration Example
              </p>
              <p className="text-sm mb-3">
                If offer received of <strong>USD 150,000</strong>, then 13% ($19,500) is split into three installments:
              </p>
              <div className="space-y-1 text-sm border-t border-indigo-100 pt-2">
                <div className="flex justify-between">
                  <span>First Installment</span>
                  <span className="font-bold">$6,500</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">Payable after BGV and before Onboarding date.</p>
                <div className="flex justify-between">
                  <span>Second Installment</span>
                  <span className="font-bold">$6,500</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">Payable after receiving your first paycheck.</p>
                <div className="flex justify-between">
                  <span>Third Installment</span>
                  <span className="font-bold">$6,500</span>
                </div>
                <p className="text-[11px] text-gray-500">Payable after receiving your second paycheck.</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
               <p className="text-sm font-semibold text-gray-900">Payment Details:</p>
               <p className="text-sm mt-1">Post-dated checks should be provided at Dublin Office before onboarding.</p>
               <p className="text-sm mt-1 uppercase font-bold text-indigo-600">Company Name: Innovapath Inc.</p>
            </div>
          </div>

          {/* SECTION 3 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              3. Support Period and Re Placement Policy
            </h3>
            <div className="text-sm space-y-2 leading-relaxed">
              <p>• Placement support is provided for one month from job start date.</p>
              <p>• If terminated or laid off within the first <strong>two months</strong>, re-placement support is provided at no additional cost.</p>
              <p>• After 2 months and up to 6 months: a fee of <strong>USD 2,500</strong> will apply.</p>
              <p>• After 6 months and up to 12 months: a fee of <strong>USD 5,000</strong> will apply.</p>
              <p>• After 12 months: treated as a <strong>new placement</strong> subject to standard fees.</p>
            </div>
          </div>

          {/* SECTION 4 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              4. General Terms
            </h3>
            <p className="text-sm leading-relaxed">
              All fees and payment obligations are binding once the candidate accepts a job offer through our placement services. 
              By enrolling in the program and accepting placement assistance, the candidate agrees to all terms outlined in this document.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-white rounded-b-2xl">
         <label className="flex items-start gap-2 text-sm mb-4 text-gray-800 leading-relaxed">
            <input
              type="checkbox"
              onChange={(e) =>
                setChecks({ ...checks, agree: e.target.checked })
              }
            />
            I have read and understood the Placement Payment Terms and agree to abide by them.
          </label>

          <div className="flex gap-4">
            <button
              disabled={!checks.agree}
              onClick={() => {
                setShowTerms(false);
                setShowPlacementSignatureModal(true);
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
            >
              Agree and Continue
            </button>

            <button className="px-6 py-3 bg-gray-200 rounded-xl text-gray-700">
              Download PDF
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<AnimatePresence>
  {showPlacementSignatureModal && (
    <motion.div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
      
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >

      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#f8fafc] w-[720px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl"

        initial={{ scale: 0.9, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 40, opacity: 0 }}

        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
      >

        {/* HEADER */}
        <div className="p-6 border-b">
          <p className="text-xs tracking-widest text-indigo-600 font-semibold">
            LEGAL & COMPLIANCE
          </p>

          <div className="flex justify-between items-center mt-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Placement Payment Terms
            </h2>

            <button
              onClick={() => setShowPlacementSignatureModal(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-600 hover:text-black"
            >
              ×
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 text-gray-800">

          {/* REPEAT SMALL SUMMARY */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Payment Guidelines and Placement Terms
            </h3>
            <p className="text-sm">
              By accepting these terms, you agree to the payment structure, placement fees (13% of annual salary), 
              and support policies outlined in the full agreement.
            </p>
          </div>

          {/* SIGNATURE SECTION */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs tracking-widest text-gray-500 font-semibold">
                UPLOAD SIGNATURE IMAGE
              </p>
              <button
                className="text-indigo-600 text-sm"
                onClick={() => setPlacementSignatureFile(null)}
              >
                ↻ Clear
              </button>
            </div>

            {/* UPLOAD BOX */}
            <motion.label
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
                placementSignatureFile 
                  ? "border-green-400 bg-green-50/50" 
                  : "border-gray-200 hover:border-blue-400 bg-gray-50"
              }`}
            >
              <div className={`mb-3 rounded-full p-4 ${
                placementSignatureFile ? "bg-green-100" : "bg-blue-100"
              }`}>
                {placementSignatureFile ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <UploadCloud className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <p className="text-sm font-bold text-gray-800">
                {placementSignatureFile ? placementSignatureFile.name : "Click to upload your signature"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG or JPEG (Max 5MB)
              </p>

              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPlacementSignatureFile(file);
                }}
              />
            </motion.label>

            <p className="text-xs text-gray-500 mt-3">
              By uploading your signature image above, you agree that this constitutes your binding signature.
            </p>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-white rounded-b-2xl">

          <div className="flex gap-4">

            <button
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium"
              onClick={async () => {
  if (!placementSignatureFile) {
    alert("Please upload your signature image first ✍️");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("uid", submissionUid);
    formData.append("username", localStorage.getItem("username") || username || "Guest");
    formData.append("email", localStorage.getItem("userEmail") || email || "unknown@example.com");
    formData.append("signature", placementSignatureFile);
    formData.append("document_type", "placement");

    const res = await fetch("http://127.0.0.1:8000/api/approval/submit-signature", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      setShowPlacementSignatureModal(false);
      setShowTerms(false);
      await fetchDocuments();
      
      // Regenerate UID for next submission attempt to avoid duplicates/conflicts
      setSubmissionUid(`UID_${Date.now()}`);
      
      alert("Enrollment Completed ✅");
    } else {
      alert(data.detail || "Something went wrong");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}}
            >
              Submit and Finish
            </button>

            <button className="px-6 py-3 bg-gray-200 rounded-xl text-gray-700">
              ⬇ Download PDF
            </button>

          </div>
        </div>

      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<AnimatePresence>
  {showEnrollmentModal && (
  <motion.div
  className="fixed inset-0 z-[9999] flex items-center justify-center"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {/* BACKDROP */}
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

  {/* MODAL */}
  <motion.div
    className="relative z-10 w-full max-w-2xl bg-white text-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
    initial={{ scale: 0.95, y: 20 }}
    animate={{ scale: 1, y: 0 }}
    exit={{ scale: 0.95, y: 20 }}
    transition={{ duration: 0.25 }}
  >
    {/* HEADER */}
    <div className="p-5 border-b">
      <h2 className="text-xl font-bold">
        Enrollment Terms and Conditions
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        Please review and accept the final enrollment agreement to complete your onboarding with Whitebox.
      </p>
    </div>

    {/* SCROLLABLE CONTENT */}
    <div className="p-5 overflow-y-auto flex-1 space-y-5 text-sm">
      
      {/* TERMS */}
      <div className="bg-blue-50/50 p-6 rounded-lg space-y-4 border border-blue-100">
        <div>
          <p className="font-bold text-gray-900 mb-1">1. Scope of Agreement</p>
          <p className="text-gray-600 leading-relaxed">This agreement outlines the terms of your engagement with the Whitebox platform, including placement services, career coaching, and technical assessment protocols. By proceeding, you acknowledge that Whitebox acts as an intermediary partner in your professional development.</p>
        </div>

        <div>
          <p className="font-bold text-gray-900 mb-1">2. Confidentiality & Data Privacy</p>
          <p className="text-gray-600 leading-relaxed">You agree to maintain the confidentiality of all proprietary testing materials and interview questions provided during the screening process. Whitebox will process your personal data in accordance with our Privacy Policy, ensuring end-to-end encryption for all sensitive career documentation.</p>
        </div>

        <div>
          <p className="font-bold text-gray-900 mb-1">3. Placement Terms</p>
          <p className="text-gray-600 leading-relaxed">Whitebox does not guarantee immediate placement but provides the infrastructure to maximize your visibility to top-tier hiring managers. All communications with partner employers must be documented within the Whitebox Portal to ensure quality control and compliance.</p>
        </div>

        <div>
          <p className="font-bold text-gray-900 mb-1">4. Code of Conduct</p>
          <p className="text-gray-600 leading-relaxed">Candidates are expected to maintain professional standards in all interactions. Misrepresentation of skills, experience, or identity will result in immediate termination of account access and removal from active candidate pools.</p>
        </div>
      </div>

      {/* DOCUMENT CHECKS */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <p className="font-medium text-gray-900">Required Document Confirmation</p>

        {[
          { key: "id", label: "ID Proof Uploaded" },
          { key: "address", label: "Address Proof Uploaded" },
          { key: "work", label: "Work Authorization Proof Uploaded" },
        ].map((item) => (
          <label key={item.key} className="flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              className="accent-blue-600"
              onChange={(e) =>
                setChecks({ ...checks, [item.key]: e.target.checked })
              }
            />
            {item.label}
          </label>
        ))}
      </div>

      {/* AGREEMENT */}
      <label className="flex items-start gap-2 text-gray-600">
        <input
          type="checkbox"
          className="mt-1 accent-blue-600"
          checked={accepted}
          onChange={() => setAccepted(!accepted)}
        />
        <span>
          I have read, understood, and agree to be bound by the <span className="text-blue-600 font-semibold cursor-pointer">Enrollment Terms and Conditions</span> and the Whitebox <span className="text-blue-600 font-semibold cursor-pointer">Privacy Policy</span>.
        </span>
      </label>
    </div>

    {/* FOOTER */}
    <div className="p-4 border-t flex justify-between items-center">
      <button
        onClick={() => setShowEnrollmentModal(false)}
        className="text-gray-500 hover:text-gray-700"
      >
        Cancel
      </button>

      <button
        disabled={!accepted || !checks.id || !checks.address || !checks.work}
        onClick={() => {
          setShowEnrollmentModal(false);
          setShowEnrollmentSignatureModal(true);
        }}
        className={`px-5 py-2 rounded-lg text-white ${
          accepted && checks.id && checks.address && checks.work
            ? "bg-gradient-to-r from-purple-600 to-indigo-600"
            : "bg-gray-300 cursor-not-allowed"
        }`}
      >
        Agree and Complete
      </button>
    </div>
  </motion.div>
</motion.div>
  )}
</AnimatePresence>


<AnimatePresence>
 {showEnrollmentSignatureModal && (
  <motion.div
    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowEnrollmentSignatureModal(false)}
  >
    {/* MODAL BOX */}
    <motion.div
      onClick={(e) => e.stopPropagation()}
      className="bg-[#f8fafc] w-[720px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-8"
      initial={{ scale: 0.9, y: 40, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.9, y: 40, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    >
      <p className="mb-2 text-xs tracking-widest text-gray-500">
        DIGITAL SIGNATURE
      </p>

      <h2 className="mb-4 text-2xl font-bold text-gray-900">
        Sign and Complete
      </h2>

      {/* SIGNATURE UPLOAD UI */}
      <div className="mt-4">
        <motion.label
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-300 ${
            enrollmentSignatureFile 
              ? "border-green-400 bg-green-50/50" 
              : "border-gray-200 hover:border-blue-400 bg-gray-50"
          }`}
        >
          <div className={`mb-3 rounded-full p-5 ${
            enrollmentSignatureFile ? "bg-green-100" : "bg-blue-100"
          }`}>
            {enrollmentSignatureFile ? (
              <CheckCircle className="h-10 w-10 text-green-600" />
            ) : (
              <UploadCloud className="h-10 w-10 text-blue-600" />
            )}
          </div>

          <p className="text-base font-bold text-gray-800 text-center">
            {enrollmentSignatureFile ? enrollmentSignatureFile.name : "Click to upload signature image"}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            PNG, JPG or JPEG format (Max 5MB)
          </p>

          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setEnrollmentSignatureFile(file);
            }}
          />
        </motion.label>

        <p className="mt-4 text-xs text-gray-500 text-center italic">
          "By uploading your signature image, you authorize its use for this enrollment agreement."
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => {
            setEnrollmentSignatureFile(null);
          }}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          Clear
        </button>

        <div className="flex gap-4">
        <button
            onClick={() => setShowEnrollmentSignatureModal(false)}
            className="rounded-xl bg-gray-200 px-6 py-3 text-gray-700"
          >
            Cancel
          </button>

          <button
           onClick={async () => {
  try {
    if (!enrollmentSignatureFile) {
      alert("Please upload signature image first ✍️");
      return;
    }

    const emailAddr = localStorage.getItem("userEmail") || "unknown@example.com";
    const userDisplayName = localStorage.getItem("username") || "Guest";

    const formData = new FormData();
    formData.append("uid", submissionUid);
    formData.append("email", emailAddr);
    formData.append("username", userDisplayName);
    formData.append("signature", enrollmentSignatureFile);
    formData.append("document_type", "enrollment");

    await axios.post(
      "http://127.0.0.1:8000/api/approval/submit-signature",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    setShowEnrollmentSignatureModal(false);
    setShowEnrollmentModal(false);
    await fetchDocuments();
    setSubmissionUid(`UID_${Date.now()}`);
    
    alert("Submitted Successfully ✅");

  } catch (err: any) {
    console.error("FULL ERROR:", err.response?.data);
    alert("Submission failed ❌");
  }
}}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-medium text-white hover:opacity-90"
          >
            Submit and Finish
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
)}
</AnimatePresence>

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

</div>
    );
    }   
