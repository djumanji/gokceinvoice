import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/constants/config';
import type { Expense, CreateExpenseData, UpdateExpenseData, AuthResponse, User } from '@/types';

const TOKEN_KEY = '@expense_app:token';
const USER_KEY = '@expense_app:user';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.API_BASE_URL;
  }

  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  private async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        response.status,
        errorText || `Request failed with status ${response.status}`
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return {} as T;
  }

  private async requestFormData<T>(
    endpoint: string,
    formData: FormData,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        response.status,
        errorText || `Request failed with status ${response.status}`
      );
    }

    return await response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      await this.setToken(response.token);
    }
    if (response.user) {
      await this.setUser(response.user);
    }

    return response;
  }

  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (response.token) {
      await this.setToken(response.token);
    }
    if (response.user) {
      await this.setUser(response.user);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.request<User>('/api/auth/me');
    } catch (error) {
      return null;
    }
  }

  // Expense endpoints
  async getExpenses(): Promise<Expense[]> {
    return await this.request<Expense[]>('/api/expenses');
  }

  async getExpense(id: string): Promise<Expense> {
    return await this.request<Expense>(`/api/expenses/${id}`);
  }

  async createExpense(data: CreateExpenseData): Promise<Expense> {
    return await this.request<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id: string, data: UpdateExpenseData): Promise<Expense> {
    return await this.request<Expense>(`/api/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string): Promise<void> {
    await this.request(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Upload endpoint
  async uploadImage(fileUri: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    } as any);

    return await this.requestFormData<{ url: string }>('/api/upload', formData);
  }
}

export const apiClient = new ApiClient();

