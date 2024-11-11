import { CurrencyCode } from "@/lib/helpers";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  discount: number;
  discountType: "percentage" | "fixed";
  tax: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoice_number?: string;
  date: string;
  dueDate: string;
  currency: CurrencyCode;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  items: InvoiceItem[];
  taxRate: number;
  notes: string;
  logo: string | null;
  signature: string | null;
}

export interface InvoicePreviewProps {
  data: InvoiceData;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  data: Partial<InvoiceData>;
}

export interface LemonSqueezyWebhookEvent {
  meta: {
    event_name: string;
    custom_data: {
      custom: {
        invoice_id: string;
      };
    };
  };
  data: {
    attributes: {
      total: number;
      // Add other relevant fields as needed
    };
  };
}
