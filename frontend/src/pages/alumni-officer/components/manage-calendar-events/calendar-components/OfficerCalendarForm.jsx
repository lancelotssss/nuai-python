import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "@/pages/alumni-officer/services/firebaseCompat";
import { getDownloadURL, ref, uploadBytes } from "@/pages/alumni-officer/services/firebaseCompat";
import { CalendarDays, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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

import EventStepper from "./create-event/EventStepper.jsx";
import EventBasicDetails from "./create-event/EventBasicDetails.jsx";
import EventSchedule from "./create-event/EventSchedule.jsx";
import EventAdditionalInfo from "./create-event/EventAdditionalInfo.jsx";
import EventPosting from "./create-event/EventPosting.jsx";
import EventReview from "./create-event/EventReview.jsx";
import EventSidebarNotes from "./create-event/EventSidebarNotes.jsx";
import {
  buildEventPayload,
  getInitialForm,
  validateStep,
} from "../calendar-utils/eventHelpers.js";

import { auth, db, storage } from "@/pages/alumni-officer/services/firebaseCompat";
import { useAuth } from "@/pages/alumni-officer/services/officerAuthCompat";

const STEP_COUNT = 5;

function safe(value) {
  return String(value ?? "").trim();
}

function buildEditForm(initialData, selectedDate) {
  const base = getInitialForm(selectedDate);

  if (!initialData) return base;

  return {
    ...base,
    title: initialData.title || "",
    description: initialData.description || "",
    eventDate: initialData.eventDate || base.eventDate,
    endDate: initialData.endDate || initialData.eventDate || base.eventDate,
    allDay: Boolean(initialData.allDay),
    startTime: initialData.allDay ? "" : initialData.startTime || "",
    endTime: initialData.allDay ? "" : initialData.endTime || "",
    location: initialData.location || "",
    category: initialData.category || "",
    customCategory: initialData.customCategory || "",
    audience: Array.isArray(initialData.audience)
      ? initialData.audience
      : ["alumni"],
    status: initialData.status || "draft",
    coverImageFile: null,
    coverImageUrl: initialData.coverImageUrl || "",
    contactName: initialData.contactName || "",
    contactEmail: initialData.contactEmail || "",
    tags: Array.isArray(initialData.tags) ? initialData.tags : [],
    postedOn: Array.isArray(initialData.postedOn)
      ? initialData.postedOn
      : ["calendar"],
  };
}

function formatDisplayDate(value) {
  if (!value) return "";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDisplayDateRange(startDate, endDate) {
  if (!startDate) return "";

  const safeEndDate = endDate || startDate;

  if (startDate === safeEndDate) {
    return formatDisplayDate(startDate);
  }

  return `${formatDisplayDate(startDate)} - ${formatDisplayDate(safeEndDate)}`;
}

function normalizeStepErrors(stepErrors, mode, step) {
  if (mode !== "edit") return stepErrors;
  if (step !== 2) return stepErrors;

  const nextErrors = { ...stepErrors };

  delete nextErrors.eventDate;
  delete nextErrors.endDate;
  delete nextErrors.startTime;
  delete nextErrors.endTime;

  return nextErrors;
}

export default function OfficerCalendarForm({
  mode = "create",
  selectedDate,
  onCreated,
  onClose,
  initialData = null,
  editingId = "",
  onFinalSubmit,
  finalButtonLabel = "Save Event",
  getTimePickerContainer,
}) {
  const { user } = useAuth();

  const allowBrowserBackRef = useRef(false);

  const [form, setForm] = useState(getInitialForm(selectedDate));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [tagInput, setTagInput] = useState("");
  const [direction, setDirection] = useState(1);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState(null);
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);

  const onCloseRef = useRef(onClose);
  const savingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(() => false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [form, mode, selectedDate]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm(buildEditForm(initialData, selectedDate));
    } else {
      setForm(getInitialForm(selectedDate));
    }

    setErrors({});
    setTouched({});
    setStep(1);
    setTagInput("");
    setDirection(1);
    setExitDialogOpen(false);
    setPendingExitAction(null);
    setDraftConfirmOpen(false);
  }, [selectedDate, mode, initialData]);

  function hasUnsavedChanges() {
    if (mode === "edit") {
      return true;
    }

    const defaultForm = getInitialForm(selectedDate);

    const hasTextChanges =
      safe(form.title) !== safe(defaultForm.title) ||
      safe(form.description) !== safe(defaultForm.description) ||
      safe(form.location) !== safe(defaultForm.location) ||
      safe(form.category) !== safe(defaultForm.category) ||
      safe(form.customCategory) !== safe(defaultForm.customCategory) ||
      safe(form.contactName) !== safe(defaultForm.contactName) ||
      safe(form.contactEmail) !== safe(defaultForm.contactEmail);

    const hasDateChanges =
      safe(form.eventDate) !== safe(defaultForm.eventDate) ||
      safe(form.endDate) !== safe(defaultForm.endDate) ||
      safe(form.startTime) !== safe(defaultForm.startTime) ||
      safe(form.endTime) !== safe(defaultForm.endTime);

    const hasBooleanChanges =
      Boolean(form.allDay) !== Boolean(defaultForm.allDay);

    const hasAudienceChanges =
      JSON.stringify(form.audience || []) !==
      JSON.stringify(defaultForm.audience || []);

    const hasPostedOnChanges =
      JSON.stringify(form.postedOn || []) !==
      JSON.stringify(defaultForm.postedOn || []);

    const hasTagChanges = Array.isArray(form.tags) && form.tags.length > 0;

    const hasImageChange =
      form.coverImageFile instanceof File || Boolean(form.coverImageUrl);

    return Boolean(
      hasTextChanges ||
        hasDateChanges ||
        hasBooleanChanges ||
        hasAudienceChanges ||
        hasPostedOnChanges ||
        hasTagChanges ||
        hasImageChange,
    );
  }

  function requestExit(exitAction) {
    if (saving) return;

    if (hasUnsavedChanges()) {
      setPendingExitAction(() => exitAction);
      setExitDialogOpen(true);
      return;
    }

    exitAction?.();
  }

  function confirmExit() {
    const action = pendingExitAction;

    setPendingExitAction(null);
    setExitDialogOpen(false);

    setTimeout(() => {
      action?.();
    }, 0);
  }

  async function handleSaveDraftAndExit() {
    if (!canSaveDraft) return;

    const action = pendingExitAction;

    setExitDialogOpen(false);
    setPendingExitAction(null);

    const saved = await handleSubmit("draft", {
      skipOnCreated: Boolean(action),
    });

    if (!saved) return;

    setTimeout(() => {
      action?.();
    }, 0);
  }

  function cancelExit() {
    setExitDialogOpen(false);
    setPendingExitAction(null);
  }

  useEffect(() => {
    function handleCalendarFormExitRequest(event) {
      if (saving || exitDialogOpen) return;

      if (!hasUnsavedChanges()) {
        event.detail?.proceed?.();
        return;
      }

      event.preventDefault();

      setPendingExitAction(() => event.detail?.proceed);
      setExitDialogOpen(true);
    }

    window.addEventListener(
      "officer-calendar-form-exit-request",
      handleCalendarFormExitRequest,
    );

    return () => {
      window.removeEventListener(
        "officer-calendar-form-exit-request",
        handleCalendarFormExitRequest,
      );
    };
  }, [saving, exitDialogOpen, form, mode, selectedDate]);

  useEffect(() => {
    const guardState = {
      officerCalendarFormGuard: true,
    };

    window.history.pushState(guardState, "", window.location.href);

    function leaveCreateEventPage() {
      allowBrowserBackRef.current = true;

      if (typeof onCloseRef.current === "function") {
        onCloseRef.current();
        return;
      }

      window.history.back();
    }

    function handlePopState() {
      if (allowBrowserBackRef.current) return;

      if (savingRef.current) {
        window.history.pushState(guardState, "", window.location.href);
        return;
      }

      const hasChanges = hasUnsavedChangesRef.current?.();

      if (!hasChanges) {
        leaveCreateEventPage();
        return;
      }

      window.history.pushState(guardState, "", window.location.href);

      setPendingExitAction(() => {
        return () => {
          leaveCreateEventPage();
        };
      });

      setExitDialogOpen(true);
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

  function getStepErrors(targetStep, nextForm = form) {
    return normalizeStepErrors(
      validateStep(targetStep, nextForm),
      mode,
      targetStep,
    );
  }

  const currentStepErrors = useMemo(
    () => getStepErrors(step, form),
    [step, form],
  );

  const isCurrentStepValid = Object.keys(currentStepErrors).length === 0;

  const canSaveDraft = mode === "edit" || hasUnsavedChanges();

  const formattedDate = useMemo(() => {
    return new Date(selectedDate || new Date()).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const selectedDateDisplay = useMemo(() => {
    if (!form.eventDate) return formattedDate;
    return formatDisplayDateRange(form.eventDate, form.endDate);
  }, [form.eventDate, form.endDate, formattedDate]);

  function handleBlur(field) {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    const stepErrors = getStepErrors(step, form);

    setErrors((prev) => ({
      ...prev,
      [field]: stepErrors[field] || "",
    }));
  }

  function handleChange(field, value) {
    setForm((prev) => {
      let nextForm = {
        ...prev,
        [field]: value,
      };

      if (field === "eventDate") {
        const nextEndDate =
          prev.endDate && prev.endDate >= value ? prev.endDate : value;

        nextForm = {
          ...nextForm,
          endDate: nextEndDate,
        };
      }

      if (field === "allDay" && value === true) {
        nextForm = {
          ...nextForm,
          startTime: "",
          endTime: "",
        };
      }

      const stepErrors = getStepErrors(step, nextForm);

      if (
        touched[field] ||
        touched.endDate ||
        field === "eventDate" ||
        field === "endDate" ||
        field === "allDay" ||
        false
      ) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [field]: stepErrors[field] || "",
          endDate:
            field === "eventDate" || field === "endDate"
              ? stepErrors.endDate || ""
              : prevErrors.endDate,
          startTime:
            field === "allDay" || field === "eventDate" || field === "endDate"
              ? stepErrors.startTime || ""
              : prevErrors.startTime,
          endTime:
            field === "allDay" || field === "eventDate" || field === "endDate"
              ? stepErrors.endTime || ""
              : prevErrors.endTime,
        }));
      }

      return nextForm;
    });
  }

  function handleToggleNewsPosting() {
    setForm((prev) => {
      const hasNews = prev.postedOn.includes("news");

      return {
        ...prev,
        postedOn: hasNews ? ["calendar"] : ["calendar", "news"],
      };
    });
  }

  function handleAddTag() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;

    setForm((prev) => {
      if (prev.tags.includes(trimmed)) return prev;

      return {
        ...prev,
        tags: [...prev.tags, trimmed],
      };
    });

    setTagInput("");
  }

  function handleRemoveTag(tagToRemove) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }

  function handleStepClick(targetStep) {
    if (saving || targetStep === step) return;

    if (targetStep < step) {
      setDirection(-1);
      setStep(targetStep);
      return;
    }

    for (let i = 1; i < targetStep; i += 1) {
      const nextErrors = getStepErrors(i, form);

      if (Object.keys(nextErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...nextErrors }));
        setDirection(i < step ? -1 : 1);
        setStep(i);
        return;
      }
    }

    setDirection(1);
    setStep(targetStep);
  }

  function handleNextStep() {
    const nextErrors = getStepErrors(step, form);
    setErrors((prev) => ({ ...prev, ...nextErrors }));

    if (Object.keys(nextErrors).length > 0) return;

    setDirection(1);
    setStep((prev) => Math.min(prev + 1, STEP_COUNT));
  }

  function handlePrevStep() {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function uploadCoverImage(file, targetId = "") {
    if (!(file instanceof File)) return form.coverImageUrl || "";

    const safeName = file.name.replace(/\s+/g, "-");
    const path = targetId
      ? `calendarEvents/${targetId}/${Date.now()}-${safeName}`
      : `calendarEvents/temp/${Date.now()}-${safeName}`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);

    return await getDownloadURL(storageRef);
  }

  function validateAllSteps() {
    const allErrors = {
      ...getStepErrors(1, form),
      ...getStepErrors(2, form),
      ...getStepErrors(3, form),
      ...getStepErrors(4, form),
      ...getStepErrors(5, form),
    };

    setErrors((prev) => ({ ...prev, ...allErrors }));

    return allErrors;
  }

  async function handleSubmit(action = "save", options = {}) {
    if (action !== "draft") {
      const allErrors = validateAllSteps();

      if (Object.keys(allErrors).length > 0) return false;
    }

    setSaving(true);

    try {
      const actorUid = auth.currentUser?.uid || user?.uid || "";
      const actorName =
        user?.displayName ||
        auth.currentUser?.displayName ||
        user?.email ||
        auth.currentUser?.email ||
        "";
      const actorEmail = user?.email || auth.currentUser?.email || "";

      const nextStatus = action === "draft" ? "draft" : "published";

      if (mode === "edit" && editingId) {
        const uploadedImageUrl = await uploadCoverImage(
          form.coverImageFile,
          editingId,
        );

        const payload = buildEventPayload(
          {
            ...form,
            coverImageUrl: uploadedImageUrl || form.coverImageUrl || "",
            status: nextStatus,
          },
          actorUid,
          actorName,
          actorEmail,
          uploadedImageUrl || form.coverImageUrl || "",
        );

        await updateDoc(doc(db, "calendarEvents", editingId), {
          ...payload,
          endDate: form.endDate || form.eventDate,
          allDay: Boolean(form.allDay),
          startTime: form.allDay ? "" : form.startTime,
          endTime: form.allDay ? "" : form.endTime,
          status: nextStatus,
          createdByUid: initialData?.createdByUid || payload.createdByUid,
          createdByName: initialData?.createdByName || payload.createdByName,
          createdByEmail:
            initialData?.createdByEmail || payload.createdByEmail,
          createdAt: initialData?.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(db, "calendarEvents"), {
          title: form.title.trim(),
          description: form.description.trim(),
          eventDate: form.eventDate,
          endDate: form.endDate || form.eventDate,
          allDay: Boolean(form.allDay),
          startTime: form.allDay ? "" : form.startTime,
          endTime: form.allDay ? "" : form.endTime,
          location: form.location.trim(),
          category: form.category,
          customCategory:
            form.category === "others" ? form.customCategory.trim() : "",
          audience: ["alumni"],
          status: nextStatus,
          coverImageUrl: "",
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim(),
          tags: form.tags,
          postedOn: form.postedOn,
          createdByUid: actorUid,
          createdByName: actorName,
          createdByEmail: actorEmail,
          updatedByUid: actorUid,
          updatedByName: actorName,
          updatedByEmail: actorEmail,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const uploadedImageUrl = await uploadCoverImage(
          form.coverImageFile,
          docRef.id,
        );

        if (uploadedImageUrl) {
          await updateDoc(doc(db, "calendarEvents", docRef.id), {
            coverImageUrl: uploadedImageUrl,
            updatedAt: serverTimestamp(),
          });
        }
      }

      if (!options.skipOnCreated) {
        onCreated?.();
      }

      return true;
    } catch (error) {
      console.error(
        `Failed to ${
          action === "draft"
            ? "save draft"
            : mode === "edit"
              ? "update"
              : "create"
        } event:`,
        error,
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  function handleDraftButtonClick() {
    if (saving || !canSaveDraft) return;

    setDraftConfirmOpen(true);
  }

  async function handleConfirmSaveDraft() {
    if (saving || !canSaveDraft) return;

    const saved = await handleSubmit("draft");

    if (saved) {
      setDraftConfirmOpen(false);
    }
  }

  function handleFinalButtonClick() {
    if (typeof onFinalSubmit === "function") {
      onFinalSubmit(handleSubmit);
      return;
    }

    handleSubmit(mode === "edit" ? "update" : "publish");
  }

  function renderStepContent() {
    switch (step) {
      case 1:
        return (
          <EventBasicDetails
            form={form}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        );

      case 2:
        return (
          <EventSchedule
            form={form}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
            getTimePickerContainer={getTimePickerContainer}
          />
        );

      case 3:
        return (
          <EventAdditionalInfo
            form={form}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
            tagInput={tagInput}
            onTagInputChange={setTagInput}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        );

      case 4:
        return (
          <EventPosting
            form={form}
            onToggleNewsPosting={handleToggleNewsPosting}
          />
        );

      case 5:
        return <EventReview form={form} user={user} />;

      default:
        return null;
    }
  }

  return (
    <>
      <div className="space-y-5">
        <EventStepper currentStep={step} onStepClick={handleStepClick} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <div className="space-y-5">
            <div className="rounded-2xl border border-dashed border-[#3D398C]/20 bg-[#3D398C]/[0.04] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3D398C]/10">
                  <CalendarDays className="h-5 w-5 text-[#3D398C]" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    Selected Date
                  </p>

                  <h3 className="mt-1 text-xl font-semibold text-foreground">
                    {selectedDateDisplay}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Complete each step to {mode === "edit" ? "update" : "save"}{" "}
                    the event properly.
                  </p>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={step}
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
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden xl:block">
            <EventSidebarNotes form={form} />
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="shrink-0 text-sm text-muted-foreground">
              Step {step} of {STEP_COUNT}
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => requestExit(onClose)}
                className="inline-flex h-10 items-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDraftButtonClick}
                disabled={saving || !canSaveDraft}
                className="inline-flex h-10 items-center rounded-xl border border-yellow-300 bg-yellow-50 px-4 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100 hover:text-yellow-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save as Draft"}
              </button>

              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex h-10 items-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                  disabled={saving}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </button>
              ) : null}

              {step < STEP_COUNT ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={saving || !isCurrentStepValid}
                  className="inline-flex h-10 items-center rounded-xl bg-[#3D398C] px-4 text-sm font-medium text-white transition hover:bg-[#2f2b73] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalButtonClick}
                  disabled={saving}
                  className="inline-flex h-10 items-center rounded-xl bg-[#3D398C] px-4 text-sm font-medium text-white transition hover:bg-[#2f2b73] disabled:opacity-60"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : finalButtonLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={draftConfirmOpen} onOpenChange={setDraftConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Event as Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save the event as a draft. You can continue editing and
              publish it later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>
              Keep Editing
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleConfirmSaveDraft();
              }}
              disabled={saving || !canSaveDraft}
              className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 font-medium text-yellow-700 shadow-sm hover:bg-yellow-100 hover:text-yellow-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save as Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
              Your event changes have not been saved. You can save this event as
              a draft before leaving.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={saving}
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
              disabled={saving || !canSaveDraft}
              className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 font-medium text-yellow-700 shadow-sm hover:bg-yellow-100 hover:text-yellow-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save as Draft"}
            </AlertDialogAction>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmExit();
              }}
              disabled={saving}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
