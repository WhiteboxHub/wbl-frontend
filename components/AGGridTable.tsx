

"use client";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent, GridApi, ColumnMovedEvent } from "ag-grid-community";
import { Button } from "@/components/admin_ui/button";
import { EyeIcon, EditIcon, TrashIcon } from "lucide-react";
import { ViewModal } from "./ViewModal";
import { EditModal } from "@/components/EditModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/styles/admin.css";

interface AGGridTableProps {
  rowData: any[];
  columnDefs: ColDef[];
  defaultColDef?: ColDef;
  onRowClicked?: (data: any) => void;
  onRowUpdated?: (data: any) => void;
  onRowDeleted?: (id: string | number) => void;
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  height?: string;
}

interface RowData {
  id?: string | number;
  sessionid?: string | number;
  leadid?: string | number;
  candidateid?: string | number;
  batchid?: string | number;
  fullName?: string;
  company?: string;
}

export function AGGridTable({
  rowData,
  columnDefs: initialColumnDefs,
  onRowClicked,
  onRowUpdated,
  onRowDeleted,
  title,
  showSearch = true,
  showFilters = true,
  height = "400px",
}: AGGridTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedRowData, setSelectedRowData] = useState<RowData[] | null>(null);
  const [viewData, setViewData] = useState<RowData | null>(null);
  const [editData, setEditData] = useState<RowData | null>(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState<RowData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>(initialColumnDefs);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);

  const handleRowSelection = useCallback(() => {
    if (gridApiRef.current) {
      const selectedRows = gridApiRef.current.getSelectedRows();
      setSelectedRowData(selectedRows.length > 0 ? selectedRows : null);
    }
  }, []);

  const onColumnMoved = useCallback((event: ColumnMovedEvent) => {
    const newColumnDefs = event.api.getColumnDefs();
    setColumnDefs([...newColumnDefs]);
  }, []);

  const handleView = useCallback(() => {
    if (selectedRowData && selectedRowData.length > 0) {
      setEditData(null);
      setViewData(selectedRowData[0]);
    }
  }, [selectedRowData]);

  const handleEdit = useCallback(() => {
    if (selectedRowData && selectedRowData.length > 0) {
      setViewData(null);
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
      if (deleteConfirmData.leadid) {
        onRowDeleted(deleteConfirmData.leadid);
      } else if (deleteConfirmData.candidateid) {
        onRowDeleted(deleteConfirmData.candidateid);
      } else if (deleteConfirmData.id) {
        onRowDeleted(deleteConfirmData.id);
      } else if (deleteConfirmData.batchid) {
        onRowDeleted(deleteConfirmData.batchid);
      } else if (deleteConfirmData.sessionid) {
        onRowDeleted(deleteConfirmData.sessionid);
      }
      setSelectedRowData(null);
      setDeleteConfirmData(null);
    }
  }, [deleteConfirmData, onRowDeleted]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmData(null);
  }, []);

  const handleSave = useCallback(
    (updatedData: RowData) => {
      if (onRowUpdated) {
        onRowUpdated(updatedData);
      }
      setEditData(null);
      setSelectedRowData(null);
    },
    [onRowUpdated]
  );

  const closeViewModal = useCallback(() => {
    setViewData(null);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditData(null);
  }, []);

  const onRowClickedHandler = useCallback(
    (event: any) => {
      if (onRowClicked) {
        onRowClicked(event);
      }
    },
    [onRowClicked]
  );

  const totalItems = rowData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rowData.slice(start, start + pageSize);
  }, [rowData, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto space-y-4 w-full max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            disabled={!selectedRowData || selectedRowData.length === 0}
            className="h-8 w-8 p-0"
            title="View"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            disabled={!selectedRowData || selectedRowData.length === 0}
            className="h-8 w-8 p-0"
            title="Edit"
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={!selectedRowData || selectedRowData.length === 0}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex justify-center">
        <div
          className={`ag-theme-alpine ${isDarkMode ? "ag-grid-dark-mode" : ""} rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 w-full`}
          style={{
            height: "calc(100vh - 260px)",
            minHeight: "400px",
          }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={paginatedData}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            onRowClicked={onRowClickedHandler}
            onSelectionChanged={handleRowSelection}
            onColumnMoved={onColumnMoved}
            animateRows={true}
            theme="legacy"
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true,
              cellClass: "custom-cell-style",
              editable: true,
            }}
            rowSelection="multiple"
            suppressRowClickSelection={false}
            enableRangeSelection={true}
          />
        </div>
      </div>
      {/* <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div> */}
      {viewData && (
        <ViewModal
          isOpen={true}
          onClose={closeViewModal}
          data={viewData}
          title={title || "Record"}
        />
      )}
      {editData && (
        <EditModal
          isOpen={true}
          onClose={closeEditModal}
          onSave={handleSave}
          data={editData}
          title={title || "Record"}
        />
      )}
      {deleteConfirmData && (
        <ConfirmDialog
          isOpen={true}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="Delete Record"
          message={`Are you sure you want to delete this record? This action cannot be undone.${
            deleteConfirmData.fullName || deleteConfirmData.company
              ? `\n\nRecord: ${deleteConfirmData.fullName || deleteConfirmData.company}`
              : ""
          }`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}

export default AGGridTable;
