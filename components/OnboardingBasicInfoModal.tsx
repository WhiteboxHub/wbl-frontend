"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OnboardingStatus, submitBasicInfo } from "@/lib/onboarding";

type BasicInfoFormState = {
  full_name: string;
  phone: string;
  linkedin_url: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_email: string;
  has_user_input_error: boolean;
  original_resume_text: string;
};

type OnboardingBasicInfoModalProps = {
  isOpen: boolean;
  isForceful?: boolean;
  email: string;
  username: string;
  onClose: () => void;
  onSubmitted: (onboarding: OnboardingStatus) => void;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/.+/i;
const phonePattern = /^[+]?[0-9\s().-]{7,20}$/;

const initialForm: BasicInfoFormState = {
  full_name: "",
  phone: "",
  linkedin_url: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_email: "",
  has_user_input_error: false,
  original_resume_text: "",
};

export default function OnboardingBasicInfoModal({
  isOpen,
  isForceful,
  email,
  username,
  onClose,
  onSubmitted,
}: OnboardingBasicInfoModalProps) {
  const [form, setForm] = useState<BasicInfoFormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setForm((prev) => {
      if (prev.full_name.trim() || prev.emergency_contact_email.trim()) return prev;
      const fallbackName = username
        .replace(/[._-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
      return {
        ...prev,
        full_name: fallbackName,
        emergency_contact_email: email,
      };
    });
    setError("");
  }, [isOpen, username, email]);

  const updateField = <K extends keyof BasicInfoFormState>(key: K, value: BasicInfoFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const [showThankYou, setShowThankYou] = useState(false);

  // Redefining handleSubmit to handle the Thank You slide
  const handleFinalSubmit = async () => {
    if (!email) {
      setError("User email not found. Please sign in again.");
      return;
    }

    const requiredValues = [
      form.full_name,
      form.phone,
      form.linkedin_url,
      form.emergency_contact_name,
      form.emergency_contact_phone,
      form.emergency_contact_email,
    ];
    if (requiredValues.some((value) => !value.trim())) {
      setError("Please fill all required fields.");
      return;
    }
    if (!phonePattern.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!phonePattern.test(form.emergency_contact_phone.trim())) {
      setError("Please enter a valid emergency contact phone number.");
      return;
    }
    if (!linkedinPattern.test(form.linkedin_url.trim())) {
      setError("Please enter a valid LinkedIn URL.");
      return;
    }
    if (!emailPattern.test(form.emergency_contact_email.trim())) {
      setError("Please enter a valid emergency contact email.");
      return;
    }
    if (form.has_user_input_error && !form.original_resume_text.trim()) {
      setError("Please paste your original resume text.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const response = await submitBasicInfo({
        email,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        linkedin_url: form.linkedin_url.trim(),
        emergency_contact_name: form.emergency_contact_name.trim(),
        emergency_contact_phone: form.emergency_contact_phone.trim(),
        emergency_contact_email: form.emergency_contact_email.trim(),
        has_user_input_error: form.has_user_input_error,
        original_resume_text: form.original_resume_text.trim() || null,
      });
      setShowThankYou(true);
      setTimeout(() => {
        onSubmitted(response.onboarding);
        onClose();
        setShowThankYou(false);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to submit basic information.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden"
            initial={{ scale: 0.96, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {showThankYou ? (
              <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6 rounded-full bg-green-100 p-6 text-green-600"
                >
                  <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900">Thank you</h2>
                <p className="mt-4 text-lg text-gray-600">Your basic information has been validated successfully.</p>
                <p className="mt-2 text-sm text-gray-400">Continuing to the next step...</p>
              </div>
            ) : (
              <>
                <div className="border-b p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Onboarding Step 1</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900">Basic Information</h2>
                  <p className="mt-1 text-sm text-gray-500">Fill this once to continue to document verification.</p>
                </div>

                <div className="max-h-[68vh] space-y-4 overflow-y-auto p-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      value={form.full_name}
                      onChange={(e) => updateField("full_name", e.target.value)}
                      placeholder="Full name *"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="Phone number *"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      value={form.linkedin_url}
                      onChange={(e) => updateField("linkedin_url", e.target.value)}
                      placeholder="LinkedIn URL *"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      value={form.emergency_contact_name}
                      onChange={(e) => updateField("emergency_contact_name", e.target.value)}
                      placeholder="Emergency contact name *"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      value={form.emergency_contact_phone}
                      onChange={(e) => updateField("emergency_contact_phone", e.target.value)}
                      placeholder="Emergency contact phone *"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      value={form.emergency_contact_email}
                      onChange={(e) => updateField("emergency_contact_email", e.target.value)}
                      placeholder="Emergency contact email *"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.has_user_input_error}
                      onChange={(e) => updateField("has_user_input_error", e.target.checked)}
                      className="mt-0.5"
                    />
                    I entered something incorrectly and need to provide my original resume text.
                  </label>

                  {form.has_user_input_error && (
                    <textarea
                      value={form.original_resume_text}
                      onChange={(e) => updateField("original_resume_text", e.target.value)}
                      placeholder="Paste original resume text *"
                      className="min-h-[140px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  )}

                  {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t p-5">
                  {!isForceful && (
                    <button
                      onClick={onClose}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  )}
                  <button
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    {submitting ? "Submitting..." : "Save and Continue"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
