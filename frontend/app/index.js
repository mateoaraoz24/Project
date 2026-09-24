import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StatusBar,
  Animated,
  Text,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import AnimatedCircle from "../components/AnimatedCircle";
import AnimatedTextBlock from "../components/AnimatedText";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

export default function Index() {
  const [index, setIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const mensajes = [
    "La mayoría vive en piloto automático...",
    "Siguiendo vidas monotonas.",
    "Pero el cambio depende de ti.",
    "Tú tienes el control de tu evolución.",
  ];

  useEffect(() => {
    const initialize = async () => {
      const hasSeenIntro = await SecureStore.getItemAsync("has_seen_intro");
      const token = await SecureStore.getItemAsync("access_token");

      if (hasSeenIntro === "true") {
        if (token) {
          router.replace("/home");
        } else {
          router.replace("/login");
        }
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const finishIntro = async () => {
      if (index >= mensajes.length) {
        const token = await SecureStore.getItemAsync("access_token");
        await SecureStore.setItemAsync("has_seen_intro", "true");
        if (token) {
          router.replace("/home");
        }
      }
    };
    finishIntro();
  }, [index]);

  useEffect(() => {
    if (index < mensajes.length) {
      fadeAnim.setValue(0);

      let targetScale = 1;
      let duration = 2000;

      if (index === 0) targetScale = 1.2;
      if (index === 1) targetScale = 1.5;
      if (index === 2) targetScale = 7;
      if (index === 3) targetScale = 7;

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: targetScale,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => setIndex((prev) => prev + 1));
        }, 2000);
      });
    }
  }, [index]);

  const isFlashActive = index >= 2;
  const circleColor = index >= 2 ? "#fff" : "rgba(255,255,255,0.15)";
  const textColor = isFlashActive ? "#000" : "#fff";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={{
          ...styles.container,
          backgroundColor: index >= mensajes.length ? "#fff" : "#050505",
        }}
      >
        <StatusBar barStyle={"light-content"} />

        {index < mensajes.length && (
          <AnimatedCircle scaleAnim={scaleAnim} color={circleColor} />
        )}

        <AnimatedTextBlock
          mensajes={mensajes}
          index={index}
          fadeAnim={fadeAnim}
          textColor={textColor}
          isFlashActive={isFlashActive}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
