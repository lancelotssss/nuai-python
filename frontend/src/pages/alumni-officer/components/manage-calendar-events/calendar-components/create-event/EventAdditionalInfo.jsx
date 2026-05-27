import { useEffect, useState } from "react";
import { Tag, ImagePlus, Mail, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CATEGORY_OPTIONS } from "../../calendar-utils/eventConstants.js";

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

function FormField({ label, error, required = false, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function getInputClass(hasError, extra = "") {
  return [
    extra,
    hasError
      ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
      : "border-input focus-visible:border-[#3D398C]/40 focus-visible:ring-[#3D398C]/10",
  ]
    .filter(Boolean)
    .join(" ");
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

function getExistingImageName(url = "") {
  if (!url || !url.trim()) return "";

  try {
    const cleanUrl = url.split("?")[0];
    const rawName = cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);
    return decodeURIComponent(rawName) || "Existing uploaded image";
  } catch {
    return "Existing uploaded image";
  }
}

export default function EventAdditionalInfo({
  form,
  errors,
  onChange,
  onBlur,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (form.coverImageFile instanceof File) {
      const objectUrl = URL.createObjectURL(form.coverImageFile);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (form.coverImageUrl && form.coverImageUrl.trim()) {
      setPreviewUrl(form.coverImageUrl);
      return;
    }

    setPreviewUrl("");
  }, [form.coverImageFile, form.coverImageUrl]);

  function handleRemoveImage() {
    onChange("coverImageFile", null);
    onChange("coverImageUrl", "");
  }

  const displayImageName = form.coverImageFile
    ? form.coverImageFile.name
    : getExistingImageName(form.coverImageUrl);

  return (
    <div className="rounded-2xl border border-border p-5">
      <SectionHeader
        icon={Tag}
        title="Step 3: Additional Information"
        helper="Add category, optional image, contacts, and tags."
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <FormField label="Category" required error={errors.category}>
          <select
            value={form.category}
            onChange={(e) => onChange("category", e.target.value)}
            onBlur={() => onBlur?.("category")}
            className={[
              "flex h-11 w-full rounded-xl bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2",
              errors.category
                ? "border border-destructive focus:border-destructive focus:ring-destructive/20"
                : "border border-input focus:border-[#3D398C]/40 focus:ring-[#3D398C]/10",
            ].join(" ")}
          >
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "others"
                  ? "Others"
                  : option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </FormField>

        <div />

        {form.category === "others" ? (
          <div className="md:col-span-2">
            <FormField
              label="Specify Category"
              required
              error={errors.customCategory}
            >
              <Input
                value={form.customCategory}
                onChange={(e) => onChange("customCategory", e.target.value)}
                onBlur={() => onBlur?.("customCategory")}
                placeholder="Enter custom category"
                className={getInputClass(
                  Boolean(errors.customCategory),
                  "h-11 rounded-xl"
                )}
              />
            </FormField>
          </div>
        ) : null}

        <div className="md:col-span-2">
          <FormField label="Cover Image" error={errors.coverImageFile}>
            <div className="space-y-3">
              <label
                className={[
                  "flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-8 text-center transition hover:bg-[#3D398C]/[0.03]",
                  errors.coverImageFile
                    ? "border-destructive"
                    : "border-border hover:border-[#3D398C]/30",
                ].join(" ")}
              >
                <ImagePlus className="h-7 w-7 text-[#3D398C]" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Upload cover image
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG, or JPEG
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    onChange("coverImageFile", file);
                  }}
                />
              </label>

              {displayImageName ? (
                <div
                  className={[
                    "rounded-xl bg-background px-3 py-2 text-sm text-foreground",
                    errors.coverImageFile
                      ? "border border-destructive"
                      : "border border-border",
                  ].join(" ")}
                >
                  Selected: {displayImageName}
                </div>
              ) : null}

              {previewUrl ? (
                <div
                  className={[
                    "relative overflow-hidden rounded-2xl bg-background",
                    errors.coverImageFile
                      ? "border border-destructive"
                      : "border border-border",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/75"
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <img
                    src={previewUrl}
                    alt="Cover preview"
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </FormField>
        </div>

        <FormField label="Contact Name" error={errors.contactName}>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={form.contactName}
              onChange={(e) => onChange("contactName", e.target.value)}
              onBlur={() => onBlur?.("contactName")}
              placeholder="Enter contact person"
              className={getInputClass(
                Boolean(errors.contactName),
                "h-11 rounded-xl pl-10"
              )}
            />
          </div>
        </FormField>

        <FormField label="Contact Email" error={errors.contactEmail}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(e) => onChange("contactEmail", e.target.value)}
              onBlur={() => onBlur?.("contactEmail")}
              placeholder="Enter contact email"
              className={getInputClass(
                Boolean(errors.contactEmail),
                "h-11 rounded-xl pl-10"
              )}
            />
          </div>
        </FormField>

        <div className="md:col-span-2">
          <FormField label="Tags" error={errors.tags}>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  value={tagInput}
                  onChange={(e) => onTagInputChange(e.target.value)}
                  placeholder="Enter a tag"
                  className={getInputClass(
                    Boolean(errors.tags),
                    "h-11 rounded-xl pr-16"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddTag();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={onAddTag}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-[#3D398C] text-base font-bold text-white transition hover:bg-[#2f2b73]"
                >
                  +
                </button>
              </div>

              {form.tags.length ? (
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag, index) => (
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
                        onClick={() => onRemoveTag(tag)}
                        className="rounded-full p-0.5 hover:bg-black/5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No tags added yet.
                </p>
              )}
            </div>
          </FormField>
        </div>
      </div>
    </div>
  );
}