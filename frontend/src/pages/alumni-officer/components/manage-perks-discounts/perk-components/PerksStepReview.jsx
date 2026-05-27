import { ShieldCheck, LayoutGrid, Newspaper } from "lucide-react";
import { PerksFormSectionCard } from "./PerksFormSectionCard";
import PerksPostPreview from "./PerksPostPreview";
import {
  cleanText,
  normalizeUrl,
  splitRequirements,
} from "../perk-utils/perkFormUtils";
import AlumniPerksDiscountCardPreview from "@/pages/alumni-intern/components/services/AlumniPerksDiscountCardPreview";

function PreviewSection({ icon: Icon, title, helper, children }) {
  return (
    <div className="space-y-3 rounded-2xl p-4">
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

export default function PerksStepReview({
  authorName,
  role,
  companyName,
  location,
  headerText,
  category,
  customCategory,
  contentText,
  startDate,
  endDate,
  startTime,
  endTime,
  allDay,
  postedOn,
  requirementsText,
  links,
  imagePreviews,
}) {
  const normalizedLinks = Array.isArray(links)
    ? links.map((item) => normalizeUrl(item.url)).filter(Boolean)
    : [];

  const requirements = splitRequirements(requirementsText);
  const destinations = Array.isArray(postedOn) ? postedOn : [];

  return (
    <PerksFormSectionCard
      icon={ShieldCheck}
      title="Step 7: Review"
      helper="This is how the perk or discount post will look in its selected destinations."
    >
      <div className="space-y-5">
        {destinations.includes("services") && (
          <PreviewSection
            icon={LayoutGrid}
            title="Alumni Services Preview"
            helper="This is how it will appear inside Alumni Services > Perks & Discounts."
          >
            <AlumniPerksDiscountCardPreview
              companyName={cleanText(companyName)}
              location={cleanText(location)}
              postHeader={cleanText(headerText)}
              category={cleanText(category)}
              customCategory={cleanText(customCategory)}
              postContent={cleanText(contentText)}
              startDate={cleanText(startDate)}
              endDate={cleanText(endDate)}
              startTime={cleanText(startTime)}
              endTime={cleanText(endTime)}
              allDay={Boolean(allDay)}
              requirements={requirements}
              links={normalizedLinks}
              imageUrls={imagePreviews}
            />
          </PreviewSection>
        )}

        {destinations.includes("news") && (
          <PreviewSection
            icon={Newspaper}
            title="News Feed Preview"
            helper="This is how it will appear when posted in News Post."
          >
            <PerksPostPreview
              companyName={cleanText(companyName)}
              location={cleanText(location)}
              postHeader={cleanText(headerText)}
              category={cleanText(category)}
              customCategory={cleanText(customCategory)}
              postContent={cleanText(contentText)}
              startDate={cleanText(startDate)}
              endDate={cleanText(endDate)}
              startTime={cleanText(startTime)}
              endTime={cleanText(endTime)}
              allDay={Boolean(allDay)}
              requirements={requirements}
              links={normalizedLinks}
              imageUrls={imagePreviews}
            />
          </PreviewSection>
        )}
      </div>
    </PerksFormSectionCard>
  );
}