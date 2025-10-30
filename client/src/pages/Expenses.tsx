import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseTable } from "@/components/ExpenseTable";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Receipt, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { safeParseFloat } from "@/lib/numberUtils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/components/ExpenseForm";
import type { Expense } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function Expenses() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (data: any) => {
    try {
      if (editingExpense) {
        await apiRequest("PATCH", `/api/expenses/${editingExpense.id}`, data);
      } else {
        await apiRequest("POST", "/api/expenses", data);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setShowForm(false);
      setEditingExpense(undefined);
    } catch (error) {
      console.error("Failed to save expense:", error);
    }
  };

  const handleEdit = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        await apiRequest("DELETE", `/api/expenses/${id}`);
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      } catch (error) {
        console.error("Failed to delete expense:", error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingExpense(undefined);
  };

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + safeParseFloat(e.amount, 0), 0);
  const taxDeductibleTotal = filteredExpenses
    .filter(e => e.isTaxDeductible)
    .reduce((sum, e) => sum + safeParseFloat(e.amount, 0), 0);

  if (showForm) {
    return (
      <div className="p-6">
        <ExpenseForm
          expense={editingExpense}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("expense.expenses")}</h1>
          <p className="text-muted-foreground">{t("expense.trackExpenses")}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t("expense.addExpense")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tax Deductible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{taxDeductibleTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Potential tax savings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{expenses
                .filter(e => {
                  const expenseDate = new Date(e.date);
                  const now = new Date();
                  return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
                })
                .reduce((sum, e) => sum + safeParseFloat(e.amount, 0), 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current month expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredExpenses.length === 0 && expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Get started by adding your first expense."
              actionLabel="Add Expense"
              onAction={() => setShowForm(true)}
            />
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses match your search criteria.
            </div>
          ) : (
            <ExpenseTable
              expenses={filteredExpenses}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

