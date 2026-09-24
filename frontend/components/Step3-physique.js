import { Pressable, Text, View } from "react-native";
export const Step3Physique = ({
  styles,
  navigation,
  step,
  activityLevel,
  setActivityLevel,
}) => {
  const details = {
    sedentary:
      "Pasas la mayor parte del día sentado (oficina, estudio, manejar)",
    quiet:
      "Te mueves moderadamente en el día (compras, tareas del hogar, caminatas cortas)",
    active:
      "Estás de pie o caminas mucho por tu trabajo (mesero, vendedor, maestro) o das más de 10,000 pasos al día.",
    veryActive:
      "Tu trabajo requiere un esfuerzo físico extremo diario (construcción, mudanzas, atleta de alto rendimiento profesional).",
  };
  const onSubmit = () => {
    navigation.navigate("Step4");
  };
  const textColor =
    activityLevel === "sedentary"
      ? "#e03131"
      : activityLevel === "quiet"
      ? "#0c8599"
      : activityLevel === "active"
      ? "#f08c00"
      : "#2f9e44";
  return (
    <View style={[styles.container, { paddingTop: 50, paddingHorizontal: 10 }]}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Como es tu día nornalmente?</Text>
        <Text style={[styles.normalText, { color: textColor }]}>
          {details[activityLevel]}
        </Text>
        <View style={styles.containerOptions}>
          <View style={[styles.separatorContainer, { gap: 40 }]}>
            <Pressable
              onPress={() => {
                setActivityLevel("sedentary");
              }}
              style={[
                styles.buttonOption,
                { borderColor: "#e03131" },
                activityLevel === "sedentary" && { backgroundColor: "#ffc9c9" },
              ]}
            >
              <Text
                style={[
                  styles.buttonOptionText,
                  { color: activityLevel === "sedentary" ? "#000" : "#e03131" },
                ]}
              >
                Sedentario
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setActivityLevel("quiet");
              }}
              style={[
                styles.buttonOption,
                { borderColor: "#0c8599" },
                activityLevel === "quiet" && { backgroundColor: "#99e9f2" },
              ]}
            >
              <Text
                style={[
                  styles.buttonOptionText,
                  { color: activityLevel === "quiet" ? "#000" : "#0c8599" },
                ]}
              >
                Algo activo
              </Text>
            </Pressable>
          </View>
          <View style={[styles.separatorContainer, { gap: 40 }]}>
            <Pressable
              onPress={() => {
                setActivityLevel("active");
              }}
              style={[
                styles.buttonOption,
                { borderColor: "#f08c00" },
                activityLevel === "active" && { backgroundColor: "#ffec99" },
              ]}
            >
              <Text
                style={[
                  styles.buttonOptionText,
                  { color: activityLevel === "active" ? "#000" : "#f08c00" },
                ]}
              >
                Activo
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setActivityLevel("veryActive");
              }}
              style={[
                styles.buttonOption,
                { borderColor: "#2f9e44" },
                activityLevel === "veryActive" && {
                  backgroundColor: "#b2f2bb",
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonOptionText,
                  {
                    color: activityLevel === "veryActive" ? "#000" : "#2f9e44",
                  },
                ]}
              >
                Muy activo
              </Text>
            </Pressable>
          </View>
        </View>
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
