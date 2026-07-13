"use client";

interface SetupIntroProps {
  onContinue: () => void;
}

export default function SetupIntro({ onContinue }: SetupIntroProps) {
  return (
    <div className="min-h-[700px] flex items-center justify-center bg-gray-50">
      <div className="max-w-3xl bg-white rounded-2xl shadow-xl p-10">

        <h1 className="text-4xl font-bold text-center text-indigo-600">
          Welcome to AI Setup
        </h1>

        <p className="text-center text-gray-600 mt-4 text-lg">
          Before starting your AI Interview, let's configure everything required.
        </p>

        <div className="mt-10 space-y-6">

          <div className="border rounded-xl p-5">
            <h2 className="text-xl font-semibold">🤖 LLM Setup</h2>
            <p className="text-gray-600 mt-2">
              Add your OpenAI, Claude or Gemini API Key.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h2 className="text-xl font-semibold">🧠 Reasoning</h2>
            <p className="text-gray-600 mt-2">
              Select the AI model for your interview.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h2 className="text-xl font-semibold">🎤 Audio Setup</h2>
            <p className="text-gray-600 mt-2">
              Test your microphone before the interview.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h2 className="text-xl font-semibold">📷 Camera Setup</h2>
            <p className="text-gray-600 mt-2">
              Check your webcam and lighting.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h2 className="text-xl font-semibold">🎥 Video Checks</h2>
            <p className="text-gray-600 mt-2">
              Ensure everything is working properly.
            </p>
          </div>

        </div>

        <div className="flex justify-center mt-10">
          <button
            onClick={onContinue}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg"
          >
            Get Started
          </button>
        </div>

      </div>
    </div>
  );
}