import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "@/pages/alumni-officer/services/firebaseCompat";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { getDownloadURL, ref, uploadBytes } from "@/pages/alumni-officer/services/firebaseCompat";
import { httpsCallable, getFunctions } from "@/pages/alumni-officer/services/firebaseCompat";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Link2,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { auth, db, storage, functions } from "@/pages/alumni-officer/services/firebaseCompat";
import { useAuth } from "@/pages/alumni-officer/services/officerAuthCompat";
import {
  buildNameWithMiddleInitial,
  cleanText,
  normalizeUrl,
  splitRequirements,
  MAX_IMAGE_COUNT,
  MAX_IMAGE_SIZE,
} from "./perk-utils/perkFormUtils";

import PerksStepCompany from "./perk-components/PerksStepCompany";
import PerksStepContent from "./perk-components/PerksStepContent";
import PerksStepDates from "./perk-components/PerksStepDates";
import PerksStepLinks from "./perk-components/PerksStepLinks";
import PerksStepImages from "./perk-components/PerksStepImages";
import PerksStepReview from "./perk-components/PerksStepReview";
import PerksSidebarNotes from "./perk-components/PerksSidebarNotes";
import PerksStepPosting from "./perk-components/PerksStepPosting";

const STEP_COUNT = 7;


function getUploadExtension(file) {
  const name = String(file?.name || "");
  const match = name.match(/\.[a-zA-Z0-9]+$/);
  return match ? match[0].toLowerCase() : ".jpg";
}

function buildPerkImagePath(perkId, index, file) {
  return `perksDiscounts/${perkId}/perk-image-${index + 1}${getUploadExtension(file)}`;
}

function getLocalTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isBeforeLocalDate(dateString, minDateString) {
  if (!dateString || !minDateString) return false;
  return dateString < minDateString;
}

function toMinutes(timeValue) {
  if (!timeValue || typeof timeValue !== "string") return null;

  const [hourStr, minuteStr] = timeValue.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

function StepperCard({ step, active, done, onClick }) {
  const Icon = step.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-3 text-left transition-all duration-200",
        active
          ? "border-[#3D398C]/30 bg-[#3D398C]/8 shadow-sm"
          : done
            ? "border-emerald-200 bg-emerald-50"
            : "border-border bg-card hover:border-[#3D398C]/20 hover:bg-[#3D398C]/[0.03]",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
            active
              ? "border-[#3D398C] bg-[#3D398C] text-white"
              : done
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-border bg-muted/30 text-muted-foreground",
          ].join(" ")}
        >
          {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">
            Step {step.id}
          </p>
          <p
            className={[
              "text-sm font-semibold leading-tight",
              active
                ? "text-[#3D398C]"
                : done
                  ? "text-emerald-700"
                  : "text-foreground",
            ].join(" ")}
          >
            {step.title}
          </p>
        </div>
      </div>
    </button>
  );
}

function PerksEventStyleStepper({ currentStep, steps, onStepClick }) {
  return (
    <div className="grid gap-3 lg:grid-cols-4 xl:grid-cols-7">
      {steps.map((step) => (
        <StepperCard
          key={step.id}
          step={step}
          active={currentStep === step.id}
          done={currentStep > step.id}
          onClick={() => onStepClick(step.id)}
        />
      ))}
    </div>
  );
}

export default function OfficerPerksDiscountForm({
  mode = "create",
  editPerkId = "",
  initialPerk = null,
  onDone,
  onCancel,
}) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const allowBrowserBackRef = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [touched, setTouched] = useState({});
  const [attemptedSteps, setAttemptedSteps] = useState({});

  const [companyName, setCompanyName] = useState("");
  const [headerText, setHeaderText] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [contentText, setContentText] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [postedOn, setPostedOn] = useState(["services"]);
  const [requirementsText, setRequirementsText] = useState("");
  const [links, setLinks] = useState([{ label: "", url: "" }]);

  const [files, setFiles] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);

  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(mode === "edit");
  const [formError, setFormError] = useState("");
  const [imageError, setImageError] = useState("");
  const [authorName, setAuthorName] = useState("Unknown");
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState(null);
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const onCancelRef = useRef(onCancel);
  const loadingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(() => false);

  const isEditMode = mode === "edit";
  const localToday = useMemo(() => getLocalTodayString(), []);

  const logAudit = useMemo(() => {
    const f = functions ?? getFunctions();
    return httpsCallable(f, "logSystemAudit");
  }, []);

  const imagePreviews = useMemo(() => {
    return files.map((file) => URL.createObjectURL(file));
  }, [files]);

  function hasUnsavedChanges() {
    const hasTextChanges =
      cleanText(companyName) ||
      cleanText(headerText) ||
      cleanText(category) ||
      cleanText(customCategory) ||
      cleanText(contentText) ||
      cleanText(location) ||
      cleanText(startDate) ||
      cleanText(endDate) ||
      cleanText(startTime) ||
      cleanText(endTime) ||
      cleanText(requirementsText);

    const hasLinkChanges = links.some(
      (link) => cleanText(link.label) || cleanText(link.url),
    );

    const hasImageChanges = files.length > 0 || existingImageUrls.length > 0;

    const hasPostingChanges =
      postedOn.length !== 1 || postedOn[0] !== "services";

    return Boolean(
      isEditMode ||
        hasTextChanges ||
        hasLinkChanges ||
        hasImageChanges ||
        hasPostingChanges ||
        allDay,
    );
  }

  const canSaveDraft = hasUnsavedChanges();

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [
    mode,
    companyName,
    headerText,
    category,
    customCategory,
    contentText,
    location,
    startDate,
    endDate,
    startTime,
    endTime,
    requirementsText,
    links,
    files,
    existingImageUrls,
    postedOn,
    allDay,
  ]);

  useEffect(() => {
    return () => {
      for (const url of imagePreviews) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imagePreviews]);

  useEffect(() => {
    const loadAuthorName = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          const personal = data?.personalInformation || {};
          const formatted = buildNameWithMiddleInitial(personal);

          if (formatted) {
            setAuthorName(formatted);
            return;
          }
        }

        setAuthorName(
          user?.displayName || user?.email?.split("@")?.[0] || "Unknown",
        );
      } catch (err) {
        console.error("Failed to load author name:", err);
        setAuthorName(
          user?.displayName || user?.email?.split("@")?.[0] || "Unknown",
        );
      }
    };

    loadAuthorName();
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateEditMode() {
      if (!isEditMode) {
        setHydrating(false);
        return;
      }

      try {
        let source = initialPerk;

        if (!source && editPerkId) {
          const snap = await getDoc(doc(db, "perksDiscounts", editPerkId));

          if (!snap.exists()) {
            throw new Error("Perk/discount record not found.");
          }

          source = { id: snap.id, ...snap.data() };
        }

        if (!source || cancelled) {
          setHydrating(false);
          return;
        }

        setCompanyName(source.companyName || "");
        setHeaderText(source.postHeader || "");
        setCategory(source.category || "");
        setCustomCategory(source.customCategory || "");
        setContentText(source.postContent || "");
        setLocation(source.location || "");
        setStartDate(source.startDate || "");
        setEndDate(source.endDate || "");
        setPostedOn(
          Array.isArray(source.postedOn) && source.postedOn.length > 0
            ? source.postedOn
            : ["services"],
        );
        setRequirementsText(
          Array.isArray(source.requirements)
            ? source.requirements.join(", ")
            : "",
        );
        setLinks(
          Array.isArray(source.links) && source.links.length > 0
            ? source.links.map((url) => ({
                label: "",
                url: cleanText(url),
              }))
            : [{ label: "", url: "" }],
        );
        setExistingImageUrls(
          Array.isArray(source.photoURLs) ? source.photoURLs.filter(Boolean) : [],
        );
        setAllDay(Boolean(source.allDay));
        setStartTime(source.allDay ? "" : source.startTime || "");
        setEndTime(source.allDay ? "" : source.endTime || "");

        if (!cancelled) {
          setCurrentStep(1);
          setDirection(1);
          setTouched({});
          setAttemptedSteps({});
        }
      } catch (err) {
        console.error("Failed to load perk for edit:", err);

        if (!cancelled) {
          setFormError(err?.message || "Failed to load perk.");
        }
      } finally {
        if (!cancelled) {
          setHydrating(false);
        }
      }
    }

    hydrateEditMode();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, editPerkId, initialPerk]);

  function goToManagePerks(finalId = "") {
    allowBrowserBackRef.current = true;

    if (onDone) {
      onDone(finalId);
      return;
    }

    navigate("/alumni-officer/perks-discounts", { replace: true });
  }

  function leavePerksForm() {
    allowBrowserBackRef.current = true;

    if (typeof onCancelRef.current === "function") {
      onCancelRef.current();
      return;
    }

    navigate("/alumni-officer/perks-discounts", { replace: true });
  }

  function requestExit(exitAction = null) {
    if (hasUnsavedChanges()) {
      setPendingExitAction(() => exitAction || leavePerksForm);
      setShowCancelConfirm(true);
      return;
    }

    if (exitAction) {
      exitAction();
      return;
    }

    leavePerksForm();
  }

  useEffect(() => {
    function handlePerksFormExitRequest(event) {
      if (loadingRef.current || showCancelConfirm) return;

      if (!hasUnsavedChangesRef.current?.()) {
        event.detail?.proceed?.();
        return;
      }

      event.preventDefault();

      setPendingExitAction(() => event.detail?.proceed);
      setShowCancelConfirm(true);
    }

    window.addEventListener(
      "officer-perks-discount-form-exit-request",
      handlePerksFormExitRequest,
    );

    return () => {
      window.removeEventListener(
        "officer-perks-discount-form-exit-request",
        handlePerksFormExitRequest,
      );
    };
  }, [showCancelConfirm]);

  useEffect(() => {
    const guardState = {
      officerPerksDiscountFormGuard: true,
    };

    window.history.pushState(guardState, "", window.location.href);

    function handlePopState() {
      if (allowBrowserBackRef.current) return;

      if (loadingRef.current) {
        window.history.pushState(guardState, "", window.location.href);
        return;
      }

      if (!hasUnsavedChangesRef.current?.()) {
        leavePerksForm();
        return;
      }

      window.history.pushState(guardState, "", window.location.href);

      setPendingExitAction(() => leavePerksForm);
      setShowCancelConfirm(true);
    }

    function handleBeforeUnload(event) {
      if (!hasUnsavedChangesRef.current?.()) return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  function cancelExit() {
    setShowCancelConfirm(false);
    setPendingExitAction(null);
  }

  function handleConfirmCancel() {
    const action = pendingExitAction;

    setShowCancelConfirm(false);
    setPendingExitAction(null);

    if (action) {
      setTimeout(() => {
        action?.();
      }, 0);
      return;
    }

    leavePerksForm();
  }

  function handleDraftButtonClick() {
    if (loading || !canSaveDraft) return;

    setShowDraftConfirm(true);
  }

  async function handleConfirmSaveDraft() {
    if (loading || !canSaveDraft) return;

    const saved = await handleSaveDraft();

    if (saved) {
      setShowDraftConfirm(false);
    }
  }

  async function handleSaveDraftAndExit() {
    if (!canSaveDraft) return;

    const action = pendingExitAction;

    setShowCancelConfirm(false);
    setPendingExitAction(null);

    const saved = await handleSaveDraft({
      skipRedirect: Boolean(action),
    });

    if (!saved) return;

    if (action) {
      setTimeout(() => {
        action?.();
      }, 0);
      return;
    }

    leavePerksForm();
  }

  function touchField(name) {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }

  function touchMany(fields) {
    setTouched((prev) => {
      const next = { ...prev };

      fields.forEach((field) => {
        next[field] = true;
      });

      return next;
    });
  }

  function markStepAttempted(step) {
    setAttemptedSteps((prev) => ({ ...prev, [step]: true }));
  }

  function shouldShowFieldError(fieldName, stepNumber) {
    return touched[fieldName] || attemptedSteps[stepNumber];
  }

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  function removeLink(index) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLink(index, field, value) {
    setLinks((prev) =>
      prev.map((link, i) =>
        i === index ? { ...link, [field]: value } : link,
      ),
    );
  }

  function togglePostedOnOption(option) {
    setPostedOn((prev) => {
      if (prev.includes(option)) {
        return prev.filter((item) => item !== option);
      }

      return [...prev, option];
    });
  }

  function handleImageSelection(e) {
    const pickedFiles = Array.from(e.target.files || []);
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    const invalidFiles = [];
    const oversizedFiles = [];
    const validFiles = [];

    pickedFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(file.name);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        oversizedFiles.push(file.name);
        return;
      }

      validFiles.push(file);
    });

    const combined = [...files, ...validFiles];

    const deduped = combined.filter(
      (file, index, arr) =>
        index ===
        arr.findIndex(
          (f) =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified,
        ),
    );

    const maxAllowedNew = Math.max(
      0,
      MAX_IMAGE_COUNT - existingImageUrls.length,
    );

    let nextError = "";

    if (existingImageUrls.length + deduped.length > MAX_IMAGE_COUNT) {
      nextError = `Only ${MAX_IMAGE_COUNT} images are allowed.`;
    } else if (oversizedFiles.length > 0) {
      nextError = "4MB is the maximum file size per image.";
    } else if (invalidFiles.length > 0) {
      nextError = "Only JPG, JPEG, and PNG files are allowed.";
    }

    setFiles(deduped.slice(0, maxAllowedNew));
    setImageError(nextError);
    e.target.value = "";
  }

  function removeSelectedImage(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setImageError("");
  }

  function removeExistingImage(index) {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
    setImageError("");
  }

  const requirementItems = splitRequirements(requirementsText);
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  const errors = {
    companyName: !cleanText(companyName) ? "Company name is required." : "",
    headerText: !cleanText(headerText) ? "Post header is required." : "",
    category: !cleanText(category) ? "Category is required." : "",
    customCategory:
      category === "others" && !cleanText(customCategory)
        ? "Please specify the category."
        : "",
    contentText: !cleanText(contentText) ? "Post content is required." : "",
    requirementsText:
      requirementItems.length === 0
        ? "At least one requirement is required."
        : "",
    location: !cleanText(location) ? "Location is required." : "",
    startDate: !cleanText(startDate)
      ? "Start date is required."
      : isBeforeLocalDate(startDate, localToday)
        ? "Start date cannot be before today."
        : "",
    endDate: !cleanText(endDate)
      ? "End date is required."
      : isBeforeLocalDate(endDate, localToday)
        ? "End date cannot be before today."
        : startDate && endDate && endDate < startDate
          ? "End date cannot be earlier than start date."
          : "",
    startTime: allDay
      ? ""
      : !cleanText(startTime)
        ? "Start time is required."
        : startMinutes === null
          ? "Invalid start time."
          : "",
    endTime: allDay
      ? ""
      : !cleanText(endTime)
        ? "End time is required."
        : endMinutes === null
          ? "Invalid end time."
          : startDate &&
              endDate &&
              startDate === endDate &&
              startMinutes !== null &&
              endMinutes !== null &&
              endMinutes <= startMinutes
            ? "End time must be later than start time."
            : "",
    postedOn:
      !Array.isArray(postedOn) || postedOn.length === 0
        ? "Select at least one destination."
        : "",
  };

  const steps = useMemo(
    () => [
      { id: 1, title: "Company", icon: BriefcaseBusiness },
      { id: 2, title: "Content", icon: FileText },
      { id: 3, title: "Dates", icon: CalendarDays },
      { id: 4, title: "Posting", icon: Send },
      { id: 5, title: "Links", icon: Link2 },
      { id: 6, title: "Images", icon: ImageIcon },
      { id: 7, title: "Review & Save", icon: ShieldCheck },
    ],
    [],
  );

  const stepFields = {
    1: ["companyName", "location"],
    2: [
      "headerText",
      "category",
      "customCategory",
      "contentText",
      "requirementsText",
    ],
    3: ["startDate", "endDate", "startTime", "endTime"],
    4: ["postedOn"],
    5: [],
    6: [],
    7: [],
  };

  const isStepValid = {
    1: !errors.companyName && !errors.location,
    2:
      !errors.headerText &&
      !errors.category &&
      !errors.customCategory &&
      !errors.contentText &&
      !errors.requirementsText,
    3:
      !errors.startDate &&
      !errors.endDate &&
      !errors.startTime &&
      !errors.endTime,
    4: !errors.postedOn,
    5: true,
    6: true,
    7:
      !errors.companyName &&
      !errors.location &&
      !errors.headerText &&
      !errors.category &&
      !errors.customCategory &&
      !errors.contentText &&
      !errors.requirementsText &&
      !errors.startDate &&
      !errors.endDate &&
      !errors.startTime &&
      !errors.endTime &&
      !errors.postedOn,
  };

  function goNext() {
    const fields = stepFields[currentStep] || [];
    touchMany(fields);
    markStepAttempted(currentStep);

    if (!isStepValid[currentStep]) {
      setFormError("Please fix the highlighted fields before proceeding.");
      return;
    }

    setFormError("");
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  }

  function goBack() {
    setFormError("");
    setDirection(-1);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }

  function jumpToStep(step) {
    if (step === currentStep) return;

    if (step < currentStep) {
      setFormError("");
      setDirection(-1);
      setCurrentStep(step);
      return;
    }

    for (let i = 1; i < step; i += 1) {
      if (!isStepValid[i]) {
        markStepAttempted(i);
        touchMany(stepFields[i] || []);
        setDirection(i < currentStep ? -1 : 1);
        setCurrentStep(i);
        return;
      }
    }

    setFormError("");
    setDirection(1);
    setCurrentStep(step);
  }

  async function savePerk({ forceDraft = false }) {
    const normalizedLinks = links
      .map((item) => normalizeUrl(item.url))
      .filter(Boolean);

    const requirements = splitRequirements(requirementsText);

    let finalId = "";
    let finalRef = null;

    if (isEditMode && editPerkId) {
      finalId = editPerkId;
      finalRef = doc(db, "perksDiscounts", editPerkId);

      const currentSnap = await getDoc(finalRef);
      const currentData = currentSnap.exists() ? currentSnap.data() : {};

      await updateDoc(finalRef, {
        companyName: cleanText(companyName),
        postHeader: cleanText(headerText),
        category: cleanText(category),
        customCategory: category === "others" ? cleanText(customCategory) : "",
        postContent: cleanText(contentText),
        links: normalizedLinks,
        startDate: cleanText(startDate),
        endDate: cleanText(endDate),
        allDay: Boolean(allDay),
        startTime: allDay ? "" : cleanText(startTime),
        endTime: allDay ? "" : cleanText(endTime),
        requirements,
        location: cleanText(location),
        postedOn,
        status: forceDraft ? "draft" : "active",
        authorUid: currentData?.authorUid || auth.currentUser?.uid || "",
        authorEmail: currentData?.authorEmail || auth.currentUser?.email || "",
        authorName: currentData?.authorName || authorName,
        authorRole: currentData?.authorRole || role || "",
        updatedAt: serverTimestamp(),
      });
    } else {
      const createdRef = await addDoc(collection(db, "perksDiscounts"), {
        companyName: cleanText(companyName),
        postHeader: cleanText(headerText),
        category: cleanText(category),
        customCategory: category === "others" ? cleanText(customCategory) : "",
        postContent: cleanText(contentText),
        photoURLs: [],
        links: normalizedLinks,
        startDate: cleanText(startDate),
        endDate: cleanText(endDate),
        allDay: Boolean(allDay),
        startTime: allDay ? "" : cleanText(startTime),
        endTime: allDay ? "" : cleanText(endTime),
        requirements,
        location: cleanText(location),
        postedOn,
        status: forceDraft ? "draft" : "active",
        authorUid: auth.currentUser?.uid || "",
        authorEmail: auth.currentUser?.email || "",
        authorName,
        authorRole: role || "",
        createdAt: serverTimestamp(),
      });

      finalId = createdRef.id;
      finalRef = doc(db, "perksDiscounts", finalId);
    }

    const uploadedURLs = [];

    for (const [index, file] of files.entries()) {
      const path = buildPerkImagePath(finalId, index, file);

      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, file);

      const url = await getDownloadURL(fileRef);
      if (url) uploadedURLs.push(url);
    }

    if (uploadedURLs.length > 0 || isEditMode) {
      await updateDoc(finalRef, {
        photoURLs: uploadedURLs.length > 0 ? uploadedURLs : existingImageUrls,
        updatedAt: serverTimestamp(),
      });
    }

    return finalId;
  }

  async function handleSaveDraft(options = {}) {
    if (!canSaveDraft) return false;

    setLoading(true);
    setFormError("");

    try {
      const finalId = await savePerk({ forceDraft: true });

      logAudit({
        action: isEditMode
          ? "PERK_DISCOUNT_DRAFT_UPDATED"
          : "PERK_DISCOUNT_DRAFT_CREATED",
        details: `Perk/Discount Draft Saved ${finalId} by ${
          auth.currentUser?.uid || "Unknown"
        }`,
      }).catch(() => {});

      if (!options.skipRedirect) {
        goToManagePerks(finalId);
      }

      return true;
    } catch (err) {
      console.error(err);
      setFormError(err?.message || "Failed to save draft.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    touchMany([
      "companyName",
      "location",
      "headerText",
      "category",
      "customCategory",
      "contentText",
      "requirementsText",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "postedOn",
    ]);

    setAttemptedSteps({
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: true,
      7: true,
    });

    if (!isStepValid[7]) {
      setFormError("Please fix the remaining issues before submitting.");
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      const finalId = await savePerk({ forceDraft: false });

      logAudit({
        action: isEditMode
          ? "PERK_DISCOUNT_UPDATED"
          : "PERK_DISCOUNT_CREATED",
        details: `Perk/Discount ${
          isEditMode ? "Updated" : "Created"
        } ${finalId} by ${auth.currentUser?.uid || "Unknown"}`,
      }).catch(() => {});

      setShowCreateConfirm(false);
      goToManagePerks(finalId);
    } catch (err) {
      console.error(err);
      setFormError(
        err?.message ||
          `Failed to ${isEditMode ? "update" : "create"} perk/discount.`,
      );
    } finally {
      setLoading(false);
    }
  }

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <PerksStepCompany
            companyName={companyName}
            location={location}
            setCompanyName={setCompanyName}
            setLocation={setLocation}
            touchField={touchField}
            shouldShowFieldError={shouldShowFieldError}
            errors={errors}
          />
        );

      case 2:
        return (
          <PerksStepContent
            headerText={headerText}
            category={category}
            customCategory={customCategory}
            contentText={contentText}
            requirementsText={requirementsText}
            setHeaderText={setHeaderText}
            setCategory={setCategory}
            setCustomCategory={setCustomCategory}
            setContentText={setContentText}
            setRequirementsText={setRequirementsText}
            touchField={touchField}
            shouldShowFieldError={shouldShowFieldError}
            errors={errors}
            authorName={authorName}
          />
        );

      case 3:
        return (
          <PerksStepDates
            startDate={startDate}
            endDate={endDate}
            startTime={startTime}
            endTime={endTime}
            allDay={allDay}
            minDate={localToday}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            setStartTime={setStartTime}
            setEndTime={setEndTime}
            setAllDay={setAllDay}
            touchField={touchField}
            shouldShowFieldError={shouldShowFieldError}
            errors={errors}
          />
        );

      case 4:
        return (
          <PerksStepPosting
            postedOn={postedOn}
            togglePostedOnOption={togglePostedOnOption}
            shouldShowFieldError={shouldShowFieldError}
            errors={errors}
          />
        );

      case 5:
        return (
          <PerksStepLinks
            links={links}
            addLink={addLink}
            removeLink={removeLink}
            updateLink={updateLink}
          />
        );

      case 6:
        return (
          <PerksStepImages
            fileInputRef={fileInputRef}
            files={files}
            existingImageUrls={existingImageUrls}
            imageError={imageError}
            imagePreviews={imagePreviews}
            handleImageSelection={handleImageSelection}
            removeSelectedImage={removeSelectedImage}
            removeExistingImage={removeExistingImage}
          />
        );

      case 7:
        return (
          <PerksStepReview
            authorName={authorName}
            role={role}
            companyName={companyName}
            location={location}
            headerText={headerText}
            category={category}
            customCategory={customCategory}
            contentText={contentText}
            startDate={startDate}
            endDate={endDate}
            startTime={startTime}
            endTime={endTime}
            allDay={allDay}
            postedOn={postedOn}
            requirementsText={requirementsText}
            links={links}
            imagePreviews={[...existingImageUrls, ...imagePreviews]}
          />
        );

      default:
        return null;
    }
  }

  if (hydrating) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-[#3D398C]" />
          <p className="text-sm font-medium">Loading perk details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PerksEventStyleStepper
        currentStep={currentStep}
        steps={steps}
        onStepClick={jumpToStep}
      />

      {formError ? (
        <div className="animate-in fade-in-50 slide-in-from-top-1 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive duration-200">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-5">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={(dir) => ({
                opacity: 0,
                x: dir > 0 ? 28 : -28,
                y: 8,
              })}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
              }}
              exit={(dir) => ({
                opacity: 0,
                x: dir > 0 ? -28 : 28,
                y: -8,
              })}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="space-y-5"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden xl:block">
          <PerksSidebarNotes
            companyName={companyName}
            headerText={headerText}
            location={location}
            startDate={startDate}
            endDate={endDate}
            allDay={allDay}
            startTime={startTime}
            endTime={endTime}
            postedOn={postedOn}
          />
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="shrink-0 text-sm text-muted-foreground">
            Step {currentStep} of {STEP_COUNT}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1) {
                  requestExit();
                  return;
                }

                goBack();
              }}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-white px-6 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </button>

            {currentStep < STEP_COUNT ? (
              <button
                type="button"
                onClick={handleDraftButtonClick}
                disabled={loading || !canSaveDraft}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-yellow-300 bg-yellow-50 px-6 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100 hover:text-yellow-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save to Draft"}
              </button>
            ) : null}

            {currentStep < STEP_COUNT ? (
              <button
                type="button"
                onClick={goNext}
                disabled={loading || !isStepValid[currentStep]}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#3D398C] px-6 text-sm font-semibold text-white transition hover:bg-[#2f2b73] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreateConfirm(true)}
                disabled={loading || !isStepValid[7]}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#3D398C] px-6 text-sm font-semibold text-white transition hover:bg-[#2f2b73] disabled:opacity-60"
              >
                <Save className="mr-2 h-4 w-4" />
                {isEditMode
                  ? "Update Perk / Discount"
                  : "Create Perk / Discount"}
              </button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showCreateConfirm} onOpenChange={setShowCreateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEditMode
                ? "Are you sure you want to update the perk and discount?"
                : "Are you sure you want to create the perks and discounts?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEditMode
                ? "This will save your latest changes to the perk or discount."
                : "This will create the perk or discount and save it to the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              disabled={loading}
              className="rounded-lg bg-[#3D398C] font-medium text-white shadow-sm hover:bg-[#3D398C]/90"
            >
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Yes, Update"
                  : "Yes, Create"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDraftConfirm} onOpenChange={setShowDraftConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Perk & Discount as Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save your perk or discount as a draft. You can continue
              editing and publish it later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Keep Editing</AlertDialogCancel>

            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleConfirmSaveDraft();
              }}
              disabled={loading || !canSaveDraft}
              className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 font-medium text-yellow-700 shadow-sm hover:bg-yellow-100 hover:text-yellow-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save as Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to exit?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current perk or discount changes have not been saved. You can
              save this perk or discount as a draft before leaving.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                cancelExit();
              }}
            >
              Keep Editing
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleSaveDraftAndExit();
              }}
              disabled={loading || !canSaveDraft}
              className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 font-medium text-yellow-700 shadow-sm hover:bg-yellow-100 hover:text-yellow-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save as Draft"}
            </AlertDialogAction>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmCancel();
              }}
              disabled={loading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
