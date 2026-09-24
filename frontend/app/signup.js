import { View, StyleSheet } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useState } from "react";
import { Step1 } from "../components/Step1";
import { Step2 } from "../components/Step2";
import { Step3 } from "../components/Step3";
import { CustomHeader } from "../components/CustomHeader";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const Stack = createStackNavigator();
  const getSubtitle = (screenName) => {
    switch (screenName) {
      case "Step1":
        return "Comienza tu viaje hoy";

      case "Step2":
        return "Protege tu cuenta";

      case "Step3":
        return "Ayúdanos a personalizar tu experiencia";

      default:
        return "Te damos la bienvenida, ayúdanos a ayudarte";
    }
  };
  return (
    <View style={styles.container}>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerTitle: "",
          header: ({ route }) => (
            <CustomHeader
              subtitle={getSubtitle(route.name)}
              paddingTop={route.name === "Step3" ? 0 : 50}
            />
          ),
          gestureEnabled: true,
          gestureDirection: "horizontal",
          cardStyle: { backgroundColor: "#fff" },
        }}
      >
        <Stack.Screen name="Step1">
          {(props) => (
            <Step1
              {...props}
              styles={styles}
              username={username}
              setUsername={setUsername}
              email={email}
              setEmail={setEmail}
              step={1}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Step2">
          {(props) => (
            <Step2
              {...props}
              styles={styles}
              password={password}
              setPassword={setPassword}
              step={2}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Step3">
          {(props) => (
            <Step3
              {...props}
              styles={styles}
              username={username}
              email={email}
              password={password}
              step={3}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "#fff",
    gap: 40,
    paddingHorizontal: 15,
    paddingTop: 75,
  },
  text: {
    color: "#1e1e1e",
    fontFamily: "Outfit_400Regular",
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
  containerStep: {
    backgroundColor: "#fff",
    gap: 25,
  },
  icon: {
    position: "absolute",
    right: 15,
    zIndex: 1,
  },
  error: {
    color: "#ff0000",
    padding: 5,
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
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
    backgroundColor: "#ffe8ba",
    borderWidth: 0,
  },
  link: {
    textDecorationLine: "underline",
    textAlign: "center",
    color: "#474747",
    padding: 10,
    fontFamily: "Outfit_400Regular",
  },
  pointsContainer: {
    display: "flex",
    width: "100%",
    flexDirection: "row",
    justifyContent:"center",
    gap: 15
  },
  point: {
    width: 5,
    height: 5,
    backgroundColor: "#a5d8ff",
    borderRadius: 2.5
  },
  activePoint:{
    backgroundColor:"#1971c2"
  }
});
