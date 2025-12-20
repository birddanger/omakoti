import { authService } from './authService';

export interface PropertyAccess {
  id: string;
  userId?: string;
  name?: string;
  email: string;
  role: 'owner' | 'admin' | 'edit' | 'view';
  inviteEmail?: string;
  inviteAccepted: boolean;
  invitedAt?: string;
  acceptedAt?: string;
}

export const accessService = {
  // Get all users with access to a property
  async getPropertyAccess(propertyId: string): Promise<PropertyAccess[]> {
    const token = authService.getToken();
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/access/properties/${propertyId}/access`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch access list');
    const data = await response.json();
    return data.access || [];
  },

  // Share property with a family member
  async shareProperty(propertyId: string, email: string, role: string): Promise<PropertyAccess> {
    const token = authService.getToken();
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/access/properties/${propertyId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email, role })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to share property');
    }
    return response.json();
  },

  // Update permission level
  async updateAccess(propertyId: string, accessId: string, role: string): Promise<void> {
    const token = authService.getToken();
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/access/properties/${propertyId}/access/${accessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });
    if (!response.ok) throw new Error('Failed to update access');
  },

  // Remove access
  async removeAccess(propertyId: string, accessId: string): Promise<void> {
    const token = authService.getToken();
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/access/properties/${propertyId}/access/${accessId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to remove access');
  },

  // Get all properties accessible to current user
  async getAccessibleProperties(): Promise<any[]> {
    const token = authService.getToken();
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/access/properties/accessible/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch accessible properties');
    return response.json();
  }
};
