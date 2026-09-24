import { Pressable, Text, TextInput, View, StyleSheet } from "react-native";
import AntDesign from "@expo/vector-icons/build/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import React, { useState, useRef, useEffect } from "react";
import { CustomHeader } from "../components/CustomHeader";
import { Stack, router, Link} from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import {API_URL} from '../config/api'
import {useUser} from '../context/userProvider'

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorComponent, setErrorComponent] = useState(null);
  const {loadUser} = useUser();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  useEffect(() => {
    if (errorComponent === "email") {
      emailInputRef.current?.focus();
    } else if (errorComponent === "password") {
      passwordInputRef.current?.focus();
    }
  }, [errorComponent]);
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrorComponent("email");
      setError("Ingresa un correo electrónico");
      return;
    }
    if (!password) {
      setErrorComponent("password");
      setError("Ingresa tu contraseña");
      return;
    }
    if (!emailRegex.test(email)) {
      setErrorComponent("email");
      setError("Email inválido");
      return;
    }
    setLoading(true);
    setError("");
    setErrorComponent(null);
    const device_id = await getDeviceId();
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          device_id,
        }),
      });
      const data = await response.json();
      setLoading(false);
      if (data.success) {
        await loadUser();
        await saveSession(data.data);
        router.replace("/home");
      } else {
        if (data.message === "Contraseña incorrecta") {
          setErrorComponent("password");
        } else if (data.message === "Usuario no encontrado") {
          setErrorComponent("email");
        } else {
          setErrorComponent(null); 
        }
        setError(data.message);
      }
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };
  return (
    <>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => (
              <CustomHeader subtitle="Bienvenido otra vez, listo para mejorar?" />
            ),
          }}
        />
        <View style={styles.inputContainer}>
          <Text
            style={[
              styles.label,
              errorComponent === "email" && {
                color: "#ff0000",
              },
            ]}
          >
            Correo electrónico
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                errorComponent === "email" && {
                  borderColor: "#ff0000",
                  borderWidth: 2,
                },
              ]}
              placeholder="ex: toby@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              ref={emailInputRef}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
            <AntDesign
              name="mail"
              size={24}
              color={errorComponent === "email" ? "red" : "black"}
              style={styles.icon}
            />
          </View>
          {errorComponent === "email" && <Text style={styles.error}>{error}</Text>}
        </View>
        <View style={styles.inputContainer}>
          <Text
            style={[
              styles.label,
              errorComponent === "password" && {
                color: "#ff0000",
              },
            ]}
          >
            Contraseña
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              secureTextEntry={!passwordVisible}
              style={[
                styles.input,
                errorComponent === "password" && {
                  borderColor: "#ff0000",
                  borderWidth: 2,
                },
              ]}
              placeholder="*******"
              value={password}
              onChangeText={setPassword}
              ref={passwordInputRef}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            <Pressable
              style={styles.icon}
              onPress={() => setPasswordVisible((prevValue) => !prevValue)}
            >
              <Feather
                name={passwordVisible ? "eye" : "eye-off"}
                size={24}
                color={errorComponent === "password" ? "red" : "black"}
              />
            </Pressable>
          </View>
          {errorComponent === "password" && <Text style={styles.error}>{error}</Text>}
        </View>
        {errorComponent === null && <Text style={styles.error}>{error}</Text>}
        <View
          style={{
            width: "100%",
          }}
        >
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={onSubmit}
          >
            <Text style={{ ...styles.buttonText, color: "#000" }}>
              {loading ? "INGRESANDO ..." : "INICIAR SESIÓN"}
            </Text>
          </Pressable>
          <Link href="/signup" style={styles.link}>
            No tienes cuenta? Crea una nueva ahora
          </Link>
        </View>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 25,
    paddingHorizontal: 15,
    paddingTop: 55,
  },
  inputContainer: {
    width: "100%",
    gap: 10,
  },
  label: {
    fontSize: 16,
    color: "#1e1e1e",
    paddingLeft: 6,
    fontFamily: "Outfit_400Regular",
  },
  inputWrapper: {
    justifyContent: "center",
  },
  input: {
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000000",
    paddingLeft: 15,
    paddingRight: 50,
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
  icon: {
    position: "absolute",
    right: 15,
    zIndex: 1,
  },
  button: {
    borderColor: "#f08c00",
    borderWidth: 2,
    width: "100%",
    backgroundColor: "#ffec99",
    height: 75,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    fontFamily: "Outfit_400Regular",
  },
  buttonPressed: {
    backgroundColor: "#FFE75C",
    borderWidth: 0,
  },
  link: {
    textDecorationLine: "underline",
    textAlign: "center",
    color: "#474747",
    padding: 10,
    fontFamily: "Outfit_400Regular",
  },
  error: {
    color: "#ff0000",
    padding: 5,
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
});
