import { MaintenanceLog } from '../types';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (): HeadersInit => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const logsService = {
  getAll: async (): Promise<MaintenanceLog[]> => {
    const response = await fetch(`${API_URL}/logs`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
  },

  getByProperty: async (propertyId: string): Promise<MaintenanceLog[]> => {
    const response = await fetch(`${API_URL}/logs/property/${propertyId}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
  },

  create: async (log: Omit<MaintenanceLog, 'id'>): Promise<MaintenanceLog> => {
    const response = await fetch(`${API_URL}/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(log)
    });

    if (!response.ok) throw new Error('Failed to create log');
    return response.json();
  },

  update: async (id: string, log: Partial<MaintenanceLog>): Promise<MaintenanceLog> => {
    const response = await fetch(`${API_URL}/logs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(log)
    });

    if (!response.ok) throw new Error('Failed to update log');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/logs/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete log');
  }
};
