import React, { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../config/api";
import * as SecureStore from "expo-secure-store";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authError, setAuthError] = useState(null);
  const loadUser = async () => {
    setLoadingUser(true);
      setAuthError(null);
    try {
      const token = await SecureStore.getItemAsync("access_token");
      
      if (!token) {
        setUser(null);
        setAuthError(null)
        return {
          success: false,
          status: 401,
          message: "No hay sesión",
        };
      }
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          setAuthError(null);
        } else {
          setAuthError("server");
        }
        return {
          success: false,
          status: response.status,
          message: data.message,
        };
      }
      setUser(data.data);
      setAuthError(null);
      return {
        success: true,
        status: response.status,
        data,
      };
    } catch (e) {
      setUser(null);
      setAuthError("network");
      return {
        success: false,
        status: 0,
        message: "No se pudo conectar al servidor",
      };
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadUser();
    })();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loadUser, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
