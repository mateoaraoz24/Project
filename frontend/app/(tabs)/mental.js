import { Pressable, Text, TextInput, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { API_URL } from "../../config/api";
export default function Mental() {
  const logout = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
      const response = await fetch(`${API_URL}]/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await clearSession();
        router.replace("/login");
      } else {
        alert("Inténtalo nuevamente");
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor");
    } finally {
      await clearSession();
      router.replace("/login");
    }
  };
  const clearSession = async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user_id");
  };
  return (
    <View>
      <Text>Hola mental</Text>
      <Pressable onPress={logout}>
        <Text>Logout</Text>
      </Pressable>
      <TextInput value="39"/>
    </View>
  );
}
