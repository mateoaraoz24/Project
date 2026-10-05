import { useEffect, useState } from "react";
import { router } from "expo-router";
import { apiFetch } from "../lib/sesion"
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";

export default function AddPhysicalActivity() {
  const [activities, setActivities] = useState(null);
  const [searcher, setSearcher] = useState("");

  useEffect(() => {
    const getActivities = async () => {
      const response = await apiFetch("/train/physical-activities", {
        method: "GET",
      });
      const data = await response.json();
      if (data.success) {
        setActivities(data.data);
      }
    };
    getActivities();
  }, []);

  const filteredActivities = (activities || []).filter((activity) =>
    activity.name.toLowerCase().includes(searcher.toLowerCase().trim())
  );

  const onSelectActivity = (activity) => {
    router.push({
      pathname: "/log-activity",
      params: {
        activityId: activity.id,
        activityName: activity.name,
        kcalPerHour: activity.kcal_per_hour,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searcher, styles.text, { fontSize: 18 }]}
          value={searcher}
          onChangeText={setSearcher}
          placeholder="Buscar actividad"
        />
        <Pressable style={styles.searchButton}>
          <Text style={[styles.text, { fontSize: 18 }]}>Buscar</Text>
        </Pressable>
      </View>
      <FlatList
        data={filteredActivities}
        contentContainerStyle={{ gap: 5 }}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          activities === null ? (
            <Text>Cargando...</Text>
          ) : (
            <Text>No se encontraron actividades</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelectActivity(item)}>
            <Text style={[styles.text, { fontSize: 18 }]}>{item.name}</Text>
            <Text style={[styles.text, { fontSize: 15 }]}>
              {item.kcal_per_hour} kcal/h
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 15,
    paddingVertical: 25,
    paddingHorizontal: 10,
  },
  searchContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  searcher: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
  },
  searchButton: {
    paddingHorizontal: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f08c00",
    borderRadius: 5,
    backgroundColor: "#ffec99",
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
});
