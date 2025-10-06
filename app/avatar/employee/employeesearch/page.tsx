
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/admin_ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin_ui/card";
import { FiMail, FiPhone, FiCalendar, FiMapPin, FiFileText, FiUsers, FiActivity } from "react-icons/fi";

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

// --- Main Component ---
export default function EmployeeSearchPage() {
  const [query, setQuery] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [candidates, setCandidates] = useState<Candidates | null>(null);
  const [sessionClassData, setSessionClassData] = useState<SessionClassData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'candidates' | 'teaching'>('details');

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

  // --- Fetch Employees ---
  useEffect(() => {
    if (!query.trim()) {
      setFilteredEmployees([]);
      return;
    }
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/employees/search?query=${query}`);
        setFilteredEmployees(res.data);
      } catch {
        setFilteredEmployees([]);
      } finally { setLoading(false); }
    };
    const debounceTimeout = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  // --- Fetch Candidates ---
  useEffect(() => {
    if (!selectedEmployee) return;
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const res = await axios.get(`${BASE_URL}/employees/${selectedEmployee.id}/candidates`);
        setCandidates(res.data);
      } catch {
        setCandidates(null);
      } finally { setLoadingCandidates(false); }
    };
    fetchCandidates();
  }, [selectedEmployee?.id]);

  // --- Fetch Sessions & Classes ---
  useEffect(() => {
    if (!selectedEmployee) return;
    const fetchSessionClassData = async () => {
      setLoadingSessions(true);
      try {
        const res = await axios.get(`${BASE_URL}/employees/${selectedEmployee.id}/session-class-data`);
        const sortedTimeline = res.data.timeline.sort(
          (a: TeachingItem, b: TeachingItem) =>
            new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
        );
        setSessionClassData({ ...res.data, timeline: sortedTimeline });
      } catch {
        setSessionClassData(null);
      } finally { setLoadingSessions(false); }
    };
    fetchSessionClassData();
  }, [selectedEmployee?.id]);

  // --- Utility for Detail Items ---
  const DetailItem = ({ icon, label, value }: { icon: JSX.Element; label: string; value: string | number | undefined | null }) => (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      {icon}
      <span className="font-medium">{label}:</span>
      <span className="truncate">{value || "-"}</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 text-center border-b pb-3">Employee Search</h1>

      {/* Search Box */}
      <div className="max-w-xl mx-auto mb-10 sticky top-0 z-10 bg-gray-50 pt-1">
        <Input
          placeholder="Search employee by name, ID, or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full border-2 border-indigo-200 shadow-lg p-3 text-base focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Loading & No Results */}
      {loading && <p className="text-center text-indigo-500 mb-4 font-medium">Searching for employees...</p>}
      {!loading && query.trim() && filteredEmployees.length === 0 && (
        <p className="text-center text-gray-500 mb-4">No employees match "{query}".</p>
      )}

      {/* Search Results */}
      {filteredEmployees.length > 0 && (
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-2xl divide-y divide-gray-100 max-h-80 overflow-y-auto border border-gray-200">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => { setSelectedEmployee(emp); setActiveTab('details'); }}
                className={`p-4 cursor-pointer transition-all duration-300 hover:bg-indigo-50/70 flex justify-between items-center gap-4 ${
                  selectedEmployee?.id === emp.id ? "bg-indigo-100/70 border-l-4 border-indigo-600" : "border-l-4 border-transparent"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg text-gray-800 truncate">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.email || "No email"}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      emp.status === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {emp.status === 1 ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Details Card */}
      {selectedEmployee && (
        <Card className="max-w-4xl mx-auto shadow-3xl border border-indigo-200 rounded-3xl overflow-hidden">
          <CardHeader className="bg-indigo-600 p-4 text-white border-b-3 border-indigo-600">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FiUsers className="text-white text-2xl" />
              {selectedEmployee.name}
            </CardTitle>
            <p className="text-sm opacity-90 mt-1">Employee ID: {selectedEmployee.id}</p>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              {['details', 'candidates', 'teaching'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-3 px-6 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-b-4 border-indigo-600 text-indigo-700'
                      : 'text-gray-500 hover:text-indigo-600'
                  }`}
                >
                  {tab === 'details' ? 'Basic Details' : tab === 'candidates' ? 'Candidate Info' : 'Sessions & Classes'}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
                  <DetailItem icon={<FiMail className="text-indigo-500" />} label="Email" value={selectedEmployee.email} />
                  <DetailItem icon={<FiPhone className="text-indigo-500" />} label="Phone" value={selectedEmployee.phone} />
                  <DetailItem icon={<FiActivity className="text-indigo-500" />} label="Status" value={selectedEmployee.status === 1 ? "Active" : "Inactive"} />
                  <DetailItem icon={<FiCalendar className="text-indigo-500" />} label="Start Date" value={selectedEmployee.startdate} />
                  <DetailItem icon={<FiCalendar className="text-indigo-500" />} label="End Date" value={selectedEmployee.enddate} />
                  <DetailItem icon={<FiMapPin className="text-indigo-500" />} label="State" value={selectedEmployee.state} />
                  <DetailItem icon={<FiCalendar className="text-indigo-500" />} label="DOB" value={selectedEmployee.dob} />
                  <DetailItem icon={<FiFileText className="text-indigo-500" />} label="Aadhaar" value={selectedEmployee.aadhaar} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2"><FiMapPin className="inline mr-1" /> Full Address</p>
                    <p className="text-sm text-gray-600 ml-6">{selectedEmployee.address || "No address provided."}</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2"><FiFileText className="inline mr-1" /> Notes</p>
                    <p className="text-sm text-gray-600 ml-6">{selectedEmployee.notes || "No notes available."}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'candidates' && (
              <div>
                {loadingCandidates ? (
                  <p className="text-gray-500">Loading candidate details...</p>
                ) : candidates ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-indigo-50 p-6 rounded-xl shadow-lg border border-indigo-200">
                      <p className="font-bold text-xl text-indigo-700 mb-3">Preparation Candidates: {candidates.preparation.count}</p>
                      {candidates.preparation.names.length > 0 ? (
                        <ul className="space-y-1 ml-5 text-sm text-gray-700 list-disc marker:text-indigo-500 max-h-60 overflow-y-auto">
                          {candidates.preparation.names.map((name, idx) => <li key={idx} className="truncate">{name}</li>)}
                        </ul>
                      ) : (<p className="text-sm text-gray-500 ml-5">No candidates in preparation.</p>)}
                    </div>
                    <div className="bg-teal-50 p-6 rounded-xl shadow-lg border border-teal-200">
                      <p className="font-bold text-xl text-teal-700 mb-3">Marketing Candidates: {candidates.marketing.count}</p>
                      {candidates.marketing.names.length > 0 ? (
                        <ul className="space-y-1 ml-5 text-sm text-gray-700 list-disc marker:text-teal-500 max-h-60 overflow-y-auto">
                          {candidates.marketing.names.map((name, idx) => <li key={idx} className="truncate">{name}</li>)}
                        </ul>
                      ) : (<p className="text-sm text-gray-500 ml-5">No candidates from marketing.</p>)}
                    </div>
                  </div>
                ) : (<p className="text-gray-500">No candidate data available.</p>)}
              </div>
            )}

            {activeTab === 'teaching' && (
              <div>
                {loadingSessions ? (
                  <p className="text-gray-500">Loading session/class data...</p>
                ) : sessionClassData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-yellow-50 p-5 rounded-xl shadow-md border border-yellow-200 text-center">
                        <p className="text-3xl font-extrabold text-yellow-700">{sessionClassData.class_count}</p>
                        <p className="text-sm font-medium text-yellow-800 uppercase tracking-wider mt-1">Total Classes</p>
                      </div>
                      <div className="bg-pink-50 p-5 rounded-xl shadow-md border border-pink-200 text-center">
                        <p className="text-3xl font-extrabold text-pink-700">{sessionClassData.session_count}</p>
                        <p className="text-sm font-medium text-pink-800 uppercase tracking-wider mt-1">Total Sessions</p>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mt-6">Recent Activity Timeline</h3>
                    {sessionClassData.timeline.length > 0 ? (
                      <div className="relative border-l-4 border-gray-200 pl-6 max-h-96 overflow-y-auto py-2">
                        {sessionClassData.timeline.map((item, idx) => (
                          <div key={idx} className="mb-6 relative">
                            <span className={`absolute -left-5 flex items-center justify-center w-8 h-8 rounded-full ring-4 ring-white shadow-lg ${item.type === "class" ? "bg-indigo-600 text-white" : "bg-pink-600 text-white"} font-bold text-sm`}>
                              {item.type === "class" ? "C" : "S"}
                            </span>
                            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow ml-2">
                              <p className="font-semibold text-gray-900">{item.title || "Untitled Event"}</p>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><FiCalendar className="w-3 h-3" />{item.date ? new Date(item.date).toLocaleDateString("en-US", { year:'numeric', month:'short', day:'numeric' }) : "No date"}</p>
                              {item.link && (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-indigo-500 text-sm font-medium hover:text-indigo-700 transition-colors">
                                  {item.type === "class" ? "🔗 View Class Recording" : "🔗 Open Session Link"}
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (<p className="text-gray-500">No sessions or classes recorded for this employee.</p>)}
                  </div>
                ) : (<p className="text-gray-500">No session/class data available.</p>)}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
