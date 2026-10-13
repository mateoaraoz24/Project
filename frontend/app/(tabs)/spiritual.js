import { useState, useCallback } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { apiFetch } from "../../lib/sesion";

export default function Spiritual() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [verse, setVerse] = useState(null);
  const [updating, setUpdating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);

      const prefRes = await apiFetch("/spiritual/verse/preference");
      const prefData = await prefRes.json();
      const wants = prefData?.success
        ? !!prefData.data.wants_daily_verse
        : false;
      setEnabled(wants);

      if (wants) {
        const verseRes = await apiFetch("/spiritual/verse/today");
        const verseData = await verseRes.json();
        if (verseData.success && verseData.data?.verse) {
          setVerse(verseData.data.verse);
        } else {
          setVerse(null);
        }
      } else {
        setVerse(null);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };
  const toggleVerse = async (value) => {
    setUpdating(true);
    setEnabled(value);
    try {
      const res = await apiFetch("/spiritual/verse/preference", {
        method: "PUT",
        body: JSON.stringify({ wants_daily_verse: value }),
      });
      const data = await res.json();

      if (!data.success) {
        setEnabled(!value);
        return;
      }

      if (value) {
        const verseRes = await apiFetch("/spiritual/verse/today");
        const verseData = await verseRes.json();
        if (verseData.success && verseData.data?.verse) {
          setVerse(verseData.data.verse);
        }
      } else {
        setVerse(null);
      }
    } catch (e) {
      console.log(e);
      setEnabled(!value);
    } finally {
      setUpdating(false);
    }
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f9e44" />
        <Text style={[styles.text, { marginTop: 12, color: "#868e96" }]}>
          Cargando...
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: 55 }]}>Espiritual</Text>
      <View style={styles.prefRow}>
        <Text style={[styles.text, { fontSize: 16, flex: 1 }]}>
          Versículo del día
        </Text>
        <Switch
          value={enabled}
          onValueChange={toggleVerse}
          disabled={updating}
          trackColor={{ false: "#ced4da", true: "#b2f2bb" }}
          thumbColor={enabled ? "#2f9e44" : "#f8f9fa"}
        />
      </View>
      {enabled && verse && (
        <View style={styles.verseCard}>
          <Text style={[styles.text, { fontSize: 13, color: "#868e96" }]}>
            Versículo del día
          </Text>
          <Text
            style={[
              styles.text,
              { fontSize: 16, marginTop: 8, lineHeight: 24 },
            ]}
          >
            "{verse.text}"
          </Text>
          <Text
            style={[
              styles.text,
              { fontSize: 14, color: "#9c36b5", marginTop: 10 },
            ]}
          >
            {verse.reference}
          </Text>
        </View>
      )}

      {enabled && !verse && (
        <Text style={[styles.text, { color: "#868e96", marginBottom: 10 }]}>
          No hay versículo disponible todavía.
        </Text>
      )}
      <Pressable
        style={[styles.button, { borderColor: "#2f9e44" }]}
        onPress={() => router.push("/meditations")}
      >
        <Text
          style={[
            styles.text,
            { fontSize: 20, textAlign: "center", color: "#2f9e44" },
          ]}
        >
          Ir a meditaciones
        </Text>
      </Pressable>
      <Pressable
        style={[styles.button, { borderColor: "#2f9e44" }]}
        onPress={() => router.push("/journal")}
      >
        <Text
          style={[
            styles.text,
            { fontSize: 20, textAlign: "center", color: "#2f9e44" },
          ]}
        >
          Ir al diario
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 15,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 6,
  },
  verseCard: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 15,
    borderWidth: 2,
    borderRadius: 8,
  },
});
