import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { router, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config/api";
import { useTrainStore } from "../store/trainStore";

const useElapsedTime = (startedAt) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    const updateElapsed = () => {
      const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      setElapsed(seconds);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
};

const formatElapsed = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

export default function ActiveWorkout() {
  const activeSession = useTrainStore((state) => state.activeSession);
  const addSet = useTrainStore((state) => state.addSet);
  const removeSet = useTrainStore((state) => state.removeSet);
  const clearSession = useTrainStore((state) => state.clearSession);

  const [weightInput, setWeightInput] = useState({});
  const [repsInput, setRepsInput] = useState({});
  const [saving, setSaving] = useState(false);

  const navigation = useNavigation();
  const savedRef = useRef(false);

  // 👇 acá SÍ se usa como hook, llamándolo con el valor real
  const elapsedSeconds = useElapsedTime(activeSession?.startedAt);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (savedRef.current) return;
      if (!activeSession) return;

      e.preventDefault();
      Alert.alert(
        "¿Salir del entrenamiento?",
        "Tu progreso se guarda automáticamente y podés retomarlo cuando quieras. ¿Salir de todos modos?",
        [
          { text: "Seguir entrenando", style: "cancel" },
          { text: "Salir", onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, activeSession]);

  if (!activeSession) {
    return (
      <View>
        <Text>No hay ningún entrenamiento activo</Text>
      </View>
    );
  }

  const handleAddSet = (exerciseIndex) => {
    const weight = parseFloat(weightInput[exerciseIndex]) || 0;
    const reps = parseInt(repsInput[exerciseIndex], 10) || 0;
    if (weight <= 0 || reps <= 0) return;
    addSet(exerciseIndex, weight, reps);
    setWeightInput((prev) => ({ ...prev, [exerciseIndex]: "" }));
    setRepsInput((prev) => ({ ...prev, [exerciseIndex]: "" }));
  };

  const handleFinish = () => {
    Alert.alert("¿Finalizar entrenamiento?", "", [
      { text: "Cancelar", style: "cancel" },
      { text: "Finalizar", onPress: saveSession },
    ]);
  };

  const saveSession = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const now = new Date();

      const response = await fetch(`${API_URL}/train/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          routine_id: activeSession.routineId,
          name: activeSession.name,
          started_at: activeSession.startedAt,
          finished_at: now.toISOString(),
          duration_seconds: Math.round(
            (now.getTime() - new Date(activeSession.startedAt).getTime()) / 1000
          ),
          exercises: activeSession.exercises.map((ex, index) => ({
            exercise_id: ex.exercise_id,
            order_index: index,
            sets: ex.sets,
          })),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        Alert.alert("Error", data.message);
        return;
      }
      clearSession();
      router.replace("/train");
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el entrenamiento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Text>{activeSession.name}</Text>
      <Text style={{ fontSize: 24, fontFamily: "Outfit_400Regular" }}>
        {formatElapsed(elapsedSeconds)}
      </Text>

      <FlatList
        data={activeSession.exercises}
        keyExtractor={(item, index) => `${item.exercise_id}-${index}`}
        renderItem={({ item, index }) => (
          <View>
            <Text>{item.name}</Text>

            {item.sets.map((s, setIndex) => (
              <View key={setIndex} style={{ flexDirection: "row" }}>
                <Text>Serie {s.set_number}: {s.weight}kg x {s.reps}</Text>
                <Pressable onPress={() => removeSet(index, setIndex)}>
                  <Text>Eliminar</Text>
                </Pressable>
              </View>
            ))}

            <View style={{ flexDirection: "row" }}>
              <TextInput
                placeholder="kg"
                keyboardType="numeric"
                value={weightInput[index] || ""}
                onChangeText={(v) => setWeightInput((prev) => ({ ...prev, [index]: v }))}
              />
              <TextInput
                placeholder="reps"
                keyboardType="numeric"
                value={repsInput[index] || ""}
                onChangeText={(v) => setRepsInput((prev) => ({ ...prev, [index]: v }))}
              />
              <Pressable onPress={() => handleAddSet(index)}>
                <Text>+ Serie</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable onPress={handleFinish}>
        <Text>{saving ? "Guardando..." : "Finalizar entrenamiento"}</Text>
      </Pressable>
    </View>
  );
}