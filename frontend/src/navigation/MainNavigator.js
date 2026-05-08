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
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CustomTabBarButton = ({ children, onPress }) => (
  <View style={styles.customTabBarButtonContainer}>
    <TouchableOpacity
      style={styles.customTabBarButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="add" size={32} color={colors.white} />
    </TouchableOpacity>
  </View>
);

const TabNavigator = ({ navigation }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
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
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
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
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
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
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
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
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="EditExpense" component={EditExpenseScreen} />
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
    backgroundColor: colors.white,
    borderRadius: 30,
    height: 65,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderTopWidth: 0,
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
  activeIconContainer: {
    backgroundColor: '#F7EEFF', 
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
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
