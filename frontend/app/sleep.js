import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config/api";

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function Sleep() {
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const response = await fetch(`${API_URL}/sleep/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: toDateKey(new Date()),
          bedtime,
          wake_time: wakeTime,
          quality,
          notes: notes || null,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.message);
        return;
      }
      router.replace("/physical");
    } catch (e) {
      setError("Error al guardar el sueño");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>¿A qué hora te dormiste?</Text>
      <TextInput
        value={bedtime}
        onChangeText={setBedtime}
        placeholder="23:00"
        style={styles.input}
      />

      <Text style={styles.label}>¿A qué hora te levantaste?</Text>
      <TextInput
        value={wakeTime}
        onChangeText={setWakeTime}
        placeholder="07:00"
        style={styles.input}
      />

      <Text style={styles.label}>¿Cómo calificas tu sueño?</Text>
      <View style={styles.qualityRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setQuality(n)}
            style={[styles.qualityButton, quality === n && styles.qualitySelected]}
          >
            <Text style={quality === n ? styles.qualityTextSelected : styles.qualityText}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Notas (opcional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Me desperté varias veces..."
        style={[styles.input, { height: 80 }]}
        multiline
      />

      {error ? <Text style={{ color: "#e03131" }}>{error}</Text> : null}

      <Pressable onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>{saving ? "Guardando..." : "Guardar"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 10 },
  label: { fontFamily: "Outfit_400Regular", fontSize: 16, marginTop: 10 },
  input: {
    borderWidth: 2, borderColor: "#ced4da", borderRadius: 8,
    padding: 12, fontFamily: "Outfit_400Regular", fontSize: 16,
  },
  qualityRow: { flexDirection: "row", gap: 10 },
  qualityButton: {
    width: 44, height: 44, borderWidth: 2, borderColor: "#ced4da",
    borderRadius: 22, justifyContent: "center", alignItems: "center",
  },
  qualitySelected: { borderColor: "#1971c2", backgroundColor: "#1971c2" },
  qualityText: { fontFamily: "Outfit_400Regular" },
  qualityTextSelected: { fontFamily: "Outfit_400Regular", color: "#fff" },
  saveButton: {
    backgroundColor: "#1971c2", borderRadius: 12, paddingVertical: 16,
    alignItems: "center", marginTop: 20,
  },
  saveButtonText: { color: "#fff", fontFamily: "Outfit_400Regular", fontSize: 18 },
});