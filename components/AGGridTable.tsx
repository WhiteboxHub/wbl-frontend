
// "use client";
// // import { ModuleRegistry } from "ag-grid-community";
// import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { useMemo, useCallback, useRef, useState, useEffect } from "react";
// import { AgGridReact } from "ag-grid-react";
// import {
//   ColDef,
//   GridReadyEvent,
//   ColumnMovedEvent,
//   CellValueChangedEvent,
//   GridApi
// } from "ag-grid-community";
// import { Button } from "@/components/admin_ui/button";
// import { EyeIcon, EditIcon, TrashIcon, DownloadIcon } from "lucide-react";
// import { ViewModal } from "./ViewModal";
// import { EditModal } from "@/components/EditModal";
// import { ConfirmDialog } from "@/components/ConfirmDialog";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";
// import "@/styles/admin.css";

// // Register AG-Grid modules
// ModuleRegistry.registerModules([AllCommunityModule]);

// interface AGGridTableProps {
//   rowData: any[];
//   columnDefs: ColDef[];
//   loading?: boolean;
//   defaultColDef?: ColDef;
//   onRowClicked?: (data: any) => void;
//   onRowUpdated?: (data: any) => void;
//   onRowDeleted?: (id: string | number) => void;
//   title?: string;
//   showSearch?: boolean;
//   showFilters?: boolean;
//   height?: string;
//   overlayNoRowsTemplate?: string;
//   batches?: any[]; // Add batches prop
// }

// interface RowData {
//   id?: string | number;
//   sessionid?: string | number;
//   leadid?: string | number;
//   candidateid?: string | number;
//   batchid?: string | number;
//   fullName?: string;
//   company?: string;
//   [key: string]: any;
// }

// export function AGGridTable({
//   rowData,
//   columnDefs: initialColumnDefs,
//   loading = false,
//   onRowClicked,
//   onRowUpdated,
//   onRowDeleted,
//   overlayNoRowsTemplate, 
//   title,
//   showSearch = true,
//   showFilters = true,
//   height = "400px",
//   batches // Add batches with default empty array
// }: AGGridTableProps) {
//   const gridRef = useRef<AgGridReact>(null);
//   const gridApiRef = useRef<GridApi | null>(null);
//   const [searchText, setSearchText] = useState("");
//   const [selectedRowData, setSelectedRowData] = useState<RowData[] | null>(null);
//   const [viewData, setViewData] = useState<RowData | null>(null);
//   const [editData, setEditData] = useState<RowData | null>(null);
//   const [deleteConfirmData, setDeleteConfirmData] = useState<RowData | null>(null);
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [columnDefs, setColumnDefs] = useState<ColDef[]>(initialColumnDefs);

//   // Detect dark mode
//   useEffect(() => {
//     const checkDarkMode = () => {
//       setIsDarkMode(document.documentElement.classList.contains("dark"));
//     };
//     checkDarkMode();
//     const observer = new MutationObserver(checkDarkMode);
//     observer.observe(document.documentElement, {
//       attributes: true,
//       attributeFilter: ["class"],
//     });
//     return () => observer.disconnect();
//   }, []);

//   const paginationNumberFormatter = useCallback((params: any) => {
//     return `${params.value.toLocaleString()}`;
//   }, []);

//   const onGridReady = useCallback((params: GridReadyEvent) => {
//     gridApiRef.current = params.api;
//   }, []);

//   const handleRowSelection = useCallback(() => {
//     if (gridApiRef.current) {
//       const selectedRows = gridApiRef.current.getSelectedRows() as RowData[];
//       setSelectedRowData(selectedRows.length > 0 ? selectedRows : null);
//     }
//   }, []);

//   const onColumnMoved = useCallback((event: ColumnMovedEvent) => {
//     const newColumnDefs = event.api.getColumnDefs();
//     setColumnDefs(newColumnDefs as ColDef[]);
//   }, []);

//   const handleView = useCallback(() => {
//     if (selectedRowData && selectedRowData.length > 0) {
//       setEditData(null);
//       setViewData(selectedRowData[0]);
//     }
//   }, [selectedRowData]);

//   const handleEdit = useCallback(() => {
//     if (selectedRowData && selectedRowData.length > 0) {
//       setViewData(null);
//       setEditData(selectedRowData[0]);
//     }
//   }, [selectedRowData]);

//   const handleDelete = useCallback(() => {
//     if (selectedRowData && selectedRowData.length > 0) {
//       setDeleteConfirmData(selectedRowData[0]);
//     }
//   }, [selectedRowData]);

//   const confirmDelete = useCallback(() => {
//     if (deleteConfirmData && onRowDeleted) {
//       if (deleteConfirmData.leadid) {
//         onRowDeleted(deleteConfirmData.leadid);
//       } else if (deleteConfirmData.candidateid) {
//         onRowDeleted(deleteConfirmData.candidateid);
//       } else if (deleteConfirmData.id) {
//         onRowDeleted(deleteConfirmData.id);
//       } else if (deleteConfirmData.batchid) {
//         onRowDeleted(deleteConfirmData.batchid);
//       } else if (deleteConfirmData.sessionid) {
//         onRowDeleted(deleteConfirmData.sessionid);
//       }
//       setSelectedRowData(null);
//       setDeleteConfirmData(null);
//     }
//   }, [deleteConfirmData, onRowDeleted]);

//   const cancelDelete = useCallback(() => {
//     setDeleteConfirmData(null);
//   }, []);

//   const handleSave = useCallback(
//     (updatedData: RowData) => {
//       if (onRowUpdated) {
//         onRowUpdated(updatedData);
//       }
//       setEditData(null);
//       setSelectedRowData(null);
//     },
//     [onRowUpdated]
//   );

//   const closeViewModal = useCallback(() => {
//     setViewData(null);
//   }, []);

//   const closeEditModal = useCallback(() => {
//     setEditData(null);
//   }, []);

//   const onRowClickedHandler = useCallback(
//     (event: any) => {
//       if (onRowClicked) {
//         onRowClicked(event);
//       }
//     },
//     [onRowClicked]
//   );

//   const onCellValueChanged = useCallback(
//     (event: CellValueChangedEvent) => {
//       console.log("Cell value changed:", event.data);
//       if (onRowUpdated) {
//         onRowUpdated(event.data);
//       }
//     },
//     [onRowUpdated]
//   );

//   const handleDownload = useCallback(() => {
//     if (gridApiRef.current) {
//       gridApiRef.current.exportDataAsCsv({
//         fileName: `${title || "grid-data"}.csv`,
//       });
//     }
//   }, [title]);

//   return (
//     <div className="mx-auto space-y-4 w-full max-w-7xl">
//       <div className="flex items-center justify-between">
//         <div>
//           {title && (
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
//               {title}
//             </h3>
//           )}
//         </div>
//         <div className="flex items-center space-x-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleView}
//             disabled={!selectedRowData || selectedRowData.length === 0}
//             className="h-8 w-8 p-0"
//             title="View"
//           >
//             <EyeIcon className="h-4 w-4" />
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleEdit}
//             disabled={!selectedRowData || selectedRowData.length === 0}
//             className="h-8 w-8 p-0"
//             title="Edit"
//           >
//             <EditIcon className="h-4 w-4" />
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleDelete}
//             disabled={!selectedRowData || selectedRowData.length === 0}
//             className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400"
//             title="Delete"
//           >
//             <TrashIcon className="h-4 w-4" />
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleDownload}
//             className="h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400"
//             title="Download CSV"
//           >
//             <DownloadIcon className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>
//       <div className="flex justify-center">
//         <div
//           className={`ag-theme-alpine ${isDarkMode ? "ag-grid-dark-mode" : ""
//             } rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 w-full`}
//           style={{
//             height: "calc(100vh - 260px)",
//             minHeight: "400px",
//           }}
//         >
//           <AgGridReact
//             ref={gridRef}
//             rowData={rowData}
//             columnDefs={columnDefs}
//             onGridReady={onGridReady}
//             onRowClicked={onRowClickedHandler}
//             onSelectionChanged={handleRowSelection}
//             onColumnMoved={onColumnMoved}
//             onCellValueChanged={onCellValueChanged}
//             animateRows={true}
//             loading={loading}
//             overlayNoRowsTemplate={overlayNoRowsTemplate}
//             theme="legacy"
//             defaultColDef={{
//               resizable: true,
//               sortable: true,
//               filter: true,
//               cellClass: "custom-cell-style",
//               editable: true,
//             }}
//             rowSelection="multiple"
//             suppressRowClickSelection={false}
//             pagination={true}
//             paginationPageSize={50}
//             paginationPageSizeSelector={[10, 25, 50, 100]}
//             paginationNumberFormatter={paginationNumberFormatter}
//             maintainColumnOrder={true}
//           />
//         </div>
//       </div>
//       {viewData && (
//         <ViewModal
//           isOpen={true}
//           onClose={closeViewModal}
//           data={viewData}
//           title={title || "Record"}
//         />
//       )}
//       {editData && (
//         <EditModal
//           isOpen={true}
//           onClose={closeEditModal}
//           onSave={handleSave}
//           data={editData}
//           title={title || "Record"}
//           batches={batches} // Pass batches to EditModal
//         />
//       )}
//       {deleteConfirmData && (
//         <ConfirmDialog
//           isOpen={true}
//           onClose={cancelDelete}
//           onConfirm={confirmDelete}
//           title="Delete Record"
//           message={`Are you sure you want to delete this record? This action cannot be undone.${deleteConfirmData.fullName || deleteConfirmData.company
//               ? `\n\nRecord: ${deleteConfirmData.fullName || deleteConfirmData.company
//               }`
//               : ""
//             }`}
//           confirmText="Delete"
//           cancelText="Cancel"
//         />
//       )}
//     </div>
//   );
// }

// export default AGGridTable;









"use client";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import { ColDef, GridReadyEvent, ColumnMovedEvent, CellValueChangedEvent, GridApi } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { Button } from "@/components/admin_ui/button";
import { EyeIcon, EditIcon, TrashIcon, DownloadIcon, SettingsIcon } from "lucide-react";
import { ViewModal } from "./ViewModal";
import { EditModal } from "@/components/EditModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/styles/admin.css";


// Simple modal component
const ColumnVisibilityModal = ({
  isOpen,
  onClose,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[425px] p-4" onClick={(e) => e.stopPropagation()}>
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
  onRowDeleted?: (id: string | number) => void;
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  height?: string;
  overlayNoRowsTemplate?: string;
  batches?: any[];
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
  onRowDeleted,
  overlayNoRowsTemplate = "No rows to show",
  title,
  showSearch = true,
  showFilters = true,
  height = "400px",
  batches = []
}: AGGridTableProps) {
  // Refs and State
  const gridRef = useRef<AgGridReact>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<RowData[] | null>(null);
  const [viewData, setViewData] = useState<RowData | null>(null);
  const [editData, setEditData] = useState<RowData | null>(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState<RowData | null>(null);
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
      localStorage.setItem(`hiddenColumns-${title}`, JSON.stringify(hiddenColumns));
    }
  }, [hiddenColumns, title]);

  // Filter out hidden columns
  const visibleColumnDefs = useMemo(() => {
    return initialColumnDefs.filter(col => {
      if (!col.field) return true; // Always show columns without fields
      return !hiddenColumns.includes(col.field);
    });
  }, [initialColumnDefs, hiddenColumns]);

  // AG-Grid Callbacks
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
      const selectedRows = gridApiRef.current.getSelectedRows() as RowData[];
      setSelectedRowData(selectedRows.length > 0 ? selectedRows : null);
    }
  }, []);

  const onColumnMoved = useCallback((event: ColumnMovedEvent) => {
    // Handle column reordering if needed
  }, []);

  // Row Action Handlers
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

  const handleSave = useCallback((updatedData: RowData) => {
    if (onRowUpdated) onRowUpdated(updatedData);
    setEditData(null);
    setSelectedRowData(null);
  }, [onRowUpdated]);

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    if (onRowUpdated) onRowUpdated(event.data);
  }, [onRowUpdated]);

  const handleDownload = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.exportDataAsCsv({
        fileName: `${title || "grid-data"}.csv`,
      });
    }
  }, [title]);

  // Column visibility handlers
  const toggleColumnVisibility = useCallback((field: string, isVisible: boolean) => {
    setHiddenColumns(prev => isVisible
      ? prev.filter(col => col !== field)
      : [...prev, field]
    );
  }, []);

  const resetColumns = useCallback(() => {
    setHiddenColumns([]);
  }, []);

  // Pagination formatter
  const paginationNumberFormatter = useCallback((params: any) => {
    return `${params.value.toLocaleString()}`;
  }, []);

  return (
    <div className="mx-auto space-y-4 w-full max-w-7xl flex-row-reverse">
    
      <div className="flex items-center justify-between justify-end">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        )}
        <div className="flex items-center space-x-2  ml-auto">
          
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
          className={`ag-theme-alpine ${isDarkMode ? "ag-grid-dark-mode" : ""} rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm w-full`}
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
          />
        </div>
      </div>

      <ColumnVisibilityModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
      >
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
      </ColumnVisibilityModal>
      
      {viewData && (
        <ViewModal
          isOpen={true}
          onClose={() => setViewData(null)}
          data={viewData}
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
            ? `\n\nRecord: ${deleteConfirmData.fullName || deleteConfirmData.company}`
            : ""}`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}

export default AGGridTable;
