"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api";
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

function getErrorMessage(e: any, fallback = "Something went wrong") {
  const message =
    e?.body?.detail ?? e?.body?.message ?? e?.body ?? e?.message ?? fallback;

  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    return message
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .join(", ");
  }

  try {
    return JSON.stringify(message);
  } catch {
    return fallback;
  }
}

function getOutreachEmailPayload(row: any) {
  return {
    email: row.email,
    status: row.status || "ACTIVE",
    validation_status: row.validation_status || "VALID",
    bounce_type: row.bounce_type || null,
    failure_type: row.failure_type || null,
    provider_name: row.provider_name || null,
    provider_message_id: row.provider_message_id || null,
    send_attempt_count: Number(row.send_attempt_count || 0),
  };
}

export default function OutreachEmailsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [emails, setEmails] = useState<any[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoader = useMinimumLoadingTime(loading);
  const [error, setError] = useState("");

  const statusValues = [
    "ACTIVE",
    "PAUSED",
    "SUPPRESSED",
    "UNSUBSCRIBED",
    "INVALID",
    "BOUNCED",
    "COMPLAINED",
  ];

  const validationValues = [
    "VALID",
    "EMAIL_INVALID",
    "DOMAIN_INVALID",
    "MAILBOX_INVALID",
    "UNKNOWN",
  ];

  const bounceValues = [
    "HARD",
    "SOFT",
    "TRANSIENT",
    "BLOCKED",
    "POLICY",
    "SPAM",
    "UNKNOWN",
  ];

  const failureValues = [
    "EMAIL_INVALID",
    "DOMAIN_INVALID",
    "MAILBOX_INVALID",
    "DNS_FAILURE",
    "SMTP_REJECTED",
    "SPAM_BLOCKED",
    "RATE_LIMITED",
    "TIMEOUT",
    "PROVIDER_ERROR",
    "TEMPLATE_ERROR",
    "SUPPRESSION_LIST",
    "UNKNOWN",
  ];

  const columnDefs: ColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 90,
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
      width: 160,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: statusValues,
      },
    },
    {
      field: "validation_status",
      headerName: "Validation",
      width: 170,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: validationValues,
      },
    },
    {
      field: "bounce_type",
      headerName: "Bounce",
      width: 140,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: bounceValues,
      },
    },
    {
      field: "failure_type",
      headerName: "Failure",
      width: 220,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: failureValues,
      },
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
      width: 140,
      editable: true,
    },
    {
      field: "provider_message_id",
      headerName: "Message Id",
      width: 260,
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
      field: "created_at",
      headerName: "Created",
      width: 180,
      editable: false,
    },
  ];

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching outreach emails...");

      const res = await cachedApiFetch("/outreach-emails/");
      console.log("API Response:", res);

      const arr = Array.isArray(res) ? res : res?.data ?? [];

      const sorted = arr.sort((a: any, b: any) => (b?.id ?? 0) - (a?.id ?? 0));

      setEmails(sorted);
      setFilteredEmails(sorted);

      toast.success("Fetched outreach emails.");
    } catch (e: any) {
      console.error("Outreach Emails API Error:", e);

      const msg = getErrorMessage(e, "Failed to fetch");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    const search = searchTerm.toLowerCase();

    if (!search) {
      setFilteredEmails(emails);
      return;
    }

    setFilteredEmails(
      emails.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(search)
        )
      )
    );
  }, [searchTerm, emails]);

  const handleRowUpdated = async (row: any) => {
    try {
      const payload = getOutreachEmailPayload(row);

      await apiFetch(`/outreach-emails/${row.id}/`, {
        method: "PUT",
        body: payload,
      });

      await invalidateCache("/outreach-emails/");

      const updated = emails.map((e) =>
        e.id === row.id ? { ...e, ...payload } : e
      );

      setEmails(updated);
      setFilteredEmails(updated);

      toast.success("Updated successfully");
    } catch (e: any) {
      toast.error(getErrorMessage(e, "Failed to update outreach email"));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/outreach-emails/${id}/`, { method: "DELETE" });

      await invalidateCache("/outreach-emails/");

      const updated = emails.filter((e) => e.id !== id);

      setEmails(updated);
      setFilteredEmails(updated);

      toast.success("Deleted");
    } catch (e: any) {
      toast.error(getErrorMessage(e, "Failed to delete outreach email"));
    }
  };

  if (showLoader) return <Loader />;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">Outreach Emails</h1>
        <p>Manage outreach email workflow.</p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>
          <button className="ml-4 font-medium underline" onClick={fetchEmails}>
            Retry
          </button>
        </div>
      )}

      {/* Search */}
      <div className="max-w-md">
        <Label>Search</Label>

        <div className="relative mt-2">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

          <Input
            className="pl-10"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <AGGridTable
        title={`Outreach Emails (${filteredEmails.length})`}
        rowData={filteredEmails}
        columnDefs={columnDefs}
        height="75vh"
        showSearch={false}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleDelete}
        onRowAdded={async (row: any) => {
          try {
            if (!row.email) {
              toast.error("Email is required");
              return;
            }

            const payload = getOutreachEmailPayload(row);

            const res = await apiFetch("/outreach-emails/", {
              method: "POST",
              body: payload,
            });

            await invalidateCache("/outreach-emails/");
            const created = Array.isArray(res) ? res : res?.data ?? res;

            if (!created) {
              toast.error("Email was saved, but the server returned no data");
              await fetchEmails();
              return;
            }

            const createdList = Array.isArray(created) ? created : [created];

            const updated = [...createdList, ...emails].sort(
              (a: any, b: any) => (b?.id ?? 0) - (a?.id ?? 0)
            );

            setEmails(updated);
            setFilteredEmails(updated);

            toast.success("Email added");
          } catch (e: any) {
            toast.error(getErrorMessage(e, "Failed to add outreach email"));
          }
        }}
      />
    </div>
  );
}
