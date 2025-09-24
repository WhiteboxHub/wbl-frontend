

"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin_ui/dialog";
import { SearchIcon } from "lucide-react";
import axios from "axios";
import { toast, Toaster } from "sonner";


export default function CoursePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    alias: "",
    description: "",
    syllabus: "",
  });


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
  const token = localStorage.getItem("token"); // get token once

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // pass token in headers
          },
        }
      );

      const sortedCourses = res.data.sort((a: any, b: any) => b.id - a.id);

      setCourses(sortedCourses);
      setFilteredCourses(sortedCourses);
      toast.success("Fetched courses successfully.");
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message);
      toast.error(e.response?.data?.detail || e.message);
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
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${updatedRow.id}`,
        updatedRow
      );

      const updated = courses
        .map((c) => (c.id === updatedRow.id ? updatedRow : c))
        .sort((a, b) => b.id - a.id);

      setCourses(updated);
      setFilteredCourses(updated);
      toast.success("Row updated successfully.");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message);
    }
  };

  // Delete 
  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`);
      const updated = courses.filter((c) => c.id !== id);
      setCourses(updated);
      setFilteredCourses(updated);
      toast.success(`Course ${id} deleted.`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message);
    }
  };

  // Add course
  const handleAddCourse = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        newCourse
      );

      const updated = [...courses, res.data].sort((a, b) => b.id - a.id);
      setCourses(updated);
      setFilteredCourses(updated);
      toast.success("New course created.");
      setIsModalOpen(false);
      setNewCourse({ name: "", alias: "", description: "", syllabus: "" });
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p>Manage all courses here.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Course</Button>
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
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />

      {/* Add Course */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newCourse.name}
                onChange={(e) =>
                  setNewCourse((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="alias">Alias</Label>
              <Input
                id="alias"
                value={newCourse.alias}
                onChange={(e) =>
                  setNewCourse((prev) => ({ ...prev, alias: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                className="w-full min-h-[120px] p-2 border rounded-md"
                value={newCourse.description}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="syllabus">Syllabus</Label>
              <Input
                id="syllabus"
                className="w-full min-h-[150px] p-2 border rounded-md"
                value={newCourse.syllabus}
                onChange={(e) =>
                  setNewCourse((prev) => ({ ...prev, syllabus: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCourse}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


