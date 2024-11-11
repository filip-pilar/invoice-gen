import React from "react";
import { formatCurrency } from "@/lib/helpers";
import { InvoiceData, InvoiceItem } from "../types/invoice";
import Image from "next/image";

interface InvoicePreviewProps {
  data: InvoiceData;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data }) => {
  const calculateItemTotal = (item: InvoiceItem): number => {
    const subtotal = item.quantity * item.price;
    const discountAmount =
      item.discountType === "percentage"
        ? subtotal * (item.discount / 100)
        : item.discount;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax / 100);
    return afterDiscount + taxAmount;
  };

  const calculateSubtotal = (): number => {
    return data.items.reduce(
      (total: number, item: InvoiceItem) => total + item.quantity * item.price,
      0
    );
  };

  const calculateTotalDiscount = (): number => {
    return data.items.reduce((total: number, item: InvoiceItem) => {
      const itemSubtotal = item.quantity * item.price;
      return (
        total +
        (item.discountType === "percentage"
          ? itemSubtotal * (item.discount / 100)
          : item.discount)
      );
    }, 0);
  };

  const calculateTotalTax = (): number => {
    return data.items.reduce((total: number, item: InvoiceItem) => {
      const itemSubtotal = item.quantity * item.price;
      const afterDiscount =
        itemSubtotal -
        (item.discountType === "percentage"
          ? itemSubtotal * (item.discount / 100)
          : item.discount);
      return total + afterDiscount * (item.tax / 100);
    }, 0);
  };

  const calculateGrandTotal = (): number => {
    return data.items.reduce(
      (total: number, item: InvoiceItem) => total + calculateItemTotal(item),
      0
    );
  };

  return (
    <div
      className="bg-white shadow-lg w-[210mm] h-[297mm] mx-auto relative"
      style={{
        padding: "20mm",
        pageBreakAfter: "always",
        pageBreakInside: "avoid",
        printColorAdjust: "exact",
      }}
      data-invoice-preview="true"
    >
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
        <div className="transform rotate-45 text-[150px] font-bold text-gray-900">
          FORMA
        </div>
      </div>

      {/* Header Section */}
      <div className="flex justify-between items-start mb-[15mm]">
        <div className="flex-1">
          {data.logo && (
            <Image
              src={data.logo}
              alt="Company Logo"
              className="h-[15mm] w-auto mb-[5mm] object-contain"
              width={100}
              height={100}
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            INVOICE
          </h1>
        </div>
        <div className="text-right">
          <div className="inline-block bg-gray-50 px-6 py-4 rounded-lg">
            <p
              className="text-sm text-gray-500 mb-1"
              style={{
                visibility: "visible",
                display: "block",
                zIndex: 10,
                position: "relative",
              }}
            >
              Invoice Number
            </p>
            <p
              className="font-mono text-xl font-bold text-gray-900"
              data-invoice-number="true"
              style={{
                minHeight: "1.5rem",
                visibility: "visible",
                display: "block",
                zIndex: 10,
                position: "relative",
              }}
            >
              {String(data.invoiceNumber || "").trim() || "No Invoice Number"}
            </p>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-end gap-2 text-sm">
              <span className="text-gray-500">Issue Date:</span>
              <span className="font-medium">
                {new Date(data.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-end gap-2 text-sm">
              <span className="text-gray-500">Due Date:</span>
              <span className="font-medium">
                {data.dueDate
                  ? new Date(data.dueDate).toLocaleDateString()
                  : new Date(data.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Company and Client Info */}
      <div className="grid grid-cols-2 gap-[15mm] mb-[15mm]">
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
            From
          </h2>
          <p className="text-lg font-bold text-gray-900 mb-1">
            {data.companyName}
          </p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
            {data.companyAddress}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
            Bill To
          </h2>
          <p className="text-lg font-bold text-gray-900 mb-1">
            {data.clientName}
          </p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
            {data.clientAddress}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-[15mm]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="text-right py-2 text-sm font-medium text-gray-500 uppercase tracking-wider w-[15mm]">
                Qty
              </th>
              <th className="text-right py-2 text-sm font-medium text-gray-500 uppercase tracking-wider w-[25mm]">
                Price
              </th>
              <th className="text-right py-2 text-sm font-medium text-gray-500 uppercase tracking-wider w-[20mm]">
                Disc
              </th>
              <th className="text-right py-2 text-sm font-medium text-gray-500 uppercase tracking-wider w-[15mm]">
                Tax
              </th>
              <th className="text-right py-2 text-sm font-medium text-gray-500 uppercase tracking-wider w-[25mm]">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.map((item: InvoiceItem, index: number) => (
              <tr key={index} className="text-gray-900">
                <td className="py-2">{item.description}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">
                  {formatCurrency(item.price, data.currency)}
                </td>
                <td className="text-right py-2">{item.discount}</td>
                <td className="text-right py-2">{item.tax}%</td>
                <td className="text-right py-2 font-medium">
                  {formatCurrency(calculateItemTotal(item), data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex justify-end mb-[15mm]">
        <div className="w-[70mm]">
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(calculateSubtotal(), data.currency)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Discount:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(calculateTotalDiscount(), data.currency)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Tax:</span>
              <span className="font-medium">
                {formatCurrency(calculateTotalTax(), data.currency)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-900">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(calculateGrandTotal(), data.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {/* {data.notes && (
        <div className="mb-[15mm]">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
            Notes
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-[30mm] overflow-auto">
              {data.notes}
            </p>
          </div>
        </div>
      )} */}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-[10mm]">
        {data.signature && (
          <div className="mb-[10mm]">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Authorized Signature
            </h2>
            <Image
              src={data.signature}
              alt="Signature"
              className="h-[15mm] w-auto"
              width={100}
              height={100}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePreview;
