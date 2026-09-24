import { View, Text, StyleSheet } from "react-native";
export const CustomHeader = ({ subtitle, paddingTop = 60 }) => (
  <View style={styles.header}>
    <Text style={[styles.title, { paddingTop }]}>ALEKAIAPP</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);
const styles = StyleSheet.create({
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
    fontFamily: "Outfit_700Bold",
  },
  subtitle: {
    color: "#343a40",
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    fontWeight: 400,
  },
});
