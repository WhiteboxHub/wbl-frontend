// wbl\components\AGGridTable.tsx
"use client";
import { ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";
ModuleRegistry.registerModules([ClientSideRowModelModule]);
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent, GridApi } from "ag-grid-community";
import { useCallback, useRef, useState, useEffect } from "react";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import {
  SearchIcon,
  RefreshCwIcon,
  ExpandIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { ViewModal } from "./ViewModal";
import { EditModal } from "@/components/EditModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface AGGridTableProps {
  rowData: any[];
  columnDefs: ColDef[];
  onRowClicked?: (data: any) => void;
  onRowUpdated?: (data: any) => void;
  onRowDeleted?: (id: string | number) => void;
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  height?: string;
}

export function AGGridTable({
  rowData,
  columnDefs,
  onRowClicked,
  onRowUpdated,
  onRowDeleted,
  title,
  showSearch = true,
  showFilters = true,
  height = "400px",
}: AGGridTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<any>(null);

  // Modal states - completely separate from grid
  const [viewData, setViewData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(false);

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
    setGridApi(params.api);
  }, []);

  const onFilterTextBoxChanged = useCallback(
    (value: string) => {
      setSearchText(value);
      if (gridApi && typeof (gridApi as any).setQuickFilter === "function") {
        (gridApi as any).setQuickFilter(value);
      }
    },
    [gridApi]
  );

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const refreshData = useCallback(() => {
    if (gridApi) {
      gridApi.refreshCells();
    }
  }, [gridApi]);

  // Row selection handler
  const handleRowSelection = useCallback(() => {
    if (gridApi) {
      const selectedRows = gridApi.getSelectedRows();
      if (selectedRows.length > 0) {
        setSelectedRowData(selectedRows[0]);
      } else {
        setSelectedRowData(null);
      }
    }
  }, [gridApi]);

  // Action handlers - completely independent of grid
  const handleView = useCallback(() => {
    if (selectedRowData) {
      setEditData(null);
      setViewData(selectedRowData);
    } else {
      alert("Please select a row first");
    }
  }, [selectedRowData]);

  const handleEdit = useCallback(() => {
    if (selectedRowData) {
      setViewData(null);
      setEditData(selectedRowData);
    } else {
      alert("Please select a row first");
    }
  }, [selectedRowData]);

  const handleDelete = useCallback(() => {
    if (selectedRowData) {
      setDeleteConfirmData(selectedRowData);
    } else {
      alert("Please select a row first");
    }
  }, [selectedRowData]);

  const confirmDelete = useCallback(() => {
    if (deleteConfirmData && onRowDeleted && deleteConfirmData.id) {
      onRowDeleted(deleteConfirmData.id);
      setSelectedRowData(null);
      setDeleteConfirmData(null);
    }
  }, [deleteConfirmData, onRowDeleted]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmData(null);
  }, []);

  const handleSave = useCallback(
    (updatedData: any) => {
      if (onRowUpdated) {
        onRowUpdated(updatedData);
      }
      setEditData(null);
      setSelectedRowData(null);
    },
    [onRowUpdated],
  );

  const closeViewModal = useCallback(() => {
    setViewData(null);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditData(null);
  }, []);

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: false,
  };

  const onRowClickedHandler = useCallback(
    (event: any) => {
      setSelectedRowData(event.data);
      if (onRowClicked) {
        onRowClicked(event);
      }
      if (gridApi && event.node) {
        gridApi.deselectAll();
        event.node.setSelected(true, false);
      }
    },
    [onRowClicked, gridApi]
  );

  return (
    <div
      className={`mx-auto space-y-4 ${isExpanded ? "w-full" : "w-full max-w-7xl"}`}
    >
      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between">
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            disabled={!selectedRowData}
            className="h-8 w-8 p-0"
            title="View"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            disabled={!selectedRowData}
            className="h-8 w-8 p-0"
            title="Edit"
          >
            <EditIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={!selectedRowData}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>

          {/* Search */}
          {showSearch && (
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search all columns..."
                value={searchText}
                onChange={(e) => onFilterTextBoxChanged(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}

          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCwIcon className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={toggleExpand}>
            <ExpandIcon className="h-4 w-4 mr-2" />
            {isExpanded ? "Collapse" : "Expand Table"}
          </Button>
        </div>
      </div>

      {/* AG Grid Table - No actions column */}
      <div className="flex justify-center">
        <div
          className={`${isDarkMode ? "ag-grid-dark-mode" : ""} ag-theme-alpine rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ${
            isExpanded ? "w-full" : "w-full max-w-6xl"
          }`}
          style={{
            height: isExpanded ? "calc(100vh - 200px)" : height,
            minHeight: "400px",
          }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData || []}
            columnDefs={columnDefs} // Use original column definitions without actions
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onRowClicked={onRowClickedHandler}
            onSelectionChanged={handleRowSelection}
            animateRows={true}
            rowSelection="single"
            suppressRowClickSelection={false}
            pagination={true}
            paginationPageSize={isExpanded ? 50 : 20}
            suppressCellFocus={false}
            theme="legacy"
            
          />
        </div>
      </div>

      {/* Modals - Completely separate from grid */}
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
              ? `\n\nRecord: ${
                  deleteConfirmData.fullName || deleteConfirmData.company
                }`
              : ""
          }`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}
