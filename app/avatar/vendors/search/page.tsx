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
import { SearchIcon, User, Phone, Mail, BookOpen, Clock, Globe, MapPin, BuildingIcon, Linkedin } from "lucide-react";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

interface VendorSuggestion {
    id: number;
    name: string;
    email: string;
}

interface VendorData {
    id: number;
    full_name: string;
    phone_number?: string | null;
    secondary_phone?: string | null;
    email: string;
    linkedin_id?: string | null;
    type: string;
    notes?: string | null;
    company_name?: string | null;
    location?: string | null;
    city?: string | null;
    postal_code?: string | null;
    address?: string | null;
    country?: string | null;
    status: string;
    linkedin_connected: string;
    intro_email_sent: string;
    intro_call: string;
    created_at: string;
    linkedin_internal_id?: string | null;
    last_modified_datetime?: string | null;
}

const StatusRenderer = ({ status }: { status: string }) => {
    const statusStr = status?.toString().toLowerCase() ?? "";
    const colorMap: Record<string, string> = {
        active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        working: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        not_useful: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        do_not_contact: "bg-gray-500 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        inactive: "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        prospect: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
    const badgeClass = colorMap[statusStr] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    return <Badge className={badgeClass}>{status?.toString().toUpperCase()}</Badge>;
};

const TypeRenderer = ({ type }: { type: string }) => {
    const typeStr = type?.toString().toLowerCase() ?? "";
    const colorMap: Record<string, string> = {
        client: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        "implementation-partner": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        "third-party-vendor": "bg-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        sourcer: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        "contact-from-ip": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    };
    const badgeClass = colorMap[typeStr] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    return <Badge className={badgeClass}>{type?.toString().toUpperCase().replace(/-/g, ' ')}</Badge>;
};

const YesNoRenderer = ({ value }: { value: string }) => {
    const colorMap: Record<string, string> = {
        YES: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
        NO: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200",
    };
    const badgeClass = colorMap[value?.toString().toUpperCase()] ?? "bg-gray-100 text-gray-800";
    return <Badge className={badgeClass}>{value?.toString().toUpperCase()}</Badge>;
};

const DateFormatter = (date: any) =>
    date ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }) : "Not Set";

const DateTimeFormatter = (date: any) =>
    date ? new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }) : "Not Set";

export default function VendorSearchPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<VendorSuggestion[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);
    const [loading, setLoading] = useState(false);
    const showLoader = useMinimumLoadingTime(loading);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const searchParams = useSearchParams();
    const vendorIdFromUrl = searchParams.get("vendorId");

    useEffect(() => {
        if (vendorIdFromUrl) {
            const vendorId = Number(vendorIdFromUrl);
            if (!isNaN(vendorId) && vendorId > 0) {
                fetchVendorById(vendorId);
            }
        }
    }, [vendorIdFromUrl]);

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

                const res = await apiFetch(`/vendors/search-names/${encodeURIComponent(searchTerm)}`);
                setSuggestions(res || []);
                setShowSuggestions(true);
            } catch (error) {
                setSuggestions([]);
                console.error("Search failed:", error);
            }
        }, 300);
    }, [searchTerm]);

    const selectVendor = async (suggestion: VendorSuggestion) => {
        setLoading(true);
        setShowSuggestions(false);
        setSearchTerm("");
        try {
            const data = await apiFetch(`/vendors/${suggestion.id}`);
            setSelectedVendor(data);
        } catch (error) {
            console.error("Failed to fetch vendor details:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendorById = async (id: number) => {
        setLoading(true);
        try {
            const data = await apiFetch(`/vendors/${id}`);
            setSelectedVendor(data);
        } catch (error) {
            console.error("Failed to fetch vendor details:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderInfoCard = (title: string, icon: React.ReactNode, data: any) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                {icon}
                <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{title}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(data).map(([key, value]) => {
                    if (value === null || value === undefined || value === "") return null;

                    const displayKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
                        .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    let displayValue: React.ReactNode = typeof value === 'boolean' ? (value ? "Yes" : "No") : (value as any);

                    if (key.toLowerCase().includes('datetime')) {
                        displayValue = DateTimeFormatter(value);
                    } else if (key.toLowerCase().includes('date')) {
                        displayValue = DateFormatter(value);
                    } else if (key === 'status') {
                        displayValue = <StatusRenderer status={value as string} />;
                    } else if (key === 'type') {
                        displayValue = <TypeRenderer type={value as string} />;
                    } else if (['linkedin_connected', 'intro_email_sent', 'intro_call'].includes(key)) {
                        displayValue = <YesNoRenderer value={value as string} />;
                    } else if (key === 'linkedin_id' || key === 'linkedin_internal_id') {
                        const url = value.toString().trim();
                        const finalUrl = url.startsWith('http') ? url : `https://www.linkedin.com/in/${url}`;
                        displayValue = (
                            <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                <Linkedin className="h-3 w-3" /> View Profile
                            </a>
                        );
                    }

                    return (
                        <div key={key} className="flex flex-col py-2 border-b border-gray-50 dark:border-gray-700 last:border-b-0">
                            <span className="text-gray-500 dark:text-gray-400 font-medium mb-1">{displayKey}</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">{displayValue}</span>
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
                        Search Vendors
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Search vendors by name or email to view details
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
                        placeholder="Enter vendor name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all rounded-lg"
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                    />
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-64 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion.id}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 border-b border-gray-100 dark:border-gray-700 last:border-b-0 focus:outline-none transition-colors group"
                                onClick={() => selectVendor(suggestion)}
                            >
                                <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{suggestion.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Mail className="h-3 w-3" /> {suggestion.email}
                                </div>
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
                        <Loader text="Loading vendor details..." />
                    </div>
                )}
            </div>

            {selectedVendor && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 px-8 py-8 rounded-2xl border border-blue-500/20 shadow-xl text-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl font-bold tracking-tight">
                                        {selectedVendor.full_name || "Unnamed Vendor"}
                                    </h2>
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                                        ID: {selectedVendor.id}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4 text-sm text-blue-100">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white/10 p-1.5 rounded-lg"><Mail className="h-4 w-4" /></div>
                                        {selectedVendor.email}
                                    </div>
                                    {selectedVendor.phone_number && (
                                        <div className="flex items-center gap-2">
                                            <div className="bg-white/10 p-1.5 rounded-lg"><Phone className="h-4 w-4" /></div>
                                            {selectedVendor.phone_number}
                                        </div>
                                    )}
                                    {selectedVendor.company_name && (
                                        <div className="flex items-center gap-2">
                                            <div className="bg-white/10 p-1.5 rounded-lg"><BuildingIcon className="h-4 w-4" /></div>
                                            {selectedVendor.company_name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <StatusRenderer status={selectedVendor.status} />
                                <div className="text-xs text-blue-200 flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" /> Added {DateFormatter(selectedVendor.created_at)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderInfoCard("General Information", <User className="h-5 w-5 text-blue-500" />, {
                            full_name: selectedVendor.full_name,
                            email: selectedVendor.email,
                            phone_number: selectedVendor.phone_number,
                            secondary_phone: selectedVendor.secondary_phone,
                            type: selectedVendor.type,
                            company_name: selectedVendor.company_name,
                        })}

                        {renderInfoCard("Status & Outreach", <Globe className="h-5 w-5 text-indigo-500" />, {
                            status: selectedVendor.status,
                            linkedin_connected: selectedVendor.linkedin_connected,
                            intro_email_sent: selectedVendor.intro_email_sent,
                            intro_call: selectedVendor.intro_call,
                            linkedin_id: selectedVendor.linkedin_id,
                            linkedin_internal_id: selectedVendor.linkedin_internal_id,
                        })}

                        {(selectedVendor.address || selectedVendor.city || selectedVendor.postal_code || selectedVendor.country) && (
                            renderInfoCard("Location Details", <MapPin className="h-5 w-5 text-emerald-500" />, {
                                address: selectedVendor.address,
                                city: selectedVendor.city,
                                postal_code: selectedVendor.postal_code,
                                country: selectedVendor.country,
                                location: selectedVendor.location,
                            })
                        )}

                        {selectedVendor.notes && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <BookOpen className="h-5 w-5 text-amber-500" />
                                    <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Notes</h4>
                                </div>
                                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedVendor.notes }} />
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                                <span>Last modified: {DateTimeFormatter(selectedVendor.last_modified_datetime)}</span>
                                <span>Internal Record ID: {selectedVendor.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
