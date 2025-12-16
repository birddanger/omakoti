import { Property } from '../types';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (): HeadersInit => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const propertyService = {
  getAll: async (): Promise<Property[]> => {
    const response = await fetch(`${API_URL}/properties`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch properties');
    return response.json();
  },

  getById: async (id: string): Promise<Property> => {
    const response = await fetch(`${API_URL}/properties/${id}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch property');
    return response.json();
  },

  create: async (property: Omit<Property, 'id'>): Promise<Property> => {
    const response = await fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(property)
    });

    if (!response.ok) throw new Error('Failed to create property');
    return response.json();
  },

  update: async (id: string, property: Partial<Property>): Promise<Property> => {
    const response = await fetch(`${API_URL}/properties/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(property)
    });

    if (!response.ok) throw new Error('Failed to update property');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete property');
  }
};
