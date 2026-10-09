import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { apiFetch } from "../lib/sesion";

export default function SocialDaily() {
  const params = useLocalSearchParams();
  const [status, setStatus] = useState(params.status || "pending");
  const [reflection, setReflection] = useState(params.reflection || "");
  const [saving, setSaving] = useState(false);

  const completeDaily = async (statusValue = "completed") => {
    try {
      setSaving(true);
      const res = await apiFetch("/social/today/complete", {
        method: "POST",
        body: JSON.stringify({
          status: statusValue,
          reflection: reflection.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setStatus(statusValue);
      Alert.alert(
        "Listo",
        statusValue === "completed" ? "Reto completado" : "Reto saltado"
      );
      router.back();
    } catch (e) {
      Alert.alert("Error", e.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.text, styles.label]}>Reto de hoy</Text>
      <Text style={[styles.text, styles.title]}>{params.title}</Text>
      <Text style={[styles.text, styles.content]}>{params.description}</Text>

      <Text style={[styles.text, styles.label, { marginTop: 18 }]}>
        Reflexión
      </Text>
      <TextInput
        value={reflection}
        onChangeText={setReflection}
        placeholder="¿Qué pasó? ¿Cómo te sentiste?"
        placeholderTextColor="#adb5bd"
        style={styles.input}
        multiline
        textAlignVertical="top"
        editable={status === "pending"}
      />

      {status === "pending" ? (
        <View style={{ gap: 10 }}>
          <Pressable
            onPress={() => completeDaily("completed")}
            disabled={saving}
            style={[styles.button, { opacity: saving ? 0.6 : 1 }]}
          >
            <Text style={[styles.text, styles.buttonText]}>
              {saving ? "Guardando..." : "Completar reto"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => completeDaily("skipped")}
            disabled={saving}
            style={styles.buttonOutline}
          >
            <Text style={[styles.text, { textAlign: "center", fontSize: 16 }]}>
              Saltar por hoy
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text style={[styles.text, { color: "#2f9e44" }]}>
          Estado: {status}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  text: {
    fontFamily: "Outfit_400Regular",
    color: "#1e1e1e",
  },
  label: {
    color: "#868e96",
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    marginBottom: 12,
  },
  content: {
    fontSize: 17,
    lineHeight: 26,
    color: "#343a40",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    marginBottom: 12,
    fontFamily: "Outfit_400Regular",
  },
  button: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    paddingVertical: 14,
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: "#1e1e1e",
    borderRadius: 10,
    paddingVertical: 14,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
});
