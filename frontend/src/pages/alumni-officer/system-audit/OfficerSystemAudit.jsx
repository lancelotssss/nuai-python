// src/pages/alumni-officer/system-audit/OfficerSystemAudit.jsx

import { useEffect, useMemo, useState } from "react";

import PageTitle from "@/components/PageTitle";
import ViewLogs from "../../public/ViewLogs";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function prettyError(err) {
  return (err?.message || "Failed to load system audit logs").replace(
    /^FirebaseError:\s*/i,
    "",
  );
}

function safe(value) {
  return String(value ?? "").trim();
}

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null");
  } catch {
    return null;
  }
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.detail ||
      Object.values(data || {})?.flat?.()?.[0] ||
      "Request failed.";

    throw new Error(String(message));
  }

  return data;
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeAuditRow(row) {
  return {
    ...row,
    id: row.id,
    actorEmail: row.actor_email || row.actorEmail || "",
    actorRole: row.actor_role || row.actorRole || "",
    action: row.action || "",
    details: row.details || "",
    meta: row.metadata || row.meta || {},
    createdAt: row.created_at || row.createdAt || row.timestamp || "",
  };
}

export default function OfficerSystemAudit() {
  const account = useMemo(() => getStoredAccount(), []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const actorEmail = safe(account?.email);
  const actorRole = safe(account?.role) || "Alumni Officer";

  async function fetchAuditLogs() {
    setLoading(true);
    setErr("");

    try {
      if (!actorEmail) {
        setRows([]);
        return;
      }

      const data = await apiRequest("/system-audit/");
      const list = normalizeListResponse(data).map(normalizeAuditRow);

      const filtered = list
        .filter(
          (row) =>
            safe(row.actorEmail).toLowerCase() === actorEmail.toLowerCase(),
        )
        .sort((a, b) => {
          const left = new Date(a.createdAt).getTime();
          const right = new Date(b.createdAt).getTime();
          return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
        });

      setRows(filtered);
    } catch (e) {
      setErr(prettyError(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorEmail]);

  const actorLabel = useMemo(() => actorEmail || "—", [actorEmail]);

  return (
    <>
      <PageTitle title="System Audit | Alumni Officer | NUAI" />

      <ViewLogs
        title="My System Audit"
        description="Review your personal recorded system activity and recent actions across the Alumni Affairs Officer portal."
        rows={rows}
        loading={loading}
        error={err}
        onRefresh={fetchAuditLogs}
        actorLabel={actorLabel}
        actorRole={actorRole}
        searchPlaceholder="Search your details, action, or meta..."
        emptyTitle="No personal audit logs found"
        emptyDescription="No rows match your current search or filter."
      />
    </>
  );
}
