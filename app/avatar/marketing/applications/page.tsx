"use client";

import React from "react";

export default function ApplicationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Applications
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Track job applications and their statuses</p>
                </div>
            </div>
            <div className="rounded-xl border border-dashed border-gray-300 p-12 dark:border-gray-700">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    Application tracking module coming soon.
                </div>
            </div>
        </div>
    );
}
