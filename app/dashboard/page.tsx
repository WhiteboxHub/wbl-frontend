// export default function DashboardPage() {
//   return <h1>Dashboard Working ✅</h1>;
// }
import { FileText, Upload, Eye, Trash2 } from "lucide-react";
import CandidateDashboard from "@/components/CandidateDashboard";

export default function DocumentsPage() {
  return (
    <div className="flex gap-6 p-6 bg-gray-50 min-h-screen">

      {/* LEFT SECTION */}
      <div className="flex-1 space-y-6">

        {/* HEADER */}
        <div>
          <p className="text-sm text-purple-600 font-semibold tracking-widest">
            COMPLIANCE & VERIFICATION
          </p>
          <h1 className="text-3xl font-bold mt-2">Documents</h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Please provide the necessary documentation to proceed with your
            application. All uploads are encrypted and stored securely.
          </p>
        </div>

        {/* ID + ADDRESS CARD */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">ID and Address Proof</h2>
            <span className="text-xs bg-red-100 text-red-500 px-3 py-1 rounded-full">
              NOT UPLOADED
            </span>
          </div>

          <p className="text-gray-500 mt-2 text-sm">
            Upload a government ID and a recent utility bill.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">

            {/* Upload Box */}
            <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
              <Upload className="text-purple-500 mb-2" />
              <p className="text-sm font-medium">Identity Document</p>
              <p className="text-xs text-gray-400">PDF, JPG up to 10MB</p>
            </div>

            <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
              <Upload className="text-purple-500 mb-2" />
              <p className="text-sm font-medium">Address Proof</p>
              <p className="text-xs text-gray-400">PDF, JPG up to 10MB</p>
            </div>

          </div>
        </div>

        {/* WORK AUTHORIZATION */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between">
            <h2 className="font-semibold text-lg">Work Authorization Proof</h2>
            <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
              PENDING REVIEW
            </span>
          </div>

          <p className="text-gray-500 mt-2 text-sm">
            Upload visa/work permit documents.
          </p>

          {/* Uploaded File */}
          <div className="flex items-center justify-between mt-4 bg-gray-100 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <FileText />
              <div>
                <p className="text-sm font-medium">
                  Visa_Endorsement_2024.pdf
                </p>
                <p className="text-xs text-gray-400">
                  Uploaded • 2.4 MB
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Eye className="cursor-pointer" />
              <Trash2 className="cursor-pointer text-red-500" />
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Recent Activity</h2>

          <div className="bg-white rounded-xl p-4 flex justify-between">
            <div>
              <p className="text-sm font-medium">Identity_Card_Front.jpg</p>
              <p className="text-xs text-gray-400">Oct 10, 2023</p>
            </div>
            <span className="text-red-500 text-xs font-semibold">
              DELETED
            </span>
          </div>

          <div className="bg-white rounded-xl p-4 flex justify-between mt-2">
            <div>
              <p className="text-sm font-medium">
                Background_Consent_Form.pdf
              </p>
              <p className="text-xs text-gray-400">Oct 09, 2023</p>
            </div>
            <span className="text-blue-500 text-xs font-semibold">
              RECEIVED
            </span>
          </div>
        </div>

      </div>

      {/* RIGHT SIDEBAR */}
      <div className="w-80 space-y-6">

        {/* STATUS */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-2xl">
          <h3 className="font-semibold text-lg">Verification Status</h3>

          <div className="mt-4 space-y-3 text-sm">
            <p>✔ Personal Profile Verified</p>
            <p>⏳ Documents Pending</p>
          </div>

          <button className="mt-6 w-full bg-white text-purple-600 py-2 rounded-lg font-medium">
            Contact Support
          </button>
        </div>

        {/* GUIDELINES */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm font-semibold text-purple-600">
            UPLOAD GUIDELINES
          </h3>

          <ul className="mt-3 text-sm text-gray-500 space-y-2">
            <li>• All corners must be visible</li>
            <li>• Name must match ID</li>
            <li>• No password protected PDFs</li>
          </ul>
        </div>

      </div>
    </div>
  );
}