import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { API_URL } from "../config/api";

const clearSession = async () => {
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
  await SecureStore.deleteItemAsync("user_id");
};

const refreshAccessToken = async () => {
  const refreshToken = await SecureStore.getItemAsync("refresh_token");
  if (!refreshToken) return null;
  try {
    const response = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await response.json();

    if (!data.success) return null;

    await SecureStore.setItemAsync("access_token", data.data.access_token);
    await SecureStore.setItemAsync("refresh_token", data.data.refresh_token);
    return data.data.access_token;
  } catch (e) {
    return null;
  }
};

export const apiFetch = async (path, options = {}) => {
  let accessToken = await SecureStore.getItemAsync("access_token");
  const doFetch = (token) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  let response = await doFetch(accessToken);
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      await clearSession();
      router.replace("/login");
      return response; 
    }
    response = await doFetch(newToken);
  }
  return response;
};