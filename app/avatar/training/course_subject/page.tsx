"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon, PlusIcon } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin_ui/dialog";
import { toast, Toaster } from "sonner";

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
  if (e?.response?.data?.detail) {
    const detail = e.response.data.detail;
    if (typeof detail === "string") return detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return "Unexpected error format";
    }
  }
  if (e?.message) return e.message;
  return "Unknown error occurred";
}

export default function CourseSubjectPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSubjects, setCourseSubjects] = useState<CourseSubject[]>([]);
  const [filteredCourseSubjects, setFilteredCourseSubjects] = useState<
    CourseSubject[]
  >([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newMapping, setNewMapping] = useState<NewMapping>({
    course_id: "",
    subject_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const token = localStorage.getItem("token"); // get token once

  const fetchCourseSubjects = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/course-subjects`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // pass token in headers
          },
        }
      );

      const dataWithId = res.data.map((item: CourseSubject) => ({
        ...item,
        id: `${item.course_id}-${item.subject_id}`,
      }));

      setCourseSubjects(dataWithId);
      setFilteredCourseSubjects(dataWithId);
      toast.success("Course-subject mappings loaded successfully!");
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
      const token = localStorage.getItem("token"); // ✅ get token
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        {
          headers: { Authorization: `Bearer ${token}` }, // ✅ pass token
        }
      );

      const sortedCourses = res.data.sort(
        (a: Course, b: Course) => b.id - a.id
      );
      setCourses(sortedCourses);
    } catch (e: any) {
      console.error("Failed to fetch courses:", e);
      toast.error("Failed to load courses");
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token"); // ✅ get token
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/subjects`,
        {
          headers: { Authorization: `Bearer ${token}` }, // ✅ pass token
        }
      );

      const sortedSubjects = res.data.sort(
        (a: Subject, b: Subject) => b.id - a.id
      );
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
  }, []);

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
      {
        field: "course_name",
        headerName: "Course",
        width: 300,
        editable: false,
      },
      {
        field: "subject_name",
        headerName: "Subject",
        width: 400,
        editable: false,
      },
    ]);
  }, []);

  const handleRowDeleted = async (compositeId: string) => {
    try {
      const [courseId, subjectId] = compositeId.split("-");
      if (!courseId || !subjectId) {
        toast.error("Invalid record ID format");
        return;
      }

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/course-subjects/${courseId}/${subjectId}`
      );

      setCourseSubjects((prev) => prev.filter((r) => r.id !== compositeId));
      setFilteredCourseSubjects((prev) =>
        prev.filter((r) => r.id !== compositeId)
      );

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

    const selectedCourse = courses.find(
      (course) => course.name === selectedCourseName
    );
    const selectedSubject = subjects.find(
      (subject) => subject.name === selectedSubjectName
    );

    if (!selectedCourse || !selectedSubject) {
      toast.error("Invalid selection. Please try again.");
      return;
    }

    const courseId = selectedCourse.id;
    const subjectId = selectedSubject.id;

    const exists = courseSubjects.some(
      (item) => item.course_id === courseId && item.subject_id === subjectId
    );

    if (exists) {
      toast.error("This course-subject mapping already exists!");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-subjects`,
        {
          course_id: courseId,
          subject_id: subjectId,
        }
      );

      const newRecordWithId = {
        ...res.data,
        id: `${res.data.course_id}-${res.data.subject_id}`,
      };

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
      <Toaster richColors position="top-center" />
      {/* Header + Search Section (Responsive) */}
      <div className="flex flex-col gap-4 sm:flex-col md:flex-row md:items-center md:justify-between">
        {/* Left: Title and Description */}
        <div>
          <h1 className="text-2xl font-bold">Course-Subject Relationships</h1>
          <p>
            Manage mappings between courses and subjects. Total mappings:{" "}
            {courseSubjects.length}
          </p>
        </div>

        {/* Right: Search + Add Button (Responsive) */}
        <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter course or subject name or id..."
              className="w-full pl-10"
            />
          </div>

          {/* Add Mapping Button */}
          <Button
            className="w-full sm:w-auto"
            size="sm"
            onClick={() => setShowModal(true)}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Mapping
          </Button>
        </div>
      </div>

      <AGGridTable
        rowData={filteredCourseSubjects}
        columnDefs={columnDefs}
        title={`Course-Subject Mappings (${filteredCourseSubjects.length} results)`}
        height="calc(70vh - 100px)"
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm p-4">
          <DialogHeader>
            <DialogTitle>Add Course-Subject Mapping</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course" className="text-sm font-medium">
                Course <span className="text-red-500">*</span>
              </Label>
              <select
                id="course"
                value={selectedCourseName}
                onChange={(e) => setSelectedCourseName(e.target.value)}
                className="w-full rounded-md border p-2"
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

            <div>
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject <span className="text-red-500">*</span>
              </Label>
              <select
                id="subject"
                value={selectedSubjectName}
                onChange={(e) => setSelectedSubjectName(e.target.value)}
                className="w-full rounded-md border p-2"
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setSelectedCourseName("");
                setSelectedSubjectName("");
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMapping}
              disabled={saving || !selectedCourseName || !selectedSubjectName}
            >
              {saving ? "Adding..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
