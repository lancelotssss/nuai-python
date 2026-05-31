import { useMemo, useState } from "react";
import { FileText, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, PerksFormSectionCard } from "./PerksFormSectionCard";

function parseRequirements(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const CATEGORY_OPTIONS = [
  { value: "food-dining", label: "Food & Dining" },
  { value: "retail-shopping", label: "Retail & Shopping" },
  { value: "health-wellness", label: "Health & Wellness" },
  { value: "education", label: "Education" },
  { value: "travel", label: "Travel" },
  { value: "technology", label: "Technology" },
  { value: "services", label: "Services" },
  { value: "others", label: "Others" },
];

function getCategoryLabel(value) {
  return CATEGORY_OPTIONS.find((option) => option.value === value)?.label || value;
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

export default function PerksStepContent({
  headerText,
  category,
  customCategory,
  contentText,
  requirementsText,
  setHeaderText,
  setCategory,
  setCustomCategory,
  setContentText,
  setRequirementsText,
  touchField,
  shouldShowFieldError,
  errors,
  authorName,
}) {
  const [requirementInput, setRequirementInput] = useState("");

  const requirementTags = useMemo(
    () => parseRequirements(requirementsText),
    [requirementsText]
  );

  function syncRequirements(nextTags) {
    setRequirementsText(nextTags.join(", "));
  }

  function handleAddRequirement(rawValue = requirementInput) {
    const trimmed = rawValue.trim();
    if (!trimmed) return;

    const alreadyExists = requirementTags.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    );

    if (alreadyExists) {
      setRequirementInput("");
      touchField("requirementsText");
      return;
    }

    syncRequirements([...requirementTags, trimmed]);
    setRequirementInput("");
    touchField("requirementsText");
  }

  function handleRemoveRequirement(tagToRemove) {
    const nextTags = requirementTags.filter((tag) => tag !== tagToRemove);
    syncRequirements(nextTags);
    touchField("requirementsText");
  }

  return (
    <PerksFormSectionCard
      icon={FileText}
      title="Step 2: Content"
      helper="Add the title, content, and requirements."
    >
      <div className="grid gap-1">
        <FormField
          label="Post Header"
          required
          error={shouldShowFieldError("headerText", 2) ? errors.headerText : ""}
        >
          <Textarea
            placeholder="What's the headline?"
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            onBlur={() => touchField("headerText")}
            rows={2}
            className={[
              "min-h-[88px] resize-none",
              shouldShowFieldError("headerText", 2) && errors.headerText
                ? "border-destructive"
                : "",
            ].join(" ")}
          />
        </FormField>

        <FormField
          label="Post Content"
          required
          error={shouldShowFieldError("contentText", 2) ? errors.contentText : ""}
        >
          <Textarea
            placeholder="Describe the perk or discount..."
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            onBlur={() => touchField("contentText")}
            rows={10}
            className={[
              "min-h-[220px] resize-y",
              shouldShowFieldError("contentText", 2) && errors.contentText
                ? "border-destructive"
                : "",
            ].join(" ")}
          />
        </FormField>

        <FormField
          label="Category"
          required
          error={shouldShowFieldError("category", 2) ? errors.category : ""}
        >
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              touchField("category");

              if (value !== "others") {
                setCustomCategory("");
              }
            }}
          >
            <SelectTrigger
              className={[
                "h-11 rounded-xl",
                shouldShowFieldError("category", 2) && errors.category
                  ? "border-destructive"
                  : "",
              ].join(" ")}
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>

            <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {category ? (
            <p className="text-xs text-muted-foreground">
              Selected: {getCategoryLabel(category)}
            </p>
          ) : null}
        </FormField>

        {category === "others" ? (
          <FormField
            label="Specify Category"
            required
            error={
              shouldShowFieldError("customCategory", 2)
                ? errors.customCategory
                : ""
            }
          >
            <Input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              onBlur={() => touchField("customCategory")}
              placeholder="Enter category"
              className={[
                "h-11 rounded-xl",
                shouldShowFieldError("customCategory", 2) &&
                errors.customCategory
                  ? "border-destructive"
                  : "",
              ].join(" ")}
            />
          </FormField>
        ) : null}

        <FormField
          label="Requirements"
          required
          error={
            shouldShowFieldError("requirementsText", 2)
              ? errors.requirementsText
              : ""
          }
        >
          <div className="space-y-3">
            <div className="relative">
              <Input
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onBlur={() => touchField("requirementsText")}
                placeholder="Enter a requirement"
                className={[
                  "h-11 rounded-xl pr-16",
                  shouldShowFieldError("requirementsText", 2) &&
                  errors.requirementsText
                    ? "border-destructive"
                    : "",
                ].join(" ")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRequirement();
                  }
                }}
              />

              <button
                type="button"
                onClick={() => handleAddRequirement()}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-[#3D398C] text-base font-bold text-white transition hover:bg-[#2f2b73]"
              >
                +
              </button>
            </div>

            {requirementTags.length ? (
              <div className="flex flex-wrap gap-2">
                {requirementTags.map((tag, index) => (
                  <div
                    key={tag}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                      getTagToneClasses(index),
                    ].join(" ")}
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(tag)}
                      className="rounded-full p-0.5 hover:bg-black/5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className={[
                  "text-xs",
                  shouldShowFieldError("requirementsText", 2) &&
                  errors.requirementsText
                    ? "text-destructive"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                No requirements added yet.
              </p>
            )}
          </div>
        </FormField>
      </div>
    </PerksFormSectionCard>
  );
}