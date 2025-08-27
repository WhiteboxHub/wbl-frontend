
"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/admin_ui/dialog";
import { Label } from "@/components/admin_ui/label";
import { Badge } from "@/components/admin_ui/badge";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
}

const fieldSections: Record<string, string> = {

  id: "Basic Information",
  alias:"Basic Information",
  subject: "Basic Information",
  subject_id: "Basic Information",
  candidateid: "Basic Information",
  sessionid: "Basic Information",
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
  title: "Basic Information",
  contact: "Basic Information",
  phone: "Contact Information",
  Phone: "Contact Information",

  secondaryphone: "Basic Information",
  email: "Basic Information",
  secondaryemail: "Basic Information",
  ssn: "Basic Information",
  priority: "Basic Information",
  source: "Basic Information",
  // subject: "Basic Information",
  enrolleddate: "Basic Information",
  orientationdate: "Basic Information",
  batchname: "Basic Information",
  batchid: "Basic Information",
  agreement: "Basic Information",
  promissory: "Basic Information",

  full_name: "Basic Information",
  source_email: "Contact Information",
  linkedin_id: "Professional Information",
  company_name: "Professional Information",
  location: "Basic Information",
  
  vendor_id: "Basic Information",
  vendor_name: "Basic Information",
  vendor_email: "Basic Information",
  vendor_phone: "Contact Information",
  vendor_secondary_phone: "Contact Information",
  vendor_city: "Contact Information",
  vendor_address: "Contact Information",
  vendor_country: "Contact Information",
  vendor_status: "Professional Information",
  vendor_linkedin: "Professional Information",
  vendor_company: "Professional Information",

  course: "Professional Information",
  link: "Professional Information",
  videoid: "Professional Information",
  type: "Professional Information",
  company: "Professional Information",
  client_id: "Professional Information",
  client_name: "Professional Information",
  interview_time: "Professional Information",
  vendor_or_client_name: "Professional Information",
  vendor_or_client_contact: "Professional Information",
  marketing_email_address: "Professional Information",
  interview_date: "Professional Information",
  interview_mode: "Professional Information",
  status: "Professional Information",
  visa_status: "Professional Information",
  workstatus: "Professional Information",
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

const fieldLabels: Record<string, string> = {
  id: "ID",
  sessionid: "ID",
  subject_id: "Subject ID",
  videoid: "Video ID",
  candidateid: "Candidate ID",
  candidate_id: "Candidate ID",
  candidate_name: "Candidate Name",
  candidate_email: "Candidate Email",
  candidate_role: "Candidate Role",
  fullname: "Full Name",
  uname: "Email",
  ssn: "SSN",
  dob: "Date of Birth",
  phone: "Phone",
  secondaryphone: "Secondary Phone",
  email: "Email",
  secondaryemail: "Secondary Email",
  batchid: "Batch ID",
  batchname: "Batch Name",
  start_date: "Start Date",
  logincount: "Login Count",
  lastlogin: "Last Login",
  orientationdate: "Orientation Date",
  workstatus: "Work Status",
  visastatus: "Visa Status",
  work_authorization: "Work Authorization",
  marketing_email_address: "Marketing Email Address",
  client_id: "Client ID",
  registereddate: "Registered Date",
  level3date: "Level 3 Date",
  emergcontactname: "Emergency Contact Name",
  lastmoddatetime: "Last Mod Date Time",
  enddate: "End Date",
  sessiondate: "Session Date",
  emergcontactphone: "Emergency Contact Phone",
  emergcontactemail: "Emergency Contact Email",
  emergcontactaddrs: "Emergency Contact Address",
  spousename: "Spouse Name",
  spousephone: "Spouse Phone",
  spouseemail: "Spouse Email",
  spouseoccupationinfo: "Spouse Occupation Info",
};

export function ViewModal({ isOpen, onClose, data, title }: ViewModalProps) {
  if (!data) return null;

  const getStatusColor = (status: string) =>
    status?.toLowerCase() === "active"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

  const getVisaColor = (visa: string) => {
    switch (visa) {
      case "H1B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "Green Card":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "F1 Student":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "L1":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "OPT":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
      case "H4 EAD":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const toLabel = (key: string) => {
    if (fieldLabels[key]) return fieldLabels[key]; 
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderValue = (key: string, value: any) => {
    const lowerKey = key.toLowerCase();
    if (!value) return null;

    if (lowerKey === "status") {
      return <Badge className={getStatusColor(value)}>{value}</Badge>;
    }

    if (["visa", "workstatus"].includes(lowerKey)) {
      return <Badge className={getVisaColor(value)}>{value}</Badge>;
    }

    if (["feepaid", "feedue", "salary0", "salary6", "salary12"].includes(lowerKey)) {
      return <p className="text-sm font-medium dark:text-gray-200">${Number(value).toLocaleString()}</p>;
    }

    if (lowerKey.includes("rating")) {
      return <p className="text-sm font-medium dark:text-gray-200">{value} ⭐</p>;
    }

    return <p className="text-sm font-medium dark:text-gray-200">{String(value)}</p>;
  };

  // Organize data into sections
  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    "Other": [],
    "Notes": [],
  };

  Object.entries(data).forEach(([key, value]) => {
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
            {title} - View Details
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

        {/* Content Grid */}
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
                  {renderValue(key, value)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Notes Section Full Width */}
        {sectionedFields["Notes"].length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Notes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {sectionedFields["Notes"].map(({ key, value }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {toLabel(key)}
                  </Label>
                  {renderValue(key, value)}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
