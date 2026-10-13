import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { router } from "expo-router";

const meditations = [
  {
    id: "reflexion",
    title: "Reflexión y Claridad",
    subtitle: "Enfoque en el propósito",
    audioUrl:
      "https://mp3tourl.com/audio/1791857243530-a0e7d862-a382-429a-a62b-938be02cb719.mp3",
  },
  {
    id: "estres",
    title: "Manejo del Estrés",
    subtitle: "Encuentra calma en el caos",
    audioUrl:
      "https://mp3tourl.com/audio/1791857488943-a09f806f-dacf-4acd-a73b-fd9281e7c9d6.mp3",
  },
  {
    id: "ira",
    title: "Manejo de la Ira",
    subtitle: "Transforma la intensidad en claridad",
    audioUrl: "https://mp3tourl.com/audio/1791857639609-ed79eaea-d645-4e46-8ef3-9947c9c95e17.mp3", 
  },
  {
    id: "tristeza",
    title: "Manejo de la Tristeza",
    subtitle: "Acompáñate con ternura",
    audioUrl: "https://mp3tourl.com/audio/1791857312268-998012b0-d0d0-474e-a5cd-176700d1bd56.mp3", 
  },
];

export default function Meditations() {
  const handlePress = (meditation) => {
    router.push({
      pathname: "/meditation-player",
      params: {
        title: meditation.title,
        subtitle: meditation.subtitle,
        audioUrl: meditation.audioUrl,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.text, { fontSize: 48 }]}>Medita</Text>
      <Text
        style={[
          styles.text,
          { color: "#64748b", fontSize: 18, marginBottom: 24 },
        ]}
      >
        Elige una meditación según lo que necesites hoy
      </Text>

      {meditations.map((item) => (
        <Pressable
          key={item.id}
          style={styles.card}
          onPress={() => handlePress(item)}
        >
          <View>
            <Text style={[styles.text, { fontSize: 20, marginBottom: 4 }]}>
              {item.title}
            </Text>
            <Text
              style={[
                styles.text,
                { fontSize: 14, marginBottom: 4, color: "#64748b" },
              ]}
            >
              {item.subtitle}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
  card: {
    backgroundColor: "#ebfbee",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#69db7c",
  },
  arrow: {
    fontSize: 26,
    color: "#40c057",
    fontWeight: "300",
  },
});
