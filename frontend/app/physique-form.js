import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { CustomHeader } from "../components/CustomHeader";
import { createStackNavigator } from "@react-navigation/stack";
import { Step1Physique } from "../components/Step1-physique";
import { Step2Physique } from "../components/Step2-physique";
import { Step3Physique } from "../components/Step3-physique";
import { Step4Physique } from "../components/Step4-physique";
import {router} from 'expo-router'
import { useUser } from "../context/userProvider";
export default function PhysiqueForm() {
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("180");
  const [heightValue, setHeightValue] = useState("cm");
  const [weightValue, setWeightValue] = useState("kg");
  const [option, setOption] = useState("deficit");
  const [intensity, setIntensity] = useState("moderate");
  const [activityLevel, setActivityLevel] = useState("quiet");
  const { user, loadingUser } = useUser();
  const Stack = createStackNavigator();
  const getSubtitle = (screenName) => {
    switch (screenName) {
      case "Step1":
        return "Empecemos con tus datos físicos.";

      case "Step2":
        return "Elige el objetivo que quieres alcanzar";

      case "Step3":
        return "Cuéntanos qué tan activo eres.";

      case "Step4":
        return "Hablanos un poco sobre tus entrenamientos.";

      default:
        return "Te damos la bienvenida. Vamos a personalizar tu experiencia.";
    }
  };

  useEffect(() => {
    if (loadingUser) return; 

    if (user?.physique) {
      router.replace("/physical");
      return;
    }
  }, [loadingUser, user]);
  return (
    <View style={styles.container}>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerTitle: "",
          header: ({ route }) => (
            <CustomHeader subtitle={getSubtitle(route.name)} />
          ),
          gestureEnabled: true,
          gestureDirection: "horizontal",
          cardStyle: { backgroundColor: "#fff" },
        }}
      >
        <Stack.Screen name="Step1">
          {(props) => (
            <Step1Physique
              {...props}
              styles={styles}
              weight={weight}
              setWeight={setWeight}
              height={height}
              setHeight={setHeight}
              heightValue={heightValue}
              setHeightValue={setHeightValue}
              weightValue={weightValue}
              setWeightValue={setWeightValue}
              step={1}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Step2">
          {(props) => (
            <Step2Physique
              {...props}
              styles={styles}
              option={option}
              setOption={setOption}
              intensity={intensity}
              setIntensity={setIntensity}
              step={2}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Step3">
          {(props) => (
            <Step3Physique
              {...props}
              styles={styles}
              activityLevel={activityLevel}
              setActivityLevel={setActivityLevel}
              step={3}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Step4">
          {(props) => (
            <Step4Physique
              {...props}
              styles={styles}
              weight={weight}
              height={height}
              activityLevel={activityLevel}
              intensity={intensity}
              goal={option}
              weightValue={weightValue}
              heightValue={heightValue}
              step={4}
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
  },
  text: {
    color: "#1e1e1e",
    fontFamily: "Outfit_400Regular",
  },
  inputContainer: {
    width: "100%",
    gap: 20,
  },
  label: {
    fontSize: 16,
    color: "#1e1e1e",
    fontFamily: "Outfit_400Regular",
  },
  inputWrapper: {
    justifyContent: "center",
  },
  input: {
    height: 70,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000000",
    paddingLeft: 15,
    paddingRight: 50,
    fontSize: 20,
    fontFamily: "Outfit_400Regular",
  },
  error: {
    color: "#ff0000",
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
  buttonOptionText: {
    fontSize: 18,
    fontFamily: "Outfit_400Regular",
    textAlign: "center",
  },
  buttonPressed: {
    backgroundColor: "#ffe8ba",
    borderWidth: 0,
  },
  pointsContainer: {
    display: "flex",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
  },
  point: {
    width: 5,
    height: 5,
    backgroundColor: "#a5d8ff",
    borderRadius: 2.5,
  },
  activePoint: {
    backgroundColor: "#1971c2",
  },
  buttonPoints: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  intensityButton: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 4,
  },
  intensityContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  buttonOption: {
    borderWidth: 2,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  separatorContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    gap: 10,
  },
  containerOptions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingVertical: 10,
  },
  intensityOptionsContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },
  intensitySelected: {
    borderColor: "#1971c2",
    backgroundColor: "#1971c2",
  },
  normalText: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
});
