import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function SocialLesson() {
  const { title, content } = useLocalSearchParams();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.text, styles.label]}>Mini-lección</Text>
      <Text style={[styles.text, styles.title]}>{title}</Text>
      <Text style={[styles.text, styles.content]}>{content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 16,
    paddingBottom: 40,
  },
  text: {
    fontFamily: "Outfit_400Regular",
    color: "#1e1e1e",
  },
  label: {
    color: "#868e96",
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    marginBottom: 14,
  },
  content: {
    fontSize: 17,
    lineHeight: 26,
    color: "#343a40",
  },
});