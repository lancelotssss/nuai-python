import OfficerPerksDiscountForm from "./OfficerPerksDiscountForm";

export default function OfficerCreatePerksDiscounts({ onDone, onCancel }) {
  return (
    <OfficerPerksDiscountForm
      mode="create"
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}