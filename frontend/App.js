import React, { useState, useEffect, useRef } from "react";
import { View, StatusBar, Animated } from "react-native";
import AnimatedCircle from "./components/AnimatedCircle";
import AnimatedTextBlock from "./components/AnimatedText";

export default function App() {
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
  const circleColor = index >= 2 
  ? "#FFFFFF" 
  : "rgba(255,255,255,0.15)";
  const textColor = isFlashActive ? "#000" : "#FFF";

  return (
    <View style={{ flex: 1, backgroundColor: "#050505"}}>
      <StatusBar barStyle={isFlashActive ? "dark-content" : "light-content"} />

      <AnimatedCircle scaleAnim={scaleAnim} color={circleColor} />

      <AnimatedTextBlock
        mensajes={mensajes}
        index={index}
        fadeAnim={fadeAnim}
        textColor={textColor}
        isFlashActive={isFlashActive}
      />
    </View>
  );
}
