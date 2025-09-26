import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import CreateMatchScreen from '../screens/matches/CreateMatchScreen';
import MatchLocationScreen from '../screens/matches/MatchLocationScreen';
import MatchConfirmationScreen from '../screens/matches/MatchConfirmationScreen';

const Stack = createStackNavigator();

const CreateMatchNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF6B35',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="CreateMatchMain" 
        component={CreateMatchScreen}
        options={{ title: 'Create Match' }}
      />
      <Stack.Screen 
        name="MatchLocation" 
        component={MatchLocationScreen}
        options={{ 
          title: 'Select Location',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen 
        name="MatchConfirmation" 
        component={MatchConfirmationScreen}
        options={{ 
          title: 'Confirm Details',
          headerBackTitle: 'Back'
        }}
      />
    </Stack.Navigator>
  );
};

export default CreateMatchNavigator;
