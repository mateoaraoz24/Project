import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { apiFetch } from "../lib/sesion";
import { FontAwesome6 } from "@expo/vector-icons";

export default function SeeSocial() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const res = await apiFetch("/social/status");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Error al cargar el perfil");
        }
        setProfile(data.data.profile);
      } catch (e) {
        console.error("Error al obtener el perfil social:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1971c2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          No se pudo cargar tu perfil social.
        </Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Aún no tienes un perfil social</Text>
        <Text style={styles.message}>
          Completa tu perfil para descubrir tus áreas de crecimiento.
        </Text>
      </View>
    );
  }

  const focusAreas = Array.isArray(profile.focus_areas)
    ? profile.focus_areas
    : [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi perfil social</Text>
        <Text style={styles.subtitle}>
          Conócete, crece y conecta mejor.
        </Text>
      </View>
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sobre mí</Text>
        </View>

        <Text style={styles.summary}>
          {profile.summary || "Todavía no hay un resumen disponible."}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Áreas de enfoque</Text>
        </View>

        {focusAreas.length > 0 ? (
          <View style={styles.tags}>
            {focusAreas.map((area, index) => (
              <View key={`${area}-${index}`} style={styles.tag}>
                <FontAwesome6
                  name="arrow-trend-up"
                  size={12}
                  color="#1971c2"
                />
                <Text style={styles.tagText}>{String(area)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.message}>
            No hay áreas de enfoque registradas todavía.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
    gap: 18,
  },
  center: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    gap: 12,
  },
  header: {
    alignItems: "center",
    paddingVertical: 14,
    gap: 7,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#d3f9d8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  title: {
    fontFamily: "Outfit_400Regular",
    fontSize: 27,
    color: "#212529",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: "#868e96",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 19,
    color: "#212529",
  },
  summary: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    lineHeight: 25,
    color: "#495057",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width:"100%",
    backgroundColor: "#e7f5ff",
    borderWidth: 1,
    borderColor: "#1971c2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tagText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: "#000",
    flexShrink: 1,
  },
  emptyTitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 20,
    color: "#212529",
    textAlign: "center",
  },
  message: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: "#868e96",
    textAlign: "center",
  },
});
