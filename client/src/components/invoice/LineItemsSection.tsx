import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { LineItem } from "@/lib/invoice-schemas";

interface Service {
  id: string;
  name: string;
  price: string;
}

interface LineItemsSectionProps {
  lineItems: LineItem[];
  services: Service[];
  selectedServiceIds: Record<number, string>;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof LineItem, value: string | number) => void;
  onSelectService: (index: number, value: string) => void;
}

export function LineItemsSection({
  lineItems,
  services,
  selectedServiceIds,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onSelectService,
}: LineItemsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Line Items</CardTitle>
        <Button size="sm" onClick={onAddItem} data-testid="button-add-line-item">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {lineItems.map((item, index) => (
          <div key={index} className="flex gap-2 items-start" data-testid={`line-item-${index}`}>
            <div className="flex-1 space-y-2">
              <div className="space-y-2">
                <Label>Service</Label>
                <Select
                  value={
                    selectedServiceIds[index] ||
                    services.find((s) => {
                      const priceMatch = Math.abs(parseFloat(s.price) - item.price) < 0.01;
                      return s.name === item.description && priceMatch;
                    })?.id ||
                    ""
                  }
                  onValueChange={(value) => onSelectService(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - €{parseFloat(service.price).toFixed(2)}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="text-primary font-medium">
                      <Plus className="w-4 h-4 mr-2 inline" /> Add New Service
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => onUpdateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                    data-testid={`input-quantity-${index}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => onUpdateItem(index, "price", parseFloat(e.target.value) || 0)}
                    data-testid={`input-price-${index}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="flex items-center h-10 px-3 font-mono font-medium text-sm border rounded-md bg-muted">
                    €{(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            {lineItems.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveItem(index)}
                data-testid={`button-remove-${index}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

