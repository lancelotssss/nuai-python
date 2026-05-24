// src/pages/faculty-admin/alumni-officer/layout/OfficerLayout.jsx

import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Eye,
  FileText,
  Gift,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  PencilLine,
  PlusCircle,
  ShieldCheck,
  User,
  UserRound,
  Users,
} from "lucide-react";

import { Collapsible } from "radix-ui";


import PageTitle from "@/components/PageTitle";
import NULogoCapBlue from "@/assets/alumni-login/nuai-logo-white.png";

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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { TooltipProvider } from "@/components/ui/tooltip";

const BRAND_BLUE = "#3D398C";

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null");
  } catch {
    return null;
  }
}


const OFFICER_NAV_ITEMS = [
  {
    key: "dashboard",
    to: "/alumni-officer",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    key: "alumni",
    to: "/alumni-officer/alumni/manage",
    label: "Manage Alumni",
    icon: Users,
    end: false,
    children: [
      {
        key: "employment-analytics",
        to: "/alumni-officer/alumni/manage/analytics",
        label: "Employment Analytics",
      },
    ],
  },
  {
    key: "posts",
    to: "/alumni-officer/posts",
    label: "Manage Posts",
    icon: FileText,
    end: false,
    children: [
      {
        key: "create-post",
        to: "/alumni-officer/posts/create",
        label: "Create Post",
      },
    ],
  },
  {
    key: "surveys",
    to: "/alumni-officer/surveys",
    label: "Manage Surveys",
    icon: ClipboardList,
    end: false,
    children: [
      {
        key: "create-survey",
        to: "/alumni-officer/surveys/create",
        label: "Create Survey",
      },
    ],
  },
  {
    key: "perks-discounts",
    to: "/alumni-officer/perks-discounts",
    label: "Manage Perks & Discounts",
    icon: Gift,
    end: false,
    children: [
      {
        key: "create-perks-discounts",
        to: "/alumni-officer/perks-discounts/create",
        label: "Create Perks & Discounts",
      },
    ],
  },
  {
    key: "calendar",
    to: "/alumni-officer/calendar",
    label: "Manage Calendar of Events",
    icon: CalendarDays,
    end: false,
    children: [
      {
        key: "create-calendar-event",
        to: "/alumni-officer/calendar/create",
        label: "Create Event",
      },
    ],
  },
  {
    key: "profile",
    to: "/alumni-officer/profile",
    label: "Profile",
    icon: User,
    end: false,
  },
  {
    key: "system-audit",
    to: "/alumni-officer/system-audit",
    label: "System Audit",
    icon: ShieldCheck,
    end: false,
  },
];

function safe(value) {
  return String(value ?? "").trim();
}

function normalizePath(value) {
  const path = safe(value).replace(/\/+$/, "");
  return path || "/alumni-officer";
}

function isOfficerPostEditPath(pathname) {
  return /^\/alumni-officer\/posts\/edit\/[^/]+$/.test(pathname);
}

function isOfficerSurveyViewPath(pathname) {
  return /^\/alumni-officer\/surveys\/view\/[^/]+$/.test(pathname);
}

function isOfficerSurveyResponsesPath(pathname) {
  return /^\/alumni-officer\/surveys\/[^/]+\/responses$/.test(pathname);
}

function isOfficerSurveyRespondentsPath(pathname) {
  return /^\/alumni-officer\/surveys\/[^/]+\/respondents$/.test(pathname);
}

function isOfficerSurveySingleRespondentPath(pathname) {
  return /^\/alumni-officer\/surveys\/[^/]+\/respondents\/[^/]+$/.test(pathname);
}

function isOfficerSurveyHistoryPath(pathname) {
  return /^\/alumni-officer\/surveys\/[^/]+\/history$/.test(pathname);
}

function isOfficerSurveyHistoryPreviewPath(pathname) {
  return /^\/alumni-officer\/surveys\/[^/]+\/history\/[^/]+$/.test(pathname);
}

function isOfficerSurveyHistoryResponsesPath(pathname) {
  return /^\/alumni-officer\/surveys\/[^/]+\/history\/[^/]+\/responses$/.test(
    pathname,
  );
}

function isOfficerSurveyHistoryRespondentsPath(pathname) {
  return /^\/alumni-officer\/surveys\/[^/]+\/history\/[^/]+\/respondents$/.test(
    pathname,
  );
}

function isOfficerSurveyHistorySingleRespondentPath(pathname) {
  return /^\/alumni-officer\/surveys\/[^/]+\/history\/[^/]+\/respondents\/[^/]+$/.test(
    pathname,
  );
}

function isOfficerSurveyEditPath(pathname) {
  return /^\/alumni-officer\/surveys\/edit\/[^/]+$/.test(pathname);
}

function isOfficerSurveyCreateBranchingPath(pathname) {
  return pathname === "/alumni-officer/surveys/create/branching";
}

function isOfficerSurveyEditBranchingPath(pathname) {
  return /^\/alumni-officer\/surveys\/edit\/[^/]+\/branching$/.test(pathname);
}

function isOfficerPerkViewPath(pathname) {
  return /^\/alumni-officer\/perks-discounts\/view\/[^/]+$/.test(pathname);
}

function isOfficerPerkEditPath(pathname) {
  return /^\/alumni-officer\/perks-discounts\/edit\/[^/]+$/.test(pathname);
}

function isOfficerCalendarEditPath(pathname) {
  return /^\/alumni-officer\/calendar\/edit\/[^/]+$/.test(pathname);
}

function isOfficerAlumniPath(pathname) {
  return (
    pathname === "/alumni-officer/alumni/manage" ||
    pathname === "/alumni-officer/alumni/manage/analytics" ||
    pathname === "/alumni-officer/alumni/manage/advanced"
  );
}

function isOfficerPostsPath(pathname) {
  return (
    pathname === "/alumni-officer/posts" ||
    pathname === "/alumni-officer/posts/create" ||
    isOfficerPostEditPath(pathname)
  );
}

function isOfficerSurveysPath(pathname) {
  return (
    pathname === "/alumni-officer/surveys" ||
    pathname === "/alumni-officer/surveys/create" ||
    isOfficerSurveyCreateBranchingPath(pathname) ||
    isOfficerSurveyEditPath(pathname) ||
    isOfficerSurveyEditBranchingPath(pathname) ||
    isOfficerSurveyViewPath(pathname) ||
    isOfficerSurveyResponsesPath(pathname) ||
    isOfficerSurveyRespondentsPath(pathname) ||
    isOfficerSurveySingleRespondentPath(pathname) ||
    isOfficerSurveyHistoryPath(pathname) ||
    isOfficerSurveyHistoryPreviewPath(pathname) ||
    isOfficerSurveyHistoryResponsesPath(pathname) ||
    isOfficerSurveyHistoryRespondentsPath(pathname) ||
    isOfficerSurveyHistorySingleRespondentPath(pathname)
  );
}

function isOfficerPerksPath(pathname) {
  return (
    pathname === "/alumni-officer/perks-discounts" ||
    pathname === "/alumni-officer/perks-discounts/create" ||
    isOfficerPerkViewPath(pathname) ||
    isOfficerPerkEditPath(pathname)
  );
}

function isOfficerCalendarPath(pathname) {
  return (
    pathname === "/alumni-officer/calendar" ||
    pathname === "/alumni-officer/calendar/create" ||
    isOfficerCalendarEditPath(pathname)
  );
}

function getSurveyTitle(state) {
  return (
    safe(state?.surveyTitle) ||
    safe(state?.initialSurvey?.surveyTitle) ||
    safe(state?.title) ||
    safe(state?.breadcrumbLabel) ||
    "Survey"
  );
}

function getPerkTitle(state) {
  return (
    safe(state?.perkTitle) ||
    safe(state?.title) ||
    safe(state?.breadcrumbLabel) ||
    "Perks & Discounts"
  );
}

function getCalendarTitle(state) {
  return (
    safe(state?.eventTitle) ||
    safe(state?.title) ||
    safe(state?.breadcrumbLabel) ||
    "Event"
  );
}

function getHistoryVersion(state) {
  return (
    safe(state?.historyVersion) ||
    safe(state?.initialSurvey?.historyVersion) ||
    safe(state?.initialSurvey?.__historyVersion) ||
    safe(state?.initialSurvey?.version) ||
    safe(state?.initialSurvey?.versionNumber) ||
    safe(state?.version) ||
    ""
  );
}

function formatVersionLabel(value) {
  const rawVersion = safe(value);

  if (!rawVersion) return "Version";

  return rawVersion.toLowerCase().startsWith("v")
    ? `Version ${rawVersion.toUpperCase()}`
    : `Version V${rawVersion}`;
}

function buildSurveyOnlyState(state, surveyLabel) {
  return {
    surveyTitle: surveyLabel,
    breadcrumbLabel: surveyLabel,
    title: surveyLabel,
    initialSurvey: null,
    fromHistory: false,
    historyId: "",
    __historyId: "",
    historyVersion: "",
    __historyVersion: "",
    historyAction: "",
    historySavedAt: null,
    historyReason: "",
  };
}

function buildPreservedHistoryState(state, extra = {}) {
  const surveyTitle =
    safe(extra?.surveyTitle) ||
    safe(state?.surveyTitle) ||
    safe(state?.initialSurvey?.surveyTitle) ||
    safe(state?.breadcrumbLabel) ||
    "Survey";

  const historyVersion =
    safe(extra?.historyVersion) ||
    safe(state?.historyVersion) ||
    safe(state?.initialSurvey?.historyVersion) ||
    safe(state?.initialSurvey?.__historyVersion) ||
    safe(state?.initialSurvey?.version) ||
    safe(state?.initialSurvey?.versionNumber) ||
    "";

  return {
    ...(state || {}),
    ...(extra || {}),
    surveyTitle,
    breadcrumbLabel: surveyTitle,
    fromHistory: extra?.fromHistory ?? state?.fromHistory ?? true,
    historyVersion,
    historyId:
      safe(extra?.historyId) ||
      safe(state?.historyId) ||
      safe(state?.initialSurvey?.historyId) ||
      safe(state?.initialSurvey?.__historyId) ||
      "",
    initialSurvey: extra?.initialSurvey || state?.initialSurvey || null,
  };
}

function clearRadixPointerLock() {
  if (typeof document === "undefined") return;

  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.removeAttribute("data-scroll-locked");

  document.documentElement.style.pointerEvents = "";
  document.documentElement.style.overflow = "";
  document.documentElement.style.paddingRight = "";
  document.documentElement.removeAttribute("data-scroll-locked");
}

function OfficerSidebarAvatar({ photoUrl, initials, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  if (photoUrl && !imageFailed) {
    return (
      <img
        src={photoUrl}
        alt="Officer profile"
        className={`h-8 w-8 shrink-0 rounded-full object-cover ${className}`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${className}`}
      style={{ backgroundColor: BRAND_BLUE }}
    >
      {initials}
    </div>
  );
}

function buildBreadcrumbs(pathname, state) {
  const path = normalizePath(pathname);

  if (path === "/alumni-officer") {
    return [
      {
        label: "Dashboard",
        to: "/alumni-officer",
        icon: LayoutDashboard,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/alumni/manage") {
    return [
      {
        label: "Manage Alumni",
        to: "/alumni-officer/alumni/manage",
        icon: Users,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/alumni/manage/analytics") {
    return [
      {
        label: "Manage Alumni",
        to: "/alumni-officer/alumni/manage",
        icon: Users,
        isCurrent: false,
      },
      {
        label: "Employment Analytics",
        to: "/alumni-officer/alumni/manage/analytics",
        icon: BarChart3,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/alumni/manage/advanced") {
    return [
      {
        label: "Manage Alumni",
        to: "/alumni-officer/alumni/manage",
        icon: Users,
        isCurrent: false,
      },
      {
        label: "Advanced Export",
        to: "/alumni-officer/alumni/manage/advanced",
        icon: BarChart3,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/posts") {
    return [
      {
        label: "Manage Posts",
        to: "/alumni-officer/posts",
        icon: FileText,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/posts/create") {
    return [
      {
        label: "Manage Posts",
        to: "/alumni-officer/posts",
        icon: FileText,
        isCurrent: false,
      },
      {
        label: "Create Post",
        to: "/alumni-officer/posts/create",
        icon: PlusCircle,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerPostEditPath(path)) {
    return [
      {
        label: "Manage Posts",
        to: "/alumni-officer/posts",
        icon: FileText,
        isCurrent: false,
      },
      {
        label: "Edit Post",
        to: path,
        icon: PencilLine,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/surveys") {
    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/surveys/create") {
    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: "Create Survey",
        to: "/alumni-officer/surveys/create",
        icon: PlusCircle,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerSurveyCreateBranchingPath(path)) {
    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: "Create Survey",
        to: "/alumni-officer/surveys/create",
        icon: PlusCircle,
        isCurrent: false,
      },
      {
        label: "Survey Branching",
        to: path,
        icon: Activity,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerSurveyViewPath(path)) {
    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: getSurveyTitle(state),
        to: path,
        icon: Eye,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerSurveyResponsesPath(path)) {
    const surveyId = path.match(
      /^\/alumni-officer\/surveys\/([^/]+)\/responses$/,
    )?.[1];

    const viewPath = surveyId
      ? `/alumni-officer/surveys/view/${surveyId}`
      : "/alumni-officer/surveys";

    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: getSurveyTitle(state),
        to: viewPath,
        icon: Eye,
        isCurrent: false,
      },
      {
        label: "Survey Responses",
        to: path,
        icon: BarChart3,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerSurveyRespondentsPath(path)) {
    const surveyId = path.match(
      /^\/alumni-officer\/surveys\/([^/]+)\/respondents$/,
    )?.[1];

    const viewPath = surveyId
      ? `/alumni-officer/surveys/view/${surveyId}`
      : "/alumni-officer/surveys";

    const responsesPath = surveyId
      ? `/alumni-officer/surveys/${surveyId}/responses`
      : "/alumni-officer/surveys";

    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: getSurveyTitle(state),
        to: viewPath,
        icon: Eye,
        isCurrent: false,
      },
      {
        label: "Survey Responses",
        to: responsesPath,
        icon: BarChart3,
        isCurrent: false,
      },
      {
        label: "Survey Respondents",
        to: path,
        icon: Users,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerSurveySingleRespondentPath(path)) {
    const match = path.match(
      /^\/alumni-officer\/surveys\/([^/]+)\/respondents\/[^/]+$/,
    );

    const surveyId = match?.[1];

    const viewPath = surveyId
      ? `/alumni-officer/surveys/view/${surveyId}`
      : "/alumni-officer/surveys";

    const responsesPath = surveyId
      ? `/alumni-officer/surveys/${surveyId}/responses`
      : "/alumni-officer/surveys";

    const respondentsPath = surveyId
      ? `/alumni-officer/surveys/${surveyId}/respondents`
      : "/alumni-officer/surveys";

    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: getSurveyTitle(state),
        to: viewPath,
        icon: Eye,
        isCurrent: false,
      },
      {
        label: "Survey Responses",
        to: responsesPath,
        icon: BarChart3,
        isCurrent: false,
      },
      {
        label: "Survey Respondents",
        to: respondentsPath,
        icon: Users,
        isCurrent: false,
      },
      {
        label:
          safe(state?.respondentName) ||
          safe(state?.breadcrumbLabel) ||
          "Respondent Answers",
        to: path,
        icon: Eye,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerSurveyHistoryPath(path)) {
    const surveyId = path.match(/^\/alumni-officer\/surveys\/([^/]+)\/history$/)?.[1];

    const viewPath = surveyId
      ? `/alumni-officer/surveys/view/${surveyId}`
      : "/alumni-officer/surveys";

    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: getSurveyTitle(state),
        to: viewPath,
        icon: Eye,
        isCurrent: false,
        state: buildSurveyOnlyState(state, getSurveyTitle(state)),
      },
      {
        label: "Survey History",
        to: path,
        icon: History,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerSurveyHistoryPreviewPath(path)) {
    const match = path.match(/^\/alumni-officer\/surveys\/([^/]+)\/history\/([^/]+)$/);

    const surveyId = match?.[1] || "";
    const historyId = match?.[2] || "";

    const surveyPath = surveyId
      ? `/alumni-officer/surveys/view/${surveyId}`
      : "/alumni-officer/surveys";

    const historyPath = surveyId
      ? `/alumni-officer/surveys/${surveyId}/history`
      : "/alumni-officer/surveys";

    const surveyLabel = getSurveyTitle(state);
    const rawVersion = getHistoryVersion(state);
    const versionLabel = formatVersionLabel(rawVersion);

    const sharedState = buildPreservedHistoryState(state, {
      surveyTitle: surveyLabel,
      breadcrumbLabel: surveyLabel,
      historyId,
      fromHistory: true,
      historyVersion: rawVersion,
    });

    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: surveyLabel,
        to: surveyPath,
        icon: Eye,
        isCurrent: false,
        state: buildSurveyOnlyState(state, surveyLabel),
      },
      {
        label: "Survey History",
        to: historyPath,
        icon: History,
        isCurrent: false,
        state: sharedState,
      },
      {
        label: versionLabel,
        to: path,
        icon: History,
        isCurrent: true,
        state: sharedState,
      },
    ];
  }

  if (isOfficerSurveyHistoryResponsesPath(path)) {
    const match = path.match(
      /^\/alumni-officer\/surveys\/([^/]+)\/history\/([^/]+)\/responses$/,
    );

    const surveyId = match?.[1] || "";
    const historyId = match?.[2] || "";

    const surveyPath = surveyId
      ? `/alumni-officer/surveys/view/${surveyId}`
      : "/alumni-officer/surveys";

    const historyPath = surveyId
      ? `/alumni-officer/surveys/${surveyId}/history`
      : "/alumni-officer/surveys";

    const versionPath =
      surveyId && historyId
        ? `/alumni-officer/surveys/${surveyId}/history/${historyId}`
        : historyPath;

    const surveyLabel = getSurveyTitle(state);
    const rawVersion = getHistoryVersion(state);
    const versionLabel = formatVersionLabel(rawVersion);

    const sharedState = buildPreservedHistoryState(state, {
      surveyTitle: surveyLabel,
      breadcrumbLabel: surveyLabel,
      historyId,
      fromHistory: true,
      historyVersion: rawVersion,
    });

    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: surveyLabel,
        to: surveyPath,
        icon: Eye,
        isCurrent: false,
        state: buildSurveyOnlyState(state, surveyLabel),
      },
      {
        label: "Survey History",
        to: historyPath,
        icon: History,
        isCurrent: false,
        state: sharedState,
      },
      {
        label: versionLabel,
        to: versionPath,
        icon: History,
        isCurrent: false,
        state: sharedState,
      },
      {
        label: "Survey Responses",
        to: path,
        icon: BarChart3,
        isCurrent: true,
        state: sharedState,
      },
    ];
  }

  if (isOfficerSurveyHistoryRespondentsPath(path)) {
    const match = path.match(
      /^\/alumni-officer\/surveys\/([^/]+)\/history\/([^/]+)\/respondents$/,
    );

    const surveyId = match?.[1] || "";
    const historyId = match?.[2] || "";

    const surveyPath = surveyId
      ? `/alumni-officer/surveys/view/${surveyId}`
      : "/alumni-officer/surveys";

    const historyPath = surveyId
      ? `/alumni-officer/surveys/${surveyId}/history`
      : "/alumni-officer/surveys";

    const versionPath =
      surveyId && historyId
        ? `/alumni-officer/surveys/${surveyId}/history/${historyId}`
        : historyPath;

    const responsesPath =
      surveyId && historyId
        ? `/alumni-officer/surveys/${surveyId}/history/${historyId}/responses`
        : historyPath;

    const surveyLabel = getSurveyTitle(state);
    const rawVersion = getHistoryVersion(state);
    const versionLabel = formatVersionLabel(rawVersion);

    const sharedState = buildPreservedHistoryState(state, {
      surveyTitle: surveyLabel,
      breadcrumbLabel: surveyLabel,
      historyId,
      fromHistory: true,
      historyVersion: rawVersion,
    });

    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: surveyLabel,
        to: surveyPath,
        icon: Eye,
        isCurrent: false,
        state: buildSurveyOnlyState(state, surveyLabel),
      },
      {
        label: "Survey History",
        to: historyPath,
        icon: History,
        isCurrent: false,
        state: sharedState,
      },
      {
        label: versionLabel,
        to: versionPath,
        icon: History,
        isCurrent: false,
        state: sharedState,
      },
      {
        label: "Survey Responses",
        to: responsesPath,
        icon: BarChart3,
        isCurrent: false,
        state: sharedState,
      },
      {
        label: "Survey Respondents",
        to: path,
        icon: Users,
        isCurrent: true,
        state: sharedState,
      },
    ];
  }

  if (isOfficerSurveyHistorySingleRespondentPath(path)) {
    const match = path.match(
      /^\/alumni-officer\/surveys\/([^/]+)\/history\/([^/]+)\/respondents\/[^/]+$/,
    );

    const surveyId = match?.[1] || "";
    const historyId = match?.[2] || "";

    const surveyPath = surveyId
      ? `/alumni-officer/surveys/view/${surveyId}`
      : "/alumni-officer/surveys";

    const historyPath = surveyId
      ? `/alumni-officer/surveys/${surveyId}/history`
      : "/alumni-officer/surveys";

    const versionPath =
      surveyId && historyId
        ? `/alumni-officer/surveys/${surveyId}/history/${historyId}`
        : historyPath;

    const responsesPath =
      surveyId && historyId
        ? `/alumni-officer/surveys/${surveyId}/history/${historyId}/responses`
        : historyPath;

    const respondentsPath =
      surveyId && historyId
        ? `/alumni-officer/surveys/${surveyId}/history/${historyId}/respondents`
        : historyPath;

    const surveyLabel = getSurveyTitle(state);
    const rawVersion = getHistoryVersion(state);
    const versionLabel = formatVersionLabel(rawVersion);

    const sharedState = buildPreservedHistoryState(state, {
      surveyTitle: surveyLabel,
      breadcrumbLabel: surveyLabel,
      historyId,
      fromHistory: true,
      historyVersion: rawVersion,
    });

    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: surveyLabel,
        to: surveyPath,
        icon: Eye,
        isCurrent: false,
        state: buildSurveyOnlyState(state, surveyLabel),
      },
      {
        label: "Survey History",
        to: historyPath,
        icon: History,
        isCurrent: false,
        state: sharedState,
      },
      {
        label: versionLabel,
        to: versionPath,
        icon: History,
        isCurrent: false,
        state: sharedState,
      },
      {
        label: "Survey Responses",
        to: responsesPath,
        icon: BarChart3,
        isCurrent: false,
        state: sharedState,
      },
      {
        label: "Survey Respondents",
        to: respondentsPath,
        icon: Users,
        isCurrent: false,
        state: sharedState,
      },
      {
        label:
          safe(state?.respondentName) ||
          safe(state?.respondent?.respondentName) ||
          "Respondent Answers",
        to: path,
        icon: Eye,
        isCurrent: true,
        state: sharedState,
      },
    ];
  }

  if (isOfficerSurveyEditPath(path)) {
    const surveyId = path.match(/^\/alumni-officer\/surveys\/edit\/([^/]+)$/)?.[1];

    const viewPath = surveyId
      ? `/alumni-officer/surveys/view/${surveyId}`
      : "/alumni-officer/surveys";

    const surveyLabel =
      safe(state?.surveyTitle) ||
      safe(state?.initialSurvey?.surveyTitle) ||
      safe(state?.initialSurvey?.title) ||
      safe(state?.title) ||
      safe(state?.breadcrumbLabel) ||
      "Survey";

    const sharedState = {
      ...(state || {}),
      surveyTitle: surveyLabel,
      breadcrumbLabel: surveyLabel,
      initialSurvey: state?.initialSurvey || null,
    };

    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: surveyLabel,
        to: viewPath,
        icon: Eye,
        isCurrent: false,
        state: sharedState,
      },
      {
        label: "Edit Survey",
        to: path,
        icon: PencilLine,
        isCurrent: true,
        state: sharedState,
      },
    ];
  }

  if (isOfficerSurveyEditBranchingPath(path)) {
    const editPath = path.replace(/\/branching$/, "");

    return [
      {
        label: "Manage Surveys",
        to: "/alumni-officer/surveys",
        icon: ClipboardList,
        isCurrent: false,
      },
      {
        label: getSurveyTitle(state),
        to: editPath,
        icon: PencilLine,
        isCurrent: false,
      },
      {
        label: "Survey Branching",
        to: path,
        icon: Activity,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/perks-discounts") {
    return [
      {
        label: "Manage Perks & Discounts",
        to: "/alumni-officer/perks-discounts",
        icon: Gift,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/perks-discounts/create") {
    return [
      {
        label: "Manage Perks & Discounts",
        to: "/alumni-officer/perks-discounts",
        icon: Gift,
        isCurrent: false,
      },
      {
        label: "Create Perks & Discounts",
        to: "/alumni-officer/perks-discounts/create",
        icon: PlusCircle,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerPerkViewPath(path)) {
    return [
      {
        label: "Manage Perks & Discounts",
        to: "/alumni-officer/perks-discounts",
        icon: Gift,
        isCurrent: false,
      },
      {
        label: getPerkTitle(state),
        to: path,
        icon: Eye,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerPerkEditPath(path)) {
    return [
      {
        label: "Manage Perks & Discounts",
        to: "/alumni-officer/perks-discounts",
        icon: Gift,
        isCurrent: false,
      },
      {
        label: getPerkTitle(state),
        to: path.replace("/edit/", "/view/"),
        icon: Eye,
        isCurrent: false,
      },
      {
        label: "Edit Perks & Discounts",
        to: path,
        icon: PencilLine,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/calendar") {
    return [
      {
        label: "Manage Calendar of Events",
        to: "/alumni-officer/calendar",
        icon: CalendarDays,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/calendar/create") {
    return [
      {
        label: "Manage Calendar of Events",
        to: "/alumni-officer/calendar",
        icon: CalendarDays,
        isCurrent: false,
      },
      {
        label: "Create Event",
        to: "/alumni-officer/calendar/create",
        icon: PlusCircle,
        isCurrent: true,
      },
    ];
  }

  if (isOfficerCalendarEditPath(path)) {
    return [
      {
        label: "Manage Calendar of Events",
        to: "/alumni-officer/calendar",
        icon: CalendarDays,
        isCurrent: false,
      },
      {
        label: getCalendarTitle(state),
        to: path,
        icon: PencilLine,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/system-audit") {
    return [
      {
        label: "System Audit",
        to: "/alumni-officer/system-audit",
        icon: Activity,
        isCurrent: true,
      },
    ];
  }

  if (path === "/alumni-officer/profile") {
    return [
      {
        label: "Profile",
        to: "/alumni-officer/profile",
        icon: User,
        isCurrent: true,
      },
    ];
  }

  return [
    {
      label: "Officer Portal",
      to: "/alumni-officer",
      icon: Home,
      isCurrent: true,
    },
  ];
}

function getActiveContext(pathname, state) {
  const path = normalizePath(pathname);

  if (path === "/alumni-officer") {
    return {
      label: "Dashboard",
      icon: LayoutDashboard,
    };
  }

  if (path === "/alumni-officer/alumni/manage") {
    return {
      label: "Manage Alumni",
      icon: Users,
    };
  }

  if (path === "/alumni-officer/alumni/manage/analytics") {
    return {
      label: "Employment Analytics",
      icon: BarChart3,
    };
  }

  if (path === "/alumni-officer/alumni/manage/advanced") {
    return {
      label: "Advanced Export",
      icon: BarChart3,
    };
  }

  if (path === "/alumni-officer/posts") {
    return {
      label: "Manage Posts",
      icon: FileText,
    };
  }

  if (path === "/alumni-officer/posts/create") {
    return {
      label: "Create Post",
      icon: PlusCircle,
    };
  }

  if (isOfficerPostEditPath(path)) {
    return {
      label: "Edit Post",
      icon: PencilLine,
    };
  }

  if (path === "/alumni-officer/surveys") {
    return {
      label: "Manage Surveys",
      icon: ClipboardList,
    };
  }

  if (path === "/alumni-officer/surveys/create") {
    return {
      label: "Create Survey",
      icon: PlusCircle,
    };
  }

  if (
    isOfficerSurveyCreateBranchingPath(path) ||
    isOfficerSurveyEditBranchingPath(path)
  ) {
    return {
      label: "Survey Branching",
      icon: Activity,
    };
  }

  if (isOfficerSurveyViewPath(path)) {
    return {
      label: getSurveyTitle(state),
      icon: Eye,
    };
  }

  if (isOfficerSurveyResponsesPath(path)) {
    return {
      label: "Survey Responses",
      icon: BarChart3,
    };
  }

  if (isOfficerSurveyRespondentsPath(path)) {
    return {
      label: "Survey Respondents",
      icon: Users,
    };
  }

  if (isOfficerSurveySingleRespondentPath(path)) {
    return {
      label:
        safe(state?.respondentName) ||
        safe(state?.breadcrumbLabel) ||
        "Respondent Answers",
      icon: Eye,
    };
  }

  if (isOfficerSurveyHistoryPath(path)) {
    return {
      label: "Survey History",
      icon: History,
    };
  }

  if (isOfficerSurveyHistoryPreviewPath(path)) {
    return {
      label: formatVersionLabel(getHistoryVersion(state)),
      icon: History,
    };
  }

  if (isOfficerSurveyHistoryResponsesPath(path)) {
    return {
      label: "Survey Responses",
      icon: BarChart3,
    };
  }

  if (isOfficerSurveyHistoryRespondentsPath(path)) {
    return {
      label: "Survey Respondents",
      icon: Users,
    };
  }

  if (isOfficerSurveyHistorySingleRespondentPath(path)) {
    return {
      label:
        safe(state?.respondentName) ||
        safe(state?.respondent?.respondentName) ||
        "Respondent Answers",
      icon: Eye,
    };
  }

  if (isOfficerSurveyEditPath(path)) {
    return {
      label: "Edit Survey",
      icon: PencilLine,
    };
  }

  if (path === "/alumni-officer/perks-discounts") {
    return {
      label: "Manage Perks & Discounts",
      icon: Gift,
    };
  }

  if (path === "/alumni-officer/perks-discounts/create") {
    return {
      label: "Create Perks & Discounts",
      icon: PlusCircle,
    };
  }

  if (isOfficerPerkViewPath(path)) {
    return {
      label: getPerkTitle(state),
      icon: Eye,
    };
  }

  if (isOfficerPerkEditPath(path)) {
    return {
      label: "Edit Perks & Discounts",
      icon: PencilLine,
    };
  }

  if (path === "/alumni-officer/calendar") {
    return {
      label: "Manage Calendar of Events",
      icon: CalendarDays,
    };
  }

  if (path === "/alumni-officer/calendar/create") {
    return {
      label: "Create Event",
      icon: PlusCircle,
    };
  }

  if (isOfficerCalendarEditPath(path)) {
    return {
      label: getCalendarTitle(state),
      icon: PencilLine,
    };
  }

  if (path === "/alumni-officer/system-audit") {
    return {
      label: "System Audit",
      icon: Activity,
    };
  }

  if (path === "/alumni-officer/profile") {
    return {
      label: "Profile",
      icon: UserRound,
    };
  }

  return {
    label: "Officer Portal",
    icon: Home,
  };
}

export default function OfficerLayout() {
  const account = getStoredAccount();
  const role = account?.role || "";
  const loading = false;
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [pendingProtectedAction, setPendingProtectedAction] = useState(null);
  const [officerProfile, setOfficerProfile] = useState(account || null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      clearRadixPointerLock();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [location.pathname]);

  useEffect(() => {
    setOfficerProfile(account || null);
  }, [account?.id, account?.email]);

  const collapsibleKeys = useMemo(
    () =>
      OFFICER_NAV_ITEMS.filter(
        (item) => item.children?.length && !item.disabled,
      ).map((item) => item.key),
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

  const userEmail = account?.email || "—";

  const userInitials = useMemo(() => {
    const source =
      safe(account?.full_name) ||
      safe(account?.name) ||
      safe(account?.email);

    if (!source) return "AO";

    return (
      source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "AO"
    );
  }, [account?.full_name, account?.name, account?.email]);

  const profilePhotoUrl = useMemo(() => {
    return (
      safe(officerProfile?.profileImageUrl) ||
      safe(officerProfile?.profilePhotoUrl) ||
      safe(officerProfile?.photoURL) ||
      safe(officerProfile?.photoUrl) ||
      safe(officerProfile?.avatarUrl) ||
      safe(officerProfile?.imageUrl) ||
      ""
    );
  }, [officerProfile]);

  function isPathActive(itemTo, end) {
    const path = normalizePath(location.pathname);

    if (end) return path === itemTo;

    if (itemTo === "/alumni-officer/alumni/manage") {
      return isOfficerAlumniPath(path);
    }

    if (itemTo === "/alumni-officer/posts") {
      return isOfficerPostsPath(path);
    }

    if (itemTo === "/alumni-officer/surveys") {
      return isOfficerSurveysPath(path);
    }

    if (itemTo === "/alumni-officer/perks-discounts") {
      return isOfficerPerksPath(path);
    }

    if (itemTo === "/alumni-officer/calendar") {
      return isOfficerCalendarPath(path);
    }

    if (itemTo === "/alumni-officer/system-audit") {
      return path === "/alumni-officer/system-audit";
    }

    if (itemTo === "/alumni-officer/profile") {
      return path === "/alumni-officer/profile";
    }

    return path === itemTo || path.startsWith(`${itemTo}/`);
  }

  function navigateWithGuard(to, state = {}, actionType = "navigate") {
    const currentPath = normalizePath(location.pathname);
    const nextPath = normalizePath(to);

    if (actionType === "navigate" && currentPath === nextPath) return;

    if (actionType === "logout") {
      setPendingProtectedAction("logout");
      setShowLogoutDialog(true);
      return;
    }

    const isCalendarFormPage =
      currentPath === "/alumni-officer/calendar/create" ||
      isOfficerCalendarEditPath(currentPath);

    const isPerksDiscountFormPage =
      currentPath === "/alumni-officer/perks-discounts/create" ||
      currentPath.startsWith("/alumni-officer/perks-discounts/edit");

    const isSurveyFormPage =
      currentPath === "/alumni-officer/surveys/create" ||
      currentPath === "/alumni-officer/surveys/create/branching" ||
      isOfficerSurveyEditPath(currentPath) ||
      isOfficerSurveyEditBranchingPath(currentPath);

    const isPostFormPage =
      currentPath === "/alumni-officer/posts/create" ||
      isOfficerPostEditPath(currentPath);

    const shouldReplaceFormRoute =
      actionType === "navigate" &&
      (isCalendarFormPage ||
        isPerksDiscountFormPage ||
        isSurveyFormPage ||
        isPostFormPage);

    if (shouldReplaceFormRoute) {
      const eventName = isCalendarFormPage
        ? "officer-calendar-form-exit-request"
        : isPerksDiscountFormPage
          ? "officer-perks-discount-form-exit-request"
          : isSurveyFormPage
            ? "officer-survey-form-exit-request"
            : "officer-post-form-exit-request";

      const event = new CustomEvent(eventName, {
        cancelable: true,
        detail: {
          to,
          state,
          proceed: () => {
            clearRadixPointerLock();

            navigate(to, {
              state,
              replace: true,
            });

            window.requestAnimationFrame(() => {
              clearRadixPointerLock();
            });
          },
        },
      });

      const shouldStopNavigation = !window.dispatchEvent(event);

      if (shouldStopNavigation) return;
    }

    clearRadixPointerLock();

    navigate(to, {
      state,
      replace: shouldReplaceFormRoute,
    });

    window.requestAnimationFrame(() => {
      clearRadixPointerLock();
    });
  }

  async function handleLogout() {
    localStorage.removeItem("nuai_account");
    navigate("/login", { replace: true });
  }

  const ctx = useMemo(() => {
    return getActiveContext(location.pathname, location.state);
  }, [location.pathname, location.state]);

  const ActiveIcon = ctx.icon;

  const breadcrumbs = useMemo(() => {
    return buildBreadcrumbs(location.pathname, location.state);
  }, [location.pathname, location.state]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-sm border-border/60">
          <CardContent className="w-full min-w-0 pt-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3D398C] border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Loading officer workspace…
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="AAO Portal | NUAI" />

      <TooltipProvider>
        <SidebarProvider style={{ "--sidebar-width": "18rem" }}>
          <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:px-2">
              <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                <img
                  src={NULogoCapBlue}
                  alt="NUAI Logo"
                  className="h-14 w-auto object-contain group-data-[collapsible=icon]:hidden"
                />

                <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
                  <img
                    src={NULogoCapBlue}
                    alt="NUAI Logo"
                    className="h-8.5 w-8.5 min-h-8.5 min-w-8.5 shrink-0 object-contain"
                  />
                </div>

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
                    AAO Portal
                  </p>
                  <p
                    className="mt-1 text-[11px]"
                    style={{ color: BRAND_BLUE, opacity: 0.75 }}
                  >
                    Alumni Affairs Office
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
                        if (allClosed) {
                          setOpenItems(new Set(collapsibleKeys));
                        } else {
                          setOpenItems(new Set());
                        }
                      }}
                      className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-[#3D398C]/5 hover:text-[#3D398C] group-data-[collapsible=icon]:hidden"
                      title={allClosed ? "Expand all" : "Collapse all"}
                    >
                      <ChevronsUpDown size={12} />
                      <span>{allClosed ? "Expand" : "Collapse"}</span>
                    </button>
                  )}
                </div>

                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {OFFICER_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const hasChildren =
                        item.children && item.children.length > 0;
                      const isActive = isPathActive(item.to, item.end);
                      const isChildActive =
                        hasChildren &&
                        item.children.some(
                          (child) =>
                            normalizePath(location.pathname) === child.to ||
                            normalizePath(location.pathname).startsWith(
                              `${child.to}/`,
                            ),
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
                                  navigateWithGuard(item.to);
                                  setOpenItems(
                                    (prev) => new Set([...prev, item.key]),
                                  );
                                }}
                                className={`min-h-[42px] rounded-lg text-sm text-[13px] font-medium transition-all duration-150 ${
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
                                  className={`ml-auto inline-flex cursor-pointer items-center justify-center rounded p-0.5 transition-colors duration-150 ${
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
                                        : ""
                                    }`}
                                  />
                                </span>
                              </SidebarMenuButton>

                              <Collapsible.Content className="overflow-hidden data-[state=open]:animate-[slideDown_150ms_ease-out] data-[state=closed]:animate-[slideUp_150ms_ease-in]">
                                <SidebarMenuSub className="mt-1 ml-4 mr-1 border-l-[1.5px] border-[#3D398C]/20 py-0.5">
                                  {item.children.map((child) => {
                                    const isSubActive =
                                      normalizePath(location.pathname) ===
                                        child.to ||
                                      normalizePath(
                                        location.pathname,
                                      ).startsWith(`${child.to}/`);

                                    return (
                                      <SidebarMenuSubItem key={child.key}>
                                        <SidebarMenuSubButton
                                          className={`min-h-[36px] cursor-pointer rounded-lg text-[12px] font-medium transition-all duration-150 ${
                                            isSubActive
                                              ? "!bg-[#3D398C] !text-white"
                                              : "text-sidebar-foreground/50 hover:bg-[#3D398C]/5 hover:text-[#3D398C]"
                                          }`}
                                          onClick={() =>
                                            navigateWithGuard(child.to)
                                          }
                                        >
                                          <span>{child.label}</span>
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
                            disabled={item.disabled}
                            className={`min-h-[42px] rounded-lg text-sm text-[13px] font-medium transition-all duration-150 ${
                              item.disabled
                                ? "cursor-not-allowed opacity-55 text-sidebar-foreground/50"
                                : isActive
                                  ? "!bg-[#3D398C] !text-white !hover:bg-[#3D398C] !hover:text-white"
                                  : "cursor-pointer text-sidebar-foreground/80 hover:bg-[#3D398C]/8 hover:text-[#3D398C]"
                            }`}
                            onClick={() => {
                              if (item.disabled) return;
                              navigateWithGuard(item.to);
                            }}
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
                onClick={() => navigateWithGuard("/alumni-officer/profile")}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-white px-3 py-3 text-left shadow-sm transition-all duration-150 hover:border-[#3D398C]/20 hover:shadow-md group-data-[collapsible=icon]:hidden"
              >
                <OfficerSidebarAvatar
                  photoUrl={profilePhotoUrl}
                  initials={userInitials}
                />

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
                      Alumni Officer
                    </Badge>
                  </div>
                </div>
              </button>

              <div className="hidden flex-col items-center gap-2 group-data-[collapsible=icon]:flex">
                <button
                  type="button"
                  onClick={() => navigateWithGuard("/alumni-officer/profile")}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-white shadow-sm hover:border-[#3D398C]/20"
                  title="Profile"
                >
                  <OfficerSidebarAvatar
                    photoUrl={profilePhotoUrl}
                    initials={userInitials}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigateWithGuard("", {}, "logout")}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-red-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-1.5 mb-0.5 group-data-[collapsible=icon]:hidden">
                <button
                  type="button"
                  onClick={() => navigateWithGuard("", {}, "logout")}
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
                  <h1 className="text-nu-blue truncate text-sm font-semibold text-foreground">
                    {ctx.label}
                  </h1>
                </div>
              </div>

              <nav className="flex min-w-0 items-center gap-1.5 overflow-x-auto text-xs">
                {breadcrumbs.map((crumb, index) => {
                  const Icon = crumb.icon;
                  const isLast = index === breadcrumbs.length - 1;

                  const hasCrumbState =
                    crumb.state !== undefined && crumb.state !== null;

                  const preservedState = hasCrumbState
                    ? {
                        ...crumb.state,
                      }
                    : {
                        ...(location.state || {}),
                        surveyTitle:
                          safe(location.state?.surveyTitle) ||
                          safe(location.state?.initialSurvey?.surveyTitle),
                        breadcrumbLabel:
                          safe(location.state?.breadcrumbLabel) ||
                          safe(location.state?.surveyTitle) ||
                          safe(location.state?.initialSurvey?.surveyTitle),
                        respondentName: safe(location.state?.respondentName),
                        perkTitle: safe(location.state?.perkTitle),
                        eventTitle: safe(location.state?.eventTitle),
                        title: safe(location.state?.title),
                        historyId:
                          safe(location.state?.historyId) ||
                          safe(location.state?.initialSurvey?.historyId) ||
                          safe(location.state?.initialSurvey?.__historyId),
                        fromHistory: location.state?.fromHistory || false,
                        historyVersion:
                          safe(location.state?.historyVersion) ||
                          safe(location.state?.initialSurvey?.historyVersion) ||
                          safe(
                            location.state?.initialSurvey?.__historyVersion,
                          ) ||
                          safe(location.state?.initialSurvey?.version) ||
                          safe(location.state?.initialSurvey?.versionNumber),
                        initialSurvey: location.state?.initialSurvey || null,
                      };

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
                            navigateWithGuard(crumb.to, preservedState)
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
              <div className="mx-auto w-full min-w-0 max-w-[1600px]">
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
              access the alumni officer dashboard.
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
