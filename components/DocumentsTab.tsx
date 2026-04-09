"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { UploadCloud, FileText, Eye, Trash2, DollarSign } from "lucide-react";
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
};

const emptyDocuments: DocumentsResponse = {
  identity: null,
  address: null,
  work_auth: null,
  recent_activity: [],
};

export default function DocumentsTab() {
  const [documents, setDocuments] = useState<DocumentsResponse>(emptyDocuments);

  // FETCH DOCUMENTS
  const fetchDocuments = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) return;

    const docs = await getDocuments(email);
    setDocuments(docs ?? emptyDocuments);
  };

  // AUTO REFRESH
  useEffect(() => {
    fetchDocuments();

    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  // UPLOAD
  const handleUpload = async (file: File, documentType: string) => {
  const email = localStorage.getItem("userEmail");
  const username = localStorage.getItem("username");

  if (!email || !username) {
    alert("User info missing. Please login again.");
    return;
  }

  

  const formData = new FormData();
  formData.append("file", file);
  formData.append("email", email);
  formData.append("username", username);
  formData.append("document_type", documentType);

  for (let pair of formData.entries()) {
  console.log(pair[0], pair[1]);
}

  console.log("UPLOAD DATA:", {
    email,
    username,
    documentType,
    fileName: file.name,
  });

  await uploadDocument(formData);
};
  // VIEW STATUS
  const viewStatus = async (uid?: string) => {
    if (!uid) return;

    const res = await fetch(`/api/approval/status?uid=${uid}`);
    const data = await res.json();

    alert(`Status: ${data.status}`);
  };

  // STATUS LABEL
  const getStatusLabel = (doc: DocumentItem | null) => {
    if (!doc) return "NOT UPLOADED";
    return doc.status; // backend already gives correct value
  };
  const recentActivity = documents.recent_activity?.length
    ? documents.recent_activity
    : [
        { filename: "Identity_Card_Front.jpg", status: "DELETED" },
        { filename: "Background_Form.pdf", status: "RECEIVED" },
      ];

  const [showTerms, setShowTerms] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signature, setSignature] = useState("");

  const [checks, setChecks] = useState({
  id: false,
  address: false,
  work: false,
  agree: false,
  });  

  const handleSubmit = async () => {
  const email = localStorage.getItem("userEmail");
  if (!email) {
    alert("User email missing. Please login again.");
    return;
  }

  await axios.post("http://127.0.0.1:8000/api/approval/submit-signature", {
    email,
    signature,
  });

  alert("Completed!");
  setShowSignature(false);
};

  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [accepted, setAccepted] = useState(false);  
  const [showSignatureModal, setShowSignatureModal] = useState(false);


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
              ID and Address Proof
            </h3>
            <span className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-500">
              <p>{getStatusLabel(documents.identity)}</p>
            </span>
          </div>

          <p className="mb-4 text-sm text-gray-400">
            Upload a government ID and recent address proof.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Identity Document", type: "identity" },
              { label: "Address Proof", type: "address" },
            ].map((item, i) => (
              <label
                key={i}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-6 transition hover:border-blue-400 dark:border-gray-700"
              >
                <UploadCloud className="mb-2 h-6 w-6 text-blue-500" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  {item.label}
                </p>
                <span className="text-xs text-gray-400">PDF, JPG up to 10MB</span>
                <input
                  id={`uploadInput-${item.type}`}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file, item.type);
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Work Authorization Proof
            </h3>
            <span className="rounded-lg bg-purple-100 px-2 py-1 text-xs font-bold text-purple-600">
              <p>{getStatusLabel(documents.work_auth)}</p>
            </span>
          </div>

          <p className="mb-4 text-sm text-gray-400">
            Upload visa / permit / citizenship proof.
          </p>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-bold">Visa_Endorsement_2024.pdf</p>
                <p className="text-xs text-gray-400">2.4 MB</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Eye className="h-4 w-4 cursor-pointer text-gray-500" />
              <Trash2 className="h-4 w-4 cursor-pointer text-red-400" />
            </div>
          </div>
        </div>


        <div className="w-fit rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Application
          </p>
          <button className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-2 text-sm font-bold text-white transition hover:opacity-90">
            View Status
          </button>
        </div>



        <div>
            <h3 className="mb-3 font-bold">Recent Activity</h3>

            <div className="divide-y border rounded-lg">
          {documents.recent_activity.length === 0 && (
            <div className="p-3 text-sm text-gray-500">
              No activity yet
            </div>
          )}

          {documents.recent_activity?.map((doc, index) => (
            <div key={index} className="flex justify-between p-3">
              <span>{doc.filename}</span>

              <span
                className={`text-xs font-bold ${
                  doc.status === "REJECTED"
                    ? "text-red-500"
                    : doc.status === "APPROVED"
                    ? "text-green-500"
                    : "text-blue-500"
                }`}
              >
                {doc.status}
              </span>
            </div>
          ))}
          </div>
        </div>
      </div>

      

      <div className="space-y-6 lg:col-span-4">

<div className="space-y-4">
    
    <button
      onClick={() => setShowTerms(true)}
      className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border border-gray-700 bg-[#111827] text-white font-medium shadow-sm hover:bg-gray-800 transition"
    ><DollarSign className="w-5 h-5 text-indigo-600" />

       Placement Payment Terms
    </button>

    <button
      onClick={() => setShowEnrollmentModal(true)}
      className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border border-gray-700 bg-[#111827] text-white font-medium shadow-sm hover:bg-gray-800 transition"
    >
    <FileText className="w-5 h-5 text-indigo-600" />
       Enrollment Terms & Conditions
    </button>

  </div>

        <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 p-5 text-white">
          <h3 className="mb-3 font-bold">Verification Status</h3>
          <div className="space-y-2 text-sm">
            <p>Personal Profile Verified</p>
            <p>Documents Pending</p>
          </div>
          <button className="mt-4 w-full rounded-xl bg-white py-2 font-bold text-blue-600">
            Contact Support
          </button>
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

          <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold">
                S
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Need Help?
                </p>
                <p className="text-xs text-gray-400">
                  Your coordinator: Pathan, +91 98765 43210
                </p>
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
          ease: "easeOut"
        }}
      >
      {/* HEADER */}
      <div className="p-6 border-b">
        <p className="text-xs tracking-widest text-indigo-600 font-semibold">
          LEGAL & COMPLIANCE
        </p>

        <div className="flex justify-between items-center">
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
      <div className="p-6 space-y-6 text-gray-800">

        {/* SECTION 1 */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">
            1. Overview of Terms
          </h3>
          <p className="text-sm leading-relaxed">
            By accepting a placement through the Whitebox platform, you agree to the
            financial structures outlined herein. These terms govern the disbursement
            of signing bonuses, relocation stipends, and the schedule for your initial
            compensation cycles.
          </p>
        </div>

        {/* PAYMENT BOX */}
        <div className="bg-indigo-50 p-4 rounded-xl">
          <p className="font-semibold text-gray-900 mb-3">
            💳 Payment Schedule
          </p>

          <div className="flex justify-between text-sm mb-1">
            <span>First Installment (Retention)</span>
            <span className="font-medium">Day 30</span>
          </div>

          <div className="flex justify-between text-sm mb-1">
            <span>Completion Bonus</span>
            <span className="font-medium">Day 90</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Ongoing Commission</span>
            <span className="font-medium">Monthly</span>
          </div>
        </div>

        {/* SECTION 2 */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">
            2. Clawback Provisions
          </h3>
          <p className="text-sm leading-relaxed">
            Should the candidate terminate employment within the first 180 days of
            placement, Whitebox reserves the right to recover any advanced relocation
            or signing incentives. This is calculated on a pro-rata basis from the
            date of separation.
          </p>
        </div>

        {/* SECTION 3 */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">
            3. Digital Signature Consent
          </h3>
          <p className="text-sm leading-relaxed">
            Your interaction with this platform and clicking "Agree and Continue"
            constitutes a binding electronic signature.
          </p>
        </div>

        {/* 🔥 YOUR REQUIRED CHECKBOXES */}
        <div className="bg-gray-50 p-4 rounded-xl space-y-2">
          <p className="font-medium text-gray-900">
            Required Document Confirmation
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox"
              onChange={(e) => setChecks({ ...checks, id: e.target.checked })}
            />
            ID Proof Uploaded
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox"
              onChange={(e) => setChecks({ ...checks, address: e.target.checked })}
            />
            Address Proof Uploaded
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox"
              onChange={(e) => setChecks({ ...checks, work: e.target.checked })}
            />
            Work Authorization Proof Uploaded
          </label>
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
            disabled={
              !checks.id || !checks.address || !checks.work || !checks.agree
            }
            onClick={() => {
              setShowTerms(false);
              setShowSignature(true);
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
  {showSignature && (
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
              onClick={() => setShowSignature(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-600 hover:text-black"
            >
              ×
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 text-gray-800">

          {/* REPEAT SMALL SUMMARY (like your image) */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              1. Overview of Terms
            </h3>
            <p className="text-sm">
              By accepting a placement through the Whitebox platform, you agree
              to the financial structures outlined herein.
            </p>
          </div>

          {/* SIGNATURE SECTION */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs tracking-widest text-gray-500 font-semibold">
                DIGITAL SIGNATURE
              </p>

              <button className="text-indigo-600 text-sm">
                ↻ Clear
              </button>
            </div>

            {/* SIGN BOX */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl h-[140px] flex items-center justify-center text-gray-400">
              ✍️ Click or tap to sign here
            </div>

            <p className="text-xs text-gray-500 mt-2">
              By signing above, you agree that this digital mark constitutes your binding signature.
            </p>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-white rounded-b-2xl">

          <div className="flex gap-4">

            <button
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium"
              onClick={async () => {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/approval/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "khaja", // dynamic later
        approver_email: "user@gmail.com", // dynamic later
        file_name: "placement_terms.pdf",
        has_signed: true
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Sent for Approval ✅");
      setShowSignature(false);
    } else {
      alert("Error: " + data.detail);
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong ❌");
  }
}}
            >
              Submit & Finish
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

{showEnrollmentModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">

    {/* 🔥 BACKDROP */}
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={() => setShowEnrollmentModal(false)}
    />

    {/* 🔥 MODAL */}
    <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8 animate-scaleIn">

      {/* HEADER */}
      <p className="text-xs tracking-widest text-gray-500 mb-2">
        ACTION REQUIRED
      </p>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Enrollment Terms and Conditions
      </h2>

      <p className="text-gray-600 mb-6">
        Please review and accept the final enrollment agreement to complete your onboarding with Whitebox.
      </p>

      {/* CONTENT BOX */}
      <div className="bg-gray-100 rounded-xl p-5 text-sm text-gray-700 space-y-4 max-h-[300px] overflow-y-auto">

        <div>
          <p className="font-semibold">1. Scope of Agreement</p>
          <p>
            This agreement outlines the terms of your engagement with the Whitebox platform,
            including placement services, career coaching, and technical assessment protocols.
            By proceeding, you acknowledge that Whitebox acts as an intermediary partner in your professional development.
          </p>
        </div>

        <div>
          <p className="font-semibold">2. Confidentiality & Data Privacy</p>
          <p>
            You agree to maintain the confidentiality of all proprietary testing materials and
            interview questions provided during the screening process. Whitebox will process your
            personal data in accordance with our Privacy Policy, ensuring end-to-end encryption
            for all sensitive career documentation.
          </p>
        </div>

        <div>
          <p className="font-semibold">3. Placement Terms</p>
          <p>
            Whitebox does not guarantee immediate placement but provides the infrastructure to
            maximize your visibility to top-tier hiring managers. All communications with partner
            employers must be documented within the Whitebox Portal to ensure quality control and compliance.
          </p>
        </div>

        <div>
          <p className="font-semibold">4. Code of Conduct</p>
          <p>
            Candidates are expected to maintain professional standards in all interactions.
            Misrepresentation of skills, experience, or identity will result in immediate
            termination of account access and removal from active candidate pools.
          </p>
        </div>

      </div>

      {/* CHECKBOX */}
      <div className="flex items-start gap-3 mt-5">
        <input
          type="checkbox"
          className="mt-1"
          checked={accepted}
          onChange={() => setAccepted(!accepted)}
        />
        <p className="text-sm text-gray-600">
          I have read, understood, and agree to be bound by the{" "}
          <span className="text-indigo-600 font-medium">
            Enrollment Terms and Conditions
          </span>{" "}
          and the{" "}
          <span className="text-indigo-600 font-medium">
            Whitebox Privacy Policy
          </span>.
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-between mt-6">
        <button
  disabled={!accepted}
  onClick={() => {
    setShowEnrollmentModal(false);
    setShowSignatureModal(true);
  }}
  className={`px-6 py-3 rounded-xl text-white font-medium transition ${
    accepted
      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90"
      : "bg-gray-300 cursor-not-allowed"
  }`}
>
  Agree and Complete Onboarding →
</button>

        <button
          onClick={() => setShowEnrollmentModal(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

    </div>
  </div>
)}

{showSignatureModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">

    {/* 🔥 BACKDROP */}
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={() => setShowSignatureModal(false)}
    />

    {/* 🔥 MODAL */}
    <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8 animate-scaleIn">

      {/* HEADER */}
      <p className="text-xs tracking-widest text-gray-500 mb-2">
        ACTION REQUIRED
      </p>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Enrollment Terms and Conditions
      </h2>

      {/* CONTENT BOX */}
      <div className="bg-gray-100 rounded-xl p-5 text-sm text-gray-700 space-y-4">

        <div>
          <p className="font-semibold">1. Scope of Agreement</p>
          <p>
            This agreement outlines the terms of your engagement with the Whitebox platform,
            including placement services, career coaching, and technical assessment protocols.
            By proceeding, you acknowledge that Whitebox acts as an intermediary partner in your professional development.
          </p>
        </div>

        <div>
          <p className="font-semibold">2. Confidentiality & Data Privacy</p>
          <p>
            You agree to maintain the confidentiality of all proprietary testing materials and
            interview questions provided during the screening process. Whitebox will process your
            personal data in accordance with our Privacy Policy, ensuring end-to-end encryption
            for all sensitive career documentation.
          </p>
        </div>

        <div>
          <p className="font-semibold">3. Placement Terms</p>
        </div>

      </div>

      {/* 🔥 DIGITAL SIGNATURE */}
      <div className="mt-6">

        <div className="flex items-center gap-2 mb-3">
          ✍️
          <p className="font-semibold text-gray-800">Digital Signature</p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center text-center bg-gray-50">

          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 mb-2">
            ✏️
          </div>

          <p className="text-gray-700 font-medium">
            Click to sign this agreement
          </p>

          <p className="text-xs text-gray-500">
            Securely managed by Docuseal
          </p>

        </div>

      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between mt-6">

        <p className="text-sm text-gray-500">
          ✔ Legally binding e-signature
        </p>

        <div className="flex items-center gap-4">

          <button
            onClick={() => setShowSignatureModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>

          <button className="px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition">
            Complete Enrollment
          </button>

        </div>

      </div>

    </div>
  </div>
)}

          </div>
        </div>
      </div>
    </div>
  );
}
