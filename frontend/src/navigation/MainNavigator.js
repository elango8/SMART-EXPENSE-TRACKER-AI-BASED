import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import PendingConfirmationsScreen from '../screens/PendingConfirmationsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AppPreferencesScreen from '../screens/AppPreferencesScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';
import TransactionPermissionScreen from '../screens/TransactionPermissionScreen';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import EditExpenseScreen from '../screens/EditExpenseScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CustomTabBarButton = ({ children, onPress, colors }) => (
  <View style={styles.customTabBarButtonContainer}>
    <TouchableOpacity
      style={[styles.customTabBarButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="add" size={32} color="#fff" />
    </TouchableOpacity>
  </View>
);

const TabNavigator = ({ navigation }) => {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: isDark ? colors.border : 'transparent',
            borderTopWidth: isDark ? 1 : 0,
          }
        ],
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? '#1E2340' : '#F7EEFF' }]}>
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={20} color={focused ? colors.primary : colors.textSub} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.iconText, { color: focused ? colors.primary : colors.textSub }]}>DASHBOARD</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? '#1E2340' : '#F7EEFF' }]}>
              <Ionicons name={focused ? 'time' : 'time-outline'} size={20} color={focused ? colors.primary : colors.textSub} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.iconText, { color: focused ? colors.primary : colors.textSub }]}>HISTORY</Text>
            </View>
          ),
        }}
      />
      
      {/* Central Add Button */}
      <Tab.Screen 
        name="AddExpenseTab" 
        component={AddExpenseScreen} 
        options={{
          tabBarButton: (props) => (
            <CustomTabBarButton 
              {...props} 
              colors={colors}
              onPress={() => navigation.navigate('AddExpense')}
            />
          )
        }}
      />

      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? '#1E2340' : '#F7EEFF' }]}>
              <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={20} color={focused ? colors.primary : colors.textSub} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.iconText, { color: focused ? colors.primary : colors.textSub }]}>ANALYTICS</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? '#1E2340' : '#F7EEFF' }]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={20} color={focused ? colors.primary : colors.textSub} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.iconText, { color: focused ? colors.primary : colors.textSub }]}>PROFILE</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="PendingConfirmations" component={PendingConfirmationsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="AppPreferences" component={AppPreferencesScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="EditExpense" component={EditExpenseScreen} />
      <Stack.Screen name="TransactionPermission" component={TransactionPermissionScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 15,
    left: 10,
    right: 10,
    elevation: 8,
    borderRadius: 30,
    height: 65,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    paddingHorizontal: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 1,
    borderRadius: 35,
    width:65,
    height:55, 
    marginTop: Platform.OS === 'ios' ? 15 : 25, 
  },
  iconText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  customTabBarButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTabBarButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  }
});

export default MainNavigator;
