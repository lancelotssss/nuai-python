import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cell,
  Label as RechartsLabel,
  Pie,
  PieChart,
} from "recharts";
import {
  AlertCircle,
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  CircleHelp,
  ClipboardList,
  Filter,
  GraduationCap,
  HeartHandshake,
  PieChart as PieChartIcon,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Label as UiLabel } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BRAND_BLUE = "#3D398C";
const NOT_SUBMITTED_ORANGE = "#D97706";
const SELF_EMPLOYED_GREEN = "#059669";
const UNEMPLOYED_ORANGE = "#D97706";
const API_BASE_URL = "http://127.0.0.1:8000/api";

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

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}


const CHART_COLORS = [
  BRAND_BLUE,
  "#2563EB",
  SELF_EMPLOYED_GREEN,
  NOT_SUBMITTED_ORANGE,
  "#7C3AED",
  "#DB2777",
  "#0891B2",
  "#F5DA3E",
];

const EMPLOYMENT_STATUS_OPTIONS = [
  "Employed Full-Time",
  "Employed Part-Time / Contractual",
  "Self-employed / Entrepreneur",
  "Unemployed but held a job before",
  "Never been Employed",
];

const EMPLOYMENT_STATUS_KEYS = [
  {
    key: "employedFullTime",
    label: "Employed Full-Time",
  },
  {
    key: "employedPartTime",
    label: "Employed Part-Time / Contractual",
  },
  {
    key: "selfEmployed",
    label: "Self-employed / Entrepreneur",
  },
  {
    key: "heldJobBefore",
    label: "Unemployed but held a job before",
  },
  {
    key: "neverEmployed",
    label: "Never been Employed",
  },
];

const INDUSTRY_OPTIONS = [
  "Education",
  "Information Technology",
  "Healthcare",
  "Business / Finance",
  "Engineering / Construction",
  "Government",
  "BPO / Call Center",
  "Others",
];

const JOB_CLASSIFICATION_OPTIONS = [
  "Entry Level",
  "Rank-and-File",
  "Supervisory",
  "Middle Management",
  "Executive / Top Management",
  "Professional / Technical",
  "Others",
];

const DEGREE_ALIGNMENT_OPTIONS = [
  "Related",
  "Partially Related",
  "Not Related",
];

const TIME_TO_FIRST_JOB_OPTIONS = [
  "Less than 6 months",
  "6 months to 1 year",
  "1 year to 2 years",
  "More than 2 years",
];

const UNEMPLOYED_REASON_OPTIONS = [
  "Further studies",
  "Family responsibility",
  "Health-related reason",
  "No job opportunity available",
  "Currently applying",
  "Lack of required experience",
  "Skills mismatch",
  "Salary offer not acceptable",
  "Personal reason",
  "Others",
];

const LOOKING_FOR_WORK_OPTIONS = [
  "Actively Looking",
  "Open to Opportunities",
  "Not Currently Looking",
];

const CAREER_ASSISTANCE_OPTIONS = ["Willing", "Not Willing", "Undecided"];

const ANALYTICS_FIELD_TOOLTIPS = {
  employmentStatus: "Employment Status",
  majorLineOfBusiness: "Major Line of Business",
  degreeAlignment: "Is your job related to your degree",
  timeToFirstJob: "How long did it take to land your first job",
  jobClassification: "Current Job Classification",
  unemploymentReason: "Reason",
  lookingForWork: "Looking for work?",
  careerAssistance: "Willingness to attend career assistance",
};

const selectTriggerCls =
  "h-9 w-full bg-background border border-input rounded-md shadow-sm text-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20";

const selectItemCls = "cursor-pointer";

const selectContentCls =
  "z-[80] w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] overflow-hidden [&_[data-radix-select-viewport]]:max-h-[11rem] [&_[data-radix-select-viewport]]:overflow-y-auto [&_[data-radix-select-viewport]]:pr-1";

const selectContentWideCls =
  "z-[80] w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] overflow-hidden [&_[data-radix-select-viewport]]:max-h-[13rem] [&_[data-radix-select-viewport]]:overflow-y-auto [&_[data-radix-select-viewport]]:pr-1";

function safe(value) {
  return String(value ?? "").trim();
}

function norm(value) {
  return safe(value).toLowerCase();
}

function normalizeEmploymentStatus(value) {
  const raw = safe(value);

  if (raw === "Employed Part-Time/Contractual") {
    return "Employed Part-Time / Contractual";
  }

  return raw;
}

function normalizeDegreeAlignment(value) {
  const raw = norm(value);

  if (!raw) return "";

  if (raw.includes("partial")) return "Partially Related";
  if (raw.includes("not") || raw === "no") return "Not Related";
  if (raw.includes("related") || raw === "yes") return "Related";

  return safe(value);
}

function normalizeEntrepreneurship(value) {
  const raw = norm(value);

  if (!raw) return "";

  if (raw === "yes" || raw.includes("engaged")) return "Engaged";
  if (raw === "no" || raw.includes("not")) return "Not Engaged";

  return safe(value);
}

function normalizeLookingForWork(value) {
  const raw = norm(value);

  if (!raw) return "";

  if (raw.includes("active") || raw === "yes") return "Actively Looking";
  if (raw.includes("open")) return "Open to Opportunities";
  if (raw.includes("not") || raw === "no") return "Not Currently Looking";

  return safe(value);
}

function normalizeCareerAssistance(value) {
  const raw = norm(value);

  if (!raw) return "";

  if (raw === "yes" || raw.includes("willing")) return "Willing";
  if (raw === "no" || raw.includes("not")) return "Not Willing";
  if (raw.includes("undecided") || raw.includes("maybe")) return "Undecided";

  return safe(value);
}

function normalizeAlumniRow(row = {}) {
  const firstName = row.first_name || row.firstName || "";
  const middleName = row.middle_name || row.middleName || "";
  const lastName = row.last_name || row.lastName || "";

  const course =
    row.course ||
    row.course_code ||
    row.courseCode ||
    row.program_code ||
    row.programCode ||
    row.alumniInformation?.courseGraduated ||
    row.alumniInformation?.course ||
    "";

  const schoolProgram =
    row.school_program ||
    row.school_program_code ||
    row.schoolProgram ||
    row.schoolProgramCode ||
    row.alumniInformation?.schoolProgram ||
    row.alumniInformation?.schoolProgramCode ||
    "";

  const graduationPeriod =
    row.graduation_period ||
    row.graduationPeriod ||
    row.graduation_year ||
    row.graduationYear ||
    row.year_graduated ||
    row.yearGraduated ||
    row.alumniInformation?.graduationPeriod ||
    "";

  return {
    ...row,
    id: row.id,
    role: row.role || "Alumni",
    personalInformation: {
      ...(row.personalInformation || {}),
      firstName: row.personalInformation?.firstName || firstName,
      middleName: row.personalInformation?.middleName || middleName,
      lastName: row.personalInformation?.lastName || lastName,
      fullName:
        row.personalInformation?.fullName ||
        row.full_name ||
        row.fullName ||
        row.name ||
        [firstName, middleName, lastName].map(safe).filter(Boolean).join(" "),
    },
    contactInformation: {
      ...(row.contactInformation || {}),
      email: row.contactInformation?.email || row.email || "",
      personalEmail: row.contactInformation?.personalEmail || row.email || "",
      contactNumber:
        row.contactInformation?.contactNumber ||
        row.contact_number ||
        row.contactNumber ||
        "",
    },
    alumniInformation: {
      ...(row.alumniInformation || {}),
      studentId:
        row.alumniInformation?.studentId || row.student_id || row.studentId || "",
      courseGraduated: course,
      course,
      schoolProgram,
      schoolProgramCode: schoolProgram,
      graduationPeriod,
      yearGraduated: graduationPeriod,
    },
    employmentData:
      row.employmentData ||
      row.employment_data ||
      row.tracerStudy?.employmentData ||
      {},
    systemAudit: {
      ...(row.systemAudit || {}),
      createdAt: row.systemAudit?.createdAt || row.created_at || row.createdAt || "",
      updatedAt: row.systemAudit?.updatedAt || row.updated_at || row.updatedAt || "",
    },
  };
}

function getEmploymentData(user = {}) {
  return (
    user?.employmentData ||
    user?.tracerStudy?.employmentData ||
    user?.personalization?.employmentData ||
    {}
  );
}

function getEmploymentStatus(user = {}) {
  const data = getEmploymentData(user);

  return normalizeEmploymentStatus(
    data?.employmentStatus ||
      data?.currentEmploymentStatus ||
      data?.status ||
      data?.currentStatus,
  );
}

function hasEmploymentData(user = {}) {
  const data = getEmploymentData(user);
  const status = getEmploymentStatus(user);

  return Boolean(Object.keys(data || {}).length > 0 || status);
}

function getAlumniInfo(user = {}) {
  return user?.alumniInformation || {};
}

function getCourse(user = {}) {
  const ai = getAlumniInfo(user);

  return safe(ai?.courseGraduated || ai?.course || ai?.courseCode);
}

function getSchool(user = {}) {
  const ai = getAlumniInfo(user);

  return safe(ai?.schoolProgram || ai?.schoolProgramCode);
}

function getGraduation(user = {}) {
  const ai = getAlumniInfo(user);

  return safe(ai?.graduationPeriod || ai?.yearGraduated || ai?.batchGraduated);
}

function useAnimatedNumber(value, duration = 750) {
  const numericValue = Number(value || 0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animationFrame;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = numericValue;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        Math.round(startValue + (endValue - startValue) * easedProgress),
      );

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [numericValue, duration]);

  return displayValue;
}

function AnimatedNumber({ value, duration = 750 }) {
  const displayValue = useAnimatedNumber(value, duration);

  return <>{displayValue}</>;
}

function withChartFills(rows) {
  return rows.map((row, index) => ({
    ...row,
    color: row.color || CHART_COLORS[index % CHART_COLORS.length],
    fill: `var(--color-${row.key})`,
  }));
}

function buildChartConfig(rows) {
  return rows.reduce((config, row, index) => {
    config[row.key] = {
      label: row.label,
      color: row.color || CHART_COLORS[index % CHART_COLORS.length],
    };

    return config;
  }, {});
}

function toKey(label) {
  return String(label || "")
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^./, (chr) => chr.toLowerCase());
}

function buildCountData(sourceRows, optionLabels, valueGetter) {
  const counts = new Map(optionLabels.map((label) => [label, 0]));

  sourceRows.forEach((row) => {
    const value = safe(valueGetter(row));

    if (!value || value === "—") return;

    if (counts.has(value)) {
      counts.set(value, counts.get(value) + 1);
    } else {
      counts.set("Others", (counts.get("Others") || 0) + 1);
    }
  });

  return withChartFills(
    Array.from(counts.entries()).map(([label, value]) => ({
      key: toKey(label),
      label,
      value,
    })),
  );
}

function buildMultiCountData(sourceRows, optionLabels, valueGetter) {
  const counts = new Map(optionLabels.map((label) => [label, 0]));

  sourceRows.forEach((row) => {
    const value = valueGetter(row);

    if (Array.isArray(value)) {
      value.forEach((item) => {
        const clean = safe(item);

        if (!clean) return;

        if (counts.has(clean)) {
          counts.set(clean, counts.get(clean) + 1);
        } else {
          counts.set("Others", (counts.get("Others") || 0) + 1);
        }
      });

      return;
    }

    const clean = safe(value);

    if (!clean) return;

    if (counts.has(clean)) {
      counts.set(clean, counts.get(clean) + 1);
    } else {
      counts.set("Others", (counts.get("Others") || 0) + 1);
    }
  });

  return withChartFills(
    Array.from(counts.entries()).map(([label, value]) => ({
      key: toKey(label),
      label,
      value,
    })),
  );
}

function SectionHeader({ title, description, separated = false }) {
  return (
    <div className={separated ? "border-t border-border pt-5" : ""}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SubmissionDonutChart({ submitted, notSubmitted, total }) {
  const data = useMemo(() => {
    return [
      {
        key: "submitted",
        label: "Submitted",
        value: Number(submitted || 0),
        color: BRAND_BLUE,
        fill: "var(--color-submitted)",
      },
      {
        key: "notSubmitted",
        label: "Not submitted",
        value: Number(notSubmitted || 0),
        color: NOT_SUBMITTED_ORANGE,
        fill: "var(--color-notSubmitted)",
      },
    ];
  }, [submitted, notSubmitted]);

  const config = useMemo(
    () => ({
      submitted: {
        label: "Submitted",
        color: BRAND_BLUE,
      },
      notSubmitted: {
        label: "Not submitted",
        color: NOT_SUBMITTED_ORANGE,
      },
    }),
    [],
  );

  if (!Number(total || 0)) {
    return (
      <div className="flex h-[124px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/70 text-center">
        <ClipboardList className="h-5 w-5 text-[#3D398C]" />
        <p className="mt-2 text-xs font-semibold text-foreground">
          No alumni records
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Submission ratio will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <ChartContainer config={config} className="mx-auto h-[124px] w-[150px]">
        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="key" />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            innerRadius={30}
            outerRadius={46}
            paddingAngle={3}
            strokeWidth={4}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
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
                        className="fill-foreground text-base font-bold"
                      >
                        <AnimatedNumber value={total} />
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 15}
                        className="fill-muted-foreground text-[9px] font-medium"
                      >
                        Total
                      </tspan>
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

function SubmissionLegend({ submitted, notSubmitted }) {
  const items = [
    {
      label: "Submitted",
      value: submitted,
      color: BRAND_BLUE,
    },
    {
      label: "Not submitted",
      value: notSubmitted,
      color: NOT_SUBMITTED_ORANGE,
    },
  ];

  return (
    <div className="mt-2 space-y-1.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2 text-[11px]"
        >
          <span
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ backgroundColor: item.color }}
          />
          <span className="truncate text-muted-foreground">{item.label}</span>
          <span className="font-semibold tabular-nums text-foreground">
            <AnimatedNumber value={item.value} />
          </span>
        </div>
      ))}
    </div>
  );
}

function PrimarySubmissionCard({ submitted, notSubmitted, total }) {
  return (
    <Card className="h-full overflow-hidden border-border/70 bg-card py-0 shadow-sm xl:col-span-6">
      <CardContent className="h-full p-0">
        <div className="grid h-full gap-0 lg:grid-cols-[70%_30%]">
          <div className="flex min-h-[188px] flex-col px-4 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground">
                  Employment Data Submission
                </p>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                  Total Employment Data that has been submitted by alumni.
                </p>
              </div>

              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#3D398C]/15 bg-[#3D398C]/5 text-[#3D398C]">
                <ClipboardList size={17} />
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-5 pt-4">
              <div className="min-w-0 pr-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Submitted
                </p>
                <p className="mt-1 text-3xl font-bold leading-none text-[#3D398C]">
                  <AnimatedNumber value={submitted} />
                </p>
                <p className="mb-7 mt-1 text-xs leading-relaxed text-muted-foreground">
                  Total alumni that submitted
                </p>
              </div>

              <div className="min-w-0 border-l border-border pl-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Not Submitted
                </p>
                <p className="mt-1 text-3xl font-bold leading-none text-[#D97706]">
                  <AnimatedNumber value={notSubmitted} />
                </p>
                <p className="mb-7 mt-1 text-xs leading-relaxed text-muted-foreground">
                  Pending employment data
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-h-[188px] flex-col border-t border-border bg-[#F1F3F8] px-4 py-3 lg:border-l lg:border-t-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Employment Submission Ratio
            </p>

            <div className="mt-auto">
              <SubmissionDonutChart
                submitted={submitted}
                notSubmitted={notSubmitted}
                total={total}
              />

              <SubmissionLegend
                submitted={submitted}
                notSubmitted={notSubmitted}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OutcomeDonutChart({ employedTotal, selfEmployed, unemployedTotal }) {
  const total =
    Number(employedTotal || 0) +
    Number(selfEmployed || 0) +
    Number(unemployedTotal || 0);

  const data = useMemo(() => {
    return [
      {
        key: "employed",
        label: "Employed",
        value: Number(employedTotal || 0),
        color: BRAND_BLUE,
        fill: "var(--color-employed)",
      },
      {
        key: "selfEmployed",
        label: "Self-employed",
        value: Number(selfEmployed || 0),
        color: SELF_EMPLOYED_GREEN,
        fill: "var(--color-selfEmployed)",
      },
      {
        key: "unemployed",
        label: "Unemployed",
        value: Number(unemployedTotal || 0),
        color: UNEMPLOYED_ORANGE,
        fill: "var(--color-unemployed)",
      },
    ];
  }, [employedTotal, selfEmployed, unemployedTotal]);

  const config = useMemo(
    () => ({
      employed: {
        label: "Employed",
        color: BRAND_BLUE,
      },
      selfEmployed: {
        label: "Self-employed",
        color: SELF_EMPLOYED_GREEN,
      },
      unemployed: {
        label: "Unemployed",
        color: UNEMPLOYED_ORANGE,
      },
    }),
    [],
  );

  if (!total) {
    return (
      <div className="flex h-[124px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/70 text-center">
        <BriefcaseBusiness className="h-5 w-5 text-[#3D398C]" />
        <p className="mt-2 text-xs font-semibold text-foreground">
          No outcome data
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Employment ratio will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <ChartContainer config={config} className="mx-auto h-[124px] w-[150px]">
        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="key" />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            innerRadius={30}
            outerRadius={46}
            paddingAngle={3}
            strokeWidth={4}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
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
                        className="fill-foreground text-base font-bold"
                      >
                        <AnimatedNumber value={total} />
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 15}
                        className="fill-muted-foreground text-[9px] font-medium"
                      >
                        Total
                      </tspan>
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

function OutcomeLegend({ employedTotal, selfEmployed, unemployedTotal }) {
  const items = [
    {
      label: "Employed",
      value: employedTotal,
      color: BRAND_BLUE,
    },
    {
      label: "Self-employed",
      value: selfEmployed,
      color: SELF_EMPLOYED_GREEN,
    },
    {
      label: "Unemployed",
      value: unemployedTotal,
      color: UNEMPLOYED_ORANGE,
    },
  ];

  return (
    <div className="mt-2 space-y-1.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2 text-[11px]"
        >
          <span
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ backgroundColor: item.color }}
          />
          <span className="truncate text-muted-foreground">{item.label}</span>
          <span className="font-semibold tabular-nums text-foreground">
            <AnimatedNumber value={item.value} />
          </span>
        </div>
      ))}
    </div>
  );
}

function OutcomeMiniMetric({ title, value, helper, accent }) {
  return (
    <div className="min-w-0">
      <p className="min-w-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>

      <p
        className="mt-2 text-3xl font-bold leading-none"
        style={{ color: accent }}
      >
        <AnimatedNumber value={value} />
      </p>
      <p className="mb-7 mt-1 text-xs leading-relaxed text-muted-foreground">
        {helper}
      </p>
    </div>
  );
}

function EmploymentOutcomeCard({
  employedTotal,
  selfEmployed,
  unemployedTotal,
}) {
  return (
    <Card className="h-full overflow-hidden border-border/70 bg-card py-0 shadow-sm xl:col-span-6">
      <CardContent className="h-full p-0">
        <div className="grid h-full gap-0 lg:grid-cols-[70%_30%]">
          <div className="flex min-h-[188px] flex-col px-4 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground">
                  Employment Outcome Summary
                </p>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                  Overview of alumni employment outcomes sorted for AAO review.
                </p>
              </div>

              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#3D398C]/15 bg-[#3D398C]/5 text-[#3D398C]">
                <BriefcaseBusiness size={17} />
              </div>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-4 pt-4">
              <OutcomeMiniMetric
                title="Employed"
                value={employedTotal}
                helper="Full-time and part-time."
                accent={BRAND_BLUE}
              />

              <OutcomeMiniMetric
                title="Self-employed"
                value={selfEmployed}
                helper="Business or freelance."
                accent={SELF_EMPLOYED_GREEN}
              />

              <OutcomeMiniMetric
                title="Unemployed"
                value={unemployedTotal}
                helper="Not currently employed."
                accent={UNEMPLOYED_ORANGE}
              />
            </div>
          </div>

          <div className="flex min-h-[188px] flex-col border-t border-border bg-[#F1F3F8] px-4 py-3 lg:border-l lg:border-t-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Employment Outcome Ratio
            </p>

            <div className="mt-auto">
              <OutcomeDonutChart
                employedTotal={employedTotal}
                selfEmployed={selfEmployed}
                unemployedTotal={unemployedTotal}
              />

              <OutcomeLegend
                employedTotal={employedTotal}
                selfEmployed={selfEmployed}
                unemployedTotal={unemployedTotal}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmploymentAnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <div className="flex flex-wrap items-end gap-2.5">
          {["school", "course", "graduation", "employment"].map((item) => (
            <div
              key={item}
              className="min-w-[130px] flex-1 space-y-1.5 last:max-w-[220px]"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16 opacity-0" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        {[0, 1].map((item) => (
          <Card
            key={item}
            className="overflow-hidden border-border/70 bg-card py-0 shadow-sm xl:col-span-6"
          >
            <CardContent className="grid gap-0 p-0 lg:grid-cols-[70%_30%]">
              <div className="min-h-[188px] space-y-8 px-4 pb-3 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72 max-w-full" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-14" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="space-y-2 border-l border-border pl-5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-14" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </div>

              <div className="min-h-[188px] space-y-3 border-t border-border bg-[#F1F3F8] px-4 py-3 lg:border-l lg:border-t-0">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="mx-auto h-[104px] w-[104px] rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FieldInfoTooltip({ content }) {
  if (!content) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[#3D398C]/10 hover:text-[#3D398C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D398C]/30"
          aria-label="View source field"
        >
          <CircleHelp size={13} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" sideOffset={6}>
        <span className="leading-relaxed">{content}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function AnalyticsCard({ icon: Icon, title, description, tooltip, children }) {
  return (
    <Card className="min-w-0 border-border/70 bg-card shadow-sm">
      <CardHeader className="space-y-0 p-3 pb-1.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#3D398C]/5 text-[#3D398C]">
            <Icon size={15} />
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-1.5">
              <CardTitle className="min-w-0 text-[13px] font-semibold">
                {title}
              </CardTitle>
              <FieldInfoTooltip content={tooltip} />
            </div>
            <CardDescription className="mt-0.5 text-[11px] leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-2">{children}</CardContent>
    </Card>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#3D398C]/10 text-[#3D398C]">
        <BarChart3 size={16} />
      </div>
      <p className="mt-2 text-xs font-semibold text-foreground">
        No analytics data yet
      </p>
      <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
        This chart will populate once alumni submit Employment Data.
      </p>
    </div>
  );
}

function ChartMiniLegend({ data }) {
  const visibleData = data.filter((item) => Number(item.value || 0) > 0);

  if (!visibleData.length) return null;

  return (
    <div className="mt-3 grid grid-cols-1 gap-1.5">
      {visibleData.map((item) => (
        <div
          key={item.key}
          className="grid min-w-0 grid-cols-[9px_minmax(0,1fr)_auto] items-start gap-2 text-[10px]"
          title={`${item.label}: ${item.value}`}
        >
          <span
            className="mt-0.5 h-2.5 w-2.5 rounded-[3px]"
            style={{ backgroundColor: item.color }}
          />
          <span className="min-w-0 whitespace-normal break-words leading-snug text-muted-foreground">
            {item.label}
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutChartPreview({ data, config, centerLabel = "Total" }) {
  const visibleData = useMemo(
    () => data.filter((row) => Number(row.value || 0) > 0),
    [data],
  );

  const total = visibleData.reduce(
    (sum, row) => sum + Number(row.value || 0),
    0,
  );

  if (!total) return <EmptyChartState />;

  return (
    <div className="flex min-h-[230px] flex-col">
      <ChartContainer
        config={config}
        className="mx-auto h-[145px] w-full max-w-[190px]"
      >
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="key" />}
          />

          <Pie
            data={visibleData}
            dataKey="value"
            nameKey="key"
            innerRadius={44}
            outerRadius={63}
            paddingAngle={2}
            strokeWidth={4}
          >
            {visibleData.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
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
                        className="fill-foreground text-xl font-bold"
                      >
                        {total.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 18}
                        className="fill-muted-foreground text-[10px] font-medium"
                      >
                        {centerLabel}
                      </tspan>
                    </text>
                  );
                }

                return null;
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ChartMiniLegend data={visibleData} />
    </div>
  );
}

export default function OfficerEmploymentAnalytics() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [schoolFilter, setSchoolFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [graduationFilter, setGraduationFilter] = useState("all");
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadAlumni() {
      setLoading(true);
      setErr("");

      try {
        const data = await apiRequest("/alumni/");

        if (cancelled) return;

        const list = normalizeListResponse(data)
          .map(normalizeAlumniRow)
          .filter((item) => norm(item?.role || "Alumni") === "alumni");

        setRows(list);
      } catch (error) {
        if (cancelled) return;

        setErr(error?.message || "Failed to load employment analytics.");
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAlumni();

    return () => {
      cancelled = true;
    };
  }, []);

  const schoolOptions = useMemo(() => {
    return Array.from(new Set(rows.map(getSchool).filter(Boolean))).sort();
  }, [rows]);

  const courseOptions = useMemo(() => {
    return Array.from(new Set(rows.map(getCourse).filter(Boolean))).sort();
  }, [rows]);

  const graduationOptions = useMemo(() => {
    return Array.from(new Set(rows.map(getGraduation).filter(Boolean))).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const employmentStatus = getEmploymentStatus(row);

      if (schoolFilter !== "all" && getSchool(row) !== schoolFilter) {
        return false;
      }

      if (courseFilter !== "all" && getCourse(row) !== courseFilter) {
        return false;
      }

      if (
        graduationFilter !== "all" &&
        getGraduation(row) !== graduationFilter
      ) {
        return false;
      }

      if (
        employmentStatusFilter !== "all" &&
        employmentStatus !== employmentStatusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    schoolFilter,
    courseFilter,
    graduationFilter,
    employmentStatusFilter,
  ]);

  const analytics = useMemo(() => {
    const total = filteredRows.length;

    const submittedRows = filteredRows.filter(hasEmploymentData);
    const notSubmitted = Math.max(total - submittedRows.length, 0);

    const employedFullTime = filteredRows.filter(
      (row) => getEmploymentStatus(row) === "Employed Full-Time",
    ).length;

    const employedPartTime = filteredRows.filter(
      (row) => getEmploymentStatus(row) === "Employed Part-Time / Contractual",
    ).length;

    const selfEmployed = filteredRows.filter((row) => {
      const data = getEmploymentData(row);
      const status = getEmploymentStatus(row);
      const engaged = normalizeEntrepreneurship(
        data?.engagedInEntrepreneurship,
      );

      return status === "Self-employed / Entrepreneur" || engaged === "Engaged";
    }).length;

    const unemployedHeldJobBefore = filteredRows.filter(
      (row) => getEmploymentStatus(row) === "Unemployed but held a job before",
    ).length;

    const neverEmployed = filteredRows.filter(
      (row) => getEmploymentStatus(row) === "Never been Employed",
    ).length;

    const employedTotal = employedFullTime + employedPartTime;
    const unemployedTotal = unemployedHeldJobBefore + neverEmployed;

    return {
      total,
      submitted: submittedRows.length,
      notSubmitted,
      employedTotal,
      employedFullTime,
      employedPartTime,
      selfEmployed,
      unemployedTotal,
      unemployedHeldJobBefore,
      neverEmployed,
    };
  }, [filteredRows]);

  const employmentStatusData = useMemo(() => {
    const counts = new Map(
      EMPLOYMENT_STATUS_KEYS.map((item) => [item.label, 0]),
    );

    filteredRows.forEach((row) => {
      const status = getEmploymentStatus(row);

      if (counts.has(status)) {
        counts.set(status, counts.get(status) + 1);
      }
    });

    return withChartFills(
      EMPLOYMENT_STATUS_KEYS.map((item) => ({
        ...item,
        value: counts.get(item.label) || 0,
      })),
    );
  }, [filteredRows]);

  const employmentStatusConfig = useMemo(
    () => buildChartConfig(employmentStatusData),
    [employmentStatusData],
  );

  const majorLineData = useMemo(
    () =>
      buildCountData(filteredRows, INDUSTRY_OPTIONS, (row) => {
        const data = getEmploymentData(row);

        return data?.industry || data?.majorLineOfBusiness;
      }),
    [filteredRows],
  );

  const majorLineConfig = useMemo(
    () => buildChartConfig(majorLineData),
    [majorLineData],
  );

  const degreeAlignmentData = useMemo(
    () =>
      buildCountData(filteredRows, DEGREE_ALIGNMENT_OPTIONS, (row) => {
        const data = getEmploymentData(row);

        return normalizeDegreeAlignment(
          data?.degreeRelated ||
            data?.jobRelatedToDegree ||
            data?.lastJobDegreeRelated,
        );
      }),
    [filteredRows],
  );

  const degreeAlignmentConfig = useMemo(
    () => buildChartConfig(degreeAlignmentData),
    [degreeAlignmentData],
  );

  const timeToFirstJobData = useMemo(
    () =>
      buildCountData(filteredRows, TIME_TO_FIRST_JOB_OPTIONS, (row) => {
        const data = getEmploymentData(row);

        return data?.timeToFirstJob;
      }),
    [filteredRows],
  );

  const timeToFirstJobConfig = useMemo(
    () => buildChartConfig(timeToFirstJobData),
    [timeToFirstJobData],
  );

  const jobClassificationData = useMemo(
    () =>
      buildCountData(filteredRows, JOB_CLASSIFICATION_OPTIONS, (row) => {
        const data = getEmploymentData(row);

        return data?.jobClassification;
      }),
    [filteredRows],
  );

  const jobClassificationConfig = useMemo(
    () => buildChartConfig(jobClassificationData),
    [jobClassificationData],
  );

  const unemployedReasonData = useMemo(
    () =>
      buildMultiCountData(filteredRows, UNEMPLOYED_REASON_OPTIONS, (row) => {
        const data = getEmploymentData(row);

        return (
          data?.unemployedReasons ||
          data?.unemploymentReasons ||
          data?.neverEmployedReasons ||
          data?.reason ||
          data?.reasonForUnemployment
        );
      }),
    [filteredRows],
  );

  const unemployedReasonConfig = useMemo(
    () => buildChartConfig(unemployedReasonData),
    [unemployedReasonData],
  );

  const lookingForWorkData = useMemo(
    () =>
      buildCountData(filteredRows, LOOKING_FOR_WORK_OPTIONS, (row) => {
        const data = getEmploymentData(row);

        return normalizeLookingForWork(data?.currentlyLooking);
      }),
    [filteredRows],
  );

  const lookingForWorkConfig = useMemo(
    () => buildChartConfig(lookingForWorkData),
    [lookingForWorkData],
  );

  const careerAssistanceData = useMemo(
    () =>
      buildCountData(filteredRows, CAREER_ASSISTANCE_OPTIONS, (row) => {
        const data = getEmploymentData(row);

        return normalizeCareerAssistance(data?.willingCareerAssistance);
      }),
    [filteredRows],
  );

  const careerAssistanceConfig = useMemo(
    () => buildChartConfig(careerAssistanceData),
    [careerAssistanceData],
  );

  function clearFilters() {
    setSchoolFilter("all");
    setCourseFilter("all");
    setGraduationFilter("all");
    setEmploymentStatusFilter("all");
  }

  const hasActiveFilters =
    schoolFilter !== "all" ||
    courseFilter !== "all" ||
    graduationFilter !== "all" ||
    employmentStatusFilter !== "all";

  const activeFilterCount = [
    schoolFilter !== "all",
    courseFilter !== "all",
    graduationFilter !== "all",
    employmentStatusFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="space-y-5 font-['Poppins']">
      {err ? (
        <div className="animate-in fade-in-50 slide-in-from-top-1 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive duration-200">
          {err}
        </div>
      ) : null}

      {loading ? (
        <EmploymentAnalyticsSkeleton />
      ) : (
        <>
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Filters
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Narrow analytics by school, course, graduation batch, or
                  employment status.
                </p>
              </div>

              {hasActiveFilters ? (
                <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                  {activeFilterCount} Active
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-2.5">
              <div className="max-w-[170px] min-w-[130px] flex-1">
                <UiLabel className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  School
                </UiLabel>
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={0}
                    avoidCollisions={false}
                    className={selectContentCls}
                  >
                    <SelectItem value="all" className={selectItemCls}>
                      All Schools
                    </SelectItem>
                    {schoolOptions.map((school) => (
                      <SelectItem
                        key={school}
                        value={school}
                        className={selectItemCls}
                      >
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-w-[190px] min-w-[140px] flex-1">
                <UiLabel className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Course
                </UiLabel>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={0}
                    avoidCollisions={false}
                    className={selectContentWideCls}
                  >
                    <SelectItem value="all" className={selectItemCls}>
                      All Courses
                    </SelectItem>
                    {courseOptions.map((course) => (
                      <SelectItem
                        key={course}
                        value={course}
                        className={selectItemCls}
                      >
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-w-[170px] min-w-[130px] flex-1">
                <UiLabel className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Graduation
                </UiLabel>
                <Select
                  value={graduationFilter}
                  onValueChange={setGraduationFilter}
                >
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="All Batches" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={0}
                    avoidCollisions={false}
                    className={selectContentCls}
                  >
                    <SelectItem value="all" className={selectItemCls}>
                      All Batches
                    </SelectItem>
                    {graduationOptions.map((batch) => (
                      <SelectItem
                        key={batch}
                        value={batch}
                        className={selectItemCls}
                      >
                        {batch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-w-[220px] min-w-[170px] flex-1">
                <UiLabel className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Employment Status
                </UiLabel>
                <Select
                  value={employmentStatusFilter}
                  onValueChange={setEmploymentStatusFilter}
                >
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="All Employment" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={0}
                    avoidCollisions={false}
                    className={selectContentWideCls}
                  >
                    <SelectItem value="all" className={selectItemCls}>
                      All Employment
                    </SelectItem>
                    {EMPLOYMENT_STATUS_OPTIONS.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className={selectItemCls}
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div>
                  <UiLabel className="pointer-events-none mb-1 block select-none text-[11px] font-medium text-transparent">
                    &nbsp;
                  </UiLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 font-medium"
                    onClick={() => navigate("/alumni-officer/alumni/manage/analytics/advanced")}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Advanced Export
                  </Button>
                </div>
              </div>

              <div className="flex items-end">
                <div>
                  <UiLabel className="pointer-events-none mb-1 block select-none text-[11px] font-medium text-transparent">
                    &nbsp;
                  </UiLabel>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasActiveFilters}
                    className="h-9 gap-1.5 font-medium"
                    onClick={clearFilters}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Clear Filters
                    {activeFilterCount > 0 ? (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-4 px-1.5 py-0 text-[10px]"
                      >
                        {activeFilterCount}
                      </Badge>
                    ) : null}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-12 xl:items-stretch">
            <PrimarySubmissionCard
              submitted={analytics.submitted}
              notSubmitted={analytics.notSubmitted}
              total={analytics.total}
            />

            <EmploymentOutcomeCard
              employedTotal={analytics.employedTotal}
              selfEmployed={analytics.selfEmployed}
              unemployedTotal={analytics.unemployedTotal}
            />
          </div>

          <section className="space-y-3">
            <SectionHeader
              separated
              title="Primary Employment Insights"
              description="Focused charts for the most important alumni employment indicators."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AnalyticsCard
                icon={PieChartIcon}
                title="Employment Status"
                description="Distribution of alumni employment status."
                tooltip={ANALYTICS_FIELD_TOOLTIPS.employmentStatus}
              >
                <DonutChartPreview
                  data={employmentStatusData}
                  config={employmentStatusConfig}
                  centerLabel="Status"
                />
              </AnalyticsCard>

              <AnalyticsCard
                icon={BarChart3}
                title="Major Line of Business"
                description="Industries where alumni are connected."
                tooltip={ANALYTICS_FIELD_TOOLTIPS.majorLineOfBusiness}
              >
                <DonutChartPreview
                  data={majorLineData}
                  config={majorLineConfig}
                  centerLabel="Industry"
                />
              </AnalyticsCard>

              <AnalyticsCard
                icon={GraduationCap}
                title="Degree Alignment"
                description="Whether work is related to completed degree."
                tooltip={ANALYTICS_FIELD_TOOLTIPS.degreeAlignment}
              >
                <DonutChartPreview
                  data={degreeAlignmentData}
                  config={degreeAlignmentConfig}
                  centerLabel="Alignment"
                />
              </AnalyticsCard>

              <AnalyticsCard
                icon={CalendarRange}
                title="Time to First Job"
                description="How long alumni took to land their first job."
                tooltip={ANALYTICS_FIELD_TOOLTIPS.timeToFirstJob}
              >
                <DonutChartPreview
                  data={timeToFirstJobData}
                  config={timeToFirstJobConfig}
                  centerLabel="First Job"
                />
              </AnalyticsCard>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Additional Employment Details"
              description="Secondary analytics for deeper employment review."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AnalyticsCard
                icon={BriefcaseBusiness}
                title="Current Job Classification"
                description="Position level or work classification."
                tooltip={ANALYTICS_FIELD_TOOLTIPS.jobClassification}
              >
                <DonutChartPreview
                  data={jobClassificationData}
                  config={jobClassificationConfig}
                  centerLabel="Class"
                />
              </AnalyticsCard>

              <AnalyticsCard
                icon={AlertCircle}
                title="Reason for Unemployment"
                description="Reasons selected by unemployed alumni."
                tooltip={ANALYTICS_FIELD_TOOLTIPS.unemploymentReason}
              >
                <DonutChartPreview
                  data={unemployedReasonData}
                  config={unemployedReasonConfig}
                  centerLabel="Reason"
                />
              </AnalyticsCard>

              <AnalyticsCard
                icon={BriefcaseBusiness}
                title="Looking for Work"
                description="Current work-seeking intent."
                tooltip={ANALYTICS_FIELD_TOOLTIPS.lookingForWork}
              >
                <DonutChartPreview
                  data={lookingForWorkData}
                  config={lookingForWorkConfig}
                  centerLabel="Work"
                />
              </AnalyticsCard>

              <AnalyticsCard
                icon={HeartHandshake}
                title="Career Assistance"
                description="Willingness to attend career assistance."
                tooltip={ANALYTICS_FIELD_TOOLTIPS.careerAssistance}
              >
                <DonutChartPreview
                  data={careerAssistanceData}
                  config={careerAssistanceConfig}
                  centerLabel="Support"
                />
              </AnalyticsCard>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
