import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

const API_URL = Platform.OS === 'android'
  ? 'http://172.18.16.219:5000/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('Error getting token', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { response, message } = error;

    if (response) {
      if (response.status === 401) {
        console.log('Session expired or unauthorized (401).');
        try {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userInfo');
        } catch (storageError) {
          console.log('Failed to clear credentials:', storageError);
        }

        // Show session expiration message
        Alert.alert('Session Expired', 'Please login again to continue.');
      } else if (response.status >= 500) {
        Alert.alert('Server Error', 'Internal server error. Please try again later.');
      }
    } else if (message === 'Network Error') {
      Alert.alert('Network Error', 'Could not connect to the server. Please check your internet connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
