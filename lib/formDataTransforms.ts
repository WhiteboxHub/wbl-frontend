import { dateFields } from "@/lib/formConfig";

export type EntityContext =
  | "candidate"
  | "employee"
  | "vendor"
  | "lead"
  | "interview"
  | "marketing"
  | "placement"
  | "preparation"
  | "course-material"
  | "course-subject"
  | "batch"
  | string;

export function detectContext(title: string, explicit?: EntityContext): EntityContext {
  if (explicit) return explicit;
  const t = (title || "").toLowerCase();
  if (t.includes("course-subject") || t.includes("course subject")) return "course-subject";
  if (t.includes("course material") || t.includes("material")) return "course-material";
  if (t.includes("interview")) return "interview";
  if (t.includes("marketing")) return "marketing";
  if (t.includes("placement")) return "placement";
  if (t.includes("preparation")) return "preparation";
  if (t.includes("employee")) return "employee";
  if (t.includes("vendor")) return "vendor";
  if (t.includes("candidate")) return "candidate";
  if (t.includes("lead")) return "lead";
  if (t.includes("batch") && !t.includes("course")) return "batch";
  return "candidate";
}

export function flattenData(
  data: Record<string, any>,
  ctx: EntityContext
): Record<string, any> {
  const flattened: Record<string, any> = { ...(data || {}) };

  if (data?.candidate) flattened.candidate_full_name = data.candidate.full_name;
  if (data?.instructor1) {
    flattened.instructor1_name = data.instructor1.name;
    flattened.instructor1_id = data.instructor1.id;
  }
  if (data?.instructor2) {
    flattened.instructor2_name = data.instructor2.name;
    flattened.instructor2_id = data.instructor2.id;
  }
  if (data?.instructor3) {
    flattened.instructor3_name = data.instructor3.name;
    flattened.instructor3_id = data.instructor3.id;
  }

  if (data?.visa_status) flattened.visa_status = String(data.visa_status).toLowerCase();
  if (data?.workstatus) flattened.workstatus = String(data.workstatus).toLowerCase();
  if (data?.work_status) flattened.work_status = String(data.work_status).toLowerCase();

  if (data?.type) flattened.material_type = data.type;
  if (data?.cm_course) {
    flattened.cm_course = data.cm_course;
  } else if (data?.course_name) {
    flattened.cm_course = data.course_name;
  } else if (data?.courseid === 0) {
    flattened.cm_course = "Fundamentals";
  }
  if (data?.cm_subject) {
    flattened.cm_subject = data.cm_subject;
  } else if (data?.subject_name) {
    flattened.cm_subject = data.subject_name;
  } else if (data?.subjectid === 0) {
    flattened.cm_subject = "Basic Fundamentals";
  }

  if (data?.status) {
    if (ctx === "employee") {
      flattened.status = String(data.status);
    } else {
      flattened.status = data.status;
    }
  }
  if (data?.instructor && ctx === "employee") {
    flattened.instructor = String(data.instructor);
  }

  if (ctx === "vendor") {
    if (data?.linkedin_connected) flattened.linkedin_connected = data.linkedin_connected;
    if (data?.intro_email_sent) flattened.intro_email_sent = data.intro_email_sent;
    if (data?.intro_call) flattened.intro_call = data.intro_call;
  }

  dateFields.forEach((dateField) => {
    if (
      flattened[dateField] &&
      !isNaN(new Date(flattened[dateField]).getTime())
    ) {
      flattened[dateField] = new Date(flattened[dateField]).toISOString().split("T")[0];
    }
  });

  return flattened;
}

export function reconstructData(
  formData: Record<string, any>,
  originalData: Record<string, any> | undefined,
  ctx: EntityContext,
  lists?: {
    courses?: { id: number; name: string }[];
    subjects?: { id: number; name: string }[];
  }
): Record<string, any> {
  const reconstructed = { ...formData };

  if (ctx === "employee") {
    if (formData.status !== undefined) {
      reconstructed.status = parseInt(formData.status);
    }
    if (formData.instructor !== undefined) {
      reconstructed.instructor = parseInt(formData.instructor);
    }
  }

  if (ctx === "course-material") {
    if (formData.cm_course && lists?.courses) {
      const selectedCourse = lists.courses.find((c) => c.name === formData.cm_course);
      if (selectedCourse) reconstructed.courseid = selectedCourse.id;
    }
    if (formData.cm_subject && lists?.subjects) {
      const selectedSubject = lists.subjects.find((s) => s.name === formData.cm_subject);
      if (selectedSubject) reconstructed.subjectid = selectedSubject.id;
    }
    if (formData.material_type) {
      reconstructed.type = formData.material_type;
    }
  }

  if (ctx === "course-subject") {
    if (formData.course_name && lists?.courses) {
      const selectedCourse = lists.courses.find((c) => c.name === formData.course_name);
      if (selectedCourse) reconstructed.courseid = selectedCourse.id;
    }
    if (formData.subject_name && lists?.subjects) {
      const selectedSubject = lists.subjects.find((s) => s.name === formData.subject_name);
      if (selectedSubject) reconstructed.subjectid = selectedSubject.id;
    }
  }

  if (formData.candidate_full_name) {
    reconstructed.candidate = {
      ...(originalData?.candidate || {}),
      full_name: formData.candidate_full_name,
    };
  }
  if (formData.instructor1_name) {
    reconstructed.instructor1 = {
      ...(originalData?.instructor1 || {}),
      name: formData.instructor1_name,
      id: formData.instructor1_id,
    };
  }
  if (formData.instructor2_name) {
    reconstructed.instructor2 = {
      ...(originalData?.instructor2 || {}),
      name: formData.instructor2_name,
      id: formData.instructor2_id,
    };
  }
  if (formData.instructor3_name) {
    reconstructed.instructor3 = {
      ...(originalData?.instructor3 || {}),
      name: formData.instructor3_name,
      id: formData.instructor3_id,
    };
  }

  return reconstructed;
}


