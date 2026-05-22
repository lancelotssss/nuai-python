import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Shield,
  Building2,
  Loader2,
  AlertCircle,
  UserCheck,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const BRAND_BLUE = "#3D398C";

const ADMIN_ROLES = ["Alumni Officer", "AILPO", "Registrar", "Faculty"];

const CACHE_KEY = "super_admin_manage_administrators_counts_django_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

const departmentConfig = [
  {
    title: "Manage Alumni Affairs Officer",
    shortLabel: "Alumni Affairs Officer",
    desc: "View and manage current AAO administrators.",
    path: "/admin/manage-administrators/alumni-affairs-officer",
    icon: Users,
    roleKey: "Alumni Officer",
  },
  {
    title: "Manage AILPO",
    shortLabel: "AILPO",
    desc: "View and manage current AILPO administrators.",
    path: "/admin/manage-administrators/ailpo",
    icon: Briefcase,
    roleKey: "AILPO",
  },
  {
    title: "Manage Registrar",
    shortLabel: "Registrar",
    desc: "View and manage current Registrar administrators.",
    path: "/admin/manage-administrators/registrar",
    icon: Shield,
    roleKey: "Registrar",
  },
  {
    title: "Manage Internship Advisers",
    shortLabel: "Internship Adviser",
    desc: "View and manage current Internship Advisers.",
    path: "/admin/manage-administrators/faculty",
    icon: GraduationCap,
    roleKey: "Faculty",
  },
];

const ROLE_ENDPOINTS = {
  "Alumni Officer": "/alumni-officers/",
  AILPO: "/ailpo/",
  Registrar: "/registrars/",
  Faculty: "/faculty/",
};

function buildEmptyCounts() {
  return Object.fromEntries(ADMIN_ROLES.map((role) => [role, 0]));
}

function readCountsCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const timestamp = Number(parsed.timestamp || 0);
    const counts = parsed.counts || {};
    const isFresh = Date.now() - timestamp < CACHE_TTL_MS;

    return {
      counts: {
        ...buildEmptyCounts(),
        ...counts,
      },
      isFresh,
    };
  } catch {
    return null;
  }
}

function writeCountsCache(counts) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        counts,
        timestamp: Date.now(),
      }),
    );
  } catch {}
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

async function fetchRoleCount(role) {
  const endpoint = ROLE_ENDPOINTS[role];
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${role}`);
  }

  const data = await response.json();
  const list = normalizeListResponse(data);

  return [role, list.length];
}

export default function ManageAdministratorsPage() {
  const navigate = useNavigate();

  const cached = useMemo(() => readCountsCache(), []);

  const [counts, setCounts] = useState(cached?.counts || buildEmptyCounts());
  const [loading, setLoading] = useState(!cached?.isFresh);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      try {
        const results = await Promise.all(
          ADMIN_ROLES.map((role) => fetchRoleCount(role)),
        );

        if (cancelled) return;

        const newCounts = {
          ...buildEmptyCounts(),
          ...Object.fromEntries(results),
        };

        setCounts(newCounts);
        writeCountsCache(newCounts);
      } catch (err) {
        console.error("Failed to fetch admin counts:", err);

        if (!cancelled) {
          setError(
            cached
              ? "Failed to refresh counts. Showing cached data."
              : "Failed to load administrator counts.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCounts();

    return () => {
      cancelled = true;
    };
  }, [cached]);

  const departments = useMemo(
    () =>
      departmentConfig.map((dept) => ({
        ...dept,
        count: counts[dept.roleKey] ?? 0,
      })),
    [counts],
  );

  const totalAdmins = useMemo(
    () => departments.reduce((sum, dept) => sum + dept.count, 0),
    [departments],
  );

  const totalDepartments = departments.length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Manage Administrators
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of all departments and administrator accounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: Users,
            color: BRAND_BLUE,
            val: loading ? "—" : totalAdmins,
            label: "Total Admins",
            desc: "All administrator accounts in the system",
          },
          {
            icon: Building2,
            color: "#059669",
            val: totalDepartments,
            label: "Departments",
            desc: "Active department categories",
          },
          {
            icon: UserCheck,
            color: "#d97706",
            val: loading ? "—" : "Active",
            label: "System Status",
            desc: "Administrator management is operational",
          },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default"
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = `${s.color}33`)
              }
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                  style={{ backgroundColor: `${s.color}1A` }}
                >
                  <Icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div className="space-y-0.5">
                  <p
                    className="text-xl font-bold leading-tight tracking-tight"
                    style={{ color: s.color }}
                  >
                    {s.val}
                  </p>
                  <p className="text-xs font-semibold text-foreground/80">
                    {s.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5" style={{ color: BRAND_BLUE }} />
          <h2 className="text-lg font-bold text-foreground">Departments</h2>
        </div>

        {loading ? (
          <div className="flex justify-center rounded-xl border border-border/60 bg-card py-20 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2
                className="h-5 w-5 animate-spin"
                style={{ color: BRAND_BLUE }}
              />
              Loading departments…
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {departments.map((dept) => {
              const Icon = dept.icon;

              return (
                <Card
                  key={dept.title}
                  className="group border-border/60 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
                  onClick={() => navigate(dept.path)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between gap-3">
                      <div
                        className="grid h-10 w-10 place-items-center rounded-lg"
                        style={{ backgroundColor: `${BRAND_BLUE}10` }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: BRAND_BLUE }}
                        />
                      </div>

                      <Badge
                        variant="secondary"
                        className="h-fit text-[11px] font-bold"
                      >
                        {dept.count} Admin{dept.count !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <h3
                      className="mt-3 text-sm font-bold"
                      style={{ color: BRAND_BLUE }}
                    >
                      {dept.shortLabel}
                    </h3>

                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {dept.desc}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60 transition-colors duration-200 group-hover:text-[#3D398C]">
                        Open Department
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#3D398C]" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
