import { useState, useEffect } from "react";
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
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { transcribeAudio } from "../lib/gemini";
import { apiFetch } from "../lib/sesion";

export default function Journal() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState("text");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (status.granted) {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo iniciar la grabación");
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      setRecording(false);
      setTranscribing(true);

      const uri = recorder.uri;
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
        }),
      });
      const data = await response.json();

      if (!data.success) {
        Alert.alert("Error", data.message || "No se pudo guardar");
        return;
      }

      router.back();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo guardar la entrada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text style={[styles.text, { fontSize: 32, fontWeight: "700" }]}>
        Diario
      </Text>
      <Text style={[styles.text, { color: "#868e96", marginBottom: 16 }]}>
        Escribí o grabá tu entrada
      </Text>

      <TextInput
        value={text}
        onChangeText={(value) => {
          setText(value);
          if (source === "voice") setSource("text");
        }}
        placeholder="¿Qué estás pensando hoy?"
        placeholderTextColor="#adb5bd"
        multiline
        style={styles.input}
        textAlignVertical="top"
      />

      <Pressable
        onPress={recording ? stopRecording : startRecording}
        disabled={transcribing || saving}
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
        disabled={saving || !text.trim()}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  text: {
    fontFamily: "Outfit_400Regular",
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