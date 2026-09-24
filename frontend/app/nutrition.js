import {
  Pressable,
  Text,
  View,
  Alert,
  StyleSheet,
  FlatList,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { useUser } from "../context/userProvider";
import { useFoodStore } from "../store/foodStore";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { analyzeFood } from "../lib/gemini";
import { API_URL } from "../config/api";
import CircularProgress from "react-native-circular-progress-indicator";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
export default function Nutrition() {
  const [dayInfo, setDayInfo] = useState(null);
  const [dayFoods, setDayFoods] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const { user } = useUser();
  const setFoods = useFoodStore((state) => state.setFoods);
  const resetFoods = useFoodStore((state) => state.resetFoods);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [loadingDay, setLoadingDay] = useState(false);
  const [daysCache, setDaysCache] = useState({});
  const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const addDays = (date, amount) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + amount);
    return copy;
  };
  const isToday = (date) => toDateKey(date) === toDateKey(new Date());
  const formatDisplayDate = (date) => {
    if (isToday(date)) return "Hoy";
    const yesterday = addDays(new Date(), -1);
    if (toDateKey(date) === toDateKey(yesterday)) return "Ayer";
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };
  const onEditMeal = async (mealId) => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const response = await fetch(`${API_URL}/nutrition/meal/${mealId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.message);
        return;
      }

      setFoods(data.data.ingredients);

      router.push({
        pathname: "/edit-food",
        params: {
          mealId: data.data.meal.id,
          mealName: data.data.meal.meal_name,
          mealType: data.data.meal.meal_type,
          imageUri: data.data.meal.image_url,
        },
      });
    } catch (e) {
      setError(e.message);
    }
  };
  const processImg = async (pickerResult) => {
    if (
      pickerResult.canceled ||
      !pickerResult.assets[0].base64 ||
      loading ||
      loadingDay
    )
      return;
    setLoading(true);
    setShowOptions(false);
    try {
      const originalUri = pickerResult.assets[0].uri;
      const fileName = originalUri.split("/").pop();
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: originalUri, to: newPath });
      const uri = newPath;
      setImageUri(uri);
      setLoading(true);
      const analysis = await analyzeFood(pickerResult.assets[0].base64);
      if (!analysis) {
        setLoading(false);
        setError("Error", "No se pudo analizar la imagen");
        return;
      }
      const response = await fetch(`${API_URL}/nutrition/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysis),
      });
      const data = await response.json();
      setLoading(false);
      if (!data.success) {
        setError("Error", data.message);
        return;
      }
      setFoods(data.data.items);
      router.push({
        pathname: "/edit-food",
        params: {
          imageUri: uri,
          mealName: data.data.meal_name,
          date: toDateKey(selectedDay),
        },
      });
    } catch (e) {
      setError(e.message);
    }
  };
  const screenPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      setError("Necesitamos acceso a la cámara para analizar tu comida");
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    processImg(pickerResult);
  };
  const galeryPhoto = async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    processImg(pickerResult);
  };
  const clearSession = async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user_id");
  };
  useEffect(() => {
    const dateKey = toDateKey(selectedDay);
    let isCancelled = false;
    if (daysCache[dateKey]) {
      setDayInfo(daysCache[dateKey].dayInfo);
      setDayFoods(daysCache[dateKey].dayFoods);
      setLoadingDay(false);
      return;
    }
    const getDayInfo = async () => {
      setLoadingDay(true);
      try {
        const accessToken = await SecureStore.getItemAsync("access_token");
        const dateKey = toDateKey(selectedDay);
        const response = await fetch(
          `${API_URL}/nutrition/day?date=${dateKey}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (isCancelled) return;
        if (response.status === 401) {
          await clearSession();
          router.replace("/login");
          return;
        }
        const data = await response.json();
        if (data.success && data.data.daily) {
          const info = data.data.daily;
          const meals = data.data.meals || null;
          setDayInfo(info);
          setDayFoods(meals);
          setDaysCache((prev) => {
            const newCache = {
              ...prev,
              [dateKey]: { dayInfo: info, dayFoods: meals },
            };
            const keys = Object.keys(newCache);
            if (keys.length > 7) {
              const oldestKey = keys[0];
              delete newCache[oldestKey];
            }
            return newCache;
          });
        } else {
          setDayInfo({
            target_kcal: user?.nutrition?.target_kcal ?? 2000,
            target_carbs: user?.nutrition?.carbs ?? 150,
            target_protein: user?.nutrition?.protein ?? 130,
            target_fat: user?.nutrition?.fat ?? 60,
            kcal_consumed: 0,
            carbs_consumed: 0,
            protein_consumed: 0,
            fat_consumed: 0,
          });
          setDayFoods(null);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingDay(false);
      }
    };
    getDayInfo();
    return () => {
      isCancelled = true;
    };
  }, [selectedDay]);
  const currentKcal = dayInfo?.kcal_consumed || 0;
  const maxKcal = dayInfo?.target_kcal;
  return (
    <View style={styles.container}>
      <View style={styles.containerDate}>
        <Pressable
          onPress={() => setSelectedDay(addDays(selectedDay, -1))}
          hitSlop={10}
          disabled={loading}
        >
          <MaterialIcons name="chevron-left" size={28} color="#1e1e1e" />
        </Pressable>
        <Text style={styles.text}>{formatDisplayDate(selectedDay)}</Text>
        <Pressable
          onPress={() => setSelectedDay(addDays(selectedDay, 1))}
          disabled={isToday(selectedDay) || loading}
          hitSlop={10}
        >
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={isToday(selectedDay) ? "#ced4da" : "#1e1e1e"}
          />
        </Pressable>
      </View>
      <View style={styles.containerMacros}>
        <CircularProgress
          value={(currentKcal / maxKcal) * 100}
          maxValue={100}
          radius={110}
          activeStrokeColor="#000"
          inActiveStrokeColor="#ced4da"
          activeStrokeWidth={15}
          inActiveStrokeWidth={10}
          showProgressValue={false}
          title={`${Math.max(0, (maxKcal || 0) - (currentKcal || 0))} kcal`}
          titleColor="#1e1e1e"
          subtitle="Restantes"
          subtitleColor="#1e1e1e"
          duration={800}
          rotation={0}
        />
        <View style={styles.macros}>
          <View style={styles.macro}>
            <Text style={[styles.text, { fontSize: 20 }]}>
              {Math.round(dayInfo?.carbs_consumed ?? 0)}g
            </Text>
            <Text style={[styles.text, { color: "#9c36b5" }]}>Carbos</Text>
          </View>
          <View style={styles.macro}>
            <Text style={[styles.text, { fontSize: 20 }]}>
              {Math.round(dayInfo?.protein_consumed ?? 0)}g
            </Text>
            <Text style={[styles.text, { color: "#2f9e44" }]}>Proteina</Text>
          </View>
          <View style={styles.macro}>
            <Text style={[styles.text, { fontSize: 20 }]}>
              {Math.round(dayInfo?.fat_consumed ?? 0)}g
            </Text>
            <Text style={[styles.text, { color: "#f08c00" }]}>Grasas</Text>
          </View>
        </View>
      </View>
      <View style={{ height: 280 }}>
        {loadingDay ? (
          <Text
            style={[
              styles.text,
              {
                color: "#868e96",
                fontSize: 18,
                textAlign: "center",
                marginTop: 40,
              },
            ]}
          >
            Cargando día...
          </Text>
        ) : dayFoods === null ? (
          <Text style={[styles.text, { color: "#868e96", fontSize: 20 }]}>
            Come algo, los músculos no crecen por magia
          </Text>
        ) : (
          <FlatList
            data={dayFoods}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <Pressable
                style={styles.foodContainer}
                onPress={() => onEditMeal(item.id)}
              >
                {item.image_url && (
                  <Image
                    source={{ uri: item.image_url }}
                    resizeMode="cover"
                    style={styles.image}
                  />
                )}
                <View style={styles.infoContainer}>
                  <Text style={[styles.text, { fontSize: 25 }]}>
                    {item.meal_type}
                  </Text>
                  <Text style={[styles.text, { color: "#1971c2" }]}>
                    {item.total_calories}kcal
                  </Text>
                  <View style={styles.foodMacrosContainer}>
                    <Text style={[styles.text, { color: "#2f9e44" }]}>
                      {item.total_protein}g
                    </Text>
                    <Text style={[styles.text, { color: "#e03131" }]}>
                      {item.total_carbs}g
                    </Text>
                    <Text style={[styles.text, { color: "#f08c00" }]}>
                      {item.total_fat}g
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
      {error && (
        <Text style={{ color: "#e03131", textAlign: "center" }}>{error}</Text>
      )}
      <View>
        {showOptions && (
          <View style={styles.optionsContainer}>
            <Pressable style={styles.option} onPress={() => screenPhoto()}>
              <Text style={styles.optionText}>Cámara</Text>
            </Pressable>
            <Pressable style={styles.option} onPress={() => galeryPhoto()}>
              <Text style={styles.optionText}>Galeria</Text>
            </Pressable>
            <Pressable
              style={styles.option}
              onPress={() => {
                setShowOptions(false);
                resetFoods();
                router.push({
                  pathname: "/edit-food",
                  params: { date: toDateKey(selectedDay) },
                });
              }}
            >
              <Text style={styles.optionText}>Manualmente</Text>
            </Pressable>
          </View>
        )}
        <Pressable
          onPress={() => setShowOptions((prevValue) => !prevValue)}
          style={[styles.button, showOptions && styles.buttonActive]}
        >
          <Text style={styles.buttonText}>
            {showOptions ? "Cancelar" : "Añadir"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 15,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 15,
  },
  text: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
  },
  macros: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  macro: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  infoContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  foodMacrosContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  containerMacros: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  button: {
    width: "100%",
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: "#1971c2",
  },
  buttonActive: {
    backgroundColor: "#1D83E2",
    borderWidth: 1,
    borderColor: "#dee2e6",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 25,
    textTransform: "uppercase",
    textAlign: "center",
    color: "#fff",
  },
  optionsContainer: {
    position: "absolute",
    bottom: 65,
    left: 0,
    right: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  optionText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 18,
    color: "#495057",
  },
  option: {
    paddingVertical: 14,
    alignItems: "center",
    borderBottomColor: "#f1f3f5",
    borderBottomWidth: 1,
  },
  image: {
    width: 100,
    height: "100%",
    borderRadius: 12,
  },
  foodContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderWidth: 2,
    gap: 15,
    borderColor: "#000",
    borderRadius: 8,
    padding: 8,
    height: 100,
  },
  containerDate: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  },
});
