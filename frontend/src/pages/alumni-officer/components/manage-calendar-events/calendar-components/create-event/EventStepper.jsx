import {
  ClipboardList,
  CalendarDays,
  Tag,
  Newspaper,
  Save,
  Check,
} from "lucide-react";

const STEPS = [
  {
    step: 1,
    title: "Basic Details",
    icon: ClipboardList,
  },
  {
    step: 2,
    title: "Schedule",
    icon: CalendarDays,
  },
  {
    step: 3,
    title: "Additional Information",
    icon: Tag,
  },
  {
    step: 4,
    title: "Posting Destination",
    icon: Newspaper,
  },
  {
    step: 5,
    title: "Review & Save",
    icon: Save,
  },
];

export default function EventStepper({
  currentStep = 1,
  onStepClick = null,
}) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {STEPS.map((item) => {
        const Icon = item.icon;
        const isActive = currentStep === item.step;
        const isCompleted = currentStep > item.step;
        const isClickable = typeof onStepClick === "function";

        return (
          <button
            key={item.step}
            type="button"
            onClick={() => onStepClick?.(item.step)}
            className={[
              "rounded-2xl border px-4 py-3 text-left transition",
              isActive
                ? "border-[#3D398C]/30 bg-[#3D398C]/10"
                : isCompleted
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-border bg-background",
              isClickable
                ? "cursor-pointer hover:border-[#3D398C]/30 hover:bg-[#3D398C]/5"
                : "cursor-default",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                  isActive
                    ? "border-[#3D398C] bg-[#3D398C] text-white"
                    : isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-border bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  Step {item.step}
                </p>
                <p
                  className={[
                    "text-sm font-semibold leading-tight",
                    isActive
                      ? "text-[#3D398C]"
                      : isCompleted
                        ? "text-emerald-700"
                        : "text-foreground",
                  ].join(" ")}
                >
                  {item.title}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}