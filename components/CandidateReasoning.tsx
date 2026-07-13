"use client";

import { useState } from "react";

interface CandidateReasoningProps {
  onSuccess: () => void;
}

type Provider =
  | "openai"
  | "claude"
  | "gemini"
  | "grok"
  | "mistral"
  | "cohere"
  | "deepseek";

type ReasoningMode = "fast" | "balanced" | "deep";

const PROVIDERS = [
  {
    value: "openai" as const,
    label: "OpenAI / ChatGPT",
    description: "Best for ChatGPT-style interview answers.",
  },
  {
    value: "claude" as const,
    label: "Claude",
    description: "Good for careful and detailed reasoning.",
  },
  {
    value: "gemini" as const,
    label: "Google Gemini",
    description: "Good for multimodal and general AI reasoning.",
  },
  {
    value: "grok" as const,
    label: "Grok",
    description: "Alternative AI provider from xAI.",
  },
  {
    value: "mistral" as const,
    label: "Mistral",
    description: "Fast open-model provider option.",
  },
  {
    value: "cohere" as const,
    label: "Cohere",
    description: "Useful for enterprise AI workflows.",
  },
  {
    value: "deepseek" as const,
    label: "DeepSeek",
    description: "Good for coding and reasoning tasks.",
  },
  {
    value: "other" as const,
    label: "Other Provider",
    description: "Use another LLM provider configured in your keys.",
  },
];

const REASONING_OPTIONS = [
  {
    value: "fast" as const,
    label: "Fast",
    description: "Quick answers for simple interview questions.",
  },
  {
    value: "balanced" as const,
    label: "Balanced",
    description: "Good mix of speed and detailed reasoning.",
  },
  {
    value: "deep" as const,
    label: "Deep",
    description: "Best for complex answers and detailed explanations.",
  },
];

export default function CandidateReasoning({ onSuccess }: CandidateReasoningProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider | "">("");
  const [selectedMode, setSelectedMode] = useState<ReasoningMode | "">("");
  const [error, setError] = useState("");

  const selectedProviderOption = PROVIDERS.find(
    (provider) => provider.value === selectedProvider
  );

  const selectedReasoningOption = REASONING_OPTIONS.find(
    (option) => option.value === selectedMode
  );

  const handleSubmit = () => {
    if (!selectedProvider) {
      setError("Please select an AI provider.");
      return;
    }

    if (!selectedMode) {
      setError("Please select a reasoning mode.");
      return;
    }

    setError("");
    onSuccess();
  };

  return (
    <div className="mt-4 rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">AI Reasoning</h3>

      <p className="mt-2 text-gray-500">
        Select your AI provider and reasoning style for the interview.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            AI Provider
          </label>

          <select
            value={selectedProvider}
            onChange={(event) => {
              setSelectedProvider(event.target.value as Provider);
              setError("");
            }}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select AI provider</option>

            {PROVIDERS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>

          {selectedProviderOption && (
            <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-gray-700">
              <strong>{selectedProviderOption.label}</strong>
              <p className="mt-1">{selectedProviderOption.description}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reasoning Mode
          </label>

          <select
            value={selectedMode}
            onChange={(event) => {
              setSelectedMode(event.target.value as ReasoningMode);
              setError("");
            }}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select reasoning mode</option>

            {REASONING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {selectedReasoningOption && (
            <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-gray-700">
              <strong>{selectedReasoningOption.label}</strong>
              <p className="mt-1">{selectedReasoningOption.description}</p>
            </div>
          )}
        </div>

        {selectedProviderOption && selectedReasoningOption && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            Selected:{" "}
            <strong>
              {selectedProviderOption.label} - {selectedReasoningOption.label}
            </strong>
          </div>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-white transition hover:bg-indigo-700"
        >
          Continue to Audio Setup
        </button>
      </div>
    </div>
  );
}