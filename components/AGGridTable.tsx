
// "use client"

// import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
// ModuleRegistry.registerModules([AllCommunityModule]);

// import { useMemo, useCallback, useRef, useState, useEffect } from "react";
// import { AgGridReact } from "ag-grid-react";
// import { ColDef, GridReadyEvent, GridApi } from "ag-grid-community";
// import { Button } from "@/components/admin_ui/button";
// import { SearchIcon, ExpandIcon, EyeIcon, EditIcon, TrashIcon } from "lucide-react";
// import { ViewModal } from "./ViewModal";
// import { EditModal } from "@/components/EditModal";
// import { ConfirmDialog } from "@/components/ConfirmDialog";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";
// import "@/styles/admin.css";

// interface AGGridTableProps {
//   rowData: any[];
//   columnDefs: ColDef[];
//   defaultColDef?: ColDef;
//   onRowClicked?: (data: any) => void;
//   onRowUpdated?: (data: any) => void;
//   onRowDeleted?: (id: string | number) => void;
//   title?: string;
//   showSearch?: boolean;
//   showFilters?: boolean;
//   height?: string;
// }

// interface RowData {
//   id?: string | number;
//   sessionid?: string | number;
//   leadid?: string | number;
//   candidateid?: string | number;
//   batchid?: string | number;
//   fullName?: string;
//   company?: string;
// }

// export function AGGridTable({
//   rowData,
//   columnDefs,
//   onRowClicked,
//   onRowUpdated,
//   onRowDeleted,
//   title,
//   showSearch = true,
//   showFilters = true,
//   height = "400px",
// }: AGGridTableProps) {
//   const gridRef = useRef<AgGridReact>(null);
//   const [gridApi, setGridApi] = useState<GridApi | null>(null);
//   const [searchText, setSearchText] = useState("");
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [selectedRowData, setSelectedRowData] = useState<RowData | null>(null);
//   const [viewData, setViewData] = useState<RowData | null>(null);
//   const [editData, setEditData] = useState<RowData | null>(null);
//   const [deleteConfirmData, setDeleteConfirmData] = useState<RowData | null>(null);
//   const [isDarkMode, setIsDarkMode] = useState(false);

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
//   // inside AGGridTable component

//   const getFilteredData = useCallback(() => {
//     if (!gridApi) return [];
//     const filteredRows: any[] = [];
//     gridApi.forEachNodeAfterFilter((node) => {
//       if (node.data) {
//         filteredRows.push(node.data);
//       }
//     });
//     return filteredRows;
//   }, [gridApi]);

//   const handleExportFiltered = useCallback(() => {
//     const filtered = getFilteredData();
//     console.log("Filtered Data:", filtered);
//     alert(`Found ${filtered.length} rows after filter! (Check console for details)`);
//   }, [getFilteredData]);


//   const onGridReady = useCallback((params: GridReadyEvent) => {
//     setGridApi(params.api);
//   }, []);

//   // const toggleExpand = useCallback(() => {
//   //   setIsExpanded((prev) => !prev);
//   // }, []);

//   const refreshData = useCallback(() => {
//     if (gridApi) {
//       gridApi.refreshCells();
//     }
//   }, [gridApi]);

//   const handleRowSelection = useCallback(() => {
//     if (gridApi) {
//       const selectedRows = gridApi.getSelectedRows();
//       setSelectedRowData(selectedRows.length > 0 ? selectedRows[0] : null);
//     }
//   }, [gridApi]);

//   const handleView = useCallback(() => {
//     if (selectedRowData) {
//       setEditData(null);
//       setViewData(selectedRowData);
//     } else {
//       alert("Please select a row first");
//     }
//   }, [selectedRowData]);

//   const handleEdit = useCallback(() => {
//     if (selectedRowData) {
//       setViewData(null);
//       setEditData(selectedRowData);
//     } else {
//       alert("Please select a row first");
//     }
//   }, [selectedRowData]);

//   const handleDelete = useCallback(() => {
//     if (selectedRowData) {
//       setDeleteConfirmData(selectedRowData);
//     } else {
//       alert("Please select a row first");
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
//       setSelectedRowData(event.data);
//       if (onRowClicked) {
//         onRowClicked(event);
//       }
//       if (gridApi) {
//         gridApi.deselectAll();
//         event.node.setSelected(true);
//       }
//     },
//     [onRowClicked, gridApi]
//   );

//   const onCellClickedHandler = useCallback(
//     (event: any) => {
//       if (gridApi) {
//         gridApi.deselectAll();
//         setSelectedRowData(null);
//       }
//     },
//     [gridApi]
//   );

//   return (
//     <div className={`mx-auto space-y-4 ${isExpanded ? "w-full" : "w-full max-w-7xl"}`}>
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
//             disabled={!selectedRowData}
//             className="h-8 w-8 p-0"
//             title="View"
//           >
//             <EyeIcon className="h-4 w-4" />
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleEdit}
//             disabled={!selectedRowData}
//             className="h-8 w-8 p-0"
//             title="Edit"
//           >
//             <EditIcon className="h-4 w-4" />
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleDelete}
//             disabled={!selectedRowData}
//             className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400"
//             title="Delete"
//           >
//             <TrashIcon className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>

//       <div className="flex justify-center">
//         <div
//           className={`ag-theme-alpine ${isDarkMode ? "ag-grid-dark-mode" : ""} rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ${isExpanded ? "w-full" : "w-full max-w-6xl"
//             }`}
//           style={{
//             height: "calc(100vh - 200px)",
//             minHeight: "400px",
//           }}
//         >
//           <AgGridReact
//             ref={gridRef}
//             rowData={rowData || []}
//             columnDefs={columnDefs}
//             onGridReady={onGridReady}
//             onRowClicked={onRowClickedHandler}
//             onCellClicked={onCellClickedHandler}
//             onSelectionChanged={handleRowSelection}
//             animateRows={true}
//             theme="legacy"
//             defaultColDef={{
//               resizable: true,
//               sortable: true,
//               filter: true,
//               cellClass: 'custom-cell-style',
//             }}
//             rowModelType="infinite"
//             datasource={}
//             rowSelection="single"
//             rowMultiSelectWithClick={false}
//             suppressRowClickSelection={false}
//             suppressCellFocus={false}
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

import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent, GridApi } from "ag-grid-community";
import { Button } from "@/components/admin_ui/button";
import {
  EyeIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
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
  const gridApiRef = useRef<GridApi | null>(null);

  const [searchText, setSearchText] = useState("");
  const [selectedRowData, setSelectedRowData] = useState<RowData | null>(null);
  const [viewData, setViewData] = useState<RowData | null>(null);
  const [editData, setEditData] = useState<RowData | null>(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState<RowData | null>(
    null
  );
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Pagination state
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

  const gridOptions = {
    defaultColDef: {
      editable: true,        // required to allow copy
      resizable: true,
      sortable: true,
      filter: true,
    },
    enableRangeSelection: true,  // allows selecting cells
    suppressCopySingleCellRanges: false, // optional
  };


  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);
  const rowSelection = {
    mode: 'multiRow',
    checkboxes: false,
    headerCheckbox: false,
    enableSelectionWithoutKeys: true,
    enableClickSelection: true,
  };


  const handleRowSelection = useCallback(() => {
    if (gridApiRef.current) {
      const selectedRows = gridApiRef.current.getSelectedRows();
      setSelectedRowData(selectedRows.length > 0 ? selectedRows[0] : null);
    }
  }, []);

  const handleView = useCallback(() => {
    if (selectedRowData) {
      setEditData(null);
      setViewData(selectedRowData);
    }
  }, [selectedRowData]);

  const handleEdit = useCallback(() => {
    if (selectedRowData) {
      setViewData(null);
      setEditData(selectedRowData);
    }
  }, [selectedRowData]);

  const handleDelete = useCallback(() => {
    if (selectedRowData) {
      setDeleteConfirmData(selectedRowData);
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
      setSelectedRowData(event.data);
      if (onRowClicked) {
        onRowClicked(event);
      }
    },
    [onRowClicked]
  );

  // Pagination logic
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
    setCurrentPage(1); // reset to first page when size changes
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
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className={`ag-theme-alpine ${isDarkMode ? "ag-grid-dark-mode" : ""
            } rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 w-full`}
          style={{
            height: "calc(100vh - 260px)",
            minHeight: "400px",
          }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={paginatedData}
            // rowSelection={rowSelection} 

            columnDefs={columnDefs}
            onGridReady={onGridReady}
            onRowClicked={onRowClickedHandler}
            onSelectionChanged={handleRowSelection}
            animateRows={true}
            theme="legacy"
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true,
              cellClass: "custom-cell-style",
              editable: true
            }}
            // rowSelection="multiple"

            gridOptions={gridOptions}
            // rowSelection="single"
            enableRangeSelection={true}

          />
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
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
      </div>

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
          message={`Are you sure you want to delete this record? This action cannot be undone.${deleteConfirmData.fullName || deleteConfirmData.company
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
