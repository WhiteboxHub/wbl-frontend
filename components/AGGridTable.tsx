

"use client";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { ColDef, GridReadyEvent, ColumnMovedEvent, CellValueChangedEvent, GridApi } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { Button } from "@/components/admin_ui/button";
import { EyeIcon, EditIcon, TrashIcon, DownloadIcon, SettingsIcon, SearchIcon } from "lucide-react";
import { ViewModal } from "./ViewModal";
import { EditModal } from "@/components/EditModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { GridOptions } from "ag-grid-community";
import "@/styles/admin.css";
import { Input } from "@/components/admin_ui/input";

interface AGGridTableProps {
  rowData: any[];
  columnDefs: ColDef[];
  loading?: boolean;
  defaultColDef?: ColDef;
  onRowClicked?: (data: any) => void;
  onRowUpdated?: (data: any) => void;
  onRowDeleted?: (id: string | number) => void;
  title?: string;
  searchPlaceholder?: string;
  searchFields?: string[];
  height?: string;
  overlayNoRowsTemplate?: string;
  batches?: any[];
  showAddButton?: boolean;
  onAdd?: () => void;
  showFilters?: boolean;
  showSearch?: boolean;
  getRowNodeId?: (data: any) => string | number;
  gridOptions?: GridOptions;
}

export function AGGridTable({
  rowData: originalRowData,
  columnDefs: initialColumnDefs,
  loading = false,
  onRowClicked,
  onRowUpdated,
  onRowDeleted,
  overlayNoRowsTemplate = "No rows to show",
  searchPlaceholder = "Search by Id, name, phone, email...",
  searchFields = ['id', 'name', 'fullName', 'phone', 'email', 'description'],
  height = "400px",
  batches = [],
  showAddButton = true,
  onAdd,
}: AGGridTableProps) {
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRowData, setFilteredRowData] = useState(originalRowData);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter data based on search term (client-side)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRowData(originalRowData);
      return;
    }

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const searchTerms = normalizedSearchTerm.split(/\s+/).filter(term => term.length > 0);

    setFilteredRowData(
      originalRowData.filter(row => {
        return searchFields.some(field => {
          const fieldValue = String(row[field] || "");
          const normalizedFieldValue = fieldValue.toLowerCase();
          return searchTerms.every(term =>
            normalizedFieldValue.includes(term)
          );
        });
      })
    );
  }, [searchTerm, originalRowData, searchFields]);

  // Refs and State
  const gridRef = useRef<AgGridReact>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<any[] | null>(null);
  const [viewData, setViewData] = useState<any | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState<any | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Load saved column visibility
  useEffect(() => {
    const saved = localStorage.getItem(`hiddenColumns-${initialColumnDefs[0]?.headerName}`);
    if (saved) {
      try {
        setHiddenColumns(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse hidden columns", e);
      }
    }
  }, [initialColumnDefs]);

  // Save column visibility
  useEffect(() => {
    localStorage.setItem(`hiddenColumns-${initialColumnDefs[0]?.headerName}`, JSON.stringify(hiddenColumns));
  }, [hiddenColumns, initialColumnDefs]);

  const visibleColumnDefs = useMemo(() => {
    return initialColumnDefs.filter(col => {
      if (!col.field) return true;
      return !hiddenColumns.includes(col.field);
    });
  }, [initialColumnDefs, hiddenColumns]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);

  const onRowClickedHandler = useCallback((event: any) => {
    if (onRowClicked) {
      onRowClicked(event.data);
    }
  }, [onRowClicked]);

  const handleRowSelection = useCallback(() => {
    if (gridApiRef.current) {
      const selectedRows = gridApiRef.current.getSelectedRows();
      setSelectedRowData(selectedRows.length > 0 ? selectedRows : null);
    }
  }, []);

  const handleView = useCallback(() => {
    if (selectedRowData && selectedRowData.length > 0) {
      setViewData(selectedRowData[0]);
    }
  }, [selectedRowData]);

  const handleEdit = useCallback(() => {
    if (selectedRowData && selectedRowData.length > 0) {
      setEditData(selectedRowData[0]);
    }
  }, [selectedRowData]);

  const handleDelete = useCallback(() => {
    if (selectedRowData && selectedRowData.length > 0) {
      setDeleteConfirmData(selectedRowData[0]);
    }
  }, [selectedRowData]);

  const confirmDelete = useCallback(() => {
    if (deleteConfirmData && onRowDeleted) {
      if (deleteConfirmData.leadid) onRowDeleted(deleteConfirmData.leadid);
      else if (deleteConfirmData.candidateid) onRowDeleted(deleteConfirmData.candidateid);
      else if (deleteConfirmData.id) onRowDeleted(deleteConfirmData.id);
      else if (deleteConfirmData.batchid) onRowDeleted(deleteConfirmData.batchid);
      else if (deleteConfirmData.sessionid) onRowDeleted(deleteConfirmData.sessionid);
      setSelectedRowData(null);
      setDeleteConfirmData(null);
    }
  }, [deleteConfirmData, onRowDeleted]);

  const handleSave = useCallback((updatedData: any) => {
    if (gridRef.current) {
      gridRef.current.api.applyTransaction({ update: [updatedData] });
    }
    if (onRowUpdated) onRowUpdated(updatedData);
    setEditData(null);
    setSelectedRowData(null);
  }, [onRowUpdated]);

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    if (gridRef.current) {
      gridRef.current.api.applyTransaction({ update: [event.data] });
    }
    if (onRowUpdated) onRowUpdated(event.data);
  }, [onRowUpdated]);

  const handleDownload = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.exportDataAsCsv({
        fileName: `data.csv`,
      });
    }
  }, []);

  const toggleColumnVisibility = useCallback((field: string, isVisible: boolean) => {
    setHiddenColumns(prev => isVisible
      ? prev.filter(col => col !== field)
      : [...prev, field]
    );
  }, []);

  const resetColumns = useCallback(() => {
    setHiddenColumns([]);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
      searchInputRef.current.focus();
    }
  }, []);

  return (
    <div className="mx-auto space-y-4 w-full">
      {/* Single line header with search on left and all icons on right */}
      <div className="flex items-center justify-between mb-4">
        {/* Left side: Search bar */}
        <div className="relative w-[350px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white border"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              title="Clear search"
            >
              <span className="text-gray-400 hover:text-gray-600">✕</span>
            </button>
          )}
        </div>

        {/* Right side: All action buttons in a single line */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            disabled={!selectedRowData || selectedRowData.length === 0}
            className="h-9 w-9 p-0 border-gray-300"
            title="View"
          >
            <EyeIcon className="h-4 w-4 text-blue-500" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            disabled={!selectedRowData || selectedRowData.length === 0}
            className="h-9 w-9 p-0 border-gray-300"
            title="Edit"
          >
            <EditIcon className="h-4 w-4 text-green-500" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={!selectedRowData || selectedRowData.length === 0}
            className="h-9 w-9 p-0 border-gray-300"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4 text-red-500" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsColumnModalOpen(true)}
            className="h-9 w-9 p-0 border-gray-300"
            title="Toggle Columns"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-9 w-9 p-0 border-gray-300 text-green-600 hover:text-green-700"
            title="Download CSV"
          >
            <DownloadIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex justify-center">
        <div
          className={`ag-theme-alpine ${isDarkMode ? "ag-grid-dark-mode" : ""} rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm w-full`}
          style={{ height: "calc(100vh - 220px)", minHeight: "400px" }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={filteredRowData}
            columnDefs={visibleColumnDefs}  // Note: No actions column here
            onGridReady={onGridReady}
            onRowClicked={onRowClickedHandler}
            onSelectionChanged={handleRowSelection}
            onCellValueChanged={onCellValueChanged}
            animateRows={true}
            loading={loading}
            suppressSetFilterByDefault={true}

            overlayNoRowsTemplate={searchTerm ? "No matching records found" : overlayNoRowsTemplate}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true,
              cellClass: "custom-cell-style",
              editable: true,
            }}
            rowSelection="multiple"
            theme={"legacy"}
            suppressRowClickSelection={false}
            pagination={true}
            paginationPageSize={50}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            maintainColumnOrder={true}

          />
        </div>
      </div>

      {/* Show count of filtered results */}
      {searchTerm && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Showing {filteredRowData.length} of {originalRowData.length} records
        </div>
      )}

      {/* Column Visibility Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" style={{ display: isColumnModalOpen ? 'flex' : 'none' }} onClick={() => setIsColumnModalOpen(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[425px] p-4" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Column Visibility</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetColumns}
                className="text-xs"
              >
                Reset All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
              {initialColumnDefs.map((col) => (
                col.field && (
                  <div key={col.field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`col-${col.field}`}
                      checked={!hiddenColumns.includes(col.field)}
                      onChange={(e) => toggleColumnVisibility(col.field, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`col-${col.field}`}
                      className="text-sm font-medium"
                    >
                      {col.headerName || col.field}
                    </label>
                  </div>
                )
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsColumnModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewData && (
        <ViewModal
          isOpen={true}
          onClose={() => setViewData(null)}
          data={viewData}
          title="Record Details"
        />
      )}
      {editData && (
        <EditModal
          isOpen={true}
          onClose={() => setEditData(null)}
          onSave={handleSave}
          data={editData}
          title="Edit Record"
          batches={batches}
        />
      )}
      {deleteConfirmData && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirmData(null)}
          onConfirm={confirmDelete}
          title="Delete Record"
          message={`Are you sure you want to delete this record?${deleteConfirmData.fullName || deleteConfirmData.company
            ? `\n\nRecord: ${deleteConfirmData.fullName || deleteConfirmData.company}`
            : ""}`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}

ModuleRegistry.registerModules([AllCommunityModule]);
