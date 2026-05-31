// src/pages/alumni-intern/components/layout/AlumniLayout.jsx

import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import PageTitle from "@/components/PageTitle";
import NULogoCapBlue from "@/assets/alumni-login/nuai-logo-white.png";

import {
  Bell,
  Bookmark,
  Briefcase,
  ChevronRight,
  ClipboardList,
  FileText,
  Gift,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  User,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BRAND_BLUE = "#3D398C";

const NAV = [
  {
    key: "news",
    label: "News",
    icon: Newspaper,
    to: "/news",
  },
  {
    key: "surveys",
    label: "Surveys",
    icon: ClipboardList,
    to: "/surveys",
  },
  {
    key: "jobs",
    label: "Jobs",
    icon: Briefcase,
    to: "/jobs",
  },
  {
    key: "services",
    label: "Services",
    icon: Gift,
    to: "/services",
  },
  {
    key: "profile",
    label: "Profile",
    icon: User,
    to: "/profile",
  },
];

const JOB_ENDPOINTS = [
  "/api/job-openings/",
  "/api/job-openings",
  "/api/job-posts/",
  "/api/job-posts",
  "/api/jobs/",
  "/api/jobs",
];

const SURVEY_ENDPOINTS = [
  "/api/surveys/",
  "/api/surveys",
];

const NEWS_ENDPOINTS = [
  "/api/posts/",
  "/api/posts",
  "/api/news-posts/",
  "/api/news-posts",
];

function normalizePath(pathname) {
  const cleaned = String(pathname || "").replace(/\/+$/, "");
  return cleaned || "/news";
}

function isNavActive(pathname, item) {
  const current = normalizePath(pathname);
  const target = normalizePath(item.to);

  return current === target || current.startsWith(`${target}/`);
}

function isSavedRoute(pathname) {
  const current = normalizePath(pathname);

  return (
    current === "/saved-posts" ||
    current.startsWith("/saved-posts/") ||
    current === "/saved-jobs" ||
    current.startsWith("/saved-jobs/")
  );
}

function isSavedPostsActive(pathname, state) {
  if (!isSavedRoute(pathname)) return false;

  const tab = state?.activeSavedTab;

  return tab !== "jobs";
}

function isSavedJobsActive(pathname, state) {
  if (!isSavedRoute(pathname)) return false;

  const tab = state?.activeSavedTab;

  return tab === "jobs" || normalizePath(pathname) === "/saved-jobs";
}

function roleToPosition(role) {
  if (role === "Alumni Officer") return "Alumni Affairs Officer";
  if (role === "AILPO") return "Academe Industry Linkages Placement Officer";
  if (role === "Super Admin") return "National University Alumni Information";
  return role || "—";
}

function cacheBust(url, createdAt) {
  if (!url) return url;

  const value =
    createdAt?.seconds ||
    createdAt?._seconds ||
    createdAt?.toDate?.()?.getTime?.() ||
    createdAt ||
    Date.now();

  return `${url}${url.includes("?") ? "&" : "?"}v=${value}`;
}

function getContainerMaxWidth(pathname) {
  const current = normalizePath(pathname);

  if (current === "/news" || current.startsWith("/news/")) {
    return "max-w-3xl";
  }

  if (current === "/surveys" || current.startsWith("/surveys/")) {
    return "max-w-6xl";
  }

  if (current === "/jobs" || current.startsWith("/jobs/")) {
    return "max-w-[92rem]";
  }

  if (
    current === "/saved-posts" ||
    current.startsWith("/saved-posts/") ||
    current === "/saved-jobs" ||
    current.startsWith("/saved-jobs/")
  ) {
    return "max-w-3xl";
  }

  if (current === "/services" || current.startsWith("/services/")) {
    return "max-w-[88rem]";
  }

  if (current === "/profile" || current.startsWith("/profile/")) {
    return "max-w-[92rem]";
  }

  return "max-w-3xl";
}

function shouldUseSideWidgets(pathname) {
  const current = normalizePath(pathname);

  return current === "/news" || current === "/saved-posts";
}

function getInitials(value, fallback = "NU") {
  const initials = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

  return initials || fallback;
}

function cleanText(value) {
  return String(value || "").trim();
}

function normText(value) {
  return cleanText(value).toLowerCase();
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function getStoredAccount() {
  try {
    const raw = localStorage.getItem("nuai_account");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredProfile(account) {
  try {
    const profileKeys = [
      "nuai_profile",
      "nuai_user_profile",
      account?.email ? `nuai_profile_${account.email}` : "",
    ].filter(Boolean);

    for (const key of profileKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function getMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value?._seconds === "number") return value._seconds * 1000;
  if (typeof value === "number") return value;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function relativeTime(ts) {
  if (!ts) return "";

  const millis = getMillis(ts);
  if (!millis) return "";

  const date = new Date(millis);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;

  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (date.getFullYear() === now.getFullYear()) {
    const monthDay = date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });

    return `${monthDay} at ${timeStr}`;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getProfileCompletion(profile, userEmail, photoSrc) {
  const pi = profile?.personalInformation || profile?.personal_information || {};
  const ci = profile?.contactInformation || profile?.contact_information || {};
  const addr = profile?.address || {};
  const ai = profile?.alumniInformation || profile?.alumni_information || {};

  const checks = [
    !!(pi?.firstName || pi?.first_name),
    !!(pi?.lastName || pi?.last_name),
    !!pi?.gender,

    !!(ci?.nuEmail || ci?.nu_email || userEmail),
    !!(ci?.officialEmail || ci?.official_email || ci?.personalEmail || ci?.personal_email),
    Array.isArray(ci?.mobileNumber || ci?.mobile_number)
      ? (ci?.mobileNumber || ci?.mobile_number).length > 0
      : !!(ci?.mobileNumber || ci?.mobile_number || ci?.contactNumber || ci?.contact_number),
    !!(ci?.telephoneNumber || ci?.telephone_number),
    Array.isArray(ci?.socials) && ci.socials.length > 0,

    !!addr?.country,
    !!addr?.city,
    !!(addr?.fullAddress || addr?.full_address),

    !!(ai?.studentId || ai?.student_id),
    !!(ai?.courseGraduated || ai?.course_graduated || profile?.course || profile?.academic_program),
    !!(ai?.graduationPeriod || ai?.graduation_period || profile?.batch || profile?.year_graduated),

    !!photoSrc,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

function getProfileName(profile, account) {
  const pi = profile?.personalInformation || profile?.personal_information || {};

  const nameFromParts = [
    pi?.firstName || pi?.first_name,
    pi?.middleName || pi?.middle_name,
    pi?.lastName || pi?.last_name,
  ]
    .map((part) => cleanText(part))
    .filter(Boolean)
    .join(" ");

  return (
    nameFromParts ||
    cleanText(pi?.fullName || pi?.full_name) ||
    cleanText(profile?.fullName || profile?.full_name) ||
    cleanText(profile?.name) ||
    cleanText(account?.name) ||
    cleanText(account?.full_name) ||
    cleanText(account?.fullName) ||
    cleanText(account?.displayName) ||
    cleanText(account?.display_name)
  );
}

function getProfilePhoto(profile, account) {
  return (
    profile?.personalization?.photoUrl ||
    profile?.personalization?.photoURL ||
    profile?.personalization?.photo_url ||
    profile?.photoURL ||
    profile?.photoUrl ||
    profile?.photo_url ||
    profile?.profilePhotoUrl ||
    profile?.profile_photo_url ||
    account?.photoURL ||
    account?.photoUrl ||
    account?.photo_url ||
    ""
  );
}

function normalizeStatus(value) {
  return String(value || "").trim().toUpperCase();
}

function getJobCreatedAt(job) {
  return (
    job?.systemAudit?.createdAt ||
    job?.system_audit?.created_at ||
    job?.createdAt ||
    job?.created_at ||
    job?.updatedAt ||
    job?.updated_at ||
    job?.systemAudit?.updatedAt ||
    job?.system_audit?.updated_at ||
    null
  );
}

function isJobVisibleToAlumni(job) {
  const status = normalizeStatus(job?.jobStatus || job?.job_status || job?.status);

  if (job?.isDraft === true || job?.is_draft === true) return false;
  if (job?.isOpen === false || job?.is_open === false) return false;
  if (job?.closedBySystem === true || job?.closed_by_system === true) return false;
  if (status === "CLOSED") return false;
  if (status === "PENDING APPROVAL") return false;
  if (status === "DRAFT") return false;
  if (status === "REJECTED") return false;

  if (job?.isApproved === false || job?.is_approved === false) return false;

  return true;
}

function isSurveyVisible(survey, accountRole) {
  const status = cleanText(
    survey?.status ||
      survey?.surveyStatus ||
      survey?.survey_status ||
      survey?.liveStatus ||
      survey?.live_status,
  ).toLowerCase();

  if (status && !["active", "published", "open", "live"].includes(status)) {
    return false;
  }

  const respondentTypes = normalizeArray(
    survey?.respondentTypes ||
      survey?.respondent_types ||
      survey?.respondentType ||
      survey?.respondent_type,
  ).map((item) => normText(item));

  if (respondentTypes.length === 0) return true;

  const currentType = normText(accountRole).includes("intern") ? "intern" : "alumni";

  return respondentTypes.includes(currentType);
}

async function fetchFirstWorkingEndpoint(endpoints = []) {
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);

      if (!response.ok) continue;

      const data = await response.json();

      if (Array.isArray(data)) return data;
      if (Array.isArray(data.results)) return data.results;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.posts)) return data.posts;
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.jobs)) return data.jobs;
      if (Array.isArray(data.surveys)) return data.surveys;

      return [];
    } catch {
      // Try next fallback endpoint.
    }
  }

  return [];
}

function NotificationSkeleton() {
  return (
    <div className="mx-2 mb-1 flex items-start gap-3 rounded-xl px-3 py-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function ProfileMiniCard({
  fullName,
  userEmail,
  photoSrc,
  userInitials,
  onNavigate,
  profile,
  effectiveRole,
}) {
  const completion = getProfileCompletion(profile, userEmail, photoSrc);
  const resolvedRole =
    cleanText(effectiveRole) ||
    cleanText(profile?.role) ||
    (profile?.isIntern === true || profile?.is_intern === true ? "Intern" : "Alumni");
  const roleLabel = roleToPosition(resolvedRole);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
            {photoSrc ? (
              <img
                src={cacheBust(photoSrc, profile?.updatedAt || profile?.updated_at)}
                alt="Avatar"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";

                  const fallback = e.currentTarget.nextSibling;
                  if (fallback) fallback.style.display = "grid";
                }}
              />
            ) : null}

            <div
              className="grid h-full w-full place-items-center text-xs font-bold text-white"
              style={{
                display: photoSrc ? "none" : "grid",
                backgroundColor: BRAND_BLUE,
              }}
            >
              {userInitials}
            </div>
          </div>

          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-semibold text-foreground">
              {fullName || "User"}
            </CardTitle>

            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-[#3D398C]/20 bg-[#3D398C]/5 px-2 py-0 text-[10px] font-medium text-[#3D398C]"
              >
                {roleLabel}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground/80">
              Profile completion
            </p>
            <span className="text-xs font-semibold text-[#3D398C]">
              {completion}%
            </span>
          </div>

          <Progress value={completion} className="h-2.5 [&>div]:bg-[#3D398C]" />

          <p className="text-xs leading-relaxed text-muted-foreground">
            Complete your profile to keep your{" "}
            {normText(resolvedRole) === "intern" ? "intern" : "alumni"} information
            updated.
          </p>
        </div>

        <Button
          type="button"
          className="h-9 w-full cursor-pointer bg-[#3D398C] text-white hover:bg-[#312d74]"
          onClick={() => onNavigate("/profile")}
        >
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
}

function RecentJobsCard({ onNavigate, jobs = [], loading = false }) {
  const list = Array.isArray(jobs) ? jobs : [];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center">
          <CardTitle className="pl-2 text-sm font-semibold text-[#3D398C]">
            Recent job posts
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-1 px-2.5">
        {loading ? (
          <>
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </>
        ) : list.length === 0 ? (
          <div className="px-2.5 py-5 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              No recent job posts yet.
            </p>
          </div>
        ) : (
          list.map((job, index) => (
            <div key={job.id}>
              <button
                type="button"
                onClick={() =>
                  onNavigate("/jobs", {
                    activeJobTab: "posts",
                    selectedJobId: job.id,
                    fromRecentJobs: true,
                    backPath: "/news",
                  })
                }
                className="flex w-full cursor-pointer items-start justify-between rounded-md px-2.5 py-2 text-left transition-colors hover:bg-slate-100"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground/80">
                    {job.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {job.company}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {job.meta}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="ml-3 shrink-0 border-[#3D398C]/20 bg-[#3D398C]/5 px-1.5 py-0 text-[10px] font-medium text-[#3D398C]"
                >
                  View
                </Badge>
              </button>

              {index !== list.length - 1 && <Separator className="my-1" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RecentSurveysCard({ onNavigate, surveys = [], loading = false }) {
  const list = Array.isArray(surveys) ? surveys : [];

  function openSurvey(surveyId) {
    const cleanSurveyId = String(surveyId || "").trim();

    if (!cleanSurveyId) {
      onNavigate("/surveys");
      return;
    }

    onNavigate(`/survey/${cleanSurveyId}`);
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center">
          <CardTitle className="pl-2 text-sm font-semibold text-[#3D398C]">
            Recent surveys
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-1 px-2.5">
        {loading ? (
          <>
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </>
        ) : list.length === 0 ? (
          <div className="px-2.5 py-5 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              No recent surveys yet.
            </p>
          </div>
        ) : (
          list.map((survey, index) => (
            <div key={survey.id}>
              <button
                type="button"
                onClick={() => openSurvey(survey.id)}
                className="flex w-full cursor-pointer items-start justify-between rounded-md px-2.5 py-2 text-left transition-colors hover:bg-slate-100"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground/80">
                    {survey.title}
                  </p>

                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {survey.meta}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="ml-3 shrink-0 border-[#3D398C]/20 bg-[#3D398C]/5 px-1.5 py-0 text-[10px] font-medium text-[#3D398C]"
                >
                  View
                </Badge>
              </button>

              {index !== list.length - 1 && <Separator className="my-1" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionsCard({ onNavigate }) {
  const actions = [
    {
      label: "Messages",
      icon: MessageSquare,
      onClick: () => onNavigate("/messages"),
    },
    {
      label: "View Saved Jobs",
      icon: Bookmark,
      onClick: () =>
        onNavigate("/saved-posts", {
          activeSavedTab: "jobs",
        }),
    },
    {
      label: "My Applications",
      icon: FileText,
      onClick: () =>
        onNavigate("/jobs", {
          activeJobTab: "applications",
        }),
    },
  ];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center">
          <CardTitle className="pl-2 text-sm font-semibold text-[#3D398C]">
            Quick actions
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-0.5 px-3 pb-0 pt-0">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Icon size={15} className="text-muted-foreground" />
                <span className="truncate text-sm font-medium text-foreground/80">
                  {action.label}
                </span>
              </div>

              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function AlumniLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [recentJobs, setRecentJobs] = useState([]);
  const [recentJobsLoading, setRecentJobsLoading] = useState(true);

  const [recentSurveys, setRecentSurveys] = useState([]);
  const [recentSurveysLoading, setRecentSurveysLoading] = useState(true);

  const account = useMemo(() => getStoredAccount(), []);
  const profile = useMemo(() => getStoredProfile(account) || account || {}, [account]);

  const effectiveRole = useMemo(() => {
    if (typeof account?.role === "string" && account.role.trim()) return account.role;
    if (typeof profile?.role === "string" && profile.role.trim()) return profile.role;
    if (profile?.isIntern === true || profile?.is_intern === true) return "Intern";

    return "Alumni";
  }, [account?.role, profile]);

  const displayName = useMemo(() => {
    return getProfileName(profile, account) || "User";
  }, [profile, account]);

  const userEmail =
    account?.email ||
    profile?.email ||
    profile?.personal_email ||
    profile?.personalEmail ||
    profile?.nu_email ||
    profile?.nuEmail ||
    "—";

  const photoSrc = getProfilePhoto(profile, account);
  const userInitials = getInitials(displayName, "AL");

  const currentPath = normalizePath(location.pathname);
  const isRequirementGateRoute = currentPath === "/requirement-gate";
  const useSideWidgets = shouldUseSideWidgets(location.pathname);
  const savedPostsActive = isSavedPostsActive(location.pathname, location.state);
  const savedJobsActive = isSavedJobsActive(location.pathname, location.state);
  const savedActive = savedPostsActive || savedJobsActive;

  function navigateTo(path, state) {
    navigate(path, state ? { state } : undefined);
  }

  function handleLogout() {
    localStorage.removeItem("nuai_account");
    localStorage.removeItem("nuai_profile");
    localStorage.removeItem("nuai_user_profile");
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadRecentJobs() {
      setRecentJobsLoading(true);

      try {
        const rows = await fetchFirstWorkingEndpoint(JOB_ENDPOINTS);

        const mapped = rows
          .filter(isJobVisibleToAlumni)
          .sort((a, b) => getMillis(getJobCreatedAt(b)) - getMillis(getJobCreatedAt(a)))
          .slice(0, 2)
          .map((job) => {
            const createdAt = getJobCreatedAt(job);

            return {
              id: job.id || job.job_id || job.pk,
              title:
                cleanText(job.jobTitle || job.job_title || job.title || job.position) ||
                "Untitled Job",
              company:
                cleanText(
                  job.createdByCompany ||
                    job.created_by_company ||
                    job.companyName ||
                    job.company_name ||
                    job.company,
                ) || "Company",
              meta: createdAt ? relativeTime(createdAt) : "Recently posted",
            };
          });

        if (!cancelled) {
          setRecentJobs(mapped);
        }
      } catch (error) {
        console.error("Failed to load recent jobs:", error);

        if (!cancelled) {
          setRecentJobs([]);
        }
      } finally {
        if (!cancelled) {
          setRecentJobsLoading(false);
        }
      }
    }

    loadRecentJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRecentSurveys() {
      setRecentSurveysLoading(true);

      try {
        const rows = await fetchFirstWorkingEndpoint(SURVEY_ENDPOINTS);

        const mapped = rows
          .filter((survey) => isSurveyVisible(survey, effectiveRole))
          .sort(
            (a, b) =>
              getMillis(b.createdAt || b.created_at || b.updatedAt || b.updated_at) -
              getMillis(a.createdAt || a.created_at || a.updatedAt || a.updated_at),
          )
          .slice(0, 2)
          .map((survey) => ({
            id: survey.id || survey.survey_id || survey.pk,
            title:
              cleanText(survey.surveyTitle || survey.survey_title || survey.title) ||
              "Untitled Survey",
            meta: "New survey",
          }));

        if (!cancelled) {
          setRecentSurveys(mapped);
        }
      } catch (error) {
        console.error("Failed to load recent surveys:", error);

        if (!cancelled) {
          setRecentSurveys([]);
        }
      } finally {
        if (!cancelled) {
          setRecentSurveysLoading(false);
        }
      }
    }

    loadRecentSurveys();

    return () => {
      cancelled = true;
    };
  }, [effectiveRole]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      setNotificationsLoading(true);

      try {
        const rows = await fetchFirstWorkingEndpoint(NEWS_ENDPOINTS);

        const mapped = rows
          .sort(
            (a, b) =>
              getMillis(b.createdAt || b.created_at || b.updatedAt || b.updated_at) -
              getMillis(a.createdAt || a.created_at || a.updatedAt || a.updated_at),
          )
          .slice(0, 5)
          .map((post) => {
            const name =
              post.authorName ||
              post.author_name ||
              post.createdByName ||
              post.created_by_name ||
              post.authorEmail?.split("@")?.[0] ||
              post.author_email?.split("@")?.[0] ||
              "Unknown";

            const roleLabel =
              roleToPosition(post.authorRole || post.author_role) ||
              post.authorRole ||
              post.author_role ||
              "—";

            const header = String(post.postHeader || post.post_header || post.title || "").trim();
            const content = String(
              post.postContent || post.post_content || post.text || post.description || "",
            ).trim();

            const previewSource = header || content || "posted a new update.";
            const preview =
              previewSource.length > 90
                ? `${previewSource.slice(0, 90).trimEnd()}…`
                : previewSource;

            const photoURLs = Array.isArray(post.photoURLs)
              ? post.photoURLs
              : Array.isArray(post.photo_urls)
                ? post.photo_urls
                : [];

            return {
              id: post.id || post.post_id || post.pk,
              name,
              role: roleLabel,
              time: relativeTime(post.createdAt || post.created_at),
              text: preview,
              avatar:
                post.authorPhoto ||
                post.author_photo ||
                post.profilePhotoUrl ||
                post.profile_photo_url ||
                "",
              unread: true,

              postHeader: header,
              postContent: content,
              links: Array.isArray(post.links) ? post.links : normalizeArray(post.links),
              photoURLs,
              createdAt: post.createdAt || post.created_at || null,
            };
          });

        if (!cancelled) {
          setNotifications(mapped);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);

        if (!cancelled) {
          setNotifications([]);
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isRequirementGateRoute) {
    return (
      <>
        <PageTitle title="Account Requirement | NUAI" />

        <main className="min-h-screen bg-[#f2f4f7] px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Alumni Portal | NUAI" />

      <TooltipProvider>
        <div className="min-h-screen bg-[#f2f4f7]">
          <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="relative flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => navigateTo("/news")}
                className="z-10 flex shrink-0 cursor-pointer items-center gap-2.5 rounded-md text-left"
              >
                <img
                  src={NULogoCapBlue}
                  alt="NUAI Logo"
                  className="h-11 w-auto object-contain"
                />

                <div className="hidden min-w-0 sm:block">
                  <p
                    className="text-sm font-bold leading-tight tracking-wide"
                    style={{ color: BRAND_BLUE }}
                  >
                    NUAI
                  </p>
                  <p className="text-[9px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
                    Alumni Portal
                  </p>
                </div>
              </button>

              <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-5 md:flex">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavActive(location.pathname, item);

                  return (
                    <Tooltip key={item.key}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => navigateTo(item.to)}
                          className={[
                            "relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-[#3D398C]/8 text-[#3D398C]"
                              : "text-muted-foreground hover:bg-[#3D398C]/5 hover:text-[#3D398C]",
                          ].join(" ")}
                        >
                          <Icon
                            size={18}
                            className={isActive ? "text-[#3D398C]" : ""}
                          />

                          <span className="hidden lg:inline">
                            {item.label}
                          </span>

                          {isActive ? (
                            <span
                              className="absolute -bottom-[11px] left-0 right-0 h-[2px] rounded-full"
                              style={{ backgroundColor: BRAND_BLUE }}
                            />
                          ) : null}
                        </button>
                      </TooltipTrigger>

                      <TooltipContent side="bottom" className="lg:hidden">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              <div className="z-10 hidden shrink-0 items-center gap-3 md:flex">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() =>
                        navigateTo("/saved-posts", {
                          activeSavedTab: "posts",
                        })
                      }
                      className={[
                        "relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all duration-200",
                        savedActive
                          ? "bg-[#3D398C]/10 text-[#3D398C]"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-[#3D398C]",
                      ].join(" ")}
                    >
                      <Bookmark
                        size={21}
                        strokeWidth={2}
                        fill={savedActive ? "currentColor" : "none"}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Saved Posts</p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100/80"
                    >
                      <Bell size={21} />

                      {notifications.length > 0 ? (
                        <span className="absolute right-0 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {notifications.length}
                        </span>
                      ) : null}
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="z-50 w-[360px] rounded-2xl border border-slate-200/80 bg-white p-0 text-slate-900 shadow-xl shadow-slate-200/60"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Notifications
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Recent updates from the portal
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {notifications.length} new
                      </span>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto py-2">
                      {notificationsLoading ? (
                        <>
                          <NotificationSkeleton />
                          <NotificationSkeleton />
                          <NotificationSkeleton />
                        </>
                      ) : notifications.length > 0 ? (
                        notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedNotification(item)}
                            className={`mx-2 mb-1 flex w-[calc(100%-1rem)] cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                              item.unread
                                ? "bg-indigo-50/50 hover:bg-indigo-50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="relative shrink-0">
                              {item.avatar ? (
                                <img
                                  src={item.avatar}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                                />
                              ) : (
                                <div
                                  className="grid h-10 w-10 place-items-center rounded-full text-[11px] font-bold text-white ring-1 ring-slate-200"
                                  style={{ backgroundColor: BRAND_BLUE }}
                                >
                                  {getInitials(item.name)}
                                </div>
                              )}

                              {item.unread ? (
                                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                              ) : null}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.name}
                                </p>

                                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                                  {item.role}
                                </span>
                              </div>

                              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
                                {item.text}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                {item.time}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm font-medium text-slate-700">
                            No notifications yet
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            New post updates will appear here.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setShowAllNotifications(true)}
                        className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        View all notifications
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-3 rounded-lg bg-background px-3 py-1.5 text-left transition-colors duration-150 hover:bg-muted/40"
                    >
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted shadow-sm ring-1 ring-slate-200/80">
                        {photoSrc ? (
                          <img
                            src={cacheBust(photoSrc, profile?.updatedAt || profile?.updated_at)}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";

                              const fallback = e.currentTarget.nextSibling;
                              if (fallback) fallback.style.display = "grid";
                            }}
                          />
                        ) : null}

                        <div
                          className="grid h-full w-full place-items-center text-[10px] font-bold text-white"
                          style={{
                            display: photoSrc ? "none" : "grid",
                            backgroundColor: BRAND_BLUE,
                          }}
                        >
                          {userInitials}
                        </div>
                      </div>

                      <div className="hidden min-w-0 lg:block">
                        <p className="max-w-[140px] truncate text-xs font-medium text-foreground">
                          {displayName}
                        </p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="z-50 w-52 border border-slate-200 bg-white text-slate-900 shadow-lg"
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {userEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="cursor-pointer gap-2"
                      onClick={() => navigateTo("/profile")}
                    >
                      <User size={15} />
                      <span>View Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer gap-2"
                      onClick={() => navigateTo("/messages")}
                    >
                      <MessageSquare size={15} />
                      <span>Messages</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className={[
                        "cursor-pointer gap-2",
                        savedJobsActive ? "bg-[#3D398C]/8 text-[#3D398C]" : "",
                      ].join(" ")}
                      onClick={() =>
                        navigateTo("/saved-posts", {
                          activeSavedTab: "jobs",
                        })
                      }
                    >
                      <Bookmark
                        size={15}
                        fill={savedJobsActive ? "currentColor" : "none"}
                      />
                      <span>Saved Jobs</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer gap-2"
                      onClick={() => setShowLogoutDialog(true)}
                    >
                      <LogOut size={15} />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="ml-auto flex items-center gap-2 md:hidden">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-pointer"
                    >
                      <Menu size={20} />
                    </Button>
                  </SheetTrigger>

                  <SheetContent side="right" className="w-72 bg-white p-0 text-slate-900">
                    <SheetHeader className="border-b border-border/40 px-5 py-4">
                      <SheetTitle className="flex items-center gap-2.5">
                        <img
                          src={NULogoCapBlue}
                          alt="NUAI"
                          className="h-8 w-auto object-contain"
                        />

                        <span
                          style={{ color: BRAND_BLUE }}
                          className="text-base font-bold"
                        >
                          NUAI
                        </span>
                      </SheetTitle>
                    </SheetHeader>

                    <div className="border-b border-border/40 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
                          {photoSrc ? (
                            <img
                              src={cacheBust(photoSrc, profile?.updatedAt || profile?.updated_at)}
                              alt="Avatar"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";

                                const fallback = e.currentTarget.nextSibling;
                                if (fallback) fallback.style.display = "grid";
                              }}
                            />
                          ) : null}

                          <div
                            className="grid h-full w-full place-items-center text-xs font-bold text-white"
                            style={{
                              display: photoSrc ? "none" : "grid",
                              backgroundColor: BRAND_BLUE,
                            }}
                          >
                            {userInitials}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {displayName}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            {userEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-3">
                      <div className="space-y-1">
                        {NAV.map((item) => {
                          const Icon = item.icon;
                          const isActive = isNavActive(location.pathname, item);

                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => {
                                navigateTo(item.to);
                                setMobileNavOpen(false);
                              }}
                              className={[
                                "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                                isActive
                                  ? "bg-[#3D398C] text-white"
                                  : "text-foreground/80 hover:bg-[#3D398C]/8 hover:text-[#3D398C]",
                              ].join(" ")}
                            >
                              <Icon
                                size={18}
                                className={isActive ? "text-white" : ""}
                              />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => {
                            navigateTo("/messages");
                            setMobileNavOpen(false);
                          }}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-all duration-150 hover:bg-[#3D398C]/8 hover:text-[#3D398C]"
                        >
                          <MessageSquare size={18} />
                          <span>Messages</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigateTo("/saved-posts", {
                              activeSavedTab: "jobs",
                            });
                            setMobileNavOpen(false);
                          }}
                          className={[
                            "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                            savedJobsActive
                              ? "bg-[#3D398C] text-white"
                              : "text-foreground/80 hover:bg-[#3D398C]/8 hover:text-[#3D398C]",
                          ].join(" ")}
                        >
                          <Bookmark
                            size={18}
                            fill={savedJobsActive ? "currentColor" : "none"}
                          />
                          <span>Saved Jobs</span>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-border/40 px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileNavOpen(false);
                          setShowLogoutDialog(true);
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </nav>

          <main className="min-w-0 flex-1 bg-[#f2f4f7] p-4 sm:p-6 lg:p-8">
            {useSideWidgets ? (
              <div className="mx-auto w-full max-w-[88rem] animate-fadeIn">
                <div className="grid grid-cols-1 items-start justify-center gap-6 xl:grid-cols-[280px_minmax(0,48rem)_320px] 2xl:grid-cols-[300px_minmax(0,48rem)_320px]">
                  <aside className="sticky top-20 hidden h-fit xl:block">
                    <div className="space-y-4">
                      <ProfileMiniCard
                        fullName={displayName}
                        userEmail={userEmail}
                        photoSrc={photoSrc}
                        userInitials={userInitials}
                        onNavigate={navigateTo}
                        profile={profile}
                        effectiveRole={effectiveRole}
                      />

                      <RecentJobsCard
                        onNavigate={navigateTo}
                        jobs={recentJobs}
                        loading={recentJobsLoading}
                      />

                      <RecentSurveysCard
                        onNavigate={navigateTo}
                        surveys={recentSurveys}
                        loading={recentSurveysLoading}
                      />
                    </div>
                  </aside>

                  <div className="mx-auto w-full max-w-3xl min-w-0 xl:mx-0">
                    <div className="space-y-6">
                      <Outlet />
                    </div>
                  </div>

                  <aside className="sticky top-20 hidden h-fit xl:block">
                    <QuickActionsCard onNavigate={navigateTo} />
                  </aside>
                </div>

                <div className="mx-auto mt-6 max-w-3xl space-y-4 xl:hidden">
                  <ProfileMiniCard
                    fullName={displayName}
                    userEmail={userEmail}
                    photoSrc={photoSrc}
                    userInitials={userInitials}
                    onNavigate={navigateTo}
                    profile={profile}
                    effectiveRole={effectiveRole}
                  />

                  <RecentJobsCard
                    onNavigate={navigateTo}
                    jobs={recentJobs}
                    loading={recentJobsLoading}
                  />

                  <RecentSurveysCard
                    onNavigate={navigateTo}
                    surveys={recentSurveys}
                    loading={recentSurveysLoading}
                  />

                  <QuickActionsCard onNavigate={navigateTo} />
                </div>
              </div>
            ) : (
              <div
                className={`mx-auto w-full min-w-0 transition-all duration-100 ${getContainerMaxWidth(
                  location.pathname,
                )}`}
              >
                <Outlet />
              </div>
            )}
          </main>
        </div>

        <Dialog
          open={!!selectedNotification}
          onOpenChange={(open) => {
            if (!open) setSelectedNotification(null);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto bg-white p-0 sm:max-w-2xl">
            {selectedNotification ? (
              <div>
                <div className="flex items-start gap-3 border-b border-border/40 p-5 pb-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
                    {selectedNotification.avatar ? (
                      <img
                        src={selectedNotification.avatar}
                        alt={selectedNotification.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}

                    <div
                      className="grid h-full w-full place-items-center text-xs font-bold text-white"
                      style={{
                        display: selectedNotification.avatar ? "none" : "grid",
                        background: BRAND_BLUE,
                      }}
                    >
                      {getInitials(selectedNotification.name)}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {selectedNotification.name}
                      </p>

                      <Badge
                        variant="outline"
                        className="border-[#3D398C]/20 bg-[#3D398C]/5 px-1.5 py-0 text-[10px] font-medium text-[#3D398C]"
                      >
                        {selectedNotification.role}
                      </Badge>
                    </div>

                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {selectedNotification.time}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  {selectedNotification.postHeader ? (
                    <h3 className="whitespace-pre-wrap text-base font-semibold leading-snug text-foreground/80">
                      {selectedNotification.postHeader}
                    </h3>
                  ) : null}

                  {selectedNotification.postContent ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {selectedNotification.postContent}
                    </p>
                  ) : null}

                  {selectedNotification.links?.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedNotification.links.map((link, index) => {
                        const url = typeof link === "string" ? link : link.url;

                        if (!url) return null;

                        return (
                          <a
                            key={`${url}_${index}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium text-[#3D398C] transition-colors hover:border-[#3D398C]/20 hover:bg-[#3D398C]/5"
                          >
                            <Link2
                              size={14}
                              className="shrink-0 text-[#3D398C]/60 group-hover:text-[#3D398C]"
                            />

                            <span className="truncate">
                              {typeof link === "string" ? link : link.label || link.url}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  ) : null}

                  {selectedNotification.photoURLs?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedNotification.photoURLs.map((src, index) => (
                        <img
                          key={`${src}_${index}`}
                          src={src}
                          alt=""
                          className="w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-95"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog
          open={showAllNotifications}
          onOpenChange={setShowAllNotifications}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto bg-white p-0 sm:max-w-2xl">
            <div className="border-b border-border/40 px-5 py-4">
              <h2 className="text-base font-bold text-[#3D398C]">
                All Notifications
              </h2>
              <p className="text-xs text-muted-foreground">
                Recent updates from the portal
              </p>
            </div>

            <div className="space-y-1 p-3">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedNotification(item);
                      setShowAllNotifications(false);
                    }}
                    className="flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="relative shrink-0">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div
                          className="grid h-10 w-10 place-items-center rounded-full text-[11px] font-bold text-white ring-1 ring-slate-200"
                          style={{ backgroundColor: BRAND_BLUE }}
                        >
                          {getInitials(item.name)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.name}
                        </p>

                        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                          {item.role}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {item.text}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {item.time}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    New post updates will appear here.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </TooltipProvider>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-white sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-lg font-bold"
              style={{ color: BRAND_BLUE }}
            >
              Confirm Logout
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to logout? You will need to sign in again to
              access the alumni portal.
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