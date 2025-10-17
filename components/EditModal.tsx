//fixing
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import axios from "axios";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

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
  "instructor3_id", "enddate", "candidate_id","batch"
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
  email: "Basic Information",
  phone: "Basic Information",
  status: "Basic Information",
  batchid: "Contact Information",
  batch: "Basic Information",
  start_date: "Professional Information",
  batchname: "Basic Information",
  target_date_of_marketing: "Basic Information",
  move_to_prep: "Basic Information",
  move_to_placement: "Basic Information",
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
  move_to_mrkt: "Basic Information",
  lastlogin: "Professional Information",
  logincount: "Professional Information",
  course: "Professional Information",
  registereddate: "Basic Information",
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
  linkedin: "Contact Information",
  github: "Contact Information",
  resume: "Contact Information",
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
  cm_course: "Professional Information", 
  cm_subject: "Basic Information",
  material_type: "Basic Information",
  secondary_email:"Contact Information",
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
    { value: "Client", label: "Client" },
    { value: "third-party-vendor", label: "Third Party Vendor" },
    { value: "implementation-partner", label: "Implementation Partner" },
    { value: "sourcer", label: "Sourcer" },
    { value: "contact-from-ip", label: "Contact from IP" },
  ],
  company_type: [
    { value: "", label: "Select" },
    { value: "client", label: "Client" },
    { value: "third-party-vendor", label: "Third Party Vendor" },
    { value: "implementation-partner", label: "Implementation Partner" },
    { value: "sourcer", label: "Sourcer" },
    { value: "contact-from-ip", label: "Contact from IP" },
  ],
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
  rating: [
    { value: "", label: "Select Rating" },
    { value: "Good", label: "Good" },
    { value: "Very Good", label: "Very Good" },
    { value: "Average", label: "Average" },
    { value: "Poor", label: "Poor" },
    { value: "Need to Improve", label: "Need to Improve" },
  ],
  tech_rating: [
    { value: "", label: "Select Rating" },
    { value: "Good", label: "Good" },
    { value: "Very Good", label: "Very Good" },
    { value: "Average", label: "Average" },
    { value: "Poor", label: "Poor" },
    { value: "Need to Improve", label: "Need to Improve" },
  ],
  communication: [
    { value: "", label: "Select" },
    { value: "Very Good", label: "Very Good" },
    { value: "Average", label: "Average" },
    { value: "Good", label: "Good" },
    { value: "Need to Improve", label: "Need to Improve" },
    { value: "Poor", label: "Poor" },
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
  feedback: [
    { value: 'Pending', label: 'Pending' },
    { value: 'Positive', label: 'Positive' },
    { value: 'Negative', label: 'Negative' },
  ],
  material_type: [
    { value: "P", label: "Presentations" },
    { value: "C", label: "Cheatsheets" },
    { value: "D", label: "Diagrams" },
    { value: "S", label: "Softwares" },
    { value: "I", label: "Installations" },
    { value: "B", label: "Books" },
    { value: "N", label: "Newsletters" },
    { value: "M", label: "Materials" },
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
  marketing_manager_obj: "Marketing Manager",
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
  cm_course: "Course Name",
  cm_subject: "Subject Name",
  material_type: "Material Type"
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
  const modalRef = useRef<HTMLDivElement>(null);

  const isCourseMaterialModal = title.toLowerCase().includes("coursematerial") || 
                               title.toLowerCase().includes("course material");

  const isCourseSubjectModal = title.toLowerCase().includes("coursesubject") || 
                               title.toLowerCase().includes("course-subject");

  // Escape key handler
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

  // Outside click handler
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
    
    if (data.type) {
      flattened.material_type = data.type;
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

    // Handle date fields formatting
    dateFields.forEach(dateField => {
      if (flattened[dateField] && !isNaN(new Date(flattened[dateField]).getTime())) {
        flattened[dateField] = new Date(flattened[dateField]).toISOString().split('T')[0];
      }
    });
    
    return flattened;
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sortedCourses = res.data.sort((a: any, b: any) => b.id - a.id);
        
        let coursesWithOrphans = [...sortedCourses];
        if (isCourseMaterialModal && !coursesWithOrphans.some(course => course.id === 0)) {
          coursesWithOrphans.unshift({ id: 0, name: "Fundamentals" });
        }
        
        setCourses(coursesWithOrphans);
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
        const sortedSubjects = res.data.sort((a: any, b: any) => b.id - a.id);
    
        let subjectsWithOrphans = [...sortedSubjects];
        if (isCourseMaterialModal && !subjectsWithOrphans.some(subject => subject.id === 0)) {
          subjectsWithOrphans.unshift({ id: 0, name: "Basic Fundamentals" });
        }
        
        setSubjects(subjectsWithOrphans);
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
  }, [isCourseMaterialModal]);

  useEffect(() => {
    if (data && isOpen) {
      const flattenedData = flattenData(data);
      setFormData(flattenedData);
      reset(flattenedData);
    }
  }, [data, isOpen, reset]);

  const onSubmit = (formData: any) => {
    const reconstructedData = { ...formData };
    
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
    if (isCourseMaterialModal && ["subjectid", "courseid", "course_name", "subject_name"].includes(key.toLowerCase())) {
      return;
    }
    
    if (isCourseSubjectModal && ["cm_course", "cm_subject", "material_type"].includes(key.toLowerCase())) {
      return;
    }
    
    if (isCourseMaterialModal && key.toLowerCase() === "type") {
      return;
    }
    
    if (excludedFields.includes(key)) return;
    if (key === "id") return;
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
  const gridColsClass = {
    1: "grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 md:grid-cols-3",
    4: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }[columnCount] || "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  const isVendorModal = title.toLowerCase().includes("vendor");
  const isInterviewOrMarketing = title.toLowerCase().includes("interview") || title.toLowerCase().includes("marketing");

  if (!isOpen || !data) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
          <div 
            ref={modalRef}
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-6xl max-h-[95vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-5 border-b border-blue-200 flex justify-between items-center">
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

            {/* Modal Form */}
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
                        
                        {/* Course Material Specific Dropdowns */}
                        {isCourseMaterialModal && section === "Professional Information" && (
                          <div className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">
                              Course Name
                            </label>
                            <select
                              {...register("cm_course")}
                              defaultValue={formData.cm_course || ""}
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
                          <>
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                Subject Name
                              </label>
                              <select
                                {...register("cm_subject")}
                                defaultValue={formData.cm_subject || ""}
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

                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                Material Type
                              </label>
                              <select
                                {...register("material_type")}
                                defaultValue={formData.material_type || ""}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                              >
                                <option value="">Select Material Type</option>
                                {enumOptions["material_type"].map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                        
                        {section === "Professional Information" && title.toLowerCase().includes("preparation") && (
                          <>
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                Instructor 1
                              </label>
                              <select
                                {...register("instructor1_id")}
                                defaultValue={formData.instructor1_id || ""}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                              >
                                <option value="">Select Instructor</option>
                                {employees.map((emp) => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                Instructor 2
                              </label>
                              <select
                                {...register("instructor2_id")}
                                defaultValue={formData.instructor2_id || ""}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                              >
                                <option value="">Select Instructor</option>
                                {employees.map((emp) => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                Instructor 3
                              </label>
                              <select
                                {...register("instructor3_id")}
                                defaultValue={formData.instructor3_id || ""}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
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
                                ...(isCourseMaterialModal ? ["cm_course", "cm_subject", "material_type"] : [])
                              ].includes(key)
                          )
                          .map(({ key, value }) => {
                            const isTypeField = key.toLowerCase() === "type";
                            const isBatchField = key.toLowerCase() === "batchid";
                            const isVendorField = isVendorModal && key.toLowerCase() === "status";
                            
                            if (isInterviewOrMarketing && ["instructor1_name", "instructor2_name", "instructor3_name"].includes(key)) {
                              return null;
                            }

                            if (isTypeField && isVendorModal) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register(key)}
                                    defaultValue={formData[key] || ""}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                                  >
                                    {enumOptions["type"].map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }

                            if (key.toLowerCase() === "subjectid") {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register(key)}
                                    defaultValue={formData[key] || "0"}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
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

                            if (key.toLowerCase() === "course_name") {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register("course_name")}
                                    defaultValue={formData.course_name || ""}
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
                              );
                            }

                            if (key.toLowerCase() === "subject_name") {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register("subject_name")}
                                    defaultValue={formData.subject_name || ""}
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
                                    defaultValue={formData.batchid || ""}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
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

                            if (isVendorField) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register(key)}
                                    defaultValue={formData[key] || ""}
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

                            if (enumOptions[key.toLowerCase()]) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register(key)}
                                    defaultValue={formData[key] || ""}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                                  >
                                    {reorderYesNoOptions(key, formData[key], enumOptions[key.toLowerCase()]).map((opt) => (
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

                {/* Notes Section */}
                {sectionedFields["Notes"].length > 0 && (
                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-blue-200">
                    <div className="space-y-3 sm:space-y-4">
                      {sectionedFields["Notes"].map(({ key }) => (
                        <div key={key} className="space-y-1 sm:space-y-1.5">
                          <label className="block text-xs sm:text-sm font-bold text-blue-700">
                            {toLabel(key)}
                          </label>
                          <ReactQuill
                            theme="snow"
                            value={formData.notes || ""}
                            onChange={(content) => {
                              setValue("notes", content);
                              setFormData(prev => ({ ...prev, notes: content }));
                            }}
                            className="text-xs sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const timestamp = `[${new Date().toLocaleString()}]`;
                              const newNotes = (formData.notes || "") + `\n${timestamp}\n`;
                              setValue("notes", newNotes);
                              setFormData(prev => ({ ...prev, notes: newNotes }));
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            + Add Timestamp
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Footer - Only Save button */}
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