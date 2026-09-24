import { FlatList, Pressable, Text, View, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { API_URL } from "../config/api";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export default function Train() {
  const [routines, setRoutines] = useState(null);
  const [activityLogs, setActivityLogs] = useState(null);

  const clearSession = async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user_id");
  };

  const getRoutines = useCallback(async (accessToken) => {
    try {
      const response = await fetch(`${API_URL}/train/routines`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 401) {
        await clearSession();
        router.replace("/login");
        return;
      }
      const data = await response.json();
      if (data.success) {
        setRoutines(data.data);
      }
    } catch (e) {
      console.log(e.message);
    }
  }, []);

  const getActivityLogs = useCallback(async (accessToken) => {
    try {
      const response = await fetch(
        `${API_URL}/train/physical-activities/today`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.status === 401) {
        await clearSession();
        router.replace("/login");
        return;
      }
      const data = await response.json();
      if (data.success) {
        setActivityLogs(data.data);
      }
    } catch (e) {
      console.log(e.message);
    }
  }, []);

  const loadAll = useCallback(async () => {
    const accessToken = await SecureStore.getItemAsync("access_token");
    await Promise.all([getRoutines(accessToken), getActivityLogs(accessToken)]);
  }, [getRoutines, getActivityLogs]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  return (
    <View style={{ flex: 1, padding: 15 }}>
      <Text style={[styles.text, { fontSize: 48 }]}>Entrenamiento</Text>
      <View style={styles.container}>
        <View style={styles.block}>
          {activityLogs === null || activityLogs.length === 0 ? (
            <Text
              style={[
                styles.text,
                { color: "#868e96", textAlign: "center", fontSize: 21 },
              ]}
            >
              Sin actividad hoy
            </Text>
          ) : (
            <FlatList
              data={activityLogs}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View>
                  <Text>{item.activity_name}</Text>
                  <Text>
                    {item.duration_minutes} min · {item.kcal_burned} kcal
                  </Text>
                </View>
              )}
            />
          )}
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={() => router.push("/add-physical-activity")}
              style={[styles.button, { width: 270, borderColor: "#f08c00" }]}
            >
              <Text
                style={[
                  styles.text,
                  { fontSize: 23, textAlign: "center", color: "#f08c00" },
                ]}
              >
                Añadir actividad física
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.block}>
          <Text style={[styles.text, { fontSize: 27 }]}>Mis rutinas</Text>
          {routines === null || routines.length === 0 ? (
            <Text
              style={[
                styles.text,
                { color: "#868e96", textAlign: "center", fontSize: 20 },
              ]}
            >
              Sin rutinas aún
            </Text>
          ) : (
            <FlatList
              data={routines}
              numColumns={2}
              keyExtractor={(item) => item.id.toString()}
              columnWrapperStyle={{ gap: 10 }}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/routine-detail",
                      params: { routineId: item.id },
                    })
                  }
                  style={[styles.button, {borderColor:"#099268", flex:1}]}
                >
                  <Text
                    style={[
                      styles.text,
                      { fontSize: 25, textAlign: "center", color: "#099268" },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          )}
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={() => router.push("create-routine")}
              style={[styles.button, { width: 210, borderColor: "#9c36b5" }]}
            >
              <Text
                style={[
                  styles.text,
                  { fontSize: 25, textAlign: "center", color: "#9c36b5" },
                ]}
              >
                Añadir rutina
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 45,
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
  button: {
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 8,
  },
  block: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 20,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
});
