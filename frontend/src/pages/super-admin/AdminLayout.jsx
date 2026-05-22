import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UsersRound,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Users,
  Briefcase,
  Shield,
  GraduationCap,
  BookOpen,
  LogOut,
  ShieldCheck,
  UserRound,
  Network,
} from "lucide-react";
import { Collapsible } from "radix-ui";

import PageTitle from "../../components/PageTitle";

import NULogoCapWhite from "../../assets/alumni-login/nuai-logo-white.png";

/* ── shadcn Sidebar ───────────────────────────────────────── */
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

/* ── shadcn UI ────────────────────────────────────────────── */
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

const BRAND_BLUE = "#3D398C";

const NAV_ITEMS = [
  {
    key: "dashboard",
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    key: "manage-administrators",
    to: "/admin/manage-administrators",
    label: "Manage Administrators",
    icon: UsersRound,
    end: true,
    children: [
      {
        key: "aao",
        to: "/admin/manage-administrators/alumni-affairs-officer",
        label: "Alumni Affairs Officer",
        icon: Users,
      },
      {
        key: "ailpo",
        to: "/admin/manage-administrators/ailpo",
        label: "AILPO",
        icon: Briefcase,
      },
      {
        key: "registrar",
        to: "/admin/manage-administrators/registrar",
        label: "Registrar",
        icon: Shield,
      },
      {
        key: "faculty",
        to: "/admin/manage-administrators/faculty",
        label: "Internship Adviser",
        icon: GraduationCap,
      },
    ],
  },
  {
    key: "academic-records",
    to: "/admin/academic-records",
    label: "Academic Records",
    icon: BookOpen,
    end: false,
  },
  {
    key: "organization-chart",
    to: "/admin/organization-chart",
    label: "Manage Organizational Chart",
    icon: Network,
    end: false,
  },
  {
    key: "profile",
    to: "/admin/profile",
    label: "Profile",
    icon: UserRound,
    end: false,
  },
  {
    key: "logs",
    to: "/admin/logs",
    label: "System Audit",
    icon: ShieldCheck,
    end: false,
  },
];

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null");
  } catch {
    return null;
  }
}

export default function AdminLayout() {
  const account = getStoredAccount();
  const role = account?.role || "";
  const loading = false;
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [academicBreadcrumbName] = useState("");

  const collapsibleKeys = useMemo(
    () =>
      NAV_ITEMS.filter((item) => item.children?.length).map((item) => item.key),
    [],
  );

  const [openItems, setOpenItems] = useState(() => new Set(collapsibleKeys));

  const allClosed = collapsibleKeys.every((key) => !openItems.has(key));

  function toggleItem(key) {
    setOpenItems((prev) => {
      const next = new Set(prev);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  async function handleLogout() {
    localStorage.removeItem("nuai_account");
    navigate("/login", { replace: true });
  }

  const userEmail = account?.email || "—";

  const userInitials = useMemo(() => {
    return (account?.email || "SA").substring(0, 2).toUpperCase();
  }, [account]);

  function isPathActive(itemTo, end) {
    if (end) return location.pathname === itemTo;
    return location.pathname.startsWith(itemTo);
  }

  function getActiveContext() {
    const path = location.pathname;

    if (path.startsWith("/admin/academic-records/")) {
      return {
        label: academicBreadcrumbName || "School Program",
        icon: BookOpen,
        parent: {
          label: "Academic Records",
          to: "/admin/academic-records",
        },
      };
    }

    if (path.startsWith("/admin/manage-administrators/")) {
      const segments = path
        .replace("/admin/manage-administrators/", "")
        .split("/");
      const dept = segments[0];
      const isCreate = segments[1] === "create";

      const deptLabels = {
        "alumni-affairs-officer": "Alumni Affairs Officer",
        ailpo: "AILPO",
        registrar: "Registrar",
        treasury: "Treasury",
        faculty: "Internship Advisers",
      };

      const deptLabel = deptLabels[dept] || dept;

      if (isCreate) {
        return {
          label: `Create ${deptLabel}`,
          icon: UsersRound,
          parent: {
            label: deptLabel,
            to: `/admin/manage-administrators/${dept}`,
          },
          grandparent: {
            label: "Manage Administrators",
            to: "/admin/manage-administrators",
          },
        };
      }

      return {
        label: deptLabel,
        icon: UsersRound,
        parent: {
          label: "Manage Administrators",
          to: "/admin/manage-administrators",
        },
      };
    }

    for (const item of NAV_ITEMS) {
      if (item.end ? path === item.to : path.startsWith(item.to)) {
        return { label: item.label, icon: item.icon, parent: null };
      }
    }

    return { label: "Dashboard", icon: LayoutDashboard, parent: null };
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-sm border-border/60">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3D398C] border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Loading dashboard…
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!account || role !== "super-admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-sm border-border/60">
          <CardContent className="pt-5">
            <div className="space-y-4 text-center">
              <p className="text-sm font-semibold text-nu-blue">
                Unauthorized Access
              </p>
              <p className="text-sm text-muted-foreground">
                Please login using a Super Admin account.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="rounded-md bg-nu-blue px-4 py-2 text-sm font-semibold text-white"
              >
                Go to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Technical Admin | NUAI" />

      <TooltipProvider>
        <SidebarProvider style={{ "--sidebar-width": "18rem" }}>
          <Sidebar
            collapsible="icon"
            className="border-r border-slate-200 bg-white"
          >
            <SidebarHeader className="border-b border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                <img
                  src={NULogoCapWhite}
                  alt="NUAI Logo"
                  className="h-14 w-auto object-contain group-data-[collapsible=icon]:hidden"
                />

                <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
                  <img
                    src={NULogoCapWhite}
                    alt="NUAI Logo"
                    className="h-8.5 w-8.5 min-h-8.5 min-w-8.5 shrink-0 object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <p
                    className="text-base font-bold tracking-wide"
                    style={{ color: BRAND_BLUE }}
                  >
                    NUAI
                  </p>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: BRAND_BLUE }}
                  >
                    Technical Admin Portal
                  </p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="bg-white">
              <SidebarGroup>
                <div className="flex items-center justify-between pr-2">
                  <SidebarGroupLabel className="text-slate-500">
                    Navigation
                  </SidebarGroupLabel>

                  <button
                    onClick={() => {
                      if (allClosed) {
                        setOpenItems(new Set(collapsibleKeys));
                      } else {
                        setOpenItems(new Set());
                      }
                    }}
                    className="group-data-[collapsible=icon]:hidden flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:text-[#3D398C] hover:bg-[#3D398C]/5 transition-colors duration-150 cursor-pointer"
                    title={allClosed ? "Expand all" : "Collapse all"}
                  >
                    <ChevronsUpDown size={12} />
                    <span>{allClosed ? "Expand" : "Collapse"}</span>
                  </button>
                </div>

                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const hasChildren =
                        item.children && item.children.length > 0;
                      const isActive = isPathActive(item.to, item.end);
                      const isChildActive =
                        hasChildren &&
                        item.children.some((child) =>
                          location.pathname.startsWith(child.to),
                        );
                      const isOpen = openItems.has(item.key);

                      if (hasChildren) {
                        return (
                          <Collapsible.Root
                            key={item.key}
                            open={isOpen}
                            onOpenChange={(open) => {
                              if (open) {
                                setOpenItems(
                                  (prev) => new Set([...prev, item.key]),
                                );
                              } else {
                                setOpenItems((prev) => {
                                  const next = new Set(prev);
                                  next.delete(item.key);
                                  return next;
                                });
                              }
                            }}
                            className="group/collapsible"
                          >
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                tooltip={item.label}
                                onClick={() => {
                                  if (isActive && !isChildActive) {
                                    toggleItem(item.key);
                                  } else {
                                    navigate(item.to);
                                    setOpenItems(
                                      (prev) => new Set([...prev, item.key]),
                                    );
                                  }
                                }}
                                className={`min-h-[42px] rounded-lg bg-white text-[13px] text-sm font-medium transition-all duration-150 ${
                                  isActive && !isChildActive
                                    ? "!bg-[#3D398C] !text-white !hover:bg-[#3D398C] !hover:text-white cursor-default shadow-sm"
                                    : isChildActive
                                      ? "!bg-white !text-[#3D398C] cursor-pointer hover:!bg-[#3D398C]/5"
                                      : "!bg-white cursor-pointer text-slate-700 hover:!bg-[#3D398C]/5 hover:text-[#3D398C]"
                                }`}
                              >
                                <Icon
                                  size={20}
                                  className={
                                    isActive && !isChildActive
                                      ? "text-white"
                                      : isChildActive
                                        ? "text-[#3D398C]"
                                        : "text-slate-700"
                                  }
                                />

                                <span className="flex-1">{item.label}</span>

                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleItem(item.key);
                                  }}
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === "Enter" ||
                                      event.key === " "
                                    ) {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      toggleItem(item.key);
                                    }
                                  }}
                                  className={`ml-auto inline-flex items-center justify-center rounded p-0.5 transition-colors duration-150 cursor-pointer ${
                                    isActive && !isChildActive
                                      ? "hover:bg-white/20"
                                      : "hover:bg-[#3D398C]/10"
                                  }`}
                                >
                                  <ChevronDown
                                    size={16}
                                    className={`transition-transform duration-200 ${
                                      isOpen ? "rotate-180" : ""
                                    } ${
                                      isActive && !isChildActive
                                        ? "text-white"
                                        : "text-slate-500"
                                    }`}
                                  />
                                </span>
                              </SidebarMenuButton>

                              <Collapsible.Content className="overflow-hidden data-[state=open]:animate-[slideDown_150ms_ease-out] data-[state=closed]:animate-[slideUp_150ms_ease-in]">
                                <SidebarMenuSub className="mt-1 py-0.5 ml-4 mr-1 border-l-[1.5px] border-[#3D398C]/20">
                                  {item.children.map((child) => {
                                    const isSubActive =
                                      location.pathname.startsWith(child.to);

                                    return (
                                      <SidebarMenuSubItem key={child.key}>
                                        <SidebarMenuSubButton
                                          asChild
                                          className={`min-h-[36px] rounded-lg bg-white text-[12px] font-medium transition-all duration-150 cursor-pointer ${
                                            isSubActive
                                              ? "!bg-[#3D398C] !text-white shadow-sm"
                                              : "!bg-white text-slate-700 hover:!bg-[#3D398C]/5 hover:text-[#3D398C]"
                                          }`}
                                        >
                                          <NavLink to={child.to}>
                                            <span>{child.label}</span>
                                          </NavLink>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    );
                                  })}
                                </SidebarMenuSub>
                              </Collapsible.Content>
                            </SidebarMenuItem>
                          </Collapsible.Root>
                        );
                      }

                      return (
                        <SidebarMenuItem key={item.key}>
                          <SidebarMenuButton
                            tooltip={item.label}
                            asChild
                            className={`min-h-[42px] rounded-lg bg-white text-[13px] text-sm font-medium transition-all duration-150 ${
                              isActive
                                ? "!bg-[#3D398C] !text-white !hover:bg-[#3D398C] !hover:text-white pointer-events-none shadow-sm"
                                : "!bg-white cursor-pointer text-slate-700 hover:!bg-[#3D398C]/5 hover:text-[#3D398C]"
                            }`}
                          >
                            <NavLink to={item.to} end={item.end}>
                              <Icon
                                size={20}
                                className={isActive ? "text-white" : "text-slate-700"}
                              />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 bg-white px-4 py-3 group-data-[collapsible=icon]:px-2">
              <div className="flex items-center gap-3 w-full rounded-lg bg-white border border-border/60 shadow-sm px-3 py-3 text-left group-data-[collapsible=icon]:hidden">
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: BRAND_BLUE }}
                >
                  {userInitials}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">
                    {userEmail}
                  </p>

                  <Badge
                    variant="outline"
                    className="mt-1 border-[#F5DA3E]/50 bg-[#F5DA3E]/10 text-[#3D398C] font-semibold text-[10px] px-1.5 py-0"
                  >
                    {role || "—"}
                  </Badge>
                </div>
              </div>

              <div className="group-data-[collapsible=icon]:flex hidden flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white shadow-sm">
                  <div
                    className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: BRAND_BLUE }}
                  >
                    {userInitials}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLogoutDialog(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-1.5 mb-0.5 group-data-[collapsible=icon]:hidden">
                <button
                  onClick={() => setShowLogoutDialog(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 cursor-pointer"
                >
                  <span>Logout</span>
                </button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset>
            <header className="flex h-14 items-center gap-3 border-b border-border/40 bg-background px-4">
              <SidebarTrigger className="text-[#3D398C]" />
              <div className="h-5 w-px bg-border/60" />

              {(() => {
                const ctx = getActiveContext();
                const ActiveIcon = ctx.icon;

                return (
                  <div className="flex items-center gap-2 min-w-0">
                    <ActiveIcon size={16} className="shrink-0 text-[#3D398C]" />

                    {ctx.grandparent ? (
                      <nav className="flex items-center gap-1 text-sm min-w-0">
                        <NavLink
                          to={ctx.grandparent.to}
                          className="text-muted-foreground hover:text-[#3D398C] transition-colors truncate cursor-pointer"
                        >
                          {ctx.grandparent.label}
                        </NavLink>

                        <ChevronRight
                          size={14}
                          className="shrink-0 text-muted-foreground/50"
                        />

                        <NavLink
                          to={ctx.parent.to}
                          className="text-muted-foreground hover:text-[#3D398C] transition-colors truncate cursor-pointer"
                        >
                          {ctx.parent.label}
                        </NavLink>

                        <ChevronRight
                          size={14}
                          className="shrink-0 text-muted-foreground/50"
                        />

                        <span className="text-sm font-semibold text-foreground truncate text-nu-blue">
                          {ctx.label}
                        </span>
                      </nav>
                    ) : ctx.parent ? (
                      <nav className="flex items-center gap-1 text-sm min-w-0">
                        <NavLink
                          to={ctx.parent.to}
                          className="text-muted-foreground hover:text-[#3D398C] transition-colors truncate cursor-pointer"
                        >
                          {ctx.parent.label}
                        </NavLink>

                        <ChevronRight
                          size={14}
                          className="shrink-0 text-muted-foreground/50"
                        />

                        <span className="text-sm font-semibold text-foreground truncate text-nu-blue">
                          {ctx.label}
                        </span>
                      </nav>
                    ) : (
                      <h1 className="text-sm font-semibold text-foreground truncate text-nu-blue">
                        {ctx.label}
                      </h1>
                    )}
                  </div>
                );
              })()}
            </header>

            <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-full mx-auto">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-lg font-bold"
              style={{ color: BRAND_BLUE }}
            >
              Confirm Logout
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to logout? You will need to sign in again to
              access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                setShowLogoutDialog(false);
                handleLogout();
              }}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}