import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect, useGlobalSearchParams, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config/api";
import { useTrainStore } from "../store/trainStore";

export default function RoutineDetail() {
  const params = useGlobalSearchParams();
  const [routine, setRoutine] = useState(null);
  const [exercises, setExercises] = useState([]);
  const startSession = useTrainStore((state) => state.startSession);
  const activeSession = useTrainStore((state) => state.activeSession);
  const loadRoutine = useCallback(async () => {
    const token = await SecureStore.getItemAsync("access_token");
    const response = await fetch(
      `${API_URL}/train/routines/${params.routineId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    if (data.success) {
      setRoutine(data.data.routine);
      setExercises(data.data.exercises);
    }
  }, [params.routineId]);

  useFocusEffect(
    useCallback(() => {
      loadRoutine();
    }, [loadRoutine])
  );

  const handleDelete = () => {
    Alert.alert("¿Eliminar rutina?", "Esta acción no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const token = await SecureStore.getItemAsync("access_token");
          const response = await fetch(
            `${API_URL}/train/routines/${params.routineId}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await response.json();
          if (data.success) {
            router.replace("/train");
          }
        },
      },
    ]);
  };

  const handleStart = () => {
    if (activeSession && activeSession.routineId !== routine.id) {
      Alert.alert(
        "Ya tenés un entrenamiento en curso",
        `Estás entrenando "${activeSession.name}". Si empezás uno nuevo, vas a perder ese progreso.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Empezar de todos modos",
            style: "destructive",
            onPress: () => {
              startSession(routine.id, routine.name, exercises);
              router.push("/active-workout");
            },
          },
        ]
      );
      return;
    }

    if (activeSession && activeSession.routineId === routine.id) {
      router.push("/active-workout");
      return;
    }

    startSession(routine.id, routine.name, exercises);
    router.push("/active-workout");
  };

  if (!routine)
    return (
      <View>
        <Text>Cargando...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: 48 }]}>{routine.name}</Text>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <View>
            <Text style={[styles.text, { fontSize: 24 }]}>{item.name}</Text>
            <Text style={[styles.text, { fontSize: 18, color:"#e8590c" }]}>
              {item.target_sets} series
            </Text>
            <Text style={[styles.text, { fontSize: 16, color: "#1971c2" }]}>
              {item.rest_seconds}s
            </Text>
          </View>
        )}
      />

      <View style={styles.containerButtons}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/create-routine",
              params: { routineId: routine.id },
            })
          }
          style={[styles.button, { borderColor: "#1971c2" }]}
        >
          <Text style={[styles.buttonText, { color: "#1971c2" }]}>Editar</Text>
        </Pressable>
        <Pressable
          onPress={handleDelete}
          style={[styles.button, { borderColor: "#e03131" }]}
        >
          <Text style={[styles.buttonText, { color: "#e03131" }]}>
            Eliminar
          </Text>
        </Pressable>
        <Pressable
          onPress={handleStart}
          style={[styles.button, { borderColor: "#2f9e44" }]}
        >
          <Text style={[styles.buttonText, { color: "#2f9e44" }]}>Iniciar</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 15,
    paddingHorizontal: 15,
    paddingVertical: 25,
  },
  containerButtons: {
    display: "flex",
    flexDirection: "row",
    gap: 5,
  },
  button: {
    paddingVertical: 15,
    borderWidth: 2,
    borderRadius: 8,
    flex: 1,
  },
  buttonText: {
    textAlign: "center",
    textTransform: "uppercase",
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
});
