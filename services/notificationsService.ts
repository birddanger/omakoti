import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (): HeadersInit => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export interface AppNotification {
  id: string;
  userId: string;
  propertyId: string | null;
  type: 'task_due' | 'task_overdue' | 'warranty_expiring' | 'recurring_generated';
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  relatedId: string | null;
  dueDate: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export const notificationsService = {
  async getAll(unreadOnly = false): Promise<NotificationsResponse> {
    const response = await fetch(`${API_URL}/notifications${unreadOnly ? '?unread=true' : ''}`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  async markRead(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to mark notification read');
  },

  async markAllRead(): Promise<void> {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to mark all read');
  },

  async remove(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete notification');
  },

  async scanNow(): Promise<{ generatedRecurringTasks: number; notificationsCreated: number }> {
    const response = await fetch(`${API_URL}/notifications/scan`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to run reminder scan');
    return response.json();
  }
};

export default notificationsService;
