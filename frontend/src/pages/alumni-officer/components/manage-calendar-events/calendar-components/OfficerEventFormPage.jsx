import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "@/pages/alumni-officer/services/firebaseCompat";

import { db } from "@/pages/alumni-officer/services/firebaseCompat";

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
import { Card, CardContent } from "@/components/ui/card";

import OfficerCalendarForm from "./OfficerCalendarForm.jsx";

function safe(value) {
  return String(value ?? "").trim();
}

function getDateFromState(value) {
  if (!value) return null;

  try {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

function getDateFromEvent(event) {
  const eventDate = safe(event?.eventDate);

  if (!eventDate) return null;

  try {
    const parsed = new Date(`${eventDate}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export default function OfficerEventFormPage({
  mode: modeProp = "",
  selectedDate: selectedDateProp,
  initialData: initialDataProp = null,
  editingId: editingIdProp = "",
  onDone,
  onCancel,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [openPrimaryDialog, setOpenPrimaryDialog] = useState(false);
  const [submitRef, setSubmitRef] = useState(() => async () => {});
  const [eventData, setEventData] = useState(initialDataProp);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [eventError, setEventError] = useState("");

  const formLayerRef = useRef(null);

  const routeEventId = safe(params.eventId || params.id);
  const editingId = safe(editingIdProp) || routeEventId;

  const mode = useMemo(() => {
    if (modeProp) return modeProp;
    if (editingId) return "edit";
    if (location.pathname.includes("/edit/")) return "edit";
    return "create";
  }, [modeProp, editingId, location.pathname]);

  const isEdit = mode === "edit";

  const selectedDate = useMemo(() => {
    if (selectedDateProp) return selectedDateProp;

    const stateDate =
      getDateFromState(location.state?.selectedDate) ||
      getDateFromState(location.state?.date);

    if (stateDate) return stateDate;

    const eventDate =
      getDateFromEvent(initialDataProp) ||
      getDateFromEvent(location.state?.event) ||
      getDateFromEvent(eventData);

    if (eventDate) return eventDate;

    return new Date();
  }, [
    selectedDateProp,
    location.state?.selectedDate,
    location.state?.date,
    location.state?.event,
    initialDataProp,
    eventData,
  ]);

  function goBackToCalendar() {
    if (typeof onCancel === "function") {
      onCancel();
      return;
    }

    navigate("/alumni-officer/calendar", { replace: true });
  }

  function handleDone() {
    if (typeof onDone === "function") {
      onDone();
      return;
    }

    navigate("/alumni-officer/calendar", { replace: true });
  }

  function handleRequestClose() {
    goBackToCalendar();
  }

  useEffect(() => {
    if (!isEdit) {
      setEventData(initialDataProp || null);
      setEventError("");
      setLoadingEvent(false);
      return;
    }

    if (initialDataProp) {
      setEventData(initialDataProp);
      setEventError("");
      setLoadingEvent(false);
      return;
    }

    if (location.state?.event) {
      setEventData(location.state.event);
      setEventError("");
      setLoadingEvent(false);
      return;
    }

    if (!editingId) {
      setEventData(null);
      setEventError("Event could not be loaded because the event ID is missing.");
      setLoadingEvent(false);
      return;
    }

    let ignore = false;

    async function loadEvent() {
      try {
        setLoadingEvent(true);
        setEventError("");

        const eventRef = doc(db, "calendarEvents", editingId);
        const eventSnap = await getDoc(eventRef);

        if (ignore) return;

        if (!eventSnap.exists()) {
          setEventData(null);
          setEventError("This event no longer exists or could not be found.");
          return;
        }

        setEventData({
          id: eventSnap.id,
          ...eventSnap.data(),
        });
      } catch (error) {
        if (ignore) return;

        console.error("Failed to load calendar event:", error);
        setEventData(null);
        setEventError(
          error?.message || "Failed to load this calendar event.",
        );
      } finally {
        if (!ignore) {
          setLoadingEvent(false);
        }
      }
    }

    loadEvent();

    return () => {
      ignore = true;
    };
  }, [isEdit, initialDataProp, location.state?.event, editingId]);

  if (isEdit && loadingEvent) {
    return (
      <Card className="border-border/40 bg-muted/20">
        <CardContent className="w-full min-w-0 pt-5">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3D398C] border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Loading calendar event...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isEdit && eventError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="w-full min-w-0 pt-5">
          <p className="text-sm font-bold text-red-700">
            Calendar event could not be loaded.
          </p>

          <p className="mt-1 text-sm text-red-600">{eventError}</p>

          <button
            type="button"
            onClick={() => navigate("/alumni-officer/calendar", { replace: true })}
            className="mt-4 inline-flex h-10 items-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Back to Calendar
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div
        ref={formLayerRef}
        className="relative overflow-visible rounded-2xl px-0 py-0"
      >
        <OfficerCalendarForm
          mode={mode}
          selectedDate={selectedDate}
          initialData={isEdit ? eventData : initialDataProp}
          editingId={editingId}
          onCreated={handleDone}
          onClose={handleRequestClose}
          finalButtonLabel={isEdit ? "Update Event" : "Finish"}
          getTimePickerContainer={() => formLayerRef.current}
          onFinalSubmit={(submitFn) => {
            setSubmitRef(() => submitFn);
            setOpenPrimaryDialog(true);
          }}
        />
      </div>

      <AlertDialog open={openPrimaryDialog} onOpenChange={setOpenPrimaryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEdit ? "Update this event?" : "Publish this event?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEdit
                ? "This will save your latest changes to the event."
                : "This will save the event and publish it to the selected destinations."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={async () => {
                await submitRef(isEdit ? "update" : "publish");
              }}
              className="bg-[#3D398C] text-white hover:bg-[#2f2b73]"
            >
              {isEdit ? "Update Event" : "Publish Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}