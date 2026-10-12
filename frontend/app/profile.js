import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../lib/sesion";
export default function Profile() {
  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync("refresh_token");

      if (!refreshToken) {
        await clearSession();
        router.replace("/login");
        return;
      }

      const response = await apiFetch("/logout", {
        method: "POST",
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log("Error en logout:", response.status, data);
        alert("No se pudo cerrar la sesión en el servidor.");
        return;
      }

      await clearSession();
      router.replace("/login");
    } catch (error) {
      console.log("Error de conexión en logout:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };
  const clearSession = async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user_id");
  };
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: 42, marginBottom: 25 }]}>
        Configuraciones
      </Text>
      <Pressable
        style={[
          styles.button,
          { borderColor: "#e9ecef", backgroundColor: "#e9ecef" },
        ]}
        onPress={() => router.push("/edit-account")}
      >
        <Text style={[styles.text, { fontSize: 22, color: "#000" }]}>
          Datos de la cuenta
        </Text>
      </Pressable>
      <Pressable
        style={[styles.button, { borderColor: "#1971c2" }]}
        onPress={() => router.push("/see-social")}
      >
        <Text style={[styles.text, { fontSize: 22, color: "#1971c2" }]}>
          Ver tu diagnostico social
        </Text>
      </Pressable>
      <Pressable
        style={[styles.button, { borderColor: "#e03131" }]}
        onPress={logout}
      >
        <Text style={[styles.text, { fontSize: 22, color: "#e03131" }]}>
          Cerrar sesión
        </Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 10,
  },
  button: {
    width: "100%",
    paddingVertical: 20,
    borderWidth: 2,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
});
