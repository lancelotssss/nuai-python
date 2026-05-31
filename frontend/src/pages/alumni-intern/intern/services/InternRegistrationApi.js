const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

function normalizeErrorPayload(payload) {
  if (!payload) return "Request failed.";
  if (typeof payload === "string") return payload;
  if (payload.message) return payload.message;
  if (payload.detail) return payload.detail;

  const firstKey = Object.keys(payload)[0];
  const firstValue = firstKey ? payload[firstKey] : null;

  if (Array.isArray(firstValue)) return firstValue.join(" ");
  if (typeof firstValue === "string") return firstValue;

  return "Request failed.";
}

async function postJson(path, body = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(normalizeErrorPayload(payload));
  }

  return { data: payload };
}

export function getPreRegisteredIntern(payload) {
  return postJson("/intern-registration/precheck/", payload);
}

export function sendInternEmailOTP(payload) {
  return postJson("/intern-registration/send-otp/", payload);
}

export function resendInternEmailOTP(payload) {
  return postJson("/intern-registration/resend-otp/", payload);
}

export function verifyInternEmailOTP(payload) {
  return postJson("/intern-registration/verify-otp/", payload);
}

export function registerInternUser(payload) {
  return postJson("/intern-registration/register/", payload);
}
