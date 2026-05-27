import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField, PerksFormSectionCard } from "./PerksFormSectionCard";

export default function PerksStepCompany({
  companyName,
  location,
  setCompanyName,
  setLocation,
  touchField,
  shouldShowFieldError,
  errors,
}) {
  return (
    <PerksFormSectionCard
      icon={Building2}
      title="Step 1: Company"
      helper="Enter the company and location details."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Company Name"
          required
          error={shouldShowFieldError("companyName", 1) ? errors.companyName : ""}
        >
          <Input
            placeholder="Whats the company's name?"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onBlur={() => touchField("companyName")}
            className={
              shouldShowFieldError("companyName", 1) && errors.companyName
                ? "border-destructive"
                : ""
            }
          />
        </FormField>

        <FormField
          label="Location"
          required
          error={shouldShowFieldError("location", 1) ? errors.location : ""}
        >
          <Input
            placeholder="Whats the location?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={() => touchField("location")}
            className={
              shouldShowFieldError("location", 1) && errors.location
                ? "border-destructive"
                : ""
            }
          />
        </FormField>
      </div>
    </PerksFormSectionCard>
  );
}