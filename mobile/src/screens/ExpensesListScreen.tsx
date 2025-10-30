import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  TextInput,
  Button,
  Menu,
  Chip,
  ActivityIndicator,
  FAB,
  IconButton,
} from 'react-native-paper';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { EXPENSE_CATEGORIES } from '@/constants/expenseCategories';
import { safeParseFloat } from '@/utils/numberUtils';
import { format } from 'date-fns';
import type { Expense } from '@/types';

interface ExpensesListScreenProps {
  navigation: any;
}

interface ExpenseCardProps {
  expense: Expense;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ExpenseCard({ expense, onPress, onEdit, onDelete }: ExpenseCardProps) {
  const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category) || {
    label: expense.category,
    icon: '📄',
  };
  const amount = safeParseFloat(expense.amount, 0);

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {expense.description}
            </Text>
            <Text variant="bodySmall" style={styles.cardDate}>
              {format(new Date(expense.date), 'MMM dd, yyyy')}
            </Text>
          </View>
          <Text variant="titleLarge" style={styles.cardAmount}>
            €{amount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.cardDetails}>
          <Chip icon={() => <Text>{category.icon}</Text>} style={styles.chip}>
            {category.label}
          </Chip>
          {expense.vendor && (
            <Text variant="bodySmall" style={styles.vendor}>
              {expense.vendor}
            </Text>
          )}
          {expense.isTaxDeductible && (
            <Chip style={[styles.chip, styles.deductibleChip]}>Deductible</Chip>
          )}
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={onEdit}>Edit</Button>
        <Button onPress={onDelete} textColor="#d32f2f">
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );
}

function StatsCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Text variant="bodySmall" style={styles.statsTitle}>
          {title}
        </Text>
        <Text variant="headlineSmall" style={styles.statsValue}>
          {value}
        </Text>
        {subtitle && (
          <Text variant="bodySmall" style={styles.statsSubtitle}>
            {subtitle}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

export default function ExpensesListScreen({ navigation }: ExpensesListScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const { data: expenses = [], isLoading, refetch } = useExpenses();
  const deleteMutation = useDeleteExpense();
  const { logout } = useAuth();

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + safeParseFloat(e.amount, 0), 0);
    const taxDeductible = filteredExpenses
      .filter((e) => e.isTaxDeductible)
      .reduce((sum, e) => sum + safeParseFloat(e.amount, 0), 0);

    const now = new Date();
    const thisMonth = expenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        return (
          expenseDate.getMonth() === now.getMonth() &&
          expenseDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, e) => sum + safeParseFloat(e.amount, 0), 0);

    return {
      total,
      taxDeductible,
      thisMonth,
    };
  }, [filteredExpenses, expenses]);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        // Deletion handled by React Query invalidation
      },
    });
  };

  const handleExpensePress = (expense: Expense) => {
    navigation.navigate('ExpenseDetail', { expenseId: expense.id });
  };

  const handleEdit = (expense: Expense) => {
    navigation.navigate('ExpenseForm', { expense });
  };

  const selectedCategoryLabel =
    categoryFilter === 'all'
      ? 'All Categories'
      : EXPENSE_CATEGORIES.find((c) => c.value === categoryFilter)?.label || 'All Categories';

  if (isLoading && expenses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Expenses
        </Text>
        <IconButton
          icon="logout"
          onPress={async () => {
            await logout();
          }}
        />
      </View>

      <View style={styles.statsContainer}>
        <StatsCard
          title="Total Expenses"
          value={`€${stats.total.toFixed(2)}`}
          subtitle={`${filteredExpenses.length} expense${filteredExpenses.length !== 1 ? 's' : ''}`}
        />
        <StatsCard
          title="Tax Deductible"
          value={`€${stats.taxDeductible.toFixed(2)}`}
          subtitle="Potential tax savings"
        />
        <StatsCard
          title="This Month"
          value={`€${stats.thisMonth.toFixed(2)}`}
          subtitle="Current month expenses"
        />
      </View>

      <View style={styles.filtersContainer}>
        <TextInput
          mode="outlined"
          placeholder="Search expenses..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
        />
        <Menu
          visible={showCategoryMenu}
          onDismiss={() => setShowCategoryMenu(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setShowCategoryMenu(true)}
              style={styles.filterButton}
            >
              {selectedCategoryLabel}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setCategoryFilter('all');
              setShowCategoryMenu(false);
            }}
            title="All Categories"
          />
          {EXPENSE_CATEGORIES.map((category) => (
            <Menu.Item
              key={category.value}
              onPress={() => {
                setCategoryFilter(category.value);
                setShowCategoryMenu(false);
              }}
              title={`${category.icon} ${category.label}`}
            />
          ))}
        </Menu>
      </View>

      {filteredExpenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            {expenses.length === 0
              ? 'No expenses yet. Add your first expense to get started.'
              : 'No expenses match your search criteria.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onPress={() => handleExpensePress(item)}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('ExpenseForm')}
      />
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statsCard: {
    flex: 1,
    elevation: 2,
  },
  statsTitle: {
    color: '#666',
    marginBottom: 4,
  },
  statsValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsSubtitle: {
    color: '#999',
    fontSize: 11,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    minWidth: 150,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDate: {
    color: '#666',
  },
  cardAmount: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    marginRight: 4,
  },
  deductibleChip: {
    backgroundColor: '#4caf50',
  },
  vendor: {
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976d2',
  },
});

