import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { apiFetch } from "../lib/sesion";
import { generateDailyAdvice } from "../lib/gemini";

export default function DailyAdvice() {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdvice();
  }, []);

  const loadAdvice = async () => {
    try {
      const res = await apiFetch("/mental/daily-advice");
      const data = await res.json();

      if (data.success && data.data.advice) {
        setAdvice(data.data.advice);
        return;
      }

      const newAdvice = await generateDailyAdvice();
      if (!newAdvice) {
        setAdvice("No se pudo generar el consejo de hoy.");
        return;
      }

      setAdvice(newAdvice);

      await apiFetch("/mental/daily-advice", {
        method: "POST",
        body: JSON.stringify({ advice: newAdvice }),
      });
    } catch (e) {
      console.log(e);
      setAdvice("Error al cargar el consejo.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={[styles.text, { marginTop: 12 }]}>
          Preparando tu consejo...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={[styles.text, {fontSize: 25, marginBottom: 15}]}>Consejo del día</Text>

      <View style={styles.card}>
        <Text style={[styles.text, styles.advice]}>{advice}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
  card: {
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    padding: 18,
  },
  advice: {
    fontSize: 18,
    lineHeight: 28,
    color: "#1e1e1e",
  },
});