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

const excludedFields = [
  "candidate", "instructor1", "instructor2", "instructor3", "id", "sessionid",
  "vendor_type", "last_mod_datetime", "last_modified", "logincount", "googleId",
  "subject_id", "lastmoddatetime", "course_id", "new_subject_id", "instructor_1id",
  "instructor_2id", "instructor_3id", "instructor1_id", "instructor2_id",
  "instructor3_id", "enddate", "candidate_id"
];

const fieldSections: Record<string, string> = {
  candidate_full_name: "Basic Information",
  instructor1_name: "Professional Information",
  instructor2_name: "Professional Information",
  instructor3_name: "Professional Information",
  interviewer_emails: "Contact Information",
  interviewer_contact: "Contact Information",
  cm_course:"Professional Information",
  id: "Basic Information",
  alias: "Basic Information",
  Fundamentals: "Basic Information",
  AIML: "Basic Information",
  full_name: "Basic Information",
  email: "Basic Information",
  phone: "Basic Information",
  status: "Basic Information",
  batchid: "Contact Information",
  batch: "Basic Information",
  start_date: "Basic Information",
  batchname: "Basic Information",
  target_date_of_marketing: "Basic Information",
  linkedin_id: "Contact Information",
  enrolled_date: "Professional Information",
  startdate: "Professional Information",
  type: "Professional Information",
  company_name: "Professional Information",
  linkedin_connected: "Professional Information",
  intro_email_sent: "Professional Information",
  intro_call: "Professional Information",
  moved_to_vendor: "Professional Information",
  phone_number: "Basic Information",
  secondary_phone: "Contact Information",
  last_mod_datetime: "Contact Information",
  location: "Contact Information",
  agreement: "Professional Information",
  subject_id: "Basic Information",
  subjectid: "Professional Information",
  courseid: "Professional Information",
  candidateid: "Basic Information",
  uname: "Basic Information",
  fullname: "Basic Information",
  candidate_id: "Basic Information",
  candidate_email: "Basic Information",
  placement_date: "Basic Information",
  leadid: "Basic Information",
  name: "Basic Information",
  enddate: "Professional Information",
  candidate_name: "Basic Information",
  candidate_role: "Basic Information",
  google_voice_number: "Professional Information",
  dob: "Basic Information",
  contact: "Basic Information",
  password: "Basic Information",
  secondaryemail: "Contact Information",
  ssn: "Professional Information",
  priority: "Basic Information",
  source: "Basic Information",
  subject: "Basic Information",
  title: "Basic Information",
  enrolleddate: "Basic Information",
  orientationdate: "Basic Information",
  promissory: "Basic Information",
  lastlogin: "Professional Information",
  logincount: "Professional Information",
  course: "Professional Information",
  registereddate: "Professional Information",
  company: "Basic Information",
  client_id: "Professional Information",
  client_name: "Professional Information",
  interview_time: "Professional Information",
  vendor_or_client_name: "Professional Information",
  vendor_or_client_contact: "Professional Information",
  marketing_email_address: "Professional Information",
  interview_date: "Professional Information",
  interview_mode: "Professional Information",
  visa_status: "Professional Information",
  workstatus: "Basic Information",
  message: "Professional Information",
  education: "Professional Information",
  workexperience: "Professional Information",
  faq: "Professional Information",
  callsmade: "Professional Information",
  fee_paid: "Professional Information",
  feedue: "Professional Information",
  salary0: "Professional Information",
  salary6: "Professional Information",
  salary12: "Professional Information",
  instructor: "Professional Information",
  second_instructor: "Professional Information",
  marketing_startdate: "Professional Information",
  recruiterassesment: "Professional Information",
  statuschangedate: "Professional Information",
  aadhaar: "Basic Information",
  url: "Basic Information",
  feedback: "Basic Information",
  entry_date: "Professional Information",
  closed_date: "Professional Information",
  closed: "Professional Information",
  massemail_email_sent: "Contact Information",
  massemail_unsubscribe: "Contact Information",
  moved_to_candidate: "Contact Information",
  link: "Professional Information",
  videoid: "Professional Information",
  address: "Professional Information",
  candidate_folder: "Professional Information",
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
  course_name: "Professional Information",
  subject_name: "Basic Information",
  employee_name: "Basic Information",
  secondaryphone: "Contact Information",
  cm_subject:"Basic Information",
  material_type:"Basic Information",
  // recording_link: "Professional Information",
  // transcript: "Professional Information",
  // backup_url: "Professional Information",
};

const workVisaStatusOptions = [
  { value: "waiting for status", label: "Waiting for Status" },
  { value: "citizen", label: "Citizen" },
  { value: "f1", label: "F1" },
  { value: "other", label: "Other" },
  { value: "permanent resident", label: "Permanent Resident" },
  { value: "h4", label: "H4" },
  { value: "ead", label: "EAD" },
  { value: "green card", label: "Green Card" },
  { value: "h1b", label: "H1B" },
];

const labelOverrides: Record<string, string> = {
  candidate_full_name: "Candidate Full Name",
  instructor1_name: "Instructor 1 Name",
  instructor2_name: "Instructor 2 Name",
  instructor3_name: "Instructor 3 Name",
  id: "ID",
  subject_id: "Subject ID",
  subjectid: "Subject ID",
  new_subject_id: "New Subject ID",
  sessionid: "ID",
  courseid: "Course ID",
  course_id: "Course ID",
  candidateid: "Candidate ID",
  batchid: "Batch",
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
  massemail_email_sent: "Massemail Email Sent",
  massemail_unsubscribe: "Massemail Unsubscribe",
  moved_to_candidate: "Moved To Candidate",
  emergcontactname: "Contact Name",
  candidate_folder: "Candidate Folder Link",
  emergcontactphone: "Contact Phone",
  emergcontactemail: "Contact Email",
  emergcontactaddrs: "Contact Address",
  course_name: "Course Name",
  subject_name: "Subject Name",
  recording_link: "Recording Link",
  transcript: "Transcript",
  url: "Job URL",
  backup_url: "Backup URL",
  cm_course: "Course Name",
  cm_subject: "Subject Name",
  subject: "Subject"
};

const dateFields = [
  "orientationdate",
  "start_date",
  "enddate",
  "closed_date",
  "entry_date",
  "created_at",
  "dob",
  "classdate",
  "sessiondate",
  "enrolled_date",
  "interview_date",
  "placement_date",
  "target_date_of_marketing",
];

export function ViewModal({ isOpen, onClose, data, title }: ViewModalProps) {
  if (!data) return null;

  const getStatusColor = (status: string | number | boolean | null | undefined): string => {
    let normalized: string;
    if (typeof status === "string") normalized = status.toLowerCase();
    else if (typeof status === "number" || typeof status === "boolean") normalized = status ? "active" : "inactive";
    else normalized = "inactive";
    return normalized === "active"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  const getVisaColor = (visa: string) => {
    switch (visa?.toLowerCase()) {
      case "h1b": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "green card": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "f1": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "h4":
      case "ead": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "permanent resident": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const toLabel = (key: string) => labelOverrides[key] || key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const renderValue = (key: string, value: any) => {
    const lowerKey = key.toLowerCase();
    if (!value) return null;
    if (typeof value === "object" && value !== null) {
      if (key.includes("candidate") && value.full_name) return <p>{value.full_name}</p>;
      if (key.includes("instructor") && value.name) return <p>{value.name}</p>;
      return <p>{JSON.stringify(value)}</p>;
    }
    if (dateFields.includes(lowerKey)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return <p>{date.toISOString().split("T")[0]}</p>;
    }
    if (lowerKey === "status") return <Badge className={getStatusColor(value)}>{value}</Badge>;
    if (["visa_status", "workstatus"].includes(lowerKey)) return <Badge className={getVisaColor(value)}>{value}</Badge>;
    if (["feepaid", "feedue", "salary0", "salary6", "salary12"].includes(lowerKey)) return <p>${Number(value).toLocaleString()}</p>;
    if (lowerKey.includes("rating")) return <p>{value} ⭐</p>;
    if (["notes", "task"].includes(lowerKey)) return <div dangerouslySetInnerHTML={{ __html: value }} />;
    if (["recording_link", "transcript", "url","candidate_resume","backup_url"].includes(lowerKey)) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Click here
        </a>
      );
    }
    // Handle email fields
    if (lowerKey.includes("email") || lowerKey.includes("mail")) {
      return (
        <a
          href={`mailto:${value}`}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {value}
        </a>
      );
    }
    // Handle phone fields
    if (lowerKey.includes("phone") || lowerKey.includes("contact")) {
      return (
        <a
          href={`tel:${value}`}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {value}
        </a>
      );
    }
    return <p>{String(value)}</p>;
  };

  const flattenData = (data: Record<string, any>) => {
    const flattened: Record<string, any> = { ...data };
    if (data.candidate) flattened.candidate_full_name = data.candidate.full_name;
    if (data.instructor1) flattened.instructor1_name = data.instructor1.name;
    if (data.instructor2) flattened.instructor2_name = data.instructor2.name;
    if (data.instructor3) flattened.instructor3_name = data.instructor3.name;
    return flattened;
  };

  const flattenedData = flattenData(data);

  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    "Other": [],
    "Notes": [],
  };

  Object.entries(flattenedData).forEach(([key, value]) => {
    if (excludedFields.includes(key)) return;
    const section = fieldSections[key] || "Other";
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  const visibleSections = Object.keys(sectionedFields).filter(section => section !== "Notes" && sectionedFields[section]?.length > 0);
  const columnCount = Math.min(visibleSections.length, 4);
  const modalWidthClass = { 1: "max-w-xl", 2: "max-w-3xl", 3: "max-w-5xl", 4: "max-w-6xl" }[columnCount] || "max-w-6xl";
  const gridColsClass = { 1: "grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "lg:grid-cols-4 md:grid-cols-2" }[columnCount] || "lg:grid-cols-4 md:grid-cols-2";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${modalWidthClass} max-h-[80vh] overflow-y-auto p-0`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title} - View Details
          </DialogTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-white focus:outline-none" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Content Grid */}
        <div className={`grid ${gridColsClass} gap-6 p-6`}>
          {visibleSections.map(section => (
            <div key={section} className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">{section}</h3>
              {sectionedFields[section].map(({ key, value }) => (
                <div key={key} className="grid grid-cols-3 gap-4 items-start py-1">
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{toLabel(key)}</div>
                  <div className="col-span-2 text-sm font-medium text-gray-900 dark:text-gray-200">{renderValue(key, value)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* Notes Section */}
        {sectionedFields["Notes"]?.length > 0 && (
          <div className="px-6 pb-6">
            <div className="space-y-6 mt-4">
              {sectionedFields["Notes"].map(({ key, value }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">{toLabel(key)}</Label>
                  <div className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100 bg-gray-50">
                    <p className="whitespace-pre-wrap text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
