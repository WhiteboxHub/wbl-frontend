"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/admin_ui/dialog";
import { Label } from "@/components/admin_ui/label";
import { Input } from "@/components/admin_ui/input";
import { Textarea } from "@/components/admin_ui/textarea";
import axios from "axios";

interface Batch {
  batchid: number;
  batchname: string;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
  onSave: (updatedData: Record<string, any>) => void;
  batches: Batch[];
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
  start_date: "Professional Information",
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
  recording_link: "Professional Information",
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
  cm_subject: "Basic Information",
  cm_course: "Professional Information",
  material_type: "Basic Information",
};

// Type mapping for course materials ONLY
const COURSE_MATERIAL_TYPE_MAPPING = {
  P: "Presentations",
  C: "Cheatsheets",
  D: "Diagrams",
  S: "Softwares",
  I: "Installations",
  B: "Books",
  N: "Newsletters",
  M: "Materials",
};

const COURSE_MATERIAL_TYPE_OPTIONS = [
  { value: "P", label: "Presentations" },
  { value: "C", label: "Cheatsheets" },
  { value: "D", label: "Diagrams" },
  { value: "S", label: "Softwares" },
  { value: "I", label: "Installations" },
  { value: "B", label: "Books" },
  { value: "N", label: "Newsletters" },
  { value: "M", label: "Materials" },
];

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

const reorderYesNoOptions = (
  key: string,
  value: any,
  options: { value: string; label: string }[]
) => {
  if (
    ["linkedin_connected", "intro_email_sent", "intro_call", "moved_to_vendor", "moved_to_candidate"].includes(
      key.toLowerCase()
    )
  ) {
    const val = String(value).toLowerCase();
    return val === "yes" || val === "true"
      ? [...options.filter((o) => o.value === "yes" || o.value === "true"), ...options.filter((o) => !(o.value === "yes" || o.value === "true"))]
      : [...options.filter((o) => o.value === "no" || o.value === "false"), ...options.filter((o) => !(o.value === "no" || o.value === "false"))];
  }
  return options;
};

const vendorStatuses = [
  { value: "active", label: "Active" },
  { value: "working", label: "Working" },
  { value: "not_useful", label: "Not Useful" },
  { value: "do_not_contact", label: "Do Not Contact" },
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
];

const enumOptions: Record<string, { value: string; label: string }[]> = {
  type: [
    { value: "client", label: "Client" },
    { value: "third-party-vendor", label: "Third Party Vendor" },
    { value: "implementation-partner", label: "Implementation Partner" },
    { value: "sourcer", label: "Sourcer" },
    { value: "contact-from-ip", label: "Contact from IP" },
  ],
  linkedin_connected: [
    { value: "no", label: "No" },
    { value: "yes", label: "Yes" },
  ],
  intro_email_sent: [
    { value: "no", label: "No" },
    { value: "yes", label: "Yes" },
  ],
  intro_call: [
    { value: "no", label: "No" },
    { value: "yes", label: "Yes" },
  ],
  moved_to_vendor: [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ],
  moved_to_candidate: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  massemail_email_sent: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  mass_email_sent: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  massemail_unsubscribe: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  agreement: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  status: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "break", label: "Break" },
    { value: "discontinued", label: "Discontinued" },
    { value: "closed", label: "Closed" },
  ],
  work_status: workVisaStatusOptions,
  workstatus: workVisaStatusOptions,
  visa_status: workVisaStatusOptions,
  mode_of_interview: [
    { value: "Virtual", label: "Virtual" },
    { value: "In Person", label: "In Person" },
    { value: "Phone", label: "Phone" },
    { value: "Assessment", label: "Assessment" },
  ],
  type_of_interview: [
    { value: "Assessment", label: "Assessment" },
    { value: "Recruiter Call", label: "Recruiter Call" },
    { value: "Technical", label: "Technical" },
    { value: "HR Round", label: "HR Round" },
    { value: "In Person", label: "In Person" },
    { value: "Prep Call", label: "Prep Call" },
  ],
  feedback:  [
  { value: 'Pending', label: 'Pending' },
  { value: 'Positive', label: 'Positive' },
  { value: 'Negative', label: 'Negative' },
],
};

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
  uname: "Email",
  fullname: "Full Name",
  candidate_id: "Candidate ID",
  candidate_email: "Candidate Email",
  placement_date: "Placement Date",
  leadid: "Lead ID",
  name: "Name",
  enddate: "End Date",
  candidate_name: "Candidate Name",
  candidate_role: "Candidate Role",
  google_voice_number: "Google Voice Number",
  dob: "Date of Birth",
  contact: "Contact",
  password: "Password",
  secondaryemail: "Secondary Email",
  ssn: "SSN",
  priority: "Priority",
  source: "Source",
  subject: "Subject",
  title: "Title",
  enrolleddate: "Enrolled Date",
  orientationdate: "Orientation Date",
  promissory: "Promissory",
  lastlogin: "Last Login",
  logincount: "Login Count",
  course: "Course",
  registereddate: "Registered Date",
  company: "Company",
  client_id: "Client ID",
  client_name: "Client Name",
  interview_time: "Interview Time",
  vendor_or_client_name: "Vendor/Client Name",
  vendor_or_client_contact: "Vendor/Client Contact",
  marketing_email_address: "Marketing Email Address",
  interview_date: "Interview Date",
  interview_mode: "Interview Mode",
  visa_status: "Visa Status",
  workstatus: "Work Status",
  message: "Message",
  education: "Education",
  workexperience: "Work Experience",
  faq: "FAQ",
  callsmade: "Calls Made",
  fee_paid: "Fee Paid",
  feedue: "Fee Due",
  salary0: "Salary (0 months)",
  salary6: "Salary (6 months)",
  salary12: "Salary (12 months)",
  instructor: "Instructor",
  second_instructor: "Second Instructor",
  marketing_startdate: "Marketing Start Date",
  recruiterassesment: "Recruiter Assessment",
  statuschangedate: "Status Change Date",
  aadhaar: "Aadhaar",
  url: "Job URL",
  feedback: "Feedback",
  entry_date: "Entry Date",
  closed_date: "Closed Date",
  closed: "Closed",
  massemail_email_sent: "Mass Email Sent",
  massemail_unsubscribe: "Mass Email Unsubscribe",
  moved_to_candidate: "Moved to Candidate",
  link: "Link",
  videoid: "Video ID",
  address: "Address",
  candidate_folder: "Candidate Folder",
  city: "City",
  state: "State",
  country: "Country",
  zip: "ZIP",
  emergcontactname: "Emergency Contact Name",
  emergcontactemail: "Emergency Contact Email",
  emergcontactphone: "Emergency Contact Phone",
  emergcontactaddrs: "Emergency Contact Address",
  spousename: "Spouse Name",
  spousephone: "Spouse Phone",
  spouseemail: "Spouse Email",
  spouseoccupationinfo: "Spouse Occupation Info",
  notes: "Notes",
  course_name: "Course Name",
  subject_name: "Subject Name",
  assigned_date: "Assigned Date",
  employee_name: "Employee Name",
  cm_subject: "Subject Name",
  cm_course: "Course Name", 
  material_type: "Type Name",
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

export function EditModal({
  isOpen,
  onClose,
  data,
  title,
  onSave,
  batches,
}: EditModalProps) {
  const flattenData = (data: Record<string, any>) => {
    const flattened: Record<string, any> = { ...data };
    if (data.candidate) {
      flattened.candidate_full_name = data.candidate.full_name;
    }
    if (data.instructor1) {
      flattened.instructor1_name = data.instructor1.name;
      flattened.instructor1_id = data.instructor1.id;
    }
    if (data.instructor2) {
      flattened.instructor2_name = data.instructor2.name;
      flattened.instructor2_id = data.instructor2.id;
    }
    if (data.instructor3) {
      flattened.instructor3_name = data.instructor3.name;
      flattened.instructor3_id = data.instructor3.id;
    }
    if (data.visa_status) {
      flattened.visa_status = String(data.visa_status).toLowerCase();
    }
    if (data.workstatus) {
      flattened.workstatus = String(data.workstatus).toLowerCase();
    }
    if (data.work_status) {
      flattened.work_status = String(data.work_status).toLowerCase();
    }
    return flattened;
  };

  const [formData, setFormData] = React.useState<Record<string, any>>(
    flattenData(data || {})
  );

  React.useEffect(() => {
    if (data) {
      console.log("EditModal received data:", data);
      console.log("Has cm_subject:", 'cm_subject' in data, data.cm_subject);
      console.log("Has cm_course:", 'cm_course' in data, data.cm_course);
      console.log("Has material_type:", 'material_type' in data, data.material_type);
      setFormData(flattenData(data));
    }
  }, [data]);

  const [courses, setCourses] = React.useState<{ id: number; name: string }[]>([]);
  const [subjects, setSubjects] = React.useState<{ id: number; name: string }[]>([]);
  const [employees, setEmployees] = React.useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Sort courses by ID descending (latest first) and set Machine Learning as default
        const sortedCourses = res.data.sort((a: { id: number }, b: { id: number }) => b.id - a.id);
        setCourses(sortedCourses);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    };
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Sort subjects by ID descending (latest first)
        const sortedSubjects = res.data.sort((a: { id: number }, b: { id: number }) => b.id - a.id);
        setSubjects(sortedSubjects);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      }
    };
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const activeEmployees = res.data.filter((emp: any) => emp.status === 1);
        setEmployees(activeEmployees);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      }
    };
    fetchCourses();
    fetchSubjects();
    fetchEmployees();
  }, []);

  // Detection for course materials
  const isCourseMaterialData = React.useMemo(() => {
    if (!formData || Object.keys(formData).length === 0) return false;
    
    const hasNewFields = ('cm_subject' in formData && 'cm_course' in formData && 'material_type' in formData);
    
    const hasSubjectAndCourse = 'subjectid' in formData && 'courseid' in formData;
    const hasMaterialStructure = 'name' in formData && 'description' in formData && 'link' in formData;
    const hasCourseMaterialType = 'type' in formData && Object.keys(COURSE_MATERIAL_TYPE_MAPPING).includes(formData.type);
    
    return hasNewFields || (hasSubjectAndCourse && (hasMaterialStructure || hasCourseMaterialType));
  }, [formData]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: value };
      
      // For course materials, update the underlying IDs when display names change
      if (isCourseMaterialData) {
        if (key === "cm_course" && value) {
          // Find the course ID for the selected course name
          const selectedCourse = courses.find(course => course.name === value);
          if (selectedCourse) {
            newData["courseid"] = selectedCourse.id;
          } else if (value === "Fundamentals") {
            newData["courseid"] = 0;
          }
        } else if (key === "cm_subject" && value) {
          // Find the subject ID for the selected subject name
          const selectedSubject = subjects.find(subject => subject.name === value);
          if (selectedSubject) {
            newData["subjectid"] = selectedSubject.id;
          } else if (value === "Basic Fundamentals") {
            newData["subjectid"] = 0;
          }
        } else if (key === "material_type" && value) {
          // Find the type code for the selected type label
          const typeEntry = Object.entries(COURSE_MATERIAL_TYPE_MAPPING).find(
            ([code, label]) => label === value
          );
          if (typeEntry) {
            newData["type"] = typeEntry[0];
          }
        }
      }
      
      if (key === "status" && value === "closed" && !prev.closed_date) {
        newData["closed_date"] = new Date().toISOString().split("T")[0];
      }
      return newData;
    });
  };

  const toLabel = (key: string) => {
    if (labelOverrides[key]) return labelOverrides[key];
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    Other: [],
    Notes: [],
  };

  Object.entries(formData).forEach(([key, value]) => {
    if (excludedFields.includes(key)) return;
    if (key === "id") return;
    
    if (isCourseMaterialData && formData.cm_subject && formData.cm_course && formData.material_type) {
      if (['subjectid', 'courseid', 'type', 'course_name', 'subject_name', 'type_name'].includes(key)) {
        return;
      }
    }
    
    if (isCourseMaterialData && (!formData.cm_subject || !formData.cm_course)) {
      if (['subjectid', 'courseid', 'type'].includes(key)) {
        return;
      }
    }
    
    // Exclude "status" field for Preparation and Marketing pages
    if (key.toLowerCase() === "status" && (title.toLowerCase().includes("preparation") || title.toLowerCase().includes("marketing"))) {
      return;
    }
    const section = fieldSections[key] || "Other";
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  const visibleSections = Object.keys(sectionedFields).filter(
    (section) => sectionedFields[section]?.length > 0 && section !== "Notes"
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

  const isVendorModal = title.toLowerCase().includes("vendor");
  const isInterviewOrMarketing = title.toLowerCase().includes("interview") || title.toLowerCase().includes("marketing");
  
  // Detection for candidate and batch modals
  const isCandidateModal = React.useMemo(() => {
    const hasBatchIdField = 'batchid' in formData;
    const hasCandidateFields = 
      'candidateid' in formData || 
      'candidate_id' in formData || 
      'candidate_full_name' in formData ||
      'candidate_name' in formData ||
      'candidate_email' in formData ||
      'full_name' in formData;
    
    const isBatchModal = 
      ('batchid' in formData && 'batchname' in formData) ||
      title.toLowerCase().includes("batch");
    
    return hasBatchIdField && !isBatchModal;
  }, [formData, title]);

  const isBatchModal = React.useMemo(() => {
    return title.toLowerCase().includes("batch");
  }, [title]);

  // Find Machine Learning course for default selection
  const machineLearningCourse = React.useMemo(() => {
    return courses.find(course => course.name.toLowerCase().includes("machine learning"));
  }, [courses]);

  if (!data) return null;

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const reconstructedData = { ...formData };
            
            // For course materials, ensure we're sending the correct data structure
            if (isCourseMaterialData) {
              // Remove display fields that shouldn't be sent to the API
              delete reconstructedData.cm_subject;
              delete reconstructedData.cm_course;
              delete reconstructedData.material_type;
              
              // Ensure we have the correct IDs and type code
              if (formData.cm_course) {
                const selectedCourse = courses.find(course => course.name === formData.cm_course);
                reconstructedData.courseid = selectedCourse ? selectedCourse.id : 0;
              }
              if (formData.cm_subject) {
                const selectedSubject = subjects.find(subject => subject.name === formData.cm_subject);
                reconstructedData.subjectid = selectedSubject ? selectedSubject.id : 0;
              }
              if (formData.material_type) {
                const typeEntry = Object.entries(COURSE_MATERIAL_TYPE_MAPPING).find(
                  ([code, label]) => label === formData.material_type
                );
                reconstructedData.type = typeEntry ? typeEntry[0] : formData.type;
              }
            }
            
            if (formData.candidate_full_name) {
              reconstructedData.candidate = {
                ...data.candidate,
                full_name: formData.candidate_full_name,
              };
            }
            if (formData.instructor1_name) {
              reconstructedData.instructor1 = {
                ...data.instructor1,
                name: formData.instructor1_name,
                id: formData.instructor1_id,
              };
            }
            if (formData.instructor2_name) {
              reconstructedData.instructor2 = {
                ...data.instructor2,
                name: formData.instructor2_name,
                id: formData.instructor2_id,
              };
            }
            if (formData.instructor3_name) {
              reconstructedData.instructor3 = {
                ...data.instructor3,
                name: formData.instructor3_name,
                id: formData.instructor3_id,
              };
            }
            onSave(reconstructedData);
            onClose();
          }}
        >
          {/* All Sections in Grid Layout */}
          <div className={`grid ${gridColsClass} gap-6 p-6`}>
            {visibleSections
              .filter((section) => section !== "Notes")
              .map((section) => (
                <div key={section} className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {section}
                  </h3>
                  
                  {/* COURSE MATERIAL SPECIFIC FIELDS */}
                  {isCourseMaterialData && (
                    <>
                      {/* cm_course dropdown */}
                      {section === "Professional Information" && (
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Course Name
                          </Label>
                          <select
                            value={formData.cm_course || ""}
                            onChange={(e) => handleChange("cm_course", e.target.value)}
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                          >
                            <option value="">Select Course</option>
                            {courses.map((course) => (
                              <option key={course.id} value={course.name}>
                                {course.name}
                              </option>
                            ))}
                            <option value="Fundamentals">Fundamentals</option>
                          </select>
                        </div>
                      )}

                      {/* cm_subject */}
                      {section === "Basic Information" && (
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Subject Name
                          </Label>
                          <select
                            value={formData.cm_subject || ""}
                            onChange={(e) => handleChange("cm_subject", e.target.value)}
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                          >
                            <option value="">Select Subject</option>
                            <option value="Basic Fundamentals">Basic Fundamentals</option>
                            {subjects.map((subject) => (
                              <option key={subject.id} value={subject.name}>
                                {subject.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* material_type dropdown */}
                      {section === "Basic Information" && (
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Type Name
                          </Label>
                          <select
                            value={formData.material_type || ""}
                            onChange={(e) => handleChange("material_type", e.target.value)}
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                          >
                            {COURSE_MATERIAL_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.label}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {/* Conditionally render instructor dropdowns only for Preparation page */}
                  {section === "Professional Information" && title.toLowerCase().includes("preparation") && (
                    <>
                      {/* Instructor 1 Dropdown */}
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Instructor 1
                        </Label>
                        <select
                          value={formData.instructor1_id || ""}
                          onChange={(e) => {
                            const selected = employees.find(
                              (emp) => emp.id === Number(e.target.value)
                            );
                            handleChange("instructor1_name", selected?.name || "");
                            handleChange("instructor1_id", selected?.id || null);
                          }}
                          className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">Select Instructor</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Instructor 2 Dropdown */}
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Instructor 2
                        </Label>
                        <select
                          value={formData.instructor2_id || ""}
                          onChange={(e) => {
                            const selected = employees.find(
                              (emp) => emp.id === Number(e.target.value)
                            );
                            handleChange("instructor2_name", selected?.name || "");
                            handleChange("instructor2_id", selected?.id || null);
                          }}
                          className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">Select Instructor</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Instructor 3 Dropdown */}
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Instructor 3
                        </Label>
                        <select
                          value={formData.instructor3_id || ""}
                          onChange={(e) => {
                            const selected = employees.find(
                              (emp) => emp.id === Number(e.target.value)
                            );
                            handleChange("instructor3_name", selected?.name || "");
                            handleChange("instructor3_id", selected?.id || null);
                          }}
                          className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">Select Instructor</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Render other fields in the section */}
                  {sectionedFields[section]
                    .filter(
                      ({ key }) =>
                        ![
                          "instructor1_name",
                          "instructor2_name",
                          "instructor3_name",
                          "instructor1_id",
                          "instructor2_id",
                          "instructor3_id",
                        ].includes(key)
                    )
                    .map(({ key, value }) => {
                      const isTypeField = key.toLowerCase() === "type";
                      const isBatchField = key.toLowerCase() === "batchid";
                      const isVendorField = isVendorModal && key.toLowerCase() === "status";
                      
                      
                      if (isCourseMaterialData && ['cm_subject', 'cm_course', 'material_type'].includes(key)) {
                        return null;
                      }

                      if (isCourseMaterialData && ['course_name', 'subject_name'].includes(key)) {
                        return null;
                      }

                      if (isInterviewOrMarketing && ["instructor1_name", "instructor2_name", "instructor3_name"].includes(key)) {
                        return null;
                      }

                      if (isCourseMaterialData && isTypeField) {
                        return null;
                      }

                      if (isBatchField) {
                        console.log("Batch field detected:", { 
                          isCandidateModal, 
                          isBatchModal, 
                          batchesCount: batches?.length,
                          key,
                          value: formData.batchid
                        });
                        
                        // dropdown for candidate modals
                        if (isCandidateModal) {
                          return (
                            <div key={key} className="space-y-1">
                              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Batch
                              </Label>
                              <select
                                value={formData.batchid || ""}
                                onChange={(e) => {
                                  const selectedBatch = batches.find(batch => batch.batchid === Number(e.target.value));
                                  handleChange("batchid", Number(e.target.value));
                                  if (selectedBatch) {
                                    handleChange("batchname", selectedBatch.batchname);
                                  }
                                }}
                                className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select a batch (optional)</option>
                                {batches.map(batch => (
                                  <option key={batch.batchid} value={batch.batchid}>
                                    {batch.batchname}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        } else {
                          return (
                            <div key={key} className="space-y-1">
                              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Batch ID
                              </Label>
                              <Input
                                type="string"
                                value={formData[key] ?? ""}
                                onChange={(e) => handleChange(key, Number(e.target.value))}
                                className="w-full"
                              />
                            </div>
                          );
                        }
                      }

                      // For NON-course materials,regular type field handling
                      if (!isCourseMaterialData && isTypeField) {
                        if (isVendorModal) {
                          return (
                            <div key={key} className="space-y-1">
                              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {toLabel(key)}
                              </Label>
                              <select
                                value={String(formData[key] ?? "")}
                                onChange={(e) => handleChange(key, e.target.value)}
                                className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                              >
                                {enumOptions["type"].map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        } else {
                          return (
                            <div key={key} className="space-y-1">
                              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {toLabel(key)}
                              </Label>
                              <Input
                                value={formData[key] ?? ""}
                                onChange={(e) => handleChange(key, e.target.value)}
                                className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                              />
                            </div>
                          );
                        }
                      }
                      if (!isCourseMaterialData && key.toLowerCase() === "subjectid") {
                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {toLabel(key)}
                            </Label>
                            <select
                              value={formData[key] || "0"}
                              onChange={(e) => handleChange(key, Number(e.target.value))}
                              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                            >
                              <option value="0">0</option>
                              {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.id}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      // For course subjects,course_name dropdown
                      if (key.toLowerCase() === "course_name") {
                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {toLabel(key)}
                            </Label>
                            <select
                              value={formData["course_name"] || ""}
                              onChange={(e) => handleChange("course_name", e.target.value)}
                              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                            >
                              {courses.length === 0 ? (
                                <option value="">Loading...</option>
                              ) : (
                                <>
                                  {courses.map((course) => (
                                    <option key={course.id} value={course.name}>
                                      {course.name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          </div>
                        );
                      }

                      // For course subjects,subject_name dropdown
                      if (key.toLowerCase() === "subject_name") {
                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {toLabel(key)}
                            </Label>
                            <select
                              value={formData["subject_name"] || ""}
                              onChange={(e) => handleChange("subject_name", e.target.value)}
                              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                            >
                              {subjects.length === 0 ? (
                                <option value="">Loading...</option>
                              ) : (
                                <>
                                  {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.name}>
                                      {subject.name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          </div>
                        );
                      }

                      if (dateFields.includes(key.toLowerCase())) {
                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {toLabel(key)}
                            </Label>
                            <input
                              type="date"
                              value={
                                formData[key] && !isNaN(new Date(formData[key]).getTime())
                                  ? new Date(formData[key]).toISOString().split("T")[0]
                                  : ""
                              }
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                            />
                          </div>
                        );
                      }
                      if (isVendorField) {
                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {toLabel(key)}
                            </Label>
                            <select
                              value={String(formData[key] ?? "")}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                            >
                              {vendorStatuses.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      if (enumOptions[key.toLowerCase()]) {
                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {toLabel(key)}
                            </Label>
                            <select
                              value={String(formData[key] ?? "")}
                              onChange={(e) =>
                                handleChange(
                                  key,
                                  e.target.value === "true"
                                    ? true
                                    : e.target.value === "false"
                                      ? false
                                      : e.target.value
                                )
                              }
                              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                            >
                              {reorderYesNoOptions(key, value, enumOptions[key.toLowerCase()]).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      if (typeof value === "string" && value.length > 100) {
                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {toLabel(key)}
                            </Label>
                            <Textarea
                              value={formData[key] || ""}
                              onChange={(e) => handleChange(key, e.target.value)}
                            />
                          </div>
                        );
                      }
                      return (
                        <div key={key} className="space-y-1">
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {toLabel(key)}
                          </Label>
                          <Input
                            value={formData[key] ?? ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                          />
                        </div>
                      );
                    })}
                </div>
              ))}
          </div>

          {/* Notes Section */}
          {sectionedFields["Notes"].length > 0 && (
            <div className="px-6 pb-6">
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