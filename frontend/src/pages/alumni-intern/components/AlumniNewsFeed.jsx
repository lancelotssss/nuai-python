// src/pages/alumni-intern/components/AlumniNewsFeed.jsx

import { useEffect, useMemo, useRef, useState } from "react";

/* ── Lucide icons ─────────────────────────────────────────── */
import {
  Link2,
  ChevronLeft,
  ChevronRight,
  X,
  Newspaper,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  CalendarDays,
  Clock3,
  MapPin,
  UserCircle2,
  Bookmark,
  Loader2,
} from "lucide-react";

/* ── ShadCN UI ────────────────────────────────────────────── */
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ── Perks preview ────────────────────────────────────────── */
import PerksPostPreview from "@/pages/alumni-officer/components/manage-perks-discounts/perk-components/PerksPostPreview";

/* ================= CONSTANTS ================= */
const CONTENT_TRUNCATE_LENGTH = 280;
const BRAND_BLUE = "#3D398C";
const FEED_LIMIT = 25;

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

const withApiBase = (path) => `${API_BASE}${path}`;

const NEWS_ENDPOINTS = [
  withApiBase("/api/posts/"),
  withApiBase("/api/posts"),
  withApiBase("/api/newsPosts/"),
  withApiBase("/api/newsPosts"),
  withApiBase("/api/news-posts/"),
  withApiBase("/api/news-posts"),
  withApiBase("/api/news_posts/"),
  withApiBase("/api/news_posts"),
];

const PERKS_ENDPOINTS = [
  withApiBase("/api/perks-discounts/"),
  withApiBase("/api/perks-discounts"),
  withApiBase("/api/perksDiscounts/"),
  withApiBase("/api/perksDiscounts"),
  withApiBase("/api/perks/"),
  withApiBase("/api/perks"),
];

const EVENTS_ENDPOINTS = [
  withApiBase("/api/calendar-events/"),
  withApiBase("/api/calendar-events"),
  withApiBase("/api/calendarEvents/"),
  withApiBase("/api/calendarEvents"),
  withApiBase("/api/events/"),
  withApiBase("/api/events"),
];

/* ================= HELPERS ================= */

function safe(v) {
  return String(v ?? "").trim();
}

function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(value));
}

function displayNameCandidate(value) {
  const clean = safe(value);
  if (!clean) return "";
  if (isEmailLike(clean)) return "";
  return clean;
}

function joinName(parts = []) {
  return parts.map(safe).filter(Boolean).join(" ").trim();
}

function getUserDisplayName(data = {}) {
  const pi = data?.personalInformation || data?.personal_information || {};

  return (
    displayNameCandidate(pi?.fullName || pi?.full_name) ||
    displayNameCandidate(
      joinName([
        pi?.firstName || pi?.first_name,
        pi?.middleName || pi?.middle_name,
        pi?.lastName || pi?.last_name,
      ]),
    ) ||
    displayNameCandidate(data?.fullName || data?.full_name) ||
    displayNameCandidate(data?.displayName || data?.display_name) ||
    displayNameCandidate(data?.name) ||
    ""
  );
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

function normalizeStatus(status) {
  const value = safe(status).toLowerCase();
  if (
    [
      "active",
      "open",
      "published",
      "closed",
      "draft",
      "posted",
      "approved",
      "visible",
    ].includes(value)
  ) {
    return value;
  }

  if (!value) return "active";

  return value;
}

function isVisibleNewsStatus(status) {
  const value = safe(status).toLowerCase();

  if (!value) return true;

  return [
    "active",
    "open",
    "published",
    "posted",
    "approved",
    "visible",
  ].includes(value);
}

function normalizeEventStatus(status) {
  const value = safe(status).toLowerCase();

  if (
    [
      "published",
      "active",
      "closed",
      "draft",
      "completed",
      "cancelled",
      "posted",
      "approved",
      "visible",
    ].includes(value)
  ) {
    return value;
  }

  if (!value) return "published";

  return "draft";
}

function getEffectivePerkStatus(perk) {
  return normalizeStatus(perk?.status);
}

function getEffectiveEventStatus(event) {
  const saved = normalizeEventStatus(event?.status);
  if (saved === "active") return "published";
  if (saved === "posted") return "published";
  if (saved === "approved") return "published";
  if (saved === "visible") return "published";
  return saved;
}

function toMillisAny(ts) {
  if (!ts) return 0;

  if (typeof ts?.toMillis === "function") {
    const millis = ts.toMillis();
    return Number.isFinite(millis) ? millis : 0;
  }

  if (typeof ts?.toDate === "function") {
    const date = ts.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime())
      ? date.getTime()
      : 0;
  }

  if (typeof ts?.seconds === "number") {
    return ts.seconds * 1000;
  }

  if (typeof ts?._seconds === "number") {
    return ts._seconds * 1000;
  }

  if (ts instanceof Date) {
    return Number.isNaN(ts.getTime()) ? 0 : ts.getTime();
  }

  if (typeof ts === "number") {
    return Number.isFinite(ts) ? ts : 0;
  }

  if (typeof ts === "string") {
    const parsed = new Date(ts).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function getFeedSortMillis(post) {
  return (
    toMillisAny(post?.reopenedAt || post?.reopened_at) ||
    toMillisAny(post?.createdAt || post?.created_at) ||
    toMillisAny(post?.publishedAt || post?.published_at) ||
    toMillisAny(post?.postedAt || post?.posted_at) ||
    toMillisAny(
      post?.systemAudit?.createdAt || post?.system_audit?.created_at,
    ) ||
    toMillisAny(post?.updatedAt || post?.updated_at) ||
    toMillisAny(
      post?.systemAudit?.updatedAt || post?.system_audit?.updated_at,
    ) ||
    0
  );
}

function getFeedDisplayedPostTime(post) {
  return (
    post?.reopenedAt ||
    post?.reopened_at ||
    post?.createdAt ||
    post?.created_at ||
    post?.publishedAt ||
    post?.published_at ||
    post?.postedAt ||
    post?.posted_at
  );
}

function formatPostedDateTime(value) {
  const millis = toMillisAny(value);
  if (!millis) return "";

  const date = new Date(millis);

  const datePart = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  const timePart = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} at ${timePart}`;
}

function makeSavedPostKey(post) {
  const sourceType = safe(post?.sourceType || post?.source_type || "news");
  const sourceId = safe(
    post?.sourceId ||
      post?.source_id ||
      post?.postId ||
      post?.post_id ||
      post?.id,
  );

  if (sourceId) return `${sourceType}_${sourceId}`;

  return [
    sourceType,
    safe(post?.postHeader || post?.post_header || post?.title),
    safe(
      post?.authorName ||
        post?.author_name ||
        post?.companyName ||
        post?.company_name,
    ),
    String(post?.createdAt || post?.created_at || ""),
  ].join("_");
}

function isSameSavedPost(a, b) {
  const aType = safe(a?.sourceType || a?.source_type || "news");
  const bType = safe(b?.sourceType || b?.source_type || "news");

  const aId = safe(
    a?.sourceId || a?.source_id || a?.postId || a?.post_id || a?.id,
  );
  const bId = safe(
    b?.sourceId || b?.source_id || b?.postId || b?.post_id || b?.id,
  );

  if (aId && bId) return aType === bType && aId === bId;

  return makeSavedPostKey(a) === makeSavedPostKey(b);
}

function buildSavedPostPayload(post) {
  return {
    postId: safe(
      post?.sourceId ||
        post?.source_id ||
        post?.postId ||
        post?.post_id ||
        post?.id,
    ),
    sourceId: safe(
      post?.sourceId ||
        post?.source_id ||
        post?.postId ||
        post?.post_id ||
        post?.id,
    ),
    sourceType: safe(post?.sourceType || post?.source_type || "news"),

    authorUid: safe(
      post?.authorUid ||
        post?.author_uid ||
        post?.createdByUid ||
        post?.created_by_uid,
    ),
    authorName: safe(
      post?.authorName ||
        post?.author_name ||
        post?.createdByName ||
        post?.created_by_name,
    ),
    authorEmail: safe(
      post?.authorEmail ||
        post?.author_email ||
        post?.createdByEmail ||
        post?.created_by_email,
    ),
    authorRole: safe(post?.authorRole || post?.author_role || "Alumni Officer"),

    postHeader: safe(post?.postHeader || post?.post_header || post?.title),
    postContent: safe(
      post?.postContent ||
        post?.post_content ||
        post?.description ||
        post?.text,
    ),

    photoURLs: Array.isArray(post?.photoURLs)
      ? post.photoURLs
      : Array.isArray(post?.photo_urls)
        ? post.photo_urls
        : post?.coverImageUrl || post?.cover_image_url
          ? [post.coverImageUrl || post.cover_image_url]
          : [],

    links: Array.isArray(post?.links) ? post.links : [],
    createdAt: post?.createdAt || post?.created_at || null,
    updatedAt: post?.updatedAt || post?.updated_at || null,
    reopenedAt: post?.reopenedAt || post?.reopened_at || null,

    companyName: safe(post?.companyName || post?.company_name),
    location: safe(post?.location),
    startDate: safe(post?.startDate || post?.start_date),
    endDate: safe(post?.endDate || post?.end_date),
    requirements: Array.isArray(post?.requirements) ? post.requirements : [],
    postedOn: Array.isArray(post?.postedOn)
      ? post.postedOn
      : normalizeArray(post?.posted_on),
    status: safe(post?.status),

    eventDate: safe(post?.eventDate || post?.event_date),
    allDay: Boolean(post?.allDay || post?.all_day),
    startTime: safe(post?.startTime || post?.start_time),
    endTime: safe(post?.endTime || post?.end_time),
    category: safe(post?.category),
    customCategory: safe(post?.customCategory || post?.custom_category),
    contactName: safe(post?.contactName || post?.contact_name),
    contactEmail: safe(post?.contactEmail || post?.contact_email),
    tags: Array.isArray(post?.tags) ? post.tags : normalizeArray(post?.tags),

    linkedSurveyId: safe(post?.linkedSurveyId || post?.linked_survey_id),
    linkedSurveyTitle: safe(
      post?.linkedSurveyTitle || post?.linked_survey_title,
    ),

    savedAt: Date.now(),
  };
}

function normalizePhotoUrls(row = {}) {
  if (Array.isArray(row.photoURLs)) return row.photoURLs;
  if (Array.isArray(row.photo_urls)) return row.photo_urls;
  if (Array.isArray(row.images)) return row.images;
  if (Array.isArray(row.image_urls)) return row.image_urls;

  if (row.coverImageUrl || row.cover_image_url) {
    return [row.coverImageUrl || row.cover_image_url];
  }

  if (row.imageUrl || row.image_url) {
    return [row.imageUrl || row.image_url];
  }

  return [];
}

function normalizeLinks(row = {}) {
  if (Array.isArray(row.links)) {
    return row.links
      .map((item) => {
        if (typeof item === "string") {
          return {
            label: "Visit Link",
            url: item,
          };
        }

        return {
          label: item?.label || "Visit Link",
          url: item?.url || item?.href || "",
        };
      })
      .filter((item) => item.url);
  }

  const links = normalizeArray(row.links)
    .map((url) => ({
      label: "Visit Link",
      url,
    }))
    .filter((item) => item.url);

  const singleLink = safe(row.link || row.url || row.website);

  if (singleLink) {
    links.push({
      label: "Visit Link",
      url: singleLink,
    });
  }

  return links;
}

function newsToFeedPost(post) {
  return {
    ...post,

    id: post.id || post.postId || post.post_id || post.pk,
    sourceType: "news",
    sourceId: post.id || post.postId || post.post_id || post.pk,

    authorUid:
      post.authorUid ||
      post.author_uid ||
      post.createdByUid ||
      post.created_by_uid ||
      "",

    authorName:
      post.authorName ||
      post.author_name ||
      post.createdByName ||
      post.created_by_name ||
      "",

    authorEmail:
      post.authorEmail ||
      post.author_email ||
      post.createdByEmail ||
      post.created_by_email ||
      "",

    authorRole: post.authorRole || post.author_role || "Alumni Officer",

    postHeader: post.postHeader || post.post_header || post.title || "",

    postContent:
      post.postContent ||
      post.post_content ||
      post.text ||
      post.description ||
      post.content ||
      "",

    photoURLs: normalizePhotoUrls(post),
    links: normalizeLinks(post),

    createdAt: post.createdAt || post.created_at || null,
    updatedAt: post.updatedAt || post.updated_at || null,
    reopenedAt: post.reopenedAt || post.reopened_at || null,
    publishedAt: post.publishedAt || post.published_at || null,

    status: post.status || "active",
  };
}

function perkToFeedPost(perk) {
  return {
    id: `perk_${perk.id || perk.pk}`,
    sourceType: "perk",
    sourceId: perk.id || perk.pk,

    authorUid: perk.authorUid || perk.author_uid || "",
    authorName: perk.authorName || perk.author_name || "",
    authorEmail: perk.authorEmail || perk.author_email || "",
    authorRole: perk.authorRole || perk.author_role || "Alumni Officer",

    postHeader: perk.postHeader || perk.post_header || perk.title || "",
    postContent: perk.postContent || perk.post_content || perk.description || "",
    photoURLs: Array.isArray(perk.photoURLs)
      ? perk.photoURLs
      : Array.isArray(perk.photo_urls)
        ? perk.photo_urls
        : [],

    links: normalizeLinks(perk),

    createdAt: perk.createdAt || perk.created_at || null,
    updatedAt: perk.updatedAt || perk.updated_at || null,
    reopenedAt: perk.reopenedAt || perk.reopened_at || null,

    companyName: perk.companyName || perk.company_name || "",
    location: perk.location || "",
    startDate: perk.startDate || perk.start_date || "",
    endDate: perk.endDate || perk.end_date || "",
    startTime: perk.startTime || perk.start_time || "",
    endTime: perk.endTime || perk.end_time || "",
    allDay: Boolean(perk.allDay || perk.all_day),

    category: perk.category || "",
    customCategory: perk.customCategory || perk.custom_category || "",
    perkCategory: perk.perkCategory || perk.perk_category || "",
    discountCategory: perk.discountCategory || perk.discount_category || "",

    requirements: Array.isArray(perk.requirements) ? perk.requirements : [],
    postedOn: Array.isArray(perk.postedOn)
      ? perk.postedOn
      : normalizeArray(perk.posted_on),
    status: perk.status || "active",
  };
}

function eventToFeedPost(event) {
  return {
    id: `event_${event.id || event.pk}`,
    sourceType: "event",
    sourceId: event.id || event.pk,

    authorUid:
      event.createdByUid ||
      event.created_by_uid ||
      event.authorUid ||
      event.author_uid ||
      event.createdById ||
      event.created_by_id ||
      event.createdBy?.uid ||
      "",

    authorName:
      event.createdByName ||
      event.created_by_name ||
      event.authorName ||
      event.author_name ||
      event.createdBy?.name ||
      "",

    authorEmail:
      event.createdByEmail ||
      event.created_by_email ||
      event.authorEmail ||
      event.author_email ||
      event.createdBy?.email ||
      "",

    authorRole: event.authorRole || event.author_role || "Alumni Officer",

    postHeader: event.title || event.postHeader || event.post_header || "",
    postContent: event.description || event.postContent || event.post_content || "",
    photoURLs:
      event.coverImageUrl || event.cover_image_url
        ? [event.coverImageUrl || event.cover_image_url]
        : [],

    links: [],

    createdAt: event.createdAt || event.created_at || null,
    updatedAt: event.updatedAt || event.updated_at || null,
    reopenedAt: event.reopenedAt || event.reopened_at || null,

    eventDate: event.eventDate || event.event_date || "",
    endDate: event.endDate || event.end_date || "",
    allDay: Boolean(event.allDay || event.all_day),
    startTime: event.startTime || event.start_time || "",
    endTime: event.endTime || event.end_time || "",
    location: event.location || "",
    category: event.category || "",
    customCategory: event.customCategory || event.custom_category || "",
    contactName: event.contactName || event.contact_name || "",
    contactEmail: event.contactEmail || event.contact_email || "",
    tags: Array.isArray(event.tags) ? event.tags : normalizeArray(event.tags),
    postedOn: Array.isArray(event.postedOn)
      ? event.postedOn
      : normalizeArray(event.posted_on),
    status: event.status || "published",

    linkedSurveyId: event.linkedSurveyId || event.linked_survey_id || "",
    linkedSurveyTitle: event.linkedSurveyTitle || event.linked_survey_title || "",
  };
}

function formatTime12Hour(timeValue) {
  const value = safe(timeValue);
  if (!value) return "";

  const twelveHourMatch = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (twelveHourMatch) {
    const hours = Number(twelveHourMatch[1]);
    const minutes = String(twelveHourMatch[2] || "00").padStart(2, "0");
    const period = twelveHourMatch[3].toUpperCase();

    return `${hours}:${minutes} ${period}`;
  }

  const twentyFourHourMatch = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!twentyFourHourMatch) return value;

  const hours24 = Number(twentyFourHourMatch[1]);
  const minutes = twentyFourHourMatch[2];
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${minutes} ${period}`;
}

function formatEventTimeRange(post) {
  if (post?.allDay) return "All day";
  if (!post?.startTime && !post?.endTime) return "No time provided";

  const start = formatTime12Hour(post?.startTime);
  const end = formatTime12Hour(post?.endTime);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start || end || "No time provided";
}

function parseDateSafe(value) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateRange(startValue, endValue) {
  const start = parseDateSafe(startValue);
  const end = parseDateSafe(endValue) || start;

  if (!start) return "—";

  const sameDay = start.toDateString() === end?.toDateString();

  if (sameDay) {
    return start.toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return `${start.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  })} - ${end.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

function getFeedTimeLabel(post) {
  const dateTime = formatPostedDateTime(getFeedDisplayedPostTime(post));

  if (!dateTime) return "Posted date unavailable";

  return post?.reopenedAt || post?.reopened_at
    ? `Reopened ${dateTime}`
    : dateTime;
}

function getTagToneClasses(index) {
  const tones = [
    "border-[#F5DA3E]/40 bg-[#F5DA3E]/12 text-[#8A6B00]",
    "border-[#7DD3FC]/40 bg-[#7DD3FC]/12 text-[#0C7AA6]",
    "border-[#C4B5FD]/40 bg-[#C4B5FD]/12 text-[#6D57C8]",
    "border-[#F9A8D4]/40 bg-[#F9A8D4]/12 text-[#BE3A82]",
    "border-[#86EFAC]/40 bg-[#86EFAC]/12 text-[#15803D]",
    "border-[#FDBA74]/40 bg-[#FDBA74]/12 text-[#C2410C]",
  ];

  return tones[index % tones.length];
}

function relativeTime(ts) {
  if (!ts) return "";

  let date;

  if (typeof ts?.toDate === "function") {
    date = ts.toDate();
  } else if (typeof ts?.seconds === "number") {
    date = new Date(ts.seconds * 1000);
  } else if (typeof ts?._seconds === "number") {
    date = new Date(ts._seconds * 1000);
  } else if (ts instanceof Date) {
    date = ts;
  } else if (typeof ts === "number") {
    date = new Date(ts);
  } else if (typeof ts === "string") {
    date = new Date(ts);
  } else {
    return "";
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

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
    hour12: true,
  });

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday at ${timeStr}`;
  }

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

function SavePostButton({ saved, busy, onClick, tooltipSide = "left" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={busy}
          className={[
            "h-8 w-8 shrink-0 cursor-pointer rounded-xl disabled:cursor-not-allowed",
            saved
              ? "bg-[#3D398C]/10 text-[#3D398C] hover:bg-[#3D398C]/15 hover:text-[#3D398C]"
              : "text-muted-foreground hover:bg-[#3D398C]/5 hover:text-[#3D398C]",
          ].join(" ")}
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Bookmark size={16} className={saved ? "fill-current" : ""} />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent side={tooltipSide}>
        <p>{saved ? "Remove from saved posts" : "Save post"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

async function fetchFirstWorkingEndpoint(endpoints = []) {
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: "application/json",
        },
      });

      console.log("[AlumniNewsFeed] trying:", endpoint, response.status);

      if (!response.ok) continue;

      const data = await response.json();

      console.log("[AlumniNewsFeed] response from:", endpoint, data);

      if (Array.isArray(data)) return data;
      if (Array.isArray(data.results)) return data.results;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.posts)) return data.posts;
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.newsPosts)) return data.newsPosts;
      if (Array.isArray(data.news_posts)) return data.news_posts;
      if (Array.isArray(data.news)) return data.news;
      if (Array.isArray(data.perks)) return data.perks;
      if (Array.isArray(data.events)) return data.events;
      if (Array.isArray(data.calendarEvents)) return data.calendarEvents;
      if (Array.isArray(data.calendar_events)) return data.calendar_events;

      return [];
    } catch (error) {
      console.warn("[AlumniNewsFeed] failed endpoint:", endpoint, error);
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

function getSavedPostsFromLocalStorage(account) {
  try {
    const key = account?.email
      ? `nuai_saved_posts_${account.email}`
      : "nuai_saved_posts";

    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedPostsToLocalStorage(account, posts) {
  try {
    const key = account?.email
      ? `nuai_saved_posts_${account.email}`
      : "nuai_saved_posts";

    localStorage.setItem(key, JSON.stringify(posts || []));
  } catch {
    // localStorage may be unavailable.
  }
}

export default function AlumniNewsFeed({
  activeColor = BRAND_BLUE,
  roleToPosition,
  cacheBust,
}) {
  const loaderRef = useRef(null);
  const loadingRef = useRef(false);
  const preloadingRef = useRef(new Set());

  const [authUser, setAuthUser] = useState(() => getStoredAccount());

  const [sourceFilter, setSourceFilter] = useState("all");

  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [feedError, setFeedError] = useState("");

  const [savedPosts, setSavedPosts] = useState(() =>
    getSavedPostsFromLocalStorage(getStoredAccount()),
  );
  const [savingKey, setSavingKey] = useState("");

  const [authorPhotos, setAuthorPhotos] = useState({});
  const [authorNames, setAuthorNames] = useState({});

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [expandedPosts, setExpandedPosts] = useState({});
  const [readyPosts, setReadyPosts] = useState(new Set());

  const savedKeys = useMemo(() => {
    return new Set(savedPosts.map((post) => makeSavedPostKey(post)));
  }, [savedPosts]);

  function toggleExpand(postId) {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  }

  function shouldTruncate(text) {
    return text && text.length > CONTENT_TRUNCATE_LENGTH;
  }

  function getTruncated(text) {
    if (!text || text.length <= CONTENT_TRUNCATE_LENGTH) return text;
    return `${text.slice(0, CONTENT_TRUNCATE_LENGTH).trimEnd()}…`;
  }

  function openLinkedSurvey(linkedSurveyId) {
    if (!linkedSurveyId) return;
    window.location.href = `/survey/${linkedSurveyId}`;
  }

  async function toggleSavePost(post) {
    try {
      if (!authUser?.email && !authUser?.id) {
        alert("Please login first.");
        return;
      }

      const key = makeSavedPostKey(post);
      setSavingKey(key);

      const alreadySaved = savedPosts.some((item) =>
        isSameSavedPost(item, post),
      );

      const next = alreadySaved
        ? savedPosts.filter((item) => !isSameSavedPost(item, post))
        : [...savedPosts, buildSavedPostPayload(post)];

      setSavedPosts(next);
      writeSavedPostsToLocalStorage(authUser, next);
    } catch (e) {
      console.error("Failed to update saved post:", e);
      alert(e?.message || "Failed to update saved post.");
    } finally {
      setSavingKey("");
    }
  }

  async function loadPosts(loadMore = false) {
    if (loadingRef.current) return;
    if (loadMore) return;

    loadingRef.current = true;
    setLoadingFeed(true);
    setFeedError("");

    try {
      const [newsRowsRaw, perksRowsRaw, eventsRowsRaw] = await Promise.all([
        fetchFirstWorkingEndpoint(NEWS_ENDPOINTS),
        fetchFirstWorkingEndpoint(PERKS_ENDPOINTS),
        fetchFirstWorkingEndpoint(EVENTS_ENDPOINTS),
      ]);

      console.log("[AlumniNewsFeed] raw rows:", {
        newsRowsRaw,
        perksRowsRaw,
        eventsRowsRaw,
      });

      const newsRows = newsRowsRaw
        .map(newsToFeedPost)
        .filter((post) => isVisibleNewsStatus(post?.status))
        .slice(0, FEED_LIMIT);

      const perkRows = perksRowsRaw
        .filter((perk) => {
          const postedOn = Array.isArray(perk.postedOn)
            ? perk.postedOn
            : normalizeArray(perk.posted_on);

          if (postedOn.length === 0) return true;
          return postedOn
            .map((item) => safe(item).toLowerCase())
            .includes("news");
        })
        .filter((perk) => {
          const status = getEffectivePerkStatus(perk);
          return (
            status === "active" ||
            status === "open" ||
            status === "published" ||
            status === "posted" ||
            status === "approved" ||
            status === "visible"
          );
        })
        .map(perkToFeedPost)
        .slice(0, FEED_LIMIT);

      const eventRows = eventsRowsRaw
        .filter((event) => {
          const postedOn = Array.isArray(event.postedOn)
            ? event.postedOn
            : normalizeArray(event.posted_on);

          if (postedOn.length === 0) return true;
          return postedOn
            .map((item) => safe(item).toLowerCase())
            .includes("news");
        })
        .filter((event) => {
          const status = getEffectiveEventStatus(event);
          return status === "published" || status === "active";
        })
        .map(eventToFeedPost)
        .slice(0, FEED_LIMIT);

      let combined = [...newsRows, ...perkRows, ...eventRows];

      if (sourceFilter !== "all") {
        combined = combined.filter((post) => {
          const role = post.authorRole;

          if (sourceFilter === "alumniOfficer") {
            return role === "Alumni Officer";
          }

          if (sourceFilter === "ailpo") {
            return role === "AILPO";
          }

          return true;
        });
      }

      combined.sort((a, b) => {
        const aMs = getFeedSortMillis(a);
        const bMs = getFeedSortMillis(b);

        if (bMs !== aMs) return bMs - aMs;

        return String(b.id || "").localeCompare(String(a.id || ""));
      });

      setPosts(combined);
      setLastDoc(null);
      setHasMore(false);
    } catch (e) {
      console.error("AlumniNewsFeed loadPosts error:", e);
      setFeedError(e?.message || "Failed to load posts.");
    } finally {
      setLoadingFeed(false);
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    const account = getStoredAccount();
    setAuthUser(account);
    setSavedPosts(getSavedPostsFromLocalStorage(account));
  }, []);

  useEffect(() => {
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    setFeedError("");
    setReadyPosts(new Set());
    preloadingRef.current = new Set();

    loadPosts(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter]);

  useEffect(() => {
    const photoUpdates = {};
    const nameUpdates = {};

    posts.forEach((post) => {
      const uid = safe(post.authorUid || post.createdByUid);
      const email = safe(post.authorEmail || post.createdByEmail).toLowerCase();
      const key = uid ? `uid:${uid}` : email ? `email:${email}` : "";

      if (!key) return;

      photoUpdates[key] =
        post.authorPhoto ||
        post.author_photo ||
        post.profilePhotoUrl ||
        post.profile_photo_url ||
        "";

      nameUpdates[key] =
        getUserDisplayName(post.author || post.createdBy || {}) ||
        post.authorName ||
        post.author_name ||
        post.createdByName ||
        post.created_by_name ||
        "";
    });

    setAuthorPhotos((prev) => ({ ...prev, ...photoUpdates }));
    setAuthorNames((prev) => ({ ...prev, ...nameUpdates }));
  }, [posts]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return undefined;
    if (!hasMore) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) loadPosts(true);
      },
      { root: null, rootMargin: "250px", threshold: 0 },
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, lastDoc]);

  function openViewer(images, index) {
    setViewerImages(images || []);
    setViewerIndex(index || 0);
    setViewerOpen(true);
  }

  function closeViewer() {
    setViewerOpen(false);
    setViewerImages([]);
    setViewerIndex(0);
  }

  function showPrevImage() {
    if (!viewerImages.length) return;

    setViewerIndex(
      (prev) => (prev - 1 + viewerImages.length) % viewerImages.length,
    );
  }

  function showNextImage() {
    if (!viewerImages.length) return;
    setViewerIndex((prev) => (prev + 1) % viewerImages.length);
  }

  useEffect(() => {
    if (!viewerOpen) return undefined;

    function onKeyDown(e) {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") showPrevImage();
      if (e.key === "ArrowRight") showNextImage();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewerOpen, viewerImages.length]);

  useEffect(() => {
    posts.forEach((post) => {
      const pid = post.id;
      if (readyPosts.has(pid)) return;
      if (preloadingRef.current.has(pid)) return;

      const uid = safe(post.authorUid || post.createdByUid);
      const email = safe(post.authorEmail || post.createdByEmail).toLowerCase();
      const authorLookupKey = uid ? `uid:${uid}` : email ? `email:${email}` : "";

      const avatarUrl =
        (uid ? authorPhotos[uid] : "") ||
        (authorLookupKey ? authorPhotos[authorLookupKey] : "");

      const galleryImages = Array.isArray(post.photoURLs) ? post.photoURLs : [];

      const allUrls = [];

      if (avatarUrl && post.sourceType !== "perk") {
        allUrls.push(
          cacheBust
            ? cacheBust(avatarUrl, getFeedDisplayedPostTime(post))
            : avatarUrl,
        );
      }

      allUrls.push(...galleryImages);

      if (allUrls.length === 0) {
        setReadyPosts((prev) => new Set(prev).add(pid));
        return;
      }

      preloadingRef.current.add(pid);

      let loaded = 0;
      const total = allUrls.length;

      allUrls.forEach((url) => {
        const img = new Image();

        img.onload = img.onerror = () => {
          loaded++;

          if (loaded >= total) {
            setReadyPosts((prev) => new Set(prev).add(pid));
          }
        };

        img.src = url;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, authorPhotos]);

  function SkeletonPostCard({ hasImages = true }) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          {hasImages && (
            <Skeleton className="mt-3 h-[200px] w-full rounded-xl" />
          )}
        </CardContent>
      </Card>
    );
  }

  function renderStandardGallery(postImages, openViewerFn) {
    const extraCount = postImages.length - 5;

    if (postImages.length === 1) {
      return (
        <img
          src={postImages[0]}
          alt=""
          className="h-[420px] w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
          onClick={() => openViewerFn(postImages, 0)}
        />
      );
    }

    if (postImages.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-0.5">
          {postImages.map((src, idx) => (
            <img
              key={`${src}_${idx}`}
              src={src}
              alt=""
              className="h-[280px] w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
              onClick={() => openViewerFn(postImages, idx)}
            />
          ))}
        </div>
      );
    }

    if (postImages.length === 3) {
      return (
        <div className="flex flex-col gap-0.5">
          <img
            src={postImages[0]}
            alt=""
            className="h-[320px] w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
            onClick={() => openViewerFn(postImages, 0)}
          />

          <div className="grid grid-cols-2 gap-0.5">
            {postImages.slice(1).map((src, idx) => (
              <img
                key={`${src}_${idx}`}
                src={src}
                alt=""
                className="h-[180px] w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                onClick={() => openViewerFn(postImages, idx + 1)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (postImages.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-0.5">
          {postImages.map((src, idx) => (
            <img
              key={`${src}_${idx}`}
              src={src}
              alt=""
              className="h-[240px] w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
              onClick={() => openViewerFn(postImages, idx)}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-6 gap-0.5">
        <img
          src={postImages[0]}
          alt=""
          className="col-span-3 h-[320px] w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
          onClick={() => openViewerFn(postImages, 0)}
        />

        <img
          src={postImages[1]}
          alt=""
          className="col-span-3 h-[320px] w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
          onClick={() => openViewerFn(postImages, 1)}
        />

        {postImages.slice(2, 5).map((src, idx) => {
          const realIndex = idx + 2;
          const showOverlay = extraCount > 0 && idx === 2;

          return (
            <div key={`${src}_${realIndex}`} className="relative col-span-2">
              <img
                src={src}
                alt=""
                className="h-[170px] w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                onClick={() => openViewerFn(postImages, realIndex)}
              />

              {showOverlay ? (
                <div
                  className="absolute inset-0 grid cursor-pointer place-items-center bg-black/50 text-white backdrop-blur-[1px] transition-colors hover:bg-black/60"
                  onClick={() => openViewerFn(postImages, realIndex)}
                >
                  <div className="text-center">
                    <span className="text-2xl font-bold">+{extraCount}</span>
                    <p className="mt-0.5 text-xs font-medium opacity-80">
                      more
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  function getProcessedPosts() {
    return [...posts];
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Feed</h2>
            <p className="text-xs text-slate-500">
              Latest alumni announcements and updates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 w-[200px] cursor-pointer bg-white text-xs transition-colors hover:border-slate-400/70 focus:ring-1 focus:ring-[#3D398C]/30">
                <SelectValue placeholder="Source" />
              </SelectTrigger>

              <SelectContent className="z-50 border border-slate-200 bg-white text-slate-900 shadow-lg">
                <SelectItem value="all">All officer posts</SelectItem>
                <SelectItem value="alumniOfficer">
                  Alumni Affairs Officer
                </SelectItem>
                <SelectItem value="ailpo">AILPO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {feedError ? (
          <Card className="border-red-200 bg-red-50/50 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-100 text-red-600">
                  <AlertCircle size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-700">
                    Failed to load feed
                  </p>
                  <p className="mt-0.5 text-xs text-red-600/80">{feedError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {loadingFeed && posts.length === 0 ? (
          <div className="space-y-4">
            <SkeletonPostCard />
            <SkeletonPostCard />
            <SkeletonPostCard />
          </div>
        ) : null}

        {!loadingFeed && !feedError && posts.length === 0 ? (
          <Card className="border-border/60 shadow-sm">
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-muted">
                  <Newspaper size={28} className="text-muted-foreground" />
                </div>

                <p className="text-sm font-semibold text-foreground">
                  No posts yet
                </p>

                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  When announcements and updates are posted, they'll appear here
                  in your news feed.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {getProcessedPosts().map((post) => {
          const saveKey = makeSavedPostKey(post);
          const isSaved = savedKeys.has(saveKey);
          const isSaving = savingKey === saveKey;

          const uid = safe(post.authorUid || post.createdByUid);
          const email = safe(
            post.authorEmail || post.createdByEmail,
          ).toLowerCase();
          const authorLookupKey = uid
            ? `uid:${uid}`
            : email
              ? `email:${email}`
              : "";

          const resolvedAuthorName = authorLookupKey
            ? authorNames[authorLookupKey]
            : "";

          const name =
            displayNameCandidate(resolvedAuthorName) ||
            displayNameCandidate(post.authorName) ||
            displayNameCandidate(post.createdByName) ||
            (post.sourceType === "event"
              ? "Alumni Officer"
              : email.split("@")?.[0]) ||
            "Unknown";

          const position =
            roleToPosition?.(post.authorRole) || post.authorRole || "—";

          const photoUrl =
            (uid ? authorPhotos[uid] : "") ||
            (authorLookupKey ? authorPhotos[authorLookupKey] : "");

          const postHeader = post.postHeader || "";
          const postContent = post.postContent || post.text || "";
          const postImages = Array.isArray(post.photoURLs) ? post.photoURLs : [];

          const isExpanded = expandedPosts[post.id];
          const needsTruncation = shouldTruncate(postContent);
          const displayContent =
            needsTruncation && !isExpanded
              ? getTruncated(postContent)
              : postContent;

          const initials = name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();

          const avatarSrc = photoUrl
            ? cacheBust
              ? cacheBust(photoUrl, getFeedDisplayedPostTime(post))
              : photoUrl
            : "";

          if (!readyPosts.has(post.id)) {
            return (
              <SkeletonPostCard
                key={post.id}
                hasImages={postImages.length > 0}
              />
            );
          }

          if (post.sourceType === "perk") {
            return (
              <div key={post.id} className="relative">
                <div className="absolute right-3 top-3 z-20">
                  <SavePostButton
                    saved={isSaved}
                    busy={isSaving}
                    tooltipSide="left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSavePost(post);
                    }}
                  />
                </div>

                <PerksPostPreview
                  companyName={post.companyName || ""}
                  companySubtitle={getFeedTimeLabel(post)}
                  location={post.location || ""}
                  postHeader={post.postHeader || ""}
                  postContent={post.postContent || ""}
                  startDate={post.startDate || ""}
                  endDate={post.endDate || ""}
                  startTime={post.startTime || ""}
                  endTime={post.endTime || ""}
                  allDay={Boolean(post.allDay)}
                  category={
                    post.category ||
                    post.perkCategory ||
                    post.discountCategory ||
                    ""
                  }
                  customCategory={post.customCategory || ""}
                  status={post.status || "draft"}
                  links={
                    Array.isArray(post.links)
                      ? post.links
                          .map((l) => (typeof l === "string" ? l : l.url))
                          .filter(Boolean)
                      : []
                  }
                  requirements={
                    Array.isArray(post.requirements) ? post.requirements : []
                  }
                  imageUrls={Array.isArray(post.photoURLs) ? post.photoURLs : []}
                />
              </div>
            );
          }

          if (post.sourceType === "event") {
            const eventImage =
              Array.isArray(post.photoURLs) && post.photoURLs.length > 0
                ? post.photoURLs[0]
                : "";

            const displayCategory =
              post.category === "others" ? post.customCategory : post.category;

            return (
              <div
                key={post.id}
                className="animate-in fade-in-0 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3D398C]/10">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={name}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle2 className="h-6 w-6 text-[#3D398C]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getFeedTimeLabel(post)}
                      </p>
                    </div>
                  </div>

                  <SavePostButton
                    saved={isSaved}
                    busy={isSaving}
                    tooltipSide="left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSavePost(post);
                    }}
                  />
                </div>

                {eventImage ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openViewer([eventImage], 0);
                    }}
                    className="block w-full cursor-pointer border-b border-border bg-muted/20 text-left"
                    aria-label="Open event image"
                  >
                    <img
                      src={eventImage}
                      alt={post.postHeader || "Event cover"}
                      className="h-[260px] w-full object-cover transition-opacity hover:opacity-95"
                    />
                  </button>
                ) : (
                  <div className="flex h-[220px] w-full items-center justify-center border-b border-border bg-gradient-to-br from-[#3D398C] via-[#4a46a8] to-[#18B4E8] px-6 text-center">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                        Alumni Event
                      </p>
                      <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white">
                        {post.postHeader || "Untitled Event"}
                      </h2>
                    </div>
                  </div>
                )}

                <div className="space-y-5 px-5 py-5">
                  <div>
                    <h2 className="text-2xl font-bold leading-tight text-foreground">
                      {post.postHeader || "Untitled Event"}
                    </h2>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {displayCategory ? (
                        <span className="rounded-full bg-[#3D398C]/10 px-3 py-1 text-xs font-semibold capitalize text-[#3D398C]">
                          {displayCategory}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <CalendarDays className="h-4 w-4 text-[#3D398C]" />
                        Date
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatDateRange(post.eventDate, post.endDate)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Clock3 className="h-4 w-4 text-[#3D398C]" />
                        Time
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatEventTimeRange(post)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <MapPin className="h-4 w-4 text-[#3D398C]" />
                        Location
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {post.location || "—"}
                      </p>
                    </div>
                  </div>

                  {post.contactName || post.contactEmail ? (
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Contact Information
                      </p>

                      <div className="mt-2 space-y-1">
                        {post.contactName ? (
                          <p className="text-sm font-semibold text-foreground">
                            {post.contactName}
                          </p>
                        ) : null}

                        {post.contactEmail ? (
                          <p className="text-sm text-muted-foreground">
                            {post.contactEmail}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-border bg-background px-4 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                      {displayContent || "No description provided."}
                    </p>

                    {needsTruncation ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(post.id)}
                        className="mt-3 cursor-pointer text-sm font-semibold text-[#3D398C] transition-colors hover:text-[#3D398C]/80"
                      >
                        {isExpanded ? "Show less" : "Show more"}
                      </button>
                    ) : null}
                  </div>

                  {post.linkedSurveyTitle && post.linkedSurveyId ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openLinkedSurvey(post.linkedSurveyId);
                      }}
                      className="w-full rounded-2xl border border-border bg-muted/20 p-4 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3D398C]/10">
                          <Paperclip className="h-4 w-4 text-[#3D398C]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            Attached Survey
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {post.linkedSurveyTitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  ) : null}

                  {post.tags?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span
                          key={tag}
                          className={[
                            "rounded-full border px-3 py-1.5 text-xs font-medium",
                            getTagToneClasses(index),
                          ].join(" ")}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          }

          return (
            <Card
              key={post.id}
              className="animate-in fade-in-0 border-border/60 shadow-sm"
            >
              <CardHeader className="pb-0">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fb = e.currentTarget.nextSibling;
                          if (fb) fb.style.display = "grid";
                        }}
                      />
                    ) : null}

                    <div
                      className="grid h-full w-full place-items-center text-xs font-bold text-white"
                      style={{
                        display: avatarSrc ? "none" : "grid",
                        background: activeColor,
                      }}
                    >
                      {initials || name?.[0]?.toUpperCase()}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold leading-tight text-foreground">
                        {name}
                      </p>

                      <Badge
                        variant="outline"
                        className="border-[#3D398C]/20 bg-[#3D398C]/5 px-1.5 py-0 text-[10px] font-medium text-[#3D398C]"
                      >
                        {position}
                      </Badge>
                    </div>

                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {post.reopenedAt
                        ? `Reopened ${relativeTime(post.reopenedAt)}`
                        : relativeTime(post.createdAt)}
                    </p>
                  </div>

                  <SavePostButton
                    saved={isSaved}
                    busy={isSaving}
                    tooltipSide="left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSavePost(post);
                    }}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {postHeader ? (
                  <h3 className="whitespace-pre-wrap text-[15px] font-semibold leading-snug text-foreground/80">
                    {postHeader}
                  </h3>
                ) : null}

                {postContent ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {displayContent}
                  </p>
                ) : null}

                {needsTruncation ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(post.id)}
                    className="cursor-pointer text-sm font-semibold text-[#3D398C] transition-colors hover:text-[#3D398C]/80"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                ) : null}

                {post.links?.length > 0 ? (
                  <div className="space-y-1.5">
                    {post.links.map((l, i) => {
                      const url = typeof l === "string" ? l : l.url;
                      if (!url) return null;

                      return (
                        <a
                          key={`${url}_${i}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium text-[#3D398C] transition-colors hover:border-[#3D398C]/20 hover:bg-[#3D398C]/5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link2
                            size={14}
                            className="shrink-0 text-[#3D398C]/60 group-hover:text-[#3D398C]"
                          />
                          <span className="truncate">
                            {typeof l === "string" ? l : l.label || l.url}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                ) : null}

                {postImages.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-border/40">
                    {renderStandardGallery(postImages, openViewer)}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        {posts.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-muted">
              <CheckCircle2 size={18} className="text-muted-foreground" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              You're all caught up
            </p>
          </div>
        ) : null}

        {viewerOpen && viewerImages.length > 0 ? (
          <div
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm"
            onClick={closeViewer}
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4 sm:p-6">
              <div
                className="relative flex h-[80vh] w-[90vw] max-w-[1150px] items-center justify-center rounded-2xl bg-black/60"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeViewer();
                  }}
                  className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  title="Close"
                >
                  <X size={20} />
                </button>

                {viewerImages.length > 1 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      showPrevImage();
                    }}
                    className="absolute left-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    title="Previous"
                  >
                    <ChevronLeft size={24} />
                  </button>
                ) : null}

                <img
                  src={viewerImages[viewerIndex]}
                  alt={`news-full-${viewerIndex + 1}`}
                  className="max-h-full max-w-full rounded-lg object-contain"
                />

                {viewerImages.length > 1 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      showNextImage();
                    }}
                    className="absolute right-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    title="Next"
                  >
                    <ChevronRight size={24} />
                  </button>
                ) : null}

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                  {viewerIndex + 1} / {viewerImages.length}
                </div>
              </div>

              {viewerImages.length > 1 ? (
                <div
                  className="flex max-w-[90vw] gap-2 overflow-x-auto rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {viewerImages.map((src, idx) => (
                    <button
                      key={`${src}_${idx}`}
                      type="button"
                      onClick={() => setViewerIndex(idx)}
                      className={[
                        "shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                        idx === viewerIndex
                          ? "scale-105 border-white shadow-lg"
                          : "border-transparent opacity-60 hover:opacity-100",
                      ].join(" ")}
                      title={`Image ${idx + 1}`}
                    >
                      <img
                        src={src}
                        alt={`thumb-${idx + 1}`}
                        className="h-14 w-14 object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div ref={loaderRef} className="h-1 w-full" />
      </div>
    </TooltipProvider>
  );
}