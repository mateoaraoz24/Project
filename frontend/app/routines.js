import { FlatList, Pressable, Text, View, StyleSheet } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config/api";
import {apiFetch} from '../lib/sesion'

export default function Routines() {
  const [routines, setRoutines] = useState(null);
  const getRoutines = useCallback(async () => {
    try {
      const response = await apiFetch(`/train/routines`, {
        method: "GET",
      });
      const data = await response.json();
      if (data.success) {
        setRoutines(data.data);
      }
    } catch (e) {
      console.log(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      getRoutines();
    }, [getRoutines])
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: 48 }]}>Rutinas</Text>
      {routines === null || routines.length === 0 ? (
        <Text
          style={[
            styles.text,
            { color: "#868e96", textAlign: "center", fontSize: 21 },
          ]}
        >
          Sin rutinas aún
        </Text>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ gap: 12 }}
          style={{ width: "100%", maxHeight: 300 }}
          renderItem={({ item }) => {
            const muscles = item.muscles || "";
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/routine-detail",
                    params: { routineId: item.id },
                  })
                }
                style={styles.card}
              >
                <Text style={[styles.text, { fontSize: 22 }]}>{item.name}</Text>
                {muscles !== "" && (
                  <Text
                    style={[styles.text, { fontSize: 16, color: "#1971c2" }]}
                  >
                    {muscles}
                  </Text>
                )}
              </Pressable>
            );
          }}
        />
      )}
      <Pressable
        onPress={() => router.push("/create-routine")}
        style={[styles.button, { borderColor: "#f08c00" }]}
      >
        <Text
          style={[
            styles.text,
            { fontSize: 23, textAlign: "center", color: "#f08c00" },
          ]}
        >
          Añadir rutina
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 50,
    gap: 20,
    justifyContent: "center",
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
  card: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderColor: "#e64980",
    gap: 4,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderWidth: 2,
    borderRadius: 8,
  },
});
