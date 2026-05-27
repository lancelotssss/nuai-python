const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

const ENDPOINTS = {
  newsPosts: "posts",
  posts: "posts",
  perksDiscounts: "perks-discounts",
  calendarEvents: "calendar-events",
};

const memoryUploads = new Map();

function getAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null") || {};
  } catch {
    return {};
  }
}

function endpointFor(path = []) {
  const root = Array.isArray(path) ? path[0] : path;
  return ENDPOINTS[root] || root;
}

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function sortRows(rows, constraints = []) {
  const order = constraints.find((item) => item?.type === "orderBy");
  if (!order) return rows;

  const direction = order.direction === "asc" ? 1 : -1;
  const field = order.field;

  return [...rows].sort((a, b) => {
    const av = toMillis(a?.[field]);
    const bv = toMillis(b?.[field]);
    if (av === bv) return 0;
    return av > bv ? direction : -direction;
  });
}

function applyCursor(rows, constraints = []) {
  const cursor = constraints.find((item) => item?.type === "startAfter");
  if (!cursor?.snapshot?.id) return rows;
  const index = rows.findIndex((row) => String(row.id) === String(cursor.snapshot.id));
  return index >= 0 ? rows.slice(index + 1) : rows;
}

function applyLimit(rows, constraints = []) {
  const limitItem = constraints.find((item) => item?.type === "limit");
  if (!limitItem) return rows;
  return rows.slice(0, Number(limitItem.count || rows.length));
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function makeSnapshot(rows = []) {
  const docs = rows.map((row) => ({
    id: String(row.id),
    data: () => row,
    exists: () => true,
  }));

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach(callback) {
      docs.forEach(callback);
    },
  };
}

export const db = {};
export const storage = {};
export const functions = {};

export const auth = {
  get currentUser() {
    const account = getAccount();
    return {
      uid: account.id || account.email || "local-officer",
      email: account.email || "",
      displayName: account.name || account.email || "Alumni Affairs Officer",
      photoURL: account.photoURL || account.photoUrl || "",
    };
  },
};

export function collection(_db, ...path) {
  return { kind: "collection", path, constraints: [] };
}

export function doc(_dbOrCollection, ...path) {
  if (_dbOrCollection?.kind === "collection") {
    return {
      kind: "doc",
      path: [...(_dbOrCollection.path || []), ...path],
    };
  }
  return { kind: "doc", path };
}

export function orderBy(field, direction = "asc") {
  return { type: "orderBy", field, direction };
}

export function limit(count) {
  return { type: "limit", count };
}

export function startAfter(snapshot) {
  return { type: "startAfter", snapshot };
}

export function where(field, operator, value) {
  return { type: "where", field, operator, value };
}

export function query(collectionRef, ...constraints) {
  return {
    ...collectionRef,
    constraints: [...(collectionRef.constraints || []), ...constraints],
  };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export async function getDocs(queryRef) {
  const endpoint = endpointFor(queryRef.path);

  if (endpoint === "users") {
    const account = getAccount();
    return makeSnapshot(account?.id || account?.email ? [{ id: account.id || account.email, ...account }] : []);
  }

  const payload = await request(`${endpoint}/`);
  let rows = normalizeListPayload(payload);
  rows = sortRows(rows, queryRef.constraints || []);
  rows = applyCursor(rows, queryRef.constraints || []);
  rows = applyLimit(rows, queryRef.constraints || []);
  return makeSnapshot(rows);
}

export async function getDoc(docRef) {
  const [root, id] = docRef.path || [];
  const endpoint = endpointFor([root]);

  if (root === "users") {
    const account = getAccount();
    return {
      id: String(id || account.id || account.email || "local-officer"),
      exists: () => true,
      data: () => ({
        id: account.id,
        email: account.email,
        role: account.role,
        personalInformation: account.personalInformation || {
          fullName: account.name || account.email || "Alumni Affairs Officer",
          firstName: account.firstName || "Alumni Affairs",
          lastName: account.lastName || "Officer",
        },
        personalization: account.personalization || {},
      }),
    };
  }

  const row = await request(`${endpoint}/${id}/`);
  return {
    id: String(row.id || id),
    exists: () => Boolean(row),
    data: () => row,
  };
}

export async function addDoc(collectionRef, data) {
  const endpoint = endpointFor(collectionRef.path);
  const row = await request(`${endpoint}/`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
  return { id: String(row?.id || "") };
}

export async function updateDoc(docRef, data) {
  const [root, id] = docRef.path || [];
  const endpoint = endpointFor([root]);
  return request(`${endpoint}/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data || {}),
  });
}

export async function deleteDoc(docRef) {
  const [root, id] = docRef.path || [];
  const endpoint = endpointFor([root]);
  return request(`${endpoint}/${id}/`, { method: "DELETE" });
}

export function onSnapshot(queryRef, onNext, onError) {
  let cancelled = false;
  getDocs(queryRef)
    .then((snapshot) => {
      if (!cancelled) onNext?.(snapshot);
    })
    .catch((error) => {
      if (!cancelled) onError?.(error);
    });

  return () => {
    cancelled = true;
  };
}

export function ref(_storage, path) {
  return { path };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadBytes(fileRef, file) {
  const dataUrl = await fileToDataUrl(file);
  memoryUploads.set(fileRef.path, dataUrl);
  return { ref: fileRef };
}

export async function getDownloadURL(fileRef) {
  return memoryUploads.get(fileRef.path) || "";
}

export function getFunctions() {
  return functions;
}

export function httpsCallable() {
  return async () => ({ data: { ok: true } });
}
