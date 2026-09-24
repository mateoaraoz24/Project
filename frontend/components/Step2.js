import Feather from "@expo/vector-icons/Feather";
import React, { useState, useEffect, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
export const Step2 = ({ styles, navigation, password, setPassword, step }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);
  const [error, setError] = useState("");
  const [errorComponent, setErrorComponent] = useState(null);
  const passwordInputRef = useRef(null);
  const passwordConfirmInputRef = useRef(null);
  useEffect(() => {
    if (errorComponent === "confirm") {
      passwordConfirmInputRef?.current.focus();
    } else if (errorComponent === "password") {
      passwordInputRef?.current.focus();
    }
  }, [errorComponent]);
  const onSubmit = () => {
    if (password.length < 8 || password.length > 13) {
      setError("Ingresa entre 8 y 12 caracteres");
      setErrorComponent("password");
    } else if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      setErrorComponent("confirm");
    } else {
      setError("");
      setErrorComponent(null);
      navigation.navigate("Step3");
    }
  };
  return (
    <View style={[styles.containerStep, { marginTop: 40 }]}>
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
            placeholder="*******"
            ref={passwordInputRef}
            style={[
              styles.input,
              errorComponent === "password" && {
                borderColor: "#ff0000",
                borderWidth: 2,
              },
            ]}
            value={password}
            secureTextEntry={!passwordVisible}
            onChangeText={setPassword}
            returnKeyType="next"
            onSubmitEditing={() => passwordConfirmInputRef.current?.focus()}
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
        {errorComponent === "password" && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text
          style={[
            styles.label,
            errorComponent === "confirm" && {
              color: "#ff0000",
            },
          ]}
        >
          Confirma tu contraseña
        </Text>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="*******"
            ref={passwordConfirmInputRef}
            style={[
              styles.input,
              errorComponent === "confirm" && {
                borderColor: "#ff0000",
                borderWidth: 2,
              },
            ]}
            value={passwordConfirm}
            secureTextEntry={!passwordConfirmVisible}
            onChangeText={setPasswordConfirm}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
          <Pressable
            style={styles.icon}
            onPress={() => setPasswordConfirmVisible((prevValue) => !prevValue)}
          >
            <Feather
              name={passwordConfirmVisible ? "eye" : "eye-off"}
              size={24}
              color={errorComponent === "confirm" ? "red" : "black"}
            />
          </Pressable>
        </View>
        {errorComponent === "confirm" && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
      <View>
        <Pressable
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: "#b2f2bb", borderColor: "#2f9e44" },
            pressed && {
              backgroundColor: "#73E789",
              borderColor: "#73E789",
            },
            ,
          ]}
        >
          <Text style={{ ...styles.buttonText, color: "#000" }}>NEXT</Text>
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
