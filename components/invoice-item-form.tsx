import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InvoiceItem } from "@/types/invoice";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/helpers";

interface InvoiceItemFormProps {
  currentItem: InvoiceItem;
  items: InvoiceItem[];
  onItemChange: (item: InvoiceItem) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  currency: string;
}

export const InvoiceItemForm = ({
  currentItem,
  items,
  onItemChange,
  onAddItem,
  onRemoveItem,
  currency,
}: InvoiceItemFormProps) => {
  const calculateItemTotal = (item: InvoiceItem): number => {
    const subtotal = item.quantity * item.price;
    const discountAmount =
      item.discountType === "percentage"
        ? subtotal * ((item.discount || 0) / 100)
        : item.discount || 0;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * ((item.tax || 0) / 100);
    return afterDiscount + taxAmount;
  };

  return (
    <div className="space-y-6">
      {/* Current Item Form */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex-1">
          <Label htmlFor="description" className="text-sm font-medium mb-1.5">
            Description
          </Label>
          <Input
            id="description"
            placeholder="Enter item description"
            value={currentItem.description}
            onChange={(e) =>
              onItemChange({ ...currentItem, description: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor="quantity" className="text-sm font-medium mb-1.5">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={currentItem.quantity}
              onChange={(e) =>
                onItemChange({
                  ...currentItem,
                  quantity: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="price" className="text-sm font-medium mb-1.5">
              Price
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={currentItem.price}
              onChange={(e) =>
                onItemChange({ ...currentItem, price: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <Label htmlFor="discount" className="text-sm font-medium mb-1.5">
              Discount
            </Label>
            <Input
              id="discount"
              type="number"
              min="0"
              step={currentItem.discountType === "percentage" ? "1" : "0.01"}
              max={
                currentItem.discountType === "percentage" ? "100" : undefined
              }
              placeholder={
                currentItem.discountType === "percentage" ? "0%" : "0.00"
              }
              value={currentItem.discount || 0}
              onChange={(e) =>
                onItemChange({
                  ...currentItem,
                  discount: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5">Discount Type</Label>
            <Select
              value={currentItem.discountType}
              onValueChange={(value: "percentage" | "fixed") =>
                onItemChange({ ...currentItem, discountType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">(%)</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tax" className="text-sm font-medium mb-1.5">
              Tax Rate (%)
            </Label>
            <Input
              id="tax"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="0%"
              value={currentItem.tax || 0}
              onChange={(e) =>
                onItemChange({ ...currentItem, tax: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={onAddItem}
            disabled={
              !currentItem.description ||
              currentItem.quantity <= 0 ||
              currentItem.price <= 0
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Items Table */}
      {items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Description
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                  Qty
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                  Price
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                  Discount
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                  Tax
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                  Total
                </th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="text-right px-4 py-3">{item.quantity}</td>
                  <td className="text-right px-4 py-3">
                    {formatCurrency(item.price, currency)}
                  </td>
                  <td className="text-right px-4 py-3">
                    {item.discount || 0}
                    {item.discountType === "percentage" ? "%" : ""}
                  </td>
                  <td className="text-right px-4 py-3">{item.tax || 0}%</td>
                  <td className="text-right px-4 py-3 font-medium">
                    {formatCurrency(calculateItemTotal(item), currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceItemForm;
