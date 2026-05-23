import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  BriefcaseBusiness,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  GraduationCap,
  PlusCircle,
  FolderKanban,
  UsersRound,
  House,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { Collapsible } from "radix-ui";

import PageTitle from "@/components/PageTitle";


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

const FACULTY_NAV_ITEMS = [
  {
    key: "dashboard",
    to: "/faculty",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    key: "internships",
    to: "/faculty/internships",
    label: "Internship Management",
    icon: BriefcaseBusiness,
    end: false,
    children: [
      {
        key: "add-class",
        to: "/faculty/internships/add-class",
        label: "Add Class",
      },
    ],
  },
  {
    key: "intern-list",
    to: "/faculty/intern-list",
    label: "Academic Course Interns",
    icon: UsersRound,
    end: true,
  },
  {
    key: "profile",
    to: "/faculty/profile",
    label: "Profile",
    icon: UserRound,
    end: true,
  },
  {
    key: "system-audit",
    to: "/faculty/system-audit",
    label: "System Audit",
    icon: ShieldCheck,
    end: true,
  },
];

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

function getProfilePhotoUrl(profile) {
  return (
    safe(profile?.personalization?.photoUrl) ||
    safe(profile?.photoUrl) ||
    safe(profile?.profilePicture) ||
    safe(profile?.avatarUrl) ||
    ""
  );
}

function getDisplayName(account) {
  const firstName = safe(account?.first_name || account?.firstName);
  const middleName = safe(account?.middle_name || account?.middleName);
  const lastName = safe(account?.last_name || account?.lastName);
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  return (
    fullName ||
    safe(account?.full_name || account?.fullName) ||
    safe(account?.name) ||
    safe(account?.email)
  );
}

function buildBreadcrumbs(pathname, state) {
  if (pathname === "/faculty") {
    return [
      {
        label: "Dashboard",
        to: "/faculty",
        icon: LayoutDashboard,
        isCurrent: true,
      },
    ];
  }

  if (pathname === "/faculty/internships") {
    return [
      {
        label: "Internship Management",
        to: "/faculty/internships",
        icon: BriefcaseBusiness,
        isCurrent: true,
      },
    ];
  }

  if (pathname === "/faculty/internships/add-class") {
    return [
      {
        label: "Internship Management",
        to: "/faculty/internships",
        icon: BriefcaseBusiness,
        isCurrent: false,
      },
      {
        label: "Add Class",
        to: pathname,
        icon: PlusCircle,
        isCurrent: true,
      },
    ];
  }

  if (
    pathname.startsWith("/faculty/internships/") &&
    pathname !== "/faculty/internships/add-class"
  ) {
    return [
      {
        label: "Internship Management",
        to: "/faculty/internships",
        icon: BriefcaseBusiness,
        isCurrent: false,
      },
      {
        label: safe(state?.breadcrumbLabel) || "Class Details",
        to: pathname,
        icon: FolderKanban,
        isCurrent: true,
      },
    ];
  }

  if (pathname === "/faculty/intern-list") {
    return [
      {
        label: "Academic Course Interns",
        to: "/faculty/intern-list",
        icon: UsersRound,
        isCurrent: true,
      },
    ];
  }

  if (pathname === "/faculty/profile") {
    return [
      {
        label: "Profile",
        to: "/faculty/profile",
        icon: UserRound,
        isCurrent: true,
      },
    ];
  }

  if (pathname === "/faculty/system-audit") {
    return [
      {
        label: "System Audit",
        to: "/faculty/system-audit",
        icon: ShieldCheck,
        isCurrent: true,
      },
    ];
  }

  return [
    {
      label: "Internship Adviser",
      to: "/faculty",
      icon: House,
      isCurrent: true,
    },
  ];
}

function getActiveContext(pathname, state) {
  if (pathname === "/faculty") {
    return {
      label: "Dashboard",
      icon: LayoutDashboard,
    };
  }

  if (pathname === "/faculty/internships") {
    return {
      label: "Internship Management",
      icon: BriefcaseBusiness,
    };
  }

  if (pathname === "/faculty/internships/add-class") {
    return {
      label: "Add Class",
      icon: PlusCircle,
    };
  }

  if (
    pathname.startsWith("/faculty/internships/") &&
    pathname !== "/faculty/internships/add-class"
  ) {
    return {
      label: safe(state?.breadcrumbLabel) || "Class Details",
      icon: FolderKanban,
    };
  }

  if (pathname === "/faculty/intern-list") {
    return {
      label: "Academic Course Interns",
      icon: UsersRound,
    };
  }

  if (pathname === "/faculty/profile") {
    return {
      label: "Profile",
      icon: UserRound,
    };
  }

  if (pathname === "/faculty/system-audit") {
    return {
      label: "System Audit",
      icon: ShieldCheck,
    };
  }

  return {
    label: "Internship Adviser",
    icon: GraduationCap,
  };
}

export default function FacultyLayout() {
  const account = getStoredAccount();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [pendingProtectedAction, setPendingProtectedAction] = useState(null);

  const loading = false;
  const role = account?.role || "";
  const tokenRole = account?.tokenRole || account?.role || "Faculty";
  const userEmail = account?.email || "—";
  const profilePhotoUrl = useMemo(() => getProfilePhotoUrl(account), [account]);

  const collapsibleKeys = useMemo(
    () =>
      FACULTY_NAV_ITEMS.filter((item) => item.children?.length).map(
        (item) => item.key,
      ),
    [],
  );

  const [openItems, setOpenItems] = useState(() => new Set(collapsibleKeys));

  const allClosed = collapsibleKeys.every((key) => !openItems.has(key));

  function toggleItem(key) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const userInitials = useMemo(() => {
    const source = getDisplayName(account);

    if (!source) return "IA";

    return (
      source
        .replace(/@.*$/, "")
        .split(/[.\s_-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "IA"
    );
  }, [account]);

  const navigateWithDraftGuard = useCallback(
    (to, state = {}, actionType = "navigate") => {
      const currentPath = location.pathname;

      if (actionType === "navigate" && currentPath === to) return;

      const navigationEvent = new CustomEvent(
        "faculty-form:navigation-attempt",
        {
          detail: {
            currentPath,
            nextPath: to,
            nextState: state,
            actionType,
            handled: false,
            cancelled: false,
          },
        },
      );

      window.dispatchEvent(navigationEvent);

      const detail = navigationEvent.detail || {};

      if (detail.cancelled) return;
      if (detail.handled) return;

      if (actionType === "logout") {
        setPendingProtectedAction("logout");
        setShowLogoutDialog(true);
        return;
      }

      navigate(to, { state });
    },
    [location.pathname, navigate],
  );

  function isPathActive(itemTo, end) {
    if (end) return location.pathname === itemTo;

    if (itemTo === "/faculty/internships") {
      return (
        location.pathname === "/faculty/internships" ||
        location.pathname.startsWith("/faculty/internships/")
      );
    }

    if (itemTo === "/faculty/intern-list") {
      return (
        location.pathname === "/faculty/intern-list" ||
        location.pathname.startsWith("/faculty/intern-list/")
      );
    }

    return location.pathname.startsWith(itemTo);
  }

  async function handleLogout() {
    localStorage.removeItem("nuai_account");
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    const openLogoutConfirm = () => {
      setPendingProtectedAction("logout");
      setShowLogoutDialog(true);
    };

    window.addEventListener(
      "faculty-layout:open-logout-confirm",
      openLogoutConfirm,
    );

    return () => {
      window.removeEventListener(
        "faculty-layout:open-logout-confirm",
        openLogoutConfirm,
      );
    };
  }, []);

  const ctx = useMemo(() => {
    return getActiveContext(location.pathname, location.state);
  }, [location.pathname, location.state]);

  const breadcrumbs = useMemo(() => {
    return buildBreadcrumbs(location.pathname, location.state);
  }, [location.pathname, location.state]);

  const ActiveIcon = ctx.icon;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-sm border-border/60">
          <CardContent className="w-full min-w-0 pt-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3D398C] border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Loading Internship Adviser workspace…
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!account || role !== "faculty") {
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
      <PageTitle title="Internship Adviser | NUAI" />

      <TooltipProvider>
        <SidebarProvider style={{ "--sidebar-width": "18rem" }}>
          <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:px-2">
              <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                

                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <p
                    className="truncate text-base font-bold tracking-wide"
                    style={{ color: BRAND_BLUE }}
                  >
                    NUAI
                  </p>
                  <p
                    className="truncate text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: BRAND_BLUE }}
                  >
                    Internship Adviser
                  </p>
                  <p
                    className="mt-1 text-[11px]"
                    style={{ color: BRAND_BLUE, opacity: 0.75 }}
                  >
                    Internship Management Portal
                  </p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <div className="flex items-center justify-between pr-2">
                  <SidebarGroupLabel>Navigation</SidebarGroupLabel>

                  {collapsibleKeys.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (allClosed) setOpenItems(new Set(collapsibleKeys));
                        else setOpenItems(new Set());
                      }}
                      className="group-data-[collapsible=icon]:hidden flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-[#3D398C]/5 hover:text-[#3D398C]"
                      title={allClosed ? "Expand all" : "Collapse all"}
                    >
                      <ChevronsUpDown size={12} />
                      <span>{allClosed ? "Expand" : "Collapse"}</span>
                    </button>
                  )}
                </div>

                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {FACULTY_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const hasChildren = item.children && item.children.length > 0;
                      const isActive = isPathActive(item.to, item.end);
                      const isChildActive =
                        hasChildren &&
                        item.children.some((child) => {
                          return (
                            location.pathname === child.to ||
                            location.pathname.startsWith(child.to + "/")
                          );
                        });
                      const isOpen = openItems.has(item.key);

                      if (hasChildren) {
                        return (
                          <Collapsible.Root
                            key={item.key}
                            open={isOpen}
                            onOpenChange={(open) => {
                              if (open) {
                                setOpenItems((prev) => new Set([...prev, item.key]));
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
                                  navigateWithDraftGuard(item.to);
                                  setOpenItems((prev) => new Set([...prev, item.key]));
                                }}
                                className={`min-h-[42px] rounded-lg text-sm font-medium transition-all duration-150 ${
                                  isActive && !isChildActive
                                    ? "!bg-[#3D398C] !text-white !hover:bg-[#3D398C] !hover:text-white"
                                    : isChildActive
                                      ? "!bg-[#3D398C]/10 !text-[#3D398C] cursor-pointer"
                                      : "cursor-pointer text-sidebar-foreground/80 hover:bg-[#3D398C]/8 hover:text-[#3D398C]"
                                }`}
                              >
                                <Icon
                                  size={20}
                                  className={
                                    isActive && !isChildActive
                                      ? "text-white"
                                      : isChildActive
                                        ? "text-[#3D398C]"
                                        : ""
                                  }
                                />
                                <span className="flex-1">{item.label}</span>

                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(item.key);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleItem(item.key);
                                    }
                                  }}
                                  className={`ml-auto inline-flex items-center justify-center rounded p-0.5 transition-colors duration-150 ${
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
                                      isActive && !isChildActive ? "text-white" : ""
                                    }`}
                                  />
                                </span>
                              </SidebarMenuButton>

                              <Collapsible.Content className="overflow-hidden data-[state=open]:animate-[slideDown_150ms_ease-out] data-[state=closed]:animate-[slideUp_150ms_ease-in]">
                                <SidebarMenuSub className="ml-4 mr-1 mt-1 border-l-[1.5px] border-[#3D398C]/20 py-0.5">
                                  {item.children.map((child) => {
                                    const isSubActive =
                                      location.pathname === child.to ||
                                      location.pathname.startsWith(child.to + "/");

                                    return (
                                      <SidebarMenuSubItem key={child.key}>
                                        <SidebarMenuSubButton
                                          className={`min-h-[36px] rounded-lg text-[12px] font-medium transition-all duration-150 ${
                                            isSubActive
                                              ? "!bg-[#3D398C] !text-white"
                                              : "text-sidebar-foreground/60 hover:bg-[#3D398C]/5 hover:text-[#3D398C]"
                                          }`}
                                          onClick={() =>
                                            navigateWithDraftGuard(child.to)
                                          }
                                        >
                                          <span className="flex-1">
                                            {child.label}
                                          </span>
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
                            className={`min-h-[42px] rounded-lg text-sm font-medium transition-all duration-150 ${
                              isActive
                                ? "!bg-[#3D398C] !text-white !hover:bg-[#3D398C] !hover:text-white"
                                : "cursor-pointer text-sidebar-foreground/80 hover:bg-[#3D398C]/8 hover:text-[#3D398C]"
                            }`}
                            onClick={() => navigateWithDraftGuard(item.to)}
                          >
                            <Icon
                              size={20}
                              className={isActive ? "text-white" : ""}
                            />
                            <span className="flex-1">{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border px-4 py-3 group-data-[collapsible=icon]:px-2">
              <button
                type="button"
                className="flex w-full cursor-default items-center gap-3 rounded-lg border border-border/60 bg-white px-3 py-3 text-left shadow-sm transition-all duration-150 hover:border-[#3D398C]/20 hover:shadow-md group-data-[collapsible=icon]:hidden"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-white">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: BRAND_BLUE }}
                    >
                      {userInitials}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-sidebar-foreground">
                    {userEmail}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="border-[#F5DA3E]/50 bg-[#F5DA3E]/10 px-1.5 py-0 text-[10px] font-semibold text-[#3D398C]"
                    >
                      {role || "—"}
                    </Badge>

                    <Badge
                      variant="outline"
                      className="border-[#3D398C]/20 bg-[#3D398C]/5 px-1.5 py-0 text-[10px] font-medium text-[#3D398C]"
                    >
                      {tokenRole || "Faculty"}
                    </Badge>
                  </div>
                </div>
              </button>

              <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-white shadow-sm">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: BRAND_BLUE }}
                    >
                      {userInitials}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => navigateWithDraftGuard("", {}, "logout")}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-red-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-0.5 mt-1.5 group-data-[collapsible=icon]:hidden">
                <button
                  type="button"
                  onClick={() => navigateWithDraftGuard("", {}, "logout")}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium text-red-400 transition-all duration-150 hover:bg-red-50 hover:text-red-600"
                >
                  <span>Logout</span>
                </button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset>
            <header className="flex min-h-14 flex-col justify-center gap-2 border-b border-border/40 bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-[#3D398C]" />
                <div className="h-5 w-px bg-border/60" />

                <div className="flex min-w-0 items-center gap-2">
                  <ActiveIcon size={16} className="shrink-0 text-[#3D398C]" />
                  <h1 className="truncate text-sm font-semibold text-foreground">
                    {ctx.label}
                  </h1>
                </div>
              </div>

              <nav className="flex min-w-0 items-center gap-1.5 overflow-x-auto text-xs">
                {breadcrumbs.map((crumb, index) => {
                  const Icon = crumb.icon;
                  const isLast = index === breadcrumbs.length - 1;

                  return (
                    <div
                      key={`${crumb.label}-${index}`}
                      className="flex shrink-0 items-center gap-1.5"
                    >
                      {index > 0 ? (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                      ) : null}

                      {crumb.isCurrent || isLast ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#3D398C]/6 px-2 py-1 font-medium text-[#3D398C]">
                          {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                          <span className="truncate">{crumb.label}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            navigateWithDraftGuard(crumb.to, {
                              breadcrumbLabel: crumb.label,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-[#3D398C]"
                        >
                          {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                          <span className="truncate">{crumb.label}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </nav>
            </header>

            <div className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-7xl min-w-0">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>

      <AlertDialog
        open={showLogoutDialog}
        onOpenChange={(open) => {
          setShowLogoutDialog(open);
          if (!open) {
            setPendingProtectedAction(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-lg font-bold"
              style={{ color: BRAND_BLUE }}
            >
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to logout? You will need to sign in again to
              access the Internship Adviser dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer"
              onClick={() => setPendingProtectedAction(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLogoutDialog(false);
                if (pendingProtectedAction === "logout") {
                  setPendingProtectedAction(null);
                  handleLogout();
                }
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
