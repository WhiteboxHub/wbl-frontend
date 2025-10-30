"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon, PlusIcon,X } from "lucide-react";
import { toast, Toaster } from "sonner";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin_ui/dialog";
import { apiFetch } from "@/lib/api.js";

interface CourseSubject {
  subject_id: number;
  course_id: number;
  course_name: string;
  subject_name: string;
  id?: string;
}

interface NewMapping {
  course_id: string;
  subject_id: string;
}

interface Course {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

function getErrorMessage(e: any): string {
  if (typeof e === "string") return e;
  if (e?.body) {
    try {
      return typeof e.body === "string" ? e.body : JSON.stringify(e.body);
    } catch {
      return "Unexpected error format";
    }
  }
  if (e?.response?.data?.detail) {
    const detail = e.response.data.detail;
    return typeof detail === "string" ? detail : JSON.stringify(detail);
  }
  if (e?.message) return e.message;
  return "Unknown error occurred";
}

export default function CourseSubjectPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSubjects, setCourseSubjects] = useState<CourseSubject[]>([]);
  const [filteredCourseSubjects, setFilteredCourseSubjects] = useState<CourseSubject[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newMapping, setNewMapping] = useState<NewMapping>({ course_id: "", subject_id: "" });
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [refreshing, setRefreshing] = useState(false);


  const fetchCourseSubjects = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiFetch("/course-subjects");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const dataWithId = (arr || []).map((item: any) => ({

        ...item,
        id: `${item.course_id}-${item.subject_id}`,
      }));
      setCourseSubjects(dataWithId);
      setFilteredCourseSubjects(dataWithId);
    } catch (e: any) {
      const errorMsg = getErrorMessage(e);
      setError(errorMsg);
      toast.error(`Failed to load data: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {

      const res = await apiFetch("/courses");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedCourses = (arr || []).slice().sort((a: Course, b: Course) => b.id - a.id);

      setCourses(sortedCourses);
    } catch (e: any) {
      console.error("Failed to fetch courses:", e);
      toast.error("Failed to load courses");
    }
  };

  // Add this useEffect after your existing useEffects
useEffect(() => {
  const handleEscKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowModal(false);
      setSelectedCourseName("");
      setSelectedSubjectName("");
    }
  };

  if (showModal) {
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }
}, [showModal]);

  const fetchSubjects = async () => {
    try {
      const res = await apiFetch("/subjects");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedSubjects = (arr || []).slice().sort((a: Subject, b: Subject) => b.id - a.id);

      setSubjects(sortedSubjects);
    } catch (e: any) {
      console.error("Failed to fetch subjects:", e);
      toast.error("Failed to load subjects");
    }
  };

  useEffect(() => {
    fetchCourseSubjects();
    fetchCourses();
    fetchSubjects();
  }, [refreshing]);

  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) {
      setFilteredCourseSubjects(courseSubjects);
      return;
    }

    const parts = lower.split(/\s+/).filter(Boolean);

    const filtered = courseSubjects.filter((row) => {
      const courseIdStr = row.course_id?.toString() || "";
      const subjectIdStr = row.subject_id?.toString() || "";
      const courseNameStr = row.course_name?.toLowerCase() || "";
      const subjectNameStr = row.subject_name?.toLowerCase() || "";

      const haystack = `${courseIdStr} ${subjectIdStr} ${courseNameStr} ${subjectNameStr} ${courseIdStr}-${subjectIdStr} ${subjectIdStr}-${courseIdStr}`;

      if (parts.length === 2 && parts.every((p) => /^\d+$/.test(p))) {
        return (
          (parts[0] === courseIdStr && parts[1] === subjectIdStr) ||
          (parts[1] === courseIdStr && parts[0] === subjectIdStr)
        );
      }

      return parts.every((word) => haystack.includes(word));
    });

    setFilteredCourseSubjects(filtered);
  }, [searchTerm, courseSubjects]);

  useEffect(() => {
    setColumnDefs([
      { field: "course_id", headerName: "Course ID", hide: true },
      { field: "subject_id", headerName: "Subject ID", hide: true },
      { field: "course_name", headerName: "Course", width: 300, editable: false },
      { field: "subject_name", headerName: "Subject", width: 400, editable: false },
    ]);
  }, []);

  const handleRowDeleted = async (compositeId: string) => {
    try {
      const [courseId, subjectId] = compositeId.split("-");
      if (!courseId || !subjectId) {
        toast.error("Invalid record ID format");
        return;
      }

      await apiFetch(`/course-subjects/${courseId}/${subjectId}`, { method: "DELETE" });

      setCourseSubjects((prev) => prev.filter((r) => r.id !== compositeId));
      setFilteredCourseSubjects((prev) => prev.filter((r) => r.id !== compositeId));
      toast.success("Course-subject mapping deleted successfully!");
    } catch (e: any) {
      const errorMsg = getErrorMessage(e);
      setError(errorMsg);
      toast.error(`Delete failed: ${errorMsg}`);
    }
  };

  const handleAddMapping = async () => {
    if (!selectedCourseName || !selectedSubjectName) {
      toast.error("Please select both a course and a subject!");
      return;
    }

    const selectedCourse = courses.find((course) => course.name === selectedCourseName);
    const selectedSubject = subjects.find((subject) => subject.name === selectedSubjectName);

    if (!selectedCourse || !selectedSubject) {
      toast.error("Invalid selection. Please try again.");
      return;
    }

    const courseId = selectedCourse.id;
    const subjectId = selectedSubject.id;

    const exists = courseSubjects.some((item) => item.course_id === courseId && item.subject_id === subjectId);
    if (exists) {
      toast.error("This course-subject mapping already exists!");
      return;
    }

    try {
      setSaving(true);
      const res = await apiFetch("/course-subjects", { method: "POST", body: { course_id: courseId, subject_id: subjectId } });
      const created = res && !Array.isArray(res) ? (res.data ?? res) : res;

      const newRecordWithId = { ...created, id: `${created.course_id}-${created.subject_id}` };
      const updated = [newRecordWithId, ...courseSubjects];
      setCourseSubjects(updated);
      setFilteredCourseSubjects(updated);
      toast.success("Course-subject mapping added successfully!");
      setShowModal(false);
      setSelectedCourseName("");
      setSelectedSubjectName("");
      setNewMapping({ course_id: "", subject_id: "" });
    } catch (e: any) {
      const errorMsg = getErrorMessage(e);
      toast.error(`Failed to add mapping: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && courseSubjects.length === 0) {
    return (
      <div className="mt-8 space-y-4 text-center">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <Toaster position="top-center" />
      {/* Header + Search Section (Updated for left-side search on large screens) */}
      <div className="flex flex-col gap-4 sm:flex-col md:flex-row md:items-center md:justify-between">
        {/* Left: Title, Description + Search Box */}
        <div className="flex-1">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Course-Subject Relationships</h1>
            <p>
              Manage mappings between courses and subjects. Total mappings:{" "}
              {courseSubjects.length}
            </p>
          </div>
          
          {/* Search Box - Now on LEFT side under title */}
          <div className="max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter course or subject name or id..."
                className="w-full pl-10"
              />
            </div>
          </div>
        </div>

          <Button className="w-full sm:w-auto" size="sm" onClick={() => setShowModal(true)}>

            <PlusIcon className="mr-2 h-4 w-4" />
            Add Mapping
          </Button>
      </div>

      {/* Add Mapping Modal - Updated with same colors */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-5 border-b border-blue-200 flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Add Course-Subject Mapping
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedCourseName("");
                  setSelectedSubjectName("");
                }}
                className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 p-1 rounded-lg transition"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-3 sm:p-4 md:p-6 bg-white">
              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 md:gap-5">
                
                {/* Course */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Course <span className="text-red-700">*</span>
                  </label>
                  <select
                    value={selectedCourseName}
                    onChange={(e) => setSelectedCourseName(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                  >
                    <option value="" disabled hidden>
                      Select course
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.name}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-blue-700">
                    Subject <span className="text-red-700">*</span>
                  </label>
                  <select
                    value={selectedSubjectName}
                    onChange={(e) => setSelectedSubjectName(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white hover:border-blue-300 transition shadow-sm"
                  >
                    <option value="" disabled hidden>
                      Select subject
                    </option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 sm:gap-3 mt-3 sm:mt-4 md:mt-6 pt-2 sm:pt-3 md:pt-4 border-t border-blue-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCourseName("");
                    setSelectedSubjectName("");
                  }}
                  disabled={saving}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMapping}
                  disabled={saving || !selectedCourseName || !selectedSubjectName}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition shadow-md disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AGGridTable
        rowData={filteredCourseSubjects}
        columnDefs={columnDefs}
        title={`Course-Subject (${filteredCourseSubjects.length} results)`}
        height="calc(70vh - 100px)"
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}