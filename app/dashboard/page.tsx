// export default function DashboardPage() {
//   
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

          </div>

          <p className="text-gray-500 mt-2 text-sm">
            Upload visa/work permit documents.
          </p>


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