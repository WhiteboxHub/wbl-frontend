"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import "@/styles/admin.css";
import "@/styles/App.css";
import { isTokenExpired } from "@/utils/auth";
import { apiFetch } from "@/lib/api";

import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, User, Phone, Mail, BookOpen, Clock, Globe, MapPin } from "lucide-react";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

interface LeadSuggestion {
    id: number;
    name: string;
    email: string;
}

interface LeadData {
    id: number;
    full_name?: string | null;
    email: string;
    phone?: string | null;
    workstatus?: string | null;
    status?: string | null;
    secondary_email?: string | null;
    secondary_phone?: string | null;
    address?: string | null;
    entry_date?: string | Date | null;
    closed_date?: string | Date | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    moved_to_candidate?: boolean;
    notes?: string | null;
    massemail_unsubscribe?: boolean;
    massemail_email_sent?: boolean;
}

const StatusRenderer = ({ status }: { status: string }) => {
    const statusStr = status?.toString().toLowerCase() ?? "";
    const colorMap: Record<string, string> = {
        open: "bg-blue-100 text-blue-800",
        closed: "bg-green-100 text-green-800",
        future: "bg-purple-100 text-purple-800",
    };
    const badgeClass = colorMap[statusStr] ?? "bg-gray-100 text-gray-800";
    return <Badge className={badgeClass}>{status?.toString().toUpperCase()}</Badge>;
};

const DateFormatter = (date: any) =>
    date ? new Date(date).toLocaleDateString() : "Not Set";

export default function LeadSearchPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<LeadSuggestion[]>([]);
    const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
    const [loading, setLoading] = useState(false);
    const showLoader = useMinimumLoadingTime(loading);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const searchParams = useSearchParams();
    const leadIdFromUrl = searchParams.get("leadId");

    useEffect(() => {
        if (leadIdFromUrl) {
            const leadId = Number(leadIdFromUrl);
            if (!isNaN(leadId) && leadId > 0) {
                fetchLeadById(leadId);
            }
        }
    }, [leadIdFromUrl]);

    // Search suggestions
    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        if (!searchTerm.trim() || searchTerm.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceTimeout.current = setTimeout(async () => {
            try {
                const token = localStorage.getItem("access_token") || localStorage.getItem("token");
                if (!token || isTokenExpired(token)) {
                    setSuggestions([]);
                    return;
                }

                const res = await apiFetch(`/leads/search-names/${encodeURIComponent(searchTerm)}`);
                setSuggestions(res || []);
                setShowSuggestions(true);
            } catch (error) {
                setSuggestions([]);
                console.error("Search failed:", error);
            }
        }, 300);
    }, [searchTerm]);

    const selectLead = async (suggestion: LeadSuggestion) => {
        setLoading(true);
        setShowSuggestions(false);
        setSearchTerm("");
        try {
            const data = await apiFetch(`/leads/${suggestion.id}`);
            setSelectedLead(data);
        } catch (error) {
            console.error("Failed to fetch lead details:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeadById = async (id: number) => {
        setLoading(true);
        try {
            const data = await apiFetch(`/leads/${id}`);
            setSelectedLead(data);
        } catch (error) {
            console.error("Failed to fetch lead details:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderInfoCard = (title: string, icon: React.ReactNode, data: any) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                {icon}
                <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{title}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(data).map(([key, value]) => {
                    if (value === null || value === undefined || value === "") return null;

                    const displayKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
                        .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    let displayValue = typeof value === 'boolean' ? (value ? "Yes" : "No") : value;

                    if (key.toLowerCase().includes('date')) {
                        displayValue = DateFormatter(value);
                    } else if (key === 'status') {
                        displayValue = <StatusRenderer status={value as string} />;
                    }

                    return (
                        <div key={key} className="flex flex-col py-2 border-b border-gray-50 dark:border-gray-700 last:border-b-0">
                            <span className="text-gray-500 dark:text-gray-400 font-medium mb-1">{displayKey}</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">{displayValue as React.ReactNode}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Search Leads
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Search leads by name or email to view details
                    </p>
                </div>
            </div>

            <div className="max-w-md relative">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search
                </Label>
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        type="text"
                        placeholder="Enter lead name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                    />
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion.id}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 focus:outline-none transition-colors"
                                onClick={() => selectLead(suggestion)}
                            >
                                <div className="font-medium text-gray-900 dark:text-gray-100">{suggestion.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.email}</div>
                            </button>
                        ))}
                    </div>
                )}

                {showSuggestions && (
                    <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowSuggestions(false)}
                    />
                )}

                {showLoader && (
                    <div className="mt-4">
                        <Loader text="Loading lead details..." />
                    </div>
                )}
            </div>

            {selectedLead && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {selectedLead.full_name || "Unnamed Lead"}
                        </h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" /> {selectedLead.email}
                            </div>
                            {selectedLead.phone && (
                                <div className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" /> {selectedLead.phone}
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" /> Joined {DateFormatter(selectedLead.entry_date)}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {renderInfoCard("Lead Details", <User className="h-5 w-5" />, {
                            id: selectedLead.id,
                            status: selectedLead.status,
                            work_status: selectedLead.workstatus,
                            full_name: selectedLead.full_name,
                            email: selectedLead.email,
                            phone: selectedLead.phone,
                            secondary_email: selectedLead.secondary_email,
                            secondary_phone: selectedLead.secondary_phone,
                            entry_date: selectedLead.entry_date,
                            moved_to_candidate: selectedLead.moved_to_candidate,
                        })}

                        {(selectedLead.address || selectedLead.city || selectedLead.state || selectedLead.country) && (
                            renderInfoCard("Location Information", <MapPin className="h-5 w-5" />, {
                                address: selectedLead.address,
                                city: selectedLead.city,
                                state: selectedLead.state,
                                country: selectedLead.country,
                            })
                        )}

                        {selectedLead.notes && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <BookOpen className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                                    <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Notes</h4>
                                </div>
                                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {selectedLead.notes}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
