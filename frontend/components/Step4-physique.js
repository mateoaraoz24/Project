import DropDownPicker from "react-native-dropdown-picker";
import React, { useState } from "react";
import { API_URL } from "../config/api";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {useUser} from '../context/userProvider'
import * as SecureStore from "expo-secure-store";
export const Step4Physique = ({
  styles,
  step,
  weight,
  height,
  goal,
  intensity,
  activityLevel,
  heightValue,
  weightValue,
}) => {
  const [typeTrain, setTypeTrain] = useState("gym");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openTrainDays, setTrainDays] = useState(false);
  const [trainDaysValue, setTrainDaysValue] = useState("4");
  const [trainDaysItems, setTrainDaysItems] = useState([
    { label: "Nunca", value: "0" },
    { label: "1 - 2 días", value: "2" },
    { label: "3 - 4 días", value: "4" },
    { label: "5 - 6 días", value: "6" },
    { label: "Todos los días", value: "7" },
  ]);
  const [openDuration, setOpenDuration] = useState(false);
  const [durationValue, setDurationValue] = useState("120");
  const [durationItems, setDurationItems] = useState([
    { label: "Menos de 30 min", value: "30" },
    { label: "30 - 60 min", value: "60" },
    { label: "60 - 90 min", value: "90" },
    { label: "90 - 120 min", value: "120" },
    { label: "Más de 2 horas", value: "150" },
  ]);
  const {loadUser}=useUser()
  const onSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const accessToken = await SecureStore.getItemAsync("access_token");
      const response = await fetch(`${API_URL}/users/physique`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          height,
          height_unit: heightValue,
          weight,
          weight_unit: weightValue,
          goal,
          goal_intensity: intensity,
          activity_level: activityLevel,
          training_days: parseInt(trainDaysValue),
          training_duration: parseInt(durationValue),
          training_type: typeTrain,
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
        await loadUser();
        router.replace("/physical");
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
    <View style={[styles.container, { paddingHorizontal: 10, gap: 30 }]}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cuantos dias a la semana entrenas?</Text>
        <View>
          <DropDownPicker
            open={openTrainDays}
            value={trainDaysValue}
            items={trainDaysItems}
            setOpen={setTrainDays}
            setValue={setTrainDaysValue}
            setItems={setTrainDaysItems}
            arrowIconStyle={{
              tintColor: "#f08c00",
            }}
            textStyle={{
              color: "#f08c00",
              fontSize: 18,
              fontFamily: "Outfit_400Regular",
            }}
            dropDownContainerStyle={{
              borderColor: "#f08c00",
              borderWidth: 2,
            }}
            tickIconStyle={{
              tintColor: "#f08c00",
            }}
            style={{
              width: "100%",
              height: 60,
              borderColor: "#f08c00",
              borderWidth: 2,
            }}
            containerStyle={{ width: "100%" }}
            labelStyle={{
              textAlign: "center",
            }}
            zIndex={3100}
            zIndexInverse={1000}
          />
        </View>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cuanto duran tus entrenamientos?</Text>
        <View>
          <DropDownPicker
            open={openDuration}
            value={durationValue}
            items={durationItems}
            setOpen={setOpenDuration}
            setValue={setDurationValue}
            setItems={setDurationItems}
            arrowIconStyle={{
              tintColor: "#2f9e44",
            }}
            textStyle={{
              color: "#2f9e44",
              fontSize: 18,
              fontFamily: "Outfit_400Regular",
            }}
            dropDownContainerStyle={{
              borderColor: "#2f9e44",
              borderWidth: 2,
            }}
            tickIconStyle={{
              tintColor: "#2f9e44",
            }}
            style={{
              width: "100%",
              height: 60,
              borderColor: "#2f9e44",
              borderWidth: 2,
            }}
            containerStyle={{ width: "100%" }}
            labelStyle={{ textAlign: "center" }}
            zIndex={3001}
            zIndexInverse={1000}
          />
        </View>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Que tipo de entrenamiento haces?</Text>
        <View style={[styles.separatorContainer, { gap: 20 }]}>
          <Pressable
            onPress={() => setTypeTrain("gym")}
            style={[
              styles.buttonOption,
              { borderColor: "#6741d9" },
              typeTrain === "gym" && { backgroundColor: "#d0bfff" },
            ]}
          >
            <Text
              style={[
                styles.buttonOptionText,
                { color: typeTrain === "gym" ? "#000" : "#6741d9" },
              ]}
            >
              Pesas
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTypeTrain("cardio")}
            style={[
              styles.buttonOption,
              { borderColor: "#6741d9" },
              typeTrain === "cardio" && { backgroundColor: "#d0bfff" },
            ]}
          >
            <Text
              style={[
                styles.buttonOptionText,
                { color: typeTrain === "cardio" ? "#000" : "#6741d9" },
              ]}
            >
              Cardio
            </Text>
          </Pressable>
        </View>
        <View style={[styles.separatorContainer, { gap: 20 }]}>
          <Pressable
            onPress={() => setTypeTrain("both")}
            style={[
              styles.buttonOption,
              { borderColor: "#6741d9" },
              typeTrain === "both" && { backgroundColor: "#d0bfff" },
            ]}
          >
            <Text
              style={[
                styles.buttonOptionText,
                { color: typeTrain === "both" ? "#000" : "#6741d9" },
              ]}
            >
              Ambos
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTypeTrain("none")}
            style={[
              styles.buttonOption,
              { borderColor: "#6741d9" },
              typeTrain === "none" && { backgroundColor: "#d0bfff" },
            ]}
          >
            <Text
              style={[
                styles.buttonOptionText,
                { color: typeTrain === "none" ? "#000" : "#6741d9" },
              ]}
            >
              Ninguno
            </Text>
          </Pressable>
        </View>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.buttonPoints}>
        <Pressable
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: "#a5d8ff",
              borderColor: "#1971c2",
            },
            pressed && {
              backgroundColor: "#BFE1FF",
              borderColor: "#BFE1FF",
            },
            ,
          ]}
        >
          <Text style={{ ...styles.buttonText, color: "#000" }}>
            {loading ? "COMENZANDO..." : "INICIAR"}
          </Text>
        </Pressable>
        <View style={styles.pointsContainer}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.point, i === step - 1 && styles.activePoint]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};
