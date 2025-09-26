import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons'; // You might need to install @expo/vector-icons

// Tab Screens
import HomeScreen from '../screens/main/HomeScreen';
import MatchesScreen from '../screens/main/MatchesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';

// Stack Screens
import CreateMatchScreen from '../screens/matches/CreateMatchScreen';
import MatchDetailScreen from '../screens/matches/MatchDetailScreen';
import MatchChatScreen from '../screens/chat/MatchChatScreen';
import CreateMatchNavigator from './CreateMatchNavigator';
import MatchNavigator from './MatchNavigator';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Bottom Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'football' : 'football-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Discover') {
            iconName = focused ? 'search' : 'search-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen} 
        options={{ title: 'My Matches' }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen} 
        options={{ title: 'Discover' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Main Navigator
const MainNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TabNavigator" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateMatch" 
        component={CreateMatchNavigator}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="MatchDetail" 
        component={MatchDetailScreen}
        options={{ 
          title: 'Match Details',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen 
        name="MatchChat" 
        component={MatchChatScreen}
        options={{ 
          title: 'Match Chat',
          headerBackTitle: 'Back'
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
