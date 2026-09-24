import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {useUser} from '../context/userProvider'
export const GoToProfile = () => {
  const {user} = useUser();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Hi,{" "}
        <Link href="/profile" style={styles.link}>
          {user?.user.username}
          {">"}
        </Link>
      </Text>
      <View style={styles.streakContainer}>
        <Text style={styles.streak}>24 días en racha</Text>
        <MaterialCommunityIcons name="fire" size={30} color="#e03131" />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  text: {
    fontSize: 52,
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
  streak: {
    fontSize: 22,
    color: "#f08c00",
    fontFamily: "Outfit_400Regular",
  },
  streakContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: -8
  },
});
