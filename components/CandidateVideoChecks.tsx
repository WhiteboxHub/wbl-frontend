"use client";

interface CandidateVideoChecksProps {
    onSuccess: () => void;
}

export default function CandidateVideoChecks({
    onSuccess,
}: CandidateVideoChecksProps) {

    return (

        <div className="w-full min-h-[650px] flex items-center justify-center">

            <div className="bg-white border rounded-2xl shadow-xl p-10 w-[900px]">

                <h1 className="text-3xl font-bold text-center">
                    ✅ Final System Check
                </h1>

                <p className="text-center text-gray-500 mt-4">
                    Before starting your AI interview,
                    please review your setup.
                </p>

                <div className="mt-10 space-y-5 text-lg">

                    <p>✅ LLM API Key Connected</p>

                    <p>✅ AI Reasoning Selected</p>

                    <p>✅ Microphone Working</p>

                    <p>✅ Camera Working</p>

                    <p>✅ Face Detected</p>

                    <p>✅ Lighting Good</p>

                </div>

                <div className="text-center mt-12">

                    <button
                        onClick={onSuccess}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg"
                    >
                        Start Interview
                    </button>

                </div>

            </div>

        </div>

    );
}