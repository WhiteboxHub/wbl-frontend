"use client";

import { useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { adoptSignature, OnboardingStatus, signAgreement } from "@/lib/onboarding";
import { svgToPngBlob } from "@/lib/canvasUtils";

type EnrollmentAgreementFlowModalProps = {
  isOpen: boolean;
  isForceful?: boolean;
  email: string;
  submissionUid: string;
  onClose: () => void;
  onOnboardingChange: (state: OnboardingStatus) => void;
  onSubmissionUidChange: (uid: string) => void;
  onRefreshDocuments: () => Promise<void>;
};

type DocumentChecks = {
  id: boolean;
  address: boolean;
  work: boolean;
};

export default function EnrollmentAgreementFlowModal({
  isOpen,
  isForceful,
  email,
  submissionUid,
  onClose,
  onOnboardingChange,
  onSubmissionUidChange,
  onRefreshDocuments,
}: EnrollmentAgreementFlowModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [checks, setChecks] = useState<DocumentChecks>({ id: false, address: false, work: false });
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const [enrollmentSignatureFile, setEnrollmentSignatureFile] = useState<File | null>(null);
  const [enrollmentSignatureSvg, setEnrollmentSignatureSvg] = useState<string | null>(null);

  const emailAddr = email || localStorage.getItem("userEmail") || "unknown@example.com";

  const handleClose = () => {
    if (isForceful) return;
    setAccepted(false);
    setChecks({ id: false, address: false, work: false });
    setEnrollmentSignatureFile(null);
    setEnrollmentSignatureSvg(null);
    setShowSignatureStep(false);
    onClose();
  };

  const adoptSignatureFile = async () => {
    try {
      const res = await adoptSignature(emailAddr);
      const svgMarkup = String(res?.signature_svg || "").trim();
      if (!svgMarkup) throw new Error("Unable to generate signature");
      
      const pngBlob = await svgToPngBlob(svgMarkup);
      const file = new File([pngBlob], "adopted-signature.png", { type: "image/png" });
      
      setEnrollmentSignatureFile(file);
      setEnrollmentSignatureSvg(svgMarkup);
    } catch (err: any) {
      alert(err?.message || "Failed to adopt signature");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && !showSignatureStep && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            className="relative z-10 w-full max-w-2xl bg-white text-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="p-5 border-b">
              <h2 className="text-xl font-bold">Enrollment Terms and Conditions</h2>
              <p className="text-sm text-gray-500 mt-1">
                Please review and accept the final enrollment agreement to complete your onboarding with Whitebox.
              </p>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-sm">
              <div className="bg-blue-50/50 p-6 rounded-lg space-y-4 border border-blue-100">
                <div>
                  <p className="font-bold text-gray-900 mb-1">1. Scope of Agreement</p>
                  <p className="text-gray-600 leading-relaxed">
                    This agreement outlines the terms of your engagement with the Whitebox platform, including placement
                    services, career coaching, and technical assessment protocols.
                  </p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">2. Confidentiality & Data Privacy</p>
                  <p className="text-gray-600 leading-relaxed">
                    You agree to maintain confidentiality of proprietary testing materials and interview questions. Whitebox
                    will process your data under its Privacy Policy.
                  </p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">3. Placement Terms</p>
                  <p className="text-gray-600 leading-relaxed">
                    Whitebox does not guarantee immediate placement but provides infrastructure and support to improve visibility
                    with partner employers.
                  </p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">4. Code of Conduct</p>
                  <p className="text-gray-600 leading-relaxed">
                    Misrepresentation of skills, experience, or identity may result in immediate termination of account access.
                  </p>
                </div>
              </div>

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
                        setChecks((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              <label className="flex items-start gap-2 text-gray-600">
                <input
                  type="checkbox"
                  className="mt-1 accent-blue-600"
                  checked={accepted}
                  onChange={() => setAccepted(!accepted)}
                />
                <span>
                  I have read, understood, and agree to be bound by the
                  <span className="text-blue-600 font-semibold cursor-pointer"> Enrollment Terms and Conditions</span> and
                  the Whitebox
                  <span className="text-blue-600 font-semibold cursor-pointer"> Privacy Policy</span>.
                </span>
              </label>
            </div>

            <div className="p-4 border-t flex justify-end items-center">
              {!isForceful && (
                <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 mr-auto">
                  Cancel
                </button>
              )}
              <button
                disabled={!accepted || !checks.id || !checks.address || !checks.work}
                onClick={() => setShowSignatureStep(true)}
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

      {isOpen && showSignatureStep && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#f8fafc] w-[720px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-8"
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="mt-8 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Adopt Digital Signature</h3>
                  {enrollmentSignatureSvg && (
                    <button 
                      onClick={() => { setEnrollmentSignatureFile(null); setEnrollmentSignatureSvg(null); }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {!enrollmentSignatureSvg ? (
                  <button
                    onClick={adoptSignatureFile}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-50 py-4 text-indigo-600 hover:bg-indigo-100 transition-all border-2 border-dashed border-indigo-200 group"
                  >
                    <div className="rounded-full bg-white p-2 shadow-sm group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-lg">Adopt Signature</span>
                  </button>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl border-2 border-green-200 bg-green-50/30 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2 text-green-700 text-xs font-bold">
                      <CheckCircle className="h-4 w-4" />
                      SIGNATURE ADOPTED
                    </div>
                    <div
                      className="bg-white rounded-lg border border-gray-100 p-4 shadow-inner flex justify-center"
                      dangerouslySetInnerHTML={{ __html: enrollmentSignatureSvg }}
                    />
                  </motion.div>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded accent-indigo-600"
                    checked={accepted}
                    onChange={() => setAccepted(!accepted)}
                  />
                  <span className="text-sm text-gray-700 font-medium">I agree to the Enrollment Terms & Conditions</span>
                </label>
              </div>

              <button
                disabled={!accepted || !enrollmentSignatureFile}
                onClick={async () => {
                  try {
                    const formData = new FormData();
                    formData.append("uid", submissionUid);
                    formData.append("email", emailAddr);
                    formData.append("username", emailAddr);
                    formData.append("signature", enrollmentSignatureFile!);
                    formData.append("document_type", "enrollment");

                    await axios.post("http://127.0.0.1:8000/api/approval/submit-signature", formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });

                    const agreementRes = await signAgreement(emailAddr, "enrollment");
                    onOnboardingChange(agreementRes.onboarding);

                    await onRefreshDocuments();
                    onSubmissionUidChange(`UID_${Date.now()}`);
                    handleClose();
                    alert("Enrollment agreement signed and sent for verification.");
                  } catch (err: any) {
                    alert(err.response?.data?.detail || "Submission failed");
                  }
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-4 font-bold text-white shadow-xl shadow-indigo-500/20 hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Sign and Complete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
