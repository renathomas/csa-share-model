import { apiService } from './api.service';

export interface NotificationFilters {
  type?: 'order_reminder' | 'order_locked' | 'payment_failed' | 'subscription_renewed';
  status?: 'sent' | 'failed';
  read?: boolean;
}

export class NotificationService {
  /**
   * Get user notifications
   */
  async getUserNotifications(filters?: NotificationFilters, limit = 20, offset = 0) {
    const response = await apiService.getUserNotifications(limit, offset);
    return response.data;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    const response = await apiService.markNotificationAsRead(notificationId);
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    const notifications = await this.getUserNotifications({ read: false });
    return notifications.length;
  }

  /**
   * Format notification type for display
   */
  formatNotificationType(type: string): string {
    const typeMap: Record<string, string> = {
      order_reminder: 'Order Reminder',
      order_locked: 'Order Locked',
      payment_failed: 'Payment Failed',
      subscription_renewed: 'Subscription Renewed',
    };

    return typeMap[type] || type;
  }

  /**
   * Get notification icon
   */
  getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      order_reminder: '⏰',
      order_locked: '🔒',
      payment_failed: '❌',
      subscription_renewed: '✅',
    };

    return iconMap[type] || '📢';
  }

  /**
   * Get notification color
   */
  getNotificationColor(type: string): string {
    const colorMap: Record<string, string> = {
      order_reminder: 'orange',
      order_locked: 'blue',
      payment_failed: 'red',
      subscription_renewed: 'green',
    };

    return colorMap[type] || 'gray';
  }

  /**
   * Format notification timestamp
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Show browser notification (if permitted)
   */
  async showBrowserNotification(title: string, body: string, icon?: string) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body, icon });
        }
      }
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
}

export const notificationService = new NotificationService(); 