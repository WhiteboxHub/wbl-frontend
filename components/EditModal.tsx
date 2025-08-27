
// "use client";
import React, { useState, useEffect } from "react";

// Import your existing UI components
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

// Country codes configuration
const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
];

// Field sections configuration
const fieldSections: Record<string, string> = {
  id: "Basic Information",
  sessionid: "Basic Information",
  subject_id: "Basic Information",
  candidateid: "Basic Information",
  uname: "Basic Information",
  fullname: "Basic Information",
  candidate_id: "Basic Information",
  candidate_email: "Basic Information",
  placement_date: "Basic Information",
  batch: "Basic Information",
  leadid: "Basic Information",
  name: "Basic Information",
  candidate_name: "Basic Information",
  candidate_role: "Basic Information",
  dob: "Basic Information",
  contact: "Basic Information",
  phone: "Basic Information",
  secondaryphone: "Basic Information",
  email: "Basic Information",
  secondaryemail: "Basic Information",
  ssn: "Basic Information",
  priority: "Basic Information",
  source: "Basic Information",
  subject: "Basic Information",
  title: "Basic Information",
  enrolleddate: "Basic Information",
  orientationdate: "Basic Information",
  batchname: "Basic Information",
  batchid: "Basic Information",
  agreement: "Basic Information",
  promissory: "Basic Information",
  status: "Basic Information",

  lastlogin: "Professional Information",
  logincount: "Professional Information",
  course: "Professional Information",
  registereddate: "Professional Information",
  company: "Professional Information",
  client_id: "Professional Information",
  client_name: "Professional Information",
  interview_time: "Professional Information",
  vendor_or_client_name: "Professional Information",
  vendor_or_client_contact: "Professional Information",
  marketing_email_address: "Professional Information",
  interview_date: "Professional Information",
  interview_mode: "Professional Information",
  visa_status: "Professional Information",
  work_status: "Professional Information",
  workstatus: "Professional Information",
  message: "Professional Information",
  education: "Professional Information",
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
  movet_to_candidate: "Professional Information",

  full_name: "Basic Information",
  secondary_email: "Basic Information",
  phone_number: "Basic Information",
  secondary_phone: "Contact Information",
  location: "Basic Information",
  linkedin_id: "Professional Information",
  company_name: "Professional Information",
  link: "Professional Information",
  type: "Professional Information",
  videoid: "Professional Information",
  
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
  last_modified: "Basic Information",
};

// Boolean options
// 1️⃣ Define boolean options separately
const booleanOptions = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

// 2️⃣ Define your column
const columnDefs = [
  {
    field: "moved_to_candidate",
    headerName: "Moved to Candidate",
    width: 180,
    editable: true, // enable editing
    cellEditor: "agSelectCellEditor",
    cellEditorParams: {
      values: booleanOptions.map(opt => opt.value), // ["true", "false"]
    },
    valueFormatter: ({ value }: any) => {
      const option = booleanOptions.find(opt => opt.value === value);
      return option ? option.label : value;
    },
    valueGetter: (params: any) => {
      // convert data to string "true" / "false" for dropdown
      return params.data.moved_to_candidate ? "true" : "false";
    },
  },
  // ... other columns
];


// Enum dropdown options
const enumOptions: Record<string, { value: string; label: string }[]> = {
  status: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "break", label: "Break" },
    { value: "discontinued", label: "Discontinued" },
    { value: "closed", label: "Closed" },
  ],
  work_status: [
    { value: "citizen", label: "Citizen" },
    { value: "visa", label: "Visa" },
    { value: "f1", label: "F1" },
    { value: "other", label: "Other" },
    { value: "green card", label: "Green Card" },
    { value: "permanent resident", label: "Permanent Resident" },
    { value: "h1b", label: "H1B" },
    { value: "ead", label: "EAD" },
    { value: "waiting for status", label: "Waiting for Status" },
  ],
  workstatus: [
    { value: "citizen", label: "Citizen" },
    { value: "visa", label: "Visa" },
    { value: "f1", label: "F1" },
    { value: "other", label: "Other" },
    { value: "green card", label: "Green Card" },
    { value: "permanent resident", label: "Permanent Resident" },
    { value: "h1b", label: "H1B" },
    { value: "ead", label: "EAD" },
    { value: "waiting for status", label: "Waiting for Status" },
  ],
  visa_status: [
    { value: "citizen", label: "Citizen" },
    { value: "visa", label: "Visa" },
    { value: "f1", label: "F1" },
    { value: "other", label: "Other" },
    { value: "green card", label: "Green Card" },
    { value: "permanent resident", label: "Permanent Resident" },
    { value: "h1b", label: "H1B" },
    { value: "ead", label: "EAD" },
    { value: "waiting for status", label: "Waiting for Status" },
  ],
  // Boolean fields

  agreement: booleanOptions,
  promissory: booleanOptions,
  closed: booleanOptions,
  is_active: booleanOptions,
  verified: booleanOptions,
};

// Custom label overrides
const labelOverrides: Record<string, string> = {
  id: "ID",
  subject_id: "Subject ID",
  new_subject_id: "New Subject ID",
  sessionid: "ID",
  courseid: "Course ID",
  candidateid: "Candidate ID",
  batchid: "Batch ID",
  candidate_id: "Candidate ID",
  candidate_email: "Candidate Email",
  uname: "Email",
  fullname: "Full Name",
  ssn: "SSN",
  dob: "Date of Birth",
  phone: "Phone",
  batchname: "Batch Name",
  secondaryphone: "Secondary Phone",
  email: "Email",
  videoid: "Video ID",
  secondaryemail: "Secondary Email",
  classdate: "Class Date",
  filename: "File Name",
  visa_status: "Visa Status",
  work_status: "Work Status",
  workstatus: "Work Status",
  lastlogin: "Last Login",
  logincount: "Login Count",
  level3date: "Level 3 Date",
  orientationdate: "Orientation Date",
  enddate: "End Date",
  startdate: "Start Date",
  sessiondate: "Session Date",
  lastmoddatetime: "Last Mod DateTime",
  registereddate: "Registered Date",
  movet_to_candidate: "Move to Candidate",
  last_modified: "Last Modified",
};

// Date fields configuration - these will display only the date portion (no time)
const dateFields = [
  "orientationdate", "startdate", "enddate", "placement_date", 
  "dob", "interview_date", "marketing_startdate", "statuschangedate",
  "last_modified", "enrolleddate", "lastlogin", "level3date", 
  "sessiondate", "lastmoddatetime", "registereddate"
];

// Time fields configuration
const timeFields = ["interview_time", "start_time", "end_time"];

// Phone fields configuration
const phoneFields = ["phone", "secondaryphone", "emergcontactphone", "spousephone", "contact", "phone_number", "secondary_phone"];

// Number fields configuration
const numberFields = ["salary0", "salary6", "salary12", "callsmade", "feepaid", "feedue", "logincount", "zip"];

// Phone Input Component
interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  error?: string;
  placeholder?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  error,
  placeholder = "(123) 456-7890"
}) => {
  const formatPhoneNumber = (value: string, code: string): string => {
    const digitsOnly = value.replace(/\D/g, '');
    
    switch (code) {
      case "+1": // US & Canada
        if (digitsOnly.length === 0) return "";
        if (digitsOnly.length <= 3) return `(${digitsOnly}`;
        if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
        return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
      
      case "+44": // UK
        if (digitsOnly.length <= 2) return digitsOnly;
        if (digitsOnly.length <= 5) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2)}`;
        if (digitsOnly.length <= 8) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 5)} ${digitsOnly.slice(5)}`;
        return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 5)} ${digitsOnly.slice(5, 8)} ${digitsOnly.slice(8)}`;
      
      case "+91": // India
        if (digitsOnly.length <= 5) return digitsOnly;
        return `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
      
      default:
        return digitsOnly;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    const formatted = formatPhoneNumber(digitsOnly, countryCode);
    onChange(formatted);
  };

  return (
    <div>
      <div className="flex gap-2">
        <select 
          value={countryCode} 
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="w-20 border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        >
          {countryCodes.map(country => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={value}
          onChange={handlePhoneChange}
          className="border border-gray-300 rounded-md p-2 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 flex-1"
          placeholder={placeholder}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export function EditModal({
  isOpen,
  onClose,
  data,
  title,
  onSave,
}: EditModalProps) {
  if (!data) return null;

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Process data to extract only date portion for date fields
    const processedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (dateFields.includes(key) && value && typeof value === 'string') {
        // Extract only the date portion (YYYY-MM-DD) from DateTime strings
        acc[key] = value.split('T')[0];
      } else {
        acc[key] = value;
      }
      
      // Initialize country code for phone fields
      if (phoneFields.includes(key) && !acc[`${key}_country`]) {
        acc[`${key}_country`] = "+1";
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    setFormData(processedData);
    setErrors({});
  }, [data]);

  const validatePhone = (key: string, value: any, countryCode: string = "+1"): string => {
    if (!value) return "";
    
    // Remove formatting characters
    const digitsOnly = value.replace(/\D/g, '');
    
    // Country-specific validation
    switch (countryCode) {
      case "+1": // US & Canada
        if (digitsOnly.length !== 10 && digitsOnly.length !== 11) {
          return "US/Canada numbers must be 10 or 11 digits";
        }
        break;
      case "+44": // UK
        if (digitsOnly.length < 10 || digitsOnly.length > 11) {
          return "UK numbers must be 10-11 digits";
        }
        break;
      case "+91": // India
        if (digitsOnly.length !== 10) {
          return "Indian numbers must be 10 digits";
        }
        break;
      default:
        if (digitsOnly.length < 8) {
          return "Phone number is too short";
        }
    }
    
    return "";
  };

  const validateField = (key: string, value: any): string => {
    if (phoneFields.includes(key) && value) {
      const countryCode = formData[`${key}_country`] || "+1";
      return validatePhone(key, value, countryCode);
    }
    
    if ((key === "email" || key === "secondaryemail" || key === "candidate_email") && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
    }
    
    if (key === "ssn" && value) {
      const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
      if (!ssnRegex.test(value)) {
        return "Please enter a valid SSN (XXX-XX-XXXX)";
      }
    }
    
    if (numberFields.includes(key) && value && isNaN(Number(value))) {
      return "Please enter a valid number";
    }
    
    // Special validation for emergency contacts
    if (key === "emergcontactphone" && value) {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        return "Emergency contact number must be at least 10 digits";
      }
    }
    
    // Special validation for spouse phone
    if (key === "spousephone" && value) {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        return "Spouse phone number must be at least 10 digits";
      }
    }
    
    return "";
  };

  const handleChange = (key: string, value: any) => {
    // Validate the field
    const error = validateField(key, value);
    setErrors(prev => ({ ...prev, [key]: error }));
    
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumberChange = (key: string, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');
    handleChange(key, numericValue);
  };

  const toLabel = (key: string) => {
    if (labelOverrides[key]) return labelOverrides[key];

    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Organize fields into sections
  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    "Other": [],
    "Notes": [],
  };

  Object.entries(formData).forEach(([key, value]) => {
    // Skip internal fields used for phone country codes
    if (key.endsWith('_country') || key.endsWith('_raw')) return;
    
    const section = fieldSections[key] || "Other";
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  const visibleSections = Object.keys(sectionedFields).filter(
    (section) => sectionedFields[section]?.length > 0
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      // Skip internal fields used for phone country codes
      if (key.endsWith('_country') || key.endsWith('_raw')) return;
      
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    
    // Only submit if there are no errors
    if (Object.keys(newErrors).length === 0) {
      // Create a clean data object without internal fields
      const cleanData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (!key.endsWith('_country') && !key.endsWith('_raw')) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      onSave(cleanData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${modalWidthClass} max-h-[80vh] overflow-y-auto p-0`}
      >
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          {/* Grid Sections except Notes */}
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
                        <div>
                          <input
                            type="date"
                            value={formData[key] ?? ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                        </div>
                      ) : timeFields.includes(key.toLowerCase()) ? (
                        <div>
                          <input
                            type="time"
                            value={formData[key] ?? ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                        </div>
                      ) : phoneFields.includes(key.toLowerCase()) ? (
                        <div>
                          <PhoneInput
                            value={formData[key] || ""}
                            onChange={(value) => handleChange(key, value)}
                            countryCode={formData[`${key}_country`] || "+1"}
                            onCountryCodeChange={(code) => handleChange(`${key}_country`, code)}
                            error={errors[key]}
                            placeholder={key === "emergcontactphone" || key === "spousephone" 
                              ? "Emergency contact number" 
                              : "(123) 456-7890"}
                          />
                        </div>
                      ) : numberFields.includes(key.toLowerCase()) ? (
                        <div>
                          <Input
                            value={formData[key] ?? ""}
                            onChange={(e) => handleNumberChange(key, e.target.value)}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                        </div>
                      ) : enumOptions[key.toLowerCase()] ? (
                        <div>
                          <select
                            value={formData[key]?.toString() || ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Select {toLabel(key)}</option>
                            {enumOptions[key.toLowerCase()].map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                        </div>
                      ) : typeof value === "string" && value.length > 100 ? (
                        <div>
                          <Textarea
                            value={formData[key] || ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="min-h-[100px]"
                          />
                          {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                        </div>
                      ) : key === "ssn" ? (
                        <div>
                          <Input
                            value={formData[key] ?? ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="XXX-XX-XXXX"
                            maxLength={11}
                          />
                          {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                        </div>
                      ) : (
                        <div>
                          <Input
                            value={formData[key] ?? ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                        </div>
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
                      className="w-full min-h-[120px]"
                    />
                    {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 pb-6 bg-gray-50 dark:bg-gray-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
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
