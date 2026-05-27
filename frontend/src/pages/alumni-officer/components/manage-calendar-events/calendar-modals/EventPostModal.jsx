import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  Clock3,
  MapPin,
  UserCircle2,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Lock,
  LockOpen,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

function safe(value) {
  return String(value ?? "").trim();
}

function normalizeEventStatus(status) {
  const value = String(status ?? "").trim().toLowerCase();

  if (
    ["published", "active", "closed", "draft", "completed", "cancelled"].includes(
      value,
    )
  ) {
    return value;
  }

  return "draft";
}

function formatEventStatusLabel(status) {
  const value = normalizeEventStatus(status);

  if (value === "published" || value === "active") return "Active";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusToneClasses(status) {
  switch (normalizeEventStatus(status)) {
    case "published":
    case "active":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "closed":
      return "bg-red-50 text-red-700 border border-red-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border border-red-200";
    case "completed":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "draft":
    default:
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  }
}

function formatEventTimeRange(event) {
  if (event?.allDay) return "All day";

  if (!event?.startTime && !event?.endTime) return "No time provided";

  if (event?.startTime && event?.endTime) {
    return `${event.startTime} - ${event.endTime}`;
  }

  return event?.startTime || event?.endTime || "No time provided";
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

function parseDateSafe(value) {
  if (!value) return null;

  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

function formatDateRange(startValue, endValue, samePattern = "MMMM d, yyyy") {
  const start = parseDateSafe(startValue);
  const end = parseDateSafe(endValue) || start;

  if (!start) return "—";
  if (!end) return format(start, samePattern);

  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");

  if (sameDay) {
    return format(start, samePattern);
  }

  return `${format(start, samePattern)} - ${format(end, samePattern)}`;
}

function formatHeaderDateRange(startValue, endValue) {
  const start = parseDateSafe(startValue);
  const end = parseDateSafe(endValue) || start;

  if (!start) return "No event date";
  if (!end) return format(start, "EEEE, MMMM d, yyyy");

  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");

  if (sameDay) {
    return format(start, "EEEE, MMMM d, yyyy");
  }

  return `${format(start, "EEEE, MMMM d, yyyy")} - ${format(
    end,
    "EEEE, MMMM d, yyyy",
  )}`;
}

function getCreatorPhotoUrl(event) {
  return (
    safe(event?.createdByPhotoURL) ||
    safe(event?.createdByPhotoUrl) ||
    safe(event?.createdByAvatarUrl) ||
    safe(event?.createdByImageUrl) ||
    safe(event?.createdByProfilePhotoURL) ||
    safe(event?.createdByProfilePhotoUrl) ||
    safe(event?.authorPhotoURL) ||
    safe(event?.authorPhotoUrl) ||
    safe(event?.authorImageUrl) ||
    safe(event?.authorProfilePhotoUrl) ||
    safe(event?.profilePhotoURL) ||
    safe(event?.profilePhotoUrl) ||
    safe(event?.profileImageUrl) ||
    safe(event?.avatarUrl) ||
    safe(event?.photoURL) ||
    safe(event?.photoUrl) ||
    safe(event?.userPhotoURL) ||
    safe(event?.userPhotoUrl) ||
    safe(event?.createdBy?.photoURL) ||
    safe(event?.createdBy?.photoUrl) ||
    safe(event?.createdBy?.profilePhotoUrl) ||
    safe(event?.author?.photoURL) ||
    safe(event?.author?.photoUrl) ||
    safe(event?.author?.profilePhotoUrl) ||
    ""
  );
}

function getCreatorInitials(name = "") {
  const words = safe(name)
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "";

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return `${words[0].charAt(0)}${words[
    words.length - 1
  ].charAt(0)}`.toUpperCase();
}


function unlockPagePointer() {
  if (typeof document === "undefined") return;

  window.setTimeout(() => {
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.body.removeAttribute("data-scroll-locked");

    document.documentElement.style.pointerEvents = "";
    document.documentElement.style.overflow = "";
    document.documentElement.style.paddingRight = "";
    document.documentElement.removeAttribute("data-scroll-locked");
  }, 0);
}

function CreatorAvatar({ event, photoFailed, onPhotoError }) {
  const creatorName = event?.createdByName || "Alumni Officer";
  const creatorPhotoUrl = getCreatorPhotoUrl(event);
  const initials = getCreatorInitials(creatorName);

  if (creatorPhotoUrl && !photoFailed) {
    return (
      <img
        src={creatorPhotoUrl}
        alt={creatorName}
        onError={onPhotoError}
        className="h-11 w-11 rounded-full border border-border object-cover shadow-sm"
      />
    );
  }

  if (initials) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#3D398C]/15 bg-[#3D398C]/10 text-sm font-bold text-[#3D398C] shadow-sm">
        {initials}
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3D398C]/10">
      <UserCircle2 className="h-6 w-6 text-[#3D398C]" />
    </div>
  );
}

export default function EventPostModal({
  open,
  onOpenChange,
  event,
  onEditPost,
  onDeletePost,
  onClosePost,
  onOpenPost,
  onPrevPost,
  onNextPost,
  canGoPrev = false,
  canGoNext = false,
  currentIndex = 0,
  totalCount = 0,
}) {
  const [openActionsMenu, setOpenActionsMenu] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [creatorPhotoFailed, setCreatorPhotoFailed] = useState(false);

  useEffect(() => {
    if (!open) {
      setOpenActionsMenu(false);
      setOpenDeleteDialog(false);
      setOpenStatusDialog(false);
      setFullImageOpen(false);
      unlockPagePointer();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      unlockPagePointer();
    };
  }, []);

  useEffect(() => {
    setCreatorPhotoFailed(false);
  }, [
    event?.id,
    event?.createdByUid,
    event?.createdByPhotoURL,
    event?.createdByPhotoUrl,
  ]);

  useEffect(() => {
    if (!event) {
      setPreviewUrl("");
      return;
    }

    if (event.coverImageFile instanceof File) {
      const objectUrl = URL.createObjectURL(event.coverImageFile);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (event.coverImageUrl && event.coverImageUrl.trim()) {
      setPreviewUrl(event.coverImageUrl);
      return;
    }

    setPreviewUrl("");
  }, [event]);

  const eventStatus = useMemo(
    () => normalizeEventStatus(event?.status),
    [event?.status],
  );

  if (!event) return null;

  const displayCategory =
    event.category === "others" ? event.customCategory : event.category;

  const canClose = eventStatus === "published" || eventStatus === "active";
  const canOpen = eventStatus === "closed";

  const showActions =
    typeof onEditPost === "function" ||
    typeof onDeletePost === "function" ||
    (canClose && typeof onClosePost === "function") ||
    (canOpen && typeof onOpenPost === "function");

  function closeMainModal() {
    setOpenActionsMenu(false);
    setOpenDeleteDialog(false);
    setOpenStatusDialog(false);
    setFullImageOpen(false);
    onOpenChange?.(false);
    unlockPagePointer();
  }

  function handleEdit() {
    if (typeof onEditPost !== "function") return;

    const selectedEvent = event;

    closeMainModal();

    window.setTimeout(() => {
      onEditPost(selectedEvent);
      unlockPagePointer();
    }, 80);
  }

  function handleDeleteClick() {
    setOpenActionsMenu(false);

    window.setTimeout(() => {
      setOpenDeleteDialog(true);
    }, 0);
  }

  function handleStatusClick() {
    setOpenActionsMenu(false);

    if (canOpen && typeof onOpenPost === "function") {
      const selectedEvent = event;

      closeMainModal();

      window.setTimeout(() => {
        onOpenPost(selectedEvent);
        unlockPagePointer();
      }, 120);

      return;
    }

    if (canClose && typeof onClosePost === "function") {
      window.setTimeout(() => {
        setOpenStatusDialog(true);
      }, 0);
    }
  }

  function handleConfirmDelete() {
    setOpenDeleteDialog(false);
    unlockPagePointer();

    if (typeof onDeletePost === "function") {
      onDeletePost(event);
    }
  }

  async function handleConfirmStatusAction() {
    setOpenStatusDialog(false);

    if (canClose && typeof onClosePost === "function") {
      await onClosePost(event);
    }

    unlockPagePointer();
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setOpenActionsMenu(false);
            setOpenDeleteDialog(false);
            setOpenStatusDialog(false);
            setFullImageOpen(false);
            unlockPagePointer();
          }

          onOpenChange?.(nextOpen);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] overflow-hidden p-0 sm:max-w-2xl"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{event.title}</DialogTitle>
          </DialogHeader>

          <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <div className="z-30 flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/85">
              <div className="flex min-w-0 items-center gap-3">
                <CreatorAvatar
                  event={event}
                  photoFailed={creatorPhotoFailed}
                  onPhotoError={() => setCreatorPhotoFailed(true)}
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {event.createdByName || "Alumni Officer"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {formatHeaderDateRange(event.eventDate, event.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {showActions ? (
                  <DropdownMenu
                    open={openActionsMenu}
                    onOpenChange={setOpenActionsMenu}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-44">
                      {typeof onEditPost === "function" ? (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            handleEdit();
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      ) : null}

                      {canClose && typeof onClosePost === "function" ? (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            handleStatusClick();
                          }}
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          Close
                        </DropdownMenuItem>
                      ) : null}

                      {canOpen && typeof onOpenPost === "function" ? (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            handleStatusClick();
                          }}
                        >
                          <LockOpen className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                      ) : null}

                      {typeof onDeletePost === "function" ? (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            handleDeleteClick();
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeMainModal}
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {previewUrl ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFullImageOpen(true);
                  }}
                  className="block w-full border-b border-border bg-muted/20 text-left"
                  aria-label="Open event image"
                >
                  <img
                    src={previewUrl}
                    alt={event.title}
                    className="h-[260px] w-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-[220px] w-full items-center justify-center border-b border-border bg-gradient-to-br from-[#3D398C] via-[#4a46a8] to-[#18B4E8] px-6 text-center">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                      Alumni Event
                    </p>
                    <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white">
                      {event.title}
                    </h2>
                  </div>
                </div>
              )}

              <div className="space-y-5 px-5 py-5">
                <div>
                  <h2 className="text-2xl font-bold leading-tight text-foreground">
                    {event.title}
                  </h2>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {displayCategory ? (
                      <span className="rounded-full bg-[#3D398C]/10 px-3 py-1 text-xs font-semibold capitalize text-[#3D398C]">
                        {displayCategory}
                      </span>
                    ) : null}

                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusToneClasses(eventStatus),
                      ].join(" ")}
                    >
                      {formatEventStatusLabel(eventStatus)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <CalendarDays className="h-4 w-4 text-[#3D398C]" />
                      Date
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {formatDateRange(event.eventDate, event.endDate)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Clock3 className="h-4 w-4 text-[#3D398C]" />
                      Time
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {formatEventTimeRange(event)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <MapPin className="h-4 w-4 text-[#3D398C]" />
                      Location
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {event.location || "—"}
                    </p>
                  </div>
                </div>

                {(event.contactName || event.contactEmail) && (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Contact Information
                    </p>

                    <div className="mt-2 space-y-1">
                      {event.contactName ? (
                        <p className="text-sm font-semibold text-foreground">
                          {event.contactName}
                        </p>
                      ) : null}

                      {event.contactEmail ? (
                        <p className="text-sm text-muted-foreground">
                          {event.contactEmail}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-background px-4 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {event.description || "No description provided."}
                  </p>
                </div>

                {event.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
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

            {totalCount > 1 ? (
              <div className="flex shrink-0 items-center justify-center gap-3 border-t border-border bg-card px-5 py-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onPrevPost}
                  disabled={!canGoPrev}
                  className="h-9 w-9 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="min-w-[60px] text-center text-xs font-medium text-muted-foreground">
                  {currentIndex + 1} / {totalCount}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onNextPost}
                  disabled={!canGoNext}
                  className="h-9 w-9 rounded-xl"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {event.title || "this event"}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={unlockPagePointer}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={openStatusDialog && canClose}
        onOpenChange={(nextOpen) => {
          setOpenStatusDialog(nextOpen);

          if (!nextOpen) {
            unlockPagePointer();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark{" "}
              <span className="font-medium text-foreground">
                {event.title || "this event"}
              </span>{" "}
              as closed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={unlockPagePointer}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusAction}
              className="bg-[#3D398C] text-white hover:bg-[#2f2b73]"
            >
              Close Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {fullImageOpen && previewUrl ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullImageOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFullImageOpen(false);
            }}
            className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>

          <img
            src={previewUrl}
            alt={event.title || "Event preview"}
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}

    </>
  );
}