import { useEffect, useState } from "react";
import { router } from "expo-router";
import { apiFetch } from "../lib/sesion";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { useRoutineStore } from "../store/routineStore";

export default function SelectExercise() {
  const [exercises, setExercises] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const addExercises = useRoutineStore((state) => state.addExercises);

  useEffect(() => {
    const getExercises = async () => {
      try {
        const response = await apiFetch("/train/exercises", {
          method: "GET",
        });

        const data = await response.json();

        if (data.success) {
          setExercises(data.data);
        }
      } catch (error) {
        console.error("Error cargando ejercicios:", error);
      }
    };

    getExercises();
  }, []);

  const filtered = (exercises || []).filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const handleConfirm = () => {
    const chosen = (exercises || []).filter((e) =>
      selectedIds.has(e.id)
    );

    addExercises(chosen);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar ejercicios</Text>

      <Text style={styles.subtitle}>
        Seleccioná los ejercicios para tu rutina.
      </Text>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar ejercicio"
        placeholderTextColor="#999"
        clearButtonMode="while-editing"
      />

      <FlatList
        style={styles.list}
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {exercises === null
              ? "Cargando ejercicios..."
              : "No se encontraron ejercicios"}
          </Text>
        }
        renderItem={({ item }) => {
          const selected = selectedIds.has(item.id);

          return (
            <Pressable
              onPress={() => toggleSelect(item.id)}
              style={[
                styles.exerciseItem,
                selected && styles.exerciseSelected,
              ]}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>
                  {item.name}
                </Text>

                <Text style={styles.exerciseDetails}>
                  {item.muscle_group} · {item.equipment}
                </Text>
              </View>

              <View
                style={[
                  styles.checkbox,
                  selected && styles.checkboxSelected,
                ]}
              >
                {selected && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      {selectedIds.size > 0 && (
        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
        >
          <Text style={styles.addButtonText}>
            Agregar ({selectedIds.size})
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 20,
  },

  title: {
    fontFamily: "Outfit_700Bold",
    fontSize: 27,
    color: "#111",
  },

  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: "#777",
    marginTop: 4,
    marginBottom: 20,
  },

  searchInput: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: "#111",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 15,
  },

  list: {
    flex: 1,
  },

  listContent: {
    gap: 8,
    paddingBottom: 10,
  },

  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  exerciseSelected: {
    borderColor: "#2f9e44",
    backgroundColor: "#f3fcf4",
  },

  exerciseInfo: {
    flex: 1,
    marginRight: 12,
  },

  exerciseName: {
    fontFamily: "Outfit_500Medium",
    fontSize: 17,
    color: "#111",
  },

  exerciseDetails: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: "#888",
    marginTop: 3,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor: "#2f9e44",
    borderColor: "#2f9e44",
  },

  checkmark: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Outfit_700Bold",
  },

  emptyText: {
    fontFamily: "Outfit_400Regular",
    color: "#888",
    textAlign: "center",
    marginTop: 25,
  },

  addButton: {
    backgroundColor: "#b2f2bb",
    borderWidth: 1,
    borderColor: "#2f9e44",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  addButtonPressed: {
    backgroundColor: "#8ce99a",
  },

  addButtonText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 17,
    color: "#173b20",
  },
});