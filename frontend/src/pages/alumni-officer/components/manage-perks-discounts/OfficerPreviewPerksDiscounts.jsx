import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp } from "@/pages/alumni-officer/services/firebaseCompat";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  Link as LinkIcon,
  MapPin,
  Tag,
  Pencil,
  CheckCircle2,
  FileText,
  Archive,
  Settings2,
  LayoutGrid,
  Newspaper,
} from "lucide-react";

import { db } from "@/pages/alumni-officer/services/firebaseCompat";
import { Button } from "@/components/ui/button";
import PerksPostPreview from "./perk-components/PerksPostPreview";
import AlumniPerksDiscountCardPreview from "@/pages/alumni-intern/components/services/AlumniPerksDiscountCardPreview";

import {
  cleanText,
  splitRequirements,
  normalizeUrl,
} from "./perk-utils/perkFormUtils";

function safe(v) {
  return String(v ?? "").trim();
}

function normalizeStatus(status) {
  const value = safe(status).toLowerCase();

  if (["active", "closed", "draft"].includes(value)) {
    return value;
  }

  return "draft";
}

function statusLabel(status) {
  const s = normalizeStatus(status);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(value) {
  try {
    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }

    if (typeof value?.seconds === "number") {
      return new Date(value.seconds * 1000).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }

    return "—";
  } catch {
    return "—";
  }
}

function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  if (typeof value?.seconds === "number") {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value?._seconds === "number") {
    const date = new Date(value._seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseTimeToParts(time) {
  const value = safe(time);

  if (!value) {
    return {
      hours: 23,
      minutes: 59,
    };
  }

  const twelveHourMatch = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2] || 0);
    const period = twelveHourMatch[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return {
      hours,
      minutes,
    };
  }

  const twentyFourHourMatch = value.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFourHourMatch) {
    return {
      hours: Number(twentyFourHourMatch[1]),
      minutes: Number(twentyFourHourMatch[2]),
    };
  }

  return {
    hours: 23,
    minutes: 59,
  };
}

function buildPerkEndDateTime(perk) {
  const endDate = parseDate(perk?.endDate || perk?.startDate);

  if (!endDate) return null;

  const { hours, minutes } = parseTimeToParts(perk?.endTime);

  const endDateTime = new Date(endDate);
  endDateTime.setHours(hours, minutes, 59, 999);

  return endDateTime;
}

function isExpired(perk) {
  const savedStatus = normalizeStatus(perk?.status);

  if (savedStatus !== "active") return false;

  const endDateTime = buildPerkEndDateTime(perk);

  if (!endDateTime) return false;

  return endDateTime.getTime() < Date.now();
}

function getEffectiveStatus(perk) {
  const saved = normalizeStatus(perk?.status);

  if (saved === "closed") return "closed";
  if (saved === "draft") return "draft";
  if (isExpired(perk)) return "closed";

  return saved;
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3D398C]/10">
          <Icon className="h-4 w-4 text-[#3D398C]" />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-medium text-foreground">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  children,
  active = false,
  disabled = false,
  onClick,
  variant = "outline",
  className = "",
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      className={[
        "h-9 rounded-lg px-3 font-medium shadow-sm transition-all",
        active ? "pointer-events-none opacity-100" : "",
        className,
      ].join(" ")}
    >
      <Icon className="mr-2 h-4 w-4" />
      {children}
    </Button>
  );
}

function PreviewBlock({ icon: Icon, title, helper, children }) {
  return (
    <div className="space-y-3 rounded-2xl bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D398C]/10">
          <Icon className="h-5 w-5 text-[#3D398C]" />
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

export default function OfficerPreviewPerksDiscounts({
  perkId = "",
  onBack,
  onEdit,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const routePerkId = safe(params.perkId || params.id);
  const resolvedPerkId =
    safe(perkId) ||
    routePerkId ||
    safe(location.state?.perkId) ||
    safe(location.state?.id);

  const [perk, setPerk] = useState(location.state?.perk || null);
  const [loading, setLoading] = useState(!location.state?.perk);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");

  function handleBack() {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    navigate("/alumni-officer/perks-discounts");
  }

  function handleEdit() {
    if (!perk?.id && !resolvedPerkId) return;

    const finalPerkId = safe(perk?.id) || resolvedPerkId;
    const finalTitle = safe(perk?.postHeader) || "Perks & Discounts";

    if (typeof onEdit === "function") {
      onEdit(finalPerkId, finalTitle);
      return;
    }

    navigate(`/alumni-officer/perks-discounts/edit/${finalPerkId}`, {
      state: {
        perk,
        perkId: finalPerkId,
        perkTitle: finalTitle,
        title: finalTitle,
        breadcrumbLabel: finalTitle,
        from: "/alumni-officer/perks-discounts/view",
      },
    });
  }

  async function autoCloseIfExpired(data, id) {
    const status = normalizeStatus(data?.status);

    if (status === "closed" || status === "draft") return data;
    if (!isExpired(data)) return data;

    await updateDoc(doc(db, "perksDiscounts", id), {
      status: "closed",
      effectiveStatus: "closed",
      closedAt: new Date(),
      closedBySystem: true,
      closedReason: "PERK_END_DATE_TIME_REACHED",
      updatedAt: new Date(),
    });

    return {
      ...data,
      status: "closed",
      effectiveStatus: "closed",
      closedAt: new Date(),
      closedBySystem: true,
      closedReason: "PERK_END_DATE_TIME_REACHED",
      updatedAt: new Date(),
    };
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchPerk() {
      if (!resolvedPerkId) {
        setError("No perk selected.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const snap = await getDoc(doc(db, "perksDiscounts", resolvedPerkId));

        if (!snap.exists()) {
          throw new Error("Perk not found.");
        }

        const data = {
          id: snap.id,
          ...snap.data(),
        };

        let nextData = data;

        try {
          nextData = await autoCloseIfExpired(data, resolvedPerkId);
        } catch (autoCloseErr) {
          console.error("Failed to auto-close perk:", autoCloseErr);
        }

        if (!cancelled) {
          setPerk(nextData);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(err?.message || "Failed to load perk.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPerk();

    return () => {
      cancelled = true;
    };
  }, [resolvedPerkId]);

  async function updateStatus(newStatus) {
    if (!perk?.id || statusLoading) return;

    try {
      setStatusLoading(true);

      const now = new Date();
      const statusPatch =
        newStatus === "active"
          ? {
              status: "active",
              effectiveStatus: "active",
              reopenedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              closedBySystem: false,
              closedReason: null,
            }
          : newStatus === "closed"
            ? {
                status: "closed",
                effectiveStatus: "closed",
                closedAt: serverTimestamp(),
                closedBySystem: false,
                closedReason: "MANUALLY_CLOSED",
                updatedAt: serverTimestamp(),
              }
            : {
                status: newStatus,
                effectiveStatus: newStatus,
                updatedAt: serverTimestamp(),
              };

      await updateDoc(doc(db, "perksDiscounts", perk.id), statusPatch);

      setPerk((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              effectiveStatus: newStatus,
              updatedAt: now,
              ...(newStatus === "active"
                ? {
                    reopenedAt: now,
                    closedBySystem: false,
                    closedReason: null,
                  }
                : {}),
              ...(newStatus === "closed"
                ? {
                    closedAt: now,
                    closedBySystem: false,
                    closedReason: "MANUALLY_CLOSED",
                  }
                : {}),
            }
          : prev,
      );

      toast.success(`Status set to ${statusLabel(newStatus)}.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  }

  const effectiveStatus = useMemo(() => getEffectiveStatus(perk), [perk]);

  const links = useMemo(() => {
    return Array.isArray(perk?.links)
      ? perk.links.map((l) => normalizeUrl(l)).filter(Boolean)
      : [];
  }, [perk]);

  const requirements = useMemo(() => {
    if (Array.isArray(perk?.requirements)) return perk.requirements;
    return splitRequirements(perk?.requirements || "");
  }, [perk]);

  const images = Array.isArray(perk?.photoURLs) ? perk.photoURLs : [];
  const postedOn = Array.isArray(perk?.postedOn) ? perk.postedOn : [];

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-muted-foreground">
        Loading preview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
      </div>
    );
  }

  if (!perk) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4 rounded-2xl bg-card p-0">
          {postedOn.includes("services") && (
            <PreviewBlock
              icon={LayoutGrid}
              title="Alumni Services Preview"
              helper="This is how it will appear inside Alumni Services > Perks & Discounts."
            >
              <AlumniPerksDiscountCardPreview
                companyName={cleanText(perk.companyName)}
                location={cleanText(perk.location)}
                postHeader={cleanText(perk.postHeader)}
                postContent={cleanText(perk.postContent)}
                startDate={perk.startDate}
                endDate={perk.endDate}
                startTime={perk.startTime}
                endTime={perk.endTime}
                allDay={Boolean(perk.allDay)}
                category={perk.category}
                customCategory={perk.customCategory}
                perkCategory={perk.perkCategory}
                discountCategory={perk.discountCategory}
                requirements={requirements}
                links={links}
                imageUrls={images}
              />
            </PreviewBlock>
          )}

          {postedOn.includes("news") && (
            <PreviewBlock
              icon={Newspaper}
              title="News Feed Preview"
              helper="This is how it will appear when posted in News Feed."
            >
              <PerksPostPreview
                companyName={cleanText(perk.companyName)}
                location={cleanText(perk.location)}
                postHeader={cleanText(perk.postHeader)}
                postContent={cleanText(perk.postContent)}
                startDate={perk.startDate}
                endDate={perk.endDate}
                startTime={perk.startTime}
                endTime={perk.endTime}
                allDay={Boolean(perk.allDay)}
                category={perk.category || perk.perkCategory || perk.discountCategory || ""}
                customCategory={perk.customCategory}
                requirements={requirements}
                links={links}
                imageUrls={images}
                status={effectiveStatus}
              />
            </PreviewBlock>
          )}

          {!postedOn.includes("services") && !postedOn.includes("news") && (
            <div className="rounded-2xl bg-muted/20 p-6 text-sm text-muted-foreground">
              No preview destination selected.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3D398C]/10">
                <Settings2 className="h-4 w-4 text-[#3D398C]" />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Action Buttons
                </p>
                <p className="text-xs text-muted-foreground">
                  Use these controls to manage this perk or discount.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleEdit}
                variant="outline"
                className="h-9 w-full justify-start rounded-lg border-[#3D398C]/20 bg-[#3D398C]/5 text-[#3D398C] shadow-sm hover:bg-[#3D398C]/10"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>

              <ActionButton
                icon={effectiveStatus === "active" ? Archive : CheckCircle2}
                variant="outline"
                disabled={statusLoading}
                onClick={() =>
                  updateStatus(effectiveStatus === "active" ? "closed" : "active")
                }
                className={[
                  "w-full justify-start",
                  effectiveStatus === "active"
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
                ].join(" ")}
              >
                {statusLoading
                  ? "Updating..."
                  : effectiveStatus === "active"
                    ? "Close Perk & Discount"
                    : "Set as Active"}
              </ActionButton>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3D398C]/10">
                <Settings2 className="h-4 w-4 text-[#3D398C]" />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Publish Notes
                </p>
                <p className="text-xs text-muted-foreground">
                  Review the saved publishing details for this perk or discount.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <InfoCard
                icon={Building2}
                label="Company"
                value={perk.companyName}
              />

              <InfoCard icon={FileText} label="Title" value={perk.postHeader} />

              <InfoCard icon={MapPin} label="Location" value={perk.location} />

              <InfoCard
                icon={Calendar}
                label="Date Range"
                value={`${perk.startDate || "—"} — ${perk.endDate || "—"}`}
              />

              <InfoCard
                icon={Calendar}
                label="Time"
                value={
                  perk.allDay
                    ? "All-day"
                    : `${perk.startTime || "—"} — ${perk.endTime || "—"}`
                }
              />

              <InfoCard
                icon={Tag}
                label="Category"
                value={
                  perk.category === "others"
                    ? perk.customCategory || "Others"
                    : perk.category ||
                      perk.customCategory ||
                      perk.perkCategory ||
                      perk.discountCategory ||
                      "None"
                }
              />

              <InfoCard
                icon={Tag}
                label="Requirements"
                value={requirements.length ? requirements.join(", ") : "None"}
              />

              <InfoCard
                icon={LinkIcon}
                label="Links"
                value={links.length ? links.join(", ") : "None"}
              />

              <InfoCard
                icon={Calendar}
                label="Created"
                value={formatDate(perk.createdAt)}
              />

              <InfoCard
                icon={Settings2}
                label="Posted On"
                value={postedOn.length ? postedOn.join(", ") : "None"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}