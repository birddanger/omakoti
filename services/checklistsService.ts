import { SeasonalChecklist, ChecklistItem } from '../types';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const checklistsService = {
  // Get all checklists for a property
  async getChecklists(propertyId: string): Promise<SeasonalChecklist[]> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    const response = await fetch(`${API_URL}/checklists/${propertyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch checklists');
    }

    return response.json();
  },

  // Initialize seasonal checklists with templates
  async initializeChecklists(propertyId: string): Promise<SeasonalChecklist[]> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    const response = await fetch(`${API_URL}/checklists/initialize/${propertyId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Initialize checklists error:', response.status, error);
      throw new Error(`Failed to initialize checklists: ${error.error || response.statusText}`);
    }

    return response.json();
  },

  // Update checklist items
  async updateChecklist(checklistId: string, items: ChecklistItem[]): Promise<SeasonalChecklist> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    const response = await fetch(`${API_URL}/checklists/${checklistId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      throw new Error('Failed to update checklist');
    }

    return response.json();
  },

  // Delete a checklist
  async deleteChecklist(checklistId: string): Promise<void> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    const response = await fetch(`${API_URL}/checklists/${checklistId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete checklist');
    }
  }
};
