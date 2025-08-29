


"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon } from "lucide-react";
import axios from "axios";
import { toast, Toaster } from "sonner";

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
  const [courseSubjects, setCourseSubjects] = useState<any[]>([]);
  const [filteredCourseSubjects, setFilteredCourseSubjects] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showModal, setShowModal] = useState(false);
  const [newMapping, setNewMapping] = useState({ course_id: "", subject_id: "" });
  const [saving, setSaving] = useState(false);


  const fetchCourseSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/course-subjects`);

      const mappedData = res.data.map((cs: any) => ({
        ...cs,
        id: `${cs.course_id}-${cs.subject_id}`,
      }));

      setCourseSubjects(mappedData);
      setFilteredCourseSubjects(mappedData);
      toast.success("Fetched course-subject mappings successfully!");
    } catch (e: any) {
      const errorMsg = getErrorMessage(e);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseSubjects();
  }, []);

  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return setFilteredCourseSubjects(courseSubjects);

    const filtered = courseSubjects.filter((row) => {
      const courseIdStr = row.course_id?.toString() || "";
      const subjectIdStr = row.subject_id?.toString() || "";


      const parts = lower.split(/\s+/).filter(Boolean);
      if (parts.length === 2) {
        return (
          (parts[0] === courseIdStr && parts[1] === subjectIdStr) ||
          (parts[1] === courseIdStr && parts[0] === subjectIdStr)
        );
      }

      return (
        courseIdStr.includes(lower) ||
        subjectIdStr.includes(lower) ||
        `${courseIdStr}-${subjectIdStr}`.includes(lower) ||
        `${subjectIdStr}-${courseIdStr}`.includes(lower)
      );
    });

    setFilteredCourseSubjects(filtered);
  }, [searchTerm, courseSubjects]);

  useEffect(() => {
    if (courseSubjects.length > 0) {
      const defs: ColDef[] = Object.keys(courseSubjects[0]).map((key) => {
        const col: ColDef = {
          field: key,
          headerName: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          width: 180,
          editable: false,
        };

        if (key === "course_id") {
          col.headerName = "Course ID";
          col.pinned = "left";
          col.width = 200;
        }

        if (key === "subject_id") {
          col.headerName = "Subject ID";
          col.pinned = "left";
          col.width = 200;
        }
        return col;
      });

      setColumnDefs(defs);
    }
  }, [courseSubjects]);

  const handleRowDeleted = async (id: string) => {
    const [course_id, subject_id] = id.split("-");
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/course-subjects/${course_id}/${subject_id}`,

       );

      setFilteredCourseSubjects((prev) =>
        prev.filter(
          (r) => !(r.course_id === Number(course_id) && r.subject_id === Number(subject_id))
        )
      );

      setCourseSubjects((prev) =>
      prev.filter(
        (r) => !(r.course_id === Number(course_id) && r.subject_id === Number(subject_id))
      )
      );

      toast.success("Course-Subject deleted successfully!");
    } catch (e: any) {
      console.error("Delete failed", e.response?.data || e.message);
      const errorMsg = getErrorMessage(e);
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/course-subjects`, {
        course_id: updatedRow.course_id,
        subject_id: updatedRow.subject_id,
        lastmoddatetime: new Date().toISOString(),
      });

      setFilteredCourseSubjects((prev) =>
        prev.map((r) =>
          r.course_id === updatedRow.course_id && r.subject_id === updatedRow.subject_id
            ? response.data
            : r
        )
      );
      toast.success("Course-Subject updated successfully!");
    } catch (e: any) {
      const errorMsg = getErrorMessage(e);
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };


  const handleAddMapping = async () => {
    if (!newMapping.course_id || !newMapping.subject_id) {
      toast.error("Course ID and Subject ID are required!");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/course-subjects`, {
        course_id: Number(newMapping.course_id),
        subject_id: Number(newMapping.subject_id),
      });

      const newItem = { ...res.data, id: `${res.data.course_id}-${res.data.subject_id}` };

      setFilteredCourseSubjects((prev) => [...prev, newItem]);
      setCourseSubjects((prev) => [...prev, newItem]);

      toast.success("Mapping added successfully!");
      setShowModal(false);
      setNewMapping({ course_id: "", subject_id: "" });
    } catch (e: any) {
      const errorMsg = getErrorMessage(e);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Course-Subject Relationships</h1>
          <p>Manage mappings between courses and subjects.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Add Mapping</Button>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter course ID or subject ID..."
            className="pl-10"
          />
        </div>
      </div>

      <AGGridTable
        rowData={filteredCourseSubjects.slice((page - 1) * pageSize, page * pageSize)}
        columnDefs={columnDefs}
        title={`Course-Subject Mappings (${filteredCourseSubjects.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={(id) => handleRowDeleted(id)}
        showSearch={false}
      />

      <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 border rounded text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Add Course-Subject Mapping</h2>
            <div className="space-y-4">
              <div>
                <Label>Subject ID</Label>
                <Input
                  type="number"
                  value={newMapping.subject_id}
                  onChange={(e) =>
                    setNewMapping({ ...newMapping, subject_id: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Course ID</Label>
                <Input
                  type="number"
                  value={newMapping.course_id}
                  onChange={(e) =>
                    setNewMapping({ ...newMapping, course_id: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMapping}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster richColors position="top-center" />
    </div>
  );
}
