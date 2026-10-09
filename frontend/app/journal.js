import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { transcribeAudio } from "../lib/gemini";
import { apiFetch } from "../lib/sesion";

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDateLabel = (date) => {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Journal() {
  const recordingRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState("text");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const isToday = toDateKey(selectedDate) === toDateKey(new Date());

  useEffect(() => {
    setupAudio();
  }, []);

  useEffect(() => {
    loadJournal(toDateKey(selectedDate));
  }, [selectedDate]);

  const setupAudio = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.granted) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const loadJournal = async (dateKey) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/spiritual/journal/${dateKey}`);
      const data = await res.json();

      if (data.success && data.data) {
        setText(data.data.text_content || "");
        setSource(data.data.source || "text");
      } else {
        setText("");
        setSource("text");
      }
    } catch (e) {
      console.log(e);
      setText("");
      setSource("text");
    } finally {
      setLoading(false);
    }
  };

  const changeDay = (days) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);

    if (next > today) return;
    setSelectedDate(next);
  };

  const startRecording = async () => {
    try {
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = newRecording;
      setRecording(true);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo iniciar la grabación");
    }
  };

  const stopRecording = async () => {
    try {
      setRecording(false);
      setTranscribing(true);

      const current = recordingRef.current;
      if (!current) {
        Alert.alert("Error", "No hay grabación activa");
        return;
      }

      await current.stopAndUnloadAsync();
      const uri = current.getURI();
      recordingRef.current = null;

      if (!uri) {
        Alert.alert("Error", "No se encontró el audio");
        return;
      }

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const transcript = await transcribeAudio(base64Audio);

      if (transcript) {
        setText((prev) => (prev ? prev + "\n" : "") + transcript);
        setSource("voice");
      } else {
        Alert.alert(
          "No se pudo transcribir",
          "Probá de nuevo o escribí tu entrada."
        );
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Falló la transcripción");
    } finally {
      setTranscribing(false);
    }
  };

  const save = async () => {
    if (saving || !text.trim()) return;
    setSaving(true);
    try {
      const response = await apiFetch("/spiritual/journal", {
        method: "POST",
        body: JSON.stringify({
          text_content: text.trim(),
          source,
          entry_date: toDateKey(selectedDate),
        }),
      });
      const data = await response.json();

      if (!data.success) {
        Alert.alert("Error", data.message || "No se pudo guardar");
        return;
      }

      Alert.alert("Listo", "Diario guardado");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo guardar la entrada");
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    Alert.alert("Eliminar", "¿Borrar esta entrada del diario?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            const dateKey = toDateKey(selectedDate);
            const res = await apiFetch(`/spiritual/journal/${dateKey}`, {
              method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
              setText("");
              setSource("text");
              Alert.alert("Eliminado", "La entrada fue borrada");
            } else {
              Alert.alert("Error", data.message || "No se pudo eliminar");
            }
          } catch (e) {
            console.log(e);
            Alert.alert("Error", "No se pudo eliminar");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9c36b5" />
        <Text style={[styles.text, { marginTop: 12, color: "#868e96" }]}>
          Cargando diario...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text style={[styles.text, { fontSize: 32, fontWeight: "700" }]}>
        Diario
      </Text>
      <View style={styles.dateRow}>
        <Pressable onPress={() => changeDay(-1)} style={styles.arrowBtn}>
          <Text style={[styles.text, styles.arrowText]}>←</Text>
        </Pressable>

        <Text style={[styles.text, styles.dateLabel]}>
          {isToday ? "Hoy" : formatDateLabel(selectedDate)}
        </Text>

        <Pressable
          onPress={() => changeDay(1)}
          style={[styles.arrowBtn, isToday && { opacity: 0.3 }]}
          disabled={isToday}
        >
          <Text style={[styles.text, styles.arrowText]}>→</Text>
        </Pressable>
      </View>

      <Text style={[styles.text, { color: "#868e96", marginBottom: 16 }]}>
        Escribí o grabá tu entrada 
      </Text>

      <TextInput
        value={text}
        onChangeText={(value) => {
          setText(value);
          if (source === "voice") setSource("text");
        }}
        placeholder="¿Qué estás pensando?"
        placeholderTextColor="#adb5bd"
        multiline
        style={styles.input}
        textAlignVertical="top"
      />

      <Pressable
        onPress={recording ? stopRecording : startRecording}
        disabled={transcribing || saving || deleting}
        style={[
          styles.button,
          {
            borderColor: recording ? "#e03131" : "#9c36b5",
            opacity: transcribing ? 0.6 : 1,
          },
        ]}
      >
        {transcribing ? (
          <View style={styles.row}>
            <ActivityIndicator color="#9c36b5" />
            <Text style={[styles.text, styles.buttonText, { color: "#9c36b5" }]}>
              Transcribiendo...
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.text,
              styles.buttonText,
              { color: recording ? "#e03131" : "#9c36b5" },
            ]}
          >
            {recording ? "Detener grabación" : "Grabar audio"}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={save}
        disabled={saving || deleting || !text.trim()}
        style={[
          styles.button,
          {
            borderColor: "#1e1e1e",
            backgroundColor: "#1e1e1e",
            opacity: !text.trim() || saving ? 0.5 : 1,
            marginTop: 10,
          },
        ]}
      >
        <Text style={[styles.text, styles.buttonText, { color: "#fff" }]}>
          {saving ? "Guardando..." : "Guardar"}
        </Text>
      </Pressable>

      <Pressable
        onPress={remove}
        disabled={deleting || saving || !text.trim()}
        style={[
          styles.button,
          {
            borderColor: "#e03131",
            opacity: !text.trim() || deleting ? 0.5 : 1,
            marginTop: 10,
          },
        ]}
      >
        <Text style={[styles.text, styles.buttonText, { color: "#e03131" }]}>
          {deleting ? "Eliminando..." : "Eliminar"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 8,
  },
  arrowBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  arrowText: {
    fontSize: 28,
    color: "#1e1e1e",
  },
  dateLabel: {
    fontSize: 18,
    color: "#495057",
  },
  input: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Outfit_400Regular",
    color: "#1e1e1e",
    marginBottom: 16,
  },
  button: {
    paddingVertical: 15,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});