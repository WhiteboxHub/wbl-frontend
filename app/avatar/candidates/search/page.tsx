
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import "@/styles/admin.css";
import "@/styles/App.css";
import { isTokenExpired } from "@/utils/auth"; 

import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, User, Phone, DollarSign, BookOpen, Briefcase, Mail, Eye, Settings } from "lucide-react";

interface CandidateSuggestion {
  id: number;
  name: string;
  email: string;
}

interface CandidateData {
  candidate_id: number;
  basic_info: any;
  emergency_contact: any;
  fee_financials: any;
  preparation_records: any[];
  marketing_records: any[];
  interview_records: any[];
  placement_records: any[];
  login_access: any;
  miscellaneous: any;
  session_records?: any[];
}

const StatusRenderer = ({ status }: {status: string }) => {
  const statusStr = status?.toString().toLowerCase() ?? "";
  const colorMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    preparation: "bg-yellow-100 text-yellow-800", 
    marketing: "bg-blue-100 text-blue-800",
    placed: "bg-purple-100 text-purple-800",
    discontinued: "bg-red-100 text-red-800",
    break: "bg-pink-100 text-pink-800",
  };
  const badgeClass = colorMap[statusStr] ?? "bg-black-100 text-black-800";
  return <Badge className={badgeClass}>{status?.toString().toUpperCase()}</Badge>;
};

const DateFormatter = (date: any) => 
  date ? new Date(date).toLocaleDateString() : "Not Set";

const AmountFormatter = (amount: any) => 
  amount ? `$${Number(amount).toLocaleString()}` : "Not Set";

function isPotentialUrl(val: any): boolean {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();

  if (/^https?:\/\//i.test(trimmed)) return true;

  if (/^www\./i.test(trimmed)) return true;

  if (/^[a-z0-9.-]+\.(com|org|net|io|co)(\/.*)?$/i.test(trimmed)) {
    return true;
  }

  return false;
}

function renderOpenLinkButton(url: string, label: string = "Open") {
  let finalUrl = url.trim();
  if (!/^https?:\/\//.test(finalUrl)) {
    finalUrl = "https://" + finalUrl;
  }
  return (
    <button
      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap inline-block min-w-0 max-w-fit"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(finalUrl, "_blank", "noopener,noreferrer");
      }}
    >
      {label}
    </button>
  );
}

export default function CandidateSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<CandidateSuggestion[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const searchParams = useSearchParams();
  const candidateIdFromUrl = searchParams.get("candidateId");

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));   
  };
      const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};};

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
      const token = localStorage.getItem("access_token");

      if (!token || isTokenExpired(token)) {
        console.error("Token missing or expired");
        setSuggestions([]);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/search-names/${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
      } else {
        console.error("Search failed:", res.status);
        setSuggestions([]);
      }
    } catch (error) {
      setSuggestions([]);
      console.error("Search failed:", error);
    }
  }, 300);
}, [searchTerm]);


  const selectCandidate = async (suggestion: CandidateSuggestion) => {
    setLoading(true);
    setShowSuggestions(false);
    setSearchTerm("");
    try {

      const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/candidates/details/${suggestion.id}`,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      }
    );
      const data = await res.json();
    
      const sessionRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/candidates/sessions/${suggestion.id}`,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      }
    );
      const sessionData = await sessionRes.json();
      setSelectedCandidate({
        ...data,
        session_records: sessionData.sessions || []
      });
    } catch (error) {
      console.error("Failed to fetch candidate details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateById = async (id: number) => {
    setLoading(true);
    setShowSuggestions(false);
    setSearchTerm("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/details/${id}`,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await res.json();
      const sessionRes = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/candidates/sessions/${id}`,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );
      const sessionData = await sessionRes.json();
      setSelectedCandidate({
        ...data,
        session_records: sessionData.sessions || []
      });
    } catch (error) {
      console.error("Failed to fetch candidate details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidateIdFromUrl) {
      if (
        !selectedCandidate ||
        selectedCandidate.candidate_id !== Number(candidateIdFromUrl)
      ) {
        fetchCandidateById(Number(candidateIdFromUrl));
      }
    }
  }, [candidateIdFromUrl]);


  const renderInfoCard = (title: string, icon: React.ReactNode, data: any) => (
    <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
        {icon}
        <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">{title}</h4>
      </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
          {Object.entries(data).map(([key, value]) => {
            if (value === null || value === undefined || value === "") return null;

            const displayKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
              .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

            let displayValue = value;

            if ((key === 'Last Login' && value) || (key === 'Last Modified' && value)) {
              const date = new Date(value as string | number | Date);
              displayValue = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
            }
            if (key === 'candidate_folder' && value && value.toString().trim() !== '') {
              const url = value.toString().trim();
              let finalUrl = url;
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                finalUrl = 'https://' + url;
              }
              displayValue = (
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap inline-block min-w-0 max-w-fit"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(finalUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                Folder
                </button>
              );
            } else if (key.toLowerCase().includes('linkedin') && value && value.toString().trim() !== '') {
              const url = value.toString().trim();
              const finalUrl = url.startsWith('http') ? url : `https://${url}`;
              displayValue = renderOpenLinkButton(finalUrl, "Open LinkedIn");
            } else if (key.toLowerCase().includes('github') && value && value.toString().trim() !== '') {
              const url = value.toString().trim();
              const finalUrl = url.startsWith('http') ? url : `https://${url}`;
              displayValue = renderOpenLinkButton(finalUrl, "Open GitHub");
            } else if (key.toLowerCase().includes('notes') && typeof value === 'string') {
              
              const parseHtmlToText = (htmlString: string) => {
                const doc = new DOMParser().parseFromString(htmlString, 'text/html');
                return doc.body.innerText || '';
              };
              const textOnly = parseHtmlToText(value);
              displayValue = (
                <div className="whitespace-pre-wrap text-sm break-words dark:text-black-100 text-black-900">
                  {textOnly}
                </div>
              );
            }
            else if (
              (key.toLowerCase().includes('phone')) &&
              value &&
              value.toString().trim() !== ''
            ) {
              const phone = value.toString().trim();
              displayValue = (
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {phone}
                </a>
              );
            }
            else if (value && typeof value === "string") {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (emailRegex.test(value.trim())) {
                displayValue = (
                  <a
                    href={`mailto:${value}`}
                    className="text-blue-600 hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {value}
                  </a>
                );
              }
            }
            else if (key.toLowerCase().includes('date')) {
              displayValue = DateFormatter(value);
            } else if (key === 'status') {
              displayValue = <StatusRenderer status={value as string} />;
            }
            else if (key === "agreement") {
              displayValue = value === "Y" ? " Yes" : " No";
            }
            else if (Array.isArray(value) && value.length > 0 && value.every(v => isPotentialUrl(v))) {
              displayValue = (
                <div className="flex flex-wrap gap-1">
                  {value.map((url: string, idx: number) => (
                    <span key={url + idx}>{renderOpenLinkButton(url, `Link ${idx + 1}`)}</span>
                  ))}
                </div>
              );
            }
            else if (typeof value === "string" && isPotentialUrl(value)) {
              displayValue = renderOpenLinkButton(value, "Open Link");
            }

            return (
              <div key={key} className="flex items-center py-3 border-b border-black-100 dark:border-black-600 last:border-b-0">
                <span className="text-black-600 dark:text-black-400 font-semibold w-auto flex-shrink-0 mr-3">{displayKey}:</span>
                <span className="text-black-900 dark:text-black-100 font-medium">{displayValue as React.ReactNode}</span>
              </div>
            );
          })}
        </div>

    </div>
  );

  const renderTable = (title: string, icon: React.ReactNode, records: any[]) => {
    if (!records || records.length === 0) {
      return (
        <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            {icon}
            <h4 className="font-semibold text-black-900 dark:text-black-100">{title}</h4>
          </div>
          <p className="text-black-500 dark:text-black-400 text-sm">No records found</p>
        </div>
      );
    }

    const columns = Object.keys(records[0]).filter(key => key !== 'id' && key !== 'error');

    return (
      <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
          {icon}
          <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">{title}</h4>
          <Badge variant="secondary">{records.length}</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-black-200 dark:border-black-600">
              {columns.map(column => {
                const displayColumn = column
                  .replace(/_/g, ' ')
                  .replace(/([A-Z])/g, ' $1')
                  .trim()
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');

                return (
                  <th 
                    key={column} 
                    className={`text-left p-2 font-semibold text-black-700 dark:text-black-300 ${
                      column.toLowerCase().includes('email') ? 'w-48' : 
                      column === 'recording_link' ? 'w-20' : 
                      column.toLowerCase().includes('date') ? 'w-24' : 
                      'w-auto'
                    }`}
                  >
                    {displayColumn}
                  </th>
                );
              })}
            </tr>
          </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={idx} className="border-b border-black-100 dark:border-black-700">
{columns.map(column => {
  let value = record[column];
  
  if (column.toLowerCase().includes('date')) {
    value = DateFormatter(value);
  } else if (column === 'Last Modified' && value) {
    const date = new Date(value as string | number | Date);
    value = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } else if (column.toLowerCase().includes('amount') || column.toLowerCase().includes('salary') || column === 'fee_paid') {
    value = AmountFormatter(value);
  } else if (column === 'status') {
    value = <StatusRenderer status={value as string} />;
  } else if (column === 'feedback') {
    const feedbackColors = {
      'Positive': 'bg-green-100 text-green-800',
      'Negative': 'bg-red-100 text-red-800', 
      'No Response': 'bg-black-100 text-black-800',
      'Cancelled': 'bg-orange-100 text-orange-800'
    };
    value = <Badge className={feedbackColors[value as keyof typeof feedbackColors] || 'bg-black-100 text-black-800'}>{value}</Badge>;
  } else if (column === 'recording_link' && value && value.toString().trim() !== '') {
    const url = value.toString().trim();
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }
    
    value = (
      <button 
        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap inline-block min-w-0 max-w-fit"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        }}
      >
      Link
      </button>
    );
  }
  else if (Array.isArray(value) && value.length > 0 && value.every(v => isPotentialUrl(v))) {
    value = (
      <div className="flex flex-wrap gap-1">
        {value.map((url: string, idx: number) => (
          <span key={url + idx}>{renderOpenLinkButton(url, `Link ${idx + 1}`)}</span>
        ))}
      </div>
    );
  }
  else if (typeof value === "string" && isPotentialUrl(value)) {
    value = renderOpenLinkButton(value, "Open Link");
  }

  return (
    <td key={column} className="p-2 text-black-900 max-w-xs break-words dark:text-black-100">
      {column.toLowerCase().includes("notes") && typeof value === "string"
        ? value.replace(/<[^>]+>/g, '')
        : value || "—"}
    </td>
  );
})}


                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSessionsTable = (title: string, icon: React.ReactNode, records: any[]) => {
    if (!records || records.length === 0) {
      return (
        <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            {icon}
            <h4 className="font-semibold text-black-900 dark:text-black-100">{title}</h4>
          </div>
          <p className="text-black-500 dark:text-black-400 text-sm">No session records found</p>
        </div>
      );
    }
  
    const columns = Object.keys(records[0]).filter(key => key !== 'id' && key !== 'error');
  
    return (
      <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
          {icon}
          <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">{title}</h4>
          <Badge variant="secondary">{records.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-black-200 dark:border-black-600">
                {columns.map(column => {
                  const displayColumn = column
                    .replace(/_/g, ' ')
                    .replace(/([A-Z])/g, ' $1')
                    .trim()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                  return (
                    <th 
                      key={column} 
                      className={`text-left p-2 font-semibold text-black-700 dark:text-black-300 ${
                        column.toLowerCase().includes('email') ? 'w-48' : 
                        column.toLowerCase().includes('date') ? 'w-24' : 
                        'w-auto'
                      }`}
                    >
                      {displayColumn}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={idx} className="border-b border-black-100 dark:border-black-700">
                  {columns.map(column => {
                    let value = record[column];
                    if (column.toLowerCase().includes('date')) {
                      value = DateFormatter(value);
                    }
                    else if (Array.isArray(value) && value.length > 0 && value.every(v => isPotentialUrl(v))) {
                      value = (
                        <div className="flex flex-wrap gap-1">
                          {value.map((url: string, idx: number) => (
                            <span key={url + idx}>{renderOpenLinkButton(url, `Link ${idx + 1}`)}</span>
                          ))}
                        </div>
                      );
                    }
                    else if (typeof value === "string" && isPotentialUrl(value)) {
                      value = renderOpenLinkButton(value, "Open Link");
                    }
                    return (
                      <td key={column} className="p-2 text-black-900 max-w-xs break-words dark:text-black-100">
                        {value || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
    return (
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black-900 dark:text-black-100">
            Search Candidates
          </h1>
          <p className="text-black-600 dark:text-black-400">
            Search candidates by name to view comprehensive information
          </p>
        </div>
      </div>

      <div className="max-w-md relative">
        <Label htmlFor="search" className="text-sm font-medium text-black-700 dark:text-black-300">
          Search by Name
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black-400" />
          <Input
            id="search"
            type="text"
            placeholder="Enter candidate name (min 2 characters)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-black-800 border border-black-200 dark:border-black-700 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                className="w-full px-4 py-3 text-left hover:bg-black-50 dark:hover:bg-black-700 border-b border-black-100 dark:border-black-600 last:border-b-0 focus:outline-none focus:bg-black-50 dark:focus:bg-black-700 transition-colors"
                onClick={() => selectCandidate(suggestion)}
              >
                <div className="font-medium text-black-900 dark:text-black-100">{suggestion.name}</div>
                <div className="text-sm text-black-500 dark:text-black-400">{suggestion.email}</div>
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

        {loading && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-blue-500 dark:text-blue-400">Loading candidate details...</p>
          </div>
        )}
        
        {searchTerm.length >= 2 && !loading && suggestions.length === 0 && (
          <p className="mt-2 text-sm text-black-500 dark:text-black-400">No candidates found</p>
        )}
      </div>

      {selectedCandidate && (
        <div className="border border-black-200 dark:border-black-700 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-black-800 dark:to-black-700 px-6 py-4 border-b border-black-200 dark:border-black-700">
            <h2 className="text-xl font-bold text-black-900 dark:text-black-100">
              {selectedCandidate?.basic_info?.full_name || "Unnamed Candidate"}
            </h2>
            <p className="text-black-600 dark:text-black-400">
              ID: {selectedCandidate.candidate_id} • 
              Email: {selectedCandidate?.basic_info?.email || "No email"}
            </p>
          </div>

          <div className="divide-y divide-black-200 dark:divide-black-700">
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('basic')}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-black-600 dark:text-black-400" />
                  <span className="font-semibold text-black-900 dark:text-black-100">Candidate Information</span>
                </div>
                <span className="text-2xl font-bold text-black-400 transition-transform duration-200">
                  {openSections['basic'] ? '−' : '+'}
                </span>
              </button>
              {openSections['basic'] && (
                <div className="px-6 pb-4 space-y-4">
                  {renderInfoCard("Candidate Details", <User className="h-4 w-4" />, {
                    ...selectedCandidate.basic_info,
                    ...selectedCandidate.emergency_contact                   
                  })}
                </div>
              )}
            </div>
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('fee')}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-black-600 dark:text-black-400" />
                  <span className="font-medium text-black-900 dark:text-black-100">Fee & Financials</span>
                </div>
                <span className="text-xl font-bold text-black-400">
                  {openSections['fee'] ? '−' : '+'}
                </span>
              </button>
              {openSections['fee'] && (
                <div className="px-6 pb-4">
                  {renderInfoCard("Financial Information", <DollarSign className="h-4 w-4" />, selectedCandidate.fee_financials)}
                </div>
              )}
            </div>
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('login')}
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-black-600 dark:text-black-400" />
                  <span className="font-medium text-black-900 dark:text-black-100">Login & Access Info</span>
                </div>
                <span className="text-xl font-bold text-black-400">
                  {openSections['login'] ? '−' : '+'}
                </span>
              </button>
              {openSections['login'] && (
                <div className="px-6 pb-4">
                  {renderInfoCard("Access Information", <Eye className="h-4 w-4" />, selectedCandidate.login_access)}
                </div>
              )}
            </div>
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('marketing')}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-black-600 dark:text-black-400" />
                  <span className="font-medium text-black-900 dark:text-black-100">Marketing Info</span>
                  <Badge variant="secondary">{selectedCandidate.marketing_records.length}</Badge>
                </div>
                <span className="text-xl font-bold text-black-400">
                  {openSections['marketing'] ? '−' : '+'}
                </span>
              </button>
              {openSections['marketing'] && (
                <div className="px-6 pb-4">
                  {renderTable("Marketing Records", <Mail className="h-4 w-4" />, selectedCandidate.marketing_records)}
                  {renderTable("Preparation Records", <BookOpen className="h-4 w-4" />, selectedCandidate.preparation_records)}
                </div>
              )}
            </div>

            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('interviews')}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-black-600 dark:text-black-400" />
                  <span className="font-medium text-black-900 dark:text-black-100">Interview Info</span>
                  <Badge variant="secondary">{selectedCandidate.interview_records.length}</Badge>
                </div>
                <span className="text-xl font-bold text-black-400">
                  {openSections['interviews'] ? '−' : '+'}
                </span>
              </button>
              {openSections['interviews'] && (
                <div className="pb-4">
                  {renderTable(
                    "Interview Records",
                    <Briefcase className="h-4 w-4" />,
                    [...selectedCandidate.interview_records].sort((a, b) => {
                      const parseDate = (dateStr: string) => {
                        if (!dateStr) return -Infinity;
                        return new Date(dateStr).getTime(); // ISO format parsing
                      };
                      return parseDate(b["interview_date"]) - parseDate(a["interview_date"]); // latest first
                    })
                  )}
                  {renderTable("Placement Records", <DollarSign className="h-4 w-4" />, selectedCandidate.placement_records)}
                </div>
              )}
            </div>
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('sessions')}
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-black-600 dark:text-black-400" />
                  <span className="font-medium text-black-900 dark:text-black-100">Sessions</span>
                  <Badge variant="secondary">{selectedCandidate.session_records?.length || 0}</Badge>
                </div>
                <span className="text-xl font-bold text-black-400">
                  {openSections['sessions'] ? '−' : '+'}
                </span>
              </button>
              {openSections['sessions'] && (
                <div className="px-6 pb-4">
                  {renderSessionsTable("Session Records", <Eye className="h-4 w-4" />, selectedCandidate.session_records || [])}
                </div>
              )}
            </div>


            {/* Miscellaneous */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('misc')}
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-black-600 dark:text-black-400" />
                  <span className="font-medium text-black-900 dark:text-black-100">Miscellaneous</span>
                </div>
                <span className="text-xl font-bold text-black-400">
                  {openSections['misc'] ? '−' : '+'}
                </span>
              </button>
              {openSections['misc'] && (
                <div className="px-6 pb-4 space-y-4">
                  {
                  renderInfoCard("Additional Information", <Settings className="h-4 w-4" />, {
                    notes: selectedCandidate.miscellaneous?.["Notes"] || "No notes available",
                    preparation_active: selectedCandidate.miscellaneous?.["Preparation Active"] ? "Yes" : "No",
                    marketing_active: selectedCandidate.miscellaneous?.["Marketing Active"] ? "Yes" : "No",
                    placement_active: selectedCandidate.miscellaneous?.["Placement Active"] ? "Yes" : "No",
                  })
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}