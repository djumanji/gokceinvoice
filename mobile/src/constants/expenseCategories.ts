export const EXPENSE_CATEGORIES = [
  { value: "travel", label: "Travel", icon: "✈️" },
  { value: "meals", label: "Meals & Dining", icon: "🍽️" },
  { value: "office", label: "Office Supplies", icon: "📦" },
  { value: "utilities", label: "Utilities", icon: "🔌" },
  { value: "equipment", label: "Equipment", icon: "💻" },
  { value: "marketing", label: "Marketing", icon: "📢" },
  { value: "professional", label: "Professional Services", icon: "💼" },
  { value: "rent", label: "Rent", icon: "🏠" },
  { value: "transport", label: "Transportation", icon: "🚗" },
  { value: "subscription", label: "Subscriptions", icon: "📱" },
  { value: "other", label: "Other", icon: "📄" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
] as const;

