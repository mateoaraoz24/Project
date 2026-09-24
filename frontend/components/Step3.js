import { Pressable, Text, View, StyleSheet } from "react-native";
import { useState } from "react";
import WheelPicker from "@quidone/react-native-wheel-picker";
import Foundation from "@expo/vector-icons/Foundation";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { API_URL } from "../config/api";
export const Step3 = ({ styles, username, password, email, step }) => {
  const [error, setError] = useState("");
  const [gender, setGender] = useState(null);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const [loading, setLoading] = useState(false);
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 12 - i);
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(currentYear - 18);
  const calculateAge = () => {
    const birthDate = new Date(year, month, day);
    const today = new Date();

    let ageCalc = today.getFullYear() - birthDate.getFullYear();

    if (
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate())
    ) {
      ageCalc--;
    }

    return ageCalc;
  };
  const saveSession = async (data) => {
    await SecureStore.setItemAsync("access_token", data.access_token);

    await SecureStore.setItemAsync("refresh_token", data.refresh_token);

    await SecureStore.setItemAsync("user_id", String(data.user_id));
  };
  const getDeviceId = async () => {
    let deviceId = await SecureStore.getItemAsync("device_id");

    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await SecureStore.setItemAsync("device_id", deviceId);
    }

    return deviceId;
  };
  const onSubmit = async () => {
    if (loading) return;
    setLoading(true);
    const age = calculateAge();
    if (gender === null) {
      setError("Selecciona un genero");
      return;
    }
    if (age < 10 || age > 120) {
      setError("Edad no válida");
      return;
    }
    setLoading(true);
    setError("");
    const birthDate = new Date(year, month, day).toISOString().split("T")[0];
    const device_id = await getDeviceId();
    try {
      const response = await fetch(`${API_URL}/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          gender,
          birthDate,
          device_id,
        }),
      });
      const data = await response.json();
      setLoading(false);
      if (data.success) {
        await saveSession(data.data);
        router.replace("/home");
      } else {
        setError(data.message);
      }
    } catch (error) {
      setLoading(false);
      setError("No se pudo conectar con el servidor");
    }
  };

  return (
    <View style={{ ...styles.containerStep, gap: 15 }}>
      <View style={ownStyles.genderContainer}>
        <Pressable
          style={({ pressed }) => [
            ownStyles.genderButton,
            {
              borderColor: "#0000ff",
              backgroundColor: pressed
                ? "#0000ff"
                : gender === "male"
                ? "#0000ff"
                : "#e7f5ff",
            },
          ]}
          onPress={() => setGender("male")}
        >
          {({ pressed }) => (
            <Foundation
              name="male-symbol"
              size={84}
              color={
                pressed ? "#ffffff" : gender === "male" ? "#fff" : "#0000ff"
              }
            />
          )}
        </Pressable>
        <Pressable
          onPress={() => setGender("female")}
          style={({ pressed }) => [
            ownStyles.genderButton,
            {
              borderColor: "#ff00ff",
              backgroundColor: pressed
                ? "#ff00ff"
                : gender === "female"
                ? "#ff00ff"
                : "#FDE7FF",
            },
          ]}
        >
          {({ pressed }) => (
            <Foundation
              name="female-symbol"
              size={84}
              color={
                pressed
                  ? "#ffffff"
                  : gender === "female"
                  ? "#ffffff"
                  : "#ff00ff"
              }
            />
          )}
        </Pressable>
      </View>

      <View style={styles.inputContainer}>
        <View style={ownStyles.birthContainer}>
          <WheelPicker
            style={{ flex: 1 }}
            data={days.map((d) => ({
              value: d,
              label: `${d}`,
            }))}
            value={day}
            onValueChanged={({ item }) => setDay(item.value)}
            height={140}
            itemHeight={40}
            overlayItemStyle={{
              backgroundColor: gender === "male" ? "#0000ff" : "#ff00ff",
              borderRadius: 14,
              opacity: 0.3,
            }}
            itemTextStyle={ownStyles.textBirth}
          />

          <WheelPicker
            style={{ flex: 1 }}
            data={months.map((m, index) => ({
              value: index,
              label: m,
            }))}
            value={month}
            onValueChanged={({ item }) => setMonth(item.value)}
            height={140}
            itemHeight={40}
            overlayItemStyle={{
              backgroundColor: gender === "male" ? "#0000ff" : "#ff00ff",
              borderRadius: 14,
              opacity: 0.3,
            }}
            itemTextStyle={ownStyles.textBirth}
          />

          <WheelPicker
            style={{ flex: 1 }}
            data={years.map((y) => ({
              value: y,
              label: `${y}`,
            }))}
            value={year}
            onValueChanged={({ item }) => setYear(item.value)}
            height={140}
            itemHeight={40}
            overlayItemStyle={{
              backgroundColor: gender === "male" ? "#0000ff" : "#ff00ff",
              borderRadius: 14,
              opacity: 0.3,
            }}
            itemTextStyle={ownStyles.textBirth}
          />
        </View>
      </View>
      <Text style={styles.error}>{error}</Text>
      <View>
        <Pressable
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: "#ffec99", borderColor: "#f08c00" },
            pressed && {
              backgroundColor: "#FFE75C",
              borderColor: "#FFE75C",
            },
            ,
          ]}
        >
          <Text style={{ ...styles.buttonText, color: "#000" }}>
            {loading ? "CREANDO..." : "REGISTRARSE"}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.link}>
            Ya tienes una cuenta? inicia sesión ahora
          </Text>
        </Pressable>
      </View>
      <View style={styles.pointsContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.point, i === step - 1 && styles.activePoint]}
          />
        ))}
      </View>
    </View>
  );
};

const ownStyles = StyleSheet.create({
  genderContainer: {
    justifyContent: "center",
    gap: 50,
    padding: 0,
    paddingTop: 10,
    flexDirection: "row",
  },
  genderButton: {
    borderWidth: 2,
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    width: 120,
  },
  birthContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  textBirth: {
    color: "#000",
    fontSize: 20,
    fontFamily: "Outfit_400Regular",
  },
});
