// src/pages/intern_pages/InternRegisterPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  getPreRegisteredIntern,
  sendInternEmailOTP,
  verifyInternEmailOTP,
  resendInternEmailOTP,
  registerInternUser,
} from "../intern/services/InternRegistrationApi";

import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import { AnimatePresence, motion } from "framer-motion";

import {
  Mail,
  Lock,
  UserPlus,
  IdCard,
  ShieldCheck,
  LifeBuoy,
  Eye,
  EyeOff,
  BriefcaseBusiness,
} from "lucide-react";

import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import PageTitle from "../../../components/PageTitle";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import FooterLogo from "../../../assets/cropped-blue.png";
import NULogoCapBlue from "../../../assets/alumni-login/nuai-logo-blue.png";
import NULogoCapWhite from "../../../assets/alumni-login/nuai-logo-white.png";
import TermsAndConditions from "../../public/TermsAndConditions.jsx";
import Policy from "../../public/Policy.jsx";

/* =========================
   HELPERS
========================= */
function prettyFirebaseError(err) {
  let message = err?.message || "Something went wrong.";
  message = message.replace(/^FirebaseError:\s*/i, "");
  message = message.replace(/^\[.*?\]\s*/, "");
  return message;
}

function cooldownUntilFromWaitMessage(message) {
  const m = String(message || "").match(/wait\s+(\d+)\s*s/i);
  if (!m) return null;

  const seconds = Number(m[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  return Date.now() + seconds * 1000;
}

const isEmpty = (v) => String(v || "").trim() === "";

function sanitizeEmailInput(v) {
  return String(v || "").replace(/\s+/g, "").toLowerCase();
}

function sanitizeTextTrim(v) {
  return String(v || "").trim();
}

function sanitizePasswordSubmit(v) {
  return String(v || "").replace(/^\s+|\s+$/g, "");
}

function hasWhitespace(v) {
  return /\s/.test(String(v || ""));
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

function isValidStudentId(v) {
  return /^20\d{2}-\d{6,7}$/.test(String(v || ""));
}

function formatStudentIdTyping(value) {
  let v = String(value || "").replace(/\D/g, "");
  v = v.slice(0, 11);

  if (v.length <= 4) return v;

  return `${v.slice(0, 4)}-${v.slice(4)}`;
}

function cleanNamePart(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function buildFullName(record = {}) {
  if (record?.fullName) return cleanNamePart(record.fullName);

  return [
    cleanNamePart(record?.firstName),
    cleanNamePart(record?.middleName),
    cleanNamePart(record?.lastName),
  ]
    .filter(Boolean)
    .join(" ");
}

/* =========================
   PRECHECK RATE LIMIT
========================= */
const PRECHECK_RATE_LIMIT_KEY = "nuai_intern_precheck_rate_limit_global";
const PRECHECK_MAX_ATTEMPTS = 3;
const PRECHECK_BLOCK_MS = 60 * 1000;

function readPrecheckRateLimitStore() {
  try {
    const raw = localStorage.getItem(PRECHECK_RATE_LIMIT_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePrecheckRateLimitStore(store) {
  try {
    localStorage.setItem(PRECHECK_RATE_LIMIT_KEY, JSON.stringify(store || {}));
  } catch {}
}

function getPrecheckRateLimitEntry() {
  const store = readPrecheckRateLimitStore();

  return {
    attempts: Number(store.attempts || 0),
    blockedUntil: Number(store.blockedUntil || 0),
  };
}

function getPrecheckBlockedUntil() {
  const entry = getPrecheckRateLimitEntry();
  const blockedUntil = Number(entry?.blockedUntil || 0);

  if (!blockedUntil || blockedUntil <= Date.now()) return 0;

  return blockedUntil;
}

function registerPrecheckFailure() {
  const current = getPrecheckRateLimitEntry();
  const now = Date.now();

  if (Number(current.blockedUntil || 0) > now) {
    return {
      attempts: Number(current.attempts || PRECHECK_MAX_ATTEMPTS),
      blockedUntil: Number(current.blockedUntil || 0),
    };
  }

  const attempts = Number(current.attempts || 0) + 1;
  const blockedUntil =
    attempts >= PRECHECK_MAX_ATTEMPTS ? now + PRECHECK_BLOCK_MS : 0;

  const next = {
    attempts: blockedUntil ? PRECHECK_MAX_ATTEMPTS : attempts,
    blockedUntil,
  };

  writePrecheckRateLimitStore(next);

  return next;
}

function clearPrecheckRateLimit() {
  writePrecheckRateLimitStore({
    attempts: 0,
    blockedUntil: 0,
  });
}

/* =========================
   PASSWORD STRENGTH
========================= */
function passwordChecks(password) {
  const s = sanitizePasswordSubmit(password);

  return {
    length: s.length >= 8,
    uppercase: /[A-Z]/.test(s),
    lowercase: /[a-z]/.test(s),
    number: /\d/.test(s),
    special: /[^A-Za-z0-9]/.test(s),
  };
}

function passwordStrengthFromSanitized(password) {
  const s = sanitizePasswordSubmit(password);
  const checks = passwordChecks(s);
  const passed = Object.values(checks).filter(Boolean).length;

  if (s.length === 0) return { label: "—", level: 0 };
  if (passed <= 2) return { label: "Weak", level: 1 };
  if (passed <= 4) return { label: "Medium", level: 2 };

  return { label: "Strong", level: 3 };
}

function strengthClasses(level) {
  if (level === 0) {
    return {
      pill: "bg-black/5 text-black/50 border-black/10",
      bar: "w-0 bg-transparent",
    };
  }

  if (level === 1) {
    return {
      pill: "bg-red-50 text-red-700 border-red-200",
      bar: "w-1/3 bg-red-400",
    };
  }

  if (level === 2) {
    return {
      pill: "bg-yellow-50 text-yellow-700 border-yellow-200",
      bar: "w-2/3 bg-yellow-400",
    };
  }

  return {
    pill: "bg-green-50 text-green-700 border-green-200",
    bar: "w-full bg-green-500",
  };
}

function PasswordRule({ ok, text }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "inline-block h-2.5 w-2.5 rounded-full transition-all duration-200",
          ok ? "bg-green-500" : "bg-black/15",
        ].join(" ")}
      />
      <p
        className={[
          "text-[11px] font-semibold transition-all duration-200",
          ok ? "text-green-700" : "text-black/45",
        ].join(" ")}
      >
        {text}
      </p>
    </div>
  );
}

const STEPS = {
  PRECHECK: 1,
  CONFIRM_RECORD: 2,
  ACCOUNT_DETAILS: 3,
  OTP: 4,
  SUCCESS: 5,
};

const OTP_LEN = 6;

export default function InternRegisterPage() {
  const navigate = useNavigate();

  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);
  const [acceptedTermsAndPrivacy, setAcceptedTermsAndPrivacy] = useState(false);

  const [step, setStep] = useState(STEPS.PRECHECK);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");

  const [loadingPrecheck, setLoadingPrecheck] = useState(false);
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingVerifyRegister, setLoadingVerifyRegister] = useState(false);
  const [loadingResendOtp, setLoadingResendOtp] = useState(false);

  const loading =
    loadingPrecheck ||
    loadingSendOtp ||
    loadingVerifyRegister ||
    loadingResendOtp;

  const [form, setForm] = useState({
    studentId: "",
    nuEmail: "",
    password: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LEN).fill(""));
  const otpInputsRef = useRef([]);

  const [shellDocId, setShellDocId] = useState("");
  const [official, setOfficial] = useState(null);
  const [otpToken, setOtpToken] = useState("");

  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [tick, setTick] = useState(0);
  const [successRedirectAt, setSuccessRedirectAt] = useState(0);
  const [precheckBlockedUntil, setPrecheckBlockedUntil] = useState(0);

  const [touched, setTouched] = useState({
    studentId: false,
    nuEmail: false,
    password: false,
    confirmPassword: false,
    otp: false,
  });

  const pwRules = useMemo(() => passwordChecks(form.password), [form.password]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = useMemo(() => {
    void tick;
    return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
  }, [cooldownUntil, tick]);

  const redirectSecondsLeft = useMemo(() => {
    void tick;
    return Math.max(0, Math.ceil((successRedirectAt - Date.now()) / 1000));
  }, [successRedirectAt, tick]);

  const precheckSecondsLeft = useMemo(() => {
    void tick;
    return Math.max(
      0,
      Math.ceil((precheckBlockedUntil - Date.now()) / 1000),
    );
  }, [precheckBlockedUntil, tick]);

  const isPrecheckBlocked = precheckSecondsLeft > 0;
  const canResend = secondsLeft === 0;
  const resendLabel = canResend ? "Resend OTP" : `Resend in ${secondsLeft}s`;
  const canSendOtp = secondsLeft === 0;
  const sendOtpLabel = canSendOtp ? "SEND OTP" : `SEND OTP IN ${secondsLeft}s`;

  useEffect(() => {
    if (step !== STEPS.SUCCESS) return;

    const redirectAt = Date.now() + 5000;
    setSuccessRedirectAt(redirectAt);

    const timer = setTimeout(() => {
      navigate("/intern", { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [step, navigate]);

  useEffect(() => {
    const blockedUntil = getPrecheckBlockedUntil();
    setPrecheckBlockedUntil(blockedUntil);

    if (blockedUntil > Date.now()) {
      setErr("");
    }
  }, [tick]);

  useEffect(() => {
    if (step === STEPS.OTP) {
      setTimeout(() => {
        otpInputsRef.current?.[0]?.focus();
      }, 0);
    }
  }, [step]);

  /* =========================
     DERIVED / VALIDATION FLAGS
  ========================= */
  const studentIdEmpty = isEmpty(form.studentId);
  const nuEmailEmpty = isEmpty(form.nuEmail);

  const pwClean = useMemo(
    () => sanitizePasswordSubmit(form.password),
    [form.password],
  );
  const cpwClean = useMemo(
    () => sanitizePasswordSubmit(form.confirmPassword),
    [form.confirmPassword],
  );

  const passwordEmpty = isEmpty(pwClean);
  const confirmPasswordEmpty = isEmpty(cpwClean);
  const passwordTooShort = !pwRules.length;
  const passwordsMismatch =
    !passwordEmpty && !confirmPasswordEmpty && pwClean !== cpwClean;

  const otpCode = useMemo(() => otp.join(""), [otp]);
  const otpEmpty = isEmpty(otpCode);
  const otpReady = /^\d{6}$/.test(otpCode);

  const showStudentIdError = touched.studentId && studentIdEmpty;
  const showNuEmailError = touched.nuEmail && nuEmailEmpty;
  const showPasswordError =
    touched.password && (passwordEmpty || passwordTooShort);
  const showConfirmPasswordError =
    touched.confirmPassword && (confirmPasswordEmpty || passwordsMismatch);
  const otpInvalid = touched.otp && !otpEmpty && !/^\d{6}$/.test(otpCode);
  const showOtpError = touched.otp && otpEmpty;

  const studentIdInvalid =
    touched.studentId && !studentIdEmpty && !isValidStudentId(form.studentId);

  const nuEmailInvalid =
    touched.nuEmail &&
    !nuEmailEmpty &&
    (!isValidEmail(sanitizeEmailInput(form.nuEmail)) ||
      hasWhitespace(form.nuEmail));

  const pwStrength = useMemo(
    () => passwordStrengthFromSanitized(form.password),
    [form.password],
  );

  const pwStrengthUI = useMemo(
    () => strengthClasses(pwStrength.level),
    [pwStrength.level],
  );

  const isContinueDisabled =
    loadingPrecheck || isPrecheckBlocked || (studentIdEmpty && nuEmailEmpty);

  const canSubmitAccountDetails =
    !loadingSendOtp &&
    canSendOtp &&
    acceptedTermsAndPrivacy &&
    !passwordEmpty &&
    !confirmPasswordEmpty &&
    !passwordTooShort &&
    pwRules.uppercase &&
    pwRules.lowercase &&
    pwRules.number &&
    pwRules.special &&
    !passwordsMismatch;

  /* =========================
     CAROUSEL
  ========================= */
  const leftSlides = [
    {
      id: 0,
      eyebrow: "Verify Your Record",
      text: "Enter your Student ID and NU Email so we can confirm your pre-registered intern record.",
    },
    {
      id: 1,
      eyebrow: "Create Your Account",
      text: "Create a secure password for your NU-email-based intern account.",
    },
    {
      id: 2,
      eyebrow: "Finish Verification",
      text: "Complete OTP verification to activate your intern account and access NUAI services.",
    },
  ];

  const autoplay = useRef(
    Autoplay({
      delay: 3500,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  const [carouselApi, setCarouselApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    onSelect();
    carouselApi.on("select", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  /* =========================
     INPUT HANDLERS
  ========================= */
  function onChange(e) {
    const { name, value } = e.target;
    let next = value;

    if (name === "studentId") next = formatStudentIdTyping(value);
    if (name === "nuEmail") next = sanitizeEmailInput(value);

    setForm((prev) => ({ ...prev, [name]: next }));

    if (status) setStatus("");
    if (err && name !== "studentId" && name !== "nuEmail") setErr("");

    if (!touched[name]) {
      setTouched((t) => ({ ...t, [name]: true }));
    }
  }

  function onBlur(name) {
    setTouched((t) => ({ ...t, [name]: true }));
  }

  function validatePrecheckOrThrow() {
    const studentId = sanitizeTextTrim(form.studentId);
    const nuEmail = sanitizeEmailInput(form.nuEmail);

    if (!studentId || !nuEmail) {
      throw new Error("Fill the required fields.");
    }

    if (!isValidStudentId(studentId)) {
      throw new Error("Student ID must be in the format 20XX-XXXXXX.");
    }

    if (!isValidEmail(nuEmail) || hasWhitespace(nuEmail)) {
      throw new Error("Please enter a valid NU email.");
    }

    return { studentId, nuEmail };
  }

  function validatePasswordOrThrow() {
    const password = sanitizePasswordSubmit(form.password);
    const confirmPassword = sanitizePasswordSubmit(form.confirmPassword);

    if (!password || !confirmPassword) {
      throw new Error("Fill the required fields.");
    }

    const rules = passwordChecks(password);

    if (!rules.length) {
      throw new Error("Password must be at least 8 characters.");
    }

    if (
      !rules.uppercase ||
      !rules.lowercase ||
      !rules.number ||
      !rules.special
    ) {
      throw new Error(
        "Password must contain uppercase, lowercase, number, and special character.",
      );
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    return { password };
  }

  /* =========================
     STEP 1: PRE-CHECK
  ========================= */
  async function handleContinue() {
    setLoadingPrecheck(true);
    setStatus("");
    setErr("");

    setTouched((t) => ({
      ...t,
      studentId: true,
      nuEmail: true,
    }));

    if (studentIdEmpty || nuEmailEmpty) {
      setLoadingPrecheck(false);
      setErr("Fill the required fields.");
      return;
    }

    if (!isValidStudentId(form.studentId)) {
      setLoadingPrecheck(false);
      setErr("Student ID must be in the format 20XX-XXXXXX.");
      return;
    }

    try {
      const { studentId, nuEmail } = validatePrecheckOrThrow();

      const blockedUntil = getPrecheckBlockedUntil();
      if (blockedUntil > Date.now()) {
        setPrecheckBlockedUntil(blockedUntil);
        return;
      }

      const lookupRes = await getPreRegisteredIntern({ studentId, nuEmail });
      const data = lookupRes?.data;

      setShellDocId(data?.shellDocId || "");
      setOfficial(data?.official || null);

      if (!data?.shellDocId || !data?.official) {
        throw new Error(
          "No pre-registered intern record found for that Student ID and NU Email.",
        );
      }

      clearPrecheckRateLimit();
      setPrecheckBlockedUntil(0);
      setStep(STEPS.CONFIRM_RECORD);
    } catch (e) {
      const studentId = sanitizeTextTrim(form.studentId);
      const nuEmail = sanitizeEmailInput(form.nuEmail);

      const shouldTrackLookupFailure =
        !!studentId &&
        !!nuEmail &&
        isValidStudentId(studentId) &&
        isValidEmail(nuEmail) &&
        !hasWhitespace(nuEmail);

      if (shouldTrackLookupFailure) {
        const rateLimitResult = registerPrecheckFailure();
        const blockedUntil = Number(rateLimitResult?.blockedUntil || 0);

        if (blockedUntil > Date.now()) {
          setPrecheckBlockedUntil(blockedUntil);
          setLoadingPrecheck(false);
          return;
        }
      }

      setErr(prettyFirebaseError(e));
    } finally {
      setLoadingPrecheck(false);
    }
  }

  function handleConfirmOfficialRecord() {
    setStatus("");
    setErr("");
    setStep(STEPS.ACCOUNT_DETAILS);
  }

  /* =========================
     STEP 2: PASSWORD THEN SEND OTP
  ========================= */
  async function handleSendOtpAfterPassword() {
    if (!canSendOtp) {
      setErr(`Please wait ${secondsLeft}s before requesting another OTP.`);
      return;
    }

    setLoadingSendOtp(true);
    setStatus("");
    setErr("");

    setTouched((t) => ({
      ...t,
      password: true,
      confirmPassword: true,
    }));

    try {
      validatePasswordOrThrow();

      const studentId = sanitizeTextTrim(form.studentId);
      const nuEmail = sanitizeEmailInput(form.nuEmail);

      if (!shellDocId) {
        throw new Error("Missing pre-registration reference. Go back and try again.");
      }

      await sendInternEmailOTP({
        shellDocId,
        studentId,
        nuEmail,
      });

      setStep(STEPS.OTP);
      resetOtpBoxes();
      setCooldownUntil(Date.now() + 60_000);
      setStatus("Enter any 6-digit code to continue. Email authentication is disabled for this build.");
    } catch (e) {
      setErr(prettyFirebaseError(e));
    } finally {
      setLoadingSendOtp(false);
    }
  }

  async function handleResendOtp() {
    if (!canResend || loadingResendOtp || loadingVerifyRegister) return;

    setLoadingResendOtp(true);
    setStatus("");
    setErr("");

    try {
      await resendInternEmailOTP({
        shellDocId,
        studentId: sanitizeTextTrim(form.studentId),
        nuEmail: sanitizeEmailInput(form.nuEmail),
      });

      resetOtpBoxes();
      setCooldownUntil(Date.now() + 60_000);
      setStatus("Enter any new 6-digit code to continue. Email authentication is disabled for this build.");
    } catch (e) {
      const synced = cooldownUntilFromWaitMessage(e?.message);
      setCooldownUntil(synced || 0);
      setErr(prettyFirebaseError(e));
    } finally {
      setLoadingResendOtp(false);
    }
  }

  /* =========================
     STEP 3: VERIFY OTP + REGISTER
  ========================= */
  async function handleVerifyAndRegister() {
    setLoadingVerifyRegister(true);
    setStatus("");
    setErr("");

    setTouched((t) => ({ ...t, otp: true }));

    try {
      const code = otpCode.trim();
      const nuEmail = sanitizeEmailInput(form.nuEmail);
      const { password } = validatePasswordOrThrow();

      if (!/^\d{6}$/.test(code)) {
        throw new Error("OTP must be 6 digits.");
      }

      if (!shellDocId) {
        throw new Error("Missing pre-registration reference. Go back and try again.");
      }

      const res = await verifyInternEmailOTP({
        shellDocId,
        nuEmail,
        otp: code,
      });

      const verifiedOtpToken = res?.data?.otpToken;

      if (!verifiedOtpToken) {
        throw new Error("Verification token was not returned.");
      }

      setOtpToken(verifiedOtpToken);

      const registerRes = await registerInternUser({
        shellDocId,
        nuEmail,
        password,
        otpToken: verifiedOtpToken,
      });

      const account = registerRes?.data?.account || null;

      if (account) {
        try {
          localStorage.setItem(
            "nuai_account",
            JSON.stringify({
              id: account.id,
              email: account.email || nuEmail,
              role: account.role || "intern",
              status: account.status || "active",
            }),
          );
        } catch {}
      }

      setStatus("");
      setErr("");
      setStep(STEPS.SUCCESS);
    } catch (e) {
      setErr(prettyFirebaseError(e));
    } finally {
      setLoadingVerifyRegister(false);
    }
  }

  function resetOtpBoxes() {
    setOtp(Array(OTP_LEN).fill(""));
    setTouched((t) => ({ ...t, otp: false }));

    setTimeout(() => {
      otpInputsRef.current?.[0]?.focus();
    }, 0);
  }

  const handleOtpChange = (idx, value) => {
    const v = value.replace(/\D/g, "");
    const current = Array.isArray(otp) ? otp : Array(OTP_LEN).fill("");

    if (!v) {
      const next = [...current];
      next[idx] = "";
      setOtp(next);

      if (!touched.otp) {
        setTouched((t) => ({ ...t, otp: true }));
      }

      if (status) setStatus("");
      if (err) setErr("");

      return;
    }

    const chars = v.split("");
    const next = [...current];

    for (let i = 0; i < chars.length; i++) {
      if (idx + i >= OTP_LEN) break;
      next[idx + i] = chars[i];
    }

    setOtp(next);

    const nextIndex = Math.min(idx + chars.length, OTP_LEN - 1);
    otpInputsRef.current?.[nextIndex]?.focus();

    if (!touched.otp) {
      setTouched((t) => ({ ...t, otp: true }));
    }

    if (status) setStatus("");
    if (err) setErr("");
  };

  const handleOtpKeyDown = (idx, e) => {
    const current = Array.isArray(otp) ? otp : Array(OTP_LEN).fill("");

    if (e.key === "Backspace") {
      if (current[idx]) {
        const next = [...current];
        next[idx] = "";
        setOtp(next);
        return;
      }

      if (idx > 0) otpInputsRef.current?.[idx - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && idx > 0) {
      otpInputsRef.current?.[idx - 1]?.focus();
    }

    if (e.key === "ArrowRight" && idx < OTP_LEN - 1) {
      otpInputsRef.current?.[idx + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();

    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LEN);

    if (!text) return;

    const next = Array(OTP_LEN).fill("");

    text.split("").forEach((c, i) => {
      next[i] = c;
    });

    setOtp(next);
    setTouched((t) => ({ ...t, otp: true }));

    if (status) setStatus("");
    if (err) setErr("");

    const focusIdx = Math.min(text.length, OTP_LEN - 1);
    otpInputsRef.current?.[focusIdx]?.focus();
  };

  const stepTitle =
    step === STEPS.PRECHECK
      ? "Verify your intern record"
      : step === STEPS.CONFIRM_RECORD
        ? "Confirm your official record"
        : step === STEPS.ACCOUNT_DETAILS
          ? "Complete registration"
          : step === STEPS.OTP
            ? "Verify your NU email"
            : "Registration complete";

  const stepDescription =
    step === STEPS.PRECHECK
      ? "Enter your Student ID and NU Email to continue with registration."
      : step === STEPS.CONFIRM_RECORD
        ? "Review the matched pre-registered intern record before continuing."
        : step === STEPS.ACCOUNT_DETAILS
          ? "Create a secure password. Your OTP will be sent to your NU email."
          : step === STEPS.OTP
            ? "Enter the 6-digit code sent to your NU email."
            : "Your intern account is ready.";

  const fullName = buildFullName(official);

  const primaryActionBtn =
    "mt-1 h-11 w-full font-semibold text-white cursor-pointer bg-nu-blue hover:bg-nu-blue/90";

  const primaryActionBtnDisabled =
    "mt-1 h-11 w-full font-semibold text-white cursor-not-allowed bg-nu-blue/60 hover:bg-nu-blue/60";

  const secondaryActionBtn =
    "mt-1 h-11 w-full font-semibold cursor-pointer border border-nu-blue/30 bg-white text-nu-blue hover:bg-nu-blue/5 hover:text-nu-blue";

  const secondaryActionBtnDisabled =
    "mt-1 h-11 w-full font-semibold cursor-not-allowed border border-nu-blue/15 bg-white text-nu-blue/40 hover:bg-white hover:text-nu-blue/40";

  const cardHeights = {
    [STEPS.PRECHECK]: "min-h-[72vh] lg:min-h-[78vh]",
    [STEPS.CONFIRM_RECORD]: "min-h-[82vh] lg:min-h-[88vh]",
    [STEPS.ACCOUNT_DETAILS]: "min-h-[92vh] lg:min-h-[98vh]",
    [STEPS.OTP]: "min-h-[80vh] lg:min-h-[86vh]",
    [STEPS.SUCCESS]: "min-h-[72vh] lg:min-h-[78vh]",
  };

  return (
    <>
      <PageTitle title="Intern Register | NUAI" />
      <Header logoSrc={NULogoCapBlue} homeTo="/" />

      <main className="min-h-screen bg-slate-50 shadow-2xl">
        <div className="mx-auto max-w-[1600px] px-8 py-10">
          <Card
            className={[
              "flex flex-col rounded-3xl border-0 bg-nu-blue px-5 py-8 shadow-lg transition-[min-height] duration-300 ease-in-out",
              cardHeights[step],
            ].join(" ")}
          >
            <div className="mx-auto grid w-full flex-1 gap-8 lg:grid-cols-2 lg:items-stretch">
              <div className="flex h-full min-h-0 flex-col justify-center rounded-3xl px-8 py-8 text-white lg:px-10">
                <div className="flex max-w-xl flex-col">
                  <h1 className="mt-3 select-none text-4xl font-bold leading-tight text-nu-gold lg:text-4xl">
                    NU ALUMNI INFORMATION
                  </h1>

                  <h1 className="mt-3 select-none text-4xl font-bold leading-tight lg:text-4xl">
                    INTERN REGISTER PAGE
                  </h1>

                  <p className="mt-6 max-w-lg select-none text-base leading-8 text-white/85">
                    Create your intern account securely by verifying your
                    pre-registered record, setting your password, and completing
                    NU email verification.
                  </p>

                  <div className="mt-8">
                    <Carousel
                      setApi={setCarouselApi}
                      plugins={[autoplay.current]}
                      opts={{
                        align: "start",
                        loop: true,
                      }}
                      className="w-full"
                      onMouseEnter={autoplay.current.stop}
                      onMouseLeave={autoplay.current.reset}
                    >
                      <CarouselContent>
                        {leftSlides.map((slide) => (
                          <CarouselItem key={slide.id}>
                            <div className="flex min-h-[150px] select-none flex-col justify-center rounded-[28px] border border-white/10 bg-white/8 px-6 py-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/12">
                              <p className="text-lg font-bold text-white">
                                {slide.eyebrow}
                              </p>

                              <p className="mt-3 text-sm leading-7 text-white/85">
                                {slide.text}
                              </p>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>

                      <div className="mt-6 flex w-full items-center justify-center gap-2">
                        {leftSlides.map((slide, index) => (
                          <button
                            key={slide.id}
                            type="button"
                            aria-label={`Go to slide ${index + 1}`}
                            onClick={() => carouselApi?.scrollTo(index)}
                            className={[
                              "rounded-full transition-all duration-300",
                              currentSlide === index
                                ? "h-2.5 w-2.5 bg-nu-gold"
                                : "h-2.5 w-2.5 bg-white/40 hover:bg-white/70",
                            ].join(" ")}
                          />
                        ))}
                      </div>
                    </Carousel>
                  </div>

                  <div className="pt-6">
                    <div className="h-0.5 w-full rounded-full bg-nu-gold" />
                  </div>
                </div>
              </div>

              <div className="flex h-full min-h-0 rounded-3xl bg-white px-6 py-8 shadow-2xl lg:px-24">
                <CardContent className="flex h-full w-full flex-col justify-center p-0">
                  <div className="mb-6 flex flex-col items-center text-center">
                    <img
                      src={NULogoCapWhite}
                      alt="NUAI Logo"
                      className="mb-3 w-35 object-contain"
                    />

                    <h2 className="text-xl font-bold text-nu-blue lg:text-3xl">
                      {stepTitle}
                    </h2>

                    <p className="mt-2 max-w-sm text-base leading-6 text-nu-blue/80">
                      {stepDescription}
                    </p>
                  </div>

                  {status && step !== STEPS.SUCCESS ? (
                    <div className="mb-4 rounded-xl border border-black/10 bg-white px-4 py-3 text-xs text-black/60">
                      {status}
                    </div>
                  ) : null}

                  <div className="relative min-h-[230px]">
                    <AnimatePresence mode="wait">
                      {step === STEPS.PRECHECK && (
                        <motion.form
                          key="precheck"
                          layout
                          noValidate
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleContinue();
                          }}
                          className="w-full"
                          initial={{ x: 80, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -80, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="grid gap-1">
                              <Label
                                htmlFor="studentId"
                                className="text-nu-blue"
                              >
                                Student ID <span className="text-red-500">*</span>
                              </Label>

                              <div className="relative">
                                <IdCard className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nu-blue/50" />
                                <Input
                                  id="studentId"
                                  name="studentId"
                                  placeholder="20XX-XXXXXX"
                                  value={form.studentId}
                                  onChange={onChange}
                                  onBlur={() => onBlur("studentId")}
                                  inputMode="numeric"
                                  className={[
                                    "h-11 border border-nu-blue/20 bg-white pl-12 outline-none placeholder:text-nu-blue/35 transition-all duration-200 hover:border-nu-blue/40 hover:bg-nu-blue/5 focus-visible:border-nu-blue focus-visible:ring-2 focus-visible:ring-nu-blue/20",
                                    showStudentIdError || studentIdInvalid
                                      ? "border-red-500"
                                      : "border-nu-blue/20",
                                  ].join(" ")}
                                />
                              </div>

                              <div
                                className={[
                                  "transition-all duration-200 ease-out",
                                  showStudentIdError || studentIdInvalid
                                    ? "max-h-6 opacity-100"
                                    : "max-h-0 opacity-0",
                                ].join(" ")}
                              >
                                <p className="pt-1 text-[11px] font-semibold text-red-600">
                                  {studentIdEmpty
                                    ? "Student ID is required."
                                    : "Format must be 20XX-XXXXXX."}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-1">
                              <Label htmlFor="nuEmail" className="text-nu-blue">
                                NU Email <span className="text-red-500">*</span>
                              </Label>

                              <div className="relative">
                                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nu-blue/50" />
                                <Input
                                  id="nuEmail"
                                  name="nuEmail"
                                  type="email"
                                  placeholder="Enter your NU email address"
                                  value={form.nuEmail}
                                  onChange={onChange}
                                  onBlur={() => onBlur("nuEmail")}
                                  className={[
                                    "h-11 border border-nu-blue/20 bg-white pl-12 outline-none placeholder:text-nu-blue/35 transition-all duration-200 hover:border-nu-blue/40 hover:bg-nu-blue/5 focus-visible:border-nu-blue focus-visible:ring-2 focus-visible:ring-nu-blue/20",
                                    showNuEmailError || nuEmailInvalid
                                      ? "border-red-500"
                                      : "border-nu-blue/20",
                                  ].join(" ")}
                                />
                              </div>

                              <div
                                className={[
                                  "transition-all duration-200 ease-out",
                                  showNuEmailError || nuEmailInvalid
                                    ? "max-h-6 opacity-100"
                                    : "max-h-0 opacity-0",
                                ].join(" ")}
                              >
                                <p className="pt-1 text-[11px] font-semibold text-red-600">
                                  {showNuEmailError
                                    ? "NU Email is required."
                                    : "Please enter a valid NU email."}
                                </p>
                              </div>
                            </div>

                            {isPrecheckBlocked ? (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
                                Too many requests. Please try again after{" "}
                                {precheckSecondsLeft}s.
                              </div>
                            ) : (
                              <div
                                className={[
                                  "transition-all duration-200 ease-out",
                                  err
                                    ? "max-h-24 opacity-100"
                                    : "max-h-0 opacity-0",
                                ].join(" ")}
                              >
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                                  {err}
                                </div>
                              </div>
                            )}

                            <Button
                              type="submit"
                              disabled={isContinueDisabled}
                              className={
                                isContinueDisabled
                                  ? primaryActionBtnDisabled
                                  : primaryActionBtn
                              }
                            >
                              {loadingPrecheck
                                ? "Checking record..."
                                : isPrecheckBlocked
                                  ? `TRY AGAIN IN ${precheckSecondsLeft}s`
                                  : "CONTINUE"}
                            </Button>

                            <p className="text-center mt-10 text-xs text-nu-blue/70">
                              Already have an account?{" "}
                              <Link
                                to="/intern"
                                className="font-semibold text-nu-blue/80 hover:text-nu-blue"
                              >
                                Login here
                              </Link>
                            </p>
                          </div>
                        </motion.form>
                      )}

                      {step === STEPS.CONFIRM_RECORD && official && (
                        <motion.div
                          key="confirm-record"
                          className="w-full"
                          initial={{ x: 80, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -80, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                        >
                          <div className="rounded-2xl border border-black/8 bg-white">
                            <div className="space-y-5 px-6 py-6 text-sm">
                              <RecordRow
                                label="Student ID"
                                value={official.studentId}
                              />
                              <RecordRow label="Full Name" value={fullName} />
                              <RecordRow label="Gender" value={official.gender} />
                              <RecordRow label="Course" value={official.course} />
                              <RecordRow
                                label="NU Email"
                                value={official.nuEmail}
                              />

                              <p className="pt-1 text-[12px] leading-relaxed text-black/60">
                                If the record shown is not you, please go back
                                and double-check your Student ID and NU Email.
                              </p>

                              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                                <Button
                                  type="button"
                                  onClick={() => {
                                    setStep(STEPS.PRECHECK);
                                    setStatus("");
                                    setErr("");
                                  }}
                                  variant="outline"
                                  className={secondaryActionBtn}
                                >
                                  BACK
                                </Button>

                                <Button
                                  type="button"
                                  onClick={handleConfirmOfficialRecord}
                                  className={primaryActionBtn}
                                >
                                  CONTINUE
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {step === STEPS.ACCOUNT_DETAILS && (
                        <motion.div
                          key="account-details"
                          className="w-full"
                          initial={{ x: 80, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -80, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="rounded-2xl border border-black/8 bg-white p-4 text-sm">
                              <RecordRow label="Full Name" value={fullName} />
                              <RecordRow
                                label="Account Email"
                                value={official?.nuEmail}
                              />
                            </div>

                            <div className="grid gap-1">
                              <Label
                                htmlFor="password"
                                className="text-nu-blue"
                              >
                                Password <span className="text-red-500">*</span>
                              </Label>

                              <div className="relative">
                                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nu-blue/50" />

                                <Input
                                  id="password"
                                  name="password"
                                  type={showPasswords ? "text" : "password"}
                                  placeholder="Create a password"
                                  value={form.password}
                                  onChange={onChange}
                                  onBlur={() => onBlur("password")}
                                  className={[
                                    "h-11 border border-nu-blue/20 bg-white pl-12 pr-12 outline-none placeholder:text-nu-blue/35 transition-all duration-200 hover:border-nu-blue/40 hover:bg-nu-blue/5 focus-visible:border-nu-blue focus-visible:ring-2 focus-visible:ring-nu-blue/20",
                                    showPasswordError
                                      ? "border-red-500"
                                      : "border-nu-blue/20",
                                  ].join(" ")}
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPasswords((v) => !v)}
                                  aria-label={
                                    showPasswords
                                      ? "Hide passwords"
                                      : "Show passwords"
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-nu-blue/60 transition hover:bg-nu-blue/5 hover:text-nu-blue"
                                >
                                  {showPasswords ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>

                              <div className="mt-2 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-[11px] font-extrabold text-black/60">
                                    Password strength
                                  </p>

                                  <span
                                    className={[
                                      "rounded-full border px-3 py-1 text-[11px] font-extrabold",
                                      pwStrengthUI.pill,
                                    ].join(" ")}
                                  >
                                    {pwStrength.label}
                                  </span>
                                </div>

                                <div className="h-2 w-full rounded-full bg-black/10">
                                  <div
                                    className={[
                                      "h-full transition-all duration-200",
                                      pwStrengthUI.bar,
                                    ].join(" ")}
                                  />
                                </div>

                                <div className="grid gap-1.5 rounded-xl border border-black/8 bg-black/[0.02] p-3">
                                  <PasswordRule
                                    ok={pwRules.length}
                                    text="At least 8 characters"
                                  />
                                  <PasswordRule
                                    ok={pwRules.uppercase}
                                    text="Must contain uppercase"
                                  />
                                  <PasswordRule
                                    ok={pwRules.lowercase}
                                    text="Must contain lowercase"
                                  />
                                  <PasswordRule
                                    ok={pwRules.number}
                                    text="Must contain number"
                                  />
                                  <PasswordRule
                                    ok={pwRules.special}
                                    text="Must contain special character"
                                  />
                                </div>
                              </div>

                              <div
                                className={[
                                  "transition-all duration-200 ease-out",
                                  showPasswordError
                                    ? "max-h-10 opacity-100"
                                    : "max-h-0 opacity-0",
                                ].join(" ")}
                              >
                                <p className="pt-1 text-[11px] font-semibold text-red-600">
                                  {passwordEmpty
                                    ? "Password is required."
                                    : "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-1 mt-2">
                              <Label
                                htmlFor="confirmPassword"
                                className="text-nu-blue"
                              >
                                Confirm Password{" "}
                                <span className="text-red-500">*</span>
                              </Label>

                              <div className="relative">
                                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nu-blue/50" />

                                <Input
                                  id="confirmPassword"
                                  name="confirmPassword"
                                  type={showPasswords ? "text" : "password"}
                                  placeholder="Re-enter your password"
                                  value={form.confirmPassword}
                                  onChange={onChange}
                                  onBlur={() => onBlur("confirmPassword")}
                                  className={[
                                    "h-11 border border-nu-blue/20 bg-white pl-12 pr-12 outline-none placeholder:text-nu-blue/35 transition-all duration-200 hover:border-nu-blue/40 hover:bg-nu-blue/5 focus-visible:border-nu-blue focus-visible:ring-2 focus-visible:ring-nu-blue/20",
                                    showConfirmPasswordError
                                      ? "border-red-500"
                                      : "border-nu-blue/20",
                                  ].join(" ")}
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPasswords((v) => !v)}
                                  aria-label={
                                    showPasswords
                                      ? "Hide passwords"
                                      : "Show passwords"
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-nu-blue/60 transition hover:bg-nu-blue/5 hover:text-nu-blue"
                                >
                                  {showPasswords ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>

                              <div
                                className={[
                                  "transition-all duration-200 ease-out",
                                  showConfirmPasswordError
                                    ? "max-h-6 opacity-100"
                                    : "max-h-0 opacity-0",
                                ].join(" ")}
                              >
                                <p className="pt-1 text-[11px] font-semibold text-red-600">
                                  {confirmPasswordEmpty
                                    ? "Confirm password is required."
                                    : "Passwords do not match."}
                                </p>
                              </div>
                            </div>

                            <div
                              className={[
                                "transition-all duration-200 ease-out",
                                err ? "max-h-24 opacity-100" : "max-h-0 opacity-0",
                              ].join(" ")}
                            >
                              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                                {err}
                              </div>
                            </div>

                            <div className="mt-3 rounded-xl border border-black/8 bg-black/[0.02] p-4">
                              <div className="flex items-start gap-3 text-[11px] leading-relaxed text-black/60">
                                <input
                                  id="acceptTermsAndPrivacy"
                                  type="checkbox"
                                  checked={acceptedTermsAndPrivacy}
                                  onChange={(e) =>
                                    setAcceptedTermsAndPrivacy(e.target.checked)
                                  }
                                  className="mt-0.5 h-4 w-4 shrink-0 accent-nu-blue"
                                />

                                <p>
                                  <label
                                    htmlFor="acceptTermsAndPrivacy"
                                    className="cursor-pointer"
                                  >
                                    I accept the
                                  </label>{" "}

                                  <Dialog open={openTerms} onOpenChange={setOpenTerms}>
                                    <DialogTrigger asChild>
                                      <button
                                        type="button"
                                        className="font-semibold cursor-pointer text-nu-blue underline underline-offset-2 hover:text-nu-blue/80"
                                      >
                                        Terms & Conditions
                                      </button>
                                    </DialogTrigger>
                                    <TermsAndConditions />
                                  </Dialog>{" "}

                                  <label
                                    htmlFor="acceptTermsAndPrivacy"
                                    className="cursor-pointer"
                                  >
                                    and
                                  </label>{" "}

                                  <Dialog
                                    open={openPrivacy}
                                    onOpenChange={setOpenPrivacy}
                                  >
                                    <DialogTrigger asChild>
                                      <button
                                        type="button"
                                        className="font-semibold cursor-pointer text-nu-blue underline underline-offset-2 hover:text-nu-blue/80"
                                      >
                                        Privacy Policy
                                      </button>
                                    </DialogTrigger>
                                    <Policy />
                                  </Dialog>
                                  .
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                        
                              <Button
                                type="button"
                                disabled={loadingSendOtp}
                                onClick={() => {
                                  setStep(STEPS.CONFIRM_RECORD);
                                  setStatus("");
                                  setErr("");
                                }}
                                variant="outline"
                                className={
                                  loadingSendOtp
                                    ? secondaryActionBtnDisabled
                                    : secondaryActionBtn
                                }
                              >
                                BACK
                              </Button>

                              <Button
                                type="button"
                                onClick={handleSendOtpAfterPassword}
                                disabled={!canSubmitAccountDetails}
                                className={
                                  !canSubmitAccountDetails
                                    ? primaryActionBtnDisabled
                                    : primaryActionBtn
                                }
                              >
                                {loadingSendOtp ? "Sending OTP..." : sendOtpLabel}
                              </Button>
                            </div>

                            
                          </div>
                        </motion.div>
                      )}

                      {step === STEPS.OTP && (
                        <motion.div
                          key="otp"
                          className="w-full"
                          initial={{ x: 80, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -80, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                        >
                          <div className="flex flex-col gap-4">
                            <div
                              className={[
                                "transition-all duration-200 ease-out",
                                err ? "max-h-24 opacity-100" : "max-h-0 opacity-0",
                              ].join(" ")}
                            >
                              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                                {err}
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label className="text-nu-blue">
                                OTP Code <span className="text-red-500">*</span>
                              </Label>

                              <div
                                className="mt-2 flex justify-center gap-3 sm:gap-4"
                                onPaste={handleOtpPaste}
                              >
                                {otp.map((digit, idx) => (
                                  <input
                                    key={idx}
                                    ref={(el) =>
                                      (otpInputsRef.current[idx] = el)
                                    }
                                    value={digit}
                                    onChange={(e) =>
                                      handleOtpChange(idx, e.target.value)
                                    }
                                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                    onBlur={() =>
                                      setTouched((t) => ({ ...t, otp: true }))
                                    }
                                    inputMode="numeric"
                                    autoComplete={
                                      idx === 0 ? "one-time-code" : "off"
                                    }
                                    maxLength={1}
                                    disabled={
                                      loadingResendOtp || loadingVerifyRegister
                                    }
                                    className={[
                                      "h-12 w-12 rounded-xl border bg-white text-center text-lg font-extrabold text-nu-blue shadow-sm outline-none transition-all duration-200",
                                      "focus:border-nu-blue focus-visible:ring-2 focus-visible:ring-nu-blue/20",
                                      touched.otp && showOtpError
                                        ? "border-red-400"
                                        : "border-black/10",
                                      loadingResendOtp || loadingVerifyRegister
                                        ? "opacity-70"
                                        : "",
                                    ].join(" ")}
                                  />
                                ))}
                              </div>

                              {showOtpError || otpInvalid ? (
                                <div className="text-center text-[11px] font-semibold text-red-600">
                                  {showOtpError
                                    ? "OTP is required."
                                    : "OTP must be 6 digits."}
                                </div>
                              ) : null}

                              <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-black/8 bg-black/[0.02] px-4 py-3">
                                <p className="text-[11px] text-black/60">
                                  Didn’t receive the code?
                                </p>

                                <button
                                  type="button"
                                  onClick={handleResendOtp}
                                  disabled={
                                    !canResend ||
                                    loadingResendOtp ||
                                    loadingVerifyRegister
                                  }
                                  className={[
                                    "text-[11px] font-extrabold transition",
                                    !canResend ||
                                    loadingResendOtp ||
                                    loadingVerifyRegister
                                      ? "cursor-not-allowed text-black/35"
                                      : "cursor-pointer text-nu-blue hover:text-nu-blue/80",
                                  ].join(" ")}
                                >
                                  {loadingResendOtp ? "Resending..." : resendLabel}
                                </button>
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
          
                              <Button
                                type="button"
                                disabled={loadingVerifyRegister || loadingResendOtp}
                                onClick={() => {
                                  resetOtpBoxes();
                                  setStatus("");
                                  setErr("");
                                  setStep(STEPS.ACCOUNT_DETAILS);
                                }}
                                variant="outline"
                                className={
                                  loadingVerifyRegister || loadingResendOtp
                                    ? secondaryActionBtnDisabled
                                    : secondaryActionBtn
                                }
                              >
                                BACK
                              </Button>

                              <Button
                                onClick={handleVerifyAndRegister}
                                disabled={loadingVerifyRegister || !otpReady}
                                type="button"
                                className={
                                  loadingVerifyRegister || !otpReady
                                    ? primaryActionBtnDisabled
                                    : primaryActionBtn
                                }
                              >
                                {loadingVerifyRegister
                                  ? "Creating account..."
                                  : "VERIFY & CREATE ACCOUNT"}
                              </Button>
                            </div>

                            <p className="text-[11px] leading-relaxed text-black/55">
                              By registering, you confirm that the information
                              provided is accurate and belongs to you in
                              accordance with NU Data Privacy policies.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {step === STEPS.SUCCESS && (
                        <motion.div
                          key="success"
                          className="w-full"
                          initial={{ x: 80, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -80, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                        >
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                              <BriefcaseBusiness className="h-8 w-8 text-green-600" />
                            </div>

                            <p className="mt-2 text-sm text-black/60">
                              Redirecting to your intern dashboard in {redirectSecondsLeft}s...
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>

          <div className="mt-10">
            <div className="mb-6 h-0.5 w-full rounded-full bg-nu-gold" />

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="h-full">
                <Card className="group h-full nu-card-hover hover:bg-[#e2f0ff]">
                  <CardContent className="flex h-full flex-col px-6 pb-6 pt-4">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="nu-icon-hover flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm group-hover:scale-105">
                        <ShieldCheck className="h-5 w-5 text-nu-blue" />
                      </div>

                      <p className="text-base font-extrabold tracking-wide text-nu-blue">
                        VERIFY RECORD
                      </p>
                    </div>

                    <div className="mb-4 h-0.5 w-full rounded-full bg-black/10" />

                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-nu-blue">
                        Start with your official details
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-black/60">
                        Make sure your Student ID and NU Email match your
                        pre-registered intern record before continuing.
                      </p>
                    </div>

                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => setStep(STEPS.PRECHECK)}
                      className={`mt-5 w-full rounded-md py-3 text-xs font-extrabold text-white ${
                        loading
                          ? "cursor-not-allowed bg-[#5CB85C]/60 hover:bg-[#5CB85C]/60"
                          : "cursor-pointer bg-[#5CB85C] hover:bg-[#4cae4f]"
                      }`}
                    >
                      START REGISTRATION
                    </Button>
                  </CardContent>
                </Card>
              </section>

              <section className="h-full">
                <Card className="group h-full nu-card-hover hover:bg-[#e2f0ff]">
                  <CardContent className="flex h-full flex-col px-6 pb-6 pt-4">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="nu-icon-hover flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm group-hover:scale-105">
                        <LifeBuoy className="h-5 w-5 text-nu-blue" />
                      </div>

                      <p className="text-base font-extrabold tracking-wide text-nu-blue">
                        NEED HELP
                      </p>
                    </div>

                    <div className="mb-4 h-0.5 w-full rounded-full bg-black/10" />

                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-nu-blue">
                        Having trouble registering?
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-black/60">
                        If you can’t continue, double-check your information and
                        contact the NU office for assistance.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="mt-5 w-full cursor-pointer rounded-md bg-[#5CB85C] py-3 text-xs font-extrabold text-white hover:bg-[#4cae4f]"
                    >
                      BACK TO LOGIN
                    </Button>
                  </CardContent>
                </Card>
              </section>

              <section className="h-full">
                <Card className="group h-full nu-card-hover hover:bg-[#e2f0ff]">
                  <CardContent className="flex h-full flex-col px-6 pb-6 pt-4">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="nu-icon-hover flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm group-hover:scale-105">
                        <UserPlus className="h-5 w-5 text-nu-blue" />
                      </div>

                      <p className="text-base font-extrabold tracking-wide text-nu-blue">
                        ALREADY REGISTERED
                      </p>
                    </div>

                    <div className="mb-4 h-0.5 w-full rounded-full bg-black/10" />

                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-nu-blue">
                        Already created an account?
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-black/60">
                        Sign in to access intern services, profile updates, and
                        announcements from NUAI.
                      </p>
                    </div>

                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => navigate("/login")}
                      className={`mt-5 w-full rounded-md py-3 text-xs font-extrabold text-white ${
                        loading
                          ? "cursor-not-allowed bg-[#5CB85C]/60 hover:bg-[#5CB85C]/60"
                          : "cursor-pointer bg-[#5CB85C] hover:bg-[#4cae4f]"
                      }`}
                    >
                      LOGIN
                    </Button>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer logoSrc={FooterLogo} />
    </>
  );
}

function RecordRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-black/5 pb-2">
      <p className="text-sm text-black/60">{label}</p>
      <p className="text-right font-extrabold text-nu-blue">{value || "—"}</p>
    </div>
  );
}
