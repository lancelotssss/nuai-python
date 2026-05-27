import { Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, PerksFormSectionCard } from "./PerksFormSectionCard";

export default function PerksStepLinks({
  links,
  addLink,
  removeLink,
  updateLink,
}) {
  return (
    <PerksFormSectionCard
      icon={LinkIcon}
      title="Step 4: Links (Optional)"
      helper="You may add links related to this perk, such as a website or registration page. This step can be skipped."
    >
      <div className="space-y-4">
        {/* Empty state hint */}
        {links.length === 1 && !links[0].label && !links[0].url && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            No links added. You can skip this step if not needed.
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={addLink}>
            Add Link
          </Button>
        </div>

        {links.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-muted/20 p-4"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <FormField label="Label (Optional)">
                <Input
                  placeholder="e.g. Official Website"
                  value={item.label}
                  onChange={(e) => updateLink(index, "label", e.target.value)}
                />
              </FormField>

              <FormField label="URL (Optional)">
                <Input
                  placeholder="https://example.com"
                  value={item.url}
                  onChange={(e) => updateLink(index, "url", e.target.value)}
                />
              </FormField>

              <Button
                type="button"
                variant="outline"
                onClick={() => removeLink(index)}
                disabled={links.length === 1}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PerksFormSectionCard>
  );
}