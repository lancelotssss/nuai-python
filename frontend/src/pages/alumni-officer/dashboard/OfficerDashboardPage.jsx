// src/pages/faculty-admin/alumni-officer/dashboard/OfficerDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileText,
  Gift,
  Megaphone,
  PieChart as PieChartIcon,
  Tag,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BRAND_BLUE = "#3D398C";

const DASHBOARD_COLORS = {
  alumni: {
    text: "#2F7D6D",
    bg: "#2F7D6D14",
  },
  posts: {
    text: "#3D398C",
    bg: "#3D398C14",
  },
  surveys: {
    text: "#D97706",
    bg: "#D9770614",
  },
  perks: {
    text: "#7C3AED",
    bg: "#7C3AED14",
  },
  calendar: {
    text: "#0EA5E9",
    bg: "#0EA5E914",
  },
};

function getDashboardColor(key = "posts") {
  return DASHBOARD_COLORS[key] || DASHBOARD_COLORS.posts;
}

const ALUMNI_REGISTRATION_COLORS = {
  registered: DASHBOARD_COLORS.alumni.text,
  transitioning: DASHBOARD_COLORS.surveys.text,
  preRegistered: DASHBOARD_COLORS.posts.text,
};

const DASHBOARD_COUNTS_INITIAL = {
  registeredAlumni: 0,
  preRegisteredAlumni: 0,
  transitioningAlumni: 0,
  totalAlumni: 0,
  totalPosts: 0,
  totalSurveys: 0,
  totalPerksDiscounts: 0,
  totalCalendarEvents: 0,
};

const SURVEY_ENGAGEMENT_INITIAL = {
  answeredCount: 0,
  notAnsweredCount: 0,
  totalEligibleAlumni: 0,
  responseCount: 0,
};



const CATEGORY_CHART_COLORS = [
  "#3D398C",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#7C3AED",
  "#EC4899",
  "#14B8A6",
];

const MONTH_OPTIONS = [
  { value: "0", label: "Jan" },
  { value: "1", label: "Feb" },
  { value: "2", label: "Mar" },
  { value: "3", label: "Apr" },
  { value: "4", label: "May" },
  { value: "5", label: "Jun" },
  { value: "6", label: "Jul" },
  { value: "7", label: "Aug" },
  { value: "8", label: "Sep" },
  { value: "9", label: "Oct" },
  { value: "10", label: "Nov" },
  { value: "11", label: "Dec" },
];

const POSTING_ACTIVITY_TYPES = [
  {
    value: "posts",
    label: "Posts",
    collectionName: "newsPosts",
    accent: "#3D398C",
  },
  {
    value: "surveys",
    label: "Surveys",
    collectionName: "surveys",
    accent: "#D97706",
  },
  {
    value: "perks",
    label: "Perks & Discounts",
    collectionName: "perksDiscounts",
    accent: "#7C3AED",
  },
  {
    value: "events",
    label: "Calendar Events",
    collectionName: "calendarEvents",
    accent: "#0EA5E9",
  },
];

const POSTING_CATEGORY_TYPES = [
  {
    value: "events",
    label: "Calendar Events",
    collectionName: "calendarEvents",
    accent: "#0EA5E9",
  },
  {
    value: "perks",
    label: "Perks & Discounts",
    collectionName: "perksDiscounts",
    accent: "#7C3AED",
  },
];

function safeText(value) {
  return String(value ?? "").trim();
}

function formatCount(value) {
  const numeric = Number(value || 0);
  return numeric.toLocaleString();
}

function formatPercent(value) {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}%`;
}

function normalizeStatus(value) {
  return safeText(value).toLowerCase();
}

function isAvailableSurvey(survey = {}) {
  const status = normalizeStatus(survey?.status || "active");

  if (!status) return true;
  if (status === "draft" || status === "archived") return false;

  return true;
}

function isVisibleEvent(event = {}) {
  const status = normalizeStatus(event?.status || "active");

  if (status === "draft" || status === "archived" || status === "cancelled") {
    return false;
  }

  return true;
}

function isVisiblePost(post = {}) {
  const status = normalizeStatus(post?.status || post?.postStatus || "active");
  return status !== "draft" && status !== "archived" && status !== "deleted";
}

function isVisiblePerk(perk = {}) {
  const status = normalizeStatus(perk?.status || perk?.perkStatus || "active");
  return status !== "draft" && status !== "archived" && status !== "deleted";
}

function getSurveyTitle(survey = {}) {
  return (
    safeText(survey?.surveyTitle) ||
    safeText(survey?.title) ||
    safeText(survey?.name) ||
    "Untitled Survey"
  );
}

function getEventTitle(event = {}) {
  return safeText(event?.title || event?.eventTitle || event?.name) || "Untitled Event";
}

function getPostTitle(post = {}) {
  const title =
    safeText(post?.postHeader) ||
    safeText(post?.title) ||
    safeText(post?.postTitle) ||
    safeText(post?.newsTitle) ||
    safeText(post?.announcementTitle) ||
    safeText(post?.headline) ||
    safeText(post?.caption) ||
    safeText(post?.subject) ||
    safeText(post?.postDetails?.title) ||
    safeText(post?.postContent?.title) ||
    safeText(post?.content?.title) ||
    safeText(post?.details?.title) ||
    safeText(post?.body?.title);

  if (title) return title;

  const body =
    safeText(post?.postContent) ||
    safeText(post?.description) ||
    safeText(post?.content) ||
    safeText(post?.body) ||
    safeText(post?.message) ||
    safeText(post?.postText) ||
    safeText(post?.postContent?.body) ||
    safeText(post?.postDetails?.description) ||
    safeText(post?.details?.description);

  return body ? `${body.slice(0, 55)}${body.length > 55 ? "..." : ""}` : "Untitled Post";
}

function getPerkTitle(perk = {}) {
  const title =
    safeText(perk?.postHeader) ||
    safeText(perk?.title) ||
    safeText(perk?.perkTitle) ||
    safeText(perk?.discountTitle) ||
    safeText(perk?.name) ||
    safeText(perk?.companyName);

  if (title) return title;

  const body =
    safeText(perk?.postContent) ||
    safeText(perk?.description) ||
    safeText(perk?.content) ||
    safeText(perk?.details);

  return body ? `${body.slice(0, 55)}${body.length > 55 ? "..." : ""}` : "Untitled Perk";
}

function normalizeCategoryLabel(value, fallback = "Uncategorized") {
  const raw = safeText(value);

  if (!raw) return fallback;

  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getPostCategory(post = {}) {
  return normalizeCategoryLabel(
    post?.category ||
      post?.postCategory ||
      post?.postType ||
      post?.type ||
      post?.contentType,
  );
}

function getEventCategory(event = {}) {
  return normalizeCategoryLabel(
    event?.category ||
      event?.eventCategory ||
      event?.eventType ||
      event?.type ||
      event?.activityType,
  );
}

function getPerkCategory(perk = {}) {
  return normalizeCategoryLabel(
    perk?.category ||
      perk?.perkCategory ||
      perk?.discountCategory ||
      perk?.perkType ||
      perk?.type ||
      perk?.offerType,
  );
}

function getCategoryByType(type, data = {}) {
  if (type === "events") return getEventCategory(data);
  if (type === "perks") return getPerkCategory(data);
  return getPostCategory(data);
}

function parseDateSafe(value) {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value?.seconds === "number") {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function getCreatedDate(data = {}) {
  return (
    parseDateSafe(data?.createdAt) ||
    parseDateSafe(data?.publishedAt) ||
    parseDateSafe(data?.updatedAt) ||
    parseDateSafe(data?.systemAudit?.createdAt) ||
    parseDateSafe(data?.systemAudit?.updatedAt) ||
    null
  );
}

function formatDate(value) {
  const date = parseDateSafe(value);

  if (!date) return "No date";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDate(a, b) {
  return (
    a?.getFullYear?.() === b?.getFullYear?.() &&
    a?.getMonth?.() === b?.getMonth?.() &&
    a?.getDate?.() === b?.getDate?.()
  );
}

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function DashboardMetricCard({
  icon: Icon,
  value,
  label,
  color = DASHBOARD_COLORS.posts,
  loading = false,
  onViewDetails,
}) {
  return (
    <Card className="group overflow-hidden border-border/60 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D398C]/20 hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-start gap-3 px-4 py-4">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{
              backgroundColor: color.bg,
              color: color.text,
            }}
          >
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="h-6 w-16 animate-pulse rounded-md bg-muted" />
            ) : (
              <p
                className="text-xl font-bold leading-none"
                style={{ color: color.text }}
              >
                {formatCount(value)}
              </p>
            )}

            <p
              className="mt-1 text-xs font-medium leading-5"
              style={{ color: color.text }}
            >
              {label}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="flex w-full cursor-pointer items-center justify-between border-t border-border/60 px-4 py-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40"
          style={{ "--metric-accent": color.text }}
        >
          <span className="transition-colors group-hover:text-[var(--metric-accent)]">
            View details
          </span>
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--metric-accent)]"
          />
        </button>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const name = item?.name || item?.payload?.name || item?.payload?.status || "Item";
  const value = item?.value || item?.payload?.value || item?.payload?.count || 0;

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="mt-0.5 text-muted-foreground">{formatCount(value)} records</p>
    </div>
  );
}

function RechartsDonutChart({ data = [], loading = false, height = 170 }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

  if (loading) {
    return <div className="h-[170px] w-full animate-pulse rounded-xl bg-muted" />;
  }

  if (!total) {
    return (
      <div className="grid h-[170px] place-items-center rounded-xl border border-dashed border-border bg-muted/20 text-xs font-medium text-muted-foreground">
        No chart data
      </div>
    );
  }

  return (
    <div className="h-[170px] w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Tooltip content={<ChartTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

function SurveyEngagementChart({ answeredCount, notAnsweredCount, loading }) {
  const total = answeredCount + notAnsweredCount;
  const answeredPercent = total > 0 ? (answeredCount / total) * 100 : 0;

  const data = [
    {
      name: "Answered",
      value: answeredCount,
      color: BRAND_BLUE,
    },
    {
      name: "Not answered",
      value: notAnsweredCount,
      color: "#E5E7EB",
    },
  ];

  return (
    <div className="relative w-full max-w-[190px]">
      <RechartsDonutChart data={data} loading={loading} height={170} />
      {!loading ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {formatPercent(answeredPercent)}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground">answered</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SurveyEngagementCard({
  surveys,
  selectedSurveyId,
  setSelectedSurveyId,
  engagement,
  loadingSurveys,
  loadingEngagement,
  error,
}) {
  const selectedSurvey = surveys.find((survey) => survey.id === selectedSurveyId);

  const answeredCount = Number(engagement.answeredCount || 0);
  const notAnsweredCount = Number(engagement.notAnsweredCount || 0);
  const totalEngagement = answeredCount + notAnsweredCount;

  const labelItems = [
    {
      label: "Answered",
      value: answeredCount,
      color: BRAND_BLUE,
      helper: "Alumni who submitted a response",
    },
    {
      label: "Not answered",
      value: notAnsweredCount,
      color: "#E5E7EB",
      helper: "Eligible alumni without response",
    },
  ];

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-white shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: DASHBOARD_COLORS.surveys.bg, color: DASHBOARD_COLORS.surveys.text }}>
            <PieChartIcon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-bold text-foreground">
              Survey Engagement
            </CardTitle>

            <CardDescription className="mt-1 text-xs leading-5">
              Percentage of alumni who answered the selected survey.
            </CardDescription>

            <div className="mt-3 w-full max-w-[360px]">
              <Select
                value={selectedSurveyId || undefined}
                onValueChange={setSelectedSurveyId}
                disabled={loadingSurveys || surveys.length === 0}
              >
                <SelectTrigger className="h-9 w-full rounded-xl border-border bg-white text-xs font-medium">
                  <SelectValue
                    placeholder={
                      loadingSurveys ? "Loading surveys..." : "Select survey"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {surveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {getSurveyTitle(survey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : surveys.length === 0 && !loadingSurveys ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              No available surveys found.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Active or published surveys will appear here once available.
            </p>
          </div>
        ) : (
          <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_190px]">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {selectedSurvey ? getSurveyTitle(selectedSurvey) : "No survey selected"}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                {labelItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-sm font-medium text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {loadingSurveys || loadingEngagement ? "..." : formatCount(item.value)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                      {loadingSurveys || loadingEngagement
                        ? "Loading engagement data..."
                        : `${formatPercent(totalEngagement ? (item.value / totalEngagement) * 100 : 0)} of total · ${item.helper}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <SurveyEngagementChart
              answeredCount={answeredCount}
              notAnsweredCount={notAnsweredCount}
              loading={loadingSurveys || loadingEngagement}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MonthlyPostingActivityCard({
  data = [],
  loading = false,
  selectedType,
  onTypeChange,
  selectedYear,
  onYearChange,
  yearOptions = [],
}) {
  const selectedMeta =
    POSTING_ACTIVITY_TYPES.find((type) => type.value === selectedType) ||
    POSTING_ACTIVITY_TYPES[0];

  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const peakMonth = data.reduce(
    (top, item) =>
      Number(item.count || 0) > Number(top?.count || 0) ? item : top,
    data[0] || null,
  );

  const chartData = data.map((item) => ({
    month: item.shortMonth,
    fullMonth: item.month,
    count: Number(item.count || 0),
  }));

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-white shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: selectedMeta?.accent ? `${selectedMeta.accent}14` : DASHBOARD_COLORS.posts.bg, color: selectedMeta?.accent || DASHBOARD_COLORS.posts.text }}>
              <FileText size={18} />
            </div>

            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-foreground">
                Monthly Posting Activity
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-5">
                Track monthly activity across posts, surveys, perks, and calendar events.
              </CardDescription>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Activity Type
              </Label>
              <Select value={selectedType} onValueChange={onTypeChange}>
                <SelectTrigger className="h-9 rounded-xl border-border bg-white text-xs font-medium">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>

                <SelectContent>
                  {POSTING_ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Year
              </Label>
              <Select value={String(selectedYear)} onValueChange={onYearChange}>
                <SelectTrigger className="h-9 rounded-xl border-border bg-white text-xs font-medium">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>

                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px]">
            <div className="h-[260px] animate-pulse rounded-xl bg-muted" />
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
              <div className="h-20 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        ) : total === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              No monthly activity found.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              No {selectedMeta.label.toLowerCase()} were found for {selectedYear}.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px]">
            <div className="h-[280px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={22}>
                    {chartData.map((entry) => (
                      <Cell key={entry.fullMonth} fill={selectedMeta.accent} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Total {selectedMeta.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatCount(total)}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Peak Month
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {peakMonth?.month || "No data"}
                </p>
                <p className="mt-1 text-xs font-medium text-[#3D398C]">
                  {formatCount(peakMonth?.count || 0)} records
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Filter
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {selectedMeta.label}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Year {selectedYear}
                </p>
              </div>

            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MostPostedCategoryCard({
  data = [],
  loading = false,
  selectedType,
  onTypeChange,
  selectedYear,
  onYearChange,
  yearOptions = [],
}) {
  const selectedMeta =
    POSTING_CATEGORY_TYPES.find((type) => type.value === selectedType) ||
    POSTING_CATEGORY_TYPES[0];

  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const topCategory = data.reduce(
    (top, item) =>
      Number(item.count || 0) > Number(top?.count || 0) ? item : top,
    data[0] || null,
  );

  const chartData = data
    .filter((item) => Number(item.count || 0) > 0)
    .slice(0, 8)
    .map((item, index) => ({
      name: item.category,
      shortName:
        item.category.length > 22
          ? `${item.category.slice(0, 22)}...`
          : item.category,
      count: Number(item.count || 0),
      color: CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length],
    }));

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-white shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: selectedMeta?.accent ? `${selectedMeta.accent}14` : DASHBOARD_COLORS.calendar.bg, color: selectedMeta?.accent || DASHBOARD_COLORS.calendar.text }}>
              <Tag size={18} />
            </div>

            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-foreground">
                Most Posted Category
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-5">
                Identify the most used category for calendar events and perks.
              </CardDescription>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Content Type
              </Label>
              <Select value={selectedType} onValueChange={onTypeChange}>
                <SelectTrigger className="h-9 rounded-xl border-border bg-white text-xs font-medium">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>

                <SelectContent>
                  {POSTING_CATEGORY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Year
              </Label>
              <Select value={String(selectedYear)} onValueChange={onYearChange}>
                <SelectTrigger className="h-9 rounded-xl border-border bg-white text-xs font-medium">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>

                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
            <div className="h-[260px] animate-pulse rounded-xl bg-muted" />
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        ) : total === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              No category data found.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              No {selectedMeta.label.toLowerCase()} categories were found for {selectedYear}.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px]">
            <div className="h-[270px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 14, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="shortName"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={18}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Total Records
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatCount(total)}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Top Category
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {topCategory?.category || "No data"}
                </p>
                <p className="mt-1 text-xs font-medium text-[#3D398C]">
                  {formatCount(topCategory?.count || 0)} records
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Filter
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {selectedMeta.label}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Year {selectedYear}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniCalendarEventsCard({ events, loading, onViewAll }) {
  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));

  const monthNumber = Number(selectedMonth);
  const yearNumber = Number(selectedYear);
  const selectedMonthLabel = new Date(yearNumber, monthNumber, 1).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 7 }, (_, index) => String(currentYear - 2 + index));
  }, []);

  const calendarDays = useMemo(() => {
    return buildCalendarDays(yearNumber, monthNumber);
  }, [yearNumber, monthNumber]);

  const visibleEvents = useMemo(() => {
    return events
      .map((event) => ({
        ...event,
        parsedDate: parseDateSafe(event?.eventDate || event?.startDate || event?.date),
      }))
      .filter((event) => event.parsedDate)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  }, [events]);

  const monthEvents = useMemo(() => {
    return visibleEvents.filter((event) => {
      return (
        event.parsedDate.getFullYear() === yearNumber &&
        event.parsedDate.getMonth() === monthNumber
      );
    });
  }, [visibleEvents, yearNumber, monthNumber]);

  function hasEventOnDate(date) {
    return monthEvents.some((event) => isSameDate(event.parsedDate, date));
  }

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-white shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: DASHBOARD_COLORS.calendar.bg, color: DASHBOARD_COLORS.calendar.text }}>
              <CalendarDays size={18} />
            </div>

            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-foreground">
                Calendar Events
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-5">
                View scheduled alumni activities and events.
              </CardDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 text-xs font-semibold text-[#3D398C] transition hover:text-[#312d73]"
          >
            View all
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="relative h-8 w-[88px] justify-center rounded-xl border-border bg-white px-3 text-center text-xs font-medium [&>span]:w-full [&>span]:text-center [&>svg]:absolute [&>svg]:right-2">
              <SelectValue placeholder="Month" />
            </SelectTrigger>

            <SelectContent>
              {MONTH_OPTIONS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="flex-1 text-center text-sm font-bold text-foreground">
            {selectedMonthLabel}
          </p>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="relative h-8 w-[88px] justify-center rounded-xl border-border bg-white px-3 text-center text-xs font-medium [&>span]:w-full [&>span]:text-center [&>svg]:absolute [&>svg]:right-2">
              <SelectValue placeholder="Year" />
            </SelectTrigger>

            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="pb-2 text-[11px] font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((date) => {
              const isCurrentMonth = date.getMonth() === monthNumber;
              const isToday = isSameDate(date, today);
              const hasEvent = hasEventOnDate(date);

              return (
                <div
                  key={date.toISOString()}
                  className="flex h-9 items-center justify-center"
                >
                  <div
                    className={[
                      "relative grid h-8 w-8 place-items-center rounded-xl text-xs font-semibold transition",
                      isToday
                        ? "bg-[#3D398C] text-white"
                        : isCurrentMonth
                          ? "text-foreground hover:bg-muted"
                          : "text-muted-foreground/35",
                    ].join(" ")}
                  >
                    {date.getDate()}

                    {hasEvent ? (
                      <span
                        className={[
                          "absolute bottom-1 h-1 w-1 rounded-full",
                          isToday ? "bg-white" : "bg-[#3D398C]",
                        ].join(" ")}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            This Month
          </p>

          {loading ? (
            <div className="space-y-2">
              <div className="h-10 animate-pulse rounded-xl bg-muted" />
              <div className="h-10 animate-pulse rounded-xl bg-muted" />
            </div>
          ) : monthEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-4 text-center">
              <p className="text-xs font-medium text-muted-foreground">
                No events scheduled this month.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {monthEvents.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2"
                >
                  <p className="truncate text-xs font-semibold text-foreground">
                    {getEventTitle(event)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                    {formatDate(event.parsedDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentListCard({
  icon: Icon,
  color = DASHBOARD_COLORS.posts,
  title,
  description,
  items = [],
  loading = false,
  emptyText = "No recent items found.",
  getTitle,
  getDate,
  onViewAll,
}) {
  return (
    <Card className="h-full overflow-hidden border-border/60 bg-white shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-foreground">
                {title}
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-5">
                {description}
              </CardDescription>
            </div>
          </div>

          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="shrink-0 text-xs font-semibold text-[#3D398C] transition hover:text-[#312d73]"
            >
              View all
            </button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-8 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              {emptyText}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 transition hover:bg-muted/40"
              >
                <p className="truncate text-sm font-semibold text-foreground">
                  {getTitle(item)}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                  {formatDate(getDate(item))}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function getAlumniDisplayName(alumni = {}) {
  const personalInfo = alumni?.personalInformation || {};

  const fullName = safeText(personalInfo?.fullName);
  if (fullName) return fullName;

  const firstName = safeText(personalInfo?.firstName);
  const middleName = safeText(personalInfo?.middleName);
  const lastName = safeText(personalInfo?.lastName);

  return [firstName, middleName, lastName].filter(Boolean).join(" ") || "Unnamed Alumni";
}

function getAlumniEmail(alumni = {}) {
  return (
    safeText(alumni?.contactInformation?.personalEmail) ||
    safeText(alumni?.contactInformation?.nuEmail) ||
    safeText(alumni?.email) ||
    "—"
  );
}

function getAlumniStudentId(alumni = {}) {
  return safeText(alumni?.alumniInformation?.studentId) || "—";
}

function getAlumniProgram(alumni = {}) {
  const info = alumni?.alumniInformation || {};

  return (
    safeText(info?.courseGraduated) ||
    safeText(info?.course) ||
    safeText(info?.academicProgram) ||
    safeText(info?.program) ||
    "—"
  );
}

function getAlumniRegisteredDate(alumni = {}) {
  const registrationCandidates = [
    alumni?.systemAudit?.registeredAt,
    alumni?.registeredAt,
    alumni?.systemAudit?.claimedAt,
    alumni?.claimedAt,
    alumni?.requirementGateCompletedAt,
    alumni?.requirementGate?.completedAt,
    alumni?.requirementGate?.createdAt,
  ];

  const fallbackCandidates = [
    alumni?.systemAudit?.updatedAt,
    alumni?.updatedAt,
    alumni?.systemAudit?.createdAt,
    alumni?.createdAt,
  ];

  const parsedRegistrationDates = registrationCandidates
    .map(parseDateSafe)
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime());

  if (parsedRegistrationDates.length > 0) {
    return parsedRegistrationDates[0];
  }

  const parsedFallbackDates = fallbackCandidates
    .map(parseDateSafe)
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime());

  return parsedFallbackDates[0] || null;
}

function getAlumniRegisteredTime(alumni = {}) {
  return getAlumniRegisteredDate(alumni)?.getTime?.() || 0;
}


function getArrayValue(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).length > 0;
  if (typeof value === "boolean") return true;
  return safeText(value) !== "";
}

function getProfileResume(alumni = {}) {
  const resume = alumni?.background?.resume || alumni?.resume || null;
  if (resume?.url) return resume;

  const legacyResume = getArrayValue(alumni?.personalization?.resumeUrl);
  if (legacyResume.length > 0) return { url: legacyResume[0] };

  return null;
}

function getProfileCurrentStatus(alumni = {}) {
  return alumni?.employmentData?.currentStatus || alumni?.currentStatus || {};
}

function calculateAlumniProfileCompletion(alumni = {}) {
  const personalInformation = alumni?.personalInformation || {};
  const alumniInformation = alumni?.alumniInformation || {};
  const contactInformation = alumni?.contactInformation || {};
  const personalization = alumni?.personalization || {};
  const background = alumni?.background || {};
  const currentStatus = getProfileCurrentStatus(alumni);
  const resume = getProfileResume(alumni);

  const aboutMe = Array.isArray(background?.aboutMe)
    ? background.aboutMe.filter(Boolean)
    : safeText(personalization?.bio)
      ? [personalization.bio]
      : [];

  const fullName =
    safeText(personalInformation?.fullName) ||
    [
      safeText(personalInformation?.firstName),
      safeText(personalInformation?.middleName),
      safeText(personalInformation?.lastName),
    ]
      .filter(Boolean)
      .join(" ");

  const checks = [
    aboutMe.length > 0,
    Boolean(resume?.url),
    hasValue(fullName),
    hasValue(personalInformation?.gender),
    hasValue(alumniInformation?.studentId),
    hasValue(
      alumniInformation?.courseGraduatedFullName ||
        alumniInformation?.courseGraduated ||
        alumniInformation?.course,
    ),
    hasValue(currentStatus?.jobRole || currentStatus?.position),
    hasValue(currentStatus?.workingAt || currentStatus?.company),
    getArrayValue(personalization?.skills).length > 0,
    hasValue(contactInformation?.personalEmail),
    hasValue(contactInformation?.mobileNumber),
  ];

  const filled = checks.filter(Boolean).length;
  const total = checks.length || 1;

  return Math.round((filled / total) * 100);
}

function AverageAlumniProfileCompletionCard({ value = 0, totalAlumni = 0, loading = false }) {
  const normalizedValue = Math.max(0, Math.min(100, Math.round(Number(value || 0))));

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-white shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{
              backgroundColor: DASHBOARD_COLORS.alumni.bg,
              color: DASHBOARD_COLORS.alumni.text,
            }}
          >
            <Users size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-bold text-foreground">
              Average Alumni Profile Completion
            </CardTitle>

            <CardDescription className="mt-1 text-xs leading-5">
              Average completion rate of registered alumni profiles.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-4">
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        ) : totalAlumni === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              No alumni profiles found.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Average profile completion will appear once alumni records are available.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {normalizedValue}%
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Average across {formatCount(totalAlumni)} registered alumni
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <p className="mt-0.5 text-sm font-bold text-foreground">
                  {normalizedValue >= 80
                    ? "Strong"
                    : normalizedValue >= 50
                      ? "Moderate"
                      : "Needs Update"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${normalizedValue}%`,
                    backgroundColor: DASHBOARD_COLORS.alumni.text,
                  }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Based on profile details such as about me, resume, personal information,
              academic information, career details, skills, and contact information.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentlyRegisteredAlumniCard({ alumni = [], loading = false, onViewAll }) {
  const sortedAlumni = useMemo(() => {
    return [...alumni].sort(
      (a, b) => getAlumniRegisteredTime(b) - getAlumniRegisteredTime(a),
    );
  }, [alumni]);

  const latestAlumni = sortedAlumni[0] || null;

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-white shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: DASHBOARD_COLORS.alumni.bg, color: DASHBOARD_COLORS.alumni.text }}>
            <Users size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-bold text-foreground">
              Recently Registered Alumni
            </CardTitle>

            <CardDescription className="mt-1 text-xs leading-5">
              Latest alumni accounts registered in the system.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : sortedAlumni.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              No recently registered alumni found.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Newly registered alumni accounts will appear here once available.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Latest Alumni
                </p>
                <p className="mt-1 truncate text-sm font-bold text-foreground">
                  {getAlumniDisplayName(latestAlumni)}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent Records
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {formatCount(sortedAlumni.length)} shown
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border/70 bg-white">
              <div className="grid grid-cols-[minmax(0,1fr)_96px] border-b border-border/60 bg-muted/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[minmax(0,1fr)_120px_90px]">
                <span>Alumni</span>
                <span className="hidden sm:block">Program</span>
                <span className="text-right">Registered</span>
              </div>

              <div className="divide-y divide-border/60">
                {sortedAlumni.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-3 px-3 py-3 transition hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_120px_90px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {getAlumniDisplayName(item)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                        {getAlumniEmail(item)}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-muted-foreground sm:hidden">
                        {getAlumniProgram(item)} · {getAlumniStudentId(item)}
                      </p>
                    </div>

                    <div className="hidden min-w-0 sm:block">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {getAlumniProgram(item)}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
                        {getAlumniStudentId(item)}
                      </p>
                    </div>

                    <p className="text-right text-xs font-medium text-muted-foreground">
                      {formatDate(getAlumniRegisteredDate(item))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {onViewAll ? (
              <button
                type="button"
                onClick={onViewAll}
                className="w-full rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-xs font-semibold text-[#3D398C] transition hover:bg-[#3D398C]/5 hover:text-[#312d73]"
              >
                View all alumni records
              </button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlumniRegistrationOverviewChart({ data = [], total = 0, loading = false }) {
  if (loading) {
    return <div className="h-[170px] w-full animate-pulse rounded-xl bg-muted" />;
  }

  if (!total) {
    return (
      <div className="grid h-[170px] place-items-center rounded-xl border border-dashed border-border bg-muted/20 text-xs font-medium text-muted-foreground">
        No chart data
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[190px]">
      <RechartsDonutChart data={data} loading={false} height={170} />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {formatCount(total)}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground">
            total
          </p>
        </div>
      </div>
    </div>
  );
}

function AlumniRegistrationOverviewCard({ counts = DASHBOARD_COUNTS_INITIAL, loading = false }) {
  const registered = Number(counts.registeredAlumni || 0);
  const transitioning = Number(counts.transitioningAlumni || 0);
  const preRegistered = Number(counts.preRegisteredAlumni || 0);
  const total = registered + transitioning + preRegistered;

  const chartData = [
    {
      name: "Registered",
      value: registered,
      color: ALUMNI_REGISTRATION_COLORS.registered,
    },
    {
      name: "Transitioning",
      value: transitioning,
      color: ALUMNI_REGISTRATION_COLORS.transitioning,
    },
    {
      name: "Pre-registered",
      value: preRegistered,
      color: ALUMNI_REGISTRATION_COLORS.preRegistered,
    },
  ];

  const labelItems = [
    {
      label: "Registered",
      value: registered,
      color: ALUMNI_REGISTRATION_COLORS.registered,
      helper: "Active alumni accounts",
    },
    {
      label: "Transitioning",
      value: transitioning,
      color: ALUMNI_REGISTRATION_COLORS.transitioning,
      helper: "Interns queued for transition",
    },
    {
      label: "Pre-registered",
      value: preRegistered,
      color: ALUMNI_REGISTRATION_COLORS.preRegistered,
      helper: "Records not yet claimed",
    },
  ];

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-white shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: DASHBOARD_COLORS.alumni.bg, color: DASHBOARD_COLORS.alumni.text }}>
            <PieChartIcon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-bold text-foreground">
              Alumni Registration Overview
            </CardTitle>

            <CardDescription className="mt-1 text-xs leading-5">
              Comparison of registered, transitioning, and pre-registered alumni records.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {loading ? (
          <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_190px]">
            <div className="space-y-3">
              <div className="h-14 animate-pulse rounded-xl bg-muted" />
              <div className="h-14 animate-pulse rounded-xl bg-muted" />
              <div className="h-14 animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="h-[170px] animate-pulse rounded-xl bg-muted" />
          </div>
        ) : total === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              No alumni registration records yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Registration totals will appear here once records are available.
            </p>
          </div>
        ) : (
          <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_190px]">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                Alumni Records Summary
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                {labelItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-sm font-medium text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {formatCount(item.value)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                      {formatPercent(total ? (item.value / total) * 100 : 0)} of total · {item.helper}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <AlumniRegistrationOverviewChart
              data={chartData}
              total={total}
              loading={loading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const API_BASE_URL = "http://127.0.0.1:8000/api";

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

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

async function fetchFirstList(endpoints = []) {
  for (const endpoint of endpoints) {
    try {
      const data = await apiRequest(endpoint);
      return asList(data);
    } catch {
      // Try the next endpoint. Some officer modules are still being migrated.
    }
  }

  return [];
}

function isRole(row = {}, roleName = "") {
  return safeText(row?.role || row?.account_role || row?.account?.role)
    .toLowerCase()
    .replace(/[-_\s]+/g, "") ===
    safeText(roleName).toLowerCase().replace(/[-_\s]+/g, "");
}

async function loadAlumniRows() {
  const rows = await fetchFirstList(["/alumni/", "/users/", "/accounts/"]);
  return rows.filter((row) => isRole(row, "alumni") || safeText(row?.role).toLowerCase() === "alumni");
}

async function loadInternRows() {
  const rows = await fetchFirstList(["/interns/", "/users/", "/accounts/"]);
  return rows.filter((row) => isRole(row, "intern") || isRole(row, "interns") || safeText(row?.role).toLowerCase() === "intern");
}

async function loadDashboardCounts() {
  const [alumni, preRegisteredAlumni, interns, posts, surveys, perks, events] =
    await Promise.all([
      loadAlumniRows(),
      fetchFirstList(["/pre-registered-alumni/", "/pre_registered_alumni/"]),
      loadInternRows(),
      fetchFirstList(["/posts/", "/news-posts/", "/newsPosts/"]),
      fetchFirstList(["/surveys/"]),
      fetchFirstList(["/perks-discounts/", "/perksDiscounts/"]),
      fetchFirstList(["/calendar-events/", "/calendarEvents/"]),
    ]);

  const transitioningAlumni = interns.filter(
    (row) => row?.alumniTransition?.pending === true || row?.alumni_transition_pending === true,
  ).length;

  return {
    registeredAlumni: alumni.length,
    preRegisteredAlumni: preRegisteredAlumni.length,
    transitioningAlumni,
    totalAlumni: alumni.length + preRegisteredAlumni.length + transitioningAlumni,
    totalPosts: posts.filter(isVisiblePost).length,
    totalSurveys: surveys.filter(isAvailableSurvey).length,
    totalPerksDiscounts: perks.filter(isVisiblePerk).length,
    totalCalendarEvents: events.filter(isVisibleEvent).length,
  };
}

async function loadRecentlyRegisteredAlumni() {
  const alumni = await loadAlumniRows();

  return alumni
    .sort((a, b) => getAlumniRegisteredTime(b) - getAlumniRegisteredTime(a))
    .slice(0, 5);
}

async function loadAverageAlumniProfileCompletion() {
  const alumni = await loadAlumniRows();

  if (!alumni.length) {
    return {
      average: 0,
      totalAlumni: 0,
    };
  }

  const totalCompletion = alumni.reduce(
    (sum, item) => sum + calculateAlumniProfileCompletion(item),
    0,
  );

  return {
    average: Math.round(totalCompletion / alumni.length),
    totalAlumni: alumni.length,
  };
}

async function loadAvailableSurveys() {
  const surveys = await fetchFirstList(["/surveys/"]);
  return surveys.filter(isAvailableSurvey).sort(
    (a, b) => (getCreatedDate(b)?.getTime() || 0) - (getCreatedDate(a)?.getTime() || 0),
  );
}

async function loadCalendarEvents() {
  const events = await fetchFirstList(["/calendar-events/", "/calendarEvents/"]);
  return events.filter(isVisibleEvent).sort((a, b) => {
    const aDate = parseDateSafe(a?.eventDate || a?.startDate || a?.date || a?.createdAt);
    const bDate = parseDateSafe(b?.eventDate || b?.startDate || b?.date || b?.createdAt);
    return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
  });
}

async function loadRecentPosts() {
  const posts = await fetchFirstList(["/posts/", "/news-posts/", "/newsPosts/"]);
  return posts
    .filter(isVisiblePost)
    .sort((a, b) => (getCreatedDate(b)?.getTime() || 0) - (getCreatedDate(a)?.getTime() || 0))
    .slice(0, 5);
}

async function loadRecentPerksDiscounts() {
  const perks = await fetchFirstList(["/perks-discounts/", "/perksDiscounts/"]);
  return perks
    .filter(isVisiblePerk)
    .sort((a, b) => (getCreatedDate(b)?.getTime() || 0) - (getCreatedDate(a)?.getTime() || 0))
    .slice(0, 5);
}

async function loadMonthlyPostingActivity({
  type = "posts",
  year = new Date().getFullYear(),
} = {}) {
  const selectedMeta =
    POSTING_ACTIVITY_TYPES.find((item) => item.value === type) ||
    POSTING_ACTIVITY_TYPES[0];

  const endpointMap = {
    posts: ["/posts/", "/news-posts/", "/newsPosts/"],
    surveys: ["/surveys/"],
    perks: ["/perks-discounts/", "/perksDiscounts/"],
    events: ["/calendar-events/", "/calendarEvents/"],
  };

  const rows = await fetchFirstList(endpointMap[type] || []);
  const counts = MONTH_OPTIONS.reduce((acc, month) => {
    acc[Number(month.value)] = 0;
    return acc;
  }, {});

  const targetYear = Number(year);

  rows.forEach((data) => {
    if (type === "posts" && !isVisiblePost(data)) return;
    if (type === "perks" && !isVisiblePerk(data)) return;
    if (type === "events" && !isVisibleEvent(data)) return;
    if (type === "surveys" && !isAvailableSurvey(data)) return;

    const date =
      type === "events"
        ? parseDateSafe(data?.eventDate || data?.startDate || data?.date || data?.createdAt)
        : getCreatedDate(data);

    if (!date || date.getFullYear() !== targetYear) return;

    counts[date.getMonth()] += 1;
  });

  return MONTH_OPTIONS.map((month) => ({
    month: new Date(targetYear, Number(month.value), 1).toLocaleDateString([], {
      month: "long",
    }),
    shortMonth: month.label,
    count: counts[Number(month.value)] || 0,
  }));
}

async function loadMostPostedCategory({
  type = "events",
  year = new Date().getFullYear(),
} = {}) {
  const endpointMap = {
    perks: ["/perks-discounts/", "/perksDiscounts/"],
    events: ["/calendar-events/", "/calendarEvents/"],
  };

  const rows = await fetchFirstList(endpointMap[type] || []);
  const targetYear = Number(year);
  const counts = {};

  rows.forEach((data) => {
    if (type === "perks" && !isVisiblePerk(data)) return;
    if (type === "events" && !isVisibleEvent(data)) return;

    const date =
      type === "events"
        ? parseDateSafe(data?.eventDate || data?.startDate || data?.date || data?.createdAt)
        : getCreatedDate(data);

    if (!date || date.getFullYear() !== targetYear) return;

    const category = getCategoryByType(type, data);
    counts[category] = (counts[category] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => Number(b.count || 0) - Number(a.count || 0));
}

function getResponseIdentity(response = {}) {
  const uid = safeText(response?.respondentUid || response?.uid || response?.userId);
  if (uid) return `uid:${uid}`;

  const email = safeText(
    response?.respondentEmail || response?.email || response?.userEmail,
  ).toLowerCase();

  if (email) return `email:${email}`;

  return "";
}

async function loadSurveyEngagement(selectedSurveyId, registeredAlumniCount) {
  if (!selectedSurveyId) {
    return {
      ...SURVEY_ENGAGEMENT_INITIAL,
      totalEligibleAlumni: registeredAlumniCount,
      notAnsweredCount: registeredAlumniCount,
    };
  }

  const responses = await fetchFirstList([
    `/surveys/${selectedSurveyId}/responses/`,
    `/survey-responses/?survey=${selectedSurveyId}`,
  ]);

  const uniqueRespondents = new Set();

  responses.forEach((response, index) => {
    const identity = getResponseIdentity(response || {});

    if (identity) {
      uniqueRespondents.add(identity);
      return;
    }

    uniqueRespondents.add(`response:${response?.id || index}`);
  });

  const answeredCount = Math.min(uniqueRespondents.size, registeredAlumniCount);
  const notAnsweredCount = Math.max(registeredAlumniCount - answeredCount, 0);

  return {
    answeredCount,
    notAnsweredCount,
    totalEligibleAlumni: registeredAlumniCount,
    responseCount: responses.length,
  };
}

export default function OfficerDashboardPage() {
  const navigate = useNavigate();
  const account = getStoredAccount();

  const [dashboardCounts, setDashboardCounts] = useState(
    DASHBOARD_COUNTS_INITIAL,
  );
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState("");

  const [availableSurveys, setAvailableSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [surveyEngagement, setSurveyEngagement] = useState(
    SURVEY_ENGAGEMENT_INITIAL,
  );
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [engagementError, setEngagementError] = useState("");

  const [recentRegisteredAlumni, setRecentRegisteredAlumni] = useState([]);
  const [recentRegisteredAlumniLoading, setRecentRegisteredAlumniLoading] = useState(true);

  const [averageProfileCompletion, setAverageProfileCompletion] = useState({
    average: 0,
    totalAlumni: 0,
  });
  const [averageProfileCompletionLoading, setAverageProfileCompletionLoading] = useState(true);

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarEventsLoading, setCalendarEventsLoading] = useState(true);

  const [recentPosts, setRecentPosts] = useState([]);
  const [recentPostsLoading, setRecentPostsLoading] = useState(true);

  const [recentPerks, setRecentPerks] = useState([]);
  const [recentPerksLoading, setRecentPerksLoading] = useState(true);

  const [monthlyPostingActivity, setMonthlyPostingActivity] = useState([]);
  const [monthlyPostingActivityLoading, setMonthlyPostingActivityLoading] = useState(true);
  const [monthlyPostingType, setMonthlyPostingType] = useState("posts");
  const [monthlyPostingYear, setMonthlyPostingYear] = useState(String(new Date().getFullYear()));

  const [mostPostedCategory, setMostPostedCategory] = useState([]);
  const [mostPostedCategoryLoading, setMostPostedCategoryLoading] = useState(true);
  const [mostPostedCategoryType, setMostPostedCategoryType] = useState("events");
  const [mostPostedCategoryYear, setMostPostedCategoryYear] = useState(String(new Date().getFullYear()));

  const monthlyPostingYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, index) => String(currentYear - 4 + index));
  }, []);

  const userEmail = account?.email || "—";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";

    return "Good evening";
  }, []);

  const recentEvents = useMemo(() => {
    return calendarEvents
      .map((event) => ({
        ...event,
        parsedDate: parseDateSafe(event?.eventDate || event?.startDate || event?.date),
      }))
      .filter((event) => event.parsedDate)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
      .slice(0, 5);
  }, [calendarEvents]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setCountsLoading(true);
        setCountsError("");

        const nextCounts = await loadDashboardCounts();

        if (!mounted) return;
        setDashboardCounts(nextCounts);
      } catch (error) {
        console.error("Failed to load officer dashboard counts:", error);

        if (!mounted) return;
        setCountsError(error?.message || "Failed to load dashboard totals.");
        setDashboardCounts(DASHBOARD_COUNTS_INITIAL);
      } finally {
        if (mounted) setCountsLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setRecentRegisteredAlumniLoading(true);

        const alumni = await loadRecentlyRegisteredAlumni();

        if (!mounted) return;
        setRecentRegisteredAlumni(alumni);
      } catch (error) {
        console.error("Failed to load recently registered alumni:", error);

        if (!mounted) return;
        setRecentRegisteredAlumni([]);
      } finally {
        if (mounted) setRecentRegisteredAlumniLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setSurveysLoading(true);
        setEngagementError("");

        const surveys = await loadAvailableSurveys();

        if (!mounted) return;

        setAvailableSurveys(surveys);
        setSelectedSurveyId((current) => current || surveys?.[0]?.id || "");
      } catch (error) {
        console.error("Failed to load available surveys:", error);

        if (!mounted) return;
        setAvailableSurveys([]);
        setSelectedSurveyId("");
        setEngagementError(error?.message || "Failed to load available surveys.");
      } finally {
        if (mounted) setSurveysLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setAverageProfileCompletionLoading(true);

        const nextAverage = await loadAverageAlumniProfileCompletion();

        if (!mounted) return;
        setAverageProfileCompletion(nextAverage);
      } catch (error) {
        console.error("Failed to load average alumni profile completion:", error);

        if (!mounted) return;
        setAverageProfileCompletion({
          average: 0,
          totalAlumni: 0,
        });
      } finally {
        if (mounted) setAverageProfileCompletionLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setCalendarEventsLoading(true);

        const events = await loadCalendarEvents();

        if (!mounted) return;
        setCalendarEvents(events);
      } catch (error) {
        console.error("Failed to load calendar events:", error);

        if (!mounted) return;
        setCalendarEvents([]);
      } finally {
        if (mounted) setCalendarEventsLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setRecentPostsLoading(true);
        const posts = await loadRecentPosts();
        if (!mounted) return;
        setRecentPosts(posts);
      } catch (error) {
        console.error("Failed to load recent posts:", error);
        if (!mounted) return;
        setRecentPosts([]);
      } finally {
        if (mounted) setRecentPostsLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setRecentPerksLoading(true);
        const perks = await loadRecentPerksDiscounts();
        if (!mounted) return;
        setRecentPerks(perks);
      } catch (error) {
        console.error("Failed to load recent perks and discounts:", error);
        if (!mounted) return;
        setRecentPerks([]);
      } finally {
        if (mounted) setRecentPerksLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setMonthlyPostingActivityLoading(true);

        const activity = await loadMonthlyPostingActivity({
          type: monthlyPostingType,
          year: monthlyPostingYear,
        });

        if (!mounted) return;
        setMonthlyPostingActivity(activity);
      } catch (error) {
        console.error("Failed to load monthly posting activity:", error);

        if (!mounted) return;
        setMonthlyPostingActivity([]);
      } finally {
        if (mounted) setMonthlyPostingActivityLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [monthlyPostingType, monthlyPostingYear]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setMostPostedCategoryLoading(true);

        const categories = await loadMostPostedCategory({
          type: mostPostedCategoryType,
          year: mostPostedCategoryYear,
        });

        if (!mounted) return;
        setMostPostedCategory(categories);
      } catch (error) {
        console.error("Failed to load most posted category:", error);

        if (!mounted) return;
        setMostPostedCategory([]);
      } finally {
        if (mounted) setMostPostedCategoryLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [mostPostedCategoryType, mostPostedCategoryYear]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      const registeredAlumniCount = Number(dashboardCounts.registeredAlumni || 0);

      if (!selectedSurveyId) {
        setSurveyEngagement({
          ...SURVEY_ENGAGEMENT_INITIAL,
          totalEligibleAlumni: registeredAlumniCount,
          notAnsweredCount: registeredAlumniCount,
        });
        return;
      }

      try {
        setEngagementLoading(true);
        setEngagementError("");

        const nextEngagement = await loadSurveyEngagement(
          selectedSurveyId,
          registeredAlumniCount,
        );

        if (!mounted) return;
        setSurveyEngagement(nextEngagement);
      } catch (error) {
        console.error("Failed to load survey engagement:", error);

        if (!mounted) return;
        setSurveyEngagement({
          ...SURVEY_ENGAGEMENT_INITIAL,
          totalEligibleAlumni: registeredAlumniCount,
          notAnsweredCount: registeredAlumniCount,
        });
        setEngagementError(error?.message || "Failed to load survey engagement.");
      } finally {
        if (mounted) setEngagementLoading(false);
      }
    }

    if (!countsLoading) run();

    return () => {
      mounted = false;
    };
  }, [countsLoading, dashboardCounts.registeredAlumni, selectedSurveyId]);

  return (
    <div className="animate-fadeIn space-y-6">
      <Card className="overflow-hidden border-border/60 border-l-4 border-l-[#3D398C] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">
            {greeting}, <span className="text-[#3D398C]">{userEmail}</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Welcome to the Alumni Affairs Office Dashboard.
          </CardDescription>
        </CardHeader>
      </Card>

      {countsError ? (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="pt-5 text-sm font-medium text-red-700">
            {countsError}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardMetricCard
          icon={Users}
          label="Alumni"
          value={dashboardCounts.totalAlumni}
          color={DASHBOARD_COLORS.alumni}
          loading={countsLoading}
          onViewDetails={() => navigate("/alumni-officer/alumni/manage")}
        />

        <DashboardMetricCard
          icon={Megaphone}
          label="Posts"
          value={dashboardCounts.totalPosts}
          color={DASHBOARD_COLORS.posts}
          loading={countsLoading}
          onViewDetails={() => navigate("/alumni-officer/posts")}
        />

        <DashboardMetricCard
          icon={PieChartIcon}
          label="Surveys"
          value={dashboardCounts.totalSurveys}
          color={DASHBOARD_COLORS.surveys}
          loading={countsLoading}
          onViewDetails={() => navigate("/alumni-officer/surveys")}
        />

        <DashboardMetricCard
          icon={Tag}
          label="Perks & Discounts"
          value={dashboardCounts.totalPerksDiscounts}
          color={DASHBOARD_COLORS.perks}
          loading={countsLoading}
          onViewDetails={() => navigate("/alumni-officer/perks-discounts")}
        />

        <DashboardMetricCard
          icon={CalendarDays}
          label="Calendar Events"
          value={dashboardCounts.totalCalendarEvents}
          color={DASHBOARD_COLORS.calendar}
          loading={countsLoading}
          onViewDetails={() => navigate("/alumni-officer/calendar")}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.85fr)]">
        <div className="space-y-4">
          <RecentlyRegisteredAlumniCard
            alumni={recentRegisteredAlumni}
            loading={recentRegisteredAlumniLoading}
            onViewAll={() => navigate("/alumni-officer/alumni/manage")}
          />

          <AlumniRegistrationOverviewCard
            counts={dashboardCounts}
            loading={countsLoading}
          />

          <AverageAlumniProfileCompletionCard
            value={averageProfileCompletion.average}
            totalAlumni={averageProfileCompletion.totalAlumni}
            loading={averageProfileCompletionLoading}
          />

          <SurveyEngagementCard
            surveys={availableSurveys}
            selectedSurveyId={selectedSurveyId}
            setSelectedSurveyId={setSelectedSurveyId}
            engagement={surveyEngagement}
            loadingSurveys={surveysLoading}
            loadingEngagement={engagementLoading}
            error={engagementError}
          />

          <MonthlyPostingActivityCard
            data={monthlyPostingActivity}
            loading={monthlyPostingActivityLoading}
            selectedType={monthlyPostingType}
            onTypeChange={setMonthlyPostingType}
            selectedYear={monthlyPostingYear}
            onYearChange={setMonthlyPostingYear}
            yearOptions={monthlyPostingYearOptions}
          />

          <MostPostedCategoryCard
            data={mostPostedCategory}
            loading={mostPostedCategoryLoading}
            selectedType={mostPostedCategoryType}
            onTypeChange={setMostPostedCategoryType}
            selectedYear={mostPostedCategoryYear}
            onYearChange={setMostPostedCategoryYear}
            yearOptions={monthlyPostingYearOptions}
          />
        </div>

        <div className="space-y-4">
          <MiniCalendarEventsCard
            events={calendarEvents}
            loading={calendarEventsLoading}
            onViewAll={() => navigate("/alumni-officer/calendar")}
          />

          <RecentListCard
            icon={CalendarDays}
            color={DASHBOARD_COLORS.calendar}
            title="Recent Events"
            description="Upcoming or recently scheduled alumni events."
            items={recentEvents}
            loading={calendarEventsLoading}
            emptyText="No recent events found."
            getTitle={getEventTitle}
            getDate={(event) =>
              event.parsedDate || event.eventDate || event.startDate || event.date
            }
            onViewAll={() => navigate("/alumni-officer/calendar")}
          />

          <RecentListCard
            icon={Megaphone}
            color={DASHBOARD_COLORS.posts}
            title="Recent Posts"
            description="Latest alumni announcements and news posts."
            items={recentPosts}
            loading={recentPostsLoading}
            emptyText="No recent posts found."
            getTitle={getPostTitle}
            getDate={(post) => post.createdAt || post.publishedAt || post.updatedAt}
            onViewAll={() => navigate("/alumni-officer/posts")}
          />

          <RecentListCard
            icon={Tag}
            color={DASHBOARD_COLORS.perks}
            title="Recent Perks & Discounts"
            description="Newest alumni partner perks and discount offers."
            items={recentPerks}
            loading={recentPerksLoading}
            emptyText="No recent perks or discounts found."
            getTitle={getPerkTitle}
            getDate={(perk) => perk.createdAt || perk.publishedAt || perk.updatedAt}
            onViewAll={() => navigate("/alumni-officer/perks-discounts")}
          />
        </div>
      </div>
    </div>
  );
}
