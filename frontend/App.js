import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { TransactionDetectionProvider } from './src/context/TransactionDetectionContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PreferencesProvider>
          <ThemeProvider>
            <NotificationsProvider>
              <TransactionDetectionProvider>
                <AppNavigator />
              </TransactionDetectionProvider>
            </NotificationsProvider>
          </ThemeProvider>
        </PreferencesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

