import { AppDocument } from '../types';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (): HeadersInit => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const documentsService = {
  getAll: async (): Promise<AppDocument[]> => {
    const response = await fetch(`${API_URL}/documents`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  getByProperty: async (propertyId: string): Promise<AppDocument[]> => {
    const response = await fetch(`${API_URL}/documents/property/${propertyId}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  upload: async (document: Omit<AppDocument, 'id'>): Promise<AppDocument> => {
    const response = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(document)
    });

    if (!response.ok) throw new Error('Failed to upload document');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete document');
  }
};
