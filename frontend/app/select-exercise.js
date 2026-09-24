import { View, Text, TextInput, FlatList, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config/api";
import { useRoutineStore } from "../store/routineStore";

export default function SelectExercise() {
  const [exercises, setExercises] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const addExercises = useRoutineStore((state) => state.addExercises);

  useEffect(() => {
    const getExercises = async () => {
      const token = await SecureStore.getItemAsync("access_token");
      const response = await fetch(`${API_URL}/train/exercises`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setExercises(data.data);
    };
    getExercises();
  }, []);

  const filtered = (exercises || []).filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const chosen = (exercises || []).filter((e) => selectedIds.has(e.id));
    addExercises(chosen);
    router.back();
  };

  return (
    <View>
      <TextInput value={search} onChangeText={setSearch} placeholder="Buscar ejercicio" />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggleSelect(item.id)}>
            <Text>{selectedIds.has(item.id) ? "✅ " : ""}{item.name}</Text>
            <Text>{item.muscle_group} · {item.equipment}</Text>
          </Pressable>
        )}
      />

      <Pressable onPress={handleConfirm}>
        <Text>Agregar {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}</Text>
      </Pressable>
    </View>
  );
}