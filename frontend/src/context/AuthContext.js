import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    isLoggedIn();
  }, []);

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem('userToken');
      let userInfo = await AsyncStorage.getItem('userInfo');
      
      if (token && userInfo) {
        setUserToken(token);
        setUser(JSON.parse(userInfo));
      }
    } catch (e) {
      console.log(`isLogged in error ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData, token) => {
    setUser(userData);
    setUserToken(token);
    AsyncStorage.setItem('userInfo', JSON.stringify(userData));
    AsyncStorage.setItem('userToken', token);
  };

  const logout = () => {
    setUser(null);
    setUserToken(null);
    AsyncStorage.removeItem('userInfo');
    AsyncStorage.removeItem('userToken');
  };

  return (
    <AuthContext.Provider value={{ login, logout, user, userToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
