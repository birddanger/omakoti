const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Warranty {
  id: string;
  applianceId: string;
  provider: string;
  expirationDate: string;
  coverageDetails: string | null;
  documentId: string | null;
  document: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyInput {
  applianceId: string;
  provider: string;
  expirationDate: string;
  coverageDetails?: string;
}

export const warrantiesService = {
  async getByProperty(propertyId: string): Promise<Warranty[]> {
    const response = await fetch(`${API_URL}/warranties/${propertyId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch warranties');
    }

    return response.json();
  },

  async getByAppliance(applianceId: string): Promise<Warranty | null> {
    const response = await fetch(`${API_URL}/warranties/appliance/${applianceId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch warranty');
    }

    return response.json();
  },

  async create(warranty: WarrantyInput): Promise<Warranty> {
    const response = await fetch(`${API_URL}/warranties`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(warranty)
    });

    if (!response.ok) {
      throw new Error('Failed to create warranty');
    }

    return response.json();
  },

  async update(id: string, warranty: Partial<WarrantyInput>): Promise<Warranty> {
    const response = await fetch(`${API_URL}/warranties/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(warranty)
    });

    if (!response.ok) {
      throw new Error('Failed to update warranty');
    }

    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/warranties/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete warranty');
    }
  }
};

export default warrantiesService;
