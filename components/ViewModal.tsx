"use client";
import { useForm } from "react-hook-form";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/admin_ui/badge";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>[] | Record<string, any>;
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  title: string;
}

const excludedFields = [
  "candidate", "instructor1", "instructor2", "instructor3", "id", "sessionid",
  "vendor_type", "last_mod_datetime", "last_modified", "logincount", "googleId",
  "subject_id", "lastmoddatetime", "course_id", "new_subject_id", "instructor_1id",
  "instructor_2id", "instructor_3id", "instructor1_id", "instructor2_id",
  "instructor3_id", "enddate", "candidate_id", "batch"
];

const fieldSections: Record<string, string> = {
  candidate_full_name: "Basic Information",
  instructor1_name: "Professional Information",
  instructor2_name: "Professional Information",
  instructor3_name: "Professional Information",
  interviewer_emails: "Contact Information",
  interviewer_contact: "Contact Information",
  interviewer_linkedin: "Contact Information",
  id: "Basic Information",
  alias: "Basic Information",
  Fundamentals: "Basic Information",
  AIML: "Basic Information",
  full_name: "Basic Information",
  move_to_prep: "Basic Information",
  move_to_mrkt: "Basic Information",
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
  password: "Professional Information",
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
  company: "Professional Information",
  linkedin: "Contact Information",
  github: "Contact Information",
  resume: "Contact Information",
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
  job_posting_url: "Basic Information",
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
  secondary_email:"Contact Information",
  cm_course:"Professional Information",
  cm_subject: "Basic Information",
  material_type: "Basic Information",
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
  job_posting_url: "Job Posting URL",
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
  move_to_mrkt: "Move to Marketing",
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
  marketing_manager_obj: "Marketing Manager",
  subject_name: "Subject Name",
  recording_link: "Recording Link",
  transcript: "Transcript",
  backup_url: "Backup URL",
  cm_course: "Course Name",
  cm_subject: "Subject Name",
  subject: "Subject",
  type:"Type",
  material_type: "Material Type",
  link: "Link",
  workexperience:"Work Experience"
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

const courseMaterialHiddenFields = ["subjectid", "courseid", "type"];

// Title-specific exclusions
const getTitleSpecificExclusions = (title: string): string[] => {
  const lowerTitle = title.toLowerCase();
  const exclusions: string[] = [];
  
  // batches
  if (lowerTitle.includes('batch')) {
    exclusions.push('cm_subject', 'subject_name');
  }
  
  // class recordings
  if (lowerTitle.includes('recording') || lowerTitle.includes('class recording')) {
    exclusions.push('material_type', 'cm_subject', 'subject_name');
  }
  
  // sessions
  if (lowerTitle.includes('session') && !lowerTitle.includes('submission')) {
    exclusions.push('material_type', 'cm_subject', 'subject_name');
  }
  
  // vendors
  if (lowerTitle.includes('vendor')) {
    exclusions.push('material_type');
  }
  
  return exclusions;
};

// Priority fields that should be displayed first
const priorityFields = ['candidate_full_name', 'full_name', 'fullname', 'candidate_name'];

export function ViewModal({ isOpen, onClose, data, currentIndex = 0, onNavigate, title }: ViewModalProps) {
  const { register, watch, setValue, reset } = useForm();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!data) return null;

  const dataArray = Array.isArray(data) ? data : [data];
  const hasNavigation = Array.isArray(data) && data.length > 1 && onNavigate;

  const validIndex = Math.max(0, Math.min(currentIndex, dataArray.length - 1));
  const currentData = dataArray[validIndex];

  if (!currentData) return null;

  const isFirstContact = validIndex === 0;
  const isLastContact = validIndex === dataArray.length - 1;

  const handlePrevious = () => {
    if (!isFirstContact && onNavigate) {
      onNavigate(validIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLastContact && onNavigate) {
      onNavigate(validIndex + 1);
    }
  };

  const getStatusColor = (status: string | number | boolean | null | undefined): string => {
    let normalized: string;
    if (typeof status === "string") normalized = status.toLowerCase();
    else if (typeof status === "number" || typeof status === "boolean") normalized = status ? "active" : "inactive";
    else normalized = "inactive";
    return normalized === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getVisaColor = (visa: string) => {
    switch (visa?.toLowerCase()) {
      case "h1b": return "bg-blue-100 text-blue-800";
      case "green card": return "bg-emerald-100 text-emerald-800";
      case "f1": return "bg-purple-100 text-purple-800";
      case "h4":
      case "ead": return "bg-orange-100 text-orange-800";
      case "permanent resident": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const toLabel = (key: string) => labelOverrides[key] || key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const renderValue = (key: string, value: any) => {
    const lowerKey = key.toLowerCase();
    if (!value && value !== 0 && value !== false) return null;
    
    // Handle Employees modal specific fields
    if (title.toLowerCase().includes('employee')) {
      if (lowerKey === 'status') {
        const statusMap: Record<string, string> = {
          '1': 'Active',
          '0': 'Inactive',
          'active': 'Active',
          'inactive': 'Inactive'
        };
        const displayValue = statusMap[value] || value;
        return <Badge className={getStatusColor(value)}>{displayValue}</Badge>;
      }
      
      if (lowerKey === 'instructor') {
        const instructorMap: Record<string, string> = {
          '1': 'Yes',
          '0': 'No',
          'true': 'Yes',
          'false': 'No',
          'yes': 'Yes',
          'no': 'No'
        };
        const displayValue = instructorMap[value] || value;
        return <Badge className={value === '1' || value === 'true' || value === 'yes' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{displayValue}</Badge>;
      }
    }
    
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
    
    // Handle URL fields
    if (["recording_link", "transcript", "job_posting_url", "resume_url", "backup_recording_url", "linkedin", "github", "resume", "interviewer_linkedin", "url", "candidate_resume", "backup_url", "link"].includes(lowerKey)) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 break-all"
        >
          Click Here
        </a>
      );
    }
    
    // Handle email fields
    if (lowerKey.includes("email") || lowerKey.includes("mail")) {
      return (
        <a
          href={`mailto:${value}`}
          className="text-blue-600 underline hover:text-blue-800 break-all"
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
          className="text-blue-600 underline hover:text-blue-800"
        >
          {value}
        </a>
      );
    }
    
    return <p className="break-words">{String(value)}</p>;
  };

  const flattenData = (data: Record<string, any>) => {
    const flattened: Record<string, any> = { ...data };
    if (data.candidate) flattened.candidate_full_name = data.candidate.full_name;
    if (data.instructor1) flattened.instructor1_name = data.instructor1.name;
    if (data.instructor2) flattened.instructor2_name = data.instructor2.name;
    if (data.instructor3) flattened.instructor3_name = data.instructor3.name;

    if (data.course) {
      flattened.cm_course = data.course.name || data.course.course_name;
    }
    if (data.subject) {
      flattened.cm_subject = data.subject.name || data.subject.subject_name;
    }
    
    const typeMap: Record<string, string> = {
      'P': 'Presentations',
      'C': 'Cheatsheets',
      'D': 'Diagrams', 
      'S': 'Softwares',
      'I': 'Installations',
      'B': 'Books',
      'N': 'Newsletters',
      'M': 'Materials',
      'A': 'Assignments'
    };

    if (data.type && typeof data.type === 'object') {
      flattened.material_type = data.type.name || data.type.type_name;
    } else if (data.type) {
      flattened.material_type = typeMap[data.type] || data.type;
    }
    
    if (data.material_type && data.material_type.length === 1 && typeMap[data.material_type]) {
      flattened.material_type = typeMap[data.material_type];
    }

    return flattened;
  };

  const flattenedData = flattenData(currentData);
  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    "Other": [],
    "Notes": [],
  };

  const isCourseMaterial = title.toLowerCase().includes("course material") || 
                          title.toLowerCase().includes("material") ||
                          flattenedData.hasOwnProperty("cm_course");

  const isCandidateOrEmployee = title.toLowerCase().includes("candidate") || 
                                title.toLowerCase().includes("employee");


  const shouldPrioritizeFullName = [
    'Interviews',
    'Candidate Preparations', 
    'Placements',
    'Marketing Phase'
  ].some(modalTitle => title.includes(modalTitle));

  const titleExclusions = getTitleSpecificExclusions(title);


  const allFields: { key: string; value: any; section: string }[] = [];
  
  Object.entries(flattenedData).forEach(([key, value]) => {
    // Skip excluded fields
    if (excludedFields.includes(key)) return;
    
    if (isCourseMaterial && courseMaterialHiddenFields.includes(key)) return;
    
    if (titleExclusions.includes(key)) return;
    
    if (isCandidateOrEmployee && key === "name") return;
    
    const section = fieldSections[key] || "Other";
    allFields.push({ key, value, section });
  });

  // Sort fields: priority fields first, then others
  const sortedFields = allFields.sort((a, b) => {
    const aIsPriority = priorityFields.includes(a.key);
    const bIsPriority = priorityFields.includes(b.key);
    
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    return 0;
  });

  // Group into sections
  sortedFields.forEach(({ key, value, section }) => {
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  // For specific modals, ensure full_name fields are first in Basic Information
  if (shouldPrioritizeFullName && sectionedFields["Basic Information"]) {
    sectionedFields["Basic Information"].sort((a, b) => {
      const aIsFullName = priorityFields.includes(a.key);
      const bIsFullName = priorityFields.includes(b.key);
      
      if (aIsFullName && !bIsFullName) return -1;
      if (!aIsFullName && bIsFullName) return 1;
      return 0;
    });
  }

  // For course materials
  if (isCourseMaterial && sectionedFields["Professional Information"]) {
    const basicInfoFields = sectionedFields["Professional Information"];
    const courseNameIndex = basicInfoFields.findIndex(item => 
      item.key === "cm_course" || item.key === "course_name"
    );
    
    if (courseNameIndex > -1) {
      const courseNameField = basicInfoFields.splice(courseNameIndex, 1)[0];
      basicInfoFields.unshift(courseNameField);
    }
  }

  const visibleSections = Object.keys(sectionedFields).filter(section => section !== "Notes" && sectionedFields[section]?.length > 0);
  const columnCount = Math.min(visibleSections.length, 4);

  const getModalWidth = () => {
    switch (columnCount) {
      case 1: return 'max-w-md';
      case 2: return 'max-w-2xl';
      case 3: return 'max-w-4xl';
      case 4: return 'max-w-5xl';
      default: return 'max-w-2xl';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
          <div 
            ref={modalRef}
            className={`bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full ${getModalWidth()} max-h-[90vh] overflow-y-auto`}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-1 sm:py-1.5 border-b border-blue-200 flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {title} - View Details
              </h2>
              <button
                onClick={onClose}
                className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 p-1 rounded-lg transition"
              >
                <X size={12} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 md:p-5 bg-white">
              <form>
                {/* Content Grid */}
                <div className={`grid grid-cols-1 ${columnCount >= 2 ? 'md:grid-cols-2' : ''} ${columnCount >= 3 ? 'lg:grid-cols-3' : ''} ${columnCount >= 4 ? 'xl:grid-cols-4' : ''} gap-3 sm:gap-4`}>
                  {visibleSections.map(section => (
                    <div key={section} className="space-y-2 sm:space-y-3">
                      <h3 className="text-sm sm:text-base font-bold text-blue-700 border-b border-blue-200 pb-1 sm:pb-2">
                        {section}
                      </h3>
                      <div className="space-y-1.5 sm:space-y-2">
                        {sectionedFields[section].map(({ key, value }) => (
                          <div key={key} className="space-y-1">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">
                              {toLabel(key)}
                            </label>
                            <div className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-blue-200 rounded-lg bg-white min-h-[2rem]">
                              {renderValue(key, value) || <span className="text-gray-400">-</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes Section */}      
                {sectionedFields["Notes"]?.length > 0 && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-blue-200">
                  <div className="space-y-2 sm:space-y-3">
                    {sectionedFields["Notes"].map(({ key, value }) => (
                      <div key={key} className="space-y-1">
                        <label className="block text-xs sm:text-sm font-bold text-blue-700">
                          {toLabel(key)}
                        </label>
                        <div className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-blue-200 rounded-lg bg-white min-h-[60px]">
                          <div 
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: value || "" }}
                          />
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                  )}
                {/* Navigation */}
                {hasNavigation && (
                  <div className="flex justify-between items-center mt-3 p-2 bg-blue-50 rounded-md">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      disabled={isFirstContact}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 min-w-[90px] sm:min-w-[100px] justify-center ${
                        isFirstContact
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    <span className="text-xs sm:text-sm font-bold text-indigo-700 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm">
                      {validIndex + 1} of {dataArray.length}
                    </span>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isLastContact}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 min-w-[90px] sm:min-w-[100px] justify-center ${
                        isLastContact
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg"
                      }`}
                    >
                      Next
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
