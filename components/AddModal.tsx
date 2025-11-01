"use client";
import React from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import {
  enumOptions,
  vendorStatuses,
  vendorTypeOptions,
  genericStatusOptions,
  fieldSections,
  labelOverrides,
  excludedFields,
  materialTypeOptions,
  dateFields,
} from "@/lib/formConfig";
import { detectContext, flattenData, reconstructData, EntityContext } from "@/lib/formDataTransforms";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

// Inline meta fetcher (merged from useFormMeta)
function useInlineFormMeta(isOpen: boolean, propBatches?: { batchid: number; batchname: string }[]) {
  const [courses, setCourses] = React.useState<{ id: number; name: string }[]>([]);
  const [subjects, setSubjects] = React.useState<{ id: number; name: string }[]>([]);
  const [employees, setEmployees] = React.useState<{ id: number; name: string; status?: number }[]>([]);
  const [mlBatches, setMlBatches] = React.useState<{ batchid: number; batchname: string }[]>([]);

  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiFetch("/courses");
        const data = (res as any)?.data ?? res;
        const sorted = [...(data || [])].sort((a: any, b: any) => b.id - a.id);
        setCourses(sorted);
      } catch {}
    };
    const fetchSubjects = async () => {
      try {
        const res = await apiFetch("/subjects");
        const data = (res as any)?.data ?? res;
        const sorted = [...(data || [])].sort((a: any, b: any) => b.id - a.id);
        setSubjects(sorted);
      } catch {}
    };
    const fetchEmployees = async () => {
      try {
        const res = await apiFetch("/employees");
        const data = (res as any)?.data ?? res;
        const active = (data || []).filter((e: any) => e.status === 1);
        setEmployees(active);
      } catch {}
    };
    fetchCourses();
    fetchSubjects();
    fetchEmployees();
  }, []);

  React.useEffect(() => {
    const fetchMlBatches = async () => {
      try {
        const res = await apiFetch("/batch");
        const data = (res as any)?.data ?? res;
        const sortedAll = [...(data || [])].sort((a: any, b: any) => b.batchid - a.batchid);
        let mlOnly = sortedAll.filter((b: any) => {
          const s = (b.subject || "").toLowerCase();
          return s === "ml" || s === "machine learning" || s === "machinelearning" || s.includes("ml");
        });
        if (mlOnly.length === 0) mlOnly = sortedAll.filter((b: any) => b.courseid === 3);
        if (mlOnly.length === 0) mlOnly = sortedAll;
        setMlBatches(mlOnly);
      } catch {}
    };
    if (isOpen && (!propBatches || propBatches.length === 0)) fetchMlBatches();
    else if (propBatches && propBatches.length > 0) setMlBatches(propBatches);
  }, [isOpen, propBatches]);

  return { courses, subjects, employees, mlBatches };
}

// interface AddModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   onSave: (newData: Record<string, any>) => void;
//   batches?: Batch[];
//   defaultValues?: Record<string, any>;
// }

export interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSave: (newData: Record<string, any>) => void;
  mode: "add" | "edit";
  batches?: { batchid: number; batchname: string }[];
  entity?: EntityContext;
  initialData?: Record<string, any>;
  defaultValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  externalLists?: {
    courses?: { id: number; name: string }[];
    subjects?: { id: number; name: string }[];
    employees?: { id: number; name: string; status?: number }[];
    batches?: { batchid: number; batchname: string }[];
  };
  options?: {
    hiddenKeys?: string[];
    readOnlyKeys?: string[];
    sectionOverrides?: Record<string, string>;
    enumOverrides?: Record<string, { value: string; label: string }[]>;
  };
}

export default function AddModal(props: AddModalProps) {
  const { isOpen, onClose, title, mode, entity, initialData, onSubmit, externalLists, options } = props;
  const ctx = detectContext(title || entity || "", entity);
  const { courses, subjects, employees, mlBatches } = useInlineFormMeta(isOpen, externalLists?.batches);
  const [interviewCandidates, setInterviewCandidates] = React.useState<{ id: number; full_name: string }[]>([]);

  let formInitial = mode === "edit" && initialData ? flattenData(initialData, ctx) : (initialData || {});
  if ((ctx === "preparation" || ctx === "interview" || ctx === "marketing") && !("candidate_full_name" in formInitial)) {
    formInitial = { candidate_full_name: "", ...formInitial };
  }
  if (ctx === "preparation") {
    formInitial = {
      instructor1_id: formInitial.instructor1_id ?? "",
      instructor2_id: formInitial.instructor2_id ?? "",
      instructor3_id: formInitial.instructor3_id ?? "",
      ...formInitial,
    };
  }
  if (mode === "add" && ctx === "candidate") {
    const ensureKeys: string[] = [
      ["full_name", "fullname", "name"].find((k) => k in formInitial) || "full_name",
      ["email", "candidate_email", "secondaryemail", "secondary_email"].find((k) => k in formInitial) || "email",
      ["phone_number", "phone", "contact"].find((k) => k in formInitial) || "phone_number",
      "dob",
      "batchid",
    ];
    const additions: Record<string, any> = {};
    ensureKeys.forEach((k) => { if (!(k in formInitial)) additions[k] = ""; });
    formInitial = { ...additions, ...formInitial };
  }
  if (mode === "add" && ctx === "employee") {
    const ensureKeys: string[] = [
      ["full_name", "fullname", "name"].find((k) => k in formInitial) || "full_name",
      ["email", "uname"].find((k) => k in formInitial) || "email",
      "status",
      "instructor",
    ];
    const additions: Record<string, any> = {};
    ensureKeys.forEach((k) => { if (!(k in formInitial)) additions[k] = ""; });
    formInitial = { ...additions, ...formInitial };
  }
  if (mode === "add" && ctx === "batch") {
    if (formInitial.courseid === undefined || formInitial.courseid === "") formInitial.courseid = 3;
    if (formInitial.subjectid === undefined) formInitial.subjectid = "";
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ defaultValues: formInitial });
  const currentValues = watch();

  React.useEffect(() => {
    let mounted = true;
    const loadCandidates = async () => {
      try {
        if (!(ctx === "interview" && mode === "add")) return;
        const res = await apiFetch("/candidate/marketing?page=1&limit=200");
        const body = (res as any)?.data ?? res;
        const arr = Array.isArray(body) ? body : body?.data ?? [];
        const active = (arr || []).filter((m: any) => (m?.status || "").toString().toLowerCase() === "active" && !!m.candidate);
        const mapped = active.map((m: any) => ({ id: m.candidate.id, full_name: m.candidate.full_name }));
        if (!mounted) return; setInterviewCandidates(mapped);
      } catch {}
    };
    loadCandidates();
    return () => { mounted = false; };
  }, [ctx, mode]);

  const toLabel = (key: string) => {
    if (labelOverrides[key]) return labelOverrides[key];
    return key.replace(/([A-Z])/g, " $1").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };
  const isInterview = ctx === "interview";
  const isMarketing = ctx === "marketing";
  const isPlacement = ctx === "placement";
  const isPreparation = ctx === "preparation";
  const isEmployee = ctx === "employee";
  const isLead = ctx === "lead";
  const isVendor = ctx === "vendor";
  const isCourseMaterial = ctx === "course-material";
  const isCourseSubject = ctx === "course-subject";
  const isSubjectSimple = ctx === "subject";
  const isBatchContext = ctx === "batch";
  const isCandidate = ctx === "candidate" && !isPreparation;
  const isSpecial = isInterview || isMarketing || isPlacement || isPreparation;

  const requiredKeys = new Set<string>();
  if (mode === "add" && isLead) {
    const nameKey = ["full_name", "fullname", "name"].find((k) => k in formInitial);
    const emailKey = ["email", "candidate_email", "secondaryemail", "secondary_email"].find((k) => k in formInitial);
    const phoneKey = ["phone_number", "phone", "contact"].find((k) => k in formInitial);
    if (nameKey) requiredKeys.add(nameKey); if (emailKey) requiredKeys.add(emailKey); if (phoneKey) requiredKeys.add(phoneKey);
  }
  if (mode === "add" && isCandidate) {
    const nameKey = ["full_name", "fullname", "name"].find((k) => k in formInitial);
    const emailKey = ["email", "candidate_email", "secondaryemail", "secondary_email"].find((k) => k in formInitial);
    const phoneKey = ["phone_number", "phone", "contact"].find((k) => k in formInitial);
    const dobKey = ["dob", "date_of_birth"].find((k) => k in formInitial);
    const batchKey = ["batchid"].find((k) => k in formInitial);
    if (nameKey) requiredKeys.add(nameKey); if (emailKey) requiredKeys.add(emailKey); if (phoneKey) requiredKeys.add(phoneKey);
    if (dobKey) requiredKeys.add(dobKey); if (batchKey) requiredKeys.add(batchKey);
  }
  if (mode === "add" && isEmployee) {
    const nameKey = ["full_name", "fullname", "name"].find((k) => k in formInitial);
    const emailKey = ["email", "uname"].find((k) => k in formInitial);
    const statusKey = ["status"].find((k) => k in formInitial);
    const instructorKey = ["instructor"].find((k) => k in formInitial);
    if (nameKey) requiredKeys.add(nameKey); if (emailKey) requiredKeys.add(emailKey);
    if (statusKey) requiredKeys.add(statusKey); if (instructorKey) requiredKeys.add(instructorKey);
  }
  const isRequired = (key: string) => requiredKeys.has(key);

  const sectioned: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    Other: [],
    Notes: [],
  };

  const allData: Record<string, any> = { ...formInitial };
  Object.keys(allData).forEach((k) => { if (typeof allData[k] === "undefined") delete allData[k]; });
  Object.entries(allData).forEach(([key, value]) => {
    if (excludedFields.includes(key)) return;
    if ((isCandidate || isEmployee) && key.toLowerCase() === "name") return;
    if (isCourseSubject && ["cm_course", "cm_subject"].includes(key.toLowerCase())) return;
    if (isCourseMaterial && ["subjectid", "courseid", "type"].includes(key.toLowerCase())) return;
    if (isMarketing && (key === "Marketing Manager obj" || key === "marketing_manager_obj")) return;
    const section = (options?.sectionOverrides?.[key]) || (fieldSections as any)[key] || "Other";
    if (!sectioned[section]) sectioned[section] = [];
    sectioned[section].push({ key, value });
  });

  if (isSpecial && sectioned["Basic Information"].some((i) => i.key === "candidate_full_name")) {
    const idx = sectioned["Basic Information"].findIndex((i) => i.key === "candidate_full_name");
    if (idx > -1) { const [item] = sectioned["Basic Information"].splice(idx, 1); sectioned["Basic Information"].unshift(item); }
  }

  const visibleSections = Object.keys(sectioned).filter((s) => {
    if (!sectioned[s] || sectioned[s].length === 0) return false;
    if (s === "Notes") return false;
    if (isBatchContext && mode === "add" && s === "Contact Information") return false;
    return true;
  });
  const totalFields = visibleSections.reduce((acc, s) => acc + sectioned[s].length, 0);
  let modalWidthClass = "max-w-6xl";
  if (totalFields <= 4) modalWidthClass = "max-w-3xl"; else if (totalFields <= 8) modalWidthClass = "max-w-4xl";
  const gridColsClass = ({1:"grid-cols-1",2:"sm:grid-cols-2",3:"sm:grid-cols-2 md:grid-cols-3",4:"sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"} as any)[Math.min(visibleSections.length, 4)] || "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  const getEnumOptions = (key: string) => {
    const k = key.toLowerCase();
    if (options?.enumOverrides?.[k]) return options.enumOverrides[k];
    if (isInterview) {
      if (k === 'company_type') return enumOptions.company_type;
      if (k === 'mode_of_interview') return enumOptions.mode_of_interview;
      if (k === 'type_of_interview') return enumOptions.type_of_interview;
      if (k === 'feedback') return enumOptions.feedback;
    }
    if (isMarketing && k === 'status') return enumOptions.marketing_status;
    if (isMarketing && k === 'priority') return enumOptions.priority;
    if (isPlacement) { if (k === 'type') return enumOptions.placement_type; if (k === 'status') return enumOptions.placement_status; }
    if (isEmployee) { if (k === 'status') return enumOptions.employee_status; if (k === 'instructor') return enumOptions.instructor_status; }
    if (isLead) { if (k === 'status') return enumOptions.lead_status; if (k === 'workstatus') return enumOptions.workstatus; }
    if (isVendor) {
      if (k === 'type' || k === 'vendor_type') return enumOptions.vendor_type;
      if (k === 'status') return enumOptions.vendor_status;
      if (k === 'linkedin_connected') return enumOptions.vendor_linkedin_connected;
      if (k === 'intro_email_sent') return enumOptions.vendor_intro_email_sent;
      if (k === 'intro_call') return enumOptions.vendor_intro_call;
    }
    if (isCandidate) { if (k === 'status') return enumOptions.candidate_status; if (k === 'workstatus') return enumOptions.workstatus; }
    if (k === 'priority') return undefined;
    return (enumOptions as any)[k];
  };

  const displayLabel = (key: string) => {
    if (isBatchContext && key.toLowerCase() === "batchname") return "Batch Name (YYYY-MM)";
    return toLabel(key);
  };

  const handleFormSubmit = (values: any) => {
    const finalData = reconstructData(values, initialData, ctx, { courses, subjects });
    onSubmit(finalData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className={`bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full ${modalWidthClass} max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 border-b border-blue-200 flex justify-between items-center">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{title}</h2>
          <button onClick={onClose} className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 p-1 rounded-lg transition"><X size={16} className="sm:w-5 sm:h-5" /></button>
        </div>
        <div className="p-3 sm:p-4 md:p-6 bg-white">
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className={`grid ${gridColsClass} gap-2.5 sm:gap-3 md:gap-5`}>
              {visibleSections.map((section) => (
                <div key={section} className="space-y-3 sm:space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-blue-700 border-b border-blue-200 pb-1.5 sm:pb-2">{section}</h3>

                  {isCourseMaterial && section === "Professional Information" && (
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">Course Name</label>
                      <select {...register("cm_course")} value={currentValues.cm_course || formInitial.cm_course || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                        {courses.length === 0 ? (<option value="">Loading...</option>) : courses.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
                      </select>
                    </div>
                  )}

                  {isCourseSubject && section === "Professional Information" && (
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">Course Name</label>
                      <select {...register("course_name")} value={currentValues.course_name || formInitial.course_name || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                        {courses.length === 0 ? (<option value="">Loading...</option>) : courses.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
                      </select>
                    </div>
                  )}

                  {isCourseMaterial && section === "Basic Information" && (
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">Subject Name</label>
                      <select {...register("cm_subject")} value={currentValues.cm_subject || formInitial.cm_subject || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                        {subjects.length === 0 ? (<option value="">Loading...</option>) : subjects.map((s) => (<option key={s.id} value={s.name}>{s.name}</option>))}
                      </select>
                    </div>
                  )}

                  {isCourseSubject && section === "Basic Information" && (
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">Subject Name</label>
                      <select {...register("subject_name")} value={currentValues.subject_name || formInitial.subject_name || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                        {subjects.length === 0 ? (<option value="">Loading...</option>) : subjects.map((s) => (<option key={s.id} value={s.name}>{s.name}</option>))}
                      </select>
                    </div>
                  )}

                  {isCourseMaterial && section === "Basic Information" && (
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">Material Type</label>
                      <select {...register("material_type")} value={currentValues.material_type || formInitial.material_type || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                        <option value="">Select Material Type</option>
                        {materialTypeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </select>
                    </div>
                  )}

                  {section === "Professional Information" && isPreparation && (
                    <>
                      <div className="space-y-1 sm:space-y-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-blue-700">Instructor 1</label>
                        <select {...(register as any)("instructor1_id")} value={currentValues.instructor1_id || formInitial.instructor1_id || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                          <option value="">Select Instructor</option>
                          {employees.map((emp) => (<option key={emp.id} value={emp.id as any}>{emp.name}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-blue-700">Instructor 2</label>
                        <select {...(register as any)("instructor2_id")} value={currentValues.instructor2_id || formInitial.instructor2_id || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                          <option value="">Select Instructor</option>
                          {employees.map((emp) => (<option key={emp.id} value={emp.id as any}>{emp.name}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-blue-700">Instructor 3</label>
                        <select {...(register as any)("instructor3_id")} value={currentValues.instructor3_id || formInitial.instructor3_id || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                          <option value="">Select Instructor</option>
                          {employees.map((emp) => (<option key={emp.id} value={emp.id as any}>{emp.name}</option>))}
                        </select>
                      </div>
                    </>
                  )}

                  {sectioned[section]
                    .filter(({ key }) => !["instructor1_name","instructor2_name","instructor3_name","instructor1_id","instructor2_id","instructor3_id",...(isCourseMaterial? ["cm_course","cm_subject","material_type"]:[]),...(isCourseSubject? ["course_name","subject_name"]:[])].includes(key))
                    .map(({ key, value }) => {
                      const k = key.toLowerCase();
                      const isStatus = k === "status";
                      const isBatch = k === "batchid";
                      const isMaterialType = k === "material_type";
                      const isCandidateFull = k === "candidate_full_name";
                      const isSubjectId = k === "subjectid";
                      const isCourseId = k === "courseid";
                      const isCandidateId = k === "candidate_id";

                      if (options?.hiddenKeys?.includes(key)) return null;
                      if (isMaterialType && !isCourseMaterial) return null;

                      if (ctx === "interview" && mode === "add" && (isCandidateFull || isCandidateId)) {
                        if (isCandidateId) return null;
                        const currentId = currentValues.candidate_id || formInitial.candidate_id || "";
                        return (
                          <div key={key} className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">Candidate Name<span className="text-red-500"> *</span></label>
                            <select {...(register as any)("candidate_id", { required: "Candidate is required" })} value={currentId} onChange={(e) => { const selId = e.target.value; const cand = interviewCandidates.find(c => c.id.toString() === selId); setValue("candidate_id", selId); if (cand) setValue("candidate_full_name", cand.full_name); }} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                              <option value="">Select Candidate</option>
                              {interviewCandidates.map((c) => (<option key={c.id} value={c.id}>{c.full_name}</option>))}
                            </select>
                          </div>
                        );
                      }

                      // Avoid duplicate Candidate Name field when interview add dropdown is used
                      if (isSpecial && isCandidateFull) {
                        if (ctx === "interview" && mode === "add") return null;
                        return (
                          <div key={key} className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}{isRequired(key) ? <span className="text-red-500"> *</span> : null}</label>
                            <input type="text" {...(register as any)(key, isRequired(key) ? { required: `${toLabel(key)} is required` } : undefined)} defaultValue={formInitial[key] || ""} readOnly={mode === "edit"} aria-invalid={errors[key] ? "true" : "false"} required={isRequired(key)} className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border ${errors[key] ? 'border-red-400' : 'border-blue-200'} rounded-lg ${mode === "edit" ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''} shadow-sm`} />
                          </div>
                        );
                      }

                      if (isStatus && (isPreparation || isMarketing)) {
                        const statusValue = formInitial[key] || "";
                        const displayValue = statusValue ? statusValue.charAt(0).toUpperCase() + statusValue.slice(1) : "";
                        return (
                          <div key={key} className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}</label>
                            <input type="text" {...(register as any)(key)} defaultValue={displayValue} readOnly className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm" />
                          </div>
                        );
                      }

                      const fieldEnumOptions = getEnumOptions(key);
                      if (fieldEnumOptions) {
                        const current = currentValues[key] || formInitial[key] || "";
                        return (
                          <div key={key} className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}{isRequired(key) ? <span className="text-red-500"> *</span> : null}</label>
                            <select {...(register as any)(key)} value={current} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                              {fieldEnumOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                          </div>
                        );
                      }

                      if (isStatus && isVendor) {
                        return (
                          <div key={key} className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}{isRequired(key) ? <span className="text-red-500"> *</span> : null}</label>
                            <select {...(register as any)(key, isRequired(key) ? { required: `${toLabel(key)} is required` } : undefined)} value={currentValues[key] || formInitial[key] || ""} className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border ${errors[key] ? 'border-red-400' : 'border-blue-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm`} required={isRequired(key)}>
                              {vendorStatuses.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                          </div>
                        );
                      }

                      if (isBatch) {
                        if (isBatchContext) return null;
                        return (
                          <div key={key} className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}{isRequired(key) ? <span className="text-red-500"> *</span> : null}</label>
                            <select {...(register as any)("batchid", isRequired(key) ? { required: `${toLabel(key)} is required` } : undefined)} value={currentValues.batchid || formInitial.batchid || ""} className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border ${errors[key] ? 'border-red-400' : 'border-blue-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm`} required={isRequired(key)}>
                              <option value="">Select a batch (optional)</option>
                              {mlBatches.map((b) => (<option key={b.batchid} value={b.batchid}>{b.batchname}</option>))}
                            </select>
                          </div>
                        );
                      }

                      if (dateFields.includes(k)) {
                        return (
                          <div key={key} className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}{isRequired(key) ? <span className="text-red-500"> *</span> : null}</label>
                            <input type="date" {...(register as any)(key, isRequired(key) ? { required: `${toLabel(key)} is required` } : undefined)} defaultValue={formInitial[key] || ""} required={isRequired(key)} className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border ${errors[key] ? 'border-red-400' : 'border-blue-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm`} />
                          </div>
                        );
                      }

                      if (typeof value === "string" && value.length > 100) {
                        return (
                          <div key={key} className="space-y-1 sm:space-y-1.5">
                            <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}{isRequired(key) ? <span className="text-red-500"> *</span> : null}</label>
                            <textarea {...(register as any)(key, isRequired(key) ? { required: `${toLabel(key)} is required` } : undefined)} defaultValue={formInitial[key] || ""} rows={3} className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border ${errors[key] ? 'border-red-400' : 'border-blue-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-none`} required={isRequired(key)} />
                          </div>
                        );
                      }

                      if (isBatchContext && section === "Professional Information" && (k === "subject" || k === "subjectid")) {
                        return null;
                      }

                      return (
                        <div key={key} className="space-y-1 sm:space-y-1.5">
                          <label className="block text-xs sm:text-sm font-bold text-blue-700">{displayLabel(key)}{isRequired(key) ? <span className="text-red-500"> *</span> : null}</label>
                          <input type="text" {...(register as any)(key, isRequired(key) ? { required: `${toLabel(key)} is required` } : undefined)} defaultValue={formInitial[key] || ""} readOnly={!!(options?.readOnlyKeys?.includes(key))} aria-invalid={errors[key] ? "true" : "false"} required={isRequired(key)} className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border ${errors[key] ? 'border-red-400' : 'border-blue-200'} rounded-lg ${options?.readOnlyKeys?.includes(key)? 'bg-gray-100 text-gray-600 cursor-not-allowed':'hover:border-blue-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm`} />
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>

            {sectioned["Notes"].length > 0 && (
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-blue-200">
                <div className="space-y-6">
                  {sectioned["Notes"].map(({ key }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{toLabel(key)}</label>
                        <button type="button" onClick={() => { const ts = `[${new Date().toLocaleString()}]: `; const newContent = `<p><strong>${ts}</strong></p>${currentValues.notes || formInitial.notes || ""}`; setValue("notes", newContent); }} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition shadow-md">+ New Entry</button>
                      </div>
                      <ReactQuill theme="snow" value={currentValues.notes || formInitial.notes || ""} onChange={(content) => setValue("notes", content)} className="bg-white dark:bg-gray-800" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-3 sm:mt-4 md:mt-6 pt-2 sm:pt-3 md:pt-4 border-t border-blue-200">
              <button type="submit" className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition shadow-md">{mode === "edit" ? "Save Changes" : "Create"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
 