import { InvoiceItem } from "@/types/invoice";

// utils/helpers.ts
export const generateInvoiceNumber = () => {
  const date = new Date();
  const formattedDate = date.toLocaleDateString("en-GB").replace(/\//g, "");
  const uuid = crypto.randomUUID().split("-")[0];
  return `INV-${formattedDate}-${uuid}`;
};

export const calculateItemTotal = (item: InvoiceItem) => {
  const subtotal = item.quantity * item.price;
  const discountAmount =
    item.discountType === "percentage"
      ? (subtotal * item.discount) / 100
      : item.discount;
  const totalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (totalAfterDiscount * item.tax) / 100;
  return totalAfterDiscount + taxAmount;
};

export const calculateInvoiceTotal = (
  items: InvoiceItem[],
  taxRate: number
) => {
  const subtotal = items.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );
  const taxAmount = (subtotal * taxRate) / 100;
  return {
    subtotal,
    taxAmount,
    total: subtotal + taxAmount,
  };
};

export const currencyOptions = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "JPY", label: "JPY (¥)", symbol: "¥" },
  { value: "CAD", label: "CAD ($)", symbol: "$" },
  { value: "AUD", label: "AUD ($)", symbol: "$" },
  { value: "CNY", label: "CNY (¥)", symbol: "¥" },
  { value: "AED", label: "AED (د.إ)", symbol: "د.إ" },
] as const;

export type CurrencyCode = (typeof currencyOptions)[number]["value"];

export const getCurrencySymbol = (currency: CurrencyCode): string => {
  const option = currencyOptions.find((opt) => opt.value === currency);
  return option?.symbol || "$";
};

export const formatCurrency = (
  amount: number,
  currency: CurrencyCode
): string => {
  const symbol = getCurrencySymbol(currency);

  // Special handling for currencies without decimal places
  if (currency === "JPY" || currency === "CNY") {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }

  // For AED, show up to 2 decimal places, but remove trailing zeros
  if (currency === "AED") {
    const formatted = amount.toFixed(2).replace(/\.?0+$/, "");
    return `${symbol} ${formatted}`;
  }

  return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};
