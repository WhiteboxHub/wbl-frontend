"use client";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  ColDef,
  GridReadyEvent,
  ColumnMovedEvent,
  CellValueChangedEvent,
  GridApi,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { Button } from "@/components/admin_ui/button";
import { Plus } from "lucide-react";
import {
  EyeIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
  SettingsIcon,
} from "lucide-react";
import { MutableRefObject } from "react";
import { ViewModal } from "./ViewModal";
import { EditModal } from "@/components/EditModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/styles/admin.css";

const ColumnVisibilityModal = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[425px] rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

interface AGGridTableProps {
  rowData: any[];
  columnDefs: ColDef[];
  loading?: boolean;
  defaultColDef?: ColDef;
  onRowClicked?: (data: any) => void;
  onRowUpdated?: (data: any) => void;
  onRowAdded?: (data: any) => void;
  onRowDeleted?: (id: string | number) => void;
  onAddClick?: () => void;
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  height?: string;
  overlayNoRowsTemplate?: string;
  batches?: any[];
  gridOptions?: any;
  getRowNodeId?: (data: any) => string;
}

interface RowData {
  id?: string | number;
  sessionid?: string | number;
  leadid?: string | number;
  candidateid?: string | number;
  batchid?: string | number;
  fullName?: string;
  company?: string;
  [key: string]: any;

}

export function AGGridTable({
  rowData,
  columnDefs: initialColumnDefs,
  loading = false,
  onRowClicked,
  onRowUpdated,
  onRowAdded,
  onRowDeleted,
  onAddClick,
  overlayNoRowsTemplate = "No rows to show",
  title,
  showSearch = true,
  showFilters = true,
  height = "400px",
  batches = [],
  getRowNodeId,
}: AGGridTableProps) {
  // Refs and State
  const gridRef = useRef<AgGridReact>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<RowData[] | null>(
    null
  );
  const [viewData, setViewData] = useState<RowData | null>(null);
  const [currentViewIndex, setCurrentViewIndex] = useState<number>(0);
  const [editData, setEditData] = useState<RowData | null>(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState<RowData | null>(
    null
  );
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
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Load saved column visibility
  useEffect(() => {
    if (title) {
      const saved = localStorage.getItem(`hiddenColumns-${title}`);
      if (saved) {
        try {
          setHiddenColumns(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse hidden columns", e);
        }
      }
    }
  }, [title]);

  // Save column visibility
  useEffect(() => {
    if (title) {
      localStorage.setItem(
        `hiddenColumns-${title}`,
        JSON.stringify(hiddenColumns)
      );
    }
  }, [hiddenColumns, title]);

  const visibleColumnDefs = useMemo(() => {
    return initialColumnDefs.filter((col) => {
      if (!col.field) return true;
      return !hiddenColumns.includes(col.field);
    });
  }, [initialColumnDefs, hiddenColumns]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);

  const onRowClickedHandler = useCallback(
    (event: any) => {
      if (onRowClicked) {
        onRowClicked(event.data);
      }
    },
    [onRowClicked]
  );

  const handleRowSelection = useCallback(() => {
    if (gridApiRef.current) {
      const selectedRows = gridApiRef.current.getSelectedRows() as RowData[];
      setSelectedRowData(selectedRows.length > 0 ? selectedRows : null);
    }
  }, []);

  const onColumnMoved = useCallback((event: ColumnMovedEvent) => { }, []);

  // Returns the currently displayed (filtered and sorted) rows
  const getDisplayedRows = useCallback((): RowData[] => {
    const api = gridApiRef.current;
    if (!api) return rowData;
    const result: RowData[] = [];
    const count = api.getDisplayedRowCount();
    for (let i = 0; i < count; i++) {
      const node = api.getDisplayedRowAtIndex(i);
      if (node && node.data) result.push(node.data);
    }
    return result;
  }, [rowData]);

  const handleView = useCallback(() => {
    if (selectedRowData && selectedRowData.length > 0) {
      setEditData(null);
      const selectedRow = selectedRowData[0];
      const displayedRows = getDisplayedRows();
      // Find the index of the selected row within the CURRENTLY DISPLAYED rows (after filters/sorts)
      const index = displayedRows.findIndex((row) => {
        // Try to match by various ID fields
        if (selectedRow.id && row.id) return selectedRow.id === row.id;
        if (selectedRow.sessionid && row.sessionid)
          return selectedRow.sessionid === row.sessionid;
        if (selectedRow.leadid && row.leadid)
          return selectedRow.leadid === row.leadid;
        if (selectedRow.candidateid && row.candidateid)
          return selectedRow.candidateid === row.candidateid;
        if (selectedRow.batchid && row.batchid)
          return selectedRow.batchid === row.batchid;
        // Fallback to comparing all properties
        return JSON.stringify(selectedRow) === JSON.stringify(row);
      });
      setCurrentViewIndex(index >= 0 ? index : 0);
      setViewData(selectedRow);
    }
  }, [selectedRowData, getDisplayedRows]);

  const handleViewNavigation = useCallback(
    (newIndex: number) => {
      const displayedRows = getDisplayedRows();
      if (displayedRows && newIndex >= 0 && newIndex < displayedRows.length) {
        setCurrentViewIndex(newIndex);
      }
    },
    [getDisplayedRows]
  );

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
      else if (deleteConfirmData.candidateid)
        onRowDeleted(deleteConfirmData.candidateid);
      else if (deleteConfirmData.id) onRowDeleted(deleteConfirmData.id);
      else if (deleteConfirmData.batchid)
        onRowDeleted(deleteConfirmData.batchid);
      else if (deleteConfirmData.sessionid)
        onRowDeleted(deleteConfirmData.sessionid);

      setSelectedRowData(null);
      setDeleteConfirmData(null);
    }
  }, [deleteConfirmData, onRowDeleted]);

  const handleSave = useCallback(
    (updatedData: RowData) => {
      if (gridRef.current) {
        gridRef.current.api.applyTransaction({ update: [updatedData] });
      }

      if (onRowUpdated) onRowUpdated(updatedData);

      setEditData(null);
      setSelectedRowData(null);
    },
    [onRowUpdated]
  );

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      if (gridRef.current) {
        gridRef.current.api.applyTransaction({ update: [event.data] });
      }

      if (onRowUpdated) onRowUpdated(event.data);
    },
    [onRowUpdated]
  );
  const handleDownload = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.exportDataAsCsv({
        fileName: `${title || "grid-data"}.csv`,
      });
    }
  }, [title]);

  const toggleColumnVisibility = useCallback(
    (field: string, isVisible: boolean) => {
      setHiddenColumns((prev) =>
        isVisible ? prev.filter((col) => col !== field) : [...prev, field]
      );
    },
    []
  );

  const resetColumns = useCallback(() => {
    setHiddenColumns([]);
  }, []);

  const paginationNumberFormatter = useCallback((params: any) => {
    return `${params.value.toLocaleString()}`;
  }, []);

  // const AGGridTable = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const addInitialData = useMemo(() => {
    if (rowData && rowData.length > 0) {
      const sample = rowData[0];
      const blank: Record<string, any> = {};
      Object.keys(sample).forEach((k) => {
        const v = (sample as any)[k];
        if (typeof v === "boolean") blank[k] = "";
        else if (typeof v === "number") blank[k] = "";
        else blank[k] = "";
      });
      return blank;
    }
    // fallback: build from column defs
    const fields = initialColumnDefs
      .map((c) => c.field)
      .filter(Boolean) as string[];
    return fields.reduce((acc: any, f: string) => {
      acc[f] = "";
      return acc;
    }, {});
  }, [rowData, initialColumnDefs]);

  const handleAdd = () => {
    if (onAddClick) {
      onAddClick();
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleAddSave = useCallback(
    (newData: RowData) => {
      if (gridRef.current) {
        gridRef.current.api.applyTransaction({ add: [newData] });
      }
      if (onRowAdded) onRowAdded(newData);
      else if (onRowUpdated) onRowUpdated(newData);
      setIsAddModalOpen(false);
    },
    [onRowAdded, onRowUpdated]
  );

  // Add this condition to check if we should hide the add button
  const shouldHideAddButton = useMemo(() => {
    if (!title) return false;
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("placement fee")) return false;
    return (
      lowerTitle.includes("preparation") ||
      lowerTitle.includes("marketing") ||
      lowerTitle.includes("placement")
    );
  }, [title]);

  return (
    <div className="mx-auto w-full max-w-7xl flex-row-reverse space-y-4">
      <div className="flex items-center justify-end justify-between">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        )}
        <div className="ml-auto flex items-center  space-x-2">
          {!shouldHideAddButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="flex h-8 w-8 items-center justify-center p-0 font-bold text-green-600 hover:text-blue-700 dark:text-green-400"
              title="Add New"
            >
              +
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsColumnModalOpen(true)}
            className="h-8 w-8 p-0 "
            title="Toggle Columns"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400"
            title="Download CSV"
          >
            <DownloadIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className={`ag-theme-alpine ${isDarkMode ? "ag-grid-dark-mode" : ""
            } w-full rounded-lg border border-gray-200 shadow-sm dark:border-gray-700`}
          style={{ height: "calc(100vh - 260px)", minHeight: "400px" }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={visibleColumnDefs}
            onGridReady={onGridReady}
            onRowClicked={onRowClickedHandler}
            onSelectionChanged={handleRowSelection}
            onColumnMoved={onColumnMoved}
            onCellValueChanged={onCellValueChanged}
            animateRows={true}
            loading={loading}
            suppressSetFilterByDefault={true}
            overlayNoRowsTemplate={overlayNoRowsTemplate}
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
            paginationNumberFormatter={paginationNumberFormatter}
            maintainColumnOrder={true}
            getRowId={getRowNodeId || ((params: any) => {
              return params.data.unique_id || params.data.id || params.data.leadid || params.data.candidateid || params.data.batchid || params.data.sessionid;
            })}
          />
        </div>
      </div>

      <ColumnVisibilityModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
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
          <div className="grid max-h-[400px] grid-cols-2 gap-2 overflow-y-auto pr-2">
            {initialColumnDefs.map(
              (col) =>
                col.field && (
                  <div key={col.field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`col-${col.field}`}
                      checked={!hiddenColumns.includes(col.field)}
                      onChange={(e) =>
                        toggleColumnVisibility(col.field, e.target.checked)
                      }
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
            )}
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
      </ColumnVisibilityModal>

      {isAddModalOpen && (
        <EditModal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddSave}
          data={addInitialData}
          title={title || "Record"}
          batches={batches}
          isAddMode={true} // Add this line
        />
      )}

      {viewData && (
        <ViewModal
          isOpen={true}
          onClose={() => setViewData(null)}
          data={getDisplayedRows()}
          currentIndex={currentViewIndex}
          onNavigate={handleViewNavigation}
          title={title || "Record"}
        />
      )}
      {editData && (
        <EditModal
          isOpen={true}
          onClose={() => setEditData(null)}
          onSave={handleSave}
          data={editData}
          title={title || "Record"}
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
              ? `\n\nRecord: ${deleteConfirmData.fullName || deleteConfirmData.company
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

export default AGGridTable;
