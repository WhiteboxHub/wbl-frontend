"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

export default function OutreachEmailPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [emails, setEmails] = useState<any[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoader = useMinimumLoadingTime(loading);
  const [error, setError] = useState("");

  const columnDefs: ColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      pinned: "left",
      editable: false,
    },
    {
      field: "email",
      headerName: "Email",
      width: 280,
      editable: true,
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: [
          "ACTIVE",
          "PAUSED",
          "SUPPRESSED",
          "UNSUBSCRIBED",
          "INVALID",
          "BOUNCED",
          "COMPLAINED",
        ],
      },
    },
    {
      field: "validation_status",
      headerName: "Validation Status",
      width: 180,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: [
          "VALID",
          "EMAIL_INVALID",
          "DOMAIN_INVALID",
          "MAILBOX_INVALID",
          "UNKNOWN",
        ],
      },
    },
    {
      field: "bounce_type",
      headerName: "Bounce Type",
      width: 160,
      editable: true,
    },
    {
      field: "failure_type",
      headerName: "Failure Type",
      width: 220,
      editable: true,
    },
    {
      field: "suppression_source",
      headerName: "Suppression Source",
      width: 180,
      editable: true,
    },
    {
      field: "send_attempt_count",
      headerName: "Attempts",
      width: 120,
      editable: true,
    },
    {
      field: "provider_name",
      headerName: "Provider",
      width: 160,
      editable: true,
    },
    {
      field: "provider_message_id",
      headerName: "Provider Message ID",
      width: 300,
      editable: true,
    },
    {
      field: "last_email_sent_at",
      headerName: "Last Sent",
      width: 180,
      editable: false,
    },
    {
      field: "last_attempted_at",
      headerName: "Last Attempt",
      width: 180,
      editable: false,
    },
    {
      field: "unsubscribed_at",
      headerName: "Unsubscribed At",
      width: 180,
      editable: false,
    },
    {
      field: "bounced_at",
      headerName: "Bounced At",
      width: 180,
      editable: false,
    },
    {
      field: "complained_at",
      headerName: "Complained At",
      width: 180,
      editable: false,
    },
    {
      field: "failed_at",
      headerName: "Failed At",
      width: 180,
      editable: false,
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 180,
      editable: false,
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      width: 180,
      editable: false,
    },
  ];

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await cachedApiFetch("/outreach-emails");

      const arr = Array.isArray(res)
        ? res
        : res?.data ?? [];
      const sortedEmails = arr
        .slice()
        .sort((a: any, b: any) => b.id - a.id);

      setEmails(sortedEmails);
      setFilteredEmails(sortedEmails);

      toast.success("Fetched outreach emails successfully.");
    } catch (e: any) {
      const msg =
        e?.body ||
        e?.message ||
        "Failed to fetch outreach emails";

      setError(
        typeof msg === "string"
          ? msg
          : JSON.stringify(msg)
      );

      toast.error(
        typeof msg === "string"
          ? msg
          : JSON.stringify(msg)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();

    if (!lower) {
      setFilteredEmails(emails);
      return;
    }

    const filtered = emails.filter((row) => {
      return Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(lower)
      );
    });

    setFilteredEmails(filtered);
  }, [searchTerm, emails]);

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await apiFetch(`/outreach-emails/${updatedRow.id}`, {
        method: "PUT",
        body: updatedRow,
      });

      await invalidateCache("/outreach-emails");

      const updated = emails
        .map((e) =>
          e.id === updatedRow.id
            ? updatedRow
            : e
        )
        .slice()
        .sort((a, b) => b.id - a.id);

      setEmails(updated);
      setFilteredEmails(updated);

      toast.success("Row updated successfully.");
    } catch (e: any) {
      const msg =
        e?.body ||
        e?.message ||
        "Failed to update outreach email";

      toast.error(
        typeof msg === "string"
          ? msg
          : JSON.stringify(msg)
      );
    }
  };

  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/outreach-emails/${id}`, {
        method: "DELETE",
      });

      await invalidateCache("/outreach-emails");

      const updated = emails.filter(
        (e) => e.id !== id
      );

      setEmails(updated);
      setFilteredEmails(updated);

      toast.success(`Email ${id} deleted.`);
    } catch (e: any) {
      const msg =
        e?.body ||
        e?.message ||
        "Failed to delete outreach email";

      toast.error(
        typeof msg === "string"
          ? msg
          : JSON.stringify(msg)
      );
    }
  };

  if (showLoader) return <Loader />;

  if (error) {
    return (
      <p className="text-center mt-8 text-red-600">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Outreach Emails
          </h1>
          <p>Manage outreach email records here.</p>
        </div>
      </div>

      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>

        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

          <Input
            id="search"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search emails..."
            className="pl-10"
          />
        </div>
      </div>

      <AGGridTable
        rowData={filteredEmails}
        columnDefs={columnDefs}
        title={`Outreach Emails (${filteredEmails.length})`}
        height="calc(70vh)"
        showSearch={false}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        onRowAdded={async (newRow: any) => {
          try {
            const payload = {
              email: newRow.email || "",
              status: newRow.status || "ACTIVE",
              validation_status:
                newRow.validation_status || "VALID",
            };

            if (!payload.email) {
              toast.error("Email is required");
              return;
            }

            const res = await apiFetch(
              "/outreach-emails",
              {
                method: "POST",
                body: payload,
              }
            );

            await invalidateCache(
              "/outreach-emails"
            );

            const created = Array.isArray(res)
              ? res
              : res?.data ?? res;

            const updated = [created, ...emails]
              .slice()
              .sort(
                (a: any, b: any) =>
                  b.id - a.id
              );

            setEmails(updated);
            setFilteredEmails(updated);

            toast.success(
              "Outreach email created"
            );
          } catch (e: any) {
            const msg =
              e?.body ||
              e?.message ||
              "Failed to create outreach email";

            toast.error(
              typeof msg === "string"
                ? msg
                : JSON.stringify(msg)
            );
          }
        }}
      />
    </div>
  );
}