import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import matchReducer from './slices/matchSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['chat', 'notifications'], // Don't persist chat and notifications
};

const rootReducer = combineReducers({
  auth: authReducer,
  matches: matchReducer,
  chat: chatReducer,
  notifications: notificationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, 'chat/setSocketConnection'],
        ignoredPaths: ['chat.socketConnection'],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
