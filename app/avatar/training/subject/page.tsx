


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

export default function SubjectPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // const [page, setPage] = useState(1);
  // const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    description: "",
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/subjects`
      );

      const sortedSubjects = res.data.sort((a: any, b: any) => b.id - a.id);

      setSubjects(sortedSubjects);
      setFilteredSubjects(sortedSubjects);
      toast.success("Subjects loaded successfully.");
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message);
      toast.error(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Search filter
  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return setFilteredSubjects(subjects);

    const filtered = subjects.filter((row) => {
      const idMatch = row.id?.toString().includes(lower);
      const nameMatch = row.name?.toLowerCase().includes(lower);
      const descMatch = row.description?.toLowerCase().includes(lower);

      return idMatch || nameMatch || descMatch;
    });

    setFilteredSubjects(filtered);
  }, [searchTerm, subjects]);


  useEffect(() => {
    setColumnDefs([
      { field: "id", headerName: "ID", width: 150, editable: false },
      { field: "name", headerName: "Name", width: 300, editable: true },
      { field: "description", headerName: "Description", width: 400, editable: true },
    ]);
  }, []);

  // Update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/subjects/${updatedRow.id}`,
        updatedRow
      );
      setFilteredSubjects((prev) =>
        prev.map((r) => (r.id === updatedRow.id ? updatedRow : r))
      );
      toast.success("Subject updated successfully.");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message);
    }
  };

  // Delete
  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/subjects/${id}`);
      setFilteredSubjects((prev) => prev.filter((row) => row.id !== id));
      toast.success(`Subject ${id} deleted.`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message);
    }
  };

  // Add
  const handleAddSubject = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/subjects`,
        newSubject
      );

      const updated = [...subjects, res.data].sort((a, b) => b.id - a.id);

      setSubjects(updated);
      setFilteredSubjects(updated);
      toast.success("New subject created.");
      setIsModalOpen(false);
      setNewSubject({ name: "", description: "" });
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
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p>Manage all subjects here.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Subject</Button>
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
            placeholder="Search by Id, name, or description..."
            className="pl-10"
          />
        </div>
      </div>

      <AGGridTable
        rowData={filteredSubjects}
        columnDefs={columnDefs}
        title={`Subjects (${filteredSubjects.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />

      {/* Pagination */}
      {/* <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
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
      </div> */}

      {/* Add Subject */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                maxLength={100}
                className="w-[400px]"
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                maxLength={300}
                className="w-full min-h-[120px] p-2 border rounded-md"
                value={newSubject.description}
                onChange={(e) =>
                  setNewSubject((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubject}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
