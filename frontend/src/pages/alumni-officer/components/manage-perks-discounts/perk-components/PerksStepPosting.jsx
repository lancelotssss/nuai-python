import { Newspaper, CircleOff } from "lucide-react";
import { Send } from "lucide-react";
import { PerksFormSectionCard } from "./PerksFormSectionCard";

function SectionHeader({ icon: Icon, title, helper }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D398C]/10">
        <Icon className="h-5 w-5 text-[#3D398C]" />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </div>
    </div>
  );
}

function ChoiceCard({ icon: Icon, title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-2xl border p-4 text-left transition-all",
        active
          ? "border-[#3D398C]/30 bg-[#3D398C]/10"
          : "border-border bg-card hover:border-[#3D398C]/20 hover:bg-muted/40",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border transition",
            active
              ? "border-[#3D398C] bg-[#3D398C]"
              : "border-muted-foreground/40 bg-background",
          ].join(" ")}
        >
          {active ? <div className="h-2 w-2 rounded-full bg-white" /> : null}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-[#3D398C]" />
            <p className="font-semibold text-foreground">{title}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default function PerksStepPosting({
  postedOn = [],
  togglePostedOnOption,
  shouldShowFieldError,
  errors,
}) {
  const hasNews = postedOn.includes("news");

  function handleEnableNewsPosting() {
    if (!hasNews) {
      togglePostedOnOption("news");
    }
  }

  function handleDisableNewsPosting() {
    if (hasNews) {
      togglePostedOnOption("news");
    }
  }

  return (
    <PerksFormSectionCard
      icon={Send}
      title="Step 4: Posting Destination"
      helper="This perk or discount will always appear in Services. You can also post it to News Feed."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <ChoiceCard
          icon={Newspaper}
          title="Yes, also post in News Feed"
          description="This perk or discount will be posted in both Services and News Feed."
          active={hasNews}
          onClick={handleEnableNewsPosting}
        />

        <ChoiceCard
          icon={CircleOff}
          title="No, Services only"
          description="This perk or discount will only appear in Services."
          active={!hasNews}
          onClick={handleDisableNewsPosting}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground">
          Posted on: {hasNews ? "services, news" : "services"}
        </div>
      </div>

      {shouldShowFieldError("postedOn", 4) && errors.postedOn ? (
        <p className="mt-3 text-sm text-destructive">{errors.postedOn}</p>
      ) : null}
    </PerksFormSectionCard>
  );
}