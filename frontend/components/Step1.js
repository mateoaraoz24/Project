import AntDesign from "@expo/vector-icons/build/AntDesign";
import { Pressable, Text, TextInput, View } from "react-native";
import { useState, useRef, useEffect } from "react";
import { router } from "expo-router";
export const Step1 = ({
  styles,
  email,
  setEmail,
  username,
  setUsername,
  navigation,
  step,
}) => {
  const [error, setError] = useState("");
  const [errorComponent, setErrorComponent] = useState(null);
  const emailInputRef = useRef(null);
  const usernameInputRef = useRef(null);
  useEffect(() => {
    if (errorComponent === "username") {
      usernameInputRef?.current.focus();
    } else if (errorComponent === "email") {
      emailInputRef?.current.focus();
    }
  }, [errorComponent]);
  const onSubmit = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (username.length < 3 || username.length > 12) {
      setError("Ingresa entre 3 y 12 caracteres");
      setErrorComponent("username");
    } else if (!emailRegex.test(email)) {
      setError("El correo electrónico no es válido");
      setErrorComponent("email");
    } else {
      setError("");
      setErrorComponent(null);
      navigation.navigate("Step2");
    }
  };
  return (
    <View style={styles.containerStep}>
      <View style={styles.inputContainer}>
        <Text
          style={[
            styles.label,
            errorComponent === "username" && {
              color: "#ff0000",
            },
          ]}
        >
          Nombre de usuario
        </Text>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={usernameInputRef}
            keyboardType="default"
            autoCapitalize="none"
            placeholder="ex: toby123"
            style={[
              styles.input,
              errorComponent === "username" && {
                borderColor: "#ff0000",
                borderWidth: 2,
              },
            ]}
            value={username}
            onChangeText={setUsername}
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
          />
          <AntDesign
            name="user"
            size={24}
            color={errorComponent === "username" ? "red" : "black"}
            style={styles.icon}
          />
        </View>
        {errorComponent === "username" && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
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
            ref={emailInputRef}
            keyboardType="email-address"
            placeholder="ex: toby@gmail.com"
            autoCapitalize="none"
            style={[
              styles.input,
              errorComponent === "email" && {
                borderColor: "#ff0000",
                borderWidth: 2,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
          <AntDesign
            name="mail"
            size={24}
            color={errorComponent === "email" ? "red" : "black"}
            style={styles.icon}
          />
        </View>
        {errorComponent === "email" && (
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
          ]}
        >
          <Text style={{ ...styles.buttonText, color: "#000" }}>SIGUIENTE</Text>
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
