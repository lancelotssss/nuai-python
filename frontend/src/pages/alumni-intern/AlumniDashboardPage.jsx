
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  UserRound,
  UsersRound,
  FileText,
  BriefcaseBusiness,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

import PageTitle from "@/components/PageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BRAND_BLUE = "#3D398C";

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null");
  } catch {
    return null;
  }
}

function StatCard({ icon: Icon, label, value, description, accent = BRAND_BLUE }) {
  return (
    <Card className="border-border/60 bg-white shadow-sm">
      <CardContent className="px-5 py-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}1A` }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>

          <div className="space-y-0.5">
            <p className="text-xl font-bold leading-tight tracking-tight" style={{ color: accent }}>
              {value}
            </p>
            <p className="text-xs font-semibold text-foreground/80">{label}</p>
            <p className="text-[10px] text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ icon: Icon, title, description, onClick }) {
  return (
    <Card
      className="group cursor-pointer border-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D398C]/20 hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#3D398C]/5 text-[#3D398C] transition-colors group-hover:bg-[#3D398C]/10">
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">{title}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AlumniDashboardPage() {
  const navigate = useNavigate();
  const account = useMemo(() => getStoredAccount(), []);
  const userEmail = account?.email || "—";

  function handleLogout() {
    localStorage.removeItem("nuai_account");
    navigate("/login", { replace: true });
  }

  return (
    <>
      <PageTitle title="Alumni Dashboard | NUAI" />

      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nu-gold">
                NUAI
              </p>

              <h1 className="mt-1 text-2xl font-bold text-nu-blue">
                Alumni Dashboard
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Access alumni services, jobs, surveys, announcements, and profile tools.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-[#3D398C]/20 text-[#3D398C]">
                Alumni
              </Badge>

              <Button
                type="button"
                onClick={handleLogout}
                variant="outline"
                className="border-border text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl space-y-6 px-6 py-8">
          <Card className="border-border/60 shadow-sm overflow-hidden border-l-[#3D398C]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Welcome, <span className="text-[#3D398C]">Alumni!</span>{" "}
                    <span className="text-xs font-light text-[#b1b1b1]">({userEmail})</span>
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Welcome to your alumni portal.
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="shrink-0 border-[#F5DA3E]/50 bg-[#F5DA3E]/10 text-[#3D398C] font-semibold text-[11px]"
                >
                  Alumni
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            <StatCard
              icon={UsersRound}
              label="Records"
              value="Ready"
              description="Role workspace is available"
            />
            <StatCard
              icon={ClipboardList}
              label="Tasks"
              value="Active"
              accent="#059669"
              description="Dashboard modules are prepared"
            />
            <StatCard
              icon={BriefcaseBusiness}
              label="Services"
              value="Open"
              accent="#D97706"
              description="Role-based services connected soon"
            />
            <StatCard
              icon={ShieldCheck}
              label="Access"
              value="Verified"
              accent="#7C3AED"
              description="Django role-based login"
            />
          </div>

          <div>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Jump to frequently used sections</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              
              <QuickActionCard
                icon={LayoutDashboard}
                title="Dashboard Overview"
                description="View your role-based dashboard overview"
                onClick={() => {}}
              />
              <QuickActionCard
                icon={FileText}
                title="Records"
                description="Open and manage role-specific records"
                onClick={() => {}}
              />
              <QuickActionCard
                icon={CalendarDays}
                title="Activities"
                description="Review updates and activities"
                onClick={() => {}}
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
