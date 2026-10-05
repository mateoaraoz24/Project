import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useGlobalSearchParams, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config/api";

export default function LogActivity() {
  const params = useGlobalSearchParams();
  const [durationMinutes, setDurationMinutes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const numericalDuration = parseInt(durationMinutes, 10) || 0;
  const kcalPerHour = parseFloat(params.kcalPerHour) || 0;
  const estimatedKcal = Math.round(kcalPerHour * (numericalDuration / 60));

  const handleSave = async () => {
    if (saving) return;
    if (numericalDuration <= 0) {
      setError("Ingresá una duración válida");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const response = await fetch(`${API_URL}/train/physical-activities/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activity_id: parseInt(params.activityId, 10),
          duration_minutes: numericalDuration,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.message);
        return;
      }
      router.replace("/train");
    } catch (e) {
      setError("Error al guardar la actividad");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: 40 }]}>{params.activityName}</Text>
      <View style={styles.subContainer}>
        <View style={styles.input}>
          <TextInput
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            keyboardType="numeric"
            placeholder="min"
            style={[styles.text, { fontSize: 18, textAlign:"center" }]}
          />
        </View>
        <Text style={[styles.text, { fontSize: 20 ,width: 100 }]}>
          {estimatedKcal} kcal estimadas
        </Text>
      </View>
      {error ? (
        <Text style={[styles.text, { fontSize: 18, color: "#ff0000" }]}>
          {error}
        </Text>
      ) : null}
      <Pressable
        onPress={handleSave}
        style={[styles.button, { borderColor: "#1971c2" }]}
      >
        <Text
          style={[
            styles.text,
            { fontSize: 25, textAlign: "center", color: "#1971c2" },
          ]}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent:"center",
    paddingHorizontal: 10,
    gap: 20,
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
  button: {
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 8,
  },
  input: {
    borderColor: "#000",
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 8,
    width: 150,
  },
  subContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  },
});
