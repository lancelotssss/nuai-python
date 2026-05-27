import { ImagePlus, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_IMAGE_COUNT } from "../perk-utils/perkFormUtils";
import { PerksFormSectionCard } from "./PerksFormSectionCard";

function ImagePreviewCard({ src, alt, onRemove, removeTitle }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <img
        src={src}
        alt={alt}
        className="h-[220px] w-[170px] object-cover transition duration-200 group-hover:scale-[1.02]"
      />

      <button
        type="button"
        onClick={onRemove}
        title={removeTitle}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white shadow transition hover:bg-red-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function PerksStepImages({
  fileInputRef,
  files,
  existingImageUrls = [],
  imageError,
  imagePreviews,
  handleImageSelection,
  removeSelectedImage,
  removeExistingImage,
}) {
  const totalImages = existingImageUrls.length + files.length;
  const hasImages = totalImages > 0;

  return (
    <PerksFormSectionCard
      icon={ImagePlus}
      title="Step 6: Images"
      helper={`Optional. Upload up to ${MAX_IMAGE_COUNT} JPG or PNG images.`}
    >
      <div className="space-y-5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={handleImageSelection}
        />

        <div className="rounded-2xl border border-dashed border-[#3D398C]/25 bg-[#3D398C]/[0.04] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3D398C]/10">
                <UploadCloud className="h-5 w-5 text-[#3D398C]" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Upload perk images
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add brand visuals, promo posters, or store photos to make the
                  post more engaging.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {hasImages
                    ? `${totalImages}/${MAX_IMAGE_COUNT} image(s) selected`
                    : "No images selected yet"}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 rounded-xl border-[#3D398C]/20 bg-white px-4 text-[#3D398C] hover:bg-[#3D398C]/5"
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
            </div>
          </div>
        </div>

        {imageError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
            {imageError}
          </div>
        ) : null}

        {existingImageUrls.length > 0 ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Existing Images
              </p>
              <p className="text-xs text-muted-foreground">
                These are already saved to this perk or discount.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {existingImageUrls.map((src, idx) => (
                <ImagePreviewCard
                  key={`${src}_${idx}`}
                  src={src}
                  alt="existing preview"
                  onRemove={() => removeExistingImage(idx)}
                  removeTitle="Remove existing image"
                />
              ))}
            </div>
          </div>
        ) : null}

        {imagePreviews.length > 0 ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                New Selected Images
              </p>
              <p className="text-xs text-muted-foreground">
                These will be uploaded when you save or publish the post.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {imagePreviews.map((src, idx) => (
                <ImagePreviewCard
                  key={`${src}_${idx}`}
                  src={src}
                  alt="preview"
                  onRemove={() => removeSelectedImage(idx)}
                  removeTitle="Remove selected image"
                />
              ))}
            </div>
          </div>
        ) : null}

        {!existingImageUrls.length && !imagePreviews.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              No images uploaded yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose files to preview them here before saving.
            </p>
          </div>
        ) : null}
      </div>
    </PerksFormSectionCard>
  );
}