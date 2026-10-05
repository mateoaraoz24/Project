import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
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
      setElapsed(
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      );
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
    ? `${hours}h ${pad(minutes)}min ${pad(seconds)}seg`
    : `${pad(minutes)}min ${pad(seconds)}seg`;
};

export default function ActiveWorkout() {
  const activeSession = useTrainStore((state) => state.activeSession);
  const updateSetField = useTrainStore((state) => state.updateSetField);
  const addRow = useTrainStore((state) => state.addRow);
  const removeRow = useTrainStore((state) => state.removeRow);
  const clearSession = useTrainStore((state) => state.clearSession);
  const toggleRowConfirmed = useTrainStore((state) => state.toggleRowConfirmed);

  const [saving, setSaving] = useState(false);

  const [restRemaining, setRestRemaining] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const restIntervalRef = useRef(null);

  const navigation = useNavigation();
  const savedRef = useRef(false);

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

  useEffect(() => {
    if (!restRunning) return;
    restIntervalRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          setRestRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(restIntervalRef.current);
  }, [restRunning]);

  if (!activeSession) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No hay ningún entrenamiento activo</Text>
      </View>
    );
  }

  const startRestTimer = (seconds) => {
    setRestRemaining(seconds);
    setRestRunning(true);
  };

  const adjustRest = (delta) => {
    setRestRemaining((prev) => Math.max(0, prev + delta));
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
            sets: ex.rows
              .filter((row) => row.confirmed)
              .map((row, i) => ({
                set_number: i + 1,
                set_type: "normal",
                weight: parseFloat(row.weight),
                reps: parseInt(row.reps, 10),
              }))
              .filter((s) => s.weight > 0 && s.reps > 0),
          })),
        }),
      });

      const data = await response.json();
      console.log(data);
      if (!data.success) {
        Alert.alert("Error", data.message);
        return;
      }
      clearSession();
      savedRef.current = true;
      router.replace("/train");
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el entrenamiento");
    } finally {
      setSaving(false);
    }
  };

  const formatRest = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.text, { fontSize: 32 }]}>
            {activeSession.name}
          </Text>
          <Text style={[styles.text, { fontSize: 14, color: "#868e96" }]}>
            {formatElapsed(elapsedSeconds)}
          </Text>
        </View>
        <Pressable onPress={handleFinish} style={styles.finishButton}>
          <Text style={{ color: "#1971c2", fontFamily: "Outfit_400Regular" }}>
            {saving ? "..." : "Terminar"}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={activeSession.exercises}
        keyExtractor={(item, index) => `${item.exercise_id}-${index}`}
        contentContainerStyle={{ gap: 25, paddingBottom: 100 }}
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={styles.exerciseBlock}>
            <Text style={[styles.text, { fontSize: 30 }]}>{item.name}</Text>
            <Text style={styles.rest}>Descanso: {item.rest_seconds}seg</Text>

            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Serie</Text>
              <Text style={styles.headerCell}>Kg</Text>
              <Text style={styles.headerCell}>Reps</Text>
              <Text style={styles.headerCell}>check</Text>
            </View>

            {item.rows.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={[
                  styles.row,
                  row.confirmed ? { backgroundColor: "#b2f2bb" } : null,
                ]}
              >
                <Text style={[styles.cell, { width: 40 }]}>{rowIndex + 1}</Text>
                <TextInput
                  keyboardType="numeric"
                  placeholder="--"
                  value={row.weight}
                  onChangeText={(v) =>
                    updateSetField(index, rowIndex, "weight", v)
                  }
                  style={styles.input}
                />
                <TextInput
                  keyboardType="numeric"
                  placeholder="--"
                  value={row.reps}
                  onChangeText={(v) =>
                    updateSetField(index, rowIndex, "reps", v)
                  }
                  style={styles.input}
                />
                <Pressable
                  onPress={() => {
                    if (!row.confirmed && (!row.weight || !row.reps)) return;
                    toggleRowConfirmed(index, rowIndex);
                    if (!row.confirmed) {
                      startRestTimer(item.rest_seconds || 90);
                    }
                  }}
                >
                  <Text
                    style={{
                      color: row.confirmed ? "#2f9e44" : "#868e96",
                      fontSize: 16,
                    }}
                  >
                    ✓
                  </Text>
                </Pressable>
                <Pressable onPress={() => removeRow(index, rowIndex)}>
                  <Text style={{ color: "#e03131", fontSize: 16 }}>✕</Text>
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={() => addRow(index)}
              style={styles.addSetButton}
            >
              <Text style={{ color: "#2f9e44" }}>Añadir serie</Text>
            </Pressable>
          </View>
        )}
      />

      {restRunning && (
        <View style={styles.restBar}>
          <Pressable onPress={() => adjustRest(-10)}>
            <Text style={styles.restAdjust}>-10</Text>
          </Pressable>
          <Text style={[styles.text, { fontSize: 20 }]}>
            {formatRest(restRemaining)}
          </Text>
          <Pressable onPress={() => adjustRest(10)}>
            <Text style={styles.restAdjust}>+10</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  finishButton: {
    borderWidth: 2,
    borderColor: "#1971c2",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  exerciseBlock: { gap: 6 },
  rest: {
    fontFamily: "Outfit_400Regular",
    color: "#1971c2",
    fontSize: 13,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerCell: {
    fontFamily: "Outfit_400Regular",
    color: "#868e96",
    fontSize: 13,
    width: 60,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  cell: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
  },
  input: {
    width: 60,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    padding: 5,
    textAlign: "center",
    fontFamily: "Outfit_400Regular",
  },
  addSetButton: {
    borderWidth: 2,
    borderColor: "#2f9e44",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  restBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: "#e9ecef",
    borderRadius: 10,
  },
  restAdjust: {
    fontFamily: "Outfit_400Regular",
    color: "#1971c2",
    fontSize: 16,
  },
});
