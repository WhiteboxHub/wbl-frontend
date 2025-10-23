
"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Badge } from "@/components/admin_ui/badge";
import { SearchIcon, User, Users, MapPin, Calendar, FileText, Activity, BookOpen, Briefcase } from "lucide-react";

// Types (unchanged)
type Employee = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  startdate?: string;  
  address?: string;
  state?: string;
  dob?: string;
  enddate?: string;
  notes?: string;
  status?: number;
  instructor?: number;
  aadhaar?: string;
};

type Candidates = {
  preparation: { count: number; names: string[] };
  marketing: { count: number; names: string[] };
};

type TeachingItem = { type: "class" | "session"; title: string; date?: string; link?: string; };

type SessionClassData = { class_count: number; session_count: number; timeline: TeachingItem[]; };

const StatusRenderer = ({ status }: { status: number }) => {
  const statusMap: Record<number, { label: string; class: string }> = {
    1: { label: "ACTIVE", class: "bg-green-100 text-green-800" },
    0: { label: "INACTIVE", class: "bg-red-100 text-red-800" },
  };
  
  const statusConfig = statusMap[status] || { label: "UNKNOWN", class: "bg-gray-100 text-gray-800" };
  
  return <Badge className={statusConfig.class}>{statusConfig.label}</Badge>;
};


const DateFormatter = (date: any) => 
  date ? new Date(date).toLocaleDateString() : "Not Set";


export default function EmployeeSearchPage() {
  const [query, setQuery] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [candidates, setCandidates] = useState<Candidates | null>(null);
  const [sessionClassData, setSessionClassData] = useState<SessionClassData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || process.env.NEXT_PUBLIC_API_URL;

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));   
  };

  
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (!query.trim() || query.trim().length < 2) {
      setFilteredEmployees([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        
        const res = await axios.get(`${BASE_URL}/api/employees/search?query=${encodeURIComponent(query)}`);
        setFilteredEmployees(res.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        setFilteredEmployees([]);
      } finally { 
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, BASE_URL]);

  // Fetch Candidates
  useEffect(() => {
    if (!selectedEmployee) return;
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        // Fixed URL construction
        const res = await axios.get(`${BASE_URL}/api/employees/${selectedEmployee.id}/candidates`);
        setCandidates(res.data);
      } catch (error) {
        console.error("Failed to fetch candidates:", error);
        setCandidates(null);
      } finally { setLoadingCandidates(false); }
    };
    fetchCandidates();
  }, [selectedEmployee?.id, BASE_URL]);

  // Fetch Sessions & Classes
  useEffect(() => {
    if (!selectedEmployee) return;
    const fetchSessionClassData = async () => {
      setLoadingSessions(true);
      try {
        // Fixed URL construction
        const res = await axios.get(`${BASE_URL}/api/employees/${selectedEmployee.id}/session-class-data`);
        const sortedTimeline = res.data.timeline.sort(
          (a: TeachingItem, b: TeachingItem) =>
            new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
        );
        setSessionClassData({ ...res.data, timeline: sortedTimeline });
      } catch (error) {
        console.error("Failed to fetch session data:", error);
        setSessionClassData(null);
      } finally { setLoadingSessions(false); }
    };
    fetchSessionClassData();
  }, [selectedEmployee?.id, BASE_URL]);

  const selectEmployee = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowSuggestions(false);
    setQuery("");
    setFilteredEmployees([]);
  };

  // Render Info Card similar to candidate page
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

          if (key.toLowerCase().includes('date')) {
            displayValue = DateFormatter(value);
          } else if (key === 'status' && typeof value === 'number') {
            displayValue = <StatusRenderer status={value} />;
          } else if (key === 'email' && value) {
            displayValue = (
              <a
                href={`mailto:${value}`}
                className="text-blue-600 hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
              </a>
            );
          } else if (key.toLowerCase().includes('phone') && value) {
            displayValue = (
              <a
                href={`tel:${value}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {value as React.ReactNode}
              </a>
            );
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

  // Render candidate lists similar to candidate page tables
  const renderCandidateSection = (title: string, count: number, names: string[], color: string) => (
    <div className={`${color} p-6 rounded-lg border border-black-200 dark:border-black-700 shadow-sm`}>
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
        <Users className="h-5 w-5" />
        <h4 className="font-semibold text-lg">{title}</h4>
        <Badge variant="secondary">{count}</Badge>
      </div>
      {names.length > 0 ? (
        <div className="space-y-2">
          {names.map((name, idx) => (
            <div key={idx} className="flex items-center py-2 border-b border-black-100 dark:border-black-600 last:border-b-0">
              <span className="text-black-900 dark:text-black-100 font-medium">{name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-black-500 dark:text-black-400 text-sm">No candidates found</p>
      )}
    </div>
  );

  // Render teaching timeline similar to candidate page tables
  const renderTeachingTimeline = (timeline: TeachingItem[]) => (
    <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
        <Activity className="h-5 w-5" />
        <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">Recent Activity Timeline</h4>
        <Badge variant="secondary">{timeline.length}</Badge>
      </div>

      {timeline.length > 0 ? (
        <div className="space-y-4">
          {timeline.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 border border-black-200 dark:border-black-700 rounded-lg"
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  item.type === "class"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {item.type === "class" ? "C" : "S"}
              </div>

              <div className="flex-1 min-w-0">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-black-900 dark:text-black-100 hover:text-blue-600 transition-colors"
                  >
                    {item.title || "Untitled Event"}
                  </a>
                ) : (
                  <p className="font-semibold text-black-900 dark:text-black-100">
                    {item.title || "Untitled Event"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-black-500 dark:text-black-400 text-sm">
          No sessions or classes recorded
        </p>
      )}
    </div>
  );


  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black-900 dark:text-black-100">
            Search Employees
          </h1>
          <p className="text-black-600 dark:text-black-400">
            Search employees by name, ID, or email to view comprehensive information
          </p>
        </div>
      </div>

      {/* Search Section - Matches Candidate Page Design */}
      <div className="max-w-md relative">
        <Label htmlFor="search" className="text-sm font-medium text-black-700 dark:text-black-300">
          Search by Name, ID, or Email
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black-400" />
          <Input
            id="search"
            type="text"
            placeholder="Enter employee name, ID, or email (min 2 characters)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            onFocus={() => {
              if (filteredEmployees.length > 0) setShowSuggestions(true);
            }}
          />
        </div>

        {showSuggestions && filteredEmployees.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-black-800 border border-black-200 dark:border-black-700 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.id}
                className="w-full px-4 py-3 text-left hover:bg-black-50 dark:hover:bg-black-700 border-b border-black-100 dark:border-black-600 last:border-b-0 focus:outline-none focus:bg-black-50 dark:focus:bg-black-700 transition-colors"
                onClick={() => selectEmployee(employee)}
              >
                <div className="font-medium text-black-900 dark:text-black-100">{employee.name}</div>
                <div className="text-sm text-black-500 dark:text-black-400">{employee.email}</div>
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
            <p className="text-sm text-blue-500 dark:text-blue-400">Searching employees...</p>
          </div>
        )}
        
        {query.length >= 2 && !loading && filteredEmployees.length === 0 && (
          <p className="mt-2 text-sm text-black-500 dark:text-black-400">No employees found</p>
        )}
      </div>

      {/* Employee Details - Matches Candidate Page Accordion Design */}
      {selectedEmployee && (
        <div className="border border-black-200 dark:border-black-700 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-black-800 dark:to-black-700 px-6 py-4 border-b border-black-200 dark:border-black-700">
            <h2 className="text-xl font-bold text-black-900 dark:text-black-100">
              {selectedEmployee.name}
            </h2>
            <p className="text-black-600 dark:text-black-400">
              ID: {selectedEmployee.id} • 
              Email: {selectedEmployee.email || "No email"} • 
              Status: <StatusRenderer status={selectedEmployee.status || 0} />
            </p>
          </div>

          <div className="divide-y divide-black-200 dark:divide-black-700">
            {/* Basic Information Section */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('basic')}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-black-600 dark:text-black-400" />
                  <span className="font-semibold text-black-900 dark:text-black-100">Basic Information</span>
                </div>
                <span className="text-2xl font-bold text-black-400 transition-transform duration-200">
                  {openSections['basic'] ? '−' : '+'}
                </span>
              </button>
              {openSections['basic'] && (
                <div className="px-6 pb-4 space-y-4">
                  {renderInfoCard("Employee Details", <User className="h-4 w-4" />, {
                    name: selectedEmployee.name,
                    email: selectedEmployee.email,
                    phone: selectedEmployee.phone,
                    status: selectedEmployee.status,
                    start_date: selectedEmployee.startdate,
                    end_date: selectedEmployee.enddate,
                    date_of_birth: selectedEmployee.dob,
                    state: selectedEmployee.state,
                    aadhaar: selectedEmployee.aadhaar,
                    instructor: selectedEmployee.instructor,
                  })}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
                        <MapPin className="h-4 w-4" />
                        <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">Address</h4>
                      </div>
                      <p className="text-black-900 dark:text-black-100">
                        {selectedEmployee.address || "No address provided"}
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
                        <FileText className="h-4 w-4" />
                        <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">Notes</h4>
                      </div>
                      <p className="text-black-900 dark:text-black-100">
                        {selectedEmployee.notes || "No notes available"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Candidate Information Section */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('candidates')}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-black-600 dark:text-black-400" />
                  <span className="font-semibold text-black-900 dark:text-black-100">Candidate Information</span>
                </div>
                <span className="text-2xl font-bold text-black-400 transition-transform duration-200">
                  {openSections['candidates'] ? '−' : '+'}
                </span>
              </button>
              {openSections['candidates'] && (
                <div className="px-6 pb-4 space-y-4">
                  {loadingCandidates ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="ml-2 text-blue-500">Loading candidate details...</p>
                    </div>
                  ) : candidates ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderCandidateSection(
                        "Preparation Candidates", 
                        candidates.preparation.count, 
                        candidates.preparation.names,
                        "bg-indigo-50 dark:bg-indigo-900/20"
                      )}
                      {renderCandidateSection(
                        "Marketing Candidates", 
                        candidates.marketing.count, 
                        candidates.marketing.names,
                        "bg-teal-50 dark:bg-teal-900/20"
                      )}
                    </div>
                  ) : (
                    <p className="text-black-500 dark:text-black-400 text-center py-8">No candidate data available</p>
                  )}
                </div>
              )}
            </div>

            {/* Teaching Information Section */}
            <div className="accordion-item">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black-50 dark:hover:bg-black-800 focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => toggleSection('teaching')}
              >
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-black-600 dark:text-black-400" />
                  <span className="font-semibold text-black-900 dark:text-black-100">Sessions & Classes</span>
                </div>
                <span className="text-2xl font-bold text-black-400 transition-transform duration-200">
                  {openSections['teaching'] ? '−' : '+'}
                </span>
              </button>
              {openSections['teaching'] && (
                <div className="px-6 pb-4 space-y-4">
                  {loadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="ml-2 text-blue-500">Loading session/class data...</p>
                    </div>
                  ) : sessionClassData ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-black-200 dark:border-black-700 shadow-sm text-center">
                          <div className="flex items-center gap-3 mb-2 justify-center">
                            <BookOpen className="h-5 w-5 text-yellow-700" />
                            <h4 className="font-semibold text-lg text-yellow-700">Total Classes</h4>
                          </div>
                          <p className="text-3xl font-bold text-yellow-700">{sessionClassData.class_count}</p>
                        </div>
                        
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-black-200 dark:border-black-700 shadow-sm text-center">
                          <div className="flex items-center gap-3 mb-2 justify-center">
                            <Briefcase className="h-5 w-5 text-purple-700" />
                            <h4 className="font-semibold text-lg text-purple-700">Total Sessions</h4>
                          </div>
                          <p className="text-3xl font-bold text-purple-700">{sessionClassData.session_count}</p>
                        </div>
                      </div>                      
                      <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100 dark:scrollbar-thumb-blue-600 dark:scrollbar-track-black-700">
                        {renderTeachingTimeline(sessionClassData.timeline)}
                      </div>
                    </>
                  ) : (
                    <p className="text-black-500 dark:text-black-400 text-center py-8">No session/class data available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

