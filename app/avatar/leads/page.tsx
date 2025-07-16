
"use client";

import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/admin_ui/button";
import { toast } from "sonner";

type Lead = {
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
  last_modified?: string | Date | null;
};

type PaginatedLeadsResponse = {
  page: number;
  limit: number;
  total: number;
  data: Lead[];
};

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState(0);

  const fetchLeads = useCallback(async (page: number = 1, limit: number = 100) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads?page=${page}&limit=${limit}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data: PaginatedLeadsResponse = await res.json();
      console.log("API Response:", data); // Debug log
      
      if (!data.data) {
        throw new Error("No data property in response");
      }
      
      setLeads(data.data);
      setFilteredLeads(data.data);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(err instanceof Error ? err.message : "Failed to load leads");
      toast.error("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(page, limit);
  }, [fetchLeads, page, limit]);

  const filterLeads = useCallback(
    (searchTerm: string) => {
      if (searchTerm.trim() === "") return leads;
      const searchLower = searchTerm.toLowerCase();
      return leads.filter((lead) => {
        return (
          (lead.full_name?.toLowerCase()?.includes(searchLower)) ||
          (lead.email?.toLowerCase()?.includes(searchLower)) ||
          (lead.phone?.includes(searchTerm)) ||
          (lead.workstatus?.toLowerCase()?.includes(searchLower)) ||
          (lead.status?.toLowerCase()?.includes(searchLower)) ||
          (lead.address?.toLowerCase()?.includes(searchLower)) ||
          (lead.secondary_email?.toLowerCase()?.includes(searchLower)) ||
          (lead.city?.toLowerCase()?.includes(searchLower)) ||
          (lead.state?.toLowerCase()?.includes(searchLower))
        );
      });
    },
    [leads]
  );

  useEffect(() => {
    const filtered = filterLeads(searchTerm);
    setFilteredLeads(filtered || []);
  }, [searchTerm, filterLeads]);

  const StatusRenderer = (params: { value?: string }) => {
    const status = params.value?.toLowerCase() || '';
    const variantMap: Record<string, string> = {
      open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      closed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    };

    const variant = variantMap[status] || variantMap.default;
    return <Badge className={`${variant} capitalize`}>{params.value || 'N/A'}</Badge>;
  };

  const dateFormatter = (params: { value?: string | Date | null }) => {
    if (!params.value) return '-';
    const date = new Date(params.value);
    return date.toLocaleDateString();
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      { 
        field: "id", 
        headerName: "ID", 
        width: 80, 
        pinned: "left", 
        checkboxSelection: true,
        headerCheckboxSelection: true
      },
      { 
        field: "full_name", 
        headerName: "Full Name", 
        width: 180,
        filter: 'agTextColumnFilter'
      },
      { 
        field: "email", 
        headerName: "Email", 
        width: 220,
        filter: 'agTextColumnFilter'
      },
      { 
        field: "phone", 
        headerName: "Phone", 
        width: 150,
        filter: 'agTextColumnFilter'
      },
      { 
        field: "workstatus", 
        headerName: "Work Status", 
        width: 150,
        filter: 'agTextColumnFilter'
      },
      { 
        field: "status", 
        headerName: "Status", 
        width: 120, 
        cellRenderer: StatusRenderer,
        filter: 'agSetColumnFilter'
      },
      { 
        field: "entry_date", 
        headerName: "Entry Date", 
        width: 150,
        valueFormatter: dateFormatter,
        filter: 'agDateColumnFilter'
      },
      { 
        field: "closed_date", 
        headerName: "Closed Date", 
        width: 150,
        valueFormatter: dateFormatter,
        filter: 'agDateColumnFilter'
      },
      { 
        field: "city", 
        headerName: "City", 
        width: 120,
        filter: 'agTextColumnFilter'
      }
    ],
    []
  );

  const handleRowUpdated = useCallback(async (updatedRow: Lead) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${updatedRow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRow),
      });

      if (!response.ok) throw new Error('Failed to update lead');
      
      setLeads(prev => prev.map(lead => lead.id === updatedRow.id ? updatedRow : lead));
      setFilteredLeads(prev => prev.map(lead => lead.id === updatedRow.id ? updatedRow : lead));
      toast.success("Lead updated successfully");
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    }
  }, []);

  const handleRowDeleted = useCallback(async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete lead');
      
      setLeads(prev => prev.filter(lead => lead.id !== id));
      setFilteredLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success("Lead deleted successfully");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    }
  }, []);

 const handleCreateNew = async () => {
  try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Sample new lead data (modify as needed)
          full_name: "New Lead",
          email: "new.lead@example.com",
          status: "Open",
        }),
      });

      if (!response.ok) throw new Error("Failed to create lead");
      
      const newLead = await response.json();
      toast.success("Lead created successfully!");
      
      // Refresh the leads list
      fetchLeads(page, limit);
      
    } catch (error) {
      toast.error("Failed to create lead");
      console.error("Error creating lead:", error);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page * limit < total) {
      setPage(page + 1);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
        <Button variant="outline" onClick={() => fetchLeads(page, limit)} className="ml-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Leads Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track your potential clients
          </p>
        </div>
        <Button 
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Search Leads
          </Label>
          <div className="relative mt-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Search by name, email, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="limit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rows:
            </Label>
            <select
              id="limit"
              value={limit}
              onChange={handleLimitChange}
              className="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="500">500</option>
            </select>
          </div>
          <Button variant="outline" onClick={() => fetchLeads(page, limit)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {searchTerm && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredLeads.length} leads matching {searchTerm}
        </p>
      )}

      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl">
          {filteredLeads.length > 0 ? (
            <AGGridTable
              rowData={filteredLeads}
              columnDefs={columnDefs}
              title={`All Leads (${filteredLeads.length})`}
              height="calc(70vh)"
              showSearch={false}
              onRowClicked={(event) => console.log("Row clicked:", event.data)}
              onRowUpdated={handleRowUpdated}
              onRowDeleted={handleRowDeleted}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
              <p className="text-lg font-medium text-gray-500 mb-4">
                {isLoading ? "Loading leads..." : "No leads found"}
              </p>
              {!isLoading && (
                <Button variant="outline" onClick={() => fetchLeads(1, limit)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} leads
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-medium">
            Page {page}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={page * limit >= total}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}