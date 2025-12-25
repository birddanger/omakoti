import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (): HeadersInit => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export interface RecurringTask {
  id: string;
  propertyId: string;
  userId: string;
  title: string;
  description: string | null;
  frequency: string; // weekly, biweekly, monthly, quarterly, biannual, annual
  priority: string; // High, Medium, Low
  estimatedCost: string | null;
  category: string;
  nextDueDate: string;
  lastGeneratedDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTaskInput {
  propertyId: string;
  title: string;
  description?: string;
  frequency: string;
  priority?: string;
  estimatedCost?: string;
  category?: string;
}

export const recurringTasksService = {
  async getByProperty(propertyId: string): Promise<RecurringTask[]> {
    const response = await fetch(`${API_URL}/recurring-tasks/${propertyId}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recurring tasks');
    }

    return response.json();
  },

  async create(task: RecurringTaskInput): Promise<{ recurringTask: RecurringTask; plannedTask: any }> {
    const response = await fetch(`${API_URL}/recurring-tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task)
    });

    if (!response.ok) {
      throw new Error('Failed to create recurring task');
    }

    return response.json();
  },

  async update(id: string, task: Partial<RecurringTaskInput>): Promise<RecurringTask> {
    const response = await fetch(`${API_URL}/recurring-tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(task)
    });

    if (!response.ok) {
      throw new Error('Failed to update recurring task');
    }

    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/recurring-tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to delete recurring task');
    }
  },

  async generateTasks(): Promise<{ message: string; tasks: any[] }> {
    const response = await fetch(`${API_URL}/recurring-tasks/generate`, {
      method: 'POST',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to generate planned tasks');
    }

    return response.json();
  }
};

export default recurringTasksService;
