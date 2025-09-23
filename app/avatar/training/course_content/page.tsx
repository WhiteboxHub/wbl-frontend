"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast,Toaster } from "sonner";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/admin_ui/dialog";


export default function CourseContentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contents, setContents] = useState<any[]>([]);
  const [filteredContents, setFilteredContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContent, setNewContent] = useState({
    Fundamentals: "",
    AIML: "",
    UI: "",
    QE: "",
  });

  const fetchContents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/course-contents`
      );

      const sortedContents = res.data.sort((a: any, b: any) => b.id - a.id);

      setContents(sortedContents);
      setFilteredContents(sortedContents);
      toast.success("Course Content fetched successfully", { position: "top-center" });
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
      toast.error("Failed to fetch Course Content", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // search 
  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return setFilteredContents(contents);

    const filtered = contents.filter(
      (row) =>
        row.id?.toString().includes(lower) ||
        row.Fundamentals?.toLowerCase().includes(lower) ||
        row.AIML?.toLowerCase().includes(lower) ||
        row.UI?.toLowerCase().includes(lower) ||
        row.QE?.toLowerCase().includes(lower)
    );
    setFilteredContents(filtered);
  }, [searchTerm, contents]);


  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
      { field: "id", headerName: "ID", width: 120, pinned: "left", editable: false },
      { field: "Fundamentals", headerName: "Fundamentals", width: 300, editable: true },
      { field: "AIML", headerName: "AIML", width: 300, editable: true },
      { field: "UI", headerName: "UI", width: 300, editable: true },
      { field: "QE", headerName: "QE", width: 300, editable: true },
    ], []);


  // Add 
  const handleAddContent = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/course-contents`, newContent);

      const updated = [...contents, res.data].sort((a, b) => b.id - a.id);

      setContents(updated);
      setFilteredContents(updated);
      toast.success("Course Content added successfully", { position: "top-center" });
      setIsModalOpen(false);
      setNewContent({ Fundamentals: "", AIML: "", UI: "", QE: "" });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to add Course Content", { position: "top-center" });
    }
  };

  // update 
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-contents/${updatedRow.id}`,
        updatedRow
      );
      setFilteredContents((prev) =>
        prev.map((r) => (r.id === updatedRow.id ? updatedRow : r))
      );
      toast.success("Course Content updated successfully", { position: "top-center" });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update Course Content", { position: "top-center" });
    }
  };

  // delete 
  const handleRowDeleted = async (id: number) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/course-contents/${id}`
      );
      setFilteredContents((prev) => prev.filter((row) => row.id !== id));
      toast.success(`Course Content ${id} deleted`, { position: "top-center" });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete Course Content", { position: "top-center" });
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Course Contents</h1>
        <p>Manage course contents for Fundamentals, AIML, UI, QE.</p>
      </div>
      <Button onClick={() => setIsModalOpen(true)}>+ Add CourseContent</Button>
      </div>
      
      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID or content field..."
            className="pl-10"
          />
        </div>
      </div>

       {/* Add Course Content */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Course Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="Fundamentals">Fundamentals</Label>
            <Input
              id="Fundamentals"
              value={newContent.Fundamentals}
              maxLength={255}
              onChange={(e) =>
                setNewContent((prev) => ({ ...prev, Fundamentals: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="AIML">AIML (Required)</Label>
            <Input
              id="AIML"
              value={newContent.AIML}
              required
              maxLength={255}
              onChange={(e) =>
                setNewContent((prev) => ({ ...prev, AIML: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="UI">UI</Label>
            <Input
              id="UI"
              value={newContent.UI}
              maxLength={255}
              onChange={(e) =>
                setNewContent((prev) => ({ ...prev, UI: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="QE">QE</Label>
            <Input
              id="QE"
              value={newContent.QE}
              maxLength={255}
              onChange={(e) =>
                setNewContent((prev) => ({ ...prev, QE: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddContent}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>


      <AGGridTable
        rowData={filteredContents}
        columnDefs={columnDefs}
        title={`Course Contents (${filteredContents.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />

    </div>
  );
}
