"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/admin_ui/dialog";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Textarea } from "@/components/admin_ui/textarea";
import { useState } from "react";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
  onSave: (updatedData: Record<string, any>) => void;
}

const fieldSections: Record<string, string> = {
  candidateid: "Basic Information",
  candidate_id: "Basic Information",
  candidate_name: "Basic Information",
  candidate_email: "Basic Information",
  candidate_role: "Basic Information",
  id: "Basic Information",
  start_date: "Basic Information",
  startdate: "Basic Information",
  leadid: "Basic Information",
  batch: "Basic Information",
  name: "Basic Information",
  dob: "Basic Information",
  contact: "Basic Information",
  phone: "Basic Information",
  secondaryphone: "Basic Information",
  email: "Basic Information",
  secondaryemail: "Basic Information",
  ssn: "Basic Information",
  priority: "Basic Information",
  source: "Basic Information",
  enrolleddate: "Basic Information",
  batchname: "Basic Information",
  batchid: "Basic Information",
  term: "Basic Information",
  agreement: "Basic Information",
  promissory: "Basic Information",

  course: "Professional Information",
  role: "Professional Information",
  job_location: "Professional Information",
  interview_time: "Professional Information",
  interview_date: "Professional Information",
  status: "Professional Information",
  workstatus: "Professional Information",
  work_authorization: "Professional Information",
  marketing_email_address: "Professional Information",
  company: "Professional Information",
  client_id: "Professional Information",
  education: "Professional Information",
  placement_date: "Professional Information",
  workexperience: "Professional Information",
  faq: "Professional Information",
  callsmade: "Professional Information",
  feepaid: "Professional Information",
  feedue: "Professional Information",
  salary0: "Professional Information",
  salary6: "Professional Information",
  salary12: "Professional Information",
  instructor: "Professional Information",
  second_instructor: "Professional Information",
  marketing_startdate: "Professional Information",
  recruiterassesment: "Professional Information",
  statuschangedate: "Professional Information",
  closed: "Professional Information",

    // Basic Information
  full_name: "Basic Information",
  secondary_email: "Basic Information",
  phone_number: "Basic Information",
  secondary_phone: "Contact Information",
  location: "Basic Information",
  linkedin_id: "Professional Information",
  company_name: "Professional Information",

  address: "Contact Information",
  city: "Contact Information",
  state: "Contact Information",
  country: "Contact Information",
  zip: "Contact Information",

  emergcontactname: "Emergency Contact",
  emergcontactemail: "Emergency Contact",
  emergcontactphone: "Emergency Contact",
  emergcontactaddrs: "Emergency Contact",
  spousename: "Emergency Contact",
  spousephone: "Emergency Contact",
  spouseemail: "Emergency Contact",
  spouseoccupationinfo: "Emergency Contact",

  notes: "Notes",
};

export function EditModal({ isOpen, onClose, data, title, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(data || {});

  if (!data) return null;

  const toLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    "Other": [],
    "Notes": [],
  };

  Object.entries(formData).forEach(([key, value]) => {
    const section = fieldSections[key] || "Other";
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  const visibleSections = Object.keys(sectionedFields).filter(
    (section) => section !== "Notes" && sectionedFields[section]?.length > 0
  );

  const columnCount = Math.min(visibleSections.length, 4);

  const modalWidthClass = {
    1: "max-w-xl",
    2: "max-w-3xl",
    3: "max-w-5xl",
    4: "max-w-6xl",
  }[columnCount] || "max-w-6xl";

  const gridColsClass = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "lg:grid-cols-4 md:grid-cols-2",
  }[columnCount] || "lg:grid-cols-4 md:grid-cols-2";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${modalWidthClass} max-h-[80vh] overflow-y-auto p-0`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title} - Edit Details
          </DialogTitle>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-white focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
            onClose();
          }}
        >
          <div className={`grid ${gridColsClass} gap-6 p-6`}>
            {visibleSections.map((section) => (
              <div key={section} className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  {section}
                </h3>
                {sectionedFields[section].map(({ key, value }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {toLabel(key)}
                    </Label>
                    {typeof value === "string" && value.length > 100 ? (
                      <Textarea
                        value={formData[key] || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                    ) : (
                      <Input
                        value={formData[key] ?? ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Notes Section */}
          {sectionedFields["Notes"].length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Notes
              </h3>
              <div className="space-y-6 mt-4">
                {sectionedFields["Notes"].map(({ key, value }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {toLabel(key)}
                  </Label>
                  <Textarea
                    value={formData[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full"
                  />
                  </div>
                ))}
            </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
