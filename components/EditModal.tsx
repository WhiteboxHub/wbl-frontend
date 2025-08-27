"use client";
import React from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/admin_ui/dialog";
import { Label } from "@/components/admin_ui/label";
import { Input } from "@/components/admin_ui/input";
import { Textarea } from "@/components/admin_ui/textarea";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
  onSave: (updatedData: Record<string, any>) => void;
}

const fieldSections: Record<string, string> = {
  id: "Basic Information",
  full_name: "Basic Information",
  extraction_date: "Basic Information", 
  type: "Basic Information",

  email: "Professional Information",
  company_name: "Professional Information",
  linkedin_id: "Professional Information",
  status: "Professional Information",
  linkedin_connected: "Professional Information",
  intro_email_sent: "Professional Information",
  intro_call: "Professional Information",
  moved_to_vendor: "Professional Information",
  phone_number: "Contact Information",
  secondary_phone: "Contact Information",
  location: "Contact Information", 

  // notes: "Notes",
};

const enumOptions: Record<string, { value: string; label: string }[]> = {
  type: [
    { value: "client", label: "Client" },
    { value: "third-party-vendor", label: "Third Party Vendor" },
    { value: "implementation-partner", label: "Implementation Partner" },
    { value: "sourcer", label: "Sourcer" },
    { value: "contact-from-ip", label: "Contact from IP" },
  ],
  status: [
    { value: "active", label: "Active" },
    { value: "working", label: "Working" },
    { value: "not_useful", label: "Not Useful" },
    { value: "do_not_contact", label: "Do Not Contact" },
    { value: "inactive", label: "Inactive" },
    { value: "prospect", label: "Prospect" },
  ],
  linkedin_connected: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
  intro_email_sent: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
  intro_call: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
  moved_to_vendor: [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ]

};

const labelOverrides: Record<string, string> = {
  id: "ID",
  full_name: "Full Name",
  phone_number: "Phone Number",
  secondary_phone: "Secondary Phone",
  email: "Email",
  company_name: "Company Name",
  type: "Type",
  linkedin_id: "LinkedIn ID",
  linkedin_connected: "LinkedIn Connected",
  intro_email_sent: "Intro Email Sent",
  intro_call: "Intro Call",
  location: "Location",
  status: "Status",
  created_at: "Created At",
  notes: "Notes",
  extraction_date: "Extraction Date", 
};

const dateFields = ["created_at", "extraction_date"];

export function EditModal({
  isOpen,
  onClose,
  data,
  title,
  onSave,
}: EditModalProps) {
  if (!data) return null;

  const [formData, setFormData] = React.useState<Record<string, any>>(data);

  React.useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toLabel = (key: string) => {
    if (labelOverrides[key]) return labelOverrides[key];
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Other": [],
    "Notes": [],
  };

  Object.entries(formData).forEach(([key, value]) => {
    const section = fieldSections[key] || "Other";
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  const visibleSections = [
    "Basic Information",
    "Professional Information",
    "Contact Information",
    "Other",
    "Notes",
  ].filter((section) => sectionedFields[section]?.length > 0);

  const columnCount = Math.min(
    visibleSections.filter((s) => s !== "Notes").length,
    4
  );

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
      <DialogContent
        className={`${modalWidthClass} max-h-[80vh] overflow-y-auto p-0`}
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title} - Edit Details
          </DialogTitle>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-white focus:outline-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
            onClose();
          }}
        >
          <div className={`grid ${gridColsClass} gap-6 p-6`}>
            {visibleSections
              .filter((section) => section !== "Notes")
              .map((section) => (
                <div key={section} className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {section}
                  </h3>
                  {sectionedFields[section].map(({ key, value }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {toLabel(key)}
                      </Label>

                      {dateFields.includes(key.toLowerCase()) ? (
                        <input
                          type="date"
                          value={
                            formData[key]
                              ? new Date(formData[key])
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) => handleChange(key, e.target.value)}
                          className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                        />
                      ) : enumOptions[key.toLowerCase()] ? (
                        <select
                          value={formData[key] ?? ""}
                          onChange={(e) => handleChange(key, e.target.value)}
                          className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">Select {toLabel(key)}</option>
                          {enumOptions[key.toLowerCase()].map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : typeof value === "string" && value.length > 100 ? (
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

          {sectionedFields["Notes"].length > 0 && (
            <div className="px-6 pb-6 col-span-full">
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

          <div className="flex justify-end px-6 pb-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
            >
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
