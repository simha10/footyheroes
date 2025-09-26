import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    currentMatchChat: null,
    messages: [],
    socketConnection: null,
    isConnected: false,
    typingUsers: [],
    unreadCount: 0,
  },
  reducers: {
    setSocketConnection: (state, action) => {
      state.socketConnection = action.payload;
      state.isConnected = action.payload?.connected || false;
    },
    setCurrentMatchChat: (state, action) => {
      state.currentMatchChat = action.payload;
      state.messages = action.payload?.messages || [];
      state.unreadCount = 0;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    updateMessage: (state, action) => {
      const { messageId, updates } = action.payload;
      const index = state.messages.findIndex(msg => msg._id === messageId);
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...updates };
      }
    },
    deleteMessage: (state, action) => {
      const messageId = action.payload;
      state.messages = state.messages.filter(msg => msg._id !== messageId);
    },
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action) => {
      const userId = action.payload;
      if (!state.typingUsers.includes(userId)) {
        state.typingUsers.push(userId);
      }
    },
    removeTypingUser: (state, action) => {
      const userId = action.payload;
      state.typingUsers = state.typingUsers.filter(id => id !== userId);
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    clearChat: (state) => {
      state.currentMatchChat = null;
      state.messages = [];
      state.unreadCount = 0;
      state.typingUsers = [];
    },
  },
});

export const {
  setSocketConnection,
  setCurrentMatchChat,
  addMessage,
  clearMessages,
  updateMessage,
  deleteMessage,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  incrementUnreadCount,
  resetUnreadCount,
  setConnectionStatus,
  clearChat,
} = chatSlice.actions;
export default chatSlice.reducer;
