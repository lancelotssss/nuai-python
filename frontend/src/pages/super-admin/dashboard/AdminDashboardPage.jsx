import { useMemo, useState } from "react";
import {
  BarChart3,
  ShieldCheck,
  Users,
  Activity,
  UsersRound,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ── shadcn UI ────────────────────────────────────────────── */
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BRAND_BLUE = "#3D398C";

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null");
  } catch {
    return null;
  }
}

/* ── Stat Card (matches OfficerManageUsers exactly) ───────── */
function StatCard({ icon: Icon, label, value, accent, description }) {
  const c = accent || BRAND_BLUE;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group rounded-xl border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default"
      style={{ borderColor: hovered ? `${c}33` : undefined }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
          style={{ backgroundColor: hovered ? `${c}26` : `${c}1A` }}
        >
          <Icon className="h-5 w-5" style={{ color: c }} />
        </div>

        <div className="space-y-0.5">
          <p
            className="text-xl font-bold leading-tight tracking-tight"
            style={{ color: c }}
          >
            {value}
          </p>

          <p className="text-xs font-semibold text-foreground/80">{label}</p>

          {description && (
            <p className="text-[10px] text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Quick Action Card ────────────────────────────────────── */
function QuickActionCard({ icon: Icon, title, description, onClick }) {
  return (
    <Card
      className="group cursor-pointer border-border/50 transition-all duration-200 hover:border-[#3D398C]/20 hover:shadow-md hover:-translate-y-0.5"
      onClick={onClick}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#3D398C]/5 text-[#3D398C] transition-colors group-hover:bg-[#3D398C]/10">
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">
              {title}
            </p>

            <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <ChevronRight
            size={16}
            className="mt-0.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#3D398C]/60"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const account = useMemo(() => getStoredAccount(), []);

  const userEmail = account?.email || "—";

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";

    return "Good evening";
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Greeting Card ── */}
      <Card className="border-border/60 shadow-sm overflow-hidden  border-l-[#3D398C]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                {getGreeting()},{" "}
                <span className="text-[#3D398C]">Admin! </span>
                <span className="text-xs text-[#b1b1b1] font-light text-center">
                  ({userEmail}){" "}
                </span>
              </CardTitle>

              <CardDescription className="text-sm">
                Welcome to the Super Admin Dashboard. Manage administrators,
                review system audit logs, and monitor platform health.
              </CardDescription>
            </div>

            <Badge
              variant="outline"
              className="shrink-0 border-[#F5DA3E]/50 bg-[#F5DA3E]/10 text-[#3D398C] font-semibold text-[11px]"
            >
              Super Admin
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Administrator Areas"
          value="5 Depts"
          accent={BRAND_BLUE}
          description="Department-specific admin records"
        />

        <StatCard
          icon={ClipboardList}
          label="System Audit"
          value="Active"
          accent="#059669"
          description="Review platform event logs"
        />

        <StatCard
          icon={ShieldCheck}
          label="Security"
          value="Audit Ready"
          accent="#D97706"
          description="Activity monitoring enabled"
        />

        <StatCard
          icon={Activity}
          label="System Health"
          value="Stable"
          accent="#7C3AED"
          description="Workspace active & accessible"
        />
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Quick Actions
          </h2>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Jump to frequently used sections
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            icon={UsersRound}
            title="Manage Administrators"
            description="View, add, and manage department administrator records"
            onClick={() => navigate("/admin/manage-administrators")}
          />

          <QuickActionCard
            icon={ClipboardList}
            title="System Audit Logs"
            description="Review platform events, actions, and actor details"
            onClick={() => navigate("/admin/logs")}
          />

          <QuickActionCard
            icon={BarChart3}
            title="Analytics"
            description="Dashboard analytics and performance summaries (coming soon)"
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
}