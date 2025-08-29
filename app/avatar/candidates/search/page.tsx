"use client";

import React, { useEffect, useRef, useState } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
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
}

const StatusRenderer = ({ status }: { status: string }) => {
  const statusStr = status?.toString().toLowerCase() ?? "";
  const colorMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    preparation: "bg-yellow-100 text-yellow-800", 
    marketing: "bg-blue-100 text-blue-800",
    placed: "bg-purple-100 text-purple-800",
    discontinued: "bg-red-100 text-red-800",
    break: "bg-pink-100 text-pink-800",
  };
  const badgeClass = colorMap[statusStr] ?? "bg-gray-100 text-gray-800";
  return <Badge className={badgeClass}>{status?.toString().toUpperCase()}</Badge>;
};

const DateFormatter = (date: any) => 
  date ? new Date(date).toLocaleDateString() : "Not Set";

const AmountFormatter = (amount: any) => 
  amount ? `$${Number(amount).toLocaleString()}` : "Not Set";

export default function CandidateSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<CandidateSuggestion[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Optimized search with better error handling
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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/candidates/search-names/${encodeURIComponent(searchTerm)}`
        );
        
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
          setShowSuggestions(true);
        } else {
          console.error('Search failed:', res.status);
          setSuggestions([]);
        }
      } catch (error) {
        setSuggestions([]);
        console.error("Search failed:", error);
      }
    }, 300); // Reduced to 300ms for faster response
  }, [searchTerm]);

  // Select candidate and get full details
  const selectCandidate = async (suggestion: CandidateSuggestion) => {
    setLoading(true);
    setShowSuggestions(false);
    setSearchTerm(suggestion.name);
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/details/${suggestion.id}`
      );
      const data = await res.json();
      setSelectedCandidate(data);
    } catch (error) {
      console.error("Failed to fetch candidate details:", error);
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {Object.entries(data).map(([key, value]) => {
          if (value === null || value === undefined || value === "") return null;
          
          const displayKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
            .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          
          let displayValue = value;
          if (key.toLowerCase().includes('date')) {
            displayValue = DateFormatter(value);
          } else if (key === 'status') {
            displayValue = <StatusRenderer status={value as string} />;
          } else if (key === 'agreement') {
            displayValue = value === 'Y' ? '✅ Yes' : '❌ No';
          }

          return (
            <div key={key} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
              <span className="text-gray-600 dark:text-gray-400 font-medium min-w-[140px] flex-shrink-0">{displayKey}:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium text-right flex-1 ml-4">{displayValue as React.ReactNode}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTable = (title: string, icon: React.ReactNode, records: any[]) => {
    if (!records || records.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            {icon}
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No records found</p>
        </div>
      );
    }

    const columns = Object.keys(records[0]).filter(key => key !== 'id' && key !== 'error');

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          {icon}
          <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{title}</h4>
          <Badge variant="secondary">{records.length}</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                {columns.map(column => (
                  <th key={column} className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">
                    {column.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
                      .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                  {columns.map(column => {
                    let value = record[column];
                    
                    if (column.toLowerCase().includes('date')) {
                      value = DateFormatter(value);
                    } else if (column.toLowerCase().includes('amount') || column.toLowerCase().includes('salary') || column === 'fee_paid') {
                      value = AmountFormatter(value);
                    } else if (column === 'status') {
                      value = <StatusRenderer status={value as string} />;
                    } else if (column === 'feedback') {
                      const feedbackColors = {
                        'Positive': 'bg-green-100 text-green-800',
                        'Negative': 'bg-red-100 text-red-800', 
                        'No Response': 'bg-gray-100 text-gray-800',
                        'Cancelled': 'bg-orange-100 text-orange-800'
                      };
                      value = <Badge className={feedbackColors[value as keyof typeof feedbackColors] || 'bg-gray-100 text-gray-800'}>{value}</Badge>;
                    }

                    return (
                      <td key={column} className="p-2 text-gray-900 dark:text-gray-100">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Search Candidates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search candidates by name to view comprehensive information including instructor names, marketing manager, and placement fees
          </p>
        </div>
      </div>

      {/* Optimized Search Box */}
      <div className="max-w-md relative">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search by Name
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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

        {/* Enhanced Dropdown Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 transition-colors"
                onClick={() => selectCandidate(suggestion)}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{suggestion.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.email}</div>
              </button>
            ))}
          </div>
        )}

        {/* Click outside to close dropdown */}
        {showSuggestions && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setShowSuggestions(false)}
          />
        )}

        {/* Enhanced Loading and Error States */}
        {loading && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-blue-500 dark:text-blue-400">Loading candidate details...</p>
          </div>
        )}
        
        {searchTerm.length >= 2 && !loading && suggestions.length === 0 && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No candidates found</p>
        )}
      </div>

      {/* Enhanced Candidate Details with All New Fields */}
      {selectedCandidate && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {selectedCandidate.basic_info.full_name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              ID: {selectedCandidate.candidate_id} • Email: {selectedCandidate.basic_info.email}
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Basic Information - Now shows more fields */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('basic')}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Basic Information</span>
                </div>
                <span className="text-2xl font-bold text-gray-400 transition-transform duration-200">
                  {openSections['basic'] ? '−' : '+'}
                </span>
              </button>
              {openSections['basic'] && (
                <div className="px-6 pb-4">
                  {renderInfoCard("Candidate Details", <User className="h-4 w-4" />, selectedCandidate.basic_info)}
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                onClick={() => toggleSection('emergency')}
              >
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Emergency Contact</span>
                </div>
                <span className="text-xl font-bold text-gray-400">
                  {openSections['emergency'] ? '−' : '+'}
                </span>
              </button>
              {openSections['emergency'] && (
                <div className="px-6 pb-4">
                  {renderInfoCard("Emergency Contact Information", <Phone className="h-4 w-4" />, selectedCandidate.emergency_contact)}
                </div>
              )}
            </div>

            {/* Fee & Financials */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                onClick={() => toggleSection('fee')}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Fee & Financials</span>
                </div>
                <span className="text-xl font-bold text-gray-400">
                  {openSections['fee'] ? '−' : '+'}
                </span>
              </button>
              {openSections['fee'] && (
                <div className="px-6 pb-4">
                  {renderInfoCard("Financial Information", <DollarSign className="h-4 w-4" />, selectedCandidate.fee_financials)}
                </div>
              )}
            </div>

            {/* Preparation Info - Now shows instructor names */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                onClick={() => toggleSection('preparation')}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Preparation Info</span>
                  <Badge variant="secondary">{selectedCandidate.preparation_records.length}</Badge>
                </div>
                <span className="text-xl font-bold text-gray-400">
                  {openSections['preparation'] ? '−' : '+'}
                </span>
              </button>
              {openSections['preparation'] && (
                <div className="px-6 pb-4">
                  {renderTable("Preparation Records", <BookOpen className="h-4 w-4" />, selectedCandidate.preparation_records)}
                </div>
              )}
            </div>

            {/* Marketing Info - Now shows marketing manager name */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                onClick={() => toggleSection('marketing')}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Marketing Info</span>
                  <Badge variant="secondary">{selectedCandidate.marketing_records.length}</Badge>
                </div>
                <span className="text-xl font-bold text-gray-400">
                  {openSections['marketing'] ? '−' : '+'}
                </span>
              </button>
              {openSections['marketing'] && (
                <div className="px-6 pb-4">
                  {renderTable("Marketing Records", <Mail className="h-4 w-4" />, selectedCandidate.marketing_records)}
                </div>
              )}
            </div>

            {/* Interview Info - Now shows recording links */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                onClick={() => toggleSection('interviews')}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Interview Info</span>
                  <Badge variant="secondary">{selectedCandidate.interview_records.length}</Badge>
                </div>
                <span className="text-xl font-bold text-gray-400">
                  {openSections['interviews'] ? '−' : '+'}
                </span>
              </button>
              {openSections['interviews'] && (
                <div className="px-6 pb-4">
                  {renderTable("Interview Records", <Briefcase className="h-4 w-4" />, selectedCandidate.interview_records)}
                </div>
              )}
            </div>

            {/* Placement Info - Now shows placement fees */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                onClick={() => toggleSection('placements')}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Placement Info</span>
                  <Badge variant="secondary">{selectedCandidate.placement_records.length}</Badge>
                </div>
                <span className="text-xl font-bold text-gray-400">
                  {openSections['placements'] ? '−' : '+'}
                </span>
              </button>
              {openSections['placements'] && (
                <div className="px-6 pb-4">
                  {renderTable("Placement Records", <DollarSign className="h-4 w-4" />, selectedCandidate.placement_records)}
                </div>
              )}
            </div>

            {/* Login & Access Info */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                onClick={() => toggleSection('login')}
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Login & Access Info</span>
                </div>
                <span className="text-xl font-bold text-gray-400">
                  {openSections['login'] ? '−' : '+'}
                </span>
              </button>
              {openSections['login'] && (
                <div className="px-6 pb-4">
                  {renderInfoCard("Access Information", <Eye className="h-4 w-4" />, selectedCandidate.login_access)}
                </div>
              )}
            </div>

            {/* Miscellaneous */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                onClick={() => toggleSection('misc')}
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Miscellaneous</span>
                </div>
                <span className="text-xl font-bold text-gray-400">
                  {openSections['misc'] ? '−' : '+'}
                </span>
              </button>
              {openSections['misc'] && (
                <div className="px-6 pb-4">
                  {renderInfoCard("Additional Information", <Settings className="h-4 w-4" />, selectedCandidate.miscellaneous)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
