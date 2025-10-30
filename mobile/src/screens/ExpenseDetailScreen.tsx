import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Modal, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  IconButton,
  Chip,
} from 'react-native-paper';
import { useExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/constants/expenseCategories';
import { safeParseFloat } from '@/utils/numberUtils';
import { format } from 'date-fns';
import ExpenseForm from '@/components/ExpenseForm';
import type { CreateExpenseData } from '@/types';

interface ExpenseDetailScreenProps {
  route: { params: { expenseId: string } };
  navigation: any;
}

export default function ExpenseDetailScreen({ route, navigation }: ExpenseDetailScreenProps) {
  const { expenseId } = route.params;
  const { data: expense, isLoading } = useExpense(expenseId);
  const deleteMutation = useDeleteExpense();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(expenseId, {
              onSuccess: () => {
                navigation.goBack();
              },
            });
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleSubmit = async (data: CreateExpenseData) => {
    // This will be handled by ExpenseFormScreen
    navigation.navigate('ExpenseForm', { expenseId, expense });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.centerContainer}>
        <Text>Expense not found</Text>
      </View>
    );
  }

  if (showEditForm) {
    return (
      <ExpenseForm
        expense={expense}
        onSubmit={handleSubmit}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category) || {
    label: expense.category,
    icon: '📄',
  };
  const paymentMethod = PAYMENT_METHODS.find(m => m.value === expense.paymentMethod) || {
    label: expense.paymentMethod,
  };
  const amount = safeParseFloat(expense.amount, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Expense Details
        </Text>
        <View style={styles.headerActions}>
          <IconButton icon="pencil" onPress={handleEdit} />
          <IconButton icon="delete" onPress={handleDelete} />
        </View>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.amountContainer}>
            <Text variant="displaySmall" style={styles.amount}>
              €{amount.toFixed(2)}
            </Text>
          </View>

          <Text variant="headlineSmall" style={styles.description}>
            {expense.description}
          </Text>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Date:
            </Text>
            <Text variant="bodyLarge">{format(new Date(expense.date), 'PPP')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Category:
            </Text>
            <Chip icon={() => <Text>{category.icon}</Text>} style={styles.chip}>
              {category.label}
            </Chip>
          </View>

          {expense.vendor && (
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Vendor:
              </Text>
              <Text variant="bodyLarge">{expense.vendor}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Payment Method:
            </Text>
            <Text variant="bodyLarge">{paymentMethod.label}</Text>
          </View>

          {expense.tags && (
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Tags:
              </Text>
              <Text variant="bodyLarge">{expense.tags}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Tax Deductible:
            </Text>
            <Chip style={[styles.chip, styles.deductibleChip]}>
              {expense.isTaxDeductible ? 'Yes' : 'No'}
            </Chip>
          </View>

          {expense.receipt && (
            <View style={styles.receiptContainer}>
              <Text variant="bodyMedium" style={styles.label}>
                Receipt:
              </Text>
              <Card style={styles.receiptCard} onPress={() => setShowImageModal(true)}>
                <Image source={{ uri: expense.receipt }} style={styles.receiptThumbnail} />
              </Card>
            </View>
          )}
        </Card.Content>
      </Card>

      <Modal visible={showImageModal} transparent onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <IconButton
              icon="close"
              style={styles.closeButton}
              onPress={() => setShowImageModal(false)}
            />
            {expense.receipt && (
              <Image source={{ uri: expense.receipt }} style={styles.modalImage} />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2,
    paddingHorizontal: 8,
  },
  headerTitle: {
    flex: 1,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amount: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  description: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: '500',
    marginRight: 8,
    minWidth: 120,
  },
  chip: {
    marginRight: 4,
  },
  deductibleChip: {
    backgroundColor: '#4caf50',
  },
  receiptContainer: {
    marginTop: 16,
  },
  receiptCard: {
    marginTop: 8,
    overflow: 'hidden',
  },
  receiptThumbnail: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  modalImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
});

