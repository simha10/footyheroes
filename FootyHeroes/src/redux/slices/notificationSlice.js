import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    isEnabled: true,
    badgeCount: 0,
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      state.notifications.unshift(notification);
      state.unreadCount += 1;
      state.badgeCount += 1;
    },
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
        state.badgeCount -= 1;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
        }
      });
      state.unreadCount = 0;
      state.badgeCount = 0;
    },
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        state.unreadCount -= 1;
        state.badgeCount -= 1;
      }
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.badgeCount = 0;
    },
    setNotificationsEnabled: (state, action) => {
      state.isEnabled = action.payload;
    },
    setBadgeCount: (state, action) => {
      state.badgeCount = action.payload;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  setNotificationsEnabled,
  setBadgeCount,
} = notificationSlice.actions;
export default notificationSlice.reducer;
