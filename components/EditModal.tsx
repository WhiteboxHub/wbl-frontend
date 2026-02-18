"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import axios from "axios";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import { QuillWithMentions } from "@/components/QuillWithMentions";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

// Enum options for various fields
const enumOptions: Record<string, { value: any; label: string }[]> = {
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
  is_immigration_team: [
    { value: false, label: "No" },
    { value: true, label: "Yes" },
  ],
  recipient_source: [
    { value: "CSV", label: "Local CSV File" },
    { value: "OUTREACH_DB", label: "Outreach Database" },
  ],
  date_filter: [
    { value: "ALL_ACTIVE", label: "All Active" },
    { value: "TODAY", label: "Today" },
    { value: "LAST_N_DAYS", label: "Last N Days" },
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
    { value: "Excellent", label: "Excellent" },
    { value: "Very Good", label: "Very Good" },
    { value: "Good", label: "Good" },
    { value: "Average", label: "Average" },
    { value: "Need to Improve", label: "Need to Improve" },
  ],
  communication: [
    { value: "", label: "Select" },
    { value: "Excellent", label: "Excellent" },
    { value: "Very Good", label: "Very Good" },
    { value: "Good", label: "Good" },
    { value: "Average", label: "Average" },
    { value: "Need to Improve", label: "Need to Improve" },
  ],
  job_request_status: [
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "PROCESSING", label: "Processing" },
    { value: "PROCESSED", label: "Processed" },
    { value: "FAILED", label: "Failed" },
  ],
  request_job_type: [
    { value: "EMAIL_EXTRACTION", label: "Email Extraction" },
    { value: "LINKEDIN_CONNECTION", label: "LinkedIn Connection" },
    { value: "LEAD_GENERATION", label: "Lead Generation" },
  ],


  workstatus: [
    { value: "", label: "Waiting for Status" },
    { value: "US_CITIZEN", label: "US Citizen" },
    { value: "GREEN_CARD", label: "Green Card" },
    { value: "GC_EAD", label: "GC EAD" },
    { value: "I485_EAD", label: "I485 EAD" },
    { value: "I140_APPROVED", label: "I140 Approved" },
    { value: "F1", label: "F1" },
    { value: "F1_OPT", label: "F1 OPT" },
    { value: "F1_CPT", label: "F1 CPT" },
    { value: "J1", label: "J1" },
    { value: "J1_AT", label: "J1 AT" },
    { value: "H1B", label: "H1B" },
    { value: "H1B_TRANSFER", label: "H1B Transfer" },
    { value: "H1B_CAP_EXEMPT", label: "H1B Cap Exempt" },
    { value: "H4", label: "H4" },
    { value: "H4_EAD", label: "H4 EAD" },
    { value: "L1A", label: "L1A" },
    { value: "L1B", label: "L1B" },
    { value: "L2", label: "L2" },
    { value: "L2_EAD", label: "L2 EAD" },
    { value: "O1", label: "O1" },
    { value: "TN", label: "TN" },
    { value: "E3", label: "E3" },
    { value: "E3_EAD", label: "E3 EAD" },
    { value: "E2", label: "E2" },
    { value: "E2_EAD", label: "E2 EAD" },
    { value: "TPS_EAD", label: "TPS EAD" },
    { value: "ASYLUM_EAD", label: "Asylum EAD" },
    { value: "REFUGEE_EAD", label: "Refugee EAD" },
    { value: "DACA_EAD", label: "DACA EAD" },
  ],

  visa_status: [
    { value: "", label: "Waiting for Status" },
    { value: "US_CITIZEN", label: "US Citizen" },
    { value: "GREEN_CARD", label: "Green Card" },
    { value: "GC_EAD", label: "GC EAD" },
    { value: "I485_EAD", label: "I485 EAD" },
    { value: "I140_APPROVED", label: "I140 Approved" },
    { value: "F1", label: "F1" },
    { value: "F1_OPT", label: "F1 OPT" },
    { value: "F1_CPT", label: "F1 CPT" },
    { value: "J1", label: "J1" },
    { value: "J1_AT", label: "J1 AT" },
    { value: "H1B", label: "H1B" },
    { value: "H1B_TRANSFER", label: "H1B Transfer" },
    { value: "H1B_CAP_EXEMPT", label: "H1B Cap Exempt" },
    { value: "H4", label: "H4" },
    { value: "H4_EAD", label: "H4 EAD" },
    { value: "L1A", label: "L1A" },
    { value: "L1B", label: "L1B" },
    { value: "L2", label: "L2" },
    { value: "L2_EAD", label: "L2 EAD" },
    { value: "O1", label: "O1" },
    { value: "TN", label: "TN" },
    { value: "E3", label: "E3" },
    { value: "E3_EAD", label: "E3 EAD" },
    { value: "E2", label: "E2" },
    { value: "E2_EAD", label: "E2 EAD" },
    { value: "TPS_EAD", label: "TPS EAD" },
    { value: "ASYLUM_EAD", label: "Asylum EAD" },
    { value: "REFUGEE_EAD", label: "Refugee EAD" },
    { value: "DACA_EAD", label: "DACA EAD" },
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
    { value: "Pending", label: "Pending" },
    { value: "Positive", label: "Positive" },
    { value: "Negative", label: "Negative" },
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
    { value: "", label: "Select Type" },
    { value: "Company", label: "Company" },
    { value: "Client", label: "Client" },
    { value: "Vendor", label: "Vendor" },
    { value: "Implementation Partner", label: "Implementation Partner" },
  ],
  placement_status: [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Complete", label: "Complete" },
    { value: "Fired", label: "Fired" },
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
  classification: [
    { value: "company_contact", label: "Company Contact" },
    { value: "personal_domain_contact", label: "Personal Domain Contact" },
    { value: "linkedin_only_contact", label: "LinkedIn Only Contact" },
    { value: "company_only", label: "Company Only" },
    { value: "unknown", label: "Unknown" },
  ],
  extract_processing_status: [
    { value: "new", label: "New" },
    { value: "classified", label: "Classified" },
    { value: "moved", label: "Moved" },
    { value: "duplicate", label: "Duplicate" },
    { value: "error", label: "Error" },
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
  activity_type: [
    { value: "extraction", label: "extraction" },
    { value: "connection", label: "connection" },
  ],
  status: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  linkedin_status: [
    { value: "idle", label: "Idle" },
    { value: "running", label: "Running" },
    { value: "error", label: "Error" },
    { value: "completed", label: "Completed" },
  ],

  amount_collected: [
    { value: "no", label: "No" },
    { value: "yes", label: "Yes" },
  ],

  no_of_installments: [
    { value: "", label: "Select Installments" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
  ],
  employee_task_status: [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "blocked", label: "Blocked" },
  ],
  employee_task_priority: [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ],
  category: [
    { value: "manual", label: "Manual" },
    { value: "automation", label: "Automation" },
  ],
  match_type: [
    { value: "exact", label: "Exact" },
    { value: "contains", label: "Contains" },
    { value: "regex", label: "Regex" },
  ],
  action: [
    { value: "allow", label: "Allow" },
    { value: "block", label: "Block" },
  ],
  is_active: [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ],
  position_type: [
    { value: "full_time", label: "Full Time" },
    { value: "contract", label: "Contract" },
    { value: "contract_to_hire", label: "Contract to Hire" },
    { value: "internship", label: "Internship" },
  ],
  employment_mode: [
    { value: "hybrid", label: "Hybrid" },
    { value: "onsite", label: "Onsite" },
    { value: "remote", label: "Remote" },
  ],
  position_status: [
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "on_hold", label: "On Hold" },
    { value: "duplicate", label: "Duplicate" },
    { value: "invalid", label: "Invalid" },
  ],
  source: [
    { value: "linkedin", label: "LinkedIn" },
    { value: "job_board", label: "Job Board" },
    { value: "vendor", label: "Vendor" },
    { value: "email", label: "Email" },
    { value: "scraper", label: "Scraper" },
  ],
  processing_status: [
    { value: "new", label: "New" },
    { value: "parsed", label: "Parsed" },
    { value: "mapped", label: "Mapped" },
    { value: "discarded", label: "Discarded" },
    { value: "error", label: "Error" },
  ],
  email_invalid: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  domain_invalid: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  unsubscribe_flag: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  bounce_flag: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
  ],
  complaint_flag: [
    { value: "false", label: "No" },
    { value: "true", label: "Yes" },
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

// Required fields configuration - only for create mode
const requiredFieldsConfig: Record<string, string[]> = {
  leads: ["Phone", "Email", "Full Name"],
  candidate: ["Phone", "Email", "Full Name", "Date of Birth", "Batch"],
  interviews: [
    "Candidate Name",
    "Company",
    "Interview Date",
    "Company Type",
    "Mode of Interview",
    "Type of Interview",
  ],
  authuser: ["Phone", "Email", "Full Name", "Registered Date", "Passwd"],
  employee: ["Full Name", "Email", "Phone", "Date of Birth", "Aadhaar"],
  placement: ["Placement ID", 'Deposit Date'],
  project: ["Project Name", "Owner", "Start Date"],
  positions: ["Title", "Company"],
  "job listings": ["Title", "Company"],
  vendor_contact: ["Phone", "Email", "Full Name", "Linkedin ID"],
};

// Helper function to check if a field is required based on modal type and mode

const isFieldRequired = (fieldName: string, modalType: string, isAddMode: boolean): boolean => {
  const modalKey = modalType.toLowerCase();
  if (!isAddMode && !modalKey.includes("position") && !modalKey.includes("job listing")) return false;)

  const fieldConfigMap: Record<string, string[]> = {};

  Object.entries(requiredFieldsConfig).forEach(([key, fields]) => {
    fields.forEach((field) => {
      const normalizedField = field.toLowerCase().replace(/\s+/g, "");
      fieldConfigMap[normalizedField] = fieldConfigMap[normalizedField] || [];
      fieldConfigMap[normalizedField].push(key);
    });
  });


  const normalizedFieldName = fieldName.toLowerCase().replace(/\s+/g, '');
  const requiredForModals = fieldConfigMap[normalizedFieldName];
  if (!requiredForModals) return false;

  return requiredForModals.some((modal) => modalKey.includes(modal));
};

const genericStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "break", label: "Break" },
  { value: "discontinued", label: "Discontinued" },
  { value: "closed", label: "Closed" },
];

const materialTypeOptions = [
  { value: "P", label: "Presentations" },
  { value: "Y", label: "Must See Youtube Videos" },
  { value: "C", label: "Cheatsheets" },
  { value: "SG", label: "Study Guides" },
  { value: "D", label: "Diagrams" },
  { value: "S", label: "Softwares" },
  { value: "I", label: "Interactive Visual Explainers" },
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
  isAddMode?: boolean;
}

// Fields to exclude from the form
const excludedFields = [
  "candidate",
  "instructor1",
  "instructor2",
  "instructor3",
  "id",
  "config_json",
  "sessionid",
  "vendor_type",
  "last_mod_datetime",
  "last_mod_date",
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
  "company",
  "contact",
  "batch",
  "lastSync",
  "synced",
  "lastmod_date_time",
  "lastmod_user_name",
  "job_id",
  "employee_id",
  "job_owner_id",
  "job_owner_name",
  "lastmod_date",
  "isGroup",
  "isExpanded",
  "totalDeposit",
  "originalId",
  "paidCount",
  "totalCount",
  "collectedAmount",
  "pendingAmount",
  "lastDepositDate",
  "end_date",
  "requested_at",
  "marketing_id",
  "project_id",
  "project",
  "position_company",
  "position_title",
  "position_id",
  "created_from_raw_id",
  "moved_at",
  "candidate_id",
  "created_at",
  "processed_at",
  "classification",
  "processing_status",
  "target_table",
  "target_id",
  "error_message",
];

// Fields that should be read-only (visible but not editable)
const readonlyFields = [
  "created_at", "processed_at",
  "extracted_at",
  "created_datetime",
  "updated_at",
  "lastmod_datetime",
  "last_modified_datetime", "created_datetime",
  "lastmod_datetime",
  "last_modified_datetime", "created_userid", "lastmod_userid",
];


// Field visibility configuration
const fieldVisibility: Record<string, string[]> = {
  instructor: ["preparation", "interview", "marketing"],
  linkedin: [
    "preparation",
    "interview",
    "marketing",
    "candidate",
    "vendor",
    "client",
    "daily contact",
    "vendor contact",
    "automation-contact-extract",
    "personal",
    "linkedin only",
    "domain",
  ],
};

// Helper functions for field visibility
const shouldShowInstructorFields = (title: string): boolean => {
  const lowerTitle = title.toLowerCase();
  return fieldVisibility.instructor.some((modal) => lowerTitle.includes(modal));
};

const shouldShowLinkedInField = (title: string): boolean => {
  const lowerTitle = title.toLowerCase();
  return fieldVisibility.linkedin.some((modal) => lowerTitle.includes(modal));
};

// Map fields to their respective sections
const fieldSections: Record<string, string> = {
  candidate_full_name: "Basic Information",
  instructor1_name: "Professional Information",
  instructor2_name: "Professional Information",
  instructor3_name: "Professional Information",
  interviewer_emails: "Contact Information",
  interviewer_contact: "Contact Information",
  interviewer_linkedin: "Contact Information",
  amount_collected: "Contact Information",
  emails_read: "Basic Information",
  id: "Basic Information",
  placement_id: "Basic Information",
  installment_id: "Basic Information",
  deposit_amount: "Basic Information",
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
  move_to_prep: "Basic Information",
  move_to_mrkt: "Basic Information",
  recipient_source: "Basic Information",
  date_filter: "Basic Information",
  lookback_days: "Basic Information",
  batch_size: "Basic Information",
  csv_offset: "Basic Information",
  linkedin_id: "Contact Information",
  enrolled_date: "Professional Information",
  startdate: "Professional Information",
  type: "Professional Information",
  company_name: "Professional Information",
  linkedin_connected: "Professional Information",
  intro_email_sent: "Professional Information",
  intro_call: "Professional Information",
  phone_number: "Basic Information",
  secondary_phone: "Contact Information",
  last_mod_datetime: "Contact Information",
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
  linkedin_premium_end_date: "Professional Information",
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
  company: "Basic Information",
  company_type: "Professional Information",
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
  interview_date: "Basic Information",
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
  aadhaar: "Professional Information",
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
  address: "Contact Information",
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
  no_of_installments: "Professional Information",
  joining_date: "Professional Information",
  subject_name: "Basic Information",
  employee_name: "Basic Information",
  secondaryphone: "Contact Information",
  secondary_email: "Contact Information",
  cm_course: "Professional Information",
  cm_subject: "Basic Information",
  material_type: "Basic Information",
  job_name: "Basic Information",
  job_description: "Professional Information",
  created_date: "Professional Information",
  activity_date: "Professional Information",
  activity_count: "Professional Information",
  job_owner: "Basic Information",
  assigned_date: "Basic Information",
  category: "Professional Information",
  keywords: "Professional Information",
  match_type: "Basic Information",
  action: "Basic Information",
  is_immigration_team: "Basic Information",
  context: "Professional Information",
  // updated_at: "Professional Information",
  job_title: "Professional Information",
  location: "Professional Information",
  extraction_date: "Professional Information",
  is_in_prep: "Basic Information",
  is_in_marketing: "Professional Information",
  normalized_title: "Basic Information",
  position_type: "Basic Information",
  employment_mode: "Basic Information",
  confidence_score: "Professional Information",
  contact_email: "Contact Information",
  contact_phone: "Contact Information",
  contact_linkedin: "Contact Information",
  job_url: "Professional Information",
  description: "Notes",

  // Linkedin Only Contact Fields
  source_uid: "Professional Information",
  position_id: "Basic Information",
  address1: "Contact Information",
  address2: "Contact Information",
  postal_code: "Contact Information",
  phone_ext: "Professional Information",
  domain: "Basic Information",
  linkedin_internal_id: "Professional Information",
  company_id: "Basic Information",
  // Raw Job Listing fields
  raw_title: "Basic Information",
  raw_company: "Basic Information",
  processing_status: "Basic Information",
  extractor_version: "Professional Information",
  extracted_at: "Professional Information",
  raw_location: "Contact Information",
  raw_contact_info: "Contact Information",
  raw_zip: "Contact Information",
  raw_description: "Notes",
  raw_payload: "Raw Payload",
  raw_notes: "Notes",
  candidate_id: "Basic Information",
  // Outreach Email Recipient fields
  email_invalid: "Professional Information",
  domain_invalid: "Professional Information",
  email_lc: "Contact Information",
  source_type: "Basic Information",
  source_id: "Basic Information",
  unsubscribe_flag: "Basic Information",
  unsubscribe_at: "Contact Information",
  unsubscribe_reason: "Contact Information",
  bounce_flag: "Basic Information",
  bounce_type: "Professional Information",
  bounce_reason: "Professional Information",
  bounce_code: "Professional Information",
  bounced_at: "Professional Information",
  complaint_flag: "Contact Information",
  complained_at: "Contact Information",
  source_reference: "Basic Information",
  classification: "Basic Information",
  target_table: "Other",
  target_id: "Other",
  error_message: "Other",
  processed_at: "Other",
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
  placement_id: "Placement ID",
  candidate_id: "Candidate ID",
  candidate_email: "Candidate Email",
  uname: "Email",
  fullname: "Full Name",
  candidate_name: "Candidate Name",
  lastmod_user_name: "Last Modified By",
  candidate_role: "Candidate Role",
  google_voice_number: "Google Voice Number",
  target_end_date: "Target End Date",
  due_date: "Due Date",
  linkedin_premium_end_date: "LinkedIn Premium End Date",
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
  address1: "Address 1",
  address2: "Address 2",
  postal_code: "Postal Code",
  phone_ext: "Phone Ext",
  domain: "Domain",
  linkedin_internal_id: "LinkedIn Internal ID",
  candidate_folder: "Candidate Folder",
  city: "City",
  state: "State",
  country: "Country",
  zip: "ZIP",
  emergcontactname: "Emergency Contact Name",
  emergcontactemail: "Emergency Contact Email",
  emergcontactphone: "Emergency Contact Phone",
  emergcontactaddrs: "Emergency Contact Address",
  secondaryphone: "Secondary Phone",
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
  sessiondate: "Session Date",
  classdate: "Class Date",
  filename: "File Name",
  startdate: "Start Date",
  enddate: "End Date",
  job_owner_1: "Job Owner 1",
  job_owner_2: "Job Owner 2",
  job_owner_3: "Job Owner 3",
  category: "Category",
  keywords: "Keywords",
  match_type: "Match Type",
  action: "Action",
  context: "Context",
  is_active: "Is Active",
  is_immigration_team: "Immigration Team",
  created_at: "Created On",
  updated_at: "Last Modified",
  recipient_source: "Recipient Source",
  date_filter: "Date Filter",
  lookback_days: "Lookback Days",
  batch_size: "Batch Size",
  csv_offset: "CSV Progress (Offset)",
  is_in_prep: "In Prep",
  is_in_marketing: "In Marketing",
  normalized_title: "Normalized Title",
  position_type: "Position Type",
  employment_mode: "Employment Mode",
  confidence_score: "Confidence Score",
  contact_email: "Contact Email",
  contact_phone: "Contact Phone",
  contact_linkedin: "Contact LinkedIn",
  job_url: "Job URL",
  source_uid: "Source UID",
  company_id: "Company ID",
  installment_id: "Installment",
  company_name: "Company",
  position_id: "Linked Position",
  created_datetime: "Created On",
  lastmod_datetime: "Last Modified",
  // Raw Job Listing field labels
  raw_title: "Raw Title",
  raw_company: "Raw Company",
  raw_location: "Raw Location",
  raw_zip: "Raw ZIP",
  raw_description: "Raw Description",
  raw_contact_info: "Raw Contact Info",
  raw_notes: "Raw Notes",
  raw_payload: "Raw Payload",
  processing_status: "Processing Status",
  extractor_version: "Extractor Version",
  extracted_at: "Extracted At",
  processed_at: "Processed At",
  error_message: "Error Message",
  // Outreach Email Recipient labels
  email_invalid: "Invalid Email",
  domain_invalid: "Invalid Domain",
  email_lc: "Email (Lower Case)",
  source_type: "Source Type",
  source_id: "Source ID",
  unsubscribe_flag: "Unsubscribed",
  unsubscribe_at: "Unsubscribe Date",
  unsubscribe_reason: "Unsubscribe Reason",
  bounce_flag: "Bounced",
  bounce_type: "Bounce Type",
  bounce_reason: "Bounce Reason",
  bounce_code: "Bounce Code",
  bounced_at: "Bounced Date",
  complaint_flag: "Complaint Flag",
  complained_at: "Complained Date",
  source_reference: "Source Reference",
  classification: "Classification",
  target_table: "Target Table",
  target_id: "Target ID",
};

const dateFields = [
  "orientationdate",
  "start_date",
  "startdate",
  "target_date",
  "enddate",
  "closed_date",
  "entry_date",
  "dob",
  "classdate",
  "sessiondate",
  "enrolled_date",
  "interview_date",
  "placement_date",
  "marketing_start_date",
  "linkedin_premium_end_date",
  "registereddate",
  "extraction_date",
  // "updated_at",
  "activity_date",
  "deposit_date",
  "joining_date",
  "assigned_date",
  "due_date",
  "target_end_date",
  // Outreach Email Recipient date fields
  "unsubscribe_at",
  "bounced_at",
  "complained_at",
  "processed_at",
  "created_at",
  "created_datetime",
];

export function EditModal({
  isOpen,
  onClose,
  data,
  title,
  onSave,
  batches: propBatches,
  isAddMode = false,
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
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [mlBatches, setMlBatches] = useState<Batch[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const [marketingCandidates, setMarketingCandidates] = useState<any[]>([]);
  const [shouldDisableBold, setShouldDisableBold] = useState(false);
  const [jobTypes, setJobTypes] = useState<{ id: number; name: string }[]>(
    []
  );
  const [candidatesWithInterviews, setCandidatesWithInterviews] = useState<{ id: number; full_name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [positionSuggestions, setPositionSuggestions] = useState<any[]>([]);
  const [isSearchingPositions, setIsSearchingPositions] = useState(false);
  const [positionSearchTerm, setPositionSearchTerm] = useState("");
  const positionDropdownRef = useRef<HTMLDivElement>(null);


  // Detect the modal context
  const isCourseMaterialModal =
    title.toLowerCase().includes("course material") ||
    title.toLowerCase().includes("material");
  const isCourseSubjectModal =
    title.toLowerCase().includes("course-subject") ||
    title.toLowerCase().includes("course subject");
  const isVendorModal = title.toLowerCase().includes("vendor");
  const isCandidateOrEmployee =
    title.toLowerCase().includes("candidate") ||
    title.toLowerCase().includes("employee");
  const isBatchesModal =
    title.toLowerCase().includes("batch") &&
    !title.toLowerCase().includes("course");

  const isInterviewModal = title.toLowerCase().includes("interview");
  const isMarketingModal = title.toLowerCase().includes("marketing");
  const isPlacementModal = title.toLowerCase().includes("placement");
  const isPreparationModal = title.toLowerCase().includes("preparation");
  const isEmployeeModal = title.toLowerCase().includes("employee") && !title.toLowerCase().includes("task");
  const isEmployeeTaskModal = title.toLowerCase().includes("employee task");
  const isProjectModal = title.toLowerCase().includes("project") && !isEmployeeTaskModal;
  const isLeadModal = title.toLowerCase().includes("lead");
  const isCandidateModal =
    title.toLowerCase().includes("candidate") && !isPreparationModal;
  const isLinkedInActivityModal = title
    .toLowerCase()
    .includes("linkedin activity");
  const isJobActivityLogModal = title
    .toLowerCase()
    .includes("job activity log");
  const isAutomationContactExtractModal = title
    .toLowerCase()
    .includes("automation contact extract");
  const isJobTypeModal = title.toLowerCase().includes("job type");
  const isAutomationKeywordModal = title.toLowerCase().includes("automation keyword");
  const isPositionsModal = title.toLowerCase().includes("position") || title.toLowerCase().includes("job listing");
  const isJobDefinitionModal = title.toLowerCase().includes("job definition");
  const isJobRequestModal = title.toLowerCase().includes("job request");
  const isPlacementFeeModal = title.toLowerCase().includes("placement fee");
  const isDailyContactModal = title.toLowerCase().includes("daily contact");

  // Field visibility for current modal
  const showInstructorFields =
    shouldShowInstructorFields(title) && !(isInterviewModal && isAddMode);
  const showLinkedInField = shouldShowLinkedInField(title);

  // modal for candidate_full_name first and read-only
  const isSpecialModal =
    isInterviewModal ||
    isMarketingModal ||
    isPlacementModal ||
    isPreparationModal;

  // Consolidate marketing candidate fetch logic
  useEffect(() => {
    if (isOpen && (isInterviewModal || isJobActivityLogModal)) {
      const fetchMarketingCandidatesList = async () => {
        try {
          const res = await apiFetch("/candidate/marketing?page=1&limit=500");
          const body = res?.data ?? res;
          const arr = Array.isArray(body) ? body : body.data ?? [];

          // Filter for ACTIVE marketing candidates with candidate data
          const activeCandidates = (arr || []).filter((m: any) => {
            const status = (m?.status || "").toString().toLowerCase();
            const hasCandidate = !!m.candidate && !!m.candidate.id;
            return status === "active" && hasCandidate;
          });

          // Sort alphabetically by candidate name
          activeCandidates.sort((a: any, b: any) =>
            (a.candidate?.full_name || "").localeCompare(b.candidate?.full_name || "")
          );

          setMarketingCandidates(activeCandidates);
        } catch (err: any) {
          console.error(
            "Failed to fetch marketing candidates:",
            err?.body ?? err
          );
        }
      };

      fetchMarketingCandidatesList();
    }
  }, [isOpen, isInterviewModal, isJobActivityLogModal]);

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
  }, [isOpen, propBatches, setValue]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
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
        // Sort employees alphabetically by name
        activeEmployees.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
        setEmployees(activeEmployees);
      } catch (error: any) {
        console.error(
          "Failed to fetch employees:",
          error?.response?.data || error.message || error
        );
      }
    };

    const fetchJobTypes = async () => {
      try {
        const res = await apiFetch("/api/job-types");
        const data = Array.isArray(res) ? res : [];
        setJobTypes(data);
      } catch (error: any) {
        console.error(
          "Failed to fetch job types:",
          error?.response?.data || error.message || error
        );
      }
    };

    const fetchProjects = async () => {
      try {
        const res = await apiFetch("/projects/");
        const data = res?.data ?? res;
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    fetchCourses();
    fetchSubjects();
    fetchEmployees();
    fetchProjects();
    if (isOpen && isJobActivityLogModal) {
      fetchJobTypes();
    }
  }, [isCourseMaterialModal, isJobActivityLogModal, isOpen]);

  // Handle position search
  useEffect(() => {
    if (!positionSearchTerm || positionSearchTerm.length < 2) {
      setPositionSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingPositions(true);
      try {
        const res = await apiFetch(`/positions/search?term=${encodeURIComponent(positionSearchTerm)}`);
        const data = Array.isArray(res) ? res : res?.data ?? [];
        setPositionSuggestions(data);
      } catch (error) {
        console.error("Failed to search positions:", error);
      } finally {
        setIsSearchingPositions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [positionSearchTerm]);

  // Click outside to close position dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (positionDropdownRef.current && !positionDropdownRef.current.contains(event.target as Node)) {
        setPositionSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flattenData = (data: Record<string, any>) => {
    const flattened: Record<string, any> = { ...data };
    if (data.candidate) {
      flattened.candidate_full_name = data.candidate.full_name;
      flattened.workstatus = data.candidate.workstatus || data.workstatus || "";
      if (isJobActivityLogModal) {
        flattened.candidate_name = data.candidate.full_name;
        flattened.candidate_id = data.candidate.id?.toString();
      }
    } else if (isJobActivityLogModal && data.candidate_id) {
      flattened.candidate_id = data.candidate_id.toString();
    }
    flattened.instructor1_id =
      data.instructor1?.id || data.instructor1_id || "";
    flattened.instructor1_name =
      data.instructor1?.name || data.instructor1_name || "";
    flattened.instructor2_id =
      data.instructor2?.id || data.instructor2_id || "";
    flattened.instructor2_name =
      data.instructor2?.name || data.instructor2_name || "";
    flattened.instructor3_id =
      data.instructor3?.id || data.instructor3_id || "";
    flattened.instructor3_name =
      data.instructor3?.name || data.instructor3_name || "";
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
      const normalizedCommunication =
        normalizeCommunicationValue(communicationValue);
      flattened.communication = normalizedCommunication;
    }
    flattened.linkedin_id =
      data.candidate?.linkedin_id || data.linkedin_id || "";

    // Flatten batch data from candidate.batch.batchname
    if (data.candidate?.batch?.batchname) {
      flattened.batch = data.candidate.batch.batchname;
    } else if (data.batch) {
      flattened.batch = typeof data.batch === 'string' ? data.batch : data.batch.batchname || "";
    }

    if (data.github_link) {
      flattened.github_link = data.github_link;
    } else if (data.github) {
      flattened.github_link = data.github;
    } else if ("github_link" in data) {
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
    dateFields.forEach((dateField) => {
      if (
        flattened[dateField] &&
        !isNaN(new Date(flattened[dateField]).getTime())
      ) {
        flattened[dateField] = new Date(flattened[dateField])
          .toISOString()
          .split("T")[0];
      }
    });

    if (data.job_owner_1) {
      flattened.job_owner_1 = data.job_owner_1.toString();
    }
    if (data.job_owner_2) {
      flattened.job_owner_2 = data.job_owner_2.toString();
    }
    if (data.job_owner_3) {
      flattened.job_owner_3 = data.job_owner_3.toString();
    }
    if (data.category) {
      flattened.category = data.category;
    }
    if (data.status !== undefined && data.status !== null) {
      flattened.status = String(data.status);
    }
    if (data.instructor !== undefined && data.instructor !== null) {
      flattened.instructor = String(data.instructor);

    }

    // Handle raw_payload JSON field - convert to formatted string for display
    if (data.raw_payload !== undefined && data.raw_payload !== null) {
      if (typeof data.raw_payload === 'object') {
        flattened.raw_payload = JSON.stringify(data.raw_payload, null, 2);
      } else if (typeof data.raw_payload === 'string') {
        try {
          // Try to parse and re-stringify for formatting
          const parsed = JSON.parse(data.raw_payload);
          flattened.raw_payload = JSON.stringify(parsed, null, 2);
        } catch {
          // If it's not valid JSON, keep as is
          flattened.raw_payload = data.raw_payload;
        }
      }
    }

    if (data.is_immigration_team !== undefined && data.is_immigration_team !== null) {
      flattened.is_immigration_team = String(data.is_immigration_team);
    }

    if (isEmployeeTaskModal) {
      flattened.project_name = data.project_name || "No Project";
    }

    return flattened;
  };

  const normalizeRatingValue = (value: string): string => {
    const ratingMap: Record<string, string> = {
      excellent: "Excellent",
      "very good": "Very Good",
      good: "Good",
      average: "Average",
      "need to improve": "Need to Improve",
    };

    const normalized = value.toLowerCase().trim();
    return ratingMap[normalized] || value;
  };

  const normalizeCommunicationValue = (value: string): string => {
    const communicationMap: Record<string, string> = {
      excellent: "Excellent",
      "very good": "Very Good",
      good: "Good",
      average: "Average",
      "need to improve": "Need to Improve",
    };

    const normalized = value.toLowerCase().trim();
    return communicationMap[normalized] || value;
  };

  // Reset form data when the modal opens
  useEffect(() => {
    if (data && isOpen) {
      let flattenedData = flattenData(data);
      if (isAddMode && isEmployeeTaskModal) {
        if (!flattenedData.assigned_date) {
          flattenedData.assigned_date = new Date().toISOString().split("T")[0];
        }
        if (!flattenedData.due_date) {
          const assigned = new Date(flattenedData.assigned_date);
          const due = new Date(assigned);
          due.setDate(assigned.getDate() + 7);
          flattenedData.due_date = due.toISOString().split("T")[0];
        }
      }
      if (isAddMode && isPositionsModal) {
        if (!flattenedData.position_type) flattenedData.position_type = "full_time";
        if (!flattenedData.employment_mode) flattenedData.employment_mode = "hybrid";
        if (!flattenedData.source) flattenedData.source = "linkedin";
        if (!flattenedData.status) flattenedData.status = "open";
      }
      if (isAddMode && isProjectModal) {
        if (!flattenedData.start_date) {
          flattenedData.start_date = new Date().toISOString().split("T")[0];
        }
        if (!flattenedData.target_end_date) {
          const start = new Date(flattenedData.start_date);
          const target = new Date(start);
          target.setDate(start.getDate() + 7);
          flattenedData.target_end_date = target.toISOString().split("T")[0];
        }
      }
      setFormData(flattenedData);
      // Use setTimeout to defer reset to next tick, preventing blocking
      setTimeout(() => {
        reset(flattenedData);
        // Specifically re-sync job owner fields in case they were not yet in the DOM
        if (isJobTypeModal) {
          if (data.job_owner_1) setValue("job_owner_1", data.job_owner_1.toString());
          if (data.job_owner_2) setValue("job_owner_2", data.job_owner_2.toString());
          if (data.job_owner_3) setValue("job_owner_3", data.job_owner_3.toString());
        }
      }, 0);
    }
  }, [data, isOpen, reset, isJobTypeModal, setValue, isAddMode, isProjectModal, isEmployeeTaskModal, isPositionsModal]);

  // Special effect to resync job owners when employees list changes (async fetch)
  useEffect(() => {
    if (isOpen && isJobTypeModal && data && employees.length > 0) {
      if (data.job_owner_1) setValue("job_owner_1", data.job_owner_1.toString());
      if (data.job_owner_2) setValue("job_owner_2", data.job_owner_2.toString());
      if (data.job_owner_3) setValue("job_owner_3", data.job_owner_3.toString());
    }
    if (isOpen && isEmployeeTaskModal && data && employees.length > 0) {
      if (!getValues("employee_name") && data.employee_id) {
        const emp = employees.find(e => e.id === data.employee_id);
        if (emp) setValue("employee_name", emp.name);
      }
    }
  }, [employees, isOpen, isJobTypeModal, isEmployeeTaskModal, data, setValue, getValues]);


  // Handle form submission
  const onSubmit = (formData: any) => {
    if (isJobTypeModal) {
      const owners = [formData.job_owner_1, formData.job_owner_2, formData.job_owner_3].filter(v => v && v !== "");
      if (new Set(owners).size !== owners.length) {
        toast.error("The same person cannot be assigned to multiple owner slots");
        return;
      }
    }
    const reconstructedData = { ...data, ...formData };

    // Explicitly preserve ID if it exists in the original data but not in form data
    if (data.id && !reconstructedData.id) {
      reconstructedData.id = data.id;
    }

    // Convert job_name to job_id for Job Activity Log modal
    if (isJobActivityLogModal && formData.job_name) {
      const selectedJob = jobTypes.find(
        (job) => job.name === formData.job_name
      );
      if (selectedJob) {
        reconstructedData.job_id = selectedJob.id;
      }
      delete reconstructedData.job_name;
    }

    // Convert candidate_name/id to candidate_id for Job Activity Log modal
    if (isJobActivityLogModal) {
      if (formData.candidate_id && !isNaN(parseInt(formData.candidate_id))) {
        reconstructedData.candidate_id = parseInt(formData.candidate_id);
      } else if (formData.candidate_name) {
        const selectedRecord = marketingCandidates.find(
          (m: any) => (m.candidate?.full_name === formData.candidate_name)
        );
        if (selectedRecord) {
          reconstructedData.candidate_id = selectedRecord.candidate.id;
        }
      }
      delete reconstructedData.candidate_name;
    }

    // Convert employee_name to employee_id for Job Activity Log modal
    if (isJobActivityLogModal && formData.employee_name) {
      const selectedEmployee = employees.find(
        (emp) => emp.name === formData.employee_name
      );
      if (selectedEmployee) {
        reconstructedData.employee_id = selectedEmployee.id;
      }
      delete reconstructedData.employee_name;
    }

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
        const selectedCourse = courses.find(
          (course) => course.name === formData.cm_course
        );
        if (selectedCourse) {
          reconstructedData.courseid = selectedCourse.id;
        }
      }
      if (formData.cm_subject) {
        const selectedSubject = subjects.find(
          (subject) => subject.name === formData.cm_subject
        );
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
        const selectedCourse = courses.find(
          (course) => course.name === formData.course_name
        );
        if (selectedCourse) {
          reconstructedData.courseid = selectedCourse.id;
        }
      }
      if (formData.subject_name) {
        const selectedSubject = subjects.find(
          (subject) => subject.name === formData.subject_name
        );
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

    if (isPositionsModal) {
      // Ensure required fields for positions
      if (!reconstructedData.source) reconstructedData.source = "linkedin";
      if (!reconstructedData.status) reconstructedData.status = "open";
      if (!reconstructedData.position_type) reconstructedData.position_type = "full_time";
      if (!reconstructedData.employment_mode) reconstructedData.employment_mode = "hybrid";
    }

    // Handle instructor fields - send null if "Select Instructor" is chosen
    if (showInstructorFields) {
      if (formData.instructor1_id) {
        reconstructedData.instructor1_id = parseInt(formData.instructor1_id);
      } else {
        reconstructedData.instructor1_id = null;
      }

      if (formData.instructor2_id) {
        reconstructedData.instructor2_id = parseInt(formData.instructor2_id);
      } else {
        reconstructedData.instructor2_id = null;
      }

      if (formData.instructor3_id) {
        reconstructedData.instructor3_id = parseInt(formData.instructor3_id);
      } else {
        reconstructedData.instructor3_id = null;
      }
    }

    if (isEmployeeTaskModal) {
      if (formData.employee_name) {
        const selectedEmployee = employees.find(emp => emp.name === formData.employee_name);
        if (selectedEmployee) reconstructedData.employee_id = selectedEmployee.id;
      }
      if (formData.project_name) {
        const selectedProject = projects.find(p => p.name === formData.project_name);
        if (selectedProject) reconstructedData.project_id = selectedProject.id;
        else if (formData.project_name === "No Project") reconstructedData.project_id = null;
      }
    }

    // Generic cleanup: Handle empty strings and undefined
    // - For Updates (!isAddMode): Send explicitly null to notify backend to clear the field.
    // - For Creates (isAddMode): Remove the key so backend uses default values (avoids errors on required fields).
    Object.keys(reconstructedData).forEach(key => {
      const val = reconstructedData[key];
      if (val === "" || val === undefined || (val === null && isAddMode) || (typeof val === 'string' && val.trim() === "")) {
        if (isAddMode) {
          delete reconstructedData[key];
        } else {
          reconstructedData[key] = null;
        }
      }
    });

    // Explicitly add quick-add fields for Interview modal if present (Post-cleanup)
    if (isInterviewModal && isAddMode) {
      const values = getValues();
      // Force assignment if value exists in form state, ignoring whatever reconstructedData currently has
      if (values.position_title) reconstructedData.position_title = values.position_title;
      if (values.position_location) reconstructedData.position_location = values.position_location;

      // Also ensure contact fields are carried over if they were set via setValue but not picked up by the loop
      if (values.interviewer_emails && !reconstructedData.interviewer_emails) reconstructedData.interviewer_emails = values.interviewer_emails;
      if (values.interviewer_contact && !reconstructedData.interviewer_contact) reconstructedData.interviewer_contact = values.interviewer_contact;
      if (values.interviewer_linkedin && !reconstructedData.interviewer_linkedin) reconstructedData.interviewer_linkedin = values.interviewer_linkedin;
    }

    // console.log("DEBUG: EditModal onSubmit reconstructedData before save:", reconstructedData);
    onSave(reconstructedData);
  };

  const toLabel = (key: string) => {
    if (isProjectModal && key === 'name') return 'Project Name';
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
      if (keyLower === "company_type") return enumOptions.company_type;
      if (keyLower === "mode_of_interview")
        return enumOptions.mode_of_interview;
      if (keyLower === "type_of_interview")
        return enumOptions.type_of_interview;
      if (keyLower === "feedback") return enumOptions.feedback;
    }

    // if (keyLower === "work_status" || keyLower === "workstatus") {
    //   return enumOptions.work_status;
    // }
    if (keyLower === "workstatus") {
      return enumOptions.workstatus;
    }

    if (isPositionsModal && keyLower === "status")  {
      return enumOptions.position_status;
    }

    if (keyLower === "position_type") return enumOptions.position_type;
    if (keyLower === "employment_mode") return enumOptions.employment_mode;
    if (keyLower === "source") return enumOptions.source;

    if (isAutomationContactExtractModal) {
      if (keyLower === "processing_status") return enumOptions.extract_processing_status;
      if (keyLower === "classification") return enumOptions.classification;
    }

    if (isPreparationModal && keyLower === "status") {
      return [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ];
    }

    if (isMarketingModal && keyLower === "status")
      return enumOptions.marketing_status;
    if (isMarketingModal && keyLower === "priority") {
      return enumOptions.priority;
    }

    if (isPlacementModal) {
      if (keyLower === "type") return enumOptions.placement_type;
      if (keyLower === "status") return enumOptions.placement_status;
    }

    if (isEmployeeTaskModal) {
      if (keyLower === "status") return enumOptions.employee_task_status;
      if (keyLower === "priority") return enumOptions.employee_task_priority;
    }

    if (isProjectModal) {
      if (keyLower === "status") {
        return [
          { value: "Planned", label: "Planned" },
          { value: "In Progress", label: "In Progress" },
          { value: "Completed", label: "Completed" },
          { value: "On Hold", label: "On Hold" },
          { value: "Cancelled", label: "Cancelled" },
        ];
      }
      if (keyLower === "priority") {
        return [
          { value: "Low", label: "Low" },
          { value: "Medium", label: "Medium" },
          { value: "High", label: "High" },
          { value: "Critical", label: "Critical" },
        ];
      }
    }

    if (isEmployeeModal) {
      if (keyLower === "status") return enumOptions.employee_status;
      if (keyLower === "instructor") return enumOptions.instructor_status;
    }

    if (isLeadModal) {
      if (keyLower === "status") return enumOptions.lead_status;
      if (keyLower === "workstatus") return enumOptions.workstatus;
    }

    if (isVendorModal) {
      if (keyLower === "type" || keyLower === "vendor_type")
        return enumOptions.vendor_type;
      if (keyLower === "status") return enumOptions.vendor_status;
      if (keyLower === "linkedin_connected")
        return enumOptions.vendor_linkedin_connected;
      if (keyLower === "intro_email_sent")
        return enumOptions.vendor_intro_email_sent;
      if (keyLower === "intro_call") return enumOptions.vendor_intro_call;
    }

    if (isPreparationModal || isMarketingModal) {
      if (keyLower === "status") return enumOptions.marketing_status;
      if (keyLower === "workstatus") return enumOptions.workstatus;
    }

    if (isCandidateModal) {
      if (keyLower === "status") return enumOptions.candidate_status;
      if (keyLower === "workstatus") return enumOptions.workstatus;
    }

    // For automation keywords, category and priority are text/number fields, not enums
    if (isAutomationKeywordModal) {
      if (keyLower === "category" || keyLower === "priority") return undefined;
    }

    if (isJobRequestModal) {
      if (keyLower === "status") return enumOptions.job_request_status;
      if (keyLower === "job_type") return enumOptions.request_job_type;
    }

    if (keyLower === "priority") return undefined;

    // Generic Boolean Dropdown Support
    if (keyLower.endsWith("_flag") || keyLower.startsWith("is_") || keyLower === "moved_to_candidate") {
      return [
        { value: true, label: "Yes" },
        { value: false, label: "No" },
      ];
    }

    return enumOptions[keyLower];
  };

  // Organize fields into sections with modal-specific filtering
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

    // Skip excluded fields, but allow batch for prep and marketing modals, and company for interviews/daily contacts
    if (excludedFields.includes(key)) {
      const isBatch = key === 'batch';
      const isCompanyForInterview = key === 'company' && isInterviewModal;
      const isCompanyForDailyContact = (key === 'company' || key === 'contact') && isDailyContactModal;

      if (!(isBatch && (isPreparationModal || isMarketingModal)) && !isCompanyForInterview && !isCompanyForDailyContact) {
        return;
      }
    }


    // MODAL-SPECIFIC FIELD FILTERING
    const instructorFields = [
      "instructor1_name",
      "instructor2_name",
      "instructor3_name",
      "instructor1_id",
      "instructor2_id",
      "instructor3_id",
    ];

    // Hide instructor fields in non-relevant modals
    if (!showInstructorFields && instructorFields.includes(key)) {
      return;
    }

    // Hide LinkedIn in non-relevant modals
    if (!showLinkedInField && key === "linkedin_id") {
      return;
    }

    // ADD THIS - Hide Candidate Name for LinkedIn Activity Log
    if (isLinkedInActivityModal && key.toLowerCase() === "candidate_name") {
      return;
    }

    // Hide company_name and candidate_name in add mode for placement fee modals
    if (isPlacementFeeModal && isAddMode && (key === "company_name" || key === "candidate_name")) {
      return;
    }

    // Job Definition specific conditional visibility
    if (isJobDefinitionModal) {
      const recipientSource = formValues.recipient_source || formData.recipient_source;
      const dateFilter = formValues.date_filter || formData.date_filter;

      if (recipientSource === "CSV") {
        if (key === "date_filter" || key === "lookback_days") return;
      }

      if (dateFilter !== "LAST_N_DAYS" && key === "lookback_days") {
        return;
      }
    }

    // Job Type specific filtering - only show relevant fields
    if (isJobTypeModal) {
      const allowedJobTypeFields = ['name', 'unique_id', 'job_owner_1', 'job_owner_2', 'job_owner_3', 'category', 'description', 'notes'];
      if (!allowedJobTypeFields.includes(key)) {
        return;
      }
    }


    if (isEmployeeTaskModal && (key === "employee_name" || key === "project_name")) {
      return;
    }

    // Existing filters
    if (isCandidateOrEmployee && key.toLowerCase() === "name") return;
    if (
      isCourseSubjectModal &&
      ["cm_course", "cm_subject"].includes(key.toLowerCase())
    )
      return;
    if (
      isCourseMaterialModal &&
      ["subjectid", "courseid", "type"].includes(key.toLowerCase())
    )
      return;
    if (isBatchesModal && key.toLowerCase() === "batchid") return;
    if (
      isMarketingModal &&
      (key === "Marketing Manager obj" || key === "marketing_manager_obj")
    )
      return;

    const section = fieldSections[key] || "Other";
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  if (
    isSpecialModal &&
    sectionedFields["Basic Information"].some(
      (item) => item.key === "candidate_full_name"
    )
  ) {
    const basicInfo = sectionedFields["Basic Information"];
    const candidateFieldIndex = basicInfo.findIndex(
      (item) => item.key === "candidate_full_name"
    );
    if (candidateFieldIndex > -1) {
      const candidateField = basicInfo.splice(candidateFieldIndex, 1)[0];
      basicInfo.unshift(candidateField);
    }
  }

  // Prioritize candidate_name in placement modal
  if (
    isPlacementModal &&
    sectionedFields["Basic Information"]?.some(
      (item) => item.key === "candidate_name"
    )
  ) {
    const basicInfo = sectionedFields["Basic Information"];
    const candidateNameIndex = basicInfo.findIndex(
      (item) => item.key === "candidate_name"
    );
    if (candidateNameIndex > -1) {
      const candidateNameField = basicInfo.splice(candidateNameIndex, 1)[0];
      basicInfo.unshift(candidateNameField);
    }
  }


  // Custom ordering for Notes section in raw job listings
  if (sectionedFields["Notes"]?.length > 0) {
    const notesFieldOrder = ['raw_payload', 'raw_description', 'description', 'raw_notes', 'notes'];
    sectionedFields["Notes"].sort((a, b) => {
      const aIndex = notesFieldOrder.indexOf(a.key);
      const bIndex = notesFieldOrder.indexOf(b.key);

      // If both are in the order array, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only a is in the order array, it comes first
      if (aIndex !== -1) return -1;
      // If only b is in the order array, it comes first
      if (bIndex !== -1) return 1;
      // Otherwise maintain original order
      return 0;
    });
  }

  // Job Type specific filtering - skip owner fields in generic loop as they are handled manually
  if (isJobTypeModal) {
    const ownerFields = ['job_owner_1', 'job_owner_2', 'job_owner_3', 'category'];
    Object.keys(sectionedFields).forEach(section => {
      sectionedFields[section] = sectionedFields[section].filter(item => !ownerFields.includes(item.key));
    });
  }

  if (isInterviewModal) {
    const interviewManualFields = ["position_id", "position_title", "position_company"];
    Object.keys(sectionedFields).forEach((section) => {
      sectionedFields[section] = sectionedFields[section].filter(
        (item) => !interviewManualFields.includes(item.key)
      );
    });
  }


  const visibleSections = Object.keys(sectionedFields).filter(
    (section) => sectionedFields[section]?.length > 0 && section !== "Notes"
  );

  const totalFields = visibleSections.reduce(
    (count, section) => count + sectionedFields[section].length,
    0
  );

  let modalWidthClass = "max-w-6xl";
  if (totalFields <= 4) {
    modalWidthClass = "max-w-3xl";
  } else if (totalFields <= 8) {
    modalWidthClass = "max-w-4xl";
  }

  const columnCount = Math.min(visibleSections.length, 4);
  const gridColsClass =
    {
      1: "grid-cols-1",
      2: "sm:grid-cols-2",
      3: "sm:grid-cols-2 md:grid-cols-3",
      4: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    }[columnCount] || "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  if (!isOpen || !data) return null;

  const currentFormValues = watch();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-2 sm:p-4">
          <div
            ref={modalRef}
            className={`w-full rounded-xl bg-white shadow-2xl sm:rounded-2xl ${modalWidthClass} max-h-[90vh] overflow-y-auto`}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6">
              <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-sm font-semibold text-transparent sm:text-base md:text-lg">
                {isAddMode ? `Add New ${title}` : `${title} - Edit Details`}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600"
              >
                <X size={16} className="sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="bg-white p-3 sm:p-4 md:p-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div
                  className={`grid ${gridColsClass} gap-2.5 sm:gap-3 md:gap-5`}
                >
                  {visibleSections
                    .filter((section) => section !== "Notes")
                    .map((section, _, arr) => (
                      <div key={section} className={arr.length === 1 ? "grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3 sm:space-y-4"}>
                        <h3 className={`border-b border-blue-200 pb-1.5 text-xs font-semibold text-blue-700 sm:pb-2 sm:text-sm ${arr.length === 1 ? "col-span-full" : ""}`}>
                          {section}
                        </h3>
                        {/* Add Candidate Input Field for Preparation and Marketing in Add Mode */}
                        {section === "Basic Information" &&
                          (isPreparationModal || isMarketingModal) &&
                          isAddMode && (
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                Candidate Name{" "}
                                <span className="text-red-700">*</span>
                              </label>
                              <input
                                type="text"
                                {...register("candidate_full_name", {
                                  required: "Candidate name is required",
                                })}
                                className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                placeholder="Enter candidate name"
                              />
                              {errors.candidate_full_name && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.candidate_full_name.message as string}
                                </p>
                              )}
                            </div>
                          )}
                        {/* Add Candidate Dropdown in Basic Information section for Interview Add Mode */}
                        {section === "Basic Information" &&
                          isInterviewModal &&
                          isAddMode && (
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                Candidate Name{" "}
                                <span className="text-red-700">*</span>
                              </label>
                              <select
                                {...register("candidate_id", {
                                  required: "Candidate is required",
                                })}
                                className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                              >
                                <option value="">Select Candidate</option>
                                {marketingCandidates.map((m) => (
                                  <option
                                    key={m.candidate.id}
                                    value={m.candidate.id}
                                  >
                                    {m.candidate.full_name}
                                  </option>
                                ))}
                              </select>
                              {errors.candidate_id && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.candidate_id.message as string}
                                </p>
                              )}
                            </div>
                          )}
                        {/* Add Job Owner Dropdowns in Basic Information section for Job Type */}
                        {section === "Basic Information" &&
                          isJobTypeModal && (
                            <div className="space-y-3">
                              <div className="space-y-1 sm:space-y-1.5">
                                <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                  Job Owner 1
                                </label>
                                <select
                                  {...register("job_owner_1")}
                                  className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                >
                                  <option value="">Select Job Owner</option>
                                  {employees
                                    .filter(emp => emp.id.toString() !== watch("job_owner_2") && emp.id.toString() !== watch("job_owner_3"))
                                    .map((emp) => (
                                      <option key={emp.id} value={emp.id.toString()}>
                                        {emp.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                              <div className="space-y-1 sm:space-y-1.5">
                                <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                  Job Owner 2
                                </label>
                                <select
                                  {...register("job_owner_2")}
                                  className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                >
                                  <option value="">Select Job Owner</option>
                                  {employees
                                    .filter(emp => emp.id.toString() !== watch("job_owner_1") && emp.id.toString() !== watch("job_owner_3"))
                                    .map((emp) => (
                                      <option key={emp.id} value={emp.id.toString()}>
                                        {emp.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                              <div className="space-y-1 sm:space-y-1.5">
                                <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                  Job Owner 3
                                </label>
                                <select
                                  {...register("job_owner_3")}
                                  className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                >
                                  <option value="">Select Job Owner</option>
                                  {employees
                                    .filter(emp => emp.id.toString() !== watch("job_owner_1") && emp.id.toString() !== watch("job_owner_2"))
                                    .map((emp) => (
                                      <option key={emp.id} value={emp.id.toString()}>
                                        {emp.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                              <div className="space-y-1 sm:space-y-1.5">
                                <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                  Category
                                </label>
                                <select
                                  {...register("category")}
                                  className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                >
                                  <option value="manual">Manual</option>
                                  <option value="automation">Automation</option>
                                </select>
                              </div>
                            </div>
                          )}
                        {/* Add Project and Employee Dropdowns for Employee Tasks */}
                        {section === "Basic Information" && isEmployeeTaskModal && (
                          <div className="space-y-3">
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                Employee Name <span className="text-red-700">*</span>
                              </label>
                              <select
                                {...register("employee_name", { required: "Employee is required" })}
                                value={watch("employee_name") || formData.employee_name || ""}
                                onChange={(e) => setValue("employee_name", e.target.value)}
                                className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                              >
                                <option value="">Select Employee</option>
                                {employees.map((emp) => (
                                  <option key={emp.id} value={emp.name}>
                                    {emp.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                Project
                              </label>
                              <select
                                {...register("project_name")}
                                value={watch("project_name") || formData.project_name || "No Project"}
                                onChange={(e) => setValue("project_name", e.target.value)}
                                className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                              >
                                <option value="No Project">No Project</option>
                                {projects.map((p) => (
                                  <option key={p.id} value={p.name}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                        {isCourseMaterialModal &&
                          section === "Professional Information" && (
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                Course Name
                              </label>
                              <select
                                {...register("cm_course")}
                                value={
                                  currentFormValues.cm_course ||
                                  formData.cm_course ||
                                  ""
                                }
                                className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
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
                        {isCourseSubjectModal &&
                          section === "Professional Information" && (
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                Course Name
                              </label>
                              <select
                                {...register("course_name")}
                                value={
                                  currentFormValues.course_name ||
                                  formData.course_name ||
                                  ""
                                }
                                className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
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
                        {isCourseMaterialModal &&
                          section === "Basic Information" && (
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                Subject Name
                              </label>
                              <select
                                {...register("cm_subject")}
                                value={
                                  currentFormValues.cm_subject ||
                                  formData.cm_subject ||
                                  ""
                                }
                                className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                              >
                                {subjects.length === 0 ? (
                                  <option value="">Loading...</option>
                                ) : (
                                  subjects.map((subject) => (
                                    <option
                                      key={subject.id}
                                      value={subject.name}
                                    >
                                      {subject.name}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>
                          )}
                        {isCourseSubjectModal &&
                          section === "Basic Information" && (
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                Subject Name
                              </label>
                              <select
                                {...register("subject_name")}
                                value={
                                  currentFormValues.subject_name ||
                                  formData.subject_name ||
                                  ""
                                }
                                className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                              >
                                {subjects.length === 0 ? (
                                  <option value="">Loading...</option>
                                ) : (
                                  subjects.map((subject) => (
                                    <option
                                      key={subject.id}
                                      value={subject.name}
                                    >
                                      {subject.name}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>
                          )}
                        {isCourseMaterialModal &&
                          section === "Basic Information" && (
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                Material Type
                              </label>
                              <select
                                {...register("material_type")}
                                value={
                                  currentFormValues.material_type ||
                                  formData.material_type ||
                                  ""
                                }
                                className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
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

                        {section === "Professional Information" &&
                          showInstructorFields && (
                            <>
                              {/* Instructor 1 */}
                              <div className="space-y-1 sm:space-y-1.5">
                                <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                  Instructor 1
                                </label>
                                {isInterviewModal || isMarketingModal ? (
                                  <input
                                    type="text"
                                    value={
                                      data.instructor1?.name ||
                                      formData.instructor1_name ||
                                      ""
                                    }
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                ) : (
                                  <select
                                    {...register("instructor1_id")}
                                    value={watch("instructor1_id") ?? formData.instructor1_id ?? ""}
                                    onChange={(e) => setValue("instructor1_id", e.target.value, { shouldValidate: true })}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
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
                                <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                  Instructor 2
                                </label>
                                {isInterviewModal || isMarketingModal ? (
                                  <input
                                    type="text"
                                    value={
                                      data.instructor2?.name ||
                                      formData.instructor2_name ||
                                      ""
                                    }
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                ) : (
                                  <select
                                    {...register("instructor2_id")}
                                    value={watch("instructor2_id") ?? formData.instructor2_id ?? ""}
                                    onChange={(e) => setValue("instructor2_id", e.target.value, { shouldValidate: true })}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
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
                                <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                  Instructor 3
                                </label>
                                {isInterviewModal || isMarketingModal ? (
                                  <input
                                    type="text"
                                    value={
                                      data.instructor3?.name ||
                                      formData.instructor3_name ||
                                      ""
                                    }
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                ) : (
                                  <select
                                    {...register("instructor3_id")}
                                    value={watch("instructor3_id") ?? formData.instructor3_id ?? ""}
                                    onChange={(e) => setValue("instructor3_id", e.target.value, { shouldValidate: true })}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
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
                                ...(isCourseMaterialModal
                                  ? ["cm_course", "cm_subject", "material_type"]
                                  : []),
                                ...(isCourseSubjectModal
                                  ? ["course_name", "subject_name"]
                                  : []),
                                ...(isJobTypeModal
                                  ? ["job_owner"]
                                  : []),
                                ...(isPositionsModal
                                  ? ["created_at", "updated_at"]
                                  : []),
                              ].includes(key)
                          )
                          .map(({ key, value }) => {
                            const isTypeField = key.toLowerCase() === "type";
                            const isBatchField =
                              key.toLowerCase() === "batchid";
                            const isStatusField =
                              key.toLowerCase() === "status";
                            const isMaterialTypeField =
                              key.toLowerCase() === "material_type";
                            const isWorkStatusField =
                              key.toLowerCase() === "workstatus";
                            const isInstructorField =
                              key.toLowerCase() === "instructor";
                            const isCompanyTypeField =
                              key.toLowerCase() === "company_type";
                            const isModeOfInterviewField =
                              key.toLowerCase() === "mode_of_interview";
                            const isTypeOfInterviewField =
                              key.toLowerCase() === "type_of_interview";
                            const isFeedbackField =
                              key.toLowerCase() === "feedback";
                            const isVendorTypeField =
                              key.toLowerCase() === "vendor_type";
                            const isLinkedinConnectedField =
                              key.toLowerCase() === "linkedin_connected";
                            const isIntroEmailSentField =
                              key.toLowerCase() === "intro_email_sent";
                            const isIntroCallField =
                              key.toLowerCase() === "intro_call";
                            const isCandidateFullName =
                              key.toLowerCase() === "candidate_full_name";
                            const isLinkedInField =
                              key.toLowerCase() === "linkedin_id";
                            const isPrepOrMarketing =
                              isPreparationModal || isMarketingModal;
                            const isSubjectField =
                              key.toLowerCase() === "subject";
                            const isCourseIdField =
                              key.toLowerCase() === "courseid";
                            const isJobIdField = key.toLowerCase() === "job_id";
                            const isEmployeeIdField =
                              key.toLowerCase() === "employee_id";
                            const isEmployeeNameField =
                              key.toLowerCase() === "employee_name";
                            const isActivityCountField =
                              key.toLowerCase() === "activity_count";
                            const isJobNameField =
                              key.toLowerCase() === "job_name";
                            const isBatchNameField =
                              key.toLowerCase() === "batch";
                            const isJobOwnerField =
                              key.toLowerCase() === "job_owner";
                            const isCandidateIdField =
                              key.toLowerCase() === "candidate_id";
                            const isCandidateNameField =
                              key.toLowerCase() === "candidate_name";


                            if (isMaterialTypeField && !isCourseMaterialModal) {
                              return null;
                            }

                            if (isInterviewModal && key === "position_id") {
                              return null; // Handled below with company
                            }


                            if (
                              isPlacementModal &&
                              (key.toLowerCase() === "batch" ||
                                key.toLowerCase() === "batchid" ||
                                key.toLowerCase() === "lastmod_user_id")
                            ) {
                              return null;
                            }


                            if (
                              isPlacementModal &&

                              (key.toLowerCase() === "batch" ||
                                key.toLowerCase() === "batchid" ||
                                key.toLowerCase() === "lastmod_user_id")
                            ) {
                              return null;
                            }


                            if (
                              isPlacementModal &&
                              key.toLowerCase() === "candidate_name"
                            ) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                  </label>
                                  <input
                                    type="text"
                                    value={formData[key] || ""}
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }

                            if (
                              isPrepOrMarketing &&
                              isBatchNameField
                            ) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                  </label>
                                  <input
                                    type="text"
                                    value={formData[key] || ""}
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }

                            if (
                              isPrepOrMarketing &&
                              isWorkStatusField
                            ) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                  </label>
                                  <input
                                    type="text"
                                    value={formData[key] || ""}
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }





                            if (
                              isJobActivityLogModal &&
                              !isAddMode &&
                              (isJobIdField ||
                                isEmployeeIdField)
                            ) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                  </label>
                                  <input
                                    type="text"
                                    value={formData[key] || ""}
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }
                            if (isInterviewModal && key === "company") {
                              return (
                                <React.Fragment key="interview_fields_wrapper">
                                  <div className="relative space-y-1 sm:space-y-1.5" ref={positionDropdownRef}>
                                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                      Company <span className="text-red-700">*</span>
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        placeholder="Search company or position..."
                                        value={positionSearchTerm !== ""
                                          ? positionSearchTerm
                                          : (watch("company") || "")}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setPositionSearchTerm(val);
                                          setValue("company", val);

                                          if (val !== formData.position_company) {
                                            setValue("position_id", null);
                                            setValue("position_title", "");
                                            setFormData(prev => ({
                                              ...prev,
                                              position_id: null,
                                              position_title: null,
                                              position_company: null
                                            }));
                                          }
                                        }}
                                        className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                      />
                                      {isSearchingPositions && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                                        </div>
                                      )}
                                    </div>
                                    {positionSuggestions.length > 0 && (
                                      <div className="absolute z-[100] mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                        {positionSuggestions.map((pos) => (
                                          <div
                                            key={pos.id}
                                            className="cursor-pointer px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900"
                                            onClick={() => {
                                              setValue("position_id", pos.id);
                                              setValue("company", pos.company_name);
                                              setValue("position_title", pos.title);

                                              // Auto-fill interviewer contact fields from position data
                                              if (pos.contact_email) setValue("interviewer_emails", pos.contact_email);
                                              if (pos.contact_phone) setValue("interviewer_contact", pos.contact_phone);
                                              if (pos.contact_linkedin) setValue("interviewer_linkedin", pos.contact_linkedin);

                                              setFormData({
                                                ...formData,
                                                position_id: pos.id,
                                                position_title: pos.title,
                                                position_company: pos.company_name,
                                                company: pos.company_name,
                                                interviewer_emails: pos.contact_email || formData.interviewer_emails,
                                                interviewer_contact: pos.contact_phone || formData.interviewer_contact,
                                                interviewer_linkedin: pos.contact_linkedin || formData.interviewer_linkedin,
                                              });
                                              setPositionSearchTerm(pos.company_name);
                                              setPositionSuggestions([]);
                                            }}
                                          >
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{pos.company_name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{pos.title} - {pos.location}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {!((watch("company") || formData.company) &&
                                    !positionSuggestions.some(p => p.company_name?.toLowerCase() === (watch("company") || formData.company)?.toLowerCase()) &&
                                    (watch("position_id") === null || watch("position_id") === undefined)) && (
                                      <div className="space-y-1 sm:space-y-1.5">
                                        <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                          Position Title
                                        </label>
                                        <input
                                          type="text"
                                          readOnly
                                          value={watch("position_title") || formData.position_title || ""}
                                          className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                        />
                                        <input type="hidden" {...register("position_title")} />
                                      </div>
                                    )}
                                  <input type="hidden" {...register("position_id")} />

                                  {/* Quick Add Fields when Position/Company not found */}
                                  {(watch("company") || formData.company) &&
                                    !positionSuggestions.some(p => p.company_name?.toLowerCase() === (watch("company") || formData.company)?.toLowerCase()) &&
                                    (watch("position_id") === null || watch("position_id") === undefined) && (
                                      <div className="col-span-full mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                        <p className="mb-2 text-xs font-medium text-yellow-800">
                                          New Company/Position detected. Please provide basic details:
                                        </p>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                          <div className="space-y-1">
                                            <label className="text-xs font-bold text-blue-700">Position Title <span className="text-red-700">*</span></label>
                                            {(() => {
                                              const { onChange, ...rest } = register("position_title", {
                                                required: !watch("position_id") ? "Position Title is required for new entries" : false
                                              });
                                              return (
                                                <input
                                                  type="text"
                                                  {...rest}
                                                  placeholder="e.g. Software Engineer"
                                                  className="w-full rounded border border-blue-200 px-2 py-1 text-xs"
                                                  onChange={(e) => {
                                                    onChange(e); // Trigger react-hook-form change
                                                    setValue("position_title", e.target.value); // Explicitly update value to be safe
                                                    setValue("position_id", null); // Ensure position_id is cleared
                                                  }}
                                                />
                                              );
                                            })()}
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-xs font-bold text-blue-700">Location</label>
                                            <input
                                              type="text"
                                              {...register("position_location")}
                                              placeholder="e.g. Remote, New York, NY"
                                              className="w-full rounded border border-blue-200 px-2 py-1 text-xs"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-xs font-bold text-blue-700">Contact Email</label>
                                            <input
                                              type="email"
                                              placeholder="recruiter@company.com"
                                              className="w-full rounded border border-blue-200 px-2 py-1 text-xs"
                                              onChange={(e) => setValue("interviewer_emails", e.target.value)}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-xs font-bold text-blue-700">Contact Phone</label>
                                            <input
                                              type="text"
                                              placeholder="+1 555-0123"
                                              className="w-full rounded border border-blue-200 px-2 py-1 text-xs"
                                              onChange={(e) => setValue("interviewer_contact", e.target.value)}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-xs font-bold text-blue-700">Contact LinkedIn</label>
                                            <input
                                              type="text"
                                              placeholder="https://linkedin.com/in/..."
                                              className="w-full rounded border border-blue-200 px-2 py-1 text-xs"
                                              onChange={(e) => setValue("interviewer_linkedin", e.target.value)}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                </React.Fragment>
                              );
                            }

                            if (
                              isJobActivityLogModal &&
                              isJobNameField
                            ) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    <span className="text-red-700"> *</span>
                                  </label>
                                  <select
                                    {...register(key, { required: "Job Name is required" })}
                                    value={
                                      currentFormValues[key] ||
                                      formData[key] ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      const selectedName = e.target.value;
                                      const selectedJob = jobTypes.find(
                                        (job) => job.name === selectedName
                                      );
                                      setValue("job_name", selectedName); // Update the registered field
                                      setValue("job_id", selectedJob?.id || ""); // Update the ID field
                                    }}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  >
                                    <option value="">Select a Job</option>
                                    {jobTypes.map((job) => (
                                      <option
                                        key={job.id}
                                        value={job.name}
                                      >
                                        {job.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }

                            if (
                              isJobActivityLogModal &&
                              key.toLowerCase() === "candidate_name"
                            ) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register("candidate_id")}
                                    value={
                                      currentFormValues.candidate_id ||
                                      formData.candidate_id ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      const selectedRecord = marketingCandidates.find(
                                        (m: any) => m.candidate?.id.toString() === selectedId
                                      );
                                      setValue("candidate_name", selectedRecord?.candidate?.full_name || "");
                                      setValue("candidate_id", selectedId);
                                    }}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  >
                                    <option value="">Select Candidate</option>
                                    {marketingCandidates.map((m: any) => (
                                      <option
                                        key={m.candidate?.id}
                                        value={m.candidate?.id.toString()}
                                      >
                                        {m.candidate?.full_name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }


                            if (
                              isJobActivityLogModal &&
                              key.toLowerCase() === "employee_name"
                            ) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                  </label>
                                  <select
                                    {...register("employee_id")}
                                    value={
                                      currentFormValues.employee_id ||
                                      formData.employee_id ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      const selectedEmployee = employees.find(
                                        (emp) => emp.id.toString() === selectedId
                                      );
                                      setValue("employee_name", selectedEmployee?.name || "");
                                      setValue("employee_id", selectedId);
                                    }}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  >
                                    <option value="">Select Employee</option>
                                    {employees.map((employee) => (
                                      <option
                                        key={employee.id}
                                        value={employee.id.toString()}
                                      >
                                        {employee.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }




                            if (isSubjectField && isBatchesModal) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <select
                                    {...register(key)}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                    onChange={(e) => {
                                      const selectedSubject = e.target.value;
                                      let courseid = "3";
                                      if (selectedSubject === "QA")
                                        courseid = "1";
                                      else if (selectedSubject === "UI")
                                        courseid = "2";
                                      else if (selectedSubject === "ML")
                                        courseid = "3";

                                      setValue(key, selectedSubject);
                                      setValue("courseid", courseid);
                                      setFormData((prev) => ({
                                        ...prev,
                                        [key]: selectedSubject,
                                        courseid,
                                      }));
                                    }}
                                  >
                                    <option value="">Select Subject</option>
                                    <option value="ML">ML</option>
                                    <option value="QA">QA</option>
                                    <option value="UI">UI</option>
                                  </select>
                                </div>
                              );
                            }

                            if (isCourseIdField && isBatchesModal) {
                              const currentSubject =
                                currentFormValues.subject ||
                                formData.subject ||
                                "ML";
                              let defaultCourseId = "3";
                              if (currentSubject === "QA")
                                defaultCourseId = "1";
                              else if (currentSubject === "UI")
                                defaultCourseId = "2";
                              else if (currentSubject === "ML")
                                defaultCourseId = "3";

                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <input
                                    type="text"
                                    {...register(key)}
                                    value={
                                      currentFormValues.courseid ||
                                      formData.courseid ||
                                      defaultCourseId
                                    }
                                    readOnly
                                    className="w-full rounded-lg border border-blue-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }




                            if (isSpecialModal && isCandidateFullName) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <input
                                    type="text"
                                    {...register(key)}
                                    defaultValue={formData[key] || ""}
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }


                            if (key === "lastmod_user_id" || key === "lastmod_user_name" || key === "last_mod_date" || key === "is_in_prep" || key === "is_in_marketing") {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}

                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}

                                  </label>
                                  <input
                                    type="text"
                                    value={formData[key] || ""}
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }


                            if (
                              isSpecialModal &&
                              isLinkedInField &&
                              !isAddMode
                            ) {
                              let url = (
                                formData?.[key] ||
                                formData?.candidate?.[key] ||
                                ""
                              ).trim();

                              if (!url) {
                                return (
                                  <div
                                    key={key}
                                    className="space-y-1 sm:space-y-1.5"
                                  >
                                    <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                      {toLabel(key)}
                                      {isFieldRequired(
                                        toLabel(key),
                                        title,
                                        isAddMode
                                      ) && (
                                          <span className="text-red-700"> *</span>
                                        )}
                                    </label>
                                    <div className="w-full rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-400 shadow-sm sm:px-3 sm:py-2 sm:text-sm">
                                      N/A
                                    </div>
                                  </div>
                                );
                              }

                              if (!/^https?:\/\//i.test(url)) {
                                url = `https://${url}`;
                              }

                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full cursor-pointer rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-blue-600 shadow-sm hover:text-blue-800 hover:underline sm:px-3 sm:py-2 sm:text-sm"
                                  >
                                    Click Here
                                  </a>
                                </div>
                              );
                            }



                            const fieldEnumOptions = getEnumOptions(key);
                            if (fieldEnumOptions) {
                              const currentValue =
                                currentFormValues[key] ?? formData[key] ?? "";
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <select
                                    {...register(key)}
                                    value={currentValue}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
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
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <select
                                    {...register(key)}
                                    value={
                                      currentFormValues[key] ||
                                      formData[key] ||
                                      ""
                                    }
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
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
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <select
                                    {...register(key)}
                                    value={
                                      currentFormValues[key] ||
                                      formData[key] ||
                                      ""
                                    }
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
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

                            if (key === 'employee_name' || key === 'employee_id') {
                              if (key === 'employee_id' && !isEmployeeTaskModal) return null;
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(toLabel(key), title, isAddMode) && (
                                      <span className="text-red-700"> *</span>
                                    )}
                                  </label>
                                  <select
                                    {...register(key, { required: "Employee is required" })}
                                    value={currentFormValues[key] ?? formData[key] ?? ""}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (key === 'employee_id') {
                                        const emp = employees.find(e => e.id.toString() === val);
                                        setValue('employee_id', val);
                                        if (emp) setValue('employee_name', emp.name);
                                      } else {
                                        const emp = employees.find(e => e.name === val);
                                        setValue('employee_name', val);
                                        if (emp) setValue('employee_id', emp.id.toString());
                                      }
                                    }}
                                  >
                                    <option value="">Select an employee</option>
                                    {employees.map((emp) => (
                                      <option key={emp.id} value={key === 'employee_id' ? emp.id.toString() : emp.name}>
                                        {emp.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }

                            if (key === 'owner' && isProjectModal) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(toLabel(key), title, isAddMode) && (
                                      <span className="text-red-700"> *</span>
                                    )}
                                  </label>
                                  <select
                                    {...register(key, { required: "Owner is required" })}
                                    value={currentFormValues[key] ?? formData[key] ?? ""}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  >
                                    <option value="">Select an employee</option>
                                    {employees.map((emp) => (
                                      <option key={emp.id} value={emp.name}>
                                        {emp.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }

                            if (key === 'project_name' && isEmployeeTaskModal) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    Project
                                  </label>
                                  <select
                                    {...register('project_id')}
                                    value={currentFormValues.project_id || formData.project_id || ""}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      const selectedProject = projects.find(p => p.id.toString() === selectedId);
                                      setValue('project_id', selectedId ? parseInt(selectedId) : null);
                                      setValue('project_name', selectedProject?.name || '');
                                    }}
                                  >
                                    <option value="">No Project</option>
                                    {projects.map((proj) => (
                                      <option key={proj.id} value={proj.id.toString()}>
                                        {proj.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }

                            if (key === 'task' || key === 'raw_payload' || (key === 'description' && (isProjectModal || isPositionsModal))) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5 col-span-full">
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(toLabel(key), title, isAddMode) && (
                                      <span className="text-red-700"> *</span>
                                    )}
                                  </label>
                                  <div className="bg-white dark:bg-gray-800">
                                    <ReactQuill
                                      theme="snow"
                                      value={currentFormValues[key] ?? formData[key] ?? ""}
                                      onChange={(content) => {
                                        setValue(key, content);
                                        setFormData((prev) => ({
                                          ...prev,
                                          [key]: content,
                                        }));
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            }
                            if (isBatchField) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <select
                                    {...register("batchid")}
                                    value={
                                      currentFormValues.batchid ||
                                      formData.batchid ||
                                      ""
                                    }
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  >
                                    <option value="">Select a batch</option>
                                    {mlBatches.map((batch) => (
                                      <option
                                        key={batch.batchid}
                                        value={batch.batchid}
                                      >
                                        {batch.batchname}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }
                            if (dateFields.includes(key.toLowerCase())) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <input
                                    type="date"
                                    {...(() => {
                                      const { onChange, ...rest } = register(key);
                                      return {
                                        ...rest,
                                        onChange: (e: any) => {
                                          onChange(e);
                                          if (isAddMode && key === "assigned_date") {
                                            const val = e.target.value;
                                            if (val) {
                                              const dateObj = new Date(val);
                                              dateObj.setDate(dateObj.getDate() + 7);
                                              const dueStr = dateObj.toISOString().split("T")[0];
                                              setValue("due_date", dueStr);
                                            }
                                          }
                                        },
                                      };
                                    })()}
                                    defaultValue={formData[key] || ""}
                                    className="w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }

                            if (isAutomationKeywordModal && (key.toLowerCase() === "keywords" || key.toLowerCase() === "context")) {
                              const handleTextareaRef = (element: HTMLTextAreaElement | null) => {
                                if (element) {
                                  element.style.height = 'auto';
                                  element.style.height = element.scrollHeight + 'px';
                                }
                              };

                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5 col-span-full">
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                  </label>
                                  <textarea
                                    ref={handleTextareaRef}
                                    {...register(key)}
                                    defaultValue={formData[key] || ""}
                                    onInput={(e) => {
                                      const target = e.target as HTMLTextAreaElement;
                                      target.style.height = 'auto';
                                      target.style.height = target.scrollHeight + 'px';
                                    }}
                                    style={{ minHeight: key.toLowerCase() === "context" ? '60px' : '48px' }}
                                    className="w-full resize rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }

                            const fieldEnumOpts = getEnumOptions(key);
                            if (fieldEnumOpts) {
                              const currentValue =
                                currentFormValues[key] ?? formData[key] ?? "";
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <select
                                    {...register(key)}
                                    value={currentValue}
                                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  >
                                    {fieldEnumOpts.map(
                                      (opt) => (
                                        <option
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.label}
                                        </option>
                                      )
                                    )}
                                  </select>
                                </div>
                              );
                            }
                            if (
                              typeof value === "string" &&
                              value.length > 100
                            ) {
                              return (
                                <div
                                  key={key}
                                  className="space-y-1 sm:space-y-1.5"
                                >
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    ) && (
                                        <span className="text-red-700"> *</span>
                                      )}
                                  </label>
                                  <textarea
                                    {...register(key, {
                                      required: isFieldRequired(
                                        toLabel(key),
                                        title,
                                        isAddMode
                                      )
                                        ? "This field is required"
                                        : false,
                                    })}
                                    defaultValue={formData[key] || ""}
                                    rows={3}
                                    className="w-full resize-none rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }

                            if (key.toLowerCase() === "description") {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5 col-span-full">
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                  </label>
                                  <textarea
                                    {...register(key)}
                                    defaultValue={formData[key] || ""}
                                    rows={isJobTypeModal ? 3 : 3}
                                    className="w-full resize-none rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }

                            if (isAutomationKeywordModal && (key.toLowerCase() === "keywords" || key.toLowerCase() === "context")) {
                              const handleTextareaRef = (element: HTMLTextAreaElement | null) => {
                                if (element) {
                                  element.style.height = 'auto';
                                  element.style.height = element.scrollHeight + 'px';
                                }
                              };

                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5 col-span-full">
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                  </label>
                                  <textarea
                                    ref={handleTextareaRef}
                                    {...register(key)}
                                    defaultValue={formData[key] || ""}
                                    onInput={(e) => {
                                      const target = e.target as HTMLTextAreaElement;
                                      target.style.height = 'auto';
                                      target.style.height = target.scrollHeight + 'px';
                                    }}
                                    style={{ minHeight: key.toLowerCase() === "context" ? '60px' : '48px' }}
                                    className="w-full resize rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }

                            // Make company_name read-only in edit mode for placement fees
                            if (key === "company_name" && !isAddMode && isPlacementFeeModal) {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                  </label>
                                  <input
                                    type="text"
                                    value={formData[key] || ""}
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-lg border border-blue-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                                  />
                                </div>
                              );
                            }

                            if (key === "location" || key === "address") {
                              return (
                                <div key={key} className="space-y-1 sm:space-y-1.5">
                                  <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                    {toLabel(key)}
                                    {isFieldRequired(toLabel(key), title, isAddMode) && (
                                      <span className="text-red-700"> *</span>
                                    )}
                                  </label>
                                  <AddressAutocomplete
                                    value={currentFormValues[key] ?? formData[key] ?? ""}
                                    onChange={(val, details) => {
                                      setValue(key, val);
                                      setFormData((prev) => ({ ...prev, [key]: val }));
                                      if (details && details.address) {
                                        const addr = details.address;
                                        const updates: Record<string, any> = {};

                                        const updateIfExists = (fieldNames: string[], value: any) => {
                                          const found = fieldNames.find(f => f in formData);
                                          if (found) {
                                            setValue(found, value);
                                            updates[found] = value;
                                          }
                                        };

                                        // Handle City
                                        const cityVal = addr.city || addr.town || addr.village || "";
                                        updateIfExists(["city"], cityVal);

                                        // Handle State
                                        const stateVal = addr.state || "";
                                        updateIfExists(["state"], stateVal);

                                        // Handle Zip/Postcode
                                        const zipVal = addr.postcode || "";
                                        updateIfExists(["zip", "zip_code", "postal_code"], zipVal);

                                        // Handle Country
                                        const countryVal = addr.country || "";
                                        updateIfExists(["country"], countryVal);

                                        if (Object.keys(updates).length > 0) {
                                          setFormData((prev) => ({ ...prev, ...updates }));
                                        }
                                      }
                                    }}
                                    placeholder={`Search ${toLabel(key)}...`}
                                  />
                                </div>
                              );
                            }

                            return (
                              <div
                                key={key}
                                className="space-y-1 sm:space-y-1.5"
                              >
                                <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                                  {toLabel(key)}
                                  {isFieldRequired(
                                    toLabel(key),
                                    title,
                                    isAddMode
                                  ) && <span className="text-red-700"> *</span>}
                                </label>
                                <input

                                  type={
                                    isJobActivityLogModal &&
                                      key === "activity_count"
                                      ? "number"
                                      : "text"
                                  }
                                  min={
                                    isJobActivityLogModal &&
                                      key === "activity_count"
                                      ? 0
                                      : undefined
                                  }
                                  step={
                                    isJobActivityLogModal &&
                                      key === "activity_count"
                                      ? 1
                                      : undefined
                                  }

                                  {...register(key, {
                                    required: isFieldRequired(
                                      toLabel(key),
                                      title,
                                      isAddMode
                                    )
                                      ? "This field is required"
                                      : false,
                                  })}
                                  defaultValue={formData[key] || ""}
                                  readOnly={readonlyFields.includes(key)}
                                  className={`w-full rounded-lg border border-blue-200 px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm ${readonlyFields.includes(key) ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                                />
                              </div>
                            );
                          })}
                      </div>
                    ))}
                </div>
                {
                  sectionedFields["Notes"].length > 0 && (
                    <div className="mt-4 border-t border-blue-200 pt-3 sm:mt-6 sm:pt-4">
                      <div className="space-y-6">
                        {sectionedFields["Notes"].map(({ key, value }) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className={['description', 'raw_payload', 'raw_description', 'raw_notes'].includes(key) ? 'block text-xs font-bold text-blue-700 sm:text-sm' : 'text-sm font-medium text-gray-600 dark:text-gray-400'}>
                                {toLabel(key)}
                                {isFieldRequired(
                                  toLabel(key),
                                  title,
                                  isAddMode
                                ) && <span className="text-red-700"> *</span>}
                              </label>
                              {key === 'notes' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const timestamp = `[${new Date().toLocaleString()}]: `;
                                    const existingContent =
                                      currentFormValues[key] ||
                                      formData[key] ||
                                      "";
                                    const newContent =
                                      isJobTypeModal || isJobActivityLogModal
                                        ? `${timestamp}\n\n${existingContent}`
                                        : `<p><strong>${timestamp}</strong></p><p><br></p>${existingContent}`;

                                    setValue(key, newContent);
                                    setFormData((prev) => ({
                                      ...prev,
                                      [key]: newContent,
                                    }));

                                    setShouldDisableBold(true);

                                    setTimeout(() => {
                                      const editor = document.querySelector(
                                        ".ql-editor"
                                      ) as any;
                                      if (editor && editor.parentElement) {
                                        const quill = (editor.parentElement as any)
                                          .__quill;
                                        if (quill) {
                                          quill.focus();
                                          const timestampLength = timestamp.length;
                                          quill.setSelection(timestampLength, 0);
                                          quill.format('bold', false);
                                          setShouldDisableBold(false);
                                        }
                                      }
                                    }, 150);
                                  }}
                                  className="px-2 sm:px-2 py-1 sm:py-1 text-xs sm:text-sm font-medium text-black hover:text-blue-800 hover:underline"
                                >
                                  + New Entry
                                </button>
                              )}
                            </div>
                            {isJobTypeModal || isJobActivityLogModal ? (
                              <textarea
                                {...register(key)}
                                defaultValue={currentFormValues[key] ?? formData[key] ?? ""}
                                rows={4}
                                className="w-full resize-none rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:px-3 sm:py-2 sm:text-sm"
                                placeholder={`Enter ${toLabel(key).toLowerCase()}...`}
                                onChange={(e) => {
                                  setValue(key, e.target.value);
                                  setFormData((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }));
                                }}
                              />
                            ) : (
                              <QuillWithMentions
                                theme="snow"
                                value={
                                  currentFormValues[key] ?? formData[key] ?? ""
                                }
                                onChange={(content) => {
                                  setValue(key, content);
                                  setFormData((prev) => ({
                                    ...prev,
                                    [key]: content,
                                  }));
                                  if (shouldDisableBold) {
                                    setShouldDisableBold(false);
                                  }
                                }}
                                className="bg-white dark:bg-gray-800"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }

                {
                  title.toLowerCase().includes('placement fee') && (
                    <>
                      <input type="hidden" {...register("id")} value={data?.id || ""} />
                      <input type="hidden" {...register("originalId")} value={data?.originalId || ""} />
                    </>
                  )
                }

                <div className="mt-3 flex justify-end border-t border-blue-200 pt-2 sm:mt-4 sm:pt-3 md:mt-6 md:pt-4">
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-md transition hover:from-cyan-600 hover:to-blue-600 sm:px-5 sm:py-2 sm:text-sm"
                  >
                    {isAddMode ? "Create" : "Save Changes"}
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
