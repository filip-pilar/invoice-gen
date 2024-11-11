import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InvoiceItem } from "@/types/invoice";
import { Trash2 } from "lucide-react";

export const InvoiceItemForm = ({ 
  item, 
  onChange, 
  onRemove 
}: { 
  item: InvoiceItem;
  onChange: (item: InvoiceItem) => void;
  onRemove: () => void;
}) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      {/* Description */}
      <div className="flex-1">
        <Label htmlFor={`description-${item.id}`} className="text-sm font-medium mb-1.5">
          Description
        </Label>
        <Input 
          id={`description-${item.id}`}
          placeholder="Enter item description" 
          value={item.description} 
          onChange={(e) => onChange({ ...item, description: e.target.value })} 
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Quantity */}
        <div>
          <Label htmlFor={`quantity-${item.id}`} className="text-sm font-medium mb-1.5">
            Quantity
          </Label>
          <Input 
            id={`quantity-${item.id}`}
            type="number"
            min="0"
            step="1"
            placeholder="0" 
            value={item.quantity} 
            onChange={(e) => onChange({ ...item, quantity: Number(e.target.value) })} 
          />
        </div>

        {/* Price */}
        <div>
          <Label htmlFor={`price-${item.id}`} className="text-sm font-medium mb-1.5">
            Price
          </Label>
          <Input 
            id={`price-${item.id}`}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00" 
            value={item.price} 
            onChange={(e) => onChange({ ...item, price: Number(e.target.value) })} 
          />
        </div>

        {/* Discount Amount */}
        <div>
          <Label htmlFor={`discount-${item.id}`} className="text-sm font-medium mb-1.5">
            Discount
          </Label>
          <Input 
            id={`discount-${item.id}`}
            type="number"
            min="0"
            step={item.discountType === 'percentage' ? '1' : '0.01'}
            max={item.discountType === 'percentage' ? '100' : undefined}
            placeholder={item.discountType === 'percentage' ? '0%' : '0.00'} 
            value={item.discount} 
            onChange={(e) => onChange({ ...item, discount: Number(e.target.value) })} 
          />
        </div>

        {/* Discount Type */}
        <div>
          <Label className="text-sm font-medium mb-1.5">
            Discount Type
          </Label>
          <Select
            value={item.discountType}
            onValueChange={(value: 'percentage' | 'fixed') => 
              onChange({ ...item, discountType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tax Rate */}
        <div>
          <Label htmlFor={`tax-${item.id}`} className="text-sm font-medium mb-1.5">
            Tax Rate (%)
          </Label>
          <Input 
            id={`tax-${item.id}`}
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="0%" 
            value={item.tax} 
            onChange={(e) => onChange({ ...item, tax: Number(e.target.value) })} 
          />
        </div>
      </div>

      {/* Remove Button */}
      <div className="flex justify-end">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Item
        </Button>
      </div>

      {/* Item Summary */}
      <div className="text-sm text-gray-500 pt-2 border-t">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${(item.quantity * item.price).toFixed(2)}</span>
        </div>
        {item.discount > 0 && (
          <div className="flex justify-between text-red-500">
            <span>Discount ({item.discountType === 'percentage' ? `${item.discount}%` : 'Fixed'}):</span>
            <span>
              -${(item.discountType === 'percentage' 
                ? (item.quantity * item.price * item.discount / 100) 
                : item.discount).toFixed(2)}
            </span>
          </div>
        )}
        {item.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax ({item.tax}%):</span>
            <span>
              ${(item.quantity * item.price * (1 - (item.discountType === 'percentage' ? item.discount / 100 : item.discount / (item.quantity * item.price))) * (item.tax / 100)).toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between font-medium text-gray-900 mt-1 pt-1 border-t">
          <span>Item Total:</span>
          <span>${(
            item.quantity * item.price * 
            (1 - (item.discountType === 'percentage' ? item.discount / 100 : item.discount / (item.quantity * item.price))) * 
            (1 + item.tax / 100)
          ).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};