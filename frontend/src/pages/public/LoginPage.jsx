// src/pages/public/LoginPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import {
  Mail,
  Lock,
  KeyRound,
  UserPlus,
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PageTitle from "../../components/PageTitle";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import NULogoCapBlue from "../../assets/alumni-login/nuai-logo-blue.png";
import FooterLogo from "../../assets/cropped-blue.png";
import NULogoCapWhite from "../../assets/alumni-login/nuai-logo-white.png";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const LS_FAILS = "nuai_login_failedCount";
const LS_LOCK = "nuai_login_lockUntil";

function norm(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function sanitizeEmailInput(v) {
  return String(v || "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function sanitizePasswordInput(v) {
  return String(v || "").replace(/^\s+|\s+$/g, "");
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

function readNum(key, fallback = 0) {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function routeForRole(role) {
  const r = norm(role);

  if (r === "alumni") return "/alumni";
  if (r === "intern") return "/intern";
  if (r === "partner") return "/partner";
  if (r === "faculty") return "/faculty";
  if (r === "ailpo") return "/ailpo";
  if (r === "registrar") return "/registrar";
  if (r === "treasury") return "/treasury";

  if (r === "officer" || r === "alumni officer" || r === "alumni-officer") {
    return "/alumni-officer";
  }

  if (r === "super admin" || r === "super-admin" || r === "superadmin") {
    return "/super-admin";
  }

  return null;
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [focused, setFocused] = useState({ email: false, password: false });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [transitionPrompt, setTransitionPrompt] = useState(null);
  const [transitionLoading, setTransitionLoading] = useState(false);

  const [failedCount, setFailedCount] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fails = readNum(LS_FAILS, 0);
    const lock = readNum(LS_LOCK, 0);

    setFailedCount(Math.max(0, Math.min(4, fails)));
    setLockUntil(Math.max(0, lock));
  }, []);

  const now = Date.now();
  const isLocked = lockUntil > now;
  const secondsLeft = Math.max(0, Math.ceil((lockUntil - now) / 1000));

  useEffect(() => {
    if (!isLocked && lockUntil) {
      setFailedCount(0);
      setLockUntil(0);

      try {
        localStorage.removeItem(LS_FAILS);
        localStorage.removeItem(LS_LOCK);
      } catch {}
    }
  }, [isLocked, lockUntil, tick]);

  function clearLockState() {
    setFailedCount(0);
    setLockUntil(0);

    try {
      localStorage.removeItem(LS_FAILS);
      localStorage.removeItem(LS_LOCK);
    } catch {}
  }

  function registerFailedAttempt(message) {
    const next = failedCount + 1;

    if (next >= 4) {
      const until = Date.now() + 60_000;

      setFailedCount(4);
      setLockUntil(until);

      try {
        localStorage.setItem(LS_FAILS, "4");
        localStorage.setItem(LS_LOCK, String(until));
      } catch {}

      setErr(message || "Too many failed attempts. Please try again in 60s.");
      return;
    }

    setFailedCount(next);

    try {
      localStorage.setItem(LS_FAILS, String(next));
    } catch {}

    setErr(message || "Login failed. Please try again.");
  }

  const isEmpty = (v) => String(v || "").trim() === "";

  const emailValue = sanitizeEmailInput(form.email);
  const passwordValue = sanitizePasswordInput(form.password);

  const emailError =
    touched.email && !focused.email
      ? isEmpty(emailValue)
        ? "Email is required."
        : !isValidEmail(emailValue)
          ? "Please enter a valid email address."
          : ""
      : "";

  const passwordError =
    touched.password && !focused.password
      ? isEmpty(passwordValue)
        ? "Password is required."
        : ""
      : "";

  const showEmailError = !!emailError;
  const showPasswordError = !!passwordError;

  async function handleLogin(e) {
    e.preventDefault();
    setErr("");
    setNotice("");

    if (isLocked) {
      setErr(`Too many failed attempts. Try again in ${secondsLeft}s.`);
      return;
    }

    setTouched({ email: true, password: true });

    const email = sanitizeEmailInput(form.email);
    const password = sanitizePasswordInput(form.password);

    if (isEmpty(email) || isEmpty(password)) {
      registerFailedAttempt("Fill the required fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requires_requirement_gate && data.account) {
          clearLockState();
          localStorage.setItem("nuai_account", JSON.stringify(data.account));
          navigate(data.redirect_to || "/intern", { replace: true });
          return;
        }

        registerFailedAttempt(data.message || "Invalid email or password");
        return;
      }

      if (data.requires_transition_confirmation && data.account) {
        clearLockState();
        localStorage.setItem("nuai_account", JSON.stringify(data.account));
        navigate(data.redirect_to || "/intern", { replace: true });
        return;
      }

      const account = data.account;
      const target = data.redirect_to || routeForRole(account?.role);

      if (!target) {
        registerFailedAttempt("Invalid account role.");
        return;
      }

      clearLockState();

      localStorage.setItem("nuai_account", JSON.stringify(account));

      navigate(target, { replace: true });
    } catch {
      registerFailedAttempt(
        "Unable to connect to the server. Please check if Django is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmTransition() {
    if (!transitionPrompt?.email || !transitionPrompt?.password) return;

    setTransitionLoading(true);
    setErr("");
    setNotice("");

    try {
      const response = await fetch(`${API_BASE_URL}/accounts/confirm-intern-transition/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: transitionPrompt.email,
          password: transitionPrompt.password,
          personal_email: transitionPrompt.transition?.personal_email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErr(data.message || "Unable to complete alumni transition.");
        return;
      }

      localStorage.removeItem("nuai_account");
      setTransitionPrompt(null);
      setForm({ email: data.login_email || transitionPrompt.transition?.personal_email || "", password: "" });
      setTouched({ email: false, password: false });
      setNotice(data.message || "Transition completed. Please log in using your personal email.");
      navigate("/login", { replace: true });
    } catch {
      setErr("Unable to connect to the server. Please check if Django is running.");
    } finally {
      setTransitionLoading(false);
    }
  }

  const submitDisabled = loading || isLocked;

  const leftSlides = [
    {
      id: 0,
      eyebrow: "One NUAI Portal",
      text: "Sign in using your NUAI account and the system will automatically route you based on your assigned role.",
    },
    {
      id: 1,
      eyebrow: "For Alumni, Interns, and Partners",
      text: "Access alumni services, internship tools, partner job posting, and role-based dashboards from one secure login page.",
    },
    {
      id: 2,
      eyebrow: "Secure Role-Based Access",
      text: "Your account status and role are checked before access is granted to protected pages.",
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

  return (
    <>
      <PageTitle title="Login | NUAI" />
      <Header logoSrc={NULogoCapBlue} homeTo="/" />

      <main className="min-h-screen bg-slate-50 shadow-2xl">
        <div className="mx-auto max-w-[1600px] px-8 py-10">
          <Card className="min-h-[72vh] rounded-3xl border-0 bg-nu-blue px-5 py-8 shadow-lg lg:min-h-[78vh]">
            <div className="mx-auto grid h-full w-full flex-1 gap-8 lg:grid-cols-2 lg:items-stretch">
              <div className="flex h-full min-h-0 flex-col justify-center rounded-3xl px-8 py-8 text-white lg:px-10">
                <div className="flex max-w-xl flex-col">
                  <h1 className="mt-3 select-none text-4xl font-bold leading-tight text-nu-gold lg:text-4xl">
                    NU ALUMNI INFORMATION
                  </h1>

                  <h1 className="mt-3 select-none text-4xl font-bold leading-tight lg:text-4xl">
                    CENTRALIZED LOGIN PAGE
                  </h1>

                  <p className="mt-6 max-w-lg select-none text-base leading-8 text-white/85">
                    Access NUAI through one secure login page. Alumni, Interns,
                    Partners, Faculty, Officers, AILPO, Registrar, Treasury, and
                    Super Admin users will be routed automatically after signing
                    in.
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
                          <CarouselItem key={slide.id} className="rounded-full">
                            <div className="flex min-h-[150px] select-none flex-col justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/8 px-6 py-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/12">
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
                      Login to your account
                    </h2>

                    <p className="mt-2 max-w-xl text-base leading-6 text-nu-blue/80">
                      Enter your NUAI credentials below to continue
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="w-full">
                    <div className="flex flex-col gap-3">
                      <div className="grid gap-1">
                        <Label htmlFor="email" className="text-nu-blue">
                          Email <span className="text-red-500">*</span>
                        </Label>

                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nu-blue/50" />

                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter your email address"
                            value={form.email}
                            aria-label="Email address"
                            onChange={(e) => {
                              const v = sanitizeEmailInput(e.target.value);
                              setForm((p) => ({ ...p, email: v }));

                              if (!touched.email) {
                                setTouched((t) => ({ ...t, email: true }));
                              }

                              if (err) setErr("");
                            }}
                            onFocus={() =>
                              setFocused((f) => ({ ...f, email: true }))
                            }
                            onBlur={() => {
                              setFocused((f) => ({ ...f, email: false }));
                              setTouched((t) => ({ ...t, email: true }));
                            }}
                            autoCapitalize="none"
                            autoCorrect="off"
                            className={[
                              "h-13 border border-nu-blue/20 bg-white pl-12 outline-none transition-all duration-200 placeholder:text-nu-blue/35 hover:border-nu-blue/40 hover:bg-nu-blue/5 focus-visible:border-nu-blue focus-visible:ring-2 focus-visible:ring-nu-blue/20",
                              showEmailError
                                ? "border-red-500"
                                : "border-nu-blue/20",
                            ].join(" ")}
                          />
                        </div>

                        <div className="flex min-h-[20px] items-start justify-between gap-3">
                          <p
                            className={[
                              "pt-1 text-[11px] font-semibold text-red-600 transition-opacity duration-200",
                              showEmailError ? "opacity-100" : "opacity-0",
                            ].join(" ")}
                          >
                            {emailError || "\u00A0"}
                          </p>

                          <p className="whitespace-nowrap pt-1 text-right text-[11px] text-nu-blue/60">
                            Use your registered NUAI email.
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 grid gap-1">
                        <div className="flex items-center">
                          <Label htmlFor="password" className="text-nu-blue">
                            Password <span className="text-red-500">*</span>
                          </Label>

                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => navigate("/forgot-password")}
                            className={`ml-auto text-sm text-nu-blue/80 hover:text-nu-blue ${
                              loading
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer"
                            }`}
                          >
                            Forgot password?
                          </button>
                        </div>

                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nu-blue/50" />

                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={(e) => {
                              const v = e.target.value;
                              setForm((p) => ({ ...p, password: v }));

                              if (!touched.password) {
                                setTouched((t) => ({
                                  ...t,
                                  password: true,
                                }));
                              }

                              if (err) setErr("");
                            }}
                            onFocus={() =>
                              setFocused((f) => ({ ...f, password: true }))
                            }
                            onBlur={() => {
                              setFocused((f) => ({ ...f, password: false }));
                              setTouched((t) => ({ ...t, password: true }));
                            }}
                            className={[
                              "h-13 mb-0 border border-nu-blue/20 bg-white pl-12 pr-12 outline-none transition-all duration-200 placeholder:text-nu-blue/35 hover:border-nu-blue/40 hover:bg-nu-blue/5 focus-visible:border-nu-blue focus-visible:ring-2 focus-visible:ring-nu-blue/20",
                              showPasswordError
                                ? "border-red-500"
                                : "border-nu-blue/20",
                            ].join(" ")}
                          />

                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-nu-blue/50 transition hover:text-nu-blue"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>

                        <div className="mb-0 flex min-h-[18px] items-center justify-between">
                          <p
                            className={[
                              "mt-0 text-[11px] font-semibold text-red-600 transition-opacity duration-200",
                              showPasswordError ? "opacity-100" : "opacity-0",
                            ].join(" ")}
                          >
                            {passwordError || "\u00A0"}
                          </p>

                          <span className="select-none text-[11px] opacity-0">
                            placeholder
                          </span>
                        </div>
                      </div>

                      <div
                        className={[
                          "overflow-hidden transition-all duration-200 ease-out",
                          err ? "max-h-28 opacity-100" : "max-h-0 opacity-0",
                        ].join(" ")}
                      >
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                          {isLocked
                            ? `Too many failed attempts. Try again in ${secondsLeft}s.`
                            : err}
                        </div>
                      </div>

                      <div
                        className={[
                          "overflow-hidden transition-all duration-200 ease-out",
                          notice ? "max-h-28 opacity-100" : "max-h-0 opacity-0",
                        ].join(" ")}
                      >
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                          {notice}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={submitDisabled}
                        className={[
                          "mt-1 h-11 w-full font-semibold text-white",
                          submitDisabled
                            ? "cursor-not-allowed bg-nu-blue/60 hover:bg-nu-blue/60"
                            : "cursor-pointer bg-nu-blue hover:bg-nu-blue/90",
                        ].join(" ")}
                      >
                        {loading
                          ? "Logging in..."
                          : isLocked
                            ? `Try again in ${secondsLeft}s`
                            : "LOGIN"}
                      </Button>

                      <div className="grid gap-2 pt-1 sm:grid-cols-3">
                        <Button
                          type="button"
                          disabled={loading}
                          onClick={() => navigate("/register")}
                          variant="outline"
                          className="h-10 border-nu-blue/20 text-xs font-bold text-nu-blue hover:bg-nu-blue/5"
                        >
                          Alumni Register
                        </Button>

                        <Button
                          type="button"
                          disabled={loading}
                          onClick={() => navigate("/intern/register")}
                          variant="outline"
                          className="h-10 border-nu-blue/20 text-xs font-bold text-nu-blue hover:bg-nu-blue/5"
                        >
                          Intern Register
                        </Button>

                        <Button
                          type="button"
                          disabled={loading}
                          onClick={() => navigate("/partner-register")}
                          variant="outline"
                          className="h-10 border-nu-blue/20 text-xs font-bold text-nu-blue hover:bg-nu-blue/5"
                        >
                          Partner Register
                        </Button>
                      </div>

                      <p className="text-center text-[11px] text-nu-blue/55">
                        Your account role will determine where you are redirected
                        after login.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </div>
            </div>
          </Card>

          <div className="mt-10">
            <div className="mb-6 h-0.5 w-full rounded-full bg-nu-gold" />

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="h-full">
                <Card className="group h-full border border-transparent bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-200 hover:bg-[#e2f0ff] hover:shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                  <CardContent className="flex h-full flex-col px-6 pb-6 pt-4">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="nu-icon-hover flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm group-hover:scale-105">
                        <KeyRound className="h-5 w-5 text-nu-blue" />
                      </div>

                      <p className="text-base font-extrabold tracking-wide text-nu-blue">
                        RESET PASSWORD
                      </p>
                    </div>

                    <div className="mb-4 h-0.5 w-full rounded-full bg-black/10" />

                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-nu-blue">
                        Having trouble signing in?
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-black/60">
                        Forgot your password or experiencing login issues? Use
                        the reset page to recover your account access.
                      </p>
                    </div>

                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => navigate("/forgot-password")}
                      className={`mt-5 w-full rounded-md py-3 text-xs font-extrabold text-white ${
                        loading
                          ? "cursor-not-allowed bg-[#5CB85C]/60 hover:bg-[#5CB85C]/60"
                          : "cursor-pointer bg-[#5CB85C] hover:bg-[#4cae4f]"
                      }`}
                    >
                      RESET PASSWORD
                    </Button>
                  </CardContent>
                </Card>
              </section>

              <section className="h-full">
                <Card className="group h-full border border-transparent bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-200 hover:bg-[#e2f0ff] hover:shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                  <CardContent className="flex h-full flex-col px-6 pb-6 pt-4">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="nu-icon-hover flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm group-hover:scale-105">
                        <UserPlus className="h-5 w-5 text-nu-blue" />
                      </div>

                      <p className="text-base font-extrabold tracking-wide text-nu-blue">
                        ALUMNI / INTERN
                      </p>
                    </div>

                    <div className="mb-4 h-0.5 w-full rounded-full bg-black/10" />

                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-nu-blue">
                        Create a student or alumni account
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-black/60">
                        Register as an Alumni or Intern user to access NUAI
                        services, surveys, jobs, profile tools, and updates.
                      </p>
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        disabled={loading}
                        onClick={() => navigate("/register")}
                        className={`rounded-md py-3 text-xs font-extrabold text-white ${
                          loading
                            ? "cursor-not-allowed bg-[#5CB85C]/60 hover:bg-[#5CB85C]/60"
                            : "cursor-pointer bg-[#5CB85C] hover:bg-[#4cae4f]"
                        }`}
                      >
                        ALUMNI
                      </Button>

                      <Button
                        type="button"
                        disabled={loading}
                        onClick={() => navigate("/intern/register")}
                        className={`rounded-md py-3 text-xs font-extrabold text-white ${
                          loading
                            ? "cursor-not-allowed bg-[#5CB85C]/60 hover:bg-[#5CB85C]/60"
                            : "cursor-pointer bg-[#5CB85C] hover:bg-[#4cae4f]"
                        }`}
                      >
                        INTERN
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="h-full">
                <Card className="group h-full border border-transparent bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-200 hover:bg-[#e2f0ff] hover:shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                  <CardContent className="flex h-full flex-col px-6 pb-6 pt-4">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="nu-icon-hover flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm group-hover:scale-105">
                        <Building2 className="h-5 w-5 text-nu-blue" />
                      </div>

                      <p className="text-base font-extrabold tracking-wide text-nu-blue">
                        PARTNER ACCESS
                      </p>
                    </div>

                    <div className="mb-4 h-0.5 w-full rounded-full bg-black/10" />

                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-nu-blue">
                        Need employer or partner access?
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-black/60">
                        Submit a partner registration request for verification
                        before accessing job posting and applicant management.
                      </p>
                    </div>

                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => navigate("/partner-register")}
                      className={`mt-5 w-full rounded-md py-3 text-xs font-extrabold text-white ${
                        loading
                          ? "cursor-not-allowed bg-[#5CB85C]/60 hover:bg-[#5CB85C]/60"
                          : "cursor-pointer bg-[#5CB85C] hover:bg-[#4cae4f]"
                      }`}
                    >
                      PARTNER REGISTER
                    </Button>
                  </CardContent>
                </Card>
              </section>
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                onClick={() => navigate("/")}
                variant="ghost"
                className="text-xs font-bold text-nu-blue hover:bg-nu-blue/5 hover:text-nu-blue"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </main>

      {transitionPrompt ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-nu-blue px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldCheck className="h-5 w-5 text-nu-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Confirm Alumni Transition</h3>
                  <p className="text-xs text-white/75">Your intern account is ready to become an alumni account.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-nu-blue/10 bg-nu-blue/[0.03] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-nu-blue/70">Personal Email</p>
                <p className="mt-1 break-all text-sm font-bold text-nu-blue">
                  {transitionPrompt.transition?.personal_email || "No personal email found"}
                </p>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                Please confirm that this is the personal email you will use moving forward. After confirmation, you will be signed out and must log in again using this personal email.
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={transitionLoading}
                  onClick={() => setTransitionPrompt(null)}
                  className="border-nu-blue/20 text-nu-blue hover:bg-nu-blue/5"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={transitionLoading || !transitionPrompt.transition?.personal_email}
                  onClick={handleConfirmTransition}
                  className="bg-nu-blue text-white hover:bg-nu-blue/90"
                >
                  {transitionLoading ? "Confirming..." : "Confirm and Transition"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Footer logoSrc={FooterLogo} />
    </>
  );
}