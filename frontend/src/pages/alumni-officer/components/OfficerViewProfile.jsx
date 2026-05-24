import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  IdCard,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  displayStatus,
  formatDate,
  getAlumniName,
  normalizeAlumni,
  normalizeListResponse,
  safe,
} from "./officerManageUsersUtils";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const BB = "#3D398C";

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

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-3 break-words text-sm font-semibold text-foreground">
        {safe(value) || "—"}
      </p>
    </div>
  );
}

export default function OfficerViewProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fullName = useMemo(() => getAlumniName(profile || {}), [profile]);
  const isActive = String(profile?.status || "active").toLowerCase() === "active";

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let record = null;

      try {
        record = await apiRequest(`/alumni/${userId}/`);
      } catch {
        const data = await apiRequest("/alumni/");
        const list = normalizeListResponse(data).map(normalizeAlumni);
        record = list.find((item) => String(item.id) === String(userId)) || null;
      }

      if (!record) {
        throw new Error("Alumni profile was not found.");
      }

      setProfile(normalizeAlumni(record));
    } catch (err) {
      setProfile(null);
      setError(err?.message || "Failed to load alumni profile.");
      toast.error("Failed to load alumni profile", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#3D398C]" />
          <span className="text-sm text-muted-foreground">Loading alumni profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/alumni-officer/alumni")}
          className="gap-1.5 px-0 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Manage Alumni
        </Button>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/alumni-officer/alumni")}
          className="mb-4 gap-1.5 px-0 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Manage Alumni
        </Button>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-[#3D398C]/5 px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: BB }}
                >
                  {(fullName || "AL").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">{fullName}</h1>
                    <Badge
                      variant="outline"
                      className={
                        isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }
                    >
                      {displayStatus(profile?.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{profile?.email || "No email available"}</p>
                </div>
              </div>

              <Button type="button" variant="outline" size="sm" onClick={loadProfile} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            <InfoCard icon={UserRound} label="Full Name" value={fullName} />
            <InfoCard icon={IdCard} label="Student ID" value={profile?.studentId} />
            <InfoCard icon={Mail} label="Email" value={profile?.email} />
            <InfoCard icon={Phone} label="Contact Number" value={profile?.contactNumber} />
            <InfoCard icon={GraduationCap} label="Course" value={profile?.course} />
            <InfoCard icon={GraduationCap} label="Graduation Year" value={profile?.graduationYear} />
            <InfoCard icon={ShieldCheck} label="Status" value={displayStatus(profile?.status)} />
            <InfoCard icon={CalendarDays} label="Created At" value={formatDate(profile?.createdAt)} />
            <InfoCard icon={CalendarDays} label="Updated At" value={formatDate(profile?.updatedAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}
