import {
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  FlatList,
} from "react-native";
import { useState, useEffect } from "react";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { API_URL } from "../config/api";

export default function AddHabit() {
  const [frequency, setFrequency] = useState("daily");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [error, setError] = useState("");
  const [errorComponent, setErrorComponent] = useState(null);
  const days = [
    { name: "Lunes", value: 0 },
    { name: "Martes", value: 1 },
    { name: "Miercoles", value: 2 },
    { name: "Jueves", value: 3 },
    { name: "Viernes", value: 4 },
    { name: "Sabado", value: 5 },
    { name: "Domingo", value: 6 },
  ];
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  const onSubmit = async () => {
    if (loading) return;
    const clearname = name.trim();
    if (clearname.length > 30 || clearname.length < 4) {
      setError("tu habito debe tener entre 4 y 30 caracteres");
      setErrorComponent("name");
      return;
    }
    if (selectedDays.length === 0 && frequency === "weekly") {
      setError("Debes seleccionar aunque sea un día");
      setErrorComponent("days");
      return;
    }
    setLoading(true);
    setError("");
    setErrorComponent(null);
    try {
      const accessToken = await SecureStore.getItemAsync("access_token");
      const response = await fetch(`${API_URL}/habit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: clearname,
          frequency,
          days: selectedDays,
        }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      if (data.success) {
        router.back()
      } else {
        setError(data.message);
      }
    } catch (e) {
      setLoading(false);
      setError("No se pudo conectar con el servidor");
    }
  };
  const clearSession = async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user_id");
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Añadir hábito</Text>
      <View style={styles.containerField}>
        <Text
          style={[
            styles.label,
            errorComponent === "name" && { color: "#ff0000" },
          ]}
        >
          Nombre
        </Text>
        <TextInput
          placeholder="ex: leer"
          keyboardType="default"
          style={[
            styles.input,
            errorComponent === "name" && { borderColor: "#ff0000" },
          ]}
          value={name}
          onChangeText={setName}
          maxLength={30}
        />
        {errorComponent === "name" && <Text style={styles.error}>{error}</Text>}
      </View>
      <View style={styles.containerField}>
        <Text
          style={[
            styles.label,
            errorComponent === "days" && { color: "#ff0000" },
          ]}
        >
          Frecuencia
        </Text>
        <View style={styles.frequencyButtons}>
          <Pressable
            onPress={() => {
              setFrequency("daily"), setSelectedDays([]);
            }}
            style={[styles.frequency, frequency === "daily" && styles.selected]}
          >
            <Text style={styles.frequencyText}>Diario</Text>
          </Pressable>
          <Pressable
            onPress={() => setFrequency("weekly")}
            style={[
              styles.frequency,
              frequency === "weekly" && styles.selected,
            ]}
          >
            <Text style={styles.frequencyText}>Semanal</Text>
          </Pressable>
        </View>
        {frequency === "weekly" && (
          <View style={styles.days}>
            <FlatList
              data={days}
              keyExtractor={(item) => item.value.toString()}
              numColumns={2}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.day}
                  onPress={() => toggleDay(item.value)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      !selectedDays.includes(item.value) &&
                        styles.checkboxUnselected,
                    ]}
                  >
                    {selectedDays.includes(item.value) && (
                      <FontAwesome6 name="check" size={25} color="#2f9e44" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.textDay,
                      selectedDays.includes(item.value) && { color: "#1971c2" },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}
        {errorComponent === "days" && <Text style={styles.error}>{error}</Text>}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && { backgroundColor: "#38d9a9", borderColor: "#38d9a9" },
        ]}
        onPress={onSubmit}
      >
        <Text style={styles.buttonText}>{loading ? "Añadiendo" : "Añadir"}</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 25,
    flex: 1,
    padding: 15,
  },
  title: {
    color: "#1971c2",
    fontFamily: "Outfit_400Regular",
    fontSize: 42,
    textTransform: "uppercase",
  
  },
  label: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
  },
  containerField: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 15,
  },
  frequencyButtons: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  frequencyText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    textAlign: "center",
  },
  frequency: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: "#f08c00",
    borderRadius: 8,
  },
  selected: {
    backgroundColor: "#ffec99",
  },
  checkbox: {
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxUnselected: { borderRadius: 3, borderWidth: 1, borderColor: "#000" },
  days: {
    width: "100%",
  },
  day: {
    display: "flex",
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
    width: "50%",
    marginBottom: 8,
  },
  textDay: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    width: 100,
  },
  button: {
    borderWidth: 1,
    borderColor: "#099268",
    borderRadius: 10,
    backgroundColor: "#96f2d7",
    padding: 20,
    width: "100%",
  },
  buttonText: {
    fontFamily: "Outfit_400Regular",
    textTransform: "uppercase",
    fontSize: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#000",
    fontFamily: "Outfit_400Regular",
    paddingVertical: 20,
    paddingHorizontal: 20,
    fontSize: 18,
  },
  error: {
    color: "#ff0000",
    padding: 5,
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
});
