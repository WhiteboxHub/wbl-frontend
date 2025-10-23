"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Badge } from "@/components/admin_ui/badge";
import {
  SearchIcon,
  User,
  Users,
  MapPin,
  Calendar,
  FileText,
  Activity,
  BookOpen,
  Briefcase,
} from "lucide-react";
import { apiFetch } from "@/lib/api"; // ✅ use centralized helper

// ---------------------- TYPES ----------------------
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

type TeachingItem = {
  type: "class" | "session";
  title: string;
  date?: string;
  link?: string;
};

type SessionClassData = {
  class_count: number;
  session_count: number;
  timeline: TeachingItem[];
};

// ---------------------- SMALL COMPONENTS ----------------------
const StatusRenderer = ({ status }: { status: number }) => {
  const statusMap: Record<number, { label: string; class: string }> = {
    1: { label: "ACTIVE", class: "bg-green-100 text-green-800" },
    0: { label: "INACTIVE", class: "bg-red-100 text-red-800" },
  };
  const s = statusMap[status] || { label: "UNKNOWN", class: "bg-gray-100 text-gray-800" };
  return <Badge className={s.class}>{s.label}</Badge>;
};

const DateFormatter = (date: any) =>
  date ? new Date(date).toLocaleDateString() : "Not Set";

// ---------------------- MAIN COMPONENT ----------------------
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

  const toggleSection = (section: string) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  // ---------------------- SEARCH EMPLOYEES ----------------------
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (!query.trim() || query.length < 2) {
      setFilteredEmployees([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/employees/search?query=${encodeURIComponent(query)}`);
        setFilteredEmployees(Array.isArray(data) ? data : data?.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("❌ Employee search failed:", error);
        setFilteredEmployees([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => debounceTimeout.current && clearTimeout(debounceTimeout.current);
  }, [query]);

  // ---------------------- FETCH CANDIDATES ----------------------
  useEffect(() => {
    if (!selectedEmployee) return;
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const data = await apiFetch(`/employees/${selectedEmployee.id}/candidates`);
        setCandidates(data);
      } catch (error) {
        console.error("❌ Candidate fetch failed:", error);
        setCandidates(null);
      } finally {
        setLoadingCandidates(false);
      }
    };
    fetchCandidates();
  }, [selectedEmployee?.id]);

  // ---------------------- FETCH SESSION / CLASS ----------------------
  useEffect(() => {
    if (!selectedEmployee) return;
    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const data = await apiFetch(`/employees/${selectedEmployee.id}/session-class-data`);
        const sorted = (data.timeline || []).sort(
          (a: TeachingItem, b: TeachingItem) =>
            new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
        );
        setSessionClassData({ ...data, timeline: sorted });
      } catch (error) {
        console.error("❌ Session/Class fetch failed:", error);
        setSessionClassData(null);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [selectedEmployee?.id]);

  // ---------------------- SELECT EMPLOYEE ----------------------
  const selectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowSuggestions(false);
    setQuery("");
    setFilteredEmployees([]);
  };

  // ---------------------- RENDER HELPERS ----------------------
  const renderInfoCard = (title: string, icon: React.ReactNode, data: any) => (
    <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
        {icon}
        <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">{title}</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
        {Object.entries(data).map(([key, value]) => {
          if (!value) return null;
          const displayKey = key
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());
          let displayValue: any = value;
          if (key.toLowerCase().includes("date")) displayValue = DateFormatter(value);
          else if (key === "status" && typeof value === "number")
            displayValue = <StatusRenderer status={value} />;
          return (
            <div
              key={key}
              className="flex items-center py-3 border-b border-black-100 dark:border-black-600 last:border-b-0"
            >
              <span className="text-black-600 dark:text-black-400 font-semibold w-1/3">
                {displayKey}:
              </span>
              <span className="text-black-900 dark:text-black-100 font-medium">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCandidateSection = (
    title: string,
    count: number,
    names: string[],
    color: string
  ) => (
    <div className={`${color} p-6 rounded-lg border border-black-200 dark:border-black-700 shadow-sm`}>
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
        <Users className="h-5 w-5" />
        <h4 className="font-semibold text-lg">{title}</h4>
        <Badge variant="secondary">{count}</Badge>
      </div>
      {names.length > 0 ? (
        names.map((n, i) => (
          <div
            key={i}
            className="py-2 border-b border-black-100 dark:border-black-600 last:border-b-0 text-black-900 dark:text-black-100 font-medium"
          >
            {n}
          </div>
        ))
      ) : (
        <p className="text-black-500 dark:text-black-400 text-sm">No candidates found</p>
      )}
    </div>
  );

  const renderTeachingTimeline = (timeline: TeachingItem[]) => (
    <div className="bg-white dark:bg-black-800 rounded-lg border border-black-200 dark:border-black-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black-200 dark:border-black-700">
        <Activity className="h-5 w-5" />
        <h4 className="font-semibold text-lg text-black-900 dark:text-black-100">
          Recent Activity Timeline
        </h4>
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
                <p className="font-semibold text-black-900 dark:text-black-100">
                  {item.title || "Untitled"}
                </p>
                <p className="text-sm text-black-500 dark:text-black-400 flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  {item.date ? DateFormatter(item.date) : "No date"}
                </p>
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
      <h1 className="text-2xl font-bold text-black-900 dark:text-black-100">Search Employees</h1>
      <p className="text-black-600 dark:text-black-400">
        Search employees by name, ID, or email to view details
      </p>

      {/* 🔍 Search bar */}
      <div className="max-w-md relative">
        <Label htmlFor="search" className="text-sm font-medium text-black-700 dark:text-black-300">
          Search by Name, ID, or Email
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black-400" />
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter at least 2 characters..."
            className="pl-10"
          />
        </div>

        {showSuggestions && filteredEmployees.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-black-800 border border-black-200 dark:border-black-700 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredEmployees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => selectEmployee(emp)}
                className="w-full px-4 py-3 text-left hover:bg-black-50 dark:hover:bg-black-700 border-b border-black-100 dark:border-black-600 last:border-b-0"
              >
                <div className="font-medium text-black-900 dark:text-black-100">{emp.name}</div>
                <div className="text-sm text-black-500 dark:text-black-400">{emp.email}</div>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="text-sm text-blue-500 mt-2">Searching employees...</p>
        )}
      </div>

      {/* Employee Details */}
      {selectedEmployee && (
        <div className="border border-black-200 dark:border-black-700 rounded-lg overflow-hidden">
          <div className="bg-blue-50 dark:bg-black-800 px-6 py-4 border-b border-black-200 dark:border-black-700">
            <h2 className="text-xl font-bold text-black-900 dark:text-black-100">
              {selectedEmployee.name}
            </h2>
            <p className="text-black-600 dark:text-black-400">
              ID: {selectedEmployee.id} • Email: {selectedEmployee.email || "N/A"} • Status:{" "}
              <StatusRenderer status={selectedEmployee.status || 0} />
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
