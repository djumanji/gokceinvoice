export interface Expense {
  id: string;
  userId: string;
  description: string;
  category: string;
  amount: string;
  date: string;
  paymentMethod: string;
  vendor?: string;
  isTaxDeductible: boolean;
  receipt?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  description: string;
  category: string;
  amount: string;
  date: string;
  paymentMethod: string;
  vendor?: string;
  isTaxDeductible: boolean;
  receipt?: string;
  tags?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

