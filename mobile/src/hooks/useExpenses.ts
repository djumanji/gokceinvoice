import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import type { Expense, CreateExpenseData, UpdateExpenseData } from '@/types';

const EXPENSES_QUERY_KEY = 'expenses';

export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: [EXPENSES_QUERY_KEY],
    queryFn: () => apiClient.getExpenses(),
  });
}

export function useExpense(id: string) {
  return useQuery<Expense>({
    queryKey: [EXPENSES_QUERY_KEY, id],
    queryFn: () => apiClient.getExpense(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseData) => apiClient.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseData }) =>
      apiClient.updateExpense(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY, variables.id] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
    },
  });
}

