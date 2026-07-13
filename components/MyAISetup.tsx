"use client";

import { useRouter } from "next/navigation";
import { useState, type Dispatch, type SetStateAction } from "react";

import SetupIntro from "./SetupIntro";
import { CandidateLlmKeysPanel } from "./CandidateLlmKeysPanel";
import CandidateReasoning from "./CandidateReasoning";
import CandidateAudioSetup from "./CandidateAudioSetup";
import CandidateCameraSetup from "./CandidateCameraSetup";
import CandidateVideoChecks from "./CandidateVideoChecks";

type SetupPage =
  | "intro"
  | "llm"
  | "reasoning"
  | "audio"
  | "camera"
  | "video";

interface MyAISetupProps {
  goToTab: (tab: string) => void;
  setupStep?: "audio" | "video" | "llm" | "reasoning" | "camera";
  setSetupStep?: Dispatch<SetStateAction<"audio" | "video" | "llm" | "reasoning" | "camera">>;
}

export default function MyAISetup({
  goToTab,
  setupStep,
  setSetupStep,
}: MyAISetupProps) {
  const router = useRouter();
  const [page, setPage] = useState<SetupPage>("intro");

  const currentPage = setupStep ? (setupStep as SetupPage) : page;
  const setCurrentPage = (nextPage: SetupPage) => {
    if (setSetupStep) {
      setSetupStep(nextPage as "audio" | "video" | "llm" | "reasoning" | "camera");
    }
    setPage(nextPage);
  };

  const handleGoToDashboard = () => {
  const aiPrepUrl =
    process.env.NEXT_PUBLIC_AIPREP_FRONTEND_URL || "http://localhost:3000";

  window.location.href = aiPrepUrl;
};

  const effectivePage = setupStep ? (setupStep as SetupPage) : page;

  switch (effectivePage) {

    case "intro":
      return (
        <SetupIntro
          onContinue={() => setCurrentPage("llm")}
        />
      );

    case "llm":
      return (
        <CandidateLlmKeysPanel
          onSuccess={() => setCurrentPage("reasoning")}
        />
      );

    case "reasoning":
      return (
        <CandidateReasoning
          onSuccess={() => setCurrentPage("audio")}
        />
      );

    case "audio":
      return (
        <CandidateAudioSetup
          onSuccess={() => setCurrentPage("camera")}
        />
      );

    case "camera":
      return (
        <CandidateCameraSetup
          onSuccess={() => setCurrentPage("video")}
        />
      );

    case "video":
      return (
        <CandidateVideoChecks
          onSuccess={handleGoToDashboard}
        />
      );

    default:
      return null;
  }
}