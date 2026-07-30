import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { View, ActivityIndicator, StatusBar } from 'react-native';

const AppNavigator = () => {
  const { userToken, isLoading } = useContext(AuthContext);
  const { isDark, colors, isThemeLoading } = useTheme();

  if (isLoading || isThemeLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Custom navigation themes
  const lightNavTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.textMain,
      border: colors.border,
      primary: colors.primary,
    },
  };

  const darkNavTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.textMain,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <NavigationContainer theme={isDark ? darkNavTheme : lightNavTheme}>
        {userToken !== null ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;
