import { Newspaper, CircleOff } from "lucide-react";

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

export default function EventPosting({ form, onToggleNewsPosting }) {
  const hasNews = form.postedOn.includes("news");

  function handleEnableNewsPosting() {
    if (!hasNews) {
      onToggleNewsPosting();
    }
  }

  function handleDisableNewsPosting() {
    if (hasNews) {
      onToggleNewsPosting();
    }
  }

  return (
    <div className="rounded-2xl border border-border p-5">
      <SectionHeader
        icon={Newspaper}
        title="Step 5: Posting Destination"
        helper="This event will always appear in Calendar. You can also post it to News Feed."
      />

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <ChoiceCard
          icon={Newspaper}
          title="Yes, also post in News Feed"
          description="This event will be posted in both Calendar and News Feed."
          active={hasNews}
          onClick={handleEnableNewsPosting}
        />

        <ChoiceCard
          icon={CircleOff}
          title="No, Calendar only"
          description="This event will only appear in Calendar."
          active={!hasNews}
          onClick={handleDisableNewsPosting}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground">
          Posted on: {form.postedOn.join(", ")}
        </div>
      </div>
    </div>
  );
}