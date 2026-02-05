"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";
import { useForm } from "react-hook-form";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

interface CourseMaterial {
  id: number;
  subjectid: number;
  courseid: number;
  name: string;
  description: string;
  type: string;
  link: string;
  sortorder: number;
}

interface Course {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

interface MaterialFormData {
  courseid: string;
  subjectid: string;
  type: string;
  sortorder: string;
  name: string;
  link: string;
  description: string;
}

const TYPE_MAPPING = {
  P: "Presentations",
  Y: "Must See Youtube Videos",
  C: "Cheatsheets",
  SG: "Study Guides",
  D: "Diagrams",
  S: "Softwares",
  I: "Interactive Visual Explainers",
  B: "Books",
  N: "Newsletters",
  M: "Materials",
  A: 'Assignments'
};

const TYPE_OPTIONS = [
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

export default function CourseMaterialPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoader = useMinimumLoadingTime(loading);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm<MaterialFormData>({
    defaultValues: {
      subjectid: "0",
      courseid: "",
      type: "P",
      sortorder: "9999",
      name: "",
      description: "",
      link: ""
    }
  });

  const fetchCourses = async () => {
    try {
      const res = await apiFetch("/courses");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedCourses = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);
      setCourses(sortedCourses);
    } catch (e: any) {
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await apiFetch("/subjects");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedSubjects = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);
      setSubjects(sortedSubjects);
    } catch (e: any) {
    }
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      setError("");
      const res = await apiFetch("/course-materials");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedMaterials = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);
      setMaterials(sortedMaterials);
      setFilteredMaterials(sortedMaterials);
      toast.success("Course Materials fetched successfully", { position: "top-center" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to fetch Course Materials";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      toast.error("Failed to fetch Course Materials", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchCourses();
    fetchSubjects();
  }, []);

  const getSubjectDisplayName = (subjectId: number) => {
    if (subjectId === 0) return "Basic Fundamentals";
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : `Subject ID: ${subjectId}`;
  };

  const getCourseDisplayName = (courseId: number) => {
    if (courseId === 0) return "Fundamentals";
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : `Course ID: ${courseId}`;
  };

  const getTypeDisplayName = (typeCode: string) => {
    return TYPE_MAPPING[typeCode as keyof typeof TYPE_MAPPING] || typeCode;
  };

  // Search Filter
  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) {
      setFilteredMaterials(materials);
      return;
    }

    const filtered = materials.filter((row) => {
      const idStr = row.id?.toString().toLowerCase() || "";
      const nameStr = row.name?.toLowerCase() || "";
      const typeStr = getTypeDisplayName(row.type)?.toLowerCase() || "";
      const courseNameStr = getCourseDisplayName(row.courseid)?.toLowerCase() || "";
      const subjectNameStr = getSubjectDisplayName(row.subjectid)?.toLowerCase() || "";

      return (
        idStr.includes(lower) ||
        nameStr.includes(lower) ||
        typeStr.includes(lower) ||
        courseNameStr.includes(lower) ||
        subjectNameStr.includes(lower)
      );
    });

    setFilteredMaterials(filtered);
  }, [searchTerm, materials, subjects, courses]);

  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
    {
      field: "id",
      headerName: "ID",
      width: 130,
      pinned: "left",
      editable: false
    },
    {
      field: "subjectid",
      headerName: "Subject Name",
      width: 180,
      editable: true,
      valueFormatter: (params) => {
        return getSubjectDisplayName(params.value);
      },
      cellEditor: "agRichSelectCellEditor",
      cellEditorParams: {
        values: [
          0,
          ...subjects.map(s => s.id)
        ],
        formatValue: (value: number) => {
          return getSubjectDisplayName(value);
        }
      },
      cellEditorPopup: true,
    },
    {
      field: "courseid",
      headerName: "Course Name",
      width: 180,
      editable: true,
      valueFormatter: (params) => {
        return getCourseDisplayName(params.value);
      },
      cellEditor: "agRichSelectCellEditor",
      cellEditorParams: {
        values: [
          0,
          ...courses.map(c => c.id)
        ],
        formatValue: (value: number) => {
          return getCourseDisplayName(value);
        }
      },
      cellEditorPopup: true,
    },
    {
      field: "name",
      headerName: "Material Name",
      width: 250,
      editable: true
    },
    {
      field: "description",
      headerName: "Description",
      width: 230,
      editable: true
    },
    {
      field: "type",
      headerName: "Type",
      width: 150,
      editable: true,
      valueFormatter: (params) => {
        return getTypeDisplayName(params.value);
      },
      cellEditor: "agRichSelectCellEditor",
      cellEditorParams: {
        values: Object.keys(TYPE_MAPPING),
        formatValue: (value: string) => {
          return getTypeDisplayName(value);
        }
      },
      cellEditorPopup: true,
    },
    {
      field: "link",
      headerName: "Link",
      width: 130,
      editable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return "";
        return (
          <a
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Click Here
          </a>
        );
      },
    },
    {
      field: "sortorder",
      headerName: "Sort Order",
      width: 140,
      editable: true,
      valueParser: (params) => Number(params.newValue)
    },
  ], [subjects, courses]);

  // Update material
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await apiFetch(`/course-materials/${updatedRow.id}`, { method: "PUT", body: updatedRow });
      setMaterials((prev) => prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)));
      setFilteredMaterials((prev) => prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)));
      toast.success("Course Material updated successfully", { position: "top-center" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to update Course Material";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg), { position: "top-center" });
    }
  };

  // Delete material
  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/course-materials/${id}`, { method: "DELETE" });
      setMaterials((prev) => prev.filter((r) => r.id !== id));
      setFilteredMaterials((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Course Material ${id} deleted`, { position: "top-center" });
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to delete Course Material";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg), { position: "top-center" });
    }
  };

  if (showLoader) return <Loader />;
  if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      {/* Header + Search + Add Button (Responsive Layout) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Section */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Course Materials</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage course materials for courses and subjects.</p>

          {/* Search Input */}
          <div className="mt-2 sm:mt-0 sm:max-w-md">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</Label>
            <div className="relative mt-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, name, type..."
                className="w-full pl-10 text-sm sm:text-base"
              />
            </div>
            {searchTerm && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{filteredMaterials.length} results found</p>}
          </div>
        </div>
      </div>

      <AGGridTable
        rowData={filteredMaterials}
        columnDefs={columnDefs}
        defaultColDef={{
          editable: true,
          flex: 1,
          resizable: true,
        }}
        title={`Course Materials (${filteredMaterials.length})`}
        onRowAdded={async (newRow: any) => {
          try {
            // Accept either IDs or names coming from dynamic add form
            let courseid = newRow.courseid || 0;
            let subjectid = newRow.subjectid ?? 0;
            const name = newRow.name || newRow.filename || "";
            const type = newRow.type || newRow.material_type || "";
            const description = newRow.description || "";
            const link = newRow.link || "";
            const sortorder = Number(newRow.sortorder || 9999);

            // If names provided (from dynamic form), map names to IDs
            const cmCourse = newRow.cm_course as string | undefined;
            const cmSubject = newRow.cm_subject as string | undefined;
            if (!courseid && cmCourse) {
              const course = courses.find(c => c.name === cmCourse);
              if (course) courseid = course.id;
              if (cmCourse === 'Fundamentals') courseid = 0;
            }
            if (subjectid === undefined && cmSubject) {
              const subject = subjects.find(s => s.name === cmSubject);
              if (subject) subjectid = subject.id as any;
              if (cmSubject === 'Basic Fundamentals') subjectid = 0 as any;
            }

            if (!courseid || !name || !type) {
              toast.error("Course, Material Name and Type are required");
              return;
            }

            const payload = { courseid: Number(courseid), subjectid: Number(subjectid || 0), name, description, type, link, sortorder };
            const res = await apiFetch("/course-materials", { method: "POST", body: payload });
            const created = Array.isArray(res) ? res : (res?.data ?? res);
            const updated = [created, ...materials].slice().sort((a: any, b: any) => b.id - a.id);
            setMaterials(updated);
            setFilteredMaterials(updated);
            toast.success("Course Material created", { position: 'top-center' });
          } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to create Course Material";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg), { position: 'top-center' });
          }
        }}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
      />
    </div>
  );
}