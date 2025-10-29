import { useState, useCallback } from "react";
import type { LineItem } from "@/lib/invoice-schemas";

interface UseLineItemsOptions {
  initialItems?: LineItem[];
}

export function useLineItems({ initialItems }: UseLineItemsOptions = {}) {
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialItems || [{ description: "", quantity: 1, price: 0 }]
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<Record<number, string>>({});

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, { description: "", quantity: 1, price: 0 }]);
  }, []);

  const removeLineItem = useCallback((index: number) => {
    setLineItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
    
    // Reindex selected service IDs
    setSelectedServiceIds((prev) => {
      const updatedIds: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const oldIndex = parseInt(key);
        if (oldIndex < index) {
          updatedIds[oldIndex] = value;
        } else if (oldIndex > index) {
          updatedIds[oldIndex - 1] = value;
        }
      });
      return updatedIds;
    });
  }, []);

  const updateLineItem = useCallback((index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const setLineItemService = useCallback((index: number, serviceId: string, serviceName: string, servicePrice: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        description: serviceName,
        quantity: 1,
        price: servicePrice,
      };
      return updated;
    });
    setSelectedServiceIds((prev) => ({ ...prev, [index]: serviceId }));
  }, []);

  const getSelectedServiceId = useCallback((index: number) => {
    return selectedServiceIds[index];
  }, [selectedServiceIds]);

  return {
    lineItems,
    selectedServiceIds,
    addLineItem,
    removeLineItem,
    updateLineItem,
    setLineItemService,
    getSelectedServiceId,
  };
}

