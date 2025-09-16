
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
import axios from "axios";



interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
  onSave: (updatedData: Record<string, any>) => void;
}

const excludedFields = [
   "candidate",
  "instructor1",
  "instructor2",
  "instructor3",
  "id",
  "sessionid",
  "vendor_type",
  "last_mod_datetime",
  "last_mod_datetime",
  "last_modified",
  "logincount",
  "googleId",
  "subject_id",
  "lastmoddatetime",
  "course_id",
  "new_subject_id",
  "instructor_1id",
  "instructor_2id",
  "instructor_3id",
  "instructor1_id",
  "instructor2_id",
  "instructor3_id",
  "enddate",


];

const fieldSections: Record<string, string> = {
  candidate_full_name: "Professional Information",
  instructor1_name: "Professional Information",
  instructor2_name: "Professional Information",
  instructor3_name: "Professional Information",
  id: "Basic Information",
  alias: "Basic Information",
  Fundamentals: "Basic Information",
  AIML: "Basic Information",
  full_name: "Basic Information",
  extraction_date: "Basic Information",
  filename: "Basic Information",
  start_date: "Basic Information",
  type: "Professional Information",
  email: "Basic Information",
  company_name: "Basic Information",
  linkedin_id: "Contact Information",
  enrolled_date: "Professional Information",
  startdate: "Professional Information",
  status: "Basic Information",
  linkedin_connected: "Professional Information",
  intro_email_sent: "Professional Information",
  intro_call: "Professional Information",
  moved_to_vendor: "Professional Information",
  phone_number: "Basic Information",
  secondary_phone: "Contact Information",
  last_mod_datetime:"Contact Information",
  location: "Contact Information",
  agreement: "Professional Information",
  sessionid: "Basic Information",
  subject_id: "Basic Information",
  subjectid: "Professional Information",
  courseid: "Professional Information",
  candidateid: "Basic Information",
  uname: "Basic Information",
  fullname: "Basic Information",
  candidate_id: "Basic Information",
  candidate_email: "Basic Information",
  placement_date: "Basic Information",
  batch: "Basic Information",
  leadid: "Basic Information",
  name: "Basic Information",
  enddate: "Professional Information",
  candidate_name: "Basic Information",
  candidate_role: "Basic Information",
  google_voice_number: "Basic Information",
  dob: "Basic Information",
  contact: "Basic Information",
  password: "Basic Information",
  end_date: "Professional Information",
  secondaryphone: "Contact Information",
  phone: "Basic Information",
  secondaryemail: "Contact Information",
  ssn: "Professional Information",
  priority: "Basic Information",
  source: "Basic Information",
  subject: "Basic Information",
  title: "Basic Information",
  enrolleddate: "Basic Information",
  orientationdate: "Basic Information",
  batchname: "Basic Information",
  batchid: "Contact Information",
  promissory: "Basic Information",
  lastlogin: "Professional Information",
  logincount: "Professional Information",
  course: "Professional Information",
  course_id: "Professional Information",
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
  entry_date: "Professional Information",
  closed_date: "Professional Information",
  closed: "Professional Information",
  secondary_email: "Contact Information",
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
  // instructor_1id: "Professional Information",
  // instructor_2id: "Professional Information",
  // instructor_3id: "Professional Information",
  // instructor1_id: "Professional Information",
  // instructor2_id: "Professional Information",
  // instructor3_id: "Professional Information",
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

};

const workVisaStatusOptions = [
  { value: "waiting for status", label: "Waiting for Status" },
  { value: "citizen", label: "Citizen" },
  { value: "f1", label: "F1" },
  { value: "other", label: "Other" },
  { value: "permanent resident", label: "Permanent Resident" },
  { value: "h4", label: "H4" },
  { value: "ead", label: "EAD" },
];

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
  massemail_email_sent: "Massemail Email Sent",
  massemail_unsubscribe: "Massemail Unsubscribe",
  moved_to_candidate: "Moved To Candidate",
  // instructor_1id: "Instructor 1",
  // instructor_2id: "Instructor 2",
  // instructor_3id: "Instructor 3",
  // instructor1_id: "Instructor 1",
  // instructor2_id: "Instructor 2",
  // instructor3_id: "Instructor 3",
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
  "startdate",
  "enddate",
  "closed_date",
  "entry_date",
  "created_at",
  "classdate",
  "sessiondate",
  "enrolled_date"
];

export function EditModal({
  isOpen,
  onClose,
  data,
  title,
  onSave,
}: EditModalProps) {
  if (!data) return null;


  // const [formData, setFormData] = React.useState<Record<string, any>>(data);


  const flattenData = (data: Record<string, any>) => {
    const flattened: Record<string, any> = { ...data };
    if (data.candidate) {
      flattened.candidate_full_name = data.candidate.full_name;
    }
    if (data.instructor1) {
      flattened.instructor1_name = data.instructor1.name;
    }
    if (data.instructor2) {
      flattened.instructor2_name = data.instructor2.name;
    }
    if (data.instructor3) {
      flattened.instructor3_name = data.instructor3.name;
    }
    return flattened;
  };

  const [formData, setFormData] = React.useState<Record<string, any>>(
    flattenData(data)
  );

    React.useEffect(() => {
      setFormData(flattenData(data));
    }, [data]);

  const [courses, setCourses] = React.useState<{ id: number; name: string }[]>([]);

  React.useEffect(() => {
  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`);
      setCourses(res.data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  fetchCourses();
}, []);

   if (!data) return null;

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
  const isVendorTable = title.toLowerCase().includes("vendor");

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
        {/* Form */}
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
              };
            }
            if (formData.instructor2_name) {
              reconstructedData.instructor2 = {
                ...data.instructor2,
                name: formData.instructor2_name,
              };
            }
            if (formData.instructor3_name) {
              reconstructedData.instructor3 = {
                ...data.instructor3,
                name: formData.instructor3_name,
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
                    return (
                      <div key={key} className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {toLabel(key)}
                        </Label>
                        {/* Course ID Dropdown  */}
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
                            {/* 0 and 9 IDs */}
                            <option value="0">0</option>
                            <option value="9">9</option>
                          </select> 
                         ) : isBatchField ? (
                          <Input
                            value={formData["batchid"] ?? ""}
                            onChange={(e) => handleChange("batchid", e.target.value)}
                          />
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
                        ) : isTypeField && isVendorModal ? (
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
                        ) : isTypeField && !isVendorModal ? (
                          <Input
                            value={formData[key] ?? ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                          />
                        ) : key.toLowerCase() === "status" && isVendorTable ? (
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
