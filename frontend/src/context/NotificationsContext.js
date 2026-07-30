import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { userToken } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all notifications
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!userToken) return;
    try {
      if (!silent) setIsLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
      // Derive unread count from data
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch (error) {
      console.log('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userToken]);

  // Refresh (for pull-to-refresh)
  const refreshNotifications = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotifications(true);
  }, [fetchNotifications]);

  // Fetch unread count only (lightweight)
  const refreshUnreadCount = useCallback(async () => {
    if (!userToken) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (error) {
      console.log('Error fetching unread count:', error);
    }
  }, [userToken]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.log('Error marking as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.log('Error marking all as read:', error);
    }
  }, []);

  // Delete a single notification (returns the deleted item for undo support)
  const deleteNotification = useCallback(async (id) => {
    const deletedItem = notifications.find((n) => n._id === id);
    // Optimistic removal from UI
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (deletedItem && !deletedItem.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.log('Error deleting notification:', error);
      // Rollback on failure
      if (deletedItem) {
        setNotifications((prev) => {
          const restored = [...prev, deletedItem];
          restored.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          return restored;
        });
        if (deletedItem && !deletedItem.read) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    }

    return deletedItem;
  }, [notifications]);

  // Restore a notification (for undo). Re-creates it on the backend.
  const restoreNotification = useCallback(async (item) => {
    if (!item) return;
    try {
      const res = await api.post('/notifications', {
        title: item.title,
        message: item.message,
        type: item.type,
        icon: item.icon,
      });
      setNotifications((prev) => {
        const updated = [res.data, ...prev];
        updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return updated;
      });
      if (!item.read) {
        setUnreadCount((prev) => prev + 1);
      }
    } catch (error) {
      console.log('Error restoring notification:', error);
    }
  }, []);

  // Delete all notifications
  const clearAll = useCallback(async () => {
    const backup = [...notifications];
    setNotifications([]);
    setUnreadCount(0);

    try {
      await api.delete('/notifications/all');
    } catch (error) {
      console.log('Error clearing all notifications:', error);
      // Rollback
      setNotifications(backup);
      setUnreadCount(backup.filter((n) => !n.read).length);
    }
  }, [notifications]);

  // Auto-fetch when user logs in and set up periodic polling
  useEffect(() => {
    if (userToken) {
      fetchNotifications();

      // Poll for unread count updates every 60 seconds
      const interval = setInterval(() => {
        refreshUnreadCount();
      }, 60000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userToken, fetchNotifications, refreshUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isRefreshing,
        fetchNotifications,
        refreshNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        restoreNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

// Custom hook
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export default NotificationsContext;
