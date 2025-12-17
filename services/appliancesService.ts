import { Appliance } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const appliancesService = {
  getAppliances: async (propertyId: string): Promise<Appliance[]> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/appliances/${propertyId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appliances');
    }

    return response.json();
  },

  createAppliance: async (propertyId: string, appliance: Omit<Appliance, 'id' | 'dateAdded' | 'manualId'>): Promise<Appliance> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/appliances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        propertyId,
        ...appliance
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create appliance');
    }

    return response.json();
  },

  deleteAppliance: async (applianceId: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/appliances/${applianceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete appliance');
    }
  },

  updateAppliance: async (applianceId: string, appliance: Partial<Omit<Appliance, 'id' | 'propertyId' | 'dateAdded' | 'manualId'>>): Promise<Appliance> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/appliances/${applianceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(appliance)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update appliance');
    }

    return response.json();
  }
};
