// src/pages/alumni-intern/components/AlumniServices.jsx

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  CalendarDays,
  BadgePercent,
  LayoutGrid,
  Lock,
} from "lucide-react";

import AlumniPerksDiscounts from "./services/AlumniPerksDiscounts";
import AlumniCalendarEvents from "./services/AlumniCalendarEvents";
import AlumniDocumentRequest from "./services/AlumniDocumentRequest";

const BRAND_BLUE = "#3D398C";

function safe(value) {
  return String(value ?? "").trim();
}

function getStoredAccount() {
  try {
    const raw = localStorage.getItem("nuai_account");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredProfile(account) {
  try {
    const possibleKeys = [
      "nuai_profile",
      "nuai_user_profile",
      account?.email ? `nuai_profile_${account.email}` : "",
    ].filter(Boolean);

    for (const key of possibleKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function resolveUserRole(profile, account) {
  return (
    safe(profile?.role) ||
    safe(profile?.personalization?.role) ||
    safe(profile?.accountType) ||
    safe(profile?.account_type) ||
    safe(account?.role) ||
    safe(account?.accountType) ||
    safe(account?.account_type) ||
    "Alumni"
  );
}

function ServiceTabButton({
  icon: Icon,
  title,
  description,
  active,
  disabled,
  disabledLabel,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={[
        "w-full rounded-2xl border px-4 py-4 text-left transition-all duration-200",
        disabled
          ? "cursor-not-allowed border-border/50 bg-muted/40 text-muted-foreground opacity-70"
          : active
            ? "border-[#3D398C]/20 bg-[#3D398C]/8 text-[#3D398C] shadow-sm"
            : "border-border/60 bg-card text-foreground hover:border-[#3D398C]/20 hover:bg-[#3D398C]/5",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{
            backgroundColor: disabled
              ? "rgba(120,120,120,0.08)"
              : active
                ? `${BRAND_BLUE}18`
                : `${BRAND_BLUE}10`,
          }}
        >
          <Icon
            size={18}
            className={disabled ? "text-muted-foreground" : "text-[#3D398C]"}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold leading-tight">{title}</p>

            {disabled ? (
              <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : null}
          </div>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {disabled && disabledLabel ? disabledLabel : description}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function AlumniServices() {
  const [account, setAccount] = useState(() => getStoredAccount());
  const [profile, setProfile] = useState(() => {
    const storedAccount = getStoredAccount();
    return getStoredProfile(storedAccount) || storedAccount || {};
  });

  const [activeServiceTab, setActiveServiceTab] = useState("perks");

  useEffect(() => {
    const storedAccount = getStoredAccount();
    const storedProfile = getStoredProfile(storedAccount);

    setAccount(storedAccount);
    setProfile(storedProfile || storedAccount || {});
  }, []);

  const userRole = resolveUserRole(profile, account);
  const isIntern = userRole.toLowerCase() === "intern";

  const tabs = useMemo(
    () => [
      {
        key: "request-document",
        title: "Request Document",
        description:
          "Submit requests for alumni-related documents and track their processing.",
        disabledLabel: "Document requests are available for alumni accounts only.",
        icon: FileText,
        disabled: isIntern,
      },
      {
        key: "calendar",
        title: "Calendar of Events",
        description:
          "View upcoming alumni activities, announcements, and important dates.",
        icon: CalendarDays,
        disabled: false,
      },
      {
        key: "perks",
        title: "Perks & Discounts",
        description:
          "Explore exclusive alumni perks, partner promos, and special discounts.",
        icon: BadgePercent,
        disabled: false,
      },
    ],
    [isIntern],
  );

  useEffect(() => {
    if (isIntern && activeServiceTab === "request-document") {
      setActiveServiceTab("perks");
    }
  }, [isIntern, activeServiceTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${BRAND_BLUE}12` }}
        >
          <LayoutGrid size={16} style={{ color: BRAND_BLUE }} />
        </div>

        <div>
          <h2
            className="text-lg font-bold leading-tight"
            style={{ color: BRAND_BLUE }}
          >
            Alumni Services
          </h2>
          <p className="text-xs text-muted-foreground">
            Access alumni tools, events, and exclusive benefits in one place
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {tabs.map((tab) => (
          <ServiceTabButton
            key={tab.key}
            icon={tab.icon}
            title={tab.title}
            description={tab.description}
            disabledLabel={tab.disabledLabel}
            active={activeServiceTab === tab.key}
            disabled={tab.disabled}
            onClick={() => setActiveServiceTab(tab.key)}
          />
        ))}
      </div>

      {activeServiceTab === "perks" && <AlumniPerksDiscounts />}
      {activeServiceTab === "calendar" && <AlumniCalendarEvents />}
      {activeServiceTab === "request-document" && !isIntern && (
        <AlumniDocumentRequest />
      )}
    </div>
  );
}
