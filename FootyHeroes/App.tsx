/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PersistGate loading={<View />} persistor={persistor}>
          <View style={styles.container}>
            {Platform.OS === 'ios' ? (
              <StatusBar barStyle={'light'} />
            ) : (
              <StatusBar barStyle={'dark'} />
            )}
            <AppNavigator />
          </View>
        </PersistGate>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
