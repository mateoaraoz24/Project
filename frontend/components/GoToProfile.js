import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useUser } from "../context/userProvider";
export const GoToProfile = () => {
  const { user } = useUser();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Hola,{" "}
        <Link href="/profile" style={styles.link}>
          {user?.user.username}
        </Link>
      </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  text: {
    fontSize: 48,
    fontFamily: "Outfit_400Regular",
    lineHeight: 56,
  },
  link: {
    color: "#1971c2",
    fontFamily: "Outfit_400Regular",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    padding: 10,
  },
});
