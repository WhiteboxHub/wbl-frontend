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
  interviewer_emails: "Professional Information",
  interviewer_contact: "Professional Information",
  id: "Basic Information",
  alias: "Basic Information",
  Fundamentals: "Basic Information",
  AIML: "Basic Information",
  full_name: "Basic Information",
  email: "Basic Information",
  phone: "Basic Information",
  status: "Basic Information",
  batchid: "Contact Information",
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
  google_voice_number: "Basic Information",
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
  fee_paid: "Basic Information",
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
  assigned_date:"Basic Information",
  employee_name:"Basic Information",

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
  "assigned_date",
  "due_date"
];

export function EditModal({
  isOpen,
  onClose,
  data,
  title,
  onSave,
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

  const [batches, setBatches] = useState<Batch[]>([]);
  const courseId = "3";

  const fetchBatches = async (courseId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No access token found");
        setBatches([]);
        return;
      }
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/batch?course=${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBatches(res.data);
    } catch (error) {
      console.error("Failed to fetch batches:", error);
      setBatches([]);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchBatches(courseId);
    }
  }, [isOpen, courseId]);

  const [formData, setFormData] = React.useState<Record<string, any>>(
    flattenData(data || {})
  );

  React.useEffect(() => {
    if (data) {
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
        setCourses(res.data);
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
        setSubjects(res.data);
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

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: value };
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
                  {sectionedFields[section].map(({ key, value }) => {
                    const isTypeField = key.toLowerCase() === "type";
                    const isBatchField = key.toLowerCase() === "batchid";
                    const isVendorField = isVendorModal && key.toLowerCase() === "status";

                    // Instructor Dropdowns
                    if (key === "instructor1_name") {
                      return (
                        <div key={key} className="space-y-1">
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {toLabel(key)}
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
                            {formData.instructor1_name && (
                              <option value={formData.instructor1_id || ""}>
                                {formData.instructor1_name}
                              </option>
                            )}
                            <option value="">Select Instructor</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    if (key === "instructor2_name") {
                      return (
                        <div key={key} className="space-y-1">
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {toLabel(key)}
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
                            {formData.instructor2_name && (
                              <option value={formData.instructor2_id || ""}>
                                {formData.instructor2_name}
                              </option>
                            )}
                            <option value="">Select Instructor</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    if (key === "instructor3_name") {
                      return (
                        <div key={key} className="space-y-1">
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {toLabel(key)}
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
                            {formData.instructor3_name && (
                              <option value={formData.instructor3_id || ""}>
                                {formData.instructor3_name}
                              </option>
                            )}
                            <option value="">Select Instructor</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    // Subject ID Dropdown
                    if (key.toLowerCase() === "subjectid") {
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

                    // Course Name Dropdown
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

                    // Subject Name Dropdown
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

                    // Type Field: Dropdown only for vendor modals, else read-only
                    if (isTypeField) {
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
                              readOnly
                              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100 bg-gray-100 cursor-not-allowed"
                            />
                          </div>
                        );
                      }
                    }

                    // Original logic for all other fields
                    return (
                      <div key={key} className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {toLabel(key)}
                        </Label>
                        {key.toLowerCase() === "courseid" ? (
                          <select
                            value={formData["courseid"]}
                            onChange={(e) =>
                              handleChange("courseid", Number(e.target.value))
                            }
                            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-gray-100"
                          >
                            {courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.id}
                              </option>
                            ))}
                            <option value="0">0</option>
                            <option value="9">9</option>
                          </select>
                        ) : isBatchField ? (
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
                        ) : dateFields.includes(key.toLowerCase()) ? (
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
                        ) : isVendorField ? (
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
                        ) : enumOptions[key.toLowerCase()] ? (
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
                    );
                  })}
                </div>
              ))}
          </div>
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
