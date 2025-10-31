// whiteboxLearning-wbl\components\EditModal.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import axios from "axios";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import { apiFetch } from "@/lib/api";
import {
  enumOptions,
  vendorTypeOptions,
  vendorStatuses,
  genericStatusOptions,
  materialTypeOptions,
  excludedFields,
  fieldSections,
  labelOverrides,
  dateFields,
  type Batch,
} from "@/lib/formConfig";
import { flattenData } from "@/lib/formDataTransforms";

// Shared config & types imported from lib/formConfig


// Enum options for various fields
const enumOptions: Record<string, { value: string; label: string }[]> = {
  move_to_prep: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  move_to_mrkt: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  move_to_placement: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
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
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
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
  priority: [
    { value: "", label: "Select" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
  ],
  rating: [
    { value: "", label: "Select Rating" },
    { value: "Good", label: "Good" },
    { value: "Very Good", label: "Very Good" },
    { value: "Average", label: "Average" },
    { value: "Need to Improve", label: "Need to Improve" },
  ],
  communication: [
    { value: "", label: "Select" },
    { value: "Good", label: "Good" },
    { value: "Very Good", label: "Very Good" },
    { value: "Average", label: "Average" },
    { value: "Need to Improve", label: "Need to Improve" },
  ],
  work_status: [
    { value: "waiting for status", label: "Waiting for Status" },
    { value: "citizen", label: "Citizen" },
    { value: "f1", label: "F1" },
    { value: "other", label: "Other" },
    { value: "permanent resident", label: "Permanent Resident" },
    { value: "h4", label: "H4" },
    { value: "ead", label: "EAD" },
    { value: "green card", label: "Green Card" },
    { value: "h1b", label: "H1B" },
  ],
  workstatus: [
    { value: "waiting for status", label: "Waiting for Status" },
    { value: "citizen", label: "Citizen" },
    { value: "f1", label: "F1" },
    { value: "other", label: "Other" },
    { value: "permanent resident", label: "Permanent Resident" },
    { value: "h4", label: "H4" },
    { value: "ead", label: "EAD" },
    { value: "green card", label: "Green Card" },
    { value: "h1b", label: "H1B" },
  ],
  visa_status: [
    { value: "waiting for status", label: "Waiting for Status" },
    { value: "citizen", label: "Citizen" },
    { value: "f1", label: "F1" },
    { value: "other", label: "Other" },
    { value: "permanent resident", label: "Permanent Resident" },
    { value: "h4", label: "H4" },
    { value: "ead", label: "EAD" },
    { value: "green card", label: "Green Card" },
    { value: "h1b", label: "H1B" },
  ],
  mode_of_interview: [
    { value: "Virtual", label: "Virtual" },
    { value: "In Person", label: "In Person" },
    { value: "Phone", label: "Phone" },
    { value: "Assessment", label: "Assessment" },
    { value: "AI Interview", label: "AI Interview" },
  ],
  type_of_interview: [
    { value: "Recruiter Call", label: "Recruiter Call" },
    { value: "Technical", label: "Technical" },
    { value: "HR", label: "HR" },
    { value: "Prep Call", label: "Prep Call" },
  ],
  feedback: [
    { value: 'Pending', label: 'Pending' },
    { value: 'Positive', label: 'Positive' },
    { value: 'Negative', label: 'Negative' },
  ],
  company_type: [
    { value: "client", label: "Client" },
    { value: "third-party-vendor", label: "Third Party Vendor" },
    { value: "implementation-partner", label: "Implementation Partner" },
    { value: "sourcer", label: "Sourcer" },
  ],
  marketing_status: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  placement_type: [
    { value: "Company", label: "Company" },
    { value: "Client", label: "Client" },
    { value: "Vendor", label: "Vendor" },
    { value: "Implementation Partner", label: "Implementation Partner" },
  ],
  placement_status: [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ],
  employee_status: [
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
  ],
  instructor_status: [
    { value: "1", label: "Yes" },
    { value: "0", label: "No" },
  ],
  lead_status: [
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" },
    { value: "Future", label: "Future" },
  ],
  vendor_type: [
    { value: "client", label: "Client" },
    { value: "third-party-vendor", label: "Third Party Vendor" },
    { value: "implementation-partner", label: "Implementation Partner" },
    { value: "sourcer", label: "Sourcer" },
    { value: "contact-from-ip", label: "Contact from IP" },
  ],
  vendor_status: [
    { value: "active", label: "Active" },
    { value: "working", label: "Working" },
    { value: "not_useful", label: "Not Useful" },
    { value: "do_not_contact", label: "Do Not Contact" },
    { value: "inactive", label: "Inactive" },
    { value: "prospect", label: "Prospect" },
  ],
  vendor_linkedin_connected: [
    { value: "YES", label: "Yes" },
    { value: "NO", label: "No" },
  ],
  vendor_intro_email_sent: [
    { value: "YES", label: "Yes" },
    { value: "NO", label: "No" },
  ],
  vendor_intro_call: [
    { value: "YES", label: "Yes" },
    { value: "NO", label: "No" },
  ],
  candidate_status: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "discontinued", label: "Discontinued" },
    { value: "break", label: "Break" },
    { value: "closed", label: "Closed" },
  ],
};

// Vendor type options
const vendorTypeOptions = [
  { value: "Client", label: "Client" },
  { value: "third-party-vendor", label: "Third Party Vendor" },
  { value: "implementation-partner", label: "Implementation Partner" },
  { value: "sourcer", label: "Sourcer" },
  { value: "contact-from-ip", label: "Contact from IP" },
];

// Vendor status options
const vendorStatuses = [
  { value: "active", label: "Active" },
  { value: "working", label: "Working" },
  { value: "not_useful", label: "Not Useful" },
  { value: "do_not_contact", label: "Do Not Contact" },
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
];

const genericStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "break", label: "Break" },
  { value: "discontinued", label: "Discontinued" },
  { value: "closed", label: "Closed" },
];

const materialTypeOptions = [
  { value: "P", label: "Presentations" },
  { value: "C", label: "Cheatsheets" },
  { value: "D", label: "Diagrams" },
  { value: "S", label: "Softwares" },
  { value: "I", label: "Installations" },
  { value: "B", label: "Books" },
  { value: "N", label: "Newsletters" },
  { value: "M", label: "Materials" },
  { value: "A", label: "Assignments" },
];

interface Batch {
  batchid: number;
  batchname: string;
  subject?: string;
  courseid?: number;
}


interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
  onSave: (updatedData: Record<string, any>) => void;
  batches: Batch[];
}


// Shared sections, labels, enums, and date fields imported from lib/formConfig

// Fields to exclude from the form
const excludedFields = [
  "candidate", "instructor1", "instructor2", "instructor3", "id", "sessionid", "vendor_type",
  "last_mod_datetime", "last_modified", "logincount", "googleId",
  "subject_id", "lastmoddatetime", "course_id", "new_subject_id", "instructor_1id",
  "instructor_2id", "instructor_3id", "instructor1_id", "instructor2_id",
  "instructor3_id", "candidate_id", "batch"
];

// Map fields to their respective sections
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
  email: "Basic Information",
  phone: "Basic Information",
  status: "Basic Information",
  batchid: "Contact Information",
  batch: "Basic Information",
  start_date: "Basic Information",
  batchname: "Basic Information",
  target_date_of_marketing: "Basic Information",
  move_to_prep: "Basic Information",
  move_to_mrkt:"Basic Information",
  // move_to_placement: "Basic Information",
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
  google_voice_number: "Contact Information",
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
  registereddate: "Basic Information",
  company: "Professional Information",
  linkedin: "Contact Information",
  github: "Contact Information",
  github_url: "Contact Information",
  resume: "Contact Information",
  resume_url: "Contact Information",
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
  secondary_email: "Contact Information",
  cm_course: "Professional Information",
  cm_subject: "Basic Information",
  material_type: "Basic Information",
  transcript: "Professional Information",
};

// Override field labels for better readability
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
  resume_url: "Resume URL",
  orientationdate: "Orientation Date",
  promissory: "Promissory",
  lastlogin: "Last Login",
  logincount: "Login Count",
  course: "Course",
  registereddate: "Registered Date",
  company: "Company",
  linkedin: "LinkedIn",
  linkedin_id: "LinkedIn ID",
  github: "GitHub",
  github_url: "GitHub URL",
  resume: "Resume",
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
  move_to_mrkt: "Move to Marketing",
  aadhaar: "Aadhaar",
  job_posting_url: "Job Posting URL",
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
  secondaryphone:"Secondary Phone",
  spousename: "Spouse Name",
  spousephone: "Spouse Phone",
  spouseemail: "Spouse Email",
  spouseoccupationinfo: "Spouse Occupation Info",
  notes: "Notes",
  course_name: "Course Name",
  subject_name: "Subject Name",
  recording_link: "Recording Link",
  transcript: "Transcript",
  backup_url: "Backup URL",
  cm_course: "Course Name",
  cm_subject: "Subject Name",
  company_type: "Company Type",
  mode_of_interview: "Mode of Interview",
  type_of_interview: "Type of Interview",
  material_type: "Material Type",
  sessiondate:"Session Date",
  classdate:"Class Date",
  filename:"File Name",
  startdate:"Start Date",
  enddate:"End Date"
};

const dateFields = [
  "orientationdate",
  "start_date",
  "startdate",
  "target_date",
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
  "marketing_start_date",
  "target_date_of_marketing",
];

export function EditModal({
  isOpen,
  onClose,
  data,
  title,
  onSave,
  batches: propBatches,
}: EditModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm();
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [mlBatches, setMlBatches] = useState<Batch[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Detect the modal context
  const isCourseMaterialModal = title.toLowerCase().includes("course material") || title.toLowerCase().includes("material");
  const isCourseSubjectModal = title.toLowerCase().includes("course-subject") || title.toLowerCase().includes("course subject");
  const isVendorModal = title.toLowerCase().includes("vendor");
  const isCandidateOrEmployee = title.toLowerCase().includes("candidate") || title.toLowerCase().includes("employee");
  const isBatchesModal = title.toLowerCase().includes("batch") && !title.toLowerCase().includes("course");

  const isInterviewModal = title.toLowerCase().includes("interview");
  const isMarketingModal = title.toLowerCase().includes("marketing");
  const isPlacementModal = title.toLowerCase().includes("placement");
  const isPreparationModal = title.toLowerCase().includes("preparation");
  const isEmployeeModal = title.toLowerCase().includes("employee");
  const isLeadModal = title.toLowerCase().includes("lead");
  const isCandidateModal = title.toLowerCase().includes("candidate") && !isPreparationModal;

  // modal for candidate_full_name first and read-only
  const isSpecialModal = isInterviewModal || isMarketingModal || isPlacementModal || isPreparationModal;

  // Fetch ML batches
  useEffect(() => {
    const fetchMlBatches = async () => {
      try {
        const res = await apiFetch("/batch");
        const data = res?.data ?? res;
        const sortedAllBatches = [...data].sort(
          (a: Batch, b: Batch) => b.batchid - a.batchid
        );
        let mlBatchesOnly = sortedAllBatches.filter((batch) => {
          const subject = batch.subject?.toLowerCase();
          return (
            subject === "ml" ||
            subject === "machine learning" ||
            subject === "machinelearning" ||
            subject?.includes("ml")
          );
        });
        if (mlBatchesOnly.length === 0) {
          mlBatchesOnly = sortedAllBatches.filter(
            (batch) => batch.courseid === 3
          );
        }
        if (mlBatchesOnly.length === 0) {
          mlBatchesOnly = sortedAllBatches;
        }
        setMlBatches(mlBatchesOnly);
        if (isOpen && mlBatchesOnly.length > 0 && mlBatchesOnly[0]?.batchid) {
          setValue("batchid", mlBatchesOnly[0].batchid);
        }
      } catch (error) {
        console.error("Failed to load batches:", error);
      }
    };
    if (isOpen && (!propBatches || propBatches.length === 0)) {
      fetchMlBatches();
    } else if (propBatches && propBatches.length > 0) {
      let mlBatchesOnly = propBatches.filter((batch) => {
        const subject = batch.subject?.toLowerCase();
        return (
          subject === "ml" ||
          subject === "machine learning" ||
          subject === "machinelearning" ||
          subject?.includes("ml")
        );
      });
      if (mlBatchesOnly.length === 0) {
        mlBatchesOnly = propBatches.filter((batch) => batch.courseid === 3);
      }
      if (mlBatchesOnly.length === 0) {
        mlBatchesOnly = propBatches;
      }
      setMlBatches(mlBatchesOnly);
    }
  }, [isOpen, propBatches]);

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

  // Fetch courses, subjects, and employees
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiFetch("/courses");
        const data = res?.data ?? res;
        const sortedCourses = [...data].sort((a: any, b: any) => b.id - a.id);
        let coursesWithOrphans = [...sortedCourses];
        if (
          isCourseMaterialModal &&
          !coursesWithOrphans.some((course) => course.id === 0)
        ) {
          coursesWithOrphans.unshift({ id: 0, name: "Fundamentals" });
        }
        setCourses(coursesWithOrphans);
      } catch (error: any) {
        console.error(
          "Failed to fetch courses:",
          error?.response?.data || error.message || error
        );
      }
    };

    const fetchSubjects = async () => {
      try {
        const res = await apiFetch("/subjects");
        const data = res?.data ?? res;
        const sortedSubjects = [...data].sort((a: any, b: any) => b.id - a.id);
        let subjectsWithOrphans = [...sortedSubjects];
        if (
          isCourseMaterialModal &&
          !subjectsWithOrphans.some((subject) => subject.id === 0)
        ) {
          subjectsWithOrphans.unshift({ id: 0, name: "Basic Fundamentals" });
        }
        setSubjects(subjectsWithOrphans);
      } catch (error: any) {
        console.error(
          "Failed to fetch subjects:",
          error?.response?.data || error.message || error
        );
      }
    };

    const fetchEmployees = async () => {
      try {
        const res = await apiFetch("/employees");
        const data = res?.data ?? res;
        const activeEmployees = data.filter((emp: any) => emp.status === 1);
        setEmployees(activeEmployees);
      } catch (error: any) {
        console.error(
          "Failed to fetch employees:",
          error?.response?.data || error.message || error
        );
      }
    };

    fetchCourses();
    fetchSubjects();
    fetchEmployees();
  }, [isCourseMaterialModal]);


  // Flatten nested data for the form (shared util)

  
  const flattenData = (data: Record<string, any>) => {
    const flattened: Record<string, any> = { ...data };
  if (data.candidate) flattened.candidate_full_name = data.candidate.full_name;
  flattened.instructor1_id = data.instructor1?.id || data.instructor1_id || "";
  flattened.instructor1_name = data.instructor1?.name || data.instructor1_name || "";
  flattened.instructor2_id = data.instructor2?.id || data.instructor2_id || "";
  flattened.instructor2_name = data.instructor2?.name || data.instructor2_name || "";
  flattened.instructor3_id = data.instructor3?.id || data.instructor3_id || "";
  flattened.instructor3_name = data.instructor3?.name || data.instructor3_name || "";
  if (data.visa_status) {
    flattened.visa_status = String(data.visa_status).toLowerCase();
  }
  if (data.workstatus) {
    flattened.workstatus = String(data.workstatus).toLowerCase();
  }
  if (data.work_status) {
    flattened.work_status = String(data.work_status).toLowerCase();
  }
  if (data.type) {
    flattened.material_type = data.type;
  }
  if (data.rating) {
    const ratingValue = String(data.rating).trim();
    const normalizedRating = normalizeRatingValue(ratingValue);
    flattened.rating = normalizedRating;
  }

  if (data.communication) {
    const communicationValue = String(data.communication).trim();
    const normalizedCommunication = normalizeCommunicationValue(communicationValue);
    flattened.communication = normalizedCommunication;
  }
  flattened.linkedin_id = data.candidate?.linkedin_id || data.linkedin_id || "";
  if (data.github_link) {
    flattened.github_link = data.github_link;
  } else if (data.github) {
    flattened.github_link = data.github;
  }
  else if ('github_link' in data) {
    flattened.github_link = data.github_link;
  }
  if (data.cm_course) {
    flattened.cm_course = data.cm_course;
  } else if (data.course_name) {
    flattened.cm_course = data.course_name;
  } else if (data.courseid === 0) {
    flattened.cm_course = "Fundamentals";
  }
  if (data.cm_subject) {
    flattened.cm_subject = data.cm_subject;
  } else if (data.subject_name) {
    flattened.cm_subject = data.subject_name;
  } else if (data.subjectid === 0) {
    flattened.cm_subject = "Basic Fundamentals";
  }
  dateFields.forEach(dateField => {
    if (flattened[dateField] && !isNaN(new Date(flattened[dateField]).getTime())) {
      flattened[dateField] = new Date(flattened[dateField]).toISOString().split('T')[0];
    }
  });
  
  return flattened;
};

const normalizeRatingValue = (value: string): string => {
  const ratingMap: Record<string, string> = {
    'good': 'Good',
    'very good': 'Very Good',
    'average': 'Average',
    'need to improve': 'Need to Improve',
  };
  
  const normalized = value.toLowerCase().trim();
  return ratingMap[normalized] || value;
};

const normalizeCommunicationValue = (value: string): string => {
  const communicationMap: Record<string, string> = {
    'good': 'Good',
    'very good': 'Very Good',
    'average': 'Average',
    'need to improve': 'Need to Improve',
  };
  
  const normalized = value.toLowerCase().trim();
  return communicationMap[normalized] || value; 
};


  // Reset form data when the modal opens
  useEffect(() => {
    if (data && isOpen) {
      const ctxForFlatten = isCourseSubjectModal
        ? "course-subject"
        : isCourseMaterialModal
        ? "course-material"
        : isInterviewModal
        ? "interview"
        : isMarketingModal
        ? "marketing"
        : isPlacementModal
        ? "placement"
        : isPreparationModal
        ? "preparation"
        : isEmployeeModal
        ? "employee"
        : isVendorModal
        ? "vendor"
        : isLeadModal
        ? "lead"
        : "candidate";
      const flattenedData = flattenData(data, ctxForFlatten);
      setFormData(flattenedData);
      reset(flattenedData);
    }
  }, [data, isOpen, reset]);

  // Handle form submission
  const onSubmit = (formData: any) => {
    const reconstructedData = { ...formData };

    if (isEmployeeModal) {
      if (formData.status) {
        reconstructedData.status = parseInt(formData.status);
      }
      if (formData.instructor) {
        reconstructedData.instructor = parseInt(formData.instructor);
      }
    }
    if (isCourseMaterialModal) {
      if (formData.cm_course) {
        const selectedCourse = courses.find(course => course.name === formData.cm_course);
        if (selectedCourse) {
          reconstructedData.courseid = selectedCourse.id;
        }
      }
      if (formData.cm_subject) {
        const selectedSubject = subjects.find(subject => subject.name === formData.cm_subject);
        if (selectedSubject) {
          reconstructedData.subjectid = selectedSubject.id;
        }
      }
      if (formData.material_type) {
        reconstructedData.type = formData.material_type;
      }
    }
    if (isCourseSubjectModal) {
      if (formData.course_name) {
        const selectedCourse = courses.find(course => course.name === formData.course_name);
        if (selectedCourse) {
          reconstructedData.courseid = selectedCourse.id;
        }
      }
      if (formData.subject_name) {
        const selectedSubject = subjects.find(subject => subject.name === formData.subject_name);
        if (selectedSubject) {
          reconstructedData.subjectid = selectedSubject.id;
        }
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
  };

  const toLabel = (key: string) => {
    if (labelOverrides[key]) return labelOverrides[key];
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getEnumOptions = (key: string) => {
    const keyLower = key.toLowerCase();

    if (isInterviewModal) {
      if (keyLower === 'company_type') return enumOptions.company_type;
      if (keyLower === 'mode_of_interview') return enumOptions.mode_of_interview;
      if (keyLower === 'type_of_interview') return enumOptions.type_of_interview;
      if (keyLower === 'feedback') return enumOptions.feedback;
    }

    if (isMarketingModal && keyLower === 'status') return enumOptions.marketing_status;
    if (isMarketingModal && keyLower === 'priority') {
      return enumOptions.priority;
    }

    if (isPlacementModal) {
      if (keyLower === 'type') return enumOptions.placement_type;
      if (keyLower === 'status') return enumOptions.placement_status;
    }

    if (isEmployeeModal) {
      if (keyLower === 'status') return enumOptions.employee_status;
      if (keyLower === 'instructor') return enumOptions.instructor_status;
    }

    if (isLeadModal) {
      if (keyLower === 'status') return enumOptions.lead_status;
      if (keyLower === 'workstatus') return enumOptions.workstatus;
    }

    if (isVendorModal) {
      if (keyLower === 'type' || keyLower === 'vendor_type') return enumOptions.vendor_type;
      if (keyLower === 'status') return enumOptions.vendor_status;
      if (keyLower === 'linkedin_connected') return enumOptions.vendor_linkedin_connected;
      if (keyLower === 'intro_email_sent') return enumOptions.vendor_intro_email_sent;
      if (keyLower === 'intro_call') return enumOptions.vendor_intro_call;
    }

    if (isCandidateModal) {
      if (keyLower === 'status') return enumOptions.candidate_status;
      if (keyLower === 'workstatus') return enumOptions.workstatus;
    }

    if (keyLower === 'priority') return undefined;
    return enumOptions[keyLower];
  };

  // Organize fields into sections
  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    Other: [],
    Notes: [],
  };

  const formValues = watch();
  Object.entries(formData).forEach(([key, value]) => {
    if (excludedFields.includes(key)) return;
    if (isCandidateOrEmployee && key.toLowerCase() === "name") return;
    if (isCourseSubjectModal && ["cm_course", "cm_subject"].includes(key.toLowerCase())) return;
    if (isCourseMaterialModal && ["subjectid", "courseid", "type"].includes(key.toLowerCase())) return;
    if (isBatchesModal && key.toLowerCase() === "batchid") return;
    if (isMarketingModal && (key === "Marketing Manager obj" || key === "marketing_manager_obj")) return;
    const section = fieldSections[key] || "Other";
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  if (isSpecialModal && sectionedFields["Basic Information"].some(item => item.key === "candidate_full_name")) {
    const basicInfo = sectionedFields["Basic Information"];
    const candidateFieldIndex = basicInfo.findIndex(item => item.key === "candidate_full_name");
    if (candidateFieldIndex > -1) {
      const candidateField = basicInfo.splice(candidateFieldIndex, 1)[0];
      basicInfo.unshift(candidateField);
    }
  }

  const visibleSections = Object.keys(sectionedFields).filter(
    (section) => sectionedFields[section]?.length > 0 && section !== "Notes"
  );

  const totalFields = visibleSections.reduce((count, section) =>
    count + sectionedFields[section].length, 0
  );

  let modalWidthClass = "max-w-6xl";
  if (totalFields <= 4) {
    modalWidthClass = "max-w-3xl";
  } else if (totalFields <= 8) {
    modalWidthClass = "max-w-4xl";
  }

  const columnCount = Math.min(visibleSections.length, 4);
  const gridColsClass = {
    1: "grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 md:grid-cols-3",
    4: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }[columnCount] || "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  const isInterviewOrMarketing = title.toLowerCase().includes("interview") || title.toLowerCase().includes("marketing");

  if (!isOpen || !data) return null;

  const currentFormValues = watch();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
          <div
            ref={modalRef}
            className={`bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full ${modalWidthClass} max-h-[90vh] overflow-y-auto`}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 border-b border-blue-200 flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {title} - Edit Details
              </h2>
              <button
                onClick={onClose}
                className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 p-1 rounded-lg transition"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 md:p-6 bg-white">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className={`grid ${gridColsClass} gap-2.5 sm:gap-3 md:gap-5`}>
                  {visibleSections
                    .filter((section) => section !== "Notes")
                    .map((section) => (
                      <div key={section} className="space-y-3 sm:space-y-4">
                        <h3 className="text-xs sm:text-sm font-semibold text-blue-700 border-b border-blue-200 pb-1.5 sm:pb-2">
                          {section}
                        </h3>
                        {isCourseMaterialModal && section === "Professional Information" && (
                          <div className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">
                              Course Name
                            </label>
                            <select
                              {...register("cm_course")}
                              value={currentFormValues.cm_course || formData.cm_course || ""}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                            >
                              {courses.length === 0 ? (
                                <option value="">Loading...</option>
                              ) : (
                                courses.map((course) => (
                                  <option key={course.id} value={course.name}>
                                    {course.name}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        )}
                        {isCourseSubjectModal && section === "Professional Information" && (
                          <div className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">
                              Course Name
                            </label>
                            <select
                              {...register("course_name")}
                              value={currentFormValues.course_name || formData.course_name || ""}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                            >
                              {courses.length === 0 ? (
                                <option value="">Loading...</option>
                              ) : (
                                courses.map((course) => (
                                  <option key={course.id} value={course.name}>
                                    {course.name}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        )}
                        {isCourseMaterialModal && section === "Basic Information" && (
                          <div className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">
                              Subject Name
                            </label>
                            <select
                              {...register("cm_subject")}
                              value={currentFormValues.cm_subject || formData.cm_subject || ""}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                            >
                              {subjects.length === 0 ? (
                                <option value="">Loading...</option>
                              ) : (
                                subjects.map((subject) => (
                                  <option key={subject.id} value={subject.name}>
                                    {subject.name}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        )}
                        {isCourseSubjectModal && section === "Basic Information" && (
                          <div className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">
                              Subject Name
                            </label>
                            <select
                              {...register("subject_name")}
                              value={currentFormValues.subject_name || formData.subject_name || ""}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                            >
                              {subjects.length === 0 ? (
                                <option value="">Loading...</option>
                              ) : (
                                subjects.map((subject) => (
                                  <option key={subject.id} value={subject.name}>
                                    {subject.name}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        )}
                        {isCourseMaterialModal && section === "Basic Information" && (
                          <div className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">
                              Material Type
                            </label>
                            <select
                              {...register("material_type")}
                              value={currentFormValues.material_type || formData.material_type || ""}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                            >
                              <option value="">Select Material Type</option>
                              {materialTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {section === "Professional Information" && (
                          <>
                            {(isPreparationModal || isMarketingModal) && (
                              <>
                                {/* Instructor 1 */}
                                <div className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    Instructor 1
                                  </label>
                                  {isMarketingModal ? (
                                    <input
                                      type="text"
                                      value={data.instructor1?.name || formData.instructor1_name || ""}
                                      readOnly
                                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm"
                                    />
                                  ) : (
                                    <select
                                      {...register("instructor1_id")}
                                      value={currentFormValues.instructor1_id || formData.instructor1_id || ""}
                                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                                    >
                                      <option value="">Select Instructor</option>
                                      {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                          {emp.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                                {/* Instructor 2 */}
                                <div className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    Instructor 2
                                  </label>
                                  {isMarketingModal ? (
                                    <input
                                      type="text"
                                      value={data.instructor2?.name || formData.instructor2_name || ""}
                                      readOnly
                                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm"
                                    />
                                  ) : (
                                    <select
                                      {...register("instructor2_id")}
                                      value={currentFormValues.instructor2_id || formData.instructor2_id || ""}
                                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                                    >
                                      <option value="">Select Instructor</option>
                                      {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                          {emp.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                                {/* Instructor 3 */}
                                <div className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    Instructor 3
                                  </label>
                                  {isMarketingModal ? (
                                    <input
                                      type="text"
                                      value={data.instructor3?.name || formData.instructor3_name || ""}
                                      readOnly
                                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm"
                                    />
                                  ) : (
                                    <select
                                      {...register("instructor3_id")}
                                      value={currentFormValues.instructor3_id || formData.instructor3_id || ""}
                                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                                    >
                                      <option value="">Select Instructor</option>
                                      {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                          {emp.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </>
                            )}
                          </>
                        )}

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
                                ...(isCourseMaterialModal ? ["cm_course", "cm_subject", "material_type"] : []),
                                ...(isCourseSubjectModal ? ["course_name", "subject_name"] : [])
                              ].includes(key)
                          )
                          .map(({ key, value }) => {
                            const isTypeField = key.toLowerCase() === "type";
                            const isBatchField = key.toLowerCase() === "batchid";
                            const isStatusField = key.toLowerCase() === "status";
                            const isMaterialTypeField = key.toLowerCase() === "material_type";
                            const isWorkStatusField = key.toLowerCase() === "workstatus";
                            const isInstructorField = key.toLowerCase() === "instructor";
                            const isCompanyTypeField = key.toLowerCase() === "company_type";
                            const isModeOfInterviewField = key.toLowerCase() === "mode_of_interview";
                            const isTypeOfInterviewField = key.toLowerCase() === "type_of_interview";
                            const isFeedbackField = key.toLowerCase() === "feedback";
                            const isVendorTypeField = key.toLowerCase() === "vendor_type";
                            const isLinkedinConnectedField = key.toLowerCase() === "linkedin_connected";
                            const isIntroEmailSentField = key.toLowerCase() === "intro_email_sent";
                            const isIntroCallField = key.toLowerCase() === "intro_call";
                            const isCandidateFullName = key.toLowerCase() === "candidate_full_name";
                            const isPrepOrMarketing = isPreparationModal || isMarketingModal;

                            if (isMaterialTypeField && !isCourseMaterialModal) {
                              return null;
                            }
                            if (isInterviewOrMarketing && ["instructor1_name", "instructor2_name", "instructor3_name"].includes(key)) {
                              return null;
                            }
                            if (isSpecialModal && isCandidateFullName) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <input
                                    type="text"
                                    {...register(key)}
                                    defaultValue={formData[key] || ""}
                                    readOnly
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm"
                                  />
                                </div>
                              );
                            }

                            if (isSpecialModal && (key === "linkedin_id")) {
                              let url = (formData?.[key] || formData?.candidate?.[key] || "").trim();

                              if (!url) {
                                return (
                                  <div key={key} className="space-y-1 sm:space-y-1.5">
                                    <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                      {toLabel(key)}
                                    </label>
                                    <div className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg bg-gray-100 text-gray-400 shadow-sm">
                                      N/A
                                    </div>
                                  </div>
                                );
                              }

                              if (!/^https?:\/\//i.test(url)) {
                                url = `https://${url}`;
                              }

                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg bg-gray-100 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer shadow-sm"
                                  >
                                    Click Here
                                  </a>
                                </div>
                              );
                            }

                            // Special handling for status in Preparation/Marketing modals
                            if (isStatusField && isPrepOrMarketing) {
                              const statusValue = formData[key] || "";
                              const displayValue = statusValue.toUpperCase();
                              const normalized = statusValue.toLowerCase();
                              const isActive = normalized === "active";

                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <div
                                    className={`w-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg border border-blue-200 bg-white shadow-sm`}
                                  >
                                    <span
                                      className={`font-semibold px-2.5 py-1 rounded-full ${
                                        isActive
                                          ? "text-green-700 bg-green-100"
                                          : "text-red-800 bg-red-100"
                                      }`}
                                    >
                                      {displayValue}
                                    </span>
                                  </div>
                                </div>
                              );
                            }




                            const fieldEnumOptions = getEnumOptions(key);
                            if (fieldEnumOptions) {
                              const currentValue = currentFormValues[key] || formData[key] || "";
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register(key)}
                                    value={currentValue}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                                  >
                                    {fieldEnumOptions.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }
                            if (isTypeField && isVendorModal) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register(key)}
                                    value={currentFormValues[key] || formData[key] || ""}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                                  >
                                    {vendorTypeOptions.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }
                            if (isStatusField && isVendorModal) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register(key)}
                                    value={currentFormValues[key] || formData[key] || ""}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
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
                            if (isStatusField && !isVendorModal) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register(key)}
                                    value={currentFormValues[key] || formData[key] || ""}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                                  >
                                    {genericStatusOptions.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }
                            if (isBatchField) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register("batchid")}
                                    value={currentFormValues.batchid || formData.batchid || ""}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                                  >
                                    <option value="">Select a batch (optional)</option>
                                    {mlBatches.map(batch => (
                                      <option key={batch.batchid} value={batch.batchid}>
                                        {batch.batchname}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }
                            if (dateFields.includes(key.toLowerCase())) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <input
                                    type="date"
                                    {...register(key)}
                                    defaultValue={formData[key] || ""}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                                  />
                                </div>
                              );
                            }
                            if (enumOptions[key.toLowerCase()]) {
                              const currentValue = currentFormValues[key] || formData[key] || "";
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register(key)}
                                    value={currentValue}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                                  >
                                    {enumOptions[key.toLowerCase()].map((opt) => (
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
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <textarea
                                    {...register(key)}
                                    defaultValue={formData[key] || ""}
                                    rows={3}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-none"
                                  />
                                </div>
                              );
                            }
                            return (
                              <div key={key} className="space-y-1 sm:space-y-1.5">
                                <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                  {toLabel(key)}
                                </label>
                                <input
                                  type="text"
                                  {...register(key)}
                                  defaultValue={formData[key] || ""}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
                                />
                              </div>
                            );
                          })}
                      </div>
                    ))}
                </div>
                {sectionedFields["Notes"].length > 0 && (
                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-blue-200">
                    <div className="space-y-6">
                      {sectionedFields["Notes"].map(({ key, value }) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {toLabel(key)}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const timestamp = `[${new Date().toLocaleString()}]: `;
                                const newContent = `<p><strong>${timestamp}</strong></p>${currentFormValues.notes || formData.notes || ""}`;

                                setValue("notes", newContent);
                                setFormData((prev) => ({
                                  ...prev,
                                  notes: newContent
                                }));

                                setTimeout(() => {
                                  const quillEditor = document.querySelector('.ql-editor') as HTMLElement;
                                  if (quillEditor) {
                                    quillEditor.focus();
                                    const range = document.createRange();
                                    const sel = window.getSelection();
                                    const firstP = quillEditor.querySelector('p');
                                    if (firstP && firstP.firstChild) {
                                      range.setStart(firstP, 1);
                                      range.collapse(true);
                                      sel?.removeAllRanges();
                                      sel?.addRange(range);
                                    }
                                  }
                                }, 0);
                              }}
                              className="px-2 sm:px-2 py-1 sm:py-1 text-sm sm:text-sm font-medium text-black hover:text-blue-800 hover:underline
                                        
                                         "
                            >
                              + New Entry
                            </button>
                          </div>
                          <ReactQuill
                            theme="snow"
                            value={currentFormValues.notes || formData.notes || ""}
                            onChange={(content) => {
                              setValue("notes", content);
                              setFormData((prev) => ({ ...prev, notes: content }));
                            }}
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end mt-3 sm:mt-4 md:mt-6 pt-2 sm:pt-3 md:pt-4 border-t border-blue-200">
                  <button
                    type="submit"
                    className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}