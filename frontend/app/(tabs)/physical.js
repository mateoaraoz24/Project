import { Pressable, Text, View, StyleSheet } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { GoToProfile } from "../../components/GoToProfile";
import { useUser } from "../../context/userProvider";

export default function Physical() {
  const { user, loadingUser } = useUser();
  useEffect(() => {
    const checkOnboarding = async () => {
      if (loadingUser) return;
      const animationSeen = await SecureStore.getItemAsync("physique_animation_seen");
      if (!animationSeen) {
        router.replace("/physique-animation");
        return;
      }
      if (!user?.physique) {
        router.replace("/physique-form");
        return;
      }
    };

    checkOnboarding();
  }, [loadingUser, user]);

  return (
    <View style={styles.container}>
      <GoToProfile />
      <Text style={styles.text}>
        Si sigues asi, nadie te reconocerá en 6 meses
      </Text>
      <View style={styles.containerButtons}>
        <Pressable
          style={[
            styles.button,
            { borderColor: "#f08c00", backgroundColor: "#ffec99" },
          ]}
          onPress={() => router.push("/nutrition")}
        >
          <Text style={styles.buttonText}>Nutrición</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            { borderColor: "#1971c2", backgroundColor: "#a5d8ff" },
          ]}
          onPress={() => router.push("/sleep")}
        >
          <Text style={styles.buttonText}>Dormir</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            { borderColor: "#2f9e44", backgroundColor: "#b2f2bb" },
          ]}
          onPress={() => router.push("/train")}
        >
          <Text style={styles.buttonText}>Entrenamiento</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 15,
    paddingHorizontal: 5,
    paddingTop: 10,
  },
  containerButtons: {
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  button: {
    paddingVertical: 25,
    width: "100%",
    borderWidth: 2,
    borderRadius: 18,
  },
  buttonText: {
    textAlign: "center",
    textTransform: "uppercase",
    fontFamily: "Outfit_400Regular",
    fontSize: 20,
  },
  text: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: "#099268",
    textAlign: "center",
  },
});
