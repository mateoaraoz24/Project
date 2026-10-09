import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { apiFetch } from "../lib/sesion";
import { generateSocialProfile, generateMonthlyChallenge } from "../lib/gemini";

export default function SocialMonthly() {
  const params = useLocalSearchParams();
  const [status, setStatus] = useState(params.status || "active");
  const [saving, setSaving] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [reflection, setReflection] = useState("");

  const completeMonthly = async () => {
    try {
      setSaving(true);
      const res = await apiFetch("/social/monthly", {
        method: "PUT",
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setStatus("completed");
      setShowUpdate(true); // pedir update de perfil
    } catch (e) {
      Alert.alert("Error", e.message || "No se pudo completar");
    } finally {
      setSaving(false);
    }
  };

  const submitUpdate = async () => {
    if (reflection.trim().length < 10) {
      Alert.alert("Espera", "Cuéntame un poco cómo te fue");
      return;
    }
    try {
      setSaving(true);

      const generated = await generateSocialProfile(
        `Reflexión del ciclo mensual: ${reflection.trim()}`
      );
      if (!generated?.summary || !generated?.focus_areas) {
        throw new Error("No se pudo actualizar el perfil");
      }

      const pRes = await apiFetch("/social/profile", {
        method: "PUT",
        body: JSON.stringify({
          reflection_text: reflection.trim(),
          summary: generated.summary,
          focus_areas: generated.focus_areas,
        }),
      });
      const pData = await pRes.json();
      if (!pData.success) throw new Error(pData.message);

      const monthlyGen = await generateMonthlyChallenge(pData.data);
      if (!monthlyGen) throw new Error("No se pudo crear el nuevo mensual");

      const mRes = await apiFetch("/social/monthly", {
        method: "POST",
        body: JSON.stringify(monthlyGen),
      });
      const mData = await mRes.json();
      if (!mData.success) throw new Error(mData.message);

      Alert.alert("Listo", "Perfil actualizado y nuevo reto creado");
      router.replace("/social");
    } catch (e) {
      Alert.alert("Error", e.message || "Falló la actualización");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.text, styles.label]}>Reto de 30 días</Text>
      <Text
        style={[
          styles.text,
          styles.title,
          status === "completed" && { textDecorationLine: "line-through" },
        ]}
      >
        {params.title}
      </Text>
      <Text style={[styles.text, styles.content]}>{params.description}</Text>

      {params.end_date ? (
        <Text style={[styles.text, { color: "#868e96", marginTop: 10 }]}>
          Hasta: {String(params.end_date).slice(0, 10)}
        </Text>
      ) : null}

      {status === "active" ? (
        <Pressable
          onPress={completeMonthly}
          disabled={saving}
          style={[styles.button, { marginTop: 20, opacity: saving ? 0.6 : 1 }]}
        >
          <Text style={[styles.text, styles.buttonText]}>
            {saving ? "Guardando..." : "Marcar como completado"}
          </Text>
        </Pressable>
      ) : (
        <Text style={[styles.text, { marginTop: 20, color: "#2f9e44" }]}>
          Completado
        </Text>
      )}

      <Modal visible={showUpdate} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={[styles.text, { fontSize: 20, marginBottom: 8 }]}>
              ¿Cómo te fue en este ciclo?
            </Text>
            <TextInput
              value={reflection}
              onChangeText={setReflection}
              placeholder="Tu reflexión..."
              placeholderTextColor="#adb5bd"
              style={styles.input}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              onPress={submitUpdate}
              disabled={saving}
              style={[styles.button, { opacity: saving ? 0.6 : 1 }]}
            >
              <Text style={[styles.text, styles.buttonText]}>
                {saving ? "Actualizando..." : "Actualizar perfil y seguir"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: "#fff", 
    padding: 16 },
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
  button: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    paddingVertical: 14,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
    marginBottom: 12,
    fontFamily: "Outfit_400Regular",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 30,
  },
});
