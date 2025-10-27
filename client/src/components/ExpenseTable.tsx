import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Pencil, Trash2, Receipt } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EXPENSE_CATEGORIES } from "./ExpenseForm";
import { format } from "date-fns";
import type { Expense } from "@shared/schema";

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewReceipt?: (id: string) => void;
}

export function ExpenseTable({ expenses, onEdit, onDelete, onViewReceipt }: ExpenseTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No expenses found. Add your first expense to get started.
      </div>
    );
  }

  const getCategoryInfo = (category: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category) || {
      label: category,
      icon: "📄"
    };
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Tax</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => {
          const category = getCategoryInfo(expense.category);
          const amount = parseFloat(expense.amount);
          
          return (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">
                {format(new Date(expense.date), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>
                <Badge variant="outline" className="gap-1">
                  <span>{category.icon}</span>
                  {category.label}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold">
                €{amount.toFixed(2)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {expense.vendor || "-"}
              </TableCell>
              <TableCell>
                {expense.isTaxDeductible ? (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    Deductible
                  </Badge>
                ) : (
                  <Badge variant="secondary">-</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(expense.id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {expense.receipt && onViewReceipt && (
                      <DropdownMenuItem onClick={() => onViewReceipt(expense.id)}>
                        <Receipt className="mr-2 h-4 w-4" />
                        View Receipt
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(expense.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

