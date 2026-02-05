"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

export default function CoursePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoader = useMinimumLoadingTime(loading);
  const [error, setError] = useState("");

  const columnDefs: ColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      pinned: "left",
      editable: false,
    },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      editable: true,
    },
    {
      field: "alias",
      headerName: "Alias",
      width: 150,
      editable: true,
    },
    {
      field: "description",
      headerName: "Description",
      width: 410,
      editable: true,
    },
    {
      field: "syllabus",
      headerName: "Syllabus",
      width: 410,
      editable: true,
    },
  ];

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch("/courses");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sortedCourses = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);
      setCourses(sortedCourses);
      setFilteredCourses(sortedCourses);
      toast.success("Fetched courses successfully.");
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to fetch courses";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Search filter
  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return setFilteredCourses(courses);

    const filtered = courses.filter((row) => {
      const idMatch = row.id?.toString().includes(lower);
      const nameMatch = row.name?.toLowerCase().includes(lower);
      const aliasMatch = row.alias?.toLowerCase().includes(lower);
      const descMatch = row.description?.toLowerCase().includes(lower);
      const syllabusMatch = row.syllabus?.toLowerCase().includes(lower);

      return idMatch || nameMatch || aliasMatch || descMatch || syllabusMatch;
    });

    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  // Update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await apiFetch(`/courses/${updatedRow.id}`, {
        method: "PUT",
        body: updatedRow,
      });

      const updated = courses
        .map((c) => (c.id === updatedRow.id ? updatedRow : c))
        .slice()
        .sort((a, b) => b.id - a.id);

      setCourses(updated);
      setFilteredCourses(updated);
      toast.success("Row updated successfully.");
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to update course";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  // Delete
  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/courses/${id}`, { method: "DELETE" });
      const updated = courses.filter((c) => c.id !== id);
      setCourses(updated);
      setFilteredCourses(updated);
      toast.success(`Course ${id} deleted.`);
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to delete course";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  if (showLoader) return <Loader />;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p>Manage all courses here.</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Id, name, alias, or description..."
            className="pl-10"
          />
        </div>
      </div>

      <AGGridTable
        rowData={filteredCourses}
        columnDefs={columnDefs}
        title={`Courses (${filteredCourses.length})`}
        height="calc(70vh)"
        onRowAdded={async (newRow: any) => {
          try {
            const payload = {
              name: newRow.name || "",
              alias: newRow.alias || "",
              description: newRow.description || "",
              syllabus: newRow.syllabus || "",
            };
            if (!payload.name) { toast.error("Name is required"); return; }
            const res = await apiFetch("/courses", { method: "POST", body: payload });
            const created = Array.isArray(res) ? res : (res?.data ?? res);
            const updated = [created, ...courses].slice().sort((a: any, b: any) => b.id - a.id);
            setCourses(updated);
            setFilteredCourses(updated);
            toast.success("Course created");
          } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to create course";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
          }
        }}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}