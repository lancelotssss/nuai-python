import * as XLSX from "xlsx";

export const BB = "#3D398C";
export const PS_DEFAULT = 10;
export const PS_OPTIONS = [10, 20, 50];
export const BULK_UPLOAD_ACCEPT = ".csv,.xlsx,.xls";

export function safe(value) {
  return String(value ?? "").trim();
}

export function norm(value) {
  return safe(value).toLowerCase();
}

export function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function normalizeHeader(value) {
  return safe(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function capitalizePerWord(value) {
  return safe(value)
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function validateEmailFormat(value) {
  const email = norm(value);
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatStudentIdInput(value) {
  const raw = safe(value);
  const digits = raw.replace(/\D/g, "").slice(0, 11);

  if (!digits) return raw;
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function validateStudentIdFormat(value) {
  const clean = safe(value);
  if (!clean) return false;
  return /^\d{4}-?\d{4,7}$/.test(clean);
}

export function splitFullName(fullName) {
  const value = safe(fullName).replace(/\s+/g, " ");

  if (!value) return { firstName: "", middleName: "", lastName: "" };

  if (value.includes(",")) {
    const [lastPart, restPart] = value.split(",", 2);
    const restPieces = safe(restPart).split(/\s+/).filter(Boolean);

    return {
      firstName: capitalizePerWord(restPieces[0] || ""),
      middleName: capitalizePerWord(restPieces.slice(1).join(" ")),
      lastName: capitalizePerWord(lastPart),
    };
  }

  const pieces = value.split(/\s+/).filter(Boolean);

  if (pieces.length === 1) {
    return { firstName: capitalizePerWord(pieces[0]), middleName: "", lastName: "" };
  }

  if (pieces.length === 2) {
    return {
      firstName: capitalizePerWord(pieces[0]),
      middleName: "",
      lastName: capitalizePerWord(pieces[1]),
    };
  }

  return {
    firstName: capitalizePerWord(pieces[0]),
    middleName: capitalizePerWord(pieces.slice(1, -1).join(" ")),
    lastName: capitalizePerWord(pieces[pieces.length - 1]),
  };
}

export function buildFullName(row = {}) {
  const direct = safe(row.full_name || row.fullName || row.name);
  if (direct) return direct;

  return [
    row.first_name || row.firstName,
    row.middle_name || row.middleName,
    row.last_name || row.lastName,
  ]
    .map(safe)
    .filter(Boolean)
    .join(" ");
}

export function getAlumniName(row = {}) {
  return buildFullName(row) || "Unnamed Alumni";
}

export function getAlumniEmail(row = {}) {
  return safe(
    row.email ||
      row.nu_email ||
      row.nuEmail ||
      row.personal_email ||
      row.personalEmail ||
      row.contactInformation?.nuEmail ||
      row.contactInformation?.personalEmail ||
      row.contactInformation?.email,
  );
}

export function getAlumniStudentId(row = {}) {
  return safe(row.student_id || row.studentId || row.alumniInformation?.studentId);
}

export function getAlumniCourse(row = {}) {
  return safe(
    row.course ||
      row.course_graduated ||
      row.courseGraduated ||
      row.alumniInformation?.courseGraduated,
  );
}

export function getAlumniCourseFullName(row = {}) {
  return safe(
    row.course_full_name ||
      row.course_graduated_full_name ||
      row.courseGraduatedFullName ||
      row.alumniInformation?.courseGraduatedFullName,
  );
}

export function getAlumniGraduationYear(row = {}) {
  return safe(
    row.graduation_year ||
      row.graduationYear ||
      row.year_graduated ||
      row.yearGraduated ||
      row.graduation_period ||
      row.graduationPeriod ||
      row.alumniInformation?.graduationYear ||
      row.alumniInformation?.graduationPeriod,
  );
}

export function normalizeAlumni(row = {}) {
  const fullName = buildFullName(row);

  return {
    ...row,
    id: row.id,
    sourceType: "registered",
    studentId: getAlumniStudentId(row),
    firstName: row.first_name || row.firstName || "",
    middleName: row.middle_name || row.middleName || "",
    lastName: row.last_name || row.lastName || "",
    fullName,
    email: getAlumniEmail(row),
    contactNumber:
      row.contact_number || row.contactNumber || row.contactInformation?.contactNumber || "",
    course: getAlumniCourse(row),
    courseFullName: getAlumniCourseFullName(row),
    graduationYear: getAlumniGraduationYear(row),
    role: row.role || "alumni",
    status: row.status || "active",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
  };
}

export function normalizePreRegisteredAlumni(row = {}) {
  const normalized = normalizeAlumni(row);

  return {
    ...normalized,
    sourceType: "unregistered",
    status: row.status || "pre-registered",
    email: safe(row.nu_email || row.nuEmail || row.email || row.contactInformation?.nuEmail),
    personalEmail: safe(row.personal_email || row.personalEmail || row.contactInformation?.personalEmail),
    course: safe(row.course_graduated || row.courseGraduated || normalized.course),
    courseFullName: safe(
      row.course_graduated_full_name || row.courseGraduatedFullName || normalized.courseFullName,
    ),
    graduationYear: safe(
      row.graduation_period || row.graduationPeriod || row.year_graduated || normalized.graduationYear,
    ),
    academicAward: safe(row.academic_award || row.academicAward || row.alumniInformation?.academicAward),
    loyalty: safe(row.loyalty || row.alumniInformation?.loyalty),
  };
}


export function normalizeTransitioningAlumni(row = {}) {
  const normalized = normalizePreRegisteredAlumni(row);

  return {
    ...normalized,
    sourceType: "transitioning",
    status:
      row.status ||
      row.transition_status ||
      row.transitionStatus ||
      "transitioning",
    transitionStatus:
      row.transition_status ||
      row.transitionStatus ||
      row.status ||
      "pending",
  };
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function displayStatus(value) {
  const status = norm(value);
  if (status === "active") return "Active";
  if (status === "pre-registered" || status === "preregistered") return "Pre-Registered";
  if (status === "transitioning" || status === "pending-transition" || status === "pending") {
    return "Transitioning";
  }
  return "Deactivated";
}

const ALIASES = {
  studentId: [
    "studentid",
    "studentnumber",
    "studentno",
    "idnumber",
    "idno",
    "student",
  ],
  fullName: ["fullname", "studentname", "name", "completename"],
  firstName: ["firstname", "givenname", "first"],
  middleName: ["middlename", "middleinitial", "middle"],
  lastName: ["lastname", "surname", "familyname", "last"],
  nuEmail: ["nuemail", "officialemail", "school email", "schoolemail", "email", "universityemail"],
  personalEmail: ["personalemail", "alternateemail", "alternativeemail", "secondaryemail"],
  courseGraduated: [
    "coursegraduated",
    "course",
    "program",
    "academicprogram",
    "programcode",
    "coursecode",
  ],
  graduationPeriod: [
    "graduationperiod",
    "yeargraduated",
    "graduationyear",
    "batch",
    "year",
  ],
  academicAward: ["academicaward", "award", "honors", "honor", "latinaward"],
  loyalty: ["loyalty", "loyaltyaward"],
};

export function getRowValue(rawRow, field) {
  const aliases = ALIASES[field] || [normalizeHeader(field)];

  for (const [key, value] of Object.entries(rawRow || {})) {
    const normalizedKey = normalizeHeader(key);
    if (aliases.includes(normalizedKey)) return safe(value);
  }

  return "";
}

export function makeBulkRowKey(index) {
  return `bulk_alumni_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeBulkImportRow(rawRow, index) {
  const fullName = getRowValue(rawRow, "fullName");
  const splitName = splitFullName(fullName);
  const graduationPeriod = safe(getRowValue(rawRow, "graduationPeriod"));

  const firstName = getRowValue(rawRow, "firstName") || splitName.firstName;
  const middleName = getRowValue(rawRow, "middleName") || splitName.middleName;
  const lastName = getRowValue(rawRow, "lastName") || splitName.lastName;

  return {
    _rowKey: makeBulkRowKey(index),
    _sourceRowNumber: index + 2,
    studentId: formatStudentIdInput(getRowValue(rawRow, "studentId")),
    firstName: capitalizePerWord(firstName),
    middleName: capitalizePerWord(middleName),
    lastName: capitalizePerWord(lastName),
    nuEmail: norm(getRowValue(rawRow, "nuEmail")),
    personalEmail: norm(getRowValue(rawRow, "personalEmail")),
    courseGraduated: safe(getRowValue(rawRow, "courseGraduated")),
    courseGraduatedFullName: "",
    schoolProgram: "",
    schoolProgramFullName: "",
    graduationPeriod,
    yearGraduated: graduationPeriod,
    academicAward: safe(getRowValue(rawRow, "academicAward")),
    loyalty: safe(getRowValue(rawRow, "loyalty")),
  };
}

export function validateBulkImportRow(row) {
  const errors = [];

  if (!safe(row.studentId)) {
    errors.push("Missing Student ID");
  } else if (!validateStudentIdFormat(row.studentId)) {
    errors.push("Invalid Student ID format");
  }

  if (!safe(row.firstName)) errors.push("Missing First Name");
  if (!safe(row.lastName)) errors.push("Missing Last Name");

  if (!safe(row.nuEmail)) {
    errors.push("Missing NU Email");
  } else if (!validateEmailFormat(row.nuEmail)) {
    errors.push("Invalid NU Email");
  }

  if (safe(row.personalEmail) && !validateEmailFormat(row.personalEmail)) {
    errors.push("Invalid Personal Email");
  }

  if (!safe(row.courseGraduated)) errors.push("Missing Course/Program");
  if (!safe(row.graduationPeriod)) errors.push("Missing Graduation Period");

  return errors;
}

export function getFileDuplicateSummary(rows = []) {
  const seenStudentIds = new Map();
  const seenEmails = new Map();
  const duplicateRowKeys = new Set();

  rows.forEach((row) => {
    const studentId = norm(row.studentId);
    const nuEmail = norm(row.nuEmail);

    if (studentId) {
      if (seenStudentIds.has(studentId)) {
        duplicateRowKeys.add(row._rowKey);
        duplicateRowKeys.add(seenStudentIds.get(studentId));
      } else {
        seenStudentIds.set(studentId, row._rowKey);
      }
    }

    if (nuEmail) {
      if (seenEmails.has(nuEmail)) {
        duplicateRowKeys.add(row._rowKey);
        duplicateRowKeys.add(seenEmails.get(nuEmail));
      } else {
        seenEmails.set(nuEmail, row._rowKey);
      }
    }
  });

  return duplicateRowKeys;
}

function sheetToRawRowsWithHeaderDetection(workbook, sheetName) {
  const worksheet = workbook.Sheets?.[sheetName];
  if (!worksheet) return null;

  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });

  let bestHeader = null;

  matrix.forEach((row, rowIndex) => {
    const headers = (row || []).map(normalizeHeader);
    const hasStudentId = headers.some((item) => ALIASES.studentId.includes(item));
    const hasName =
      headers.some((item) => ALIASES.fullName.includes(item)) ||
      (headers.some((item) => ALIASES.firstName.includes(item)) &&
        headers.some((item) => ALIASES.lastName.includes(item)));
    const hasEmail = headers.some((item) => ALIASES.nuEmail.includes(item));
    const hasCourse = headers.some((item) => ALIASES.courseGraduated.includes(item));
    const hasGraduation = headers.some((item) => ALIASES.graduationPeriod.includes(item));

    if (!hasStudentId && !hasName && !hasEmail) return;

    const score =
      (hasStudentId ? 3 : 0) +
      (hasName ? 3 : 0) +
      (hasEmail ? 2 : 0) +
      (hasCourse ? 1 : 0) +
      (hasGraduation ? 1 : 0);

    if (!bestHeader || score > bestHeader.score) {
      bestHeader = { rowIndex, score };
    }
  });

  if (!bestHeader) return null;

  const headerRow = matrix[bestHeader.rowIndex] || [];
  const rows = matrix
    .slice(bestHeader.rowIndex + 1)
    .map((row, offset) => {
      const mapped = {};

      headerRow.forEach((header, columnIndex) => {
        const key = safe(header);
        if (!key) return;
        mapped[key] = row?.[columnIndex] ?? "";
      });

      mapped.__sheetName = sheetName;
      mapped.__sourceRowNumber = bestHeader.rowIndex + offset + 2;
      return mapped;
    })
    .filter((row) => {
      return (
        getRowValue(row, "studentId") ||
        getRowValue(row, "fullName") ||
        getRowValue(row, "firstName") ||
        getRowValue(row, "lastName") ||
        getRowValue(row, "nuEmail")
      );
    });

  return {
    sheetName,
    rows,
    score: bestHeader.score,
    headerRowIndex: bestHeader.rowIndex,
  };
}

export async function parseBulkAlumniFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  if (!workbook.SheetNames?.length) {
    throw new Error("The selected file has no readable sheet.");
  }

  const candidates = workbook.SheetNames
    .map((sheetName) => sheetToRawRowsWithHeaderDetection(workbook, sheetName))
    .filter((candidate) => candidate && candidate.rows.length > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.headerRowIndex - b.headerRowIndex;
    });

  const bestSheet = candidates[0];

  if (!bestSheet) {
    throw new Error(
      "No valid alumni pre-registration sheet was found. Please use columns such as Student ID, Full Name or Student Name, Course Graduated, Graduation Period, and NU Email.",
    );
  }

  return bestSheet.rows
    .map((rawRow, index) => {
      const normalized = normalizeBulkImportRow(rawRow, index);
      return {
        ...normalized,
        _sourceRowNumber: rawRow.__sourceRowNumber || index + 2,
        _sheetName: rawRow.__sheetName || bestSheet.sheetName,
      };
    })
    .filter((row) => {
      return safe(row.studentId) || safe(row.firstName) || safe(row.lastName) || safe(row.nuEmail);
    });
}

export function buildPreRegisteredAlumniPayload(row) {
  return {
    student_id: formatStudentIdInput(row.studentId),
    first_name: capitalizePerWord(row.firstName),
    middle_name: capitalizePerWord(row.middleName),
    last_name: capitalizePerWord(row.lastName),
    nu_email: norm(row.nuEmail),
    personal_email: norm(row.personalEmail),
    course_graduated: safe(row.courseGraduated),
    course_graduated_full_name: safe(row.courseGraduatedFullName),
    school_program: safe(row.schoolProgram),
    school_program_full_name: safe(row.schoolProgramFullName),
    graduation_period: safe(row.graduationPeriod),
    year_graduated: safe(row.graduationPeriod),
    academic_award: safe(row.academicAward),
    loyalty: safe(row.loyalty),
    role: "alumni",
    status: "pre-registered",
    claimed: false,
  };
}


export function buildTransitioningAlumniPayload(row) {
  return {
    source_type: safe(row.transitionSourceType || row.sourceType),
    source_id: row.sourceId || row.source_id || row.selectedIntern?.id || null,

    student_id: formatStudentIdInput(row.studentId),
    first_name: capitalizePerWord(row.firstName),
    middle_name: capitalizePerWord(row.middleName),
    last_name: capitalizePerWord(row.lastName),
    nu_email: norm(row.nuEmail),
    personal_email: norm(row.personalEmail),

    course_graduated: safe(row.courseGraduated || row.course),
    course_graduated_full_name: safe(row.courseGraduatedFullName || row.courseFullName),
    school_program: safe(row.schoolProgram || row.schoolProgramCode),
    school_program_full_name: safe(row.schoolProgramFullName),

    graduation_period: safe(row.graduationPeriod) || "For Transition",
    year_graduated: safe(row.yearGraduated || row.graduationPeriod),
    academic_award: safe(row.academicAward),
    loyalty: safe(row.loyalty),

    role: "alumni",
    status: "transitioning",
    transition_status: "pending",
  };
}
