"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { useFormMeta } from "@/hooks/useFormMeta";
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

export interface DynamicFormRendererProps {
  mode: "add" | "edit";
  entity?: EntityContext;
  title?: string;
  initialData?: Record<string, any>;
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

export function DynamicFormRenderer({
  mode,
  entity,
  title,
  initialData,
  onSubmit,
  externalLists,
  options,
}: DynamicFormRendererProps) {
  const ctx = detectContext(title || entity || "", entity);
  const { courses, subjects, employees, mlBatches } = useFormMeta({ isOpen: true, propBatches: externalLists?.batches as any });

  const formInitial = mode === "edit" && initialData ? flattenData(initialData, ctx) : (initialData || {});

  const { register, handleSubmit, watch, setValue } = useForm({ defaultValues: formInitial });
  const currentValues = watch();

  const toLabel = (key: string) => {
    if (labelOverrides[key]) return labelOverrides[key];
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
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
  const isCandidate = ctx === "candidate" && !isPreparation;
  const isSpecial = isInterview || isMarketing || isPlacement || isPreparation;

  const sectioned: Record<string, { key: string; value: any }[]> = {
    "Basic Information": [],
    "Professional Information": [],
    "Contact Information": [],
    "Emergency Contact": [],
    Other: [],
    Notes: [],
  };

  const allData: Record<string, any> = { ...formInitial };
  Object.keys(allData).forEach((k) => {
    if (typeof allData[k] === "undefined") delete allData[k];
  });

  Object.entries(allData).forEach(([key, value]) => {
    if (excludedFields.includes(key)) return;
    if ((isCandidate || isEmployee) && key.toLowerCase() === "name") return;
    if (isCourseSubject && ["cm_course", "cm_subject"].includes(key.toLowerCase())) return;
    if (isCourseMaterial && ["subjectid", "courseid", "type"].includes(key.toLowerCase())) return;
    if (isMarketing && (key === "Marketing Manager obj" || key === "marketing_manager_obj")) return;
    const section = (options?.sectionOverrides?.[key]) || fieldSections[key] || "Other";
    if (!sectioned[section]) sectioned[section] = [];
    sectioned[section].push({ key, value });
  });

  if (isSpecial && sectioned["Basic Information"].some((i) => i.key === "candidate_full_name")) {
    const idx = sectioned["Basic Information"].findIndex((i) => i.key === "candidate_full_name");
    if (idx > -1) {
      const [item] = sectioned["Basic Information"].splice(idx, 1);
      sectioned["Basic Information"].unshift(item);
    }
  }

  const visibleSections = Object.keys(sectioned).filter((s) => sectioned[s]?.length > 0 && s !== "Notes");
  const totalFields = visibleSections.reduce((acc, s) => acc + sectioned[s].length, 0);
  let modalWidthClass = "max-w-6xl";
  if (totalFields <= 4) modalWidthClass = "max-w-3xl";
  else if (totalFields <= 8) modalWidthClass = "max-w-4xl";

  const gridColsClass = {
    1: "grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 md:grid-cols-3",
    4: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }[Math.min(visibleSections.length, 4)] || "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

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
    if (isPlacement) {
      if (k === 'type') return enumOptions.placement_type;
      if (k === 'status') return enumOptions.placement_status;
    }
    if (isEmployee) {
      if (k === 'status') return enumOptions.employee_status;
      if (k === 'instructor') return enumOptions.instructor_status;
    }
    if (isLead) {
      if (k === 'status') return enumOptions.lead_status;
      if (k === 'workstatus') return enumOptions.workstatus;
    }
    if (isVendor) {
      if (k === 'type' || k === 'vendor_type') return enumOptions.vendor_type;
      if (k === 'status') return enumOptions.vendor_status;
      if (k === 'linkedin_connected') return enumOptions.vendor_linkedin_connected;
      if (k === 'intro_email_sent') return enumOptions.vendor_intro_email_sent;
      if (k === 'intro_call') return enumOptions.vendor_intro_call;
    }
    if (isCandidate) {
      if (k === 'status') return enumOptions.candidate_status;
      if (k === 'workstatus') return enumOptions.workstatus;
    }
    if (k === 'priority') return undefined;
    return enumOptions[k];
  };

  const handleFormSubmit = (values: any) => {
    const finalData = reconstructData(values, initialData, ctx, { courses, subjects });
    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className={`grid ${gridColsClass} gap-2.5 sm:gap-3 md:gap-5`}>
        {visibleSections.filter((s) => s !== "Notes").map((section) => (
          <div key={section} className="space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-semibold text-blue-700 border-b border-blue-200 pb-1.5 sm:pb-2">{section}</h3>

            {isCourseMaterial && section === "Professional Information" && (
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-blue-700">Course Name</label>
                <select
                  {...register("cm_course")}
                  value={currentValues.cm_course || formInitial.cm_course || ""}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                >
                  {courses.length === 0 ? (
                    <option value="">Loading...</option>
                  ) : (
                    courses.map((course) => (
                      <option key={course.id} value={course.name}>{course.name}</option>
                    ))
                  )}
                </select>
              </div>
            )}

            {isCourseSubject && section === "Professional Information" && (
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-blue-700">Course Name</label>
                <select
                  {...register("course_name")}
                  value={currentValues.course_name || formInitial.course_name || ""}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                >
                  {courses.length === 0 ? (
                    <option value="">Loading...</option>
                  ) : (
                    courses.map((course) => (
                      <option key={course.id} value={course.name}>{course.name}</option>
                    ))
                  )}
                </select>
              </div>
            )}

            {isCourseMaterial && section === "Basic Information" && (
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-blue-700">Subject Name</label>
                <select
                  {...register("cm_subject")}
                  value={currentValues.cm_subject || formInitial.cm_subject || ""}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                >
                  {subjects.length === 0 ? (
                    <option value="">Loading...</option>
                  ) : (
                    subjects.map((subject) => (
                      <option key={subject.id} value={subject.name}>{subject.name}</option>
                    ))
                  )}
                </select>
              </div>
            )}

            {isCourseSubject && section === "Basic Information" && (
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-blue-700">Subject Name</label>
                <select
                  {...register("subject_name")}
                  value={currentValues.subject_name || formInitial.subject_name || ""}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                >
                  {subjects.length === 0 ? (
                    <option value="">Loading...</option>
                  ) : (
                    subjects.map((subject) => (
                      <option key={subject.id} value={subject.name}>{subject.name}</option>
                    ))
                  )}
                </select>
              </div>
            )}

            {isCourseMaterial && section === "Basic Information" && (
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-blue-700">Material Type</label>
                <select
                  {...register("material_type")}
                  value={currentValues.material_type || formInitial.material_type || ""}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                >
                  <option value="">Select Material Type</option>
                  {materialTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {sectioned[section]
              .filter(({ key }) => !["instructor1_name","instructor2_name","instructor3_name","instructor1_id","instructor2_id","instructor3_id",...(isCourseMaterial? ["cm_course","cm_subject","material_type"]:[]),...(isCourseSubject? ["course_name","subject_name"]:[])].includes(key))
              .map(({ key, value }) => {
                const k = key.toLowerCase();
                const isStatus = k === "status";
                const isBatch = k === "batchid";
                const isMaterialType = k === "material_type";
                const isCandidateFull = k === "candidate_full_name";

                if (options?.hiddenKeys?.includes(key)) return null;
                if (isMaterialType && !isCourseMaterial) return null;

                if (isSpecial && isCandidateFull) {
                  return (
                    <div key={key} className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}</label>
                      <input type="text" {...(register as any)(key)} defaultValue={formInitial[key] || ""} readOnly className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm" />
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

                const enumOpts = getEnumOptions(key);
                if (enumOpts) {
                  const cur = currentValues[key] || formInitial[key] || "";
                  return (
                    <div key={key} className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}</label>
                      <select {...(register as any)(key)} value={cur} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                        {enumOpts.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (isStatus && isVendor) {
                  return (
                    <div key={key} className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}</label>
                      <select {...(register as any)(key)} value={currentValues[key] || formInitial[key] || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                        {vendorStatuses.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (isBatch) {
                  return (
                    <div key={key} className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}</label>
                      <select {...(register as any)("batchid")} value={currentValues.batchid || formInitial.batchid || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm">
                        <option value="">Select a batch (optional)</option>
                        {mlBatches.map((b) => (
                          <option key={b.batchid} value={b.batchid}>{b.batchname}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (dateFields.includes(k)) {
                  return (
                    <div key={key} className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}</label>
                      <input type="date" {...(register as any)(key)} defaultValue={formInitial[key] || ""} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm" />
                    </div>
                  );
                }

                if (typeof value === "string" && value.length > 100) {
                  return (
                    <div key={key} className="space-y-1 sm:space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}</label>
                      <textarea {...(register as any)(key)} defaultValue={formInitial[key] || ""} rows={3} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition shadow-sm resize-none" />
                    </div>
                  );
                }

                const readOnly = options?.readOnlyKeys?.includes(key);
                return (
                  <div key={key} className="space-y-1 sm:space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-blue-700">{toLabel(key)}</label>
                    <input type="text" {...(register as any)(key)} defaultValue={formInitial[key] || ""} readOnly={!!readOnly} className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg ${readOnly? 'bg-gray-100 text-gray-600 cursor-not-allowed':'hover:border-blue-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm`} />
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
                  <button
                    type="button"
                    onClick={() => {
                      const timestamp = `[${new Date().toLocaleString()}]: `;
                      const newContent = `<p><strong>${timestamp}</strong></p>${currentValues.notes || formInitial.notes || ""}`;
                      setValue("notes", newContent);
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition shadow-md"
                  >
                    + New Entry
                  </button>
                </div>
                <ReactQuill
                  theme="snow"
                  value={currentValues.notes || formInitial.notes || ""}
                  onChange={(content) => setValue("notes", content)}
                  className="bg-white dark:bg-gray-800"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-3 sm:mt-4 md:mt-6 pt-2 sm:pt-3 md:pt-4 border-t border-blue-200">
        <button type="submit" className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition shadow-md">
          {mode === "edit" ? "Save Changes" : "Create"}
        </button>
      </div>
    </form>
  );
}

export default DynamicFormRenderer;


