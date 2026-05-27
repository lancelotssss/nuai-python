export const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
export const MAX_IMAGE_COUNT = 5;

export function buildNameWithMiddleInitial(personalInfo = {}) {
  const first = String(personalInfo.firstName || "").trim();
  const middle = String(personalInfo.middleName || "").trim();
  const last = String(personalInfo.lastName || "").trim();
  const middleInitial = middle ? `${middle[0].toUpperCase()}.` : "";
  return [first, middleInitial, last].filter(Boolean).join(" ").trim();
}

export function cleanText(v) {
  return String(v || "").trim();
}

export function normalizeUrl(url) {
  const value = cleanText(url);
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function splitRequirements(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanText(item))
      .filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => cleanText(item))
    .filter(Boolean);
}

export function safeFileName(name) {
  return String(name || "image")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 80);
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}