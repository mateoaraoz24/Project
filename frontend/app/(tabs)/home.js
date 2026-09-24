import { Pressable, Text, View, StyleSheet, FlatList, Alert } from "react-native";
import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { router, Link } from "expo-router";
import { GoToProfile } from "../../components/GoToProfile";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { API_URL } from "../../config/api";
import { useUser } from "../../context/userProvider";

export default function Home() {
  const { loadUser } = useUser();
  const [weekDays, setWeekDays] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [habitsStuck, setHabitsStuck] = useState([]);
  const verifySession = async () => {
    const token = await SecureStore.getItemAsync("access_token");
    if (!token) {
      await clearSession();
      router.replace("/login");
      return;
    }
    const result = await loadUser();
    console.log(result)
    if (!result.success) {
      if (result.status === 401) {
        await clearSession();
        router.replace("/login");
        return;
      }
      Alert.alert("Error", result.message);
      return;
    }
  };
  const logout = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
      const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await clearSession();
        router.replace("/login");
      } else {
        alert("Inténtalo nuevamente");
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor");
    } finally {
      await clearSession();
      router.replace("/login");
    }
  };
  const clearSession = async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user_id");
  };
  const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMonday);

    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date);
    }
    const labels = days.map((date) => ({
      letter: date
        .toLocaleDateString("es-ES", { weekday: "short" })
        .charAt(0)
        .toUpperCase(),
      number: date.getDate(),
    }));
    setWeekDays(labels);
  };
  const toggleHabit = (habit) => {
    console.log("pressed", habit);
    if (habitsStuck.includes(habit)) {
      setHabitsStuck(habitsStuck.filter((d) => d !== habit));
    } else {
      setHabitsStuck([...habitsStuck, habit]);
    }
  };
  const getHabits = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync("access_token");
      const response = await fetch(`${API_URL}/habits`, {
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
      setLoading(false);
      if (data.success) {
        setHabits(data.data);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.log("No se pudo conectar con el servidor");
      setLoading(false);
    }
  };
  const progress =
    habits.length === 0 ? 0 : (habitsStuck.length / habits.length) * 100;
  const today = new Date().getDate();
  useEffect(() => {
    const init = async () => {
      await verifySession();
      getWeekDays();
    };
    init();
  }, []);
  useFocusEffect(
    useCallback(() => {
      getHabits();
    }, [])
  );
  return (
    <View style={styles.container}>
      <GoToProfile />
      <View style={styles.habitContainer}>
        {loading ? (
          <View>
            <Text style={styles.empty}>Cargango habitos ...</Text>
          </View>
        ) : (
          <>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 100,
              }}
            >
              {habits.length > 0 && (
                <>
                  <Text
                    style={{
                      color: "#9c36b5",
                      fontSize: 18,
                      fontFamily: "Outfit_400Regular",
                    }}
                  >
                    Misión del día
                  </Text>
                  <Link href="/add-habit" style={styles.addHabits}>
                    + añadir hábito
                  </Link>
                </>
              )}
            </View>
            <View style={styles.habits}>
              <FlatList
                data={habits}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={true}
                numColumns={2}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.empty}>
                      Aún no tienes hábitos, inicia con el primero
                    </Text>
                    <Link href="/add-habit" style={styles.addHabits}>
                      + añadir hábito
                    </Link>
                  </View>
                }
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.habit}
                    onPress={() => toggleHabit(item.id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        !habitsStuck.includes(item.id) &&
                          styles.habitUnselected,
                      ]}
                    >
                      {habitsStuck.includes(item.id) && (
                        <FontAwesome6 name="check" size={25} color="#2f9e44" />
                      )}
                    </View>

                    <Text
                      style={{
                        width: 100,
                        fontSize: 18,
                        fontFamily: "Outfit_400Regular",
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
            {habits.length > 0 && (
              <Text
                style={{
                  textAlign: "center",
                  color:
                    progress >= 80
                      ? "#2f9e44"
                      : progress >= 50
                      ? "#f08c00"
                      : "#e03131",
                  fontSize: 18,
                }}
              >
                {habitsStuck.length}/{habits.length} hábitos completados
              </Text>
            )}
          </>
        )}
      </View>
      <View style={styles.week}>
        <View style={styles.days}>
          {weekDays.map((day, index) => (
            <View
              key={`letter-${index}`}
              style={[
                styles.textDayContainer,
                day.number === today && styles.todayContainer,
              ]}
            >
              <Text
                style={[
                  styles.textDay,
                  styles.letter,
                  day.number === today && styles.today,
                ]}
              >
                {day.letter}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.days}>
          {weekDays.map((day) => (
            <Text style={[styles.textDay, styles.numberDays]} key={day.number}>
              {day.number}
            </Text>
          ))}
        </View>
        <Text style={{ fontFamily: "Outfit_400Regular", color: "#15aabf" }}>
          Continúa construyendo tu disciplina
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 20,
    marginTop: 50,
  },
  checkbox: {
    width: 30,
    height: 30,
  },
  habitUnselected: {
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#000",
  },
  week: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  days: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
  },
  textDay: {
    width: 40,
    textAlign: "center",
    fontFamily: "Outfit_400Regular",
  },
  letter: {
    color: "#1971c2",
    fontSize: 16,
  },
  numberDays: {
    borderColor: "#000",
    borderWidth: 1,
    padding: 7,
    borderRadius: 8,
  },
  habits: {
    width: "100%",
    paddingVertical: 15,
    height: 150,
  },
  habit: {
    width: "50%",
    display: "flex",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  habitContainer: {
    display: "flex",
    flexDirection: "column",
    padding: 10,
  },
  today: {
    color: "#6741d9",
  },
  textDayContainer: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  todayContainer: {
    borderWidth: 1,
    borderColor: "#6741d9",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  addHabits: {
    color: "#099268",
    fontSize: 20,
    fontFamily: "Outfit_400Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: 5,
  },
  empty: {
    fontSize: 18,
    fontFamily: "Outfit_400Regular",
    color: "#868e96",
    textAlign: "center",
  },
});
