import { Pressable, Text, View } from "react-native";
export const Step2Physique = ({ styles, navigation, step, option, intensity, setOption, setIntensity }) => {
  const details = {
    deficit: {
      light: ["~ -0.23 kg / sem", "~ -250 kcal"],
      moderate: ["~ -0.41 kg / sem", "~ -450 kcal"],
      aggressive: ["~ -0.55 kg / sem", "~ -600 kcal"],
    },
    recomp: {
      description: "Mantén tu peso mientras mejoras tu composición corporal.",
    },
    bulk: {
      light: ["~ +0.25 kg / sem", "~ +250 kcal"],
      moderate: ["~ +0.45 kg / sem", "~ +450 kcal"],
      aggressive: ["~ +0.60 kg / sem", "~ +600 kcal"],
    },
  };
  const textColor =
    option === "deficit"
      ? "#f08c00"
      : option === "bulk"
      ? "#2f9e44"
      : "#6741d9";
  const onSubmit = () => {
    navigation.navigate("Step3");
  };
  return (
    <View style={[styles.container, { paddingTop: 45, paddingHorizontal: 10 }]}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cual es tu objetivo?</Text>
        <View style={styles.containerOptions}>
          <View style={styles.separatorContainer}>
            <Pressable
              onPress={() => {
                setOption("deficit");
              }}
              style={[
                styles.buttonOption,
                { borderColor: "#f08c00" },
                option === "deficit" && { backgroundColor: "#ffec99" },
              ]}
            >
              <Text
                style={[
                  styles.buttonOptionText,
                  { color: option === "deficit" ? "#000" : "#f08c00" },
                ]}
              >
                Perder grasa
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setOption("bulk");
              }}
              style={[
                styles.buttonOption,
                { borderColor: "#2f9e44" },
                option === "bulk" && { backgroundColor: "#b2f2bb" },
              ]}
            >
              <Text
                style={[
                  styles.buttonOptionText,
                  { color: option === "bulk" ? "#000" : "#2f9e44" },
                ]}
              >
                Ganar músculo
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              setOption("recomp");
            }}
            style={[
              styles.buttonOption,
              { borderColor: "#6741d9" },
              option === "recomp" && { backgroundColor: "#d0bfff" },
            ]}
          >
            <Text
              style={[
                styles.buttonOptionText,
                { color: option === "recomp" ? "#000" : "#6741d9" },
              ]}
            >
              Recomposición corporal
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.intensityOptionsContainer}>
        <Pressable
          style={styles.intensityContainer}
          onPress={() => setIntensity("light")}
        >
          <View
            style={[
              styles.intensityButton,
              intensity === "light" && styles.intensitySelected,
            ]}
          ></View>
          <Text
            style={[
              styles.normalText,
              intensity === "light" && { color: "#1971c2" },
            ]}
          >
            Ligero
          </Text>
        </Pressable>
        <Pressable
          style={styles.intensityContainer}
          onPress={() => setIntensity("moderate")}
        >
          <View
            style={[
              styles.intensityButton,
              intensity === "moderate" && styles.intensitySelected,
            ]}
          ></View>
          <Text
            style={[
              styles.normalText,
              intensity === "moderate" && { color: "#1971c2" },
            ]}
          >
            Moderado
          </Text>
        </Pressable>
        <Pressable
          style={styles.intensityContainer}
          onPress={() => setIntensity("aggressive")}
        >
          <View
            style={[
              styles.intensityButton,
              intensity === "aggressive" && styles.intensitySelected,
            ]}
          ></View>
          <Text
            style={[
              styles.normalText,
              intensity === "aggressive" && { color: "#1971c2" },
            ]}
          >
            Rápido
          </Text>
        </Pressable>
      </View>
      <View>
        {option === "recomp" ? (
          <Text
            style={[
              styles.normalText,
              { textAlign: "right", color: textColor },
            ]}
          >
            {details.recomp.description}
          </Text>
        ) : (
          <>
            <Text
              style={[
                styles.normalText,
                { textAlign: "right", color: textColor },
              ]}
            >
              {details[option][intensity][0]}
            </Text>
            <Text style={[styles.normalText, { textAlign: "right" }]}>
              {" "}
              {details[option][intensity][1]}
            </Text>
          </>
        )}
      </View>
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
