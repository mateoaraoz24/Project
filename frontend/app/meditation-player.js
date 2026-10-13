import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function MeditationPlayer() {
  const { title, subtitle, audioUrl } = useLocalSearchParams();
  const router = useRouter();

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let currentSound = null;
    const loadAudio = async () => {
      try {
        if (!audioUrl) {
          if (isMounted) setIsLoading(false);
          return;
        }
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false, 
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          (status) => {
            if (status.didJustFinish && isMounted) {
              router.replace("/spiritual");
            }
          }
        );
        currentSound = newSound;
        if (isMounted) {
          setSound(newSound);
          setIsPlaying(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.log("Error cargando audio:", error);
        if (isMounted) setIsLoading(false);
      }
    };
    loadAudio();
    return () => {
      isMounted = false;
      if (currentSound) {
        currentSound.stopAsync();
        currentSound.unloadAsync();
      }
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2f9e44" style={{ marginTop: 60 }} />
        ) : (
          <Pressable
            style={styles.playButton}
            onPress={togglePlayPause}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? "Pausar" : "Reproducir"}
            </Text>
          </Pressable>
        )}

        <Text style={styles.hint}>
          Al terminar la meditación serás dirigido automáticamente
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#b2f2bb",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1e1e1e",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#343a40",
    textAlign: "center",
    marginBottom: 60,
  },
  playButton: {
    backgroundColor: "#40c057",
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 50,
  },
  playButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  hint: {
    position: "absolute",
    bottom: 50,
    color: "#343a40",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 30,
  },
});