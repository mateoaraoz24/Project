import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import { apiFetch } from "../lib/sesion";
function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  setVisible,
  placeholder,
  saving,
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#adb5bd"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
        />

        <Pressable
          onPress={() => setVisible(!visible)}
          style={styles.eyeButton}
          accessibilityLabel={
            visible ? "Ocultar contraseña" : "Mostrar contraseña"
          }
        >
          <FontAwesome6
            name={visible ? "eye-slash" : "eye"}
            size={17}
            color="#868e96"
          />
        </Pressable>
      </View>
    </View>
  );
}
export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Faltan datos", "Completa todos los campos.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 12) {
      Alert.alert(
        "Contraseña inválida",
        "La contraseña debe tener entre 8 y 12 caracteres."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas nuevas no coinciden.");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        "Aviso",
        "La nueva contraseña debe ser diferente de la actual."
      );
      return;
    }

    try {
      setSaving(true);

      const res = await apiFetch("/profile/password", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudo cambiar la contraseña.");
      }
      Alert.alert("¡Listo!", "Tu contraseña se cambió correctamente.", [
        {
          text: "Aceptar",
          onPress: () => router.back(),
        },
      ]);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      Alert.alert("Error", e.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Cambiar contraseña</Text>
        <Text style={styles.subtitle}>
          Protege tu cuenta con una contraseña segura.
        </Text>

        <PasswordField
          label="Contraseña actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          visible={showCurrent}
          setVisible={setShowCurrent}
          placeholder="Tu contraseña actual"
          saving={saving}
        />

        <PasswordField
          label="Nueva contraseña"
          value={newPassword}
          onChangeText={setNewPassword}
          visible={showNew}
          setVisible={setShowNew}
          placeholder="De 8 a 12 caracteres"
          saving={saving}
        />

        <PasswordField
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          visible={showConfirm}
          setVisible={setShowConfirm}
          placeholder="Repite la nueva contraseña"
          saving={saving}
        />

        <Pressable
          onPress={changePassword}
          disabled={saving}
          style={({ pressed }) => [
            styles.button,
            (pressed || saving) && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {saving ? "Guardando..." : "Guardar contraseña"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          disabled={saving}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 35,
  },
  title: {
    fontFamily: "Outfit_400Regular",
    fontSize: 29,
    color: "#1976d2",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: "#868e96",
    lineHeight: 22,
    marginBottom: 28,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: "#343a40",
    marginBottom: 7,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#343434",
    borderRadius: 13,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: "#212529",
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: "#212529",
    borderRadius: 15,
    minHeight: 58,
    marginTop: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.65,
  },
  buttonText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: "#fff",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 4,
  },
  cancelText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: "#868e96",
  },
});
