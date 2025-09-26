import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator, View, Text } from 'react-native';
import { persistor } from '../redux/store';
import { setCredentials, clearAuth } from '../redux/slices/authSlice';
import authService from '../services/authService';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Navigator
import MainNavigator from './MainNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useSelector(state => state.auth);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await authService.initializeAuth();
        if (token) {
          const user = await authService.getCurrentUser();
          dispatch(setCredentials({ token, user }));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.removeAuthToken();
        dispatch(clearAuth());
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [dispatch]);

  const LoadingScreen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={{ marginTop: 16, fontSize: 16 }}>Loading FootyHeroes...</Text>
    </View>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="MainNavigator" component={MainNavigator} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
