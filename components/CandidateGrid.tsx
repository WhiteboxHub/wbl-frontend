"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
    ModuleRegistry,
    AllCommunityModule,
    ColDef,
    GridReadyEvent
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

interface CandidateGridProps {
    rowData: any[];
    columnDefs: ColDef[];
    loading?: boolean;
    height?: string;
    paginationPageSize?: number;
    rowHeight?: number;
    /** When true, disables AG Grid client pagination (use with server-backed pages). */
    suppressClientPagination?: boolean;
    onGridReady?: (params: GridReadyEvent) => void;
    onSelectionChanged?: (selectedRows: any[]) => void;
    onRowClicked?: (data: any) => void;
    components?: Record<string, any>;
}

export const CandidateGrid: React.FC<CandidateGridProps> = ({
    rowData,
    columnDefs,
    loading = false,
    height = "500px",
    paginationPageSize = 100,
    rowHeight = 48,
    suppressClientPagination = false,
    onGridReady,
    components,
    onSelectionChanged,
    onRowClicked
}) => {
    const gridRef = useRef<AgGridReact>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Detect dark mode to apply proper theme
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

    return (
        <div className="w-full h-full flex flex-col min-h-0">
            <div
                className={`ag-theme-alpine ${isDarkMode ? "ag-grid-dark-mode" : ""} w-full h-full flex-1 rounded-lg border border-gray-200 shadow-sm dark:border-gray-700 overflow-hidden`}
            >
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={{
                        resizable: true,
                        sortable: true,
                        filter: true,
                        filterParams: {
                            debounceMs: 500,
                            suppressAndOrCondition: true,
                        },
                        cellClass: "custom-cell-style",
                    }}
                    loading={loading}
                    // When the parent paginates server-side (e.g. CandidateDashboard Jobs tab)
                    // we MUST disable AG Grid's own pagination AND hide the panel — otherwise
                    // some AG Grid versions still render the "1 to N of M · Page X of Y"
                    // panel at the bottom even with pagination={false}.
                    pagination={!suppressClientPagination}
                    suppressPaginationPanel={suppressClientPagination}
                    paginationAutoPageSize={false}
                    {...(suppressClientPagination
                        ? {}
                        : {
                            paginationPageSize,
                            paginationPageSizeSelector: [10, 25, 50, 100],
                        })}
                    animateRows={true}
                    rowHeight={rowHeight}
                    theme="legacy"
                    onGridReady={onGridReady}
                    rowSelection={{
                        mode: "singleRow",
                        enableClickSelection: true,
                        checkboxes: false,
                    }}
                    getRowId={(params) => params.data.id?.toString() || params.data._id?.toString()}
                    suppressRowDeselection={true}
                    onSelectionChanged={(e) => {
                        const rows = e.api.getSelectedRows();
                        onSelectionChanged?.(rows);
                    }}
                    onRowClicked={(e) => {
                        e.node.setSelected(true);
                        onSelectionChanged?.([e.data]);
                        onRowClicked?.(e.data);
                    }}
                    components={components}
                    stopEditingWhenCellsLoseFocus={true}
                    overlayNoRowsTemplate="<span class='text-gray-500 font-medium'>No records found</span>"
                />
            </div>
        </div>
    );
};

export default CandidateGrid;
