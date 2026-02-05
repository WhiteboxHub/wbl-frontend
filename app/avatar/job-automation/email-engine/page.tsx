"use client";

import { useMemo, useState, useEffect } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";

import { Badge } from "@/components/admin_ui/badge";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import {
    Plus,
    Search,
    Mail,
    Trash2,
    Save,
    Settings,
    ShieldCheck,
    Server
} from "lucide-react";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";

export default function EmailEnginePage() {
    const [engines, setEngines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        engine_name: "",
        provider: "smtp",
        is_active: true,
        priority: 1,
        credentials_json: "{}"
    });

    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const fetchEngines = async () => {

        try {
            setLoading(true);
            const response = await api.get("/email-engine");
            setEngines(response.data);
        } catch (error) {
            console.error("Error fetching email engines:", error);
            toast.error("Failed to load email engines");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEngines();
    }, []);

    const handleRowUpdated = async (updatedRow: any) => {
        try {
            await api.put(`/email-engine/${updatedRow.id}`, updatedRow);
            toast.success("Email engine updated successfully");
            fetchEngines();
        } catch (error) {
            console.error("Error updating email engine:", error);
            toast.error("Failed to update email engine");
        }
    };

    const handleRowDeleted = async (id: number) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await api.delete(`/email-engine/${deleteConfirmId}`);
            toast.success("Email engine deleted successfully");
            fetchEngines();
        } catch (error) {
            console.error("Error deleting email engine:", error);
            toast.error("Failed to delete email engine");
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/email-engine", formData);
            toast.success("Email engine created successfully");
            setIsModalOpen(false);
            setFormData({
                engine_name: "",
                provider: "smtp",
                is_active: true,
                priority: 1,
                credentials_json: "{}"
            });
            fetchEngines();
        } catch (error: any) {
            console.error("Error creating email engine:", error);
            toast.error(error.response?.data?.detail || "Failed to create email engine");
        }
    };

    const columnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", width: 80, pinned: "left" },
        { field: "engine_name", headerName: "Engine Name", flex: 1, editable: true },
        {
            field: "provider",
            headerName: "Provider",
            width: 130,
            editable: true,
            cellEditor: "agSelectCellEditor",
            cellEditorParams: {
                values: ["smtp", "aws_ses", "sendgrid", "mailgun"]
            }
        },
        {
            field: "priority",
            headerName: "Priority",
            width: 100,
            editable: true,
            cellEditor: "agNumberCellEditor"
        },
        {
            field: "is_active",
            headerName: "Status",
            width: 120,
            editable: true,
            cellRenderer: (params: any) => (
                <Badge className={params.value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {params.value ? "ACTIVE" : "DISABLED"}
                </Badge>
            ),
            cellEditor: "agCheckboxCellEditor"
        },
        {
            field: "credentials_json",
            headerName: "Credentials (JSON)",
            flex: 1.5,
            editable: true,
            cellEditor: "agLargeTextCellEditor"
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
            headerName: "Updated At",
            width: 180,
            valueFormatter: (params: any) => {
                if (!params.value) return "";
                return new Date(params.value).toLocaleString();
            },
        },
    ], []);

    const filteredEngines = engines.filter(e =>
        e.engine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.provider.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <Toaster richColors position="top-center" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Server className="text-blue-600" />
                        Email Sender Engines
                    </h1>
                    <div className="max-w-md">
                        <div className="relative mt-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search engines..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-96"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                    <AGGridTable
                        title={`Email Engines (${filteredEngines.length})`}
                        rowData={filteredEngines}
                        columnDefs={columnDefs}
                        height="calc(100vh - 250px)"
                        onRowUpdated={handleRowUpdated}
                        onRowDeleted={handleRowDeleted}
                        loading={loading}
                        showAddButton={true}
                        onAddClick={() => setIsModalOpen(true)}
                    />
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Plus className="text-blue-600" />
                                Add New Email Engine
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Engine Name</Label>
                                <Input
                                    required
                                    placeholder="e.g. AWS-SES-Primary"
                                    value={formData.engine_name}
                                    onChange={e => setFormData({ ...formData, engine_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Provider</Label>
                                    <select
                                        className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.provider}
                                        onChange={e => setFormData({ ...formData, provider: e.target.value })}
                                    >
                                        <option value="smtp">SMTP</option>
                                        <option value="aws_ses">AWS SES</option>
                                        <option value="sendgrid">SendGrid</option>
                                        <option value="mailgun">Mailgun</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                    />
                                    <p className="text-[10px] text-gray-400">Lower = Higher priority</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Credentials JSON</Label>
                                <textarea
                                    className="w-full h-32 px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    required
                                    placeholder='{"api_key": "...", "region": "..."}'
                                    value={formData.credentials_json}
                                    onChange={e => setFormData({ ...formData, credentials_json: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <Label htmlFor="is_active">Active and enabled</Label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Create Engine</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDelete}
                title="Delete Email Engine"
                message="Are you sure you want to delete this email engine?"
                confirmText="Delete"
            />
        </div>
    );
}
