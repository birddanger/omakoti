import { PlannedTask } from '../types';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (): HeadersInit => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const tasksService = {
  getAll: async (): Promise<PlannedTask[]> => {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  getByProperty: async (propertyId: string): Promise<PlannedTask[]> => {
    const response = await fetch(`${API_URL}/tasks/property/${propertyId}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  create: async (task: Omit<PlannedTask, 'id'>): Promise<PlannedTask> => {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task)
    });

    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  update: async (id: string, task: Partial<PlannedTask>): Promise<PlannedTask> => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(task)
    });

    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  complete: async (id: string): Promise<PlannedTask> => {
    const response = await fetch(`${API_URL}/tasks/${id}/complete`, {
      method: 'PATCH',
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to complete task');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete task');
  }
};
