import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { invoiceFormSchema, type InvoiceFormData } from "@/lib/invoice-schemas";
import { z } from "zod";

interface UseInvoiceFormOptions {
  initialData?: Partial<InvoiceFormData>;
  lineItems: any[];
  taxRate: number;
}

export function useInvoiceForm({ initialData, lineItems, taxRate }: UseInvoiceFormOptions) {
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: initialData?.clientId || undefined,
      bankAccountId: initialData?.bankAccountId || undefined,
      date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
      orderNumber: initialData?.orderNumber || "",
      projectNumber: initialData?.projectNumber || "",
      forProject: initialData?.forProject || undefined,
      taxRate: initialData?.taxRate || 0,
      notes: initialData?.notes || "",
      lineItems: lineItems,
    },
  });

  const validateForm = async (): Promise<{ valid: boolean; error?: string }> => {
    const formIsValid = await form.trigger();
    if (!formIsValid) {
      return { valid: false, error: "Please fill in all required fields" };
    }

    const formData = form.getValues();
    const data = { ...formData, lineItems, taxRate };

    try {
      invoiceFormSchema.parse(data);
      return { valid: true };
    } catch (validationError: any) {
      if (validationError instanceof z.ZodError) {
        const firstError = validationError.errors[0];
        return {
          valid: false,
          error: firstError?.message || "Please check all fields are filled correctly",
        };
      }
      return { valid: false, error: "Validation failed" };
    }
  };

  const getFormData = () => {
    const formData = form.getValues();
    return { ...formData, lineItems, taxRate };
  };

  return {
    form,
    validateForm,
    getFormData,
  };
}

