import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, X, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Expense } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export const EXPENSE_CATEGORIES = [
  { value: "travel", label: "Travel", icon: "✈️" },
  { value: "meals", label: "Meals & Dining", icon: "🍽️" },
  { value: "office", label: "Office Supplies", icon: "📦" },
  { value: "utilities", label: "Utilities", icon: "🔌" },
  { value: "equipment", label: "Equipment", icon: "💻" },
  { value: "marketing", label: "Marketing", icon: "📢" },
  { value: "professional", label: "Professional Services", icon: "💼" },
  { value: "rent", label: "Rent", icon: "🏠" },
  { value: "transport", label: "Transportation", icon: "🚗" },
  { value: "subscription", label: "Subscriptions", icon: "📱" },
  { value: "other", label: "Other", icon: "📄" },
] as const;

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
] as const;

interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ExpenseForm({ expense, onSubmit, onCancel, isLoading = false }: ExpenseFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState<Date>(expense ? new Date(expense.date) : new Date());
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(expense?.receipt || null);
  const [formData, setFormData] = useState({
    description: expense?.description || "",
    category: expense?.category || "other",
    amount: expense?.amount || "",
    vendor: expense?.vendor || "",
    paymentMethod: expense?.paymentMethod || "card",
    isTaxDeductible: expense?.isTaxDeductible ?? true,
    receipt: expense?.receipt || "",
    tags: expense?.tags || "",
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest('POST', '/api/upload', formData);
      if (isMountedRef.current) {
        setUploadedImageUrl(response.url);
        setFormData(prev => ({ ...prev, receipt: response.url }));
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      if (isMountedRef.current) {
        alert('Failed to upload file. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setUploading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setUploadedImageUrl(null);
    setFormData(prev => ({ ...prev, receipt: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      amount: String(formData.amount),
      date: format(date, "yyyy-MM-dd"),
    });
  };

  const selectedCategory = EXPENSE_CATEGORIES.find(c => c.value === formData.category);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{expense ? "Edit Expense" : "Add New Expense"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Client lunch meeting"
                required
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category">
                    {selectedCategory && (
                      <div className="flex items-center gap-2">
                        <span>{selectedCategory.icon}</span>
                        <span>{selectedCategory.label}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">Amount (EUR) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            {/* Date */}
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(newDate) => newDate && setDate(newDate)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Vendor */}
            <div>
              <Label htmlFor="vendor">Vendor/Business</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., Starbucks"
              />
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., client meeting, deductible"
              />
            </div>

            {/* Receipt Upload */}
            <div className="md:col-span-2">
              <Label htmlFor="receipt">Receipt/Invoice Image</Label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  id="receipt"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {uploadedImageUrl ? (
                  <div className="relative border rounded-lg p-4 bg-muted/50">
                    <img
                      src={uploadedImageUrl}
                      alt="Receipt preview"
                      className="max-h-48 w-full object-contain rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Receipt
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Tax Deductible */}
            <div className="md:col-span-2 flex items-center space-x-2">
              <Checkbox
                id="isTaxDeductible"
                checked={formData.isTaxDeductible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isTaxDeductible: checked as boolean })
                }
              />
              <Label
                htmlFor="isTaxDeductible"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Tax Deductible
              </Label>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Expense"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

