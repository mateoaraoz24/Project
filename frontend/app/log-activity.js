import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
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
    <View>
      <Text>{params.activityName}</Text>

      <View>
        <TextInput
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="numeric"
          placeholder="Duración en minutos"
        />
      </View>

      <Text>{estimatedKcal} kcal estimadas</Text>

      {error ? <Text>{error}</Text> : null}

      <Pressable onPress={handleSave}>
        <Text>{saving ? "Guardando..." : "Guardar"}</Text>
      </Pressable>
    </View>
  );
}