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
}

export const CandidateGrid: React.FC<CandidateGridProps> = ({
    rowData,
    columnDefs,
    loading = false,
    height = "500px",
    paginationPageSize = 50,
    rowHeight = 48
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
        <div className="flex justify-center w-full min-w-0">
            <div
                className={`ag-theme-alpine ${isDarkMode ? "ag-grid-dark-mode" : ""} w-full rounded-lg border border-gray-200 shadow-sm dark:border-gray-700 overflow-hidden`}
                style={{ height }}
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
                    pagination={true}
                    paginationPageSize={paginationPageSize}
                    paginationPageSizeSelector={[10, 25, 50, 100]}
                    animateRows={true}
                    rowHeight={rowHeight}
                    theme="legacy"
                    overlayNoRowsTemplate="<span class='text-gray-500 font-medium'>No records found</span>"
                />
            </div>
        </div>
    );
};

export default CandidateGrid;
