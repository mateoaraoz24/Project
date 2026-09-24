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
import { router, useNavigation, useGlobalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config/api";
import { useRoutineStore } from "../store/routineStore";

export default function CreateRoutine() {
  const params = useGlobalSearchParams();
  const isEditing = !!params.routineId;

  const routineName = useRoutineStore((state) => state.routineName);
  const setRoutineName = useRoutineStore((state) => state.setRoutineName);
  const exercises = useRoutineStore((state) => state.exercises);
  const setFullRoutine = useRoutineStore((state) => state.setFullRoutine);
  const updateTargetSets = useRoutineStore((state) => state.updateTargetSets);
  const removeExercise = useRoutineStore((state) => state.removeExercise);
  const updateRestSeconds = useRoutineStore((state) => state.updateRestSeconds);
  const resetRoutine = useRoutineStore((state) => state.resetRoutine);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(!isEditing); // si es creación, ya "cargó" de entrada
  const navigation = useNavigation();
  const savedRef = useRef(false);

  // si es edición, resetea y trae los datos de la rutina real
  useEffect(() => {
    const loadForEdit = async () => {
      if (!isEditing) {
        resetRoutine(); // modo creación: siempre arranca limpio
        return;
      }
      const token = await SecureStore.getItemAsync("access_token");
      const response = await fetch(
        `${API_URL}/train/routines/${params.routineId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setFullRoutine(data.data.routine.name, data.data.exercises);
      }
      setLoaded(true);
    };
    loadForEdit();
  }, [isEditing, params.routineId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (savedRef.current) return;
      if (!routineName.trim() && exercises.length === 0) return;

      e.preventDefault();
      Alert.alert(
        "¿Descartar cambios?",
        "Si salís ahora vas a perder los cambios de esta rutina.",
        [
          { text: "Seguir editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => {
              resetRoutine();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, routineName, exercises]);

  const handleSave = async () => {
    if (saving) return;
    if (!routineName.trim()) {
      setError("Ponele un nombre a la rutina");
      return;
    }
    if (exercises.length === 0) {
      setError("Agregá al menos un ejercicio");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const url = isEditing
        ? `${API_URL}/train/routines/${params.routineId}`
        : `${API_URL}/train/routines`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: routineName,
          exercises: exercises.map((e) => ({
            exercise_id: e.exercise_id,
            target_sets: e.target_sets,
            rest_seconds: e.rest_seconds,
            notes: e.notes,
          })),
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.message);
        return;
      }
      resetRoutine();
      savedRef.current = true;
      router.replace("/train");
    } catch (e) {
      setError("Error al guardar la rutina");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded)
    return (
      <View>
        <Text>Cargando...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleSave}
          style={[styles.button, { borderColor: "#2f9e44", width: "45%" }]}
        >
          <Text
            style={[
              styles.text,
              { textAlign: "center", fontSize: 16, color: "#2f9e44" },
            ]}
          >
            {saving
              ? "Guardando..."
              : isEditing
              ? "Guardar cambios"
              : "Guardar rutina"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, { borderColor: "#e03131", width: "45%" }]}
        >
          <Text
            style={[
              styles.text,
              { textAlign: "center", fontSize: 16, color: "#e03131" },
            ]}
          >
            Cancelar
          </Text>
        </Pressable>
      </View>
      <TextInput
        value={routineName}
        onChangeText={setRoutineName}
        placeholder="Nombre de la rutina"
        style={styles.searcher}
      />

      <FlatList
        data={exercises}
        keyExtractor={(item, index) => `${item.exercise_id}-${index}`}
        contentContainerStyle={{ gap: 30 }}
        renderItem={({ item, index }) => (
          <View style={styles.exercise}>
            <Text style={[styles.text, { fontSize: 21 }]}>{item.name}</Text>
            <View style={styles.containerExercise}>
              <View style={styles.exerciseDetails}>
                <Text style={[styles.text, { fontSize: 18 }]}>
                  {item.muscle_group}
                </Text>
                <View style={styles.containerSets}>
                  <Text>Series: </Text>
                  <TextInput
                    value={String(item.target_sets)}
                    onChangeText={(v) =>
                      updateTargetSets(index, parseInt(v, 10) || 0)
                    }
                    keyboardType="numeric"
                    style={[
                      styles.text,
                      {
                        fontSize: 15,
                        padding: 0,
                        margin: 0,
                        minHeight: 0,
                        height: 20,
                      },
                    ]}
                  />
                </View>
                <View style={styles.containerSets}>
                  <Text style={styles.text}>Descanso (seg): </Text>
                  <TextInput
                    value={String(item.rest_seconds ?? 90)}
                    onChangeText={(v) =>
                      updateRestSeconds(index, parseInt(v, 10) || 0)
                    }
                    keyboardType="numeric"
                    style={[
                      styles.text,
                      {
                        fontSize: 15,
                        padding: 0,
                        margin: 0,
                        minHeight: 0,
                        height: 20,
                      },
                    ]}
                  />
                </View>
              </View>
              <Pressable
                onPress={() => removeExercise(index)}
                style={[
                  styles.button,
                  { borderColor: "#e03131", height: 50, width: "50%" },
                ]}
              >
                <Text
                  style={[
                    styles.text,
                    { textAlign: "center", fontSize: 16, color: "#e03131" },
                  ]}
                >
                  Eliminar
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={() => router.push("/select-exercise")}
          style={[styles.button, { width: "85%", borderColor: "#1971c2" }]}
        >
          <Text
            style={[
              styles.text,
              { textAlign: "center", fontSize: 18, color: "#1971c2" },
            ]}
          >
            + Ejercicio
          </Text>
        </Pressable>
      </View>

      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    gap: 20,
    paddingVertical: 30,
    paddingHorizontal: 10,
  },
  searcher: {
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 8,
  },
  button: {
    paddingVertical: 15,
    borderWidth: 2,
    borderRadius: 10,
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    gap: 10,
    justifyContent: "center",
  },
  exercise: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  exerciseDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  containerExercise: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  containerSets: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});
