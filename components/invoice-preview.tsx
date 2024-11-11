import React from 'react';
import { formatCurrency } from '@/lib/helpers';
import { InvoiceData, InvoiceItem } from '../types/invoice';

interface InvoicePreviewProps {
  data: InvoiceData;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data }) => {
  const calculateItemTotal = (item: InvoiceItem): number => {
    const subtotal = item.quantity * item.price;
    const discountAmount = item.discountType === 'percentage' 
      ? subtotal * (item.discount / 100)
      : item.discount;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax / 100);
    return afterDiscount + taxAmount;
  };

  const calculateSubtotal = (): number => {
    return data.items.reduce((total: number, item: InvoiceItem) => 
      total + (item.quantity * item.price), 0);
  };

  const calculateTotalDiscount = (): number => {
    return data.items.reduce((total: number, item: InvoiceItem) => {
      const itemSubtotal = item.quantity * item.price;
      return total + (item.discountType === 'percentage' 
        ? itemSubtotal * (item.discount / 100)
        : item.discount);
    }, 0);
  };

  const calculateTotalTax = (): number => {
    return data.items.reduce((total: number, item: InvoiceItem) => {
      const itemSubtotal = item.quantity * item.price;
      const afterDiscount = itemSubtotal - (item.discountType === 'percentage' 
        ? itemSubtotal * (item.discount / 100)
        : item.discount);
      return total + (afterDiscount * (item.tax / 100));
    }, 0);
  };

  const calculateGrandTotal = (): number => {
    return data.items.reduce((total: number, item: InvoiceItem) => 
      total + calculateItemTotal(item), 0);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg min-h-[1056px] w-full relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
        <div className="transform rotate-45 text-[200px] font-bold text-gray-900">
          INVOICE
        </div>
      </div>

      {/* Header Section */}
      <div className="relative flex justify-between items-start mb-12 pb-6 border-b border-gray-200">
        <div className="flex-1">
          {data.logo && (
            <img 
              src={data.logo} 
              alt="Company Logo" 
              className="max-w-[200px] h-auto mb-4 object-contain"
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
        </div>
        <div className="text-right space-y-1">
          <div className="bg-gray-50 px-4 py-2 rounded-lg inline-block">
            <p className="text-sm text-gray-500">Invoice Number</p>
            <p className="font-mono text-xl font-bold text-gray-900">{data.invoiceNumber}</p>
          </div>
          <div className="space-y-1 mt-4">
            <div className="flex justify-end gap-3 text-sm">
              <span className="text-gray-500">Issue Date:</span>
              <span className="font-medium">{new Date(data.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-end gap-3 text-sm">
              <span className="text-gray-500">Due Date:</span>
              <span className="font-medium">{new Date(data.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Company and Client Info */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-gray-500 mb-3">From</h2>
          <p className="text-lg font-bold text-gray-900">{data.companyName}</p>
          <p className="text-gray-600 whitespace-pre-wrap">{data.companyAddress}</p>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Bill To</h2>
          <p className="text-lg font-bold text-gray-900">{data.clientName}</p>
          <p className="text-gray-600 whitespace-pre-wrap">{data.clientAddress}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 text-gray-500 font-medium">Description</th>
              <th className="text-right py-3 text-gray-500 font-medium">Quantity</th>
              <th className="text-right py-3 text-gray-500 font-medium">Price</th>
              <th className="text-right py-3 text-gray-500 font-medium">Discount</th>
              <th className="text-right py-3 text-gray-500 font-medium">Tax</th>
              <th className="text-right py-3 text-gray-500 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.map((item: InvoiceItem, index: number) => (
              <tr key={index} className="text-gray-900">
                <td className="py-4">{item.description}</td>
                <td className="text-right py-4">{item.quantity}</td>
                <td className="text-right py-4">{formatCurrency(item.price, data.currency)}</td>
                <td className="text-right py-4">
                  {item.discount > 0 && (
                    item.discountType === 'percentage' 
                      ? `${item.discount}%`
                      : formatCurrency(item.discount, data.currency)
                  )}
                </td>
                <td className="text-right py-4">{item.tax}%</td>
                <td className="text-right py-4 font-medium">
                  {formatCurrency(calculateItemTotal(item), data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex justify-end mb-12">
        <div className="w-72 space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span>{formatCurrency(calculateSubtotal(), data.currency)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Discount:</span>
            <span>-{formatCurrency(calculateTotalDiscount(), data.currency)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax:</span>
            <span>{formatCurrency(calculateTotalTax(), data.currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
            <span>Total:</span>
            <span>{formatCurrency(calculateGrandTotal(), data.currency)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="mb-12">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Notes</h2>
          <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
            {data.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-8">
        {data.signature && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Authorized Signature</h2>
            <img 
              src={data.signature} 
              alt="Signature" 
              className="max-w-[200px] h-auto"
            />
          </div>
        )}
        <p className="text-center text-gray-500 text-sm">
          Thank you for your business!
        </p>
      </div>
    </div>
  );
};

export default InvoicePreview;