import { useLocation, useNavigate, useParams } from "react-router-dom";

import OfficerPerksDiscountForm from "./OfficerPerksDiscountForm";

function safe(value) {
  return String(value ?? "").trim();
}

export default function OfficerEditPerksDiscounts({
  editPerkId,
  initialPerk,
  onDone,
  onCancel,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const routePerkId = safe(params.perkId || params.id);
  const resolvedPerkId = safe(editPerkId) || routePerkId;

  const resolvedInitialPerk =
    initialPerk || location.state?.perk || location.state?.initialPerk || null;

  function handleDone(perkId) {
    if (typeof onDone === "function") {
      onDone(perkId);
      return;
    }

    const finalPerkId = safe(perkId) || resolvedPerkId;

    if (finalPerkId) {
      navigate(`/alumni-officer/perks-discounts/view/${finalPerkId}`, {
        replace: true,
        state: {
          perkId: finalPerkId,
          perkTitle:
            safe(location.state?.perkTitle) ||
            safe(location.state?.title) ||
            safe(resolvedInitialPerk?.postHeader) ||
            "Perks & Discounts",
          title:
            safe(location.state?.title) ||
            safe(location.state?.perkTitle) ||
            safe(resolvedInitialPerk?.postHeader) ||
            "Perks & Discounts",
          breadcrumbLabel:
            safe(location.state?.breadcrumbLabel) ||
            safe(location.state?.perkTitle) ||
            safe(resolvedInitialPerk?.postHeader) ||
            "Perks & Discounts",
          from: "/alumni-officer/perks-discounts/edit",
        },
      });
      return;
    }

    navigate("/alumni-officer/perks-discounts", { replace: true });
  }

  function handleCancel() {
    if (typeof onCancel === "function") {
      onCancel();
      return;
    }

    if (resolvedPerkId) {
      navigate(`/alumni-officer/perks-discounts/view/${resolvedPerkId}`, {
        replace: true,
        state: {
          perkId: resolvedPerkId,
          perkTitle:
            safe(location.state?.perkTitle) ||
            safe(location.state?.title) ||
            safe(resolvedInitialPerk?.postHeader) ||
            "Perks & Discounts",
          title:
            safe(location.state?.title) ||
            safe(location.state?.perkTitle) ||
            safe(resolvedInitialPerk?.postHeader) ||
            "Perks & Discounts",
          breadcrumbLabel:
            safe(location.state?.breadcrumbLabel) ||
            safe(location.state?.perkTitle) ||
            safe(resolvedInitialPerk?.postHeader) ||
            "Perks & Discounts",
          from: "/alumni-officer/perks-discounts/edit",
        },
      });
      return;
    }

    navigate("/alumni-officer/perks-discounts", { replace: true });
  }

  return (
    <OfficerPerksDiscountForm
      mode="edit"
      editPerkId={resolvedPerkId}
      initialPerk={resolvedInitialPerk}
      onDone={handleDone}
      onCancel={handleCancel}
    />
  );
}