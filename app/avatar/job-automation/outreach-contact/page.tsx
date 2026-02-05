"use client";

import { useMemo, useState, useEffect } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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

    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);
            if (dateFrom) params.append("date_from", dateFrom);
            if (dateTo) params.append("date_to", dateTo);

            const queryString = params.toString();
            const endpoint = queryString ? `/outreach-contact?${queryString}` : "/outreach-contact";
            const response = await api.get(endpoint);
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
    }, [searchTerm, dateFrom, dateTo]);

    const handleRowUpdated = async (updatedRow: any) => {
        try {
            const { id, created_at, email_lc, ...payload } = updatedRow;
            await api.put(`/outreach-contact/${id}`, payload);
            toast.success("Contact updated successfully");
            fetchContacts();
        } catch (error) {
            console.error("Error updating contact:", error);
            toast.error("Failed to update contact");
        }
    };

    const handleRowDeleted = async (id: number) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await api.delete(`/outreach-contact/${deleteConfirmId}`);
            toast.success("Contact deleted");
            fetchContacts();
        } catch (error) {
            toast.error("Failed to delete contact");
        } finally {
            setDeleteConfirmId(null);
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
        {
            field: "source_type",
            headerName: "Source",
            width: 120,
            editable: true
        },
        {
            field: "status",
            headerName: "Status",
            width: 120,
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['active', 'unsubscribed', 'bounced', 'complaint']
            }
        },
        {
            field: "unsubscribe_flag",
            headerName: "Unsub",
            width: 90,
            editable: true,
            cellRenderer: (p: any) => p.value ? "true" : "false"
        },
        {
            field: "bounce_flag",
            headerName: "Bounce",
            width: 90,
            editable: true,
            cellRenderer: (p: any) => p.value ? "true" : "false"
        },
        {
            field: "complaint_flag",
            headerName: "Spam",
            width: 90,
            editable: true,
            cellRenderer: (p: any) => p.value ? "true" : "false"
        },
        {
            field: "unsubscribe_reason",
            headerName: "Unsub Reason",
            width: 150,
            editable: true
        },
        {
            field: "created_at",
            headerName: "Created At",
            width: 180,
            valueFormatter: (params: any) => {
                if (!params.value) return "";
                return new Date(params.value).toLocaleString();
            },
        },
        {
            field: "updated_at",
            headerName: "Last Modified",
            width: 180,
            valueFormatter: (params: any) => {
                if (!params.value) return "";
                return new Date(params.value).toLocaleString();
            },
        },
    ], []);

    return (
        <div className="p-6 space-y-6">
            <Toaster richColors position="top-center" />
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <Users className="text-blue-600 w-7 h-7" />
                        Outreach Contacts
                    </h1>

                    <div className="flex gap-4 mt-4">
                        {/* Search by Email */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64"
                            />
                        </div>

                        {/* Date From */}
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-600">From:</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-40"
                            />
                        </div>

                        {/* Date To */}
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-600">To:</Label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-40"
                            />
                        </div>

                        {/* Quick Filters */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    setDateFrom(today);
                                    setDateTo(today);
                                }}
                            >
                                Today
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const today = new Date();
                                    const weekAgo = new Date(today);
                                    weekAgo.setDate(today.getDate() - 7);
                                    setDateFrom(weekAgo.toISOString().split('T')[0]);
                                    setDateTo(today.toISOString().split('T')[0]);
                                }}
                            >
                                This Week
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setDateFrom("");
                                    setDateTo("");
                                    setSearchTerm("");
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <AGGridTable
                title={`Outreach Contacts (${contacts.length})`}
                rowData={contacts}
                columnDefs={columnDefs}
                onRowUpdated={handleRowUpdated}
                onRowDeleted={handleRowDeleted}
                loading={loading}
                showAddButton={true}
                onAddClick={() => setIsModalOpen(true)}
            />

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Outreach Contact</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="source">Source Type</Label>
                                <Input
                                    id="source"
                                    placeholder="e.g. CAMPAIGN"
                                    value={formData.source_type}
                                    onChange={e => setFormData({ ...formData, source_type: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    className="w-full p-2 border rounded-md"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="unsubscribed">Unsubscribed</option>
                                    <option value="bounced">Bounced</option>
                                    <option value="complaint">Complaint</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1">Save Contact</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDelete}
                title="Delete Contact"
                message="Are you sure you want to delete this outreach contact?"
                confirmText="Delete"
            />
        </div>
    );
}
