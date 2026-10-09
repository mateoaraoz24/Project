import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { apiFetch } from "../../lib/sesion";
import {
  generateSocialProfile,
  generateMonthlyChallenge,
  generateDailyChallenge,
} from "../../lib/gemini";

export default function Social() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardingText, setOnboardingText] = useState("");
  const [profile, setProfile] = useState(null);
  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);

  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const [cycleReflection, setCycleReflection] = useState("");

  useEffect(() => {
    boot();
  }, []);

  const shortText = (text, max = 90) => {
    if (!text) return "";
    return text.length > max ? text.slice(0, max).trim() + "..." : text;
  };

  const boot = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/social/today");
      const data = await response.json();
  
      if (!data.success) {
        Alert.alert("Error", data.message || "No se pudo cargar Social");
        return;
      }
  
      if (data.data.needs_onboarding) {
        setNeedsOnboarding(true);
        return;
      }
  
      setNeedsOnboarding(false);
      setProfile(data.data.profile);
  
      let currentMonthly = data.data.monthly;
      let currentDaily = data.data.daily;
  
      if (data.data.needs_monthly) {
        const alreadyHadOne = Boolean(currentMonthly);

        if (!alreadyHadOne) {
          const generated = await generateMonthlyChallenge(data.data.profile);
          if (!generated) throw new Error("No se pudo crear el reto mensual");
  
          const mRes = await apiFetch("/social/monthly", {
            method: "POST",
            body: JSON.stringify(generated),
          });
          const mData = await mRes.json();
          if (!mData.success) throw new Error(mData.message);
          currentMonthly = mData.data;
          setShowProfileUpdate(false);
        } else {
          setMonthly(null);
          setShowProfileUpdate(true);
          currentMonthly = null;
        }
      }
  
      if (data.data.needs_daily) {
        const generated = await generateDailyChallenge(
          data.data.profile,
          currentMonthly
        );
        if (generated) {
          const dRes = await apiFetch("/social/daily", {
            method: "POST",
            body: JSON.stringify(generated),
          });
          const dData = await dRes.json();
          if (dData.success) currentDaily = dData.data;
        }
      }
  
      setMonthly(currentMonthly);
      setDaily(currentDaily);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", e.message || "Falló la carga de Social");
    } finally {
      setLoading(false);
    }
  };

  const submitOnboarding = async () => {
    if (onboardingText.trim().length < 20) {
      Alert.alert("Espera", "Cuéntame un poco más de tu situación social");
      return;
    }
    try {
      setSaving(true);
      const generated = await generateSocialProfile(onboardingText.trim());
      if (!generated?.summary || !generated?.focus_areas) {
        throw new Error("Gemini no devolvió un perfil válido");
      }

      const res = await apiFetch("/social/onboarding", {
        method: "POST",
        body: JSON.stringify({
          onboarding_text: onboardingText.trim(),
          summary: generated.summary,
          focus_areas: generated.focus_areas,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await boot();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", e.message || "No se pudo crear el perfil");
    } finally {
      setSaving(false);
    }
  };

  const submitCycleUpdate = async () => {
    if (cycleReflection.trim().length < 10) {
      Alert.alert("Espera", "Cuéntame un poco cómo te fue en este ciclo");
      return;
    }

    try {
      setSaving(true);

      const generated = await generateSocialProfile(
        `Perfil anterior: ${profile?.summary || ""}\nÁreas: ${(
          profile?.focus_areas || []
        ).join(", ")}\nReflexión del ciclo: ${cycleReflection.trim()}`
      );

      if (!generated?.summary || !generated?.focus_areas) {
        throw new Error("No se pudo actualizar el perfil");
      }

      const pRes = await apiFetch("/social/profile", {
        method: "PUT",
        body: JSON.stringify({
          reflection_text: cycleReflection.trim(),
          summary: generated.summary,
          focus_areas: generated.focus_areas,
        }),
      });
      const pData = await pRes.json();
      if (!pData.success) throw new Error(pData.message);
      setProfile(pData.data);

      const monthlyGen = await generateMonthlyChallenge(pData.data);
      if (!monthlyGen) throw new Error("No se pudo crear el nuevo reto mensual");

      const mRes = await apiFetch("/social/monthly", {
        method: "POST",
        body: JSON.stringify(monthlyGen),
      });
      const mData = await mRes.json();
      if (!mData.success) throw new Error(mData.message);

      setMonthly(mData.data);
      setShowProfileUpdate(false);
      setCycleReflection("");
      Alert.alert("Listo", "Nuevo reto de 30 días listo");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", e.message || "No se pudo cerrar el ciclo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1c7ed6" />
        <Text style={[styles.text, { marginTop: 10, color: "#868e96" }]}>
          Cargando Social...
        </Text>
      </View>
    );
  }

  if (needsOnboarding) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.text, styles.title]}>Social</Text>
        <Text style={[styles.text, { color: "#868e96", marginBottom: 12 }]}>
          Cuéntanos cómo te sientes socialmente y qué te gustaría mejorar.
        </Text>
        <TextInput
          value={onboardingText}
          onChangeText={setOnboardingText}
          placeholder="Escribe con confianza..."
          placeholderTextColor="#adb5bd"
          multiline
          style={styles.input}
          textAlignVertical="top"
        />
        <Pressable
          onPress={submitOnboarding}
          disabled={saving}
          style={[styles.button, { opacity: saving ? 0.6 : 1 }]}
        >
          <Text style={[styles.text, styles.buttonText]}>
            {saving ? "Creando perfil..." : "Crear mi perfil social"}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.text, styles.title]}>Social</Text>
      <Pressable
        style={styles.card}
        onPress={() => {
          if (!monthly) {
            setShowProfileUpdate(true);
            return;
          }
          router.push({
            pathname: "/social-monthly",
            params: {
              id: String(monthly.id),
              title: monthly.title,
              description: monthly.description,
              status: monthly.status,
              end_date: monthly.end_date || "",
            },
          });
        }}
      >
        <Text style={[styles.text, styles.cardLabel]}>Reto de 30 días</Text>
        <Text style={[styles.text, { fontSize: 18, marginBottom: 4 }]}>
          {monthly ? monthly.title : "Ciclo terminado"}
        </Text>
        <Text style={[styles.text, { color: "#495057" }]}>
          {monthly
            ? shortText(monthly.description, 90)
            : "Actualiza tu perfil para continuar"}
        </Text>
      </Pressable>
      {daily && (
        <Pressable
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: "/social-daily",
              params: {
                title: daily.title,
                description: daily.description,
                status: daily.status,
                reflection: daily.reflection || "",
              },
            })
          }
        >
          <Text style={[styles.text, styles.cardLabel]}>Reto de hoy</Text>
          <Text style={[styles.text, { fontSize: 18, marginBottom: 4 }]}>
            {daily.title}
          </Text>
          <Text style={[styles.text, { color: "#495057" }]}>
            {shortText(daily.description, 90)}
          </Text>
        </Pressable>
      )}
      {daily?.mini_lesson_title && (
        <Pressable
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: "/social-lesson",
              params: {
                title: daily.mini_lesson_title,
                content: daily.mini_lesson_content,
              },
            })
          }
        >
          <Text style={[styles.text, styles.cardLabel]}>Mini-lección de hoy</Text>
          <Text style={[styles.text, { fontSize: 18 }]}>
            {daily.mini_lesson_title}
          </Text>
        </Pressable>
      )}

      <Modal visible={showProfileUpdate} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={[styles.text, { fontSize: 20, marginBottom: 8 }]}>
              Cierre del ciclo
            </Text>
            <Text style={[styles.text, { color: "#868e96", marginBottom: 10 }]}>
              ¿Cómo ves tu mejora social en estas semanas?
            </Text>
            <TextInput
              value={cycleReflection}
              onChangeText={setCycleReflection}
              placeholder="Cuéntame cómo te fue..."
              placeholderTextColor="#adb5bd"
              style={[styles.input, { minHeight: 110 }]}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              onPress={submitCycleUpdate}
              disabled={saving}
              style={[styles.button, { opacity: saving ? 0.6 : 1 }]}
            >
              <Text style={[styles.text, styles.buttonText]}>
                {saving ? "Actualizando..." : "Actualizar y continuar"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  text: {
    fontFamily: "Outfit_400Regular",
    color: "#1e1e1e",
  },
  title: {
    fontSize: 40,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
  },
  cardLabel: {
    fontSize: 13,
    color: "#868e96",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 12,
    minHeight: 140,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "Outfit_400Regular",
    marginBottom: 12,
    backgroundColor: "#fff",
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