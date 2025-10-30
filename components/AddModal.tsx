// whiteboxLearning-wbl\components\AddModal.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import { apiFetch } from "@/lib/api";
import { 
  enumOptions, 
  excludedFields, 
  fieldSections, 
  labelOverrides, 
  dateFields,
  vendorTypeOptions,
  vendorStatuses,
  genericStatusOptions,
  materialTypeOptions
} from "./EditModal";

interface Batch {
  batchid: number;
  batchname: string;
  subject?: string;
  courseid?: number;
}

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSave: (newData: Record<string, any>) => void;
  batches?: Batch[];
  defaultValues?: Record<string, any>;
}

// Lead-specific status options
const leadStatusOptions = ["Open", "Closed", "Future"];
const workStatusOptions = [
  "Waiting for Status",
  "H1B",
  "H4 EAD",
  "Permanent Resident",
  "Citizen",
  "OPT",
  "CPT",
];

export function AddModal({
  isOpen,
  onClose,
  title,
  onSave,
  batches: propBatches,
  defaultValues = {},
}: AddModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm();
  
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [mlBatches, setMlBatches] = useState<Batch[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Enhanced modal context detection - ADDED NEW ENTITY TYPES
  const isCourseMaterialModal = title.toLowerCase().includes("course material") || title.toLowerCase().includes("material");
  const isCourseSubjectModal = title.toLowerCase().includes("course-subject") || title.toLowerCase().includes("course subject");
  const isVendorModal = title.toLowerCase().includes("vendor");
  const isCandidateOrEmployee = title.toLowerCase().includes("candidate") || title.toLowerCase().includes("employee");
  const isBatchesModal = title.toLowerCase().includes("batch") && !title.toLowerCase().includes("course");
  
  // NEW ENTITY DETECTIONS
  const isCourseModal = title.toLowerCase().includes("course") && !isCourseMaterialModal && !isCourseSubjectModal;
  const isSubjectModal = title.toLowerCase().includes("subject") && !isCourseSubjectModal;
  const isCourseContentsModal = title.toLowerCase().includes("course content") || title.toLowerCase().includes("content");
  const isBatchModal = title.toLowerCase().includes("batch") && !title.toLowerCase().includes("course");

  const isInterviewModal = title.toLowerCase().includes("interview");
  const isMarketingModal = title.toLowerCase().includes("marketing");
  const isPlacementModal = title.toLowerCase().includes("placement");
  const isPreparationModal = title.toLowerCase().includes("preparation");
  const isEmployeeModal = title.toLowerCase().includes("employee");
  const isLeadModal = title.toLowerCase().includes("lead");
  const isCandidateModal = title.toLowerCase().includes("candidate") && !isPreparationModal;

  const isSpecialModal = isInterviewModal || isMarketingModal || isPlacementModal || isPreparationModal;
  const isInterviewOrMarketing = title.toLowerCase().includes("interview") || title.toLowerCase().includes("marketing");

  // Fetch ML batches - SAME LOGIC AS EDIT MODAL
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

  // Close modal handlers
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

    if (isOpen) {
      // Only fetch courses and subjects if needed for the current modal type
      if (isCourseModal || isSubjectModal || isCourseContentsModal || isBatchModal || isCourseMaterialModal || isCourseSubjectModal) {
        fetchCourses();
        fetchSubjects();
      }
      if (isPreparationModal || isEmployeeModal) {
        fetchEmployees();
      }
    }
  }, [isOpen, isCourseMaterialModal, isCourseModal, isSubjectModal, isCourseContentsModal, isBatchModal, isCourseSubjectModal, isPreparationModal, isEmployeeModal]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialValues = {
        ...getDefaultValuesForEntity(),
        ...defaultValues
      };
      reset(initialValues);
    }
  }, [isOpen, reset, defaultValues]);

  // Get default values based on entity type
  const getDefaultValuesForEntity = () => {
    const defaults: Record<string, any> = {};

    if (isVendorModal) {
      defaults.status = "active";
      defaults.type = "third-party-vendor";
    } else if (isCandidateModal) {
      defaults.status = "active";
      defaults.workstatus = "waiting for status";
    } else if (isEmployeeModal) {
      defaults.status = "1";
      defaults.instructor = "0";
    } else if (isMarketingModal) {
      defaults.status = "active";
      defaults.priority = "";
    } else if (isInterviewModal) {
      defaults.feedback = "Pending";
      defaults.company_type = "client";
    } else if (isPlacementModal) {
      defaults.status = "Active";
      defaults.type = "Company";
    } else if (isCourseMaterialModal) {
      defaults.material_type = "M";
    } else if (isBatchModal) {
      // Set default batch name to current year-month
      const now = new Date();
      defaults.batch_name = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else if (isLeadModal) {
      // Lead defaults
      defaults.status = "Open";
      defaults.workstatus = "Waiting for Status";
      defaults.moved_to_candidate = false;
      defaults.massemail_unsubscribe = false;
      defaults.massemail_email_sent = false;
      defaults.entry_date = new Date().toISOString().split('T')[0]; // Today's date
    }

    return defaults;
  };

  // Define which fields to show based on entity type - UPDATED WITH ALL LEAD FIELDS
  const getFieldsForEntityType = () => {
    const fields: Record<string, any> = {};

    if (isCourseModal) {
      // Course fields
      fields.name = "";
      fields.alias = "";
      fields.description = "";
      fields.syllabus = "";
    } else if (isSubjectModal) {
      // Subject fields
      fields.name = "";
      fields.description = "";
    } else if (isCourseContentsModal) {
      // Course Contents fields
      fields.fundamentals = "";
      fields.aiml = "";
      fields.ui = "";
      fields.qe = "";
    } else if (isBatchModal) {
      // Batch fields
      fields.batch_name = "";
      fields.orientation_date = "";
      fields.subject = "";
      fields.start_date = "";
      fields.end_date = "";
      fields.course_id = "";
    } else if (isLeadModal) {
      // Lead fields - ALL FIELDS FROM GRID
      fields.full_name = "";
      fields.email = "";
      fields.phone = "";
      fields.status = "";
      fields.workstatus = "";
      fields.secondary_email = "";
      fields.secondary_phone = "";
      fields.address = "";
      fields.notes = "";
      fields.entry_date = "";
      fields.closed_date = "";
      fields.moved_to_candidate = false;
      fields.massemail_unsubscribe = false;
      fields.massemail_email_sent = false;
    } else if (isVendorModal) {
      // Vendor fields
      fields.name = "";
      fields.email = "";
      fields.phone = "";
      fields.company = "";
      fields.type = "";
      fields.status = "";
      fields.linkedin = "";
      fields.location = "";
      fields.notes = "";
      fields.linkedin_connected = "no";
      fields.intro_email_sent = "no";
      fields.intro_call = "no";
    } else if (isCandidateModal) {
      // Candidate fields
      fields.full_name = "";
      fields.email = "";
      fields.phone = "";
      fields.status = "";
      fields.batchid = "";
      fields.workstatus = "";
      fields.location = "";
      fields.notes = "";
      fields.enrolled_date = "";
      fields.visa_status = "";
      fields.WorkExperience = "";
      fields.SSN = "";
      fields.Secondary_Email = "";
      fields.Secondary_Phone = "";
      fields.LinkedIn_ID = "";
      fields.Enrolled_Date = "";
      fields.Emergency_Contact_Name = "";
      fields.Emergency_Contact_Email = "";
      fields.Emergency_Contact_Phone = "";
      fields.Emergency_Contact_Address = "";
      fields.Candidate_Folder = "";
      fields.Address = "";
    } else if (isEmployeeModal) {
      // Employee fields
      fields.name = "";
      fields.email = "";
      fields.phone = "";
      fields.status = "";
      fields.instructor = "";
      fields.department = "";
      fields.notes = "";
    } else if (isMarketingModal) {
      // Marketing fields
      fields.candidate_full_name = "";
      fields.status = "";
      fields.priority = "";
      fields.target_date_of_marketing = "";
      fields.notes = "";
      fields.marketing_startdate = "";
    } else if (isInterviewModal) {
      // Interview fields
      fields.candidate_full_name = "";
      fields.company_type = "";
      fields.interview_date = "";
      fields.interview_mode = "";
      fields.type_of_interview = "";
      fields.feedback = "";
      fields.notes = "";
      fields.interviewer_emails = "";
      fields.interviewer_contact = "";
    } else if (isPlacementModal) {
      // Placement fields
      fields.candidate_full_name = "";
      fields.type = "";
      fields.status = "";
      fields.placement_date = "";
      fields.company_name = "";
      fields.notes = "";
    } else if (isPreparationModal) {
      // Preparation fields
      fields.candidate_full_name = "";
      fields.status = "";
      fields.instructor1_id = "";
      fields.instructor2_id = "";
      fields.instructor3_id = "";
      fields.start_date = "";
      fields.notes = "";
    } else if (isCourseMaterialModal) {
      // Course Material fields
      fields.cm_course = "";
      fields.cm_subject = "";
      fields.type = "";
      fields.filename = "";
      fields.link = "";
      fields.notes = "";
      fields.Link = "";
      fields.Description = "";
      fields.Material_Name = "";
    } else if (isCourseSubjectModal) {
      // Course Subject fields
      fields.course_name = "";
      fields.subject_name = "";
      fields.notes = "";
    }

    return fields;
  };

  // Handle form submission for CREATE only
  const onSubmit = (formData: any) => {
    const processedData = { ...formData };

    // Apply same data processing logic as EditModal but for creation
    if (isEmployeeModal) {
      if (formData.status) {
        processedData.status = parseInt(formData.status);
      }
      if (formData.instructor) {
        processedData.instructor = parseInt(formData.instructor);
      }
    }

    if (isCourseMaterialModal) {
      if (formData.cm_course) {
        const selectedCourse = courses.find(course => course.name === formData.cm_course);
        if (selectedCourse) {
          processedData.courseid = selectedCourse.id;
        }
      }
      if (formData.cm_subject) {
        const selectedSubject = subjects.find(subject => subject.name === formData.cm_subject);
        if (selectedSubject) {
          processedData.subjectid = selectedSubject.id;
        }
      }
      if (formData.material_type) {
        processedData.type = formData.material_type;
      }
    }

    if (isCourseSubjectModal) {
      if (formData.course_name) {
        const selectedCourse = courses.find(course => course.name === formData.course_name);
        if (selectedCourse) {
          processedData.courseid = selectedCourse.id;
        }
      }
      if (formData.subject_name) {
        const selectedSubject = subjects.find(subject => subject.name === formData.subject_name);
        if (selectedSubject) {
          processedData.subjectid = selectedSubject.id;
        }
      }
    }

    if (isBatchModal) {
      if (formData.course_id) {
        const selectedCourse = courses.find(course => course.id === parseInt(formData.course_id));
        if (selectedCourse) {
          processedData.courseid = selectedCourse.id;
        }
      }
    }

    // Call onSave with the processed data for CREATION
    onSave(processedData);
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

  // SAME LOGIC AS EDIT MODAL for enum options
  const getEnumOptions = (key: string) => {
    const keyLower = key.toLowerCase();

    if (isInterviewModal) {
      if (keyLower === 'company_type') return enumOptions.company_type;
      if (keyLower === 'mode_of_interview') return enumOptions.mode_of_interview;
      if (keyLower === 'type_of_interview') return enumOptions.type_of_interview;
      if (keyLower === 'feedback') return enumOptions.feedback;
    }

    if (isMarketingModal && keyLower === 'status') return enumOptions.marketing_status;
    if (isMarketingModal && keyLower === 'priority') return enumOptions.priority;

    if (isPlacementModal) {
      if (keyLower === 'type') return enumOptions.placement_type;
      if (keyLower === 'status') return enumOptions.placement_status;
    }

    if (isEmployeeModal) {
      if (keyLower === 'status') return enumOptions.employee_status;
      if (keyLower === 'instructor') return enumOptions.instructor_status;
    }

    if (isLeadModal) {
      if (keyLower === 'status') return leadStatusOptions.map(opt => ({ value: opt, label: opt }));
      if (keyLower === 'workstatus') return workStatusOptions.map(opt => ({ value: opt, label: opt }));
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

  const sectionedFields: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Contact Information": [],
    "Professional Information": [], 
    "Additional Information": [],
    "Email Preferences": [],
    "Emergency Contact": [],
    "Course Details": [],
    "Batch Details": [],
    "Content Details": [],
    Other: [],
    Notes: [],
  };

  const formFields = getFieldsForEntityType();
  const currentFormValues = watch();

  Object.entries(formFields).forEach(([key, value]) => {
    if (excludedFields.includes(key)) return;
    if (isCandidateOrEmployee && key.toLowerCase() === "name") return;
    if (isCourseSubjectModal && ["cm_course", "cm_subject"].includes(key.toLowerCase())) return;
    if (isCourseMaterialModal && ["subjectid", "courseid", "type"].includes(key.toLowerCase())) return;
    if (isBatchesModal && key.toLowerCase() === "batchid") return;
    if (isMarketingModal && (key === "Marketing Manager obj" || key === "marketing_manager_obj")) return;
    
    // NEW: Custom section assignments for new entities
    let section = fieldSections[key] || "Other";
    
    if (isCourseModal) {
      if (["name", "alias"].includes(key)) section = "Basic Information";
      else if (["description", "syllabus"].includes(key)) section = "Course Details";
    } else if (isSubjectModal) {
      if (["name"].includes(key)) section = "Basic Information";
      else if (["description"].includes(key)) section = "Course Details";
    } else if (isCourseContentsModal) {
      if (["fundamentals", "aiml", "ui", "qe"].includes(key)) section = "Content Details";
    } else if (isBatchModal) {
      if (["batch_name", "orientation_date"].includes(key)) section = "Basic Information";
      else if (["subject", "start_date", "end_date", "course_id"].includes(key)) section = "Batch Details";
    } else if (isLeadModal) {
      // Lead-specific section assignments
      if (["full_name", "entry_date", "closed_date"].includes(key)) section = "Basic Information";
      else if (["email", "phone", "secondary_email", "secondary_phone", "address"].includes(key)) section = "Contact Information";
      else if (["status", "workstatus", "moved_to_candidate"].includes(key)) section = "Professional Information";
      else if (["massemail_unsubscribe", "massemail_email_sent"].includes(key)) section = "Email Preferences";
      else if (key === "notes") section = "Notes";
    }
    
    if (!sectionedFields[section]) sectionedFields[section] = [];
    sectionedFields[section].push({ key, value });
  });

  // Reorder if special modal
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

  if (!isOpen) return null;

  // Render field input based on type - UPDATED FOR LEAD FIELDS
  const renderFieldInput = (key: string, value: any) => {
    const isTypeField = key.toLowerCase() === "type";
    const isBatchField = key.toLowerCase() === "batchid";
    const isStatusField = key.toLowerCase() === "status";
    const isWorkStatusField = key.toLowerCase() === "workstatus";
    const isMaterialTypeField = key.toLowerCase() === "material_type";
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
    const isCourseIdField = key.toLowerCase() === "course_id";
    const isSubjectField = key.toLowerCase() === "subject";
    const isDescriptionField = key.toLowerCase().includes("description");
    const isSyllabusField = key.toLowerCase() === "syllabus";
    const isContentField = ["fundamentals", "aiml", "ui", "qe"].includes(key.toLowerCase());
    const isBooleanField = [
      "moved_to_candidate", 
      "massemail_unsubscribe", 
      "massemail_email_sent"
    ].includes(key.toLowerCase());
    const isDateField = dateFields.includes(key.toLowerCase()) || key.toLowerCase().includes('date');

    if (isMaterialTypeField && !isCourseMaterialModal) {
      return null;
    }

    // Special handling for candidate_full_name in special modals (read-only in edit, but editable in add)
    if (isSpecialModal && isCandidateFullName) {
      return (
        <div key={key} className="space-y-1 sm:space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-blue-700">
            {toLabel(key)}
          </label>
          <input
            type="text"
            {...register(key)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
          />
        </div>
      );
    }

    // Handle boolean fields (checkboxes)
    if (isBooleanField) {
      return (
        <div key={key} className="space-y-1 sm:space-y-1.5">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register(key)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs sm:text-sm font-bold text-blue-700">
              {toLabel(key)}
            </span>
          </label>
        </div>
      );
    }

    // NEW: Handle Course ID field for Batch modal
    if (isCourseIdField && isBatchModal) {
      return (
        <div key={key} className="space-y-1 sm:space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-blue-700">
            {toLabel(key)}
          </label>
          <select
            {...register("course_id")}
            defaultValue={currentFormValues.course_id || ""}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // NEW: Handle Subject field for Batch modal
    if (isSubjectField && isBatchModal) {
      return (
        <div key={key} className="space-y-1 sm:space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-blue-700">
            {toLabel(key)}
          </label>
          <select
            {...register("subject")}
            defaultValue={currentFormValues.subject || ""}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // NEW: Handle description fields with textarea
    if (isDescriptionField && !isSyllabusField) {
      return (
        <div key={key} className="space-y-1 sm:space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-blue-700">
            {toLabel(key)}
          </label>
          <textarea
            {...register(key)}
            rows={3}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-vertical"
          />
        </div>
      );
    }

    // NEW: Handle syllabus field with larger textarea
    if (isSyllabusField) {
      return (
        <div key={key} className="space-y-1 sm:space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-blue-700">
            {toLabel(key)}
          </label>
          <textarea
            {...register(key)}
            rows={5}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-vertical"
          />
        </div>
      );
    }

    // NEW: Handle content fields (Fundamentals, AIML, UI, QE)
    if (isContentField) {
      return (
        <div key={key} className="space-y-1 sm:space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-blue-700">
            {toLabel(key)}
          </label>
          <textarea
            {...register(key)}
            rows={4}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-vertical"
            placeholder={`Enter ${toLabel(key)} content...`}
          />
        </div>
      );
    }

    const fieldEnumOptions = getEnumOptions(key);
    if (fieldEnumOptions) {
      const currentValue = currentFormValues[key] || value || "";
      return (
        <div key={key} className="space-y-1 sm:space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-blue-700">
            {toLabel(key)}
          </label>
          <select
            {...register(key)}
            defaultValue={currentValue}
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
            defaultValue={value || ""}
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
            defaultValue={value || ""}
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
            defaultValue={value || ""}
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
            defaultValue={value || ""}
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

    if (isDateField) {
      return (
        <div key={key} className="space-y-1 sm:space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-blue-700">
            {toLabel(key)}
          </label>
          <input
            type="date"
            {...register(key)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
          />
        </div>
      );
    }

    if (enumOptions[key.toLowerCase()]) {
      const currentValue = currentFormValues[key] || value || "";
      return (
        <div key={key} className="space-y-1 sm:space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-blue-700">
            {toLabel(key)}
          </label>
          <select
            {...register(key)}
            defaultValue={currentValue}
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

    // Default text input
    return (
      <div key={key} className="space-y-1 sm:space-y-1.5">
        <label className="block text-xs sm:text-sm font-bold text-blue-700">
          {toLabel(key)}
        </label>
        <input
          type="text"
          {...register(key)}
          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm"
        />
      </div>
    );
  };

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
                {title} - Add New
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
                        
                        {/* Course Material Specific Fields */}
                        {isCourseMaterialModal && section === "Professional Information" && (
                          <div className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">
                              Course Name
                            </label>
                            <select
                              {...register("cm_course")}
                              defaultValue={currentFormValues.cm_course || ""}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                            >
                              <option value="">Select Course</option>
                              {courses.map((course) => (
                                <option key={course.id} value={course.name}>
                                  {course.name}
                                </option>
                              ))}
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
                              defaultValue={currentFormValues.course_name || ""}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                            >
                              <option value="">Select Course</option>
                              {courses.map((course) => (
                                <option key={course.id} value={course.name}>
                                  {course.name}
                                </option>
                              ))}
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
                              defaultValue={currentFormValues.cm_subject || ""}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                            >
                              <option value="">Select Subject</option>
                              {subjects.map((subject) => (
                                <option key={subject.id} value={subject.name}>
                                  {subject.name}
                                </option>
                              ))}
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
                              defaultValue={currentFormValues.subject_name || ""}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                            >
                              <option value="">Select Subject</option>
                              {subjects.map((subject) => (
                                <option key={subject.id} value={subject.name}>
                                  {subject.name}
                                </option>
                              ))}
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
                              defaultValue={currentFormValues.material_type || ""}
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

                        {/* Instructor fields for Preparation */}
                        {section === "Professional Information" && isPreparationModal && (
                          <>
                            <div className="space-y-1 sm:space-y-1.5">
                              <label className="block text-xs sm:text-sm font-bold text-blue-700">
                                Instructor 1
                              </label>
                              <select
                                {...register("instructor1_id")}
                                defaultValue={currentFormValues.instructor1_id || ""}
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
                                defaultValue={currentFormValues.instructor2_id || ""}
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
                                defaultValue={currentFormValues.instructor3_id || ""}
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

                        {/* Render all other fields in the section */}
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
                          .map(({ key, value }) => renderFieldInput(key, value))}
                      </div>
                    ))}
                </div>

                {/* Notes Section */}
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
                                const newContent = `<p><strong>${timestamp}</strong></p>${currentFormValues.notes || ""}`;

                                setValue("notes", newContent);

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
                              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white
                                        bg-gradient-to-r from-cyan-500 to-blue-500
                                        rounded-lg hover:from-cyan-600 hover:to-blue-600
                                        transition shadow-md"
                            >
                              + New Entry
                            </button>
                          </div>
                          <ReactQuill
                            theme="snow"
                            value={currentFormValues.notes || ""}
                            onChange={(content) => {
                              setValue("notes", content);
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
                    Create New
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