import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  GraduationCap,
  UsersRound,
  CalendarDays,
  LogOut,
  FileText,
  BriefcaseBusiness,
  UserCheck,
} from "lucide-react";

import PageTitle from "../../components/PageTitle";
import { Button } from "@/components/ui/button";
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

function StatCard({ icon: Icon, label, value, description, accent = BRAND_BLUE }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="px-5 py-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}1A` }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>

          <div className="space-y-0.5">
            <p
              className="text-xl font-bold leading-tight tracking-tight"
              style={{ color: accent }}
            >
              {value}
            </p>

            <p className="text-xs font-semibold text-foreground/80">{label}</p>

            {description ? (
              <p className="text-[10px] text-muted-foreground">
                {description}
              </p>
            ) : null}
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
            <p className="text-[13px] font-semibold text-foreground">
              {title}
            </p>

            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FacultyDashboardPage() {
  const navigate = useNavigate();
  const account = useMemo(() => getStoredAccount(), []);

  const userEmail = account?.email || "—";

  function handleLogout() {
    localStorage.removeItem("nuai_account");
    navigate("/login", { replace: true });
  }

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";

    return "Good evening";
  }

  if (!account || account.role !== "faculty") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-sm border-border/60">
          <CardContent className="pt-5">
            <div className="space-y-4 text-center">
              <p className="text-sm font-semibold text-nu-blue">
                Unauthorized Access
              </p>
              <p className="text-sm text-muted-foreground">
                Please login using an Internship Adviser account.
              </p>
              <Button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="bg-nu-blue text-white hover:bg-nu-blue/90"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Internship Adviser | NUAI" />

      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nu-gold">
                NUAI
              </p>

              <h1 className="mt-1 text-2xl font-bold text-nu-blue">
                Internship Adviser Dashboard
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Monitor interns, internship records, and adviser-related tasks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="border-[#3D398C]/20 text-[#3D398C]"
              >
                Faculty
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {getGreeting()},{" "}
                    <span className="text-[#3D398C]">Internship Adviser!</span>{" "}
                    <span className="text-xs font-light text-[#b1b1b1]">
                      ({userEmail})
                    </span>
                  </CardTitle>

                  <CardDescription className="text-sm">
                    Welcome to your Internship Adviser workspace. Review assigned
                    interns, monitor internship progress, and manage adviser
                    activities.
                  </CardDescription>
                </div>

                <Badge
                  variant="outline"
                  className="shrink-0 border-[#F5DA3E]/50 bg-[#F5DA3E]/10 text-[#3D398C] font-semibold text-[11px]"
                >
                  Internship Adviser
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={UsersRound}
              label="Assigned Interns"
              value="0"
              description="Intern records connected soon"
            />

            <StatCard
              icon={ClipboardList}
              label="Requirements"
              value="Pending"
              accent="#059669"
              description="Requirement tracking module"
            />

            <StatCard
              icon={BriefcaseBusiness}
              label="Internship Posts"
              value="Ready"
              accent="#D97706"
              description="Partner internship opportunities"
            />

            <StatCard
              icon={UserCheck}
              label="Adviser Status"
              value="Active"
              accent="#7C3AED"
              description="Account verified by role"
            />
          </div>

          <div>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Quick Actions
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Jump to frequently used adviser sections
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <QuickActionCard
                icon={GraduationCap}
                title="Manage Interns"
                description="View and monitor assigned intern records"
                onClick={() => {}}
              />

              <QuickActionCard
                icon={FileText}
                title="Internship Requirements"
                description="Review submitted internship documents and status"
                onClick={() => {}}
              />

              <QuickActionCard
                icon={CalendarDays}
                title="Schedules"
                description="Track internship schedules and adviser activities"
                onClick={() => {}}
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}