import DropDownPicker from "react-native-dropdown-picker";
import React, { useState, useRef, useEffect } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
export const Step1Physique = ({
  styles,
  navigation,
  step,
  weight,
  height,
  setWeight,
  setHeight,
  heightValue,
  setHeightValue,
  weightValue,
  setWeightValue
}) => {
  const [openHeight, setOpenHeight] = useState(false);
  const [heightItems, setHeightItems] = useState([
    { label: "cm", value: "cm" },
    { label: "ft", value: "ft" },
  ]);
  const [openWeight, setOpenWeight] = useState(false);
  const [weightItems, setWeightItems] = useState([
    { label: "kg", value: "kg" },
    { label: "lbs", value: "lbs" },
  ]);
  const weightInputRef = useRef(null);
  const heightInputRef = useRef(null);
  const [error, setError] = useState("");
  const [errorComponent, setErrorComponent] = useState(null);
  useEffect(() => {
    if (errorComponent === "weight") {
      weightInputRef.current?.focus();
    } else if (errorComponent === "height") {
      heightInputRef.current?.focus();
    }
  }, [errorComponent]);
  const onSubmit = () => {
    setError("");
    setErrorComponent("");
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    if (
      (heightNum < 100 && heightValue === "cm") ||
      (heightNum < 3.3 && heightValue === "ft")
    ) {
      setError("Por favor, ingresa una estatura válida.");
      setErrorComponent("height");
    } else if (
      (heightNum > 230 && heightValue === "cm") ||
      (heightNum > 7.5 && heightValue === "ft")
    ) {
      setError(
        "La estatura ingresada parece demasiado alta. Verifica el valor."
      );
      setErrorComponent("height");
    } else if (
      (weightNum < 35 && weightValue === "kg") ||
      (weightNum < 77 && weightValue === "lbs")
    ) {
      setError("El peso ingresado parece demasiado bajo. Verifica el valor.");
      setErrorComponent("weight");
    } else if (
      (weightNum > 300 && weightValue === "kg") ||
      (weightNum > 660 && weightValue === "lbs")
    ) {
      setError("El peso ingresado parece demasiado alto. Verifica el valor.");
      setErrorComponent("weight");
    } else {
      setError("");
      setErrorComponent(null);
      navigation.navigate("Step2");
    }
  };
  return (
    <View style={[styles.container, { paddingTop: 40, paddingHorizontal: 15 }]}>
      <View style={styles.inputContainer}>
        <Text
          style={[
            styles.label,
            errorComponent === "height" && { color: "#ff0000" },
          ]}
        >
          Tu altura
        </Text>
        <View
          style={[styles.inputWrapper, { flexDirection: "row", gap: "10" }]}
        >
          <View style={{ flex: 1 }}>
            <TextInput
              ref={heightInputRef}
              style={[
                styles.input,
                errorComponent === "height" && {
                  borderColor: "#ff0000",
                  color: "#ff0000",
                },
                { paddingLeft: "15", paddingRight: "15", textAlign: "center" },
              ]}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>
          <View style={{ flex: 0.6 }}>
            <DropDownPicker
              open={openHeight}
              value={heightValue}
              items={heightItems}
              arrowIconStyle={
                errorComponent === "height" && {
                  tintColor: "#ff0000",
                }
              }
              textStyle={
                errorComponent === "height" && {
                  color: "#ff0000",
                  fontSize: 18,
                  fontFamily: "Outfit_400Regular",
                }
              }
              dropDownContainerStyle={
                errorComponent === "height" && {
                  borderColor: "#ff0000",
                  borderWidth: 1,
                }
              }
              tickIconStyle={
                errorComponent === "height" && {
                  tintColor: "#ff0000",
                }
              }
              setOpen={setOpenHeight}
              setValue={setHeightValue}
              setItems={setHeightItems}
              style={[
                { width: "100%", height: "70" },
                errorComponent === "height" && { borderColor: "#ff0000" },
              ]}
              containerStyle={{ width: "100%" }}
              labelStyle={{
                textAlign: "center",
                fontSize: 18,
                fontFamily: "Outfit_400Regular",
              }}
              zIndex={3100}
              zIndexInverse={1000}
            />
          </View>
        </View>
      </View>
      {errorComponent === "height" && <Text style={styles.error}>{error}</Text>}
      <View style={styles.inputContainer}>
        <Text
          style={[
            styles.label,
            errorComponent === "weight" && { color: "#ff0000" },
          ]}
        >
          Tu peso
        </Text>
        <View
          style={[styles.inputWrapper, { flexDirection: "row", gap: "10" }]}
        >
          <View style={{ flex: 1 }}>
            <TextInput
              ref={weightInputRef}
              style={[
                styles.input,
                errorComponent === "weight" && {
                  borderColor: "#ff0000",
                  color: "#ff0000",
                },
                { paddingLeft: "15", paddingRight: "15", textAlign: "center" },
              ]}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>
          <View style={{ flex: 0.6 }}>
            <DropDownPicker
              open={openWeight}
              value={weightValue}
              items={weightItems}
              setOpen={setOpenWeight}
              setValue={setWeightValue}
              setItems={setWeightItems}
              arrowIconStyle={
                errorComponent === "weight" && {
                  tintColor: "#ff0000",
                }
              }
              textStyle={
                errorComponent === "weight" && {
                  color: "#ff0000",
                  fontSize: 18,
                  fontFamily: "Outfit_400Regular",
                }
              }
              dropDownContainerStyle={
                errorComponent === "weight" && {
                  borderColor: "#ff0000",
                  borderWidth: 1,
                }
              }
              tickIconStyle={
                errorComponent === "weight" && {
                  tintColor: "#ff0000",
                }
              }
              style={[
                { width: "100%", height: "70" },
                errorComponent === "weight" && { borderColor: "#ff0000" },
              ]}
              containerStyle={{ width: "100%" }}
              labelStyle={{
                textAlign: "center",
                fontSize: 18,
                fontFamily: "Outfit_400Regular",
              }}
              zIndex={3001}
              zIndexInverse={1000}
            />
          </View>
        </View>
      </View>
      {errorComponent === "weight" && <Text style={styles.error}>{error}</Text>}
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
          <Text style={{ ...styles.buttonText, color: "#000" }}>SIGUIENTE</Text>
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
