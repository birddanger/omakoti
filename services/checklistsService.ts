import { SeasonalChecklist, ChecklistItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const checklistsService = {
  // Get all checklists for a property
  async getChecklists(propertyId: string): Promise<SeasonalChecklist[]> {
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/checklists/initialize/${propertyId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to initialize checklists');
    }

    return response.json();
  },

  // Update checklist items
  async updateChecklist(checklistId: string, items: ChecklistItem[]): Promise<SeasonalChecklist> {
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
