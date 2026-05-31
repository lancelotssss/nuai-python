// src/pages/faculty-admin/alumni-officer/dashboard/OfficerDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label as RechartsLabel,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const BRAND_BLUE = "#3D398C";
const NU_YELLOW = "#F5DA3E";

const STATUS_COLORS = {
  registered: "#3D398C",
  transitioning: "#D97706",
  preRegistered: "#94A3B8",
};

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

const SURVEY_OVERVIEW_INITIAL = {
  activeSurveyCount: 0,
  surveysWithResponses: 0,
  surveysWithoutResponses: 0,
  totalResponses: 0,
  averageResponses: 0,
  topSurveyTitle: "",
  topSurveyResponses: 0,
};



const CATEGORY_CHART_COLORS = [
  "#3D398C",
  "#5B57A8",
  "#7A77C0",
  "#9996D4",
  "#B8B6E2",
  "#CBD5E1",
];


/* Chart configs for local chart wrapper */
const monthlyChartConfig = {
  count: {
    label: "Records",
    color: BRAND_BLUE,
  },
};

const categoryChartConfig = {
  count: {
    label: "Records",
    color: BRAND_BLUE,
  },
};

const donutChartConfig = {
  value: { label: "Count" },
};

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

function getValue(source = {}, ...keys) {
  for (const key of keys) {
    if (!key) continue;

    if (key.includes(".")) {
      const value = key.split(".").reduce((acc, part) => acc?.[part], source);
      if (value !== undefined && value !== null && safeText(value) !== "") return value;
      continue;
    }

    const value = source?.[key];
    if (value !== undefined && value !== null && safeText(value) !== "") return value;
  }

  return "";
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
  const status = normalizeStatus(getValue(event, "status", "eventStatus", "event_status") || "active");

  if (status === "draft" || status === "archived" || status === "cancelled" || status === "canceled") {
    return false;
  }

  return true;
}

function isVisiblePost(post = {}) {
  const status = normalizeStatus(getValue(post, "status", "postStatus", "post_status") || "active");
  return status !== "draft" && status !== "archived" && status !== "deleted";
}

function isVisiblePerk(perk = {}) {
  const status = normalizeStatus(getValue(perk, "status", "perkStatus", "perk_status") || "active");
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
  return (
    safeText(getValue(event, "title", "eventTitle", "event_title", "name")) ||
    "Untitled Event"
  );
}

function getPostTitle(post = {}) {
  const title = safeText(
    getValue(
      post,
      "postHeader",
      "post_header",
      "title",
      "postTitle",
      "post_title",
      "newsTitle",
      "news_title",
      "announcementTitle",
      "announcement_title",
      "headline",
      "caption",
      "subject",
      "postDetails.title",
      "post_details.title",
      "postContent.title",
      "post_content.title",
      "content.title",
      "details.title",
      "body.title",
    ),
  );

  if (title) return title;

  const body = safeText(
    getValue(
      post,
      "postContent",
      "post_content",
      "description",
      "content",
      "body",
      "message",
      "postText",
      "post_text",
      "postContent.body",
      "post_content.body",
      "postDetails.description",
      "post_details.description",
      "details.description",
    ),
  );

  return body ? `${body.slice(0, 55)}${body.length > 55 ? "..." : ""}` : "Untitled Post";
}

function getPerkTitle(perk = {}) {
  const title = safeText(
    getValue(
      perk,
      "postHeader",
      "post_header",
      "title",
      "perkTitle",
      "perk_title",
      "discountTitle",
      "discount_title",
      "name",
      "companyName",
      "company_name",
    ),
  );

  if (title) return title;

  const body = safeText(
    getValue(perk, "postContent", "post_content", "description", "content", "details"),
  );

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
    getValue(post, "category", "postCategory", "post_category", "postType", "post_type", "type", "contentType", "content_type"),
  );
}

function getEventCategory(event = {}) {
  return normalizeCategoryLabel(
    getValue(event, "category", "eventCategory", "event_category", "eventType", "event_type", "type", "activityType", "activity_type"),
  );
}

function getPerkCategory(perk = {}) {
  return normalizeCategoryLabel(
    getValue(perk, "category", "perkCategory", "perk_category", "discountCategory", "discount_category", "perkType", "perk_type", "type", "offerType", "offer_type"),
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
    parseDateSafe(getValue(data, "createdAt", "created_at")) ||
    parseDateSafe(getValue(data, "publishedAt", "published_at")) ||
    parseDateSafe(getValue(data, "updatedAt", "updated_at")) ||
    parseDateSafe(getValue(data, "systemAudit.createdAt", "system_audit.created_at")) ||
    parseDateSafe(getValue(data, "systemAudit.updatedAt", "system_audit.updated_at")) ||
    null
  );
}

function getEventDate(event = {}) {
  return (
    parseDateSafe(getValue(event, "eventDate", "event_date", "startDate", "start_date", "date")) ||
    getCreatedDate(event)
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


/* ───────────────── shadcn chart/calendar compatibility ───────────────── */

function ChartContainer({ className = "", children }) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltipContent({ active, payload, label, formatter, labelFormatter, hideLabel }) {
  if (!active || !payload?.length) return null;

  const displayLabel = labelFormatter ? labelFormatter(label, payload) : label;

  return (
    <div className="min-w-[140px] rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      {!hideLabel && displayLabel ? (
        <p className="mb-1 font-medium text-gray-700">{displayLabel}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((item, index) => {
          const formatted = formatter
            ? formatter(item.value, item.name, item, index, item.payload)
            : item.value;

          return (
            <div key={`${item.name || "item"}-${index}`} className="flex items-center justify-between gap-3">
              <span className="text-gray-500">{item.name || item.dataKey}</span>
              {typeof formatted === "string" || typeof formatted === "number" ? (
                <span className="font-semibold tabular-nums text-gray-900">{formatted}</span>
              ) : (
                formatted
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartTooltip = Tooltip;

function Calendar({ selected, month, onMonthChange, modifiers = {} }) {
  const visibleMonth = month || new Date();
  const year = visibleMonth.getFullYear();
  const monthIndex = visibleMonth.getMonth();
  const days = buildCalendarDays(year, monthIndex);
  const eventDates = modifiers?.hasEvent || [];
  const weeks = Array.from({ length: 6 }, (_, weekIndex) =>
    days.slice(weekIndex * 7, weekIndex * 7 + 7),
  );

  function goToMonth(offset) {
    const next = new Date(year, monthIndex + offset, 1);
    onMonthChange?.(next);
  }

  return (
    <div className="w-full p-0">
      <div className="relative flex w-full flex-col gap-3">
        <div className="absolute inset-x-0 top-0 flex w-full items-center justify-between px-1">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-md p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-md p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex h-6 w-full items-center justify-center px-8 text-xs font-semibold text-gray-900">
          {visibleMonth.toLocaleDateString([], { month: "long", year: "numeric" })}
        </div>

        <div className="w-full border-collapse">
          <div className="flex w-full">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="flex-1 pb-1 text-center text-[10px] font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {weeks.map((week, index) => (
            <div key={index} className="flex w-full">
              {week.map((date) => {
                const outside = date.getMonth() !== monthIndex;
                const selectedDate = selected && isSameDate(date, selected);
                const hasEvent = eventDates.some((eventDate) => isSameDate(date, eventDate));

                return (
                  <div key={date.toISOString()} className="relative flex-1 p-0 text-center">
                    <div
                      className={`relative mx-auto grid h-8 w-8 min-w-8 place-items-center rounded-md border-0 p-0 text-[11px] font-medium ${
                        selectedDate
                          ? "bg-[#3D398C] text-white"
                          : outside
                            ? "text-gray-300"
                            : "text-gray-700"
                      }`}
                    >
                      {date.getDate()}
                      {hasEvent ? (
                        <span className="absolute bottom-0.5 left-1/2 z-20 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#F5DA3E]" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatShortDate(value) {
  const date = parseDateSafe(value);
  if (!date) return "-";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatTodayLong() {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ───────────────── Page Header ───────────────── */

function DashboardHeader() {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of alumni activity, engagement, and content.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <CalendarDays size={14} className="text-gray-400" />
        <span>{formatTodayLong()}</span>
      </div>
    </div>
  );
}

/* ───────────────── Metric Cards ───────────────── */

function MetricCard({ label, value, loading, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-300 hover:bg-gray-50/50"
    >
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        {loading ? (
          <div className="h-7 w-16 animate-pulse rounded bg-gray-100" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
            {formatCount(value)}
          </p>
        )}
        <ArrowUpRight
          size={14}
          className="text-gray-300 transition-colors group-hover:text-[#3D398C]"
        />
      </div>
    </button>
  );
}

/* ───────────────── Section Card Shell (thin border, no shadow) ───────────────── */

function SectionCard({ title, subtitle, action, children, className = "", bodyClassName = "p-4" }) {
  return (
    <Card
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white py-0 shadow-none ring-0 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-[#F1F3F8] px-4 py-3">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <CardContent className={bodyClassName}>{children}</CardContent>
    </Card>
  );
}

function ViewAllButton({ onClick, label = "View all" }) {
  if (!onClick) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-7 cursor-pointer px-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    >
      {label}
      <ArrowUpRight size={12} className="ml-1" />
    </Button>
  );
}

/* ───────────────── Donut + Legend (shadcn charts) ───────────────── */

function MiniDonut({ data = [], loading = false, centerLabel, centerValue }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const displayValue = centerValue ?? formatCount(total);

  if (loading) {
    return <div className="h-[124px] w-full animate-pulse rounded-md bg-gray-100" />;
  }

  if (!total) {
    return (
      <div className="grid h-[124px] place-items-center rounded-md border border-dashed border-gray-200 text-xs text-gray-400">
        No data
      </div>
    );
  }

  return (
    <div className="relative">
      <ChartContainer
        className="mx-auto h-[124px] w-[150px]"
      >
        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-gray-600">{name}</span>
                    <span className="font-semibold tabular-nums text-gray-900">
                      {formatCount(value)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={30}
            outerRadius={46}
            paddingAngle={3}
            strokeWidth={4}
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={entry.color} />
            ))}
            <RechartsLabel
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-gray-900 text-base font-semibold"
                      >
                        {displayValue}
                      </tspan>
                      {centerLabel ? (
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 15}
                          className="fill-gray-500 text-[9px] font-medium"
                        >
                          {centerLabel}
                        </tspan>
                      ) : null}
                    </text>
                  );
                }

                return null;
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
}

function LegendRow({ items = [], className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2 text-[11px]"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="truncate text-gray-600">{item.label}</span>
          <span className="font-semibold tabular-nums text-gray-900">
            {formatCount(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───────────────── Survey Engagement ───────────────── */

function SurveyEngagementCard({
  surveys,
  overview = SURVEY_OVERVIEW_INITIAL,
  loadingSurveys,
  loadingOverview,
  error,
}) {
  const activeSurveyCount = Number(overview.activeSurveyCount || surveys.length || 0);
  const withResponses = Number(overview.surveysWithResponses || 0);
  const withoutResponses = Number(overview.surveysWithoutResponses || 0);
  const totalResponses = Number(overview.totalResponses || 0);
  const averageResponses = Number(overview.averageResponses || 0);

  const data = [
    { name: "With responses", value: withResponses, color: BRAND_BLUE },
    { name: "No responses", value: withoutResponses, color: "#D97706" },
  ];

  return (
    <SectionCard
      title="Survey Engagement"
      subtitle="Response coverage across active surveys"
      className="h-full"
      bodyClassName="flex flex-1 flex-col p-4"
    >
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : activeSurveyCount === 0 && !loadingSurveys ? (
        <div className="grid h-[124px] place-items-center rounded-md border border-dashed border-gray-200 text-xs text-gray-400">
          No surveys available
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <MiniDonut
            data={data}
            loading={loadingSurveys || loadingOverview}
            centerLabel="surveys"
            centerValue={formatCount(activeSurveyCount)}
          />
          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Responses
              </p>
              <p className="text-sm font-semibold tabular-nums text-gray-900">
                {formatCount(totalResponses)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Avg / Survey
              </p>
              <p className="text-sm font-semibold tabular-nums text-gray-900">
                {formatCount(averageResponses)}
              </p>
            </div>
          </div>
          {overview.topSurveyTitle ? (
            <p
              className="truncate text-[11px] text-gray-500"
              title={overview.topSurveyTitle}
            >
              Top survey:{" "}
              <span className="font-medium text-gray-700">
                {overview.topSurveyTitle}
              </span>{" "}
              ({formatCount(overview.topSurveyResponses)} responses)
            </p>
          ) : null}
          <div className="mt-auto border-t border-gray-100 pt-3">
            <LegendRow
              items={data.map((d) => ({
                label: d.name,
                value: d.value,
                color: d.color,
              }))}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ───────────────── Monthly Posting Activity (shadcn chart) ───────────────── */

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
    POSTING_ACTIVITY_TYPES.find((t) => t.value === selectedType) ||
    POSTING_ACTIVITY_TYPES[0];

  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const peakMonth = data.reduce(
    (top, item) => (Number(item.count || 0) > Number(top?.count || 0) ? item : top),
    data[0] || null,
  );

  const chartData = data.map((item) => ({
    month: item.shortMonth,
    fullMonth: item.month,
    count: Number(item.count || 0),
  }));

  return (
    <SectionCard
      title="Monthly Activity"
      subtitle={`${selectedMeta.label} created across ${selectedYear}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="h-8 w-[160px] cursor-pointer rounded-md border-gray-200 bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
            {POSTING_ACTIVITY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="cursor-pointer">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(selectedYear)} onValueChange={onYearChange}>
          <SelectTrigger className="h-8 w-[100px] cursor-pointer rounded-md border-gray-200 bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)} className="cursor-pointer">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Total
            </p>
            <p className="text-sm font-semibold tabular-nums text-gray-900">
              {formatCount(total)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Peak
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {peakMonth?.shortMonth || "—"}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[240px] animate-pulse rounded-md bg-gray-100" />
      ) : total === 0 ? (
        <div className="grid h-[240px] place-items-center rounded-md border border-dashed border-gray-200 text-xs text-gray-400">
          No activity recorded for {selectedYear}
        </div>
      ) : (
        <ChartContainer
          config={monthlyChartConfig}
          className="h-[240px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
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
            <ChartTooltip
              cursor={{ fill: "#F9FAFB" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullMonth || label
                  }
                  formatter={(value) => (
                    <span className="font-semibold tabular-nums text-gray-900">
                      {formatCount(value)} records
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              barSize={20}
              fill={BRAND_BLUE}
            />
          </BarChart>
        </ChartContainer>
      )}
    </SectionCard>
  );
}

/* ───────────────── Most Posted Category (shadcn chart) ───────────────── */

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
    POSTING_CATEGORY_TYPES.find((t) => t.value === selectedType) ||
    POSTING_CATEGORY_TYPES[0];

  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const topCategory = data.reduce(
    (top, item) => (Number(item.count || 0) > Number(top?.count || 0) ? item : top),
    data[0] || null,
  );

  const chartData = data
    .filter((item) => Number(item.count || 0) > 0)
    .slice(0, 6)
    .map((item, index) => ({
      name: item.category,
      shortName:
        item.category.length > 20 ? `${item.category.slice(0, 20)}…` : item.category,
      count: Number(item.count || 0),
      color: CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length],
    }));

  return (
    <SectionCard
      title="Top Categories"
      subtitle={`${selectedMeta.label} grouped by category`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="h-8 w-[160px] cursor-pointer rounded-md border-gray-200 bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
            {POSTING_CATEGORY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="cursor-pointer">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(selectedYear)} onValueChange={onYearChange}>
          <SelectTrigger className="h-8 w-[100px] cursor-pointer rounded-md border-gray-200 bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)} className="cursor-pointer">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            Top
          </p>
          <p className="max-w-[140px] truncate text-sm font-semibold text-gray-900">
            {topCategory?.category || "—"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-[240px] animate-pulse rounded-md bg-gray-100" />
      ) : total === 0 ? (
        <div className="grid h-[240px] place-items-center rounded-md border border-dashed border-gray-200 text-xs text-gray-400">
          No category data for {selectedYear}
        </div>
      ) : (
        <ChartContainer
          config={categoryChartConfig}
          className="h-[240px] w-full"
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
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
              tick={{ fontSize: 11, fill: "#374151" }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              cursor={{ fill: "#F9FAFB" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.name || label
                  }
                  formatter={(value) => (
                    <span className="font-semibold tabular-nums text-gray-900">
                      {formatCount(value)} records
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                offset={8}
                className="fill-gray-700"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </SectionCard>
  );
}

/* ───────────────── Mini Calendar (fixed nav + full width) ───────────────── */

function MiniCalendarCard({ events, onViewAll }) {
  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));

  const monthNumber = Number(selectedMonth);
  const yearNumber = Number(selectedYear);
  const calendarMonth = useMemo(
    () => new Date(yearNumber, monthNumber, 1),
    [yearNumber, monthNumber],
  );

  const visibleEvents = useMemo(() => {
    return events
      .map((event) => ({
        ...event,
        parsedDate: getEventDate(event),
      }))
      .filter((event) => event.parsedDate)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  }, [events]);

  const eventDates = useMemo(
    () => visibleEvents.map((event) => event.parsedDate),
    [visibleEvents],
  );

  function handleMonthChange(date) {
    setSelectedMonth(String(date.getMonth()));
    setSelectedYear(String(date.getFullYear()));
  }

  return (
    <SectionCard
      title="Calendar"
      subtitle="Scheduled alumni events"
    >
      <Calendar
        mode="single"
        selected={today}
        month={calendarMonth}
        onMonthChange={handleMonthChange}
        modifiers={{ hasEvent: eventDates }}
        modifiersClassNames={{
          hasEvent:
            "after:absolute after:bottom-0.5 after:left-1/2 after:z-20 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-[#F5DA3E]",
        }}
        showOutsideDays
        className="w-full p-0"
        classNames={{
          root: "w-full",
          months: "relative flex w-full flex-col gap-3",
          month: "flex w-full flex-col gap-3",
          nav:
            "absolute inset-x-0 top-0 flex w-full items-center justify-between px-1",
          button_previous:
            "h-6 w-6 cursor-pointer rounded-md p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900",
          button_next:
            "h-6 w-6 cursor-pointer rounded-md p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900",
          month_caption:
            "flex h-6 w-full items-center justify-center px-8 text-xs font-semibold text-gray-900",
          caption_label: "text-xs font-semibold text-gray-900",
          table: "w-full border-collapse",
          weekdays: "flex w-full",
          weekday:
            "flex-1 pb-1 text-center text-[10px] font-medium text-gray-400",
          week: "flex w-full",
          day: "relative flex-1 p-0 text-center",
          day_button:
            "pointer-events-none relative mx-auto grid h-8 w-8 min-w-8 cursor-default place-items-center rounded-md border-0 p-0 text-[11px] font-medium text-gray-700 data-[selected-single=true]:bg-[#3D398C] data-[selected-single=true]:text-white",
          today: "text-[#3D398C]",
          outside: "text-gray-300",
          disabled: "text-gray-300 opacity-50",
        }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === "left" ? (
              <ChevronLeft className="h-3.5 w-3.5" />
            ) : orientation === "right" ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : null,
        }}
      />

      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: NU_YELLOW }}
          />
          <span>Event</span>
        </div>
        <ViewAllButton onClick={onViewAll} label="View" />
      </div>
    </SectionCard>
  );
}

/* ───────────────── Recent Activity Lists ───────────────── */

function RecentActivityList({
  items = [],
  loading = false,
  emptyText = "No recent items",
  getTitle,
  getDate,
  getMeta,
  onItemClick,
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-11 animate-pulse rounded bg-gray-100" />
        <div className="h-11 animate-pulse rounded bg-gray-100" />
        <div className="h-11 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-6 text-center text-xs text-gray-400">{emptyText}</p>;
  }

  return (
    <ul className="w-full divide-y divide-gray-100">
      {items.slice(0, 5).map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={onItemClick}
            className="grid w-full cursor-pointer gap-0.5 px-4 py-2.5 text-left transition hover:bg-gray-50"
          >
            <p className="truncate text-xs font-semibold text-gray-900">
              {getTitle(item)}
            </p>
            {getMeta ? (
              <p className="truncate text-[11px] leading-4 text-gray-500">
                {getMeta(item)}
              </p>
            ) : null}
            <p className="text-[11px] leading-4 text-gray-500">
              {formatShortDate(getDate(item))}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ───────────────── Alumni helpers ───────────────── */

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

/* ───────────────── Profile Completion Card ───────────────── */

function ProfileCompletionCard({ value = 0, totalAlumni = 0, loading = false }) {
  const normalizedValue = Math.max(0, Math.min(100, Math.round(Number(value || 0))));

  return (
    <SectionCard
      title="Profile Completion"
      subtitle="Average across registered alumni"
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-8 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-2 w-full animate-pulse rounded-full bg-gray-100" />
        </div>
      ) : totalAlumni === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400">
          No alumni profiles found
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-gray-900">
              {normalizedValue}
            </p>
            <p className="text-sm font-medium text-gray-500">%</p>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#3D398C] transition-all duration-700 ease-out"
              style={{ width: `${normalizedValue}%` }}
            />
          </div>

          <p className="text-xs text-gray-500">
            Based on {formatCount(totalAlumni)} alumni records.
          </p>
        </div>
      )}
    </SectionCard>
  );
}

/* ───────────────── Recent Activity ───────────────── */

function RecentActivityCard({
  alumni = [],
  alumniLoading = false,
  posts = [],
  postsLoading = false,
  events = [],
  eventsLoading = false,
  perks = [],
  perksLoading = false,
  onViewAlumni,
  onViewPosts,
  onViewEvents,
  onViewPerks,
}) {
  const [activeTab, setActiveTab] = useState("alumni");

  const sortedAlumni = useMemo(() => {
    return [...alumni].sort(
      (a, b) => getAlumniRegisteredTime(b) - getAlumniRegisteredTime(a),
    );
  }, [alumni]);

  const sortedEvents = useMemo(() => {
    return events
      .map((event) => ({
        ...event,
        parsedDate: getEventDate(event),
      }))
      .filter((event) => event.parsedDate)
      .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
  }, [events]);

  const tabActions = {
    alumni: {
      label: "View all in Alumni",
      onClick: onViewAlumni,
    },
    posts: {
      label: "View all in Posts",
      onClick: onViewPosts,
    },
    events: {
      label: "View all in Events",
      onClick: onViewEvents,
    },
    perks: {
      label: "View all in Perks & Discounts",
      onClick: onViewPerks,
    },
  };

  const activeAction = tabActions[activeTab] || tabActions.alumni;
  const tabTriggerClass =
    "h-8 min-w-fit flex-none cursor-pointer rounded-none px-0 text-[11px] font-semibold text-gray-500 transition-colors hover:text-gray-900 data-active:text-[#3D398C] data-[state=active]:text-[#3D398C] after:bg-[#3D398C]";
  const tabContentClass =
    "mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-200";

  return (
    <SectionCard
      title="Recent Activity"
      subtitle="Latest records"
      bodyClassName="p-0"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
        <div className="border-b border-gray-200 px-4">
          <TabsList
            variant="line"
            className="flex h-9 w-full justify-start gap-3 overflow-x-auto rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-9"
          >
            <TabsTrigger value="alumni" className={tabTriggerClass}>
              Alumni
            </TabsTrigger>
            <TabsTrigger value="posts" className={tabTriggerClass}>
              Posts
            </TabsTrigger>
            <TabsTrigger value="events" className={tabTriggerClass}>
              Events
            </TabsTrigger>
            <TabsTrigger value="perks" className={tabTriggerClass}>
              Perks
            </TabsTrigger>
          </TabsList>
        </div>

        <div>
          <TabsContent value="alumni" className={tabContentClass}>
            <RecentActivityList
              items={sortedAlumni}
              loading={alumniLoading}
              emptyText="No alumni registered yet"
              getTitle={getAlumniDisplayName}
              getMeta={(alum) => `${getAlumniProgram(alum)} ${getAlumniEmail(alum)}`}
              getDate={getAlumniRegisteredDate}
              onItemClick={onViewAlumni}
            />
          </TabsContent>

          <TabsContent value="posts" className={tabContentClass}>
            <RecentActivityList
              items={posts}
              loading={postsLoading}
              emptyText="No recent posts"
              getTitle={getPostTitle}
              getMeta={getPostCategory}
              getDate={(post) => getCreatedDate(post)}
              onItemClick={onViewPosts}
            />
          </TabsContent>

          <TabsContent value="events" className={tabContentClass}>
            <RecentActivityList
              items={sortedEvents}
              loading={eventsLoading}
              emptyText="No recent events"
              getTitle={getEventTitle}
              getMeta={getEventCategory}
              getDate={(event) => event.parsedDate}
              onItemClick={onViewEvents}
            />
          </TabsContent>

          <TabsContent value="perks" className={tabContentClass}>
            <RecentActivityList
              items={perks}
              loading={perksLoading}
              emptyText="No recent perks"
              getTitle={getPerkTitle}
              getMeta={getPerkCategory}
              getDate={(perk) => getCreatedDate(perk)}
              onItemClick={onViewPerks}
            />
          </TabsContent>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={activeAction.onClick}
            className="h-auto min-h-7 max-w-full cursor-pointer justify-end whitespace-normal px-2 text-right text-[11px] font-medium leading-snug text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <span className="min-w-0">{activeAction.label}</span>
            <ArrowUpRight size={12} className="ml-1 shrink-0" />
          </Button>
        </div>
      </Tabs>
    </SectionCard>
  );
}

/* ───────────────── Alumni Registration ───────────────── */

function AlumniRegistrationCard({ counts = DASHBOARD_COUNTS_INITIAL, loading = false }) {
  const registered = Number(counts.registeredAlumni || 0);
  const transitioning = Number(counts.transitioningAlumni || 0);
  const preRegistered = Number(counts.preRegisteredAlumni || 0);
  const total = registered + transitioning + preRegistered;

  const data = [
    { name: "Registered", value: registered, color: STATUS_COLORS.registered },
    { name: "Transitioning", value: transitioning, color: STATUS_COLORS.transitioning },
    { name: "Pre-registered", value: preRegistered, color: STATUS_COLORS.preRegistered },
  ];

  return (
    <SectionCard
      title="Alumni Breakdown"
      subtitle="By registration status"
      className="h-full"
      bodyClassName="flex flex-1 flex-col p-4"
    >
      {loading ? (
        <div className="h-[160px] animate-pulse rounded-md bg-gray-100" />
      ) : total === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400">
          No alumni records yet
        </p>
      ) : (
        <div className="flex flex-1 flex-col">
          <MiniDonut
            data={data}
            loading={false}
            centerLabel="total"
            centerValue={formatCount(total)}
          />
          <div className="mt-auto border-t border-gray-100 pt-3">
            <LegendRow
              items={data.map((d) => ({
                label: d.name,
                value: d.value,
                color: d.color,
              }))}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

// Survey APIs are not part of the current Django conversion yet.
// Keep survey calls disabled to avoid repeated 404s, but allow Posts, Perks, and Events.
const DISABLED_OPTIONAL_DASHBOARD_ENDPOINT_PREFIXES = [
  "/surveys/",
  "/survey-responses/",
];

function shouldSkipDashboardEndpoint(endpoint = "") {
  return DISABLED_OPTIONAL_DASHBOARD_ENDPOINT_PREFIXES.some((prefix) =>
    endpoint.startsWith(prefix),
  );
}

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
    if (shouldSkipDashboardEndpoint(endpoint)) {
      continue;
    }

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
      fetchFirstList(["/pre-registered-alumni/"]),
      loadInternRows(),
      fetchFirstList(["/posts/"]),
      fetchFirstList(["/surveys/"]),
      fetchFirstList(["/perks-discounts/"]),
      fetchFirstList(["/calendar-events/"]),
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
  const events = await fetchFirstList(["/calendar-events/"]);
  return events.filter(isVisibleEvent).sort((a, b) => {
    const aDate = getEventDate(a);
    const bDate = getEventDate(b);
    return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
  });
}

async function loadRecentPosts() {
  const posts = await fetchFirstList(["/posts/"]);
  return posts
    .filter(isVisiblePost)
    .sort((a, b) => (getCreatedDate(b)?.getTime() || 0) - (getCreatedDate(a)?.getTime() || 0))
    .slice(0, 5);
}

async function loadRecentPerksDiscounts() {
  const perks = await fetchFirstList(["/perks-discounts/"]);
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
    posts: ["/posts/"],
    surveys: ["/surveys/"],
    perks: ["/perks-discounts/"],
    events: ["/calendar-events/"],
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

    const date = type === "events" ? getEventDate(data) : getCreatedDate(data);

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
    perks: ["/perks-discounts/"],
    events: ["/calendar-events/"],
  };

  const rows = await fetchFirstList(endpointMap[type] || []);
  const targetYear = Number(year);
  const counts = {};

  rows.forEach((data) => {
    if (type === "perks" && !isVisiblePerk(data)) return;
    if (type === "events" && !isVisibleEvent(data)) return;

    const date = type === "events" ? getEventDate(data) : getCreatedDate(data);

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


async function loadSurveyOverview(surveys = []) {
  if (!surveys.length) return SURVEY_OVERVIEW_INITIAL;

  const results = await Promise.allSettled(
    surveys.map(async (survey) => {
      const responses = await fetchFirstList([
        `/surveys/${survey.id}/responses/`,
        `/survey-responses/?survey=${survey.id}`,
      ]);

      return {
        id: survey.id,
        title: getSurveyTitle(survey),
        responseCount: responses.length,
      };
    }),
  );

  const rows = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const activeSurveyCount = surveys.length;
  const totalResponses = rows.reduce(
    (sum, row) => sum + Number(row.responseCount || 0),
    0,
  );
  const surveysWithResponses = rows.filter(
    (row) => Number(row.responseCount || 0) > 0,
  ).length;
  const topSurvey = rows.reduce(
    (top, row) =>
      Number(row.responseCount || 0) > Number(top?.responseCount || 0)
        ? row
        : top,
    rows[0] || null,
  );

  return {
    activeSurveyCount,
    surveysWithResponses,
    surveysWithoutResponses: Math.max(activeSurveyCount - surveysWithResponses, 0),
    totalResponses,
    averageResponses:
      activeSurveyCount > 0 ? Math.round(totalResponses / activeSurveyCount) : 0,
    topSurveyTitle: safeText(topSurvey?.title),
    topSurveyResponses: Number(topSurvey?.responseCount || 0),
  };
}
export default function OfficerDashboardPage() {
  const navigate = useNavigate();

  const [dashboardCounts, setDashboardCounts] = useState(DASHBOARD_COUNTS_INITIAL);
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState("");

  const [availableSurveys, setAvailableSurveys] = useState([]);
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [surveyOverview, setSurveyOverview] = useState(SURVEY_OVERVIEW_INITIAL);
  const [surveyOverviewLoading, setSurveyOverviewLoading] = useState(false);
  const [surveyOverviewError, setSurveyOverviewError] = useState("");

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
    return () => { mounted = false; };
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
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        setSurveysLoading(true);
        setSurveyOverviewError("");
        const surveys = await loadAvailableSurveys();
        if (!mounted) return;
        setAvailableSurveys(surveys);
      } catch (error) {
        console.error("Failed to load available surveys:", error);
        if (!mounted) return;
        setAvailableSurveys([]);
        setSurveyOverviewError(error?.message || "Failed to load available surveys.");
      } finally {
        if (mounted) setSurveysLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
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
        setAverageProfileCompletion({ average: 0, totalAlumni: 0 });
      } finally {
        if (mounted) setAverageProfileCompletionLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
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
    return () => { mounted = false; };
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
    return () => { mounted = false; };
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
    return () => { mounted = false; };
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
    return () => { mounted = false; };
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
    return () => { mounted = false; };
  }, [mostPostedCategoryType, mostPostedCategoryYear]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (surveysLoading) return;

      try {
        setSurveyOverviewLoading(true);
        setSurveyOverviewError("");
        const nextOverview = await loadSurveyOverview(availableSurveys);
        if (!mounted) return;
        setSurveyOverview(nextOverview);
      } catch (error) {
        console.error("Failed to load survey overview:", error);
        if (!mounted) return;
        setSurveyOverview(SURVEY_OVERVIEW_INITIAL);
        setSurveyOverviewError(error?.message || "Failed to load survey overview.");
      } finally {
        if (mounted) setSurveyOverviewLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
  }, [availableSurveys, surveysLoading]);

  return (
    <div className="space-y-5 font-[Poppins]">
      <DashboardHeader />

      {countsError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {countsError}
        </div>
      ) : null}

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Alumni"
          value={dashboardCounts.totalAlumni}
          loading={countsLoading}
          onClick={() => navigate("/alumni-officer/alumni/manage")}
        />
        <MetricCard
          label="Posts"
          value={dashboardCounts.totalPosts}
          loading={countsLoading}
          onClick={() => navigate("/alumni-officer/posts")}
        />
        <MetricCard
          label="Surveys"
          value={dashboardCounts.totalSurveys}
          loading={countsLoading}
          onClick={() => navigate("/alumni-officer/surveys")}
        />
        <MetricCard
          label="Perks"
          value={dashboardCounts.totalPerksDiscounts}
          loading={countsLoading}
          onClick={() => navigate("/alumni-officer/perks-discounts")}
        />
        <MetricCard
          label="Events"
          value={dashboardCounts.totalCalendarEvents}
          loading={countsLoading}
          onClick={() => navigate("/alumni-officer/calendar")}
        />
      </div>

      {/* Top section: 80/20 split — charts stacked on left, calendar on right */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-4">
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

        <div className="space-y-4 xl:col-span-1">
          <MiniCalendarCard
            events={calendarEvents}
            onViewAll={() => navigate("/alumni-officer/calendar")}
          />
          <RecentActivityCard
            alumni={recentRegisteredAlumni}
            alumniLoading={recentRegisteredAlumniLoading}
            posts={recentPosts}
            postsLoading={recentPostsLoading}
            events={calendarEvents}
            eventsLoading={calendarEventsLoading}
            perks={recentPerks}
            perksLoading={recentPerksLoading}
            onViewAlumni={() => navigate("/alumni-officer/alumni/manage")}
            onViewPosts={() => navigate("/alumni-officer/posts")}
            onViewEvents={() => navigate("/alumni-officer/calendar")}
            onViewPerks={() => navigate("/alumni-officer/perks-discounts")}
          />
        </div>
      </div>

      {/* Bottom section: analytics cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AlumniRegistrationCard counts={dashboardCounts} loading={countsLoading} />

        <SurveyEngagementCard
          surveys={availableSurveys}
          overview={surveyOverview}
          loadingSurveys={surveysLoading}
          loadingOverview={surveyOverviewLoading}
          error={surveyOverviewError}
        />

        <ProfileCompletionCard
          value={averageProfileCompletion.average}
          totalAlumni={averageProfileCompletion.totalAlumni}
          loading={averageProfileCompletionLoading}
        />

      </div>
    </div>
  );
}
