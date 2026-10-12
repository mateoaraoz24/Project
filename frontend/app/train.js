import {
  FlatList,
  Pressable,
  Text,
  View,
  StyleSheet,
  Alert,
} from "react-native";
import {  useState } from "react";
import {apiFetch} from '../lib/sesion'
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
export default function Train() {
  const [activityLogs, setActivityLogs] = useState(null);
  const getTodaysTraining = useCallback(async () => {
    try {
      const response = await apiFetch(`/train/today`, {
        method: "GET",
      });
      const data = await response.json();
      if (data.success) {
        setActivityLogs(data.data);
      }
    } catch (e) {
      console.log(e.message);
    }
  }, []);
  const handleDeleteActivity = (logId) => {
    Alert.alert("¿Eliminar actividad?", "", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await apiFetch(
              `/train/physical-activities/log/${logId}`,
              {
                method: "DELETE",
              }
            );
            const data = await response.json();
            if (data.success) {
              setActivityLogs((prev) =>
                prev.filter(
                  (item) => !(item.type === "activity" && item.id === logId)
                )
              );
            }
          } catch (e) {
            console.log(e.message);
          }
        },
      },
    ]);
  };

  const loadAll = useCallback(async () => {
    const accessToken = await SecureStore.getItemAsync("access_token");
    await getTodaysTraining(accessToken);
  }, [getTodaysTraining]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: 48 }]}>Entrenamiento</Text>
      <View style={styles.activity}>
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
              keyExtractor={(item) => `${item.type}-${item.id}`}
              style={{ maxHeight: 150 }}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 10,
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text style={[styles.text, { fontSize: 20 }]}>
                      {item.name}
                    </Text>
                    {item.type === "activity" ? (
                      <Text style={styles.text}>
                        {item.duration_minutes} min - {item.kcal_burned} kcal
                      </Text>
                    ) : (
                      <Text style={styles.text}>
                        {Math.round(item.duration_seconds / 60)} min de
                        entrenamiento
                      </Text>
                    )}
                  </View>
                  {item.type === "activity" && (
                    <Pressable onPress={() => handleDeleteActivity(item.id)}>
                      <Text style={{ color: "#e03131" }}>✕</Text>
                    </Pressable>
                  )}
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
        <Pressable onPress={()=>router.push("/routines")}>
          <Text
            style={[
              styles.text,
              { fontSize: 25, textAlign: "center", color: "#9c36b5" },
            ]}
          >
            Añadir rutina {"->"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 50,
  },
  activity: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 25,
    height: 150,
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
