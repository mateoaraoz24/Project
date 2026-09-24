import { Animated, Text, StyleSheet, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";

export default function AnimatedTextBlock({
  mensajes,
  index,
  fadeAnim,
  textColor,
  isFlashActive,
}) {
  const router = useRouter();
  return (
    <View
      style={{ ...styles.container, top: index >= mensajes.length ? -50 : 0 }}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          header: () =>
            index >= mensajes.length && (
              <View style={styles.header}>
                <Text style={styles.title}>ALEKAIAPP</Text>
              </View>
            ),
        }}
      />
      {index < mensajes.length ? (
        <Animated.Text
          style={[
            styles.text,
            { opacity: fadeAnim, color: textColor },
            isFlashActive ? styles.climaxText : styles.normalText,
          ]}
        >
          {mensajes[index]}
        </Animated.Text>
      ) : (
        <View style={styles.start}>
          <View style={styles.grafic}>
            {[20, 40, 60, 80, 100].map((h, i) => (
              <View style={[styles.rectangle, { height: h }]} key={i} />
            ))}
          </View>

          <Text style={styles.motivationalText}>
            Level up your life, one day at a time
          </Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={() => router.replace("/login")}
          >
            {({ pressed }) => (
              <Text
                style={[styles.buttonText, pressed && styles.buttonTextPressed]}
              >
                START
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    elevation: 100,
    flex: 1,
  },
  pressed: {
    backgroundColor: "#e9ecef",
  },
  buttonTextPressed: {
    color: "#000",
  },
  grafic: {
    flexDirection: "row",
    gap: 15,
    alignItems: "flex-end",
    height: 95,
  },
  rectangle: {
    borderWidth: 2,
    width: 25,
  },
  text: {
    textAlign: "center",
    fontWeight: "bold",
  },
  normalText: {
    fontSize: 24,
    width: 250,
  },
  motivationalText: {
    fontSize: 15,
    textAlign: "center",
    width: "90%",
    color: "#1e1e1e",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#000",
    fontWeight: 600,
    fontSize: 30,
    paddingTop: 50,
  },
  climaxText: {
    fontSize: 34,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: "bold",
    textAlign: "center",
  },
  button: {
    borderColor: "#000",
    width: "90%",
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: "#1e1e1e",
    marginTop: 25,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 24,
    textTransform: "uppercase",
  },
  start: {
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 20,
    width: "100%",
    height: "100%",
  },
});
