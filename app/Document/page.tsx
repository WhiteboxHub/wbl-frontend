"use client";

import { FileText, Upload, Eye, Trash2 } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">

      
      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 space-y-6">

        {/* HEADER */}
        <div>
          <p className="text-xs text-purple-500 font-semibold tracking-widest">
            COMPLIANCE & VERIFICATION
          </p>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-gray-500 mt-2">
            Please provide the necessary documentation to proceed with your application.
          </p>
        </div>

        {/* ID CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">ID and Address Proof</h2>
            <span className="text-xs bg-red-100 text-red-500 px-3 py-1 rounded-full">
              NOT UPLOADED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed rounded-xl p-6 text-center">
              <Upload className="mx-auto mb-2" />
              <p className="text-sm font-medium">Identity Document</p>
              <p className="text-xs text-gray-400">PDF, JPG up to 10MB</p>
            </div>

            <div className="border-2 border-dashed rounded-xl p-6 text-center">
              <Upload className="mx-auto mb-2" />
              <p className="text-sm font-medium">Address Proof</p>
              <p className="text-xs text-gray-400">PDF, JPG up to 10MB</p>
            </div>
          </div>
        </div>

        {/* WORK AUTH */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Work Authorization Proof</h2>
            <span className="text-xs bg-purple-100 text-purple-500 px-3 py-1 rounded-full">
              PENDING REVIEW
            </span>
          </div>

          <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <FileText />
              <div>
                <p className="text-sm font-medium">Visa_Endorsement_2024.pdf</p>
                <p className="text-xs text-gray-400">2.4 MB</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Eye className="w-4 h-4 cursor-pointer" />
              <Trash2 className="w-4 h-4 cursor-pointer text-red-500" />
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="w-80 p-6 space-y-6">

        {/* STATUS CARD */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-2xl">
          <h2 className="font-semibold mb-4">Verification Status</h2>

          <p className="text-sm">✔ Personal Profile Verified</p>
          <p className="text-sm mt-2">⏳ Documents Pending</p>

          <button className="mt-4 w-full bg-white text-black py-2 rounded-lg">
            Contact Support
          </button>
        </div>

        {/* GUIDELINES */}
        <div className="bg-white p-6 rounded-2xl">
          <h3 className="text-sm font-semibold mb-3">UPLOAD GUIDELINES</h3>

          <ul className="text-sm text-gray-500 space-y-2">
            <li>• All corners must be visible</li>
            <li>• Name must match ID</li>
            <li>• No password protected PDFs</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
