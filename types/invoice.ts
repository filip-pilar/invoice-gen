import { CurrencyCode } from '@/lib/helpers';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: CurrencyCode;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  items: InvoiceItem[];
  taxRate: number;
  notes: string;
  logo: string | null;
  signature: string | null;
}

export interface InvoicePreviewProps {
  data: InvoiceData;
}