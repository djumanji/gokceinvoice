import React from 'react';
import ExpenseForm from '@/components/ExpenseForm';
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenses';
import type { CreateExpenseData, Expense } from '@/types';

interface ExpenseFormScreenProps {
  route: { params?: { expense?: Expense; expenseId?: string } };
  navigation: any;
}

export default function ExpenseFormScreen({ route, navigation }: ExpenseFormScreenProps) {
  const expense = route.params?.expense;
  const expenseId = route.params?.expenseId;
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const handleSubmit = async (data: CreateExpenseData) => {
    try {
      if (expense || expenseId) {
        await updateMutation.mutateAsync({
          id: expenseId || expense!.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save expense:', error);
      // Error handling is done by the mutation
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ExpenseForm
      expense={expense}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={createMutation.isPending || updateMutation.isPending}
    />
  );
}

