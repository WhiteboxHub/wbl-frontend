// whiteboxLearning-wbl/components/EditCandidateWrapper.tsx
"use client";
import { useState } from "react";
import axios from "axios";
import { EditModal } from "./EditModal";

interface EditCandidateWrapperProps {
  candidate: any; // Replace with your Candidate type if available
  refreshData?: () => void; // optional callback to refresh list
}

export default function EditCandidateWrapper({
  candidate,
  refreshData,
}: EditCandidateWrapperProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleSave = async (formData: any) => {
    try {
      const candidateId = formData.candidateid;
      await axios.put(`/api/candidates/${candidateId}`, formData);

      refreshData?.(); // Refresh table/list if provided
      setIsEditOpen(false); // Close modal
    } catch (error: any) {
      console.error("Update failed:", error.response?.data || error.message);
      alert("Failed to update candidate.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsEditOpen(true)}
        className="text-blue-600 hover:underline"
      >
        Edit
      </button>

      <EditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSave}
        data={candidate}
        title="Candidate"
      />
    </>
  );
}
