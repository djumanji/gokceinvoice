import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type InvoiceType = "one-time" | "recurring" | "bulk";

interface InvoiceTypeSelectorProps {
  value: InvoiceType;
  onChange: (type: InvoiceType) => void;
}

export function InvoiceTypeSelector({
  value,
  onChange,
}: InvoiceTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Invoice Type</Label>
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="one-time" id="one-time" />
          <Label htmlFor="one-time" className="font-normal cursor-pointer">
            One-time Invoice
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="recurring" id="recurring" />
          <Label htmlFor="recurring" className="font-normal cursor-pointer">
            Recurring Invoice
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="bulk" id="bulk" />
          <Label htmlFor="bulk" className="font-normal cursor-pointer">
            Bulk Invoice (Multiple Clients)
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
