import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles, PlayCircle, Loader2 } from "lucide-react";

import { toast } from "sonner";
import { CandidateLlmKeysPanel } from "../CandidateLlmKeysPanel";
import { apiFetch } from "../../lib/api";

type SetupStep = "llm-key" | "done";

export default function AiSetupTab({ candidateId, onFinishSetup }: { candidateId?: number, onFinishSetup?: () => void }) {
  const [currentStep, setCurrentStep] = useState<SetupStep>("llm-key");
  const [isValidLlm, setIsValidLlm] = useState(false);

  const [finishing, setFinishing] = useState(false);

  const finishSetup = async () => {
    setFinishing(true);
    try {
      const result: any = await apiFetch("coderpad/me/finish-setup", { method: "POST" });
      if (result?.setup_complete) {
        toast.success("Setup complete! Your API key is valid.");
        if (onFinishSetup) {
          onFinishSetup();
        } else {
          setCurrentStep("done");
        }
      } else {
        toast.error(result?.error || "Default API key is not valid. Please validate it first.");
      }
    } catch (err: any) {
      const msg = err?.body?.detail || "Failed to complete setup. Ensure your default key is active.";
      toast.error(msg);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="w-full p-0 py-6">
      <div className={currentStep === "llm-key" ? "" : "mx-4 lg:mx-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden p-6 md:p-8"}>
        
        {/* Step: LLM Key */}
        {currentStep === "llm-key" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <CandidateLlmKeysPanel onValidationChange={setIsValidLlm}>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={finishSetup}
                  disabled={!isValidLlm || finishing}
                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Complete Setup <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </CandidateLlmKeysPanel>
          </motion.div>
        )}



        {/* Step: Done */}
        {currentStep === "done" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col items-center justify-center text-center py-8 space-y-6"
          >
            {/* Success Badge */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Checks Completed!</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Your microphone, camera, and API keys are successfully configured and verified.
              </p>
            </div>

            {/* WBL SmartPrep Card */}
            <div className="w-full max-w-md p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-left space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <span className="text-lg font-extrabold text-indigo-950 dark:text-indigo-100 tracking-tight">
                  WBL <span className="text-indigo-600 dark:text-indigo-400 font-black">SmartPrep</span>
                </span>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                You are ready to begin your mock coding and behavioral interviews powered by Gemini.
              </p>

              <button
                onClick={async () => {
                  const getAiPrepUrl = () => {
                    const url = process.env.NEXT_PUBLIC_AIPREP_FRONTEND_URL;
                    if (url) return url;
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
                className="w-full py-3 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" /> Start Preparation
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
