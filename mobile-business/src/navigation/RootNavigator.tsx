import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ServicesScreen from '../screens/services/ServicesScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EmployeesScreen from '../screens/employees/EmployeesScreen';

// AI Screens
import AIAssistantScreen from '../screens/ai/AIAssistantScreen';

// Detail Screens
import ServiceFormScreen from '../screens/services/ServiceFormScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import IntegrationSettingsScreen from '../screens/settings/IntegrationSettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Bookings':
            iconName = focused ? 'calendar' : 'calendar-outline';
            break;
          case 'Chat':
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
            break;
          case 'Services':
            iconName = focused ? 'briefcase' : 'briefcase-outline';
            break;
          case 'Settings':
            iconName = focused ? 'settings' : 'settings-outline';
            break;
          default:
            iconName = 'circle';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3B82F6',
      tabBarInactiveTintColor: '#6B7280',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Bookings" component={BookingsScreen} />
    <Tab.Screen name="Chat" component={ChatScreen} />
    <Tab.Screen name="Services" component={ServicesScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs} 
      options={{ headerShown: false }}
    />
    
    {/* AI Screens */}
    <Stack.Screen
      name="AIAssistant"
      component={AIAssistantScreen}
      options={{ headerShown: false }}
    />
    
    {/* Detail Screens */}
    <Stack.Screen
      name="ServiceForm"
      component={ServiceFormScreen}
      options={{ 
        title: 'Service Management',
        headerBackTitleVisible: false,
      }}
    />
    
    <Stack.Screen
      name="BookingDetail"
      component={BookingDetailScreen}
      options={{ 
        title: 'Booking Details',
        headerBackTitleVisible: false,
      }}
    />
    
    <Stack.Screen
      name="IntegrationSettings"
      component={IntegrationSettingsScreen}
      options={{ 
        title: 'Integration Settings',
        headerBackTitleVisible: false,
      }}
    />
    
    {/* Additional Main Screens */}
    <Stack.Screen
      name="Calendar"
      component={CalendarScreen}
      options={{ 
        title: 'Calendar',
        headerBackTitleVisible: false,
      }}
    />
    
    <Stack.Screen
      name="Inventory"
      component={InventoryScreen}
      options={{ 
        title: 'Inventory',
        headerBackTitleVisible: false,
      }}
    />
    
    <Stack.Screen
      name="Analytics"
      component={AnalyticsScreen}
      options={{ 
        title: 'Analytics',
        headerBackTitleVisible: false,
      }}
    />
    
    <Stack.Screen
      name="Employees"
      component={EmployeesScreen}
      options={{ 
        title: 'Employees',
        headerBackTitleVisible: false,
      }}
    />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { employee, isLoading } = useAuth();

  if (isLoading) {
    // You can add a splash screen component here
    return null;
  }

  return (
    <NavigationContainer>
      {employee ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator; 