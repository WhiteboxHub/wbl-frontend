"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { adoptSignature, signAgreement, OnboardingStatus } from "@/lib/onboarding";
import { svgToPngBlob } from "@/lib/canvasUtils";

type PlacementAgreementFlowModalProps = {
  isOpen: boolean;
  isForceful?: boolean;
  email: string;
  submissionUid: string;
  onClose: () => void;
  onOnboardingChange: (state: OnboardingStatus) => void;
  onSubmissionUidChange: (uid: string) => void;
  onRefreshDocuments: () => Promise<void>;
};

export default function PlacementAgreementFlowModal({
  isOpen,
  isForceful,
  email,
  submissionUid,
  onClose,
  onOnboardingChange,
  onSubmissionUidChange,
  onRefreshDocuments,
}: PlacementAgreementFlowModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const [placementSignatureFile, setPlacementSignatureFile] = useState<File | null>(null);
  const [placementSignatureSvg, setPlacementSignatureSvg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const handleClose = () => {
    if (isForceful) return;
    setShowSignatureStep(false);
    setPlacementSignatureFile(null);
    setPlacementSignatureSvg(null);
    setAgreed(false);
    onClose();
  };

  const emailToSend = email || localStorage.getItem("userEmail") || "unknown@example.com";
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

  const adoptSignatureFile = async () => {
    try {
      const res = await adoptSignature(emailToSend);
      const svgMarkup = String(res?.signature_svg || "").trim();
      if (!svgMarkup) throw new Error("Unable to generate signature");
      
      const pngBlob = await svgToPngBlob(svgMarkup);
      const file = new File([pngBlob], "adopted-signature.png", { type: "image/png" });
      
      setPlacementSignatureFile(file);
      setPlacementSignatureSvg(svgMarkup);
    } catch (err: any) {
      alert(err?.message || "Failed to adopt signature");
    }
  };

  return (
    <>
      <AnimatePresence>
      {isOpen && !showSignatureStep && (
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
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="p-6 border-b">
              <p className="text-xs tracking-widest text-indigo-600 font-semibold">LEGAL & COMPLIANCE</p>
              <div className="flex justify-between items-center mt-1">
                <h2 className="text-2xl font-bold text-gray-900">Placement Payment Terms</h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-600 hover:text-black"
                >
                  x
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment Guidelines and Placement Terms</h3>
                <p className="text-sm leading-relaxed">
                  This document outlines the payment structure, placement fees, and re support terms for candidates
                  enrolled with our training and placement services, with a focus on IT roles including AI and ML positions.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Post Placement Fees</h3>
                <p className="text-sm leading-relaxed">
                  After successful placement, a placement fee of <strong>13%</strong> from your offered annual salary will be applicable.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Payment Method and Installments</h3>
                <div className="text-sm space-y-2 leading-relaxed">
                  <p>The post placement fee may be paid in three installments using <strong>postpaid checks</strong>.</p>
                  <p>All checks must be handed over before background check clearance and before onboarding date.</p>
                  <p>The first check will be deposited before the candidate's job start date.</p>
                  <p>All remaining checks will be deposited within two months from the candidate's start date.</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Support Period and Re Placement Policy</h3>
                <div className="text-sm space-y-2 leading-relaxed">
                  <p>Placement support is provided for one month from job start date.</p>
                  <p>If terminated or laid off within the first <strong>two months</strong>, re-placement support is provided at no additional cost.</p>
                  <p>After 2 months and up to 6 months: a fee of <strong>USD 2,500</strong> will apply.</p>
                  <p>After 6 months and up to 12 months: a fee of <strong>USD 5,000</strong> will apply.</p>
                  <p>After 12 months: treated as a <strong>new placement</strong> subject to standard fees.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-white rounded-b-2xl">
              <label className="flex items-start gap-2 text-sm mb-4 text-gray-800 leading-relaxed">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                I have read and understood the Placement Payment Terms and agree to abide by them.
              </label>
              <div className="flex gap-4">
                <button
                  disabled={!agreed}
                  onClick={() => setShowSignatureStep(true)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  Agree and Continue
                </button>
                <button className="px-6 py-3 bg-gray-200 rounded-xl text-gray-700">Download PDF</button>
              </div>
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
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#f8fafc] w-full max-w-[720px] mx-4 max-h-[90vh] rounded-2xl shadow-2xl flex flex-col"
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* ── Sticky Header ── */}
            <div className="flex-shrink-0 p-6 border-b bg-white rounded-t-2xl">
              <p className="text-xs tracking-widest text-indigo-600 font-semibold">LEGAL &amp; COMPLIANCE</p>
              <div className="flex justify-between items-center mt-1">
                <h2 className="text-2xl font-bold text-gray-900">Placement Payment Terms</h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Signature box */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Adopt Digital Signature</h3>
                  {placementSignatureSvg && (
                    <button
                      onClick={() => { setPlacementSignatureFile(null); setPlacementSignatureSvg(null); }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {!placementSignatureSvg ? (
                  <button
                    onClick={adoptSignatureFile}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-50 py-5 text-indigo-600 hover:bg-indigo-100 transition-all border-2 border-dashed border-indigo-200 group"
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
                    <div className="mb-3 flex items-center gap-2 text-green-700 text-xs font-bold">
                      <CheckCircle className="h-4 w-4" />
                      SIGNATURE ADOPTED
                    </div>
                    <div
                      className="bg-white rounded-lg border border-gray-100 p-4 shadow-inner flex justify-center"
                      dangerouslySetInnerHTML={{ __html: placementSignatureSvg }}
                    />
                  </motion.div>
                )}
              </div>

              {/* Agreement checkbox */}
              <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded accent-indigo-600 flex-shrink-0"
                  checked={agreed}
                  onChange={() => setAgreed(!agreed)}
                />
                <span className="text-sm text-gray-700 font-medium">I agree to the Placement Payment Terms</span>
              </label>
            </div>

            {/* ── Sticky Footer ── */}
            <div className="flex-shrink-0 p-6 border-t bg-white rounded-b-2xl">
              <button
                disabled={!agreed || !placementSignatureFile || isSubmitting}
                onClick={async () => {
                  if (isSubmitting) return;
                  setIsSubmitting(true);
                  try {
                    const formData = new FormData();
                    formData.append("uid", submissionUid);
                    formData.append("username", emailToSend);
                    formData.append("email", emailToSend);
                    formData.append("signature", placementSignatureFile!);
                    formData.append("document_type", "placement");

                    const res = await fetch(`${API_BASE}/approval/submit-signature`, {
                      method: "POST",
                      body: formData,
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.detail);

                    const agreementRes = await signAgreement(emailToSend, "placement");
                    onOnboardingChange(agreementRes.onboarding);

                    await onRefreshDocuments();
                    onSubmissionUidChange(`UID_${Date.now()}`);
                    // Close modal first so the candidate sees it dismiss immediately
                    handleClose();
                    showToast("Placement agreement signed and sent for verification.", "success");
                  } catch (err: any) {
                    showToast(err.message || "Server error", "error");
                    setIsSubmitting(false);
                  }
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Sign and Complete"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      </AnimatePresence>

      {/* ── Toast Notification (Improved Centering) ── */}
      <div className="fixed top-5 inset-x-0 z-[100000] flex justify-center pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-semibold min-w-[280px] max-w-[90vw] md:max-w-[420px] bg-white ${
                toast.type === "success" ? "border border-green-200" : "border border-red-200"
              }`}
            >
              <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                toast.type === "success" ? "bg-green-100" : "bg-red-100"
              }`}>
                {toast.type === "success" ? (
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
              <span className="text-gray-800">{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
