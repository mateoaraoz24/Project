import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useUser } from "../context/userProvider";
import { router } from "expo-router";
import { apiFetch } from "../lib/sesion";

export default function EditAccount() {
  const { user, setUser } = useUser();
  const [username, setUsername] = useState(user.user.username);

  const changeUsername = () => {
    const newUsername = username.trim();
    if (newUsername.length < 3 || newUsername.length > 12) {
      Alert.alert(
        "Nombre inválido",
        "El nombre de usuario debe tener entre 3 y 12 caracteres."
      );
      return;
    }
    if (newUsername === user.user.username) {
      Alert.alert("Aviso", "No has cambiado el nombre de usuario.");
      return;
    }
    Alert.alert(
      "Confirmar cambio",
      `¿Quieres cambiar tu nombre de usuario a "${newUsername}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              const res = await apiFetch("/profile/username", {
                method: "PATCH",
                body: JSON.stringify({
                  username: newUsername,
                }),
              });
              const data = await res.json();
              if (!res.ok || !data.success) {
                throw new Error(
                  data.message || "No se pudo actualizar el usuario."
                );
              }
              setUser((prev) => ({
                ...prev,
                user: {
                  ...prev.user,
                  username: data.data.username,
                },
              }));
              setUsername(data.data.username);

              Alert.alert(
                "¡Listo!",
                "Tu nombre de usuario se actualizó correctamente."
              );
              router.back()
            } catch (e) {
              Alert.alert(
                "Error",
                e.message || "No se pudo actualizar el nombre de usuario."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Datos de la cuenta</Text>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Nombre de usuario</Text>
        <View style={styles.username}>
          <TextInput
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            placeholder="Nombre de usuario"
            placeholderTextColor="#adb5bd"
            autoCapitalize="none"
            maxLength={12}
          />
          <Pressable
            onPress={changeUsername}
            style={({ pressed }) => [
              styles.changeButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.changeButtonText}>Cambiar</Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        onPress={() => router.push("/change-password")}
        style={styles.passwordButton}
      >
        <Text style={styles.passwordButtonText}>Cambiar la contraseña</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  title: {
    fontFamily: "Outfit_400Regular",
    fontSize: 42,
    color: "#1976d2",
    marginBottom: 32,
    marginLeft: 10,
  },
  fieldContainer: {
    marginHorizontal: 12,
  },
  label: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: "#343a40",
    marginBottom: 6,
  },
  username: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "100%",
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 60,
    borderWidth: 2,
    borderColor: "#343434",
    borderRadius: 13,
    paddingHorizontal: 12,
    fontFamily: "Outfit_400Regular",
    fontSize: 21,
    color: "#212529",
  },
  changeButton: {
    width: 112,
    height: 60,
    borderWidth: 2,
    borderColor: "#ff922b",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  changeButtonText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: "#f08c00",
  },
  passwordButton: {
    backgroundColor: "#ced4da",
    borderRadius: 18,
    paddingVertical: 20,
    marginTop: 20,
    marginHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  passwordButtonText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: "#000",
  },
});
