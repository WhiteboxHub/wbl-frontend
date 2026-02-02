"use client";

import { useMemo, useState, useEffect } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Plus, Search, Users, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";

export default function OutreachContactPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        source_type: "CAMPAIGN",
        status: "active",
        unsubscribe_flag: false,
        bounce_flag: false,
        complaint_flag: false
    });

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/outreach-contact");
            setContacts(response.data);
        } catch (error) {
            console.error("Error fetching contacts:", error);
            toast.error("Failed to load contacts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleRowUpdated = async (updatedRow: any) => {
        try {
            const { id, created_at, updated_at, email_lc, ...payload } = updatedRow;
            await api.put(`/outreach-contact/${id}`, payload);
            toast.success("Contact updated successfully");
            fetchContacts();
        } catch (error) {
            console.error("Error updating contact:", error);
            toast.error("Failed to update contact");
        }
    };

    const handleRowDeleted = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/outreach-contact/${id}`);
            toast.success("Contact deleted");
            fetchContacts();
        } catch (error) {
            toast.error("Failed to delete contact");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/outreach-contact", formData);
            toast.success("Contact created");
            setIsModalOpen(false);
            setFormData({
                email: "",
                source_type: "CAMPAIGN",
                status: "active",
                unsubscribe_flag: false,
                bounce_flag: false,
                complaint_flag: false
            });
            fetchContacts();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to create contact");
        }
    };

    const columnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", width: 80 },
        { field: "email", headerName: "Email", flex: 1, editable: true },
        { field: "source_type", headerName: "Source", width: 120, editable: true },
        { field: "status", headerName: "Status", width: 120, editable: true },
        {
            field: "unsubscribe_flag",
            headerName: "Unsub",
            width: 100,
            editable: true,
            cellRenderer: (p: any) => p.value ? "✅" : "❌"
        },
        {
            field: "bounce_flag",
            headerName: "Bounce",
            width: 100,
            editable: true,
            cellRenderer: (p: any) => p.value ? "✅" : "❌"
        },
        {
            headerName: "Actions",
            width: 100,
            cellRenderer: (params: any) => (
                <button onClick={() => handleRowDeleted(params.data.id)} className="p-2 text-red-600">
                    <Trash2 size={18} />
                </button>
            )
        }
    ], []);

    const filtered = contacts.filter(c => c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 space-y-6">
            <Toaster richColors position="top-center" />
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2"><Users /> Outreach Contacts</h1>
                <Button onClick={() => setIsModalOpen(true)}>Add Contact</Button>
            </div>

            <AGGridTable
                title="Outreach Contacts"
                rowData={filtered}
                columnDefs={columnDefs}
                onRowUpdated={handleRowUpdated}
                loading={loading}
            />

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Outreach Contact</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <Input placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Save</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
