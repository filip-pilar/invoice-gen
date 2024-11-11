import { InvoiceTemplate } from "@/types/invoice";
import { CurrencyCode } from "./helpers";

export const invoiceTemplates: InvoiceTemplate[] = [
    {
      id: "consulting",
      name: "Consulting Services",
      data: {
        companyName: "Your Consulting Company",
        companyEmail: "consulting@example.com",
        companyAddress: "123 Business Street\nSuite 100\nNew York, NY 10001",
        currency: "USD" as CurrencyCode,
        items: [
          {
            id: crypto.randomUUID(),
            description: "Consulting Services",
            quantity: 1,
            price: 150,
            discount: 0,
            discountType: "percentage",
            tax: 0,
          },
          {
            id: crypto.randomUUID(),
            description: "Project Management",
            quantity: 1,
            price: 100,
            discount: 0,
            discountType: "percentage",
            tax: 0,
          }
        ],
        notes: "Payment is due within 30 days. Please include invoice number in payment reference.",
      }
    },
    {
      id: "retail",
      name: "Retail Sale",
      data: {
        companyName: "Your Retail Store",
        companyEmail: "sales@retailstore.com",
        companyAddress: "456 Shop Avenue\nMall District\nLos Angeles, CA 90001",
        currency: "USD" as CurrencyCode,
        items: [
          {
            id: crypto.randomUUID(),
            description: "Product Item",
            quantity: 1,
            price: 49.99,
            discount: 0,
            discountType: "percentage",
            tax: 0,
          }
        ],
        notes: "Thank you for your business! Returns accepted within 30 days with receipt.",
      }
    },
    {
      id: "freelance",
      name: "Freelance Work",
      data: {
        companyName: "Your Freelance Business",
        companyEmail: "hello@freelancer.com",
        companyAddress: "789 Creative Lane\nAustin, TX 78701",
        currency: "USD" as CurrencyCode,
        items: [
          {
            id: crypto.randomUUID(),
            description: "Design Services",
            quantity: 1,
            price: 75,
            discount: 0,
            discountType: "percentage",
            tax: 0,
          }
        ],
        notes: "Payment is due upon receipt. Please make payment via bank transfer or PayPal.",
      }
    }
  ];