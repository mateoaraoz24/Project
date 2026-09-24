import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useUser } from "../context/userProvider";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Pressable,
} from "react-native";

const { width } = Dimensions.get("window");
const DEFAULT_COLOR = "#111827";
export default function AnimationPhysique() {
  const { user } = useUser();
  const scenes = [
    {
      text: "Tu físico no es casualidad",
      size: 42,
      icon: "none",
      color: DEFAULT_COLOR,
    },
    {
      text: "Es el resultado",
      size: 56,
      icon: "none",
      color: DEFAULT_COLOR,
    },
    {
      text: "De cada decisión",
      size: 56,
      icon: "none",
      color: DEFAULT_COLOR,
    },
    {
      text: "La persona que quieres ser...",
      size: 44,
      icon: "none",
      color: DEFAULT_COLOR,
    },
    {
      text: "Tiene un físico fuerte",
      size: 38,
      icon: "bar",
      label: "FUERZA",
      value: 0.9,
      color: "#fa5252",
    },
    {
      text: "Tiene una mente enfocada",
      size: 38,
      icon: "bar",
      label: "ENFOQUE",
      value: 0.85,
      color: "#fab005",
    },
    {
      text: "Tiene disciplina",
      size: 38,
      icon: "bar",
      label: "DISCIPLINA",
      value: 0.95,
      color: "#da77f2",
    },
    {
      text: "Tiene energía para hacer las cosas",
      size: 40,
      icon: "bar",
      label: "ENERGÍA",
      value: 1,
      color: "#4dabf7",
    },
    {
      text: "Cada entrenamiento cuenta",
      size: 48,
      icon: "none",
      color: DEFAULT_COLOR,
    },

    {
      text: "Cada día suma",
      size: 60,
      icon: "none",
      color: DEFAULT_COLOR,
    },
    {
      text: user
        ? `${user.user.username.toUpperCase()} ES IMPARABLE!`
        : "TU ERES IMPARABLE",
      size: 70,
      icon: "pulse",
      color: DEFAULT_COLOR,
    },
  ];
  const timeoutRef = useRef(null);
  const [scene, setScene] = useState(0);
  const [finished, setFinished] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const translateY = useRef(new Animated.Value(60)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;
  const onFinish = async () => {
    await SecureStore.setItemAsync("physique_animation_seen", "true");
    router.replace("/physique-form");
  };
  useEffect(() => {
    const checkStatus = async () => {
      const animationSeen = await SecureStore.getItemAsync(
        "physique_animation_seen"
      );
      const physiqueCompleted = await SecureStore.getItemAsync(
        "physique_completed"
      );
      if (physiqueCompleted) {
        router.replace("/physical");
        return;
      }
      if (animationSeen) {
        router.replace("/physique-form");
        return;
      }
    };
    checkStatus();
  }, []);
  useEffect(() => {
    playScene(0);
    return () => clearTimeout(timeoutRef.current);
  }, []);
  const playScene = (index) => {
    opacity.setValue(0);
    scale.setValue(0.7);
    translateY.setValue(60);
    glow.setValue(0);
    barAnim.setValue(0);
    pulseAnim.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(glow, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(glow, {
        toValue: 0.3,
        duration: 1200,
        useNativeDriver: false,
      }),
    ]).start();

    const icon = scenes[index].icon;
    if (icon === "bar") {
      Animated.timing(barAnim, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else if (icon === "pulse") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 700,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    const delay = index >= scenes.length - 2 ? 2800 : 2200;
    timeoutRef.current = setTimeout(() => {
      if (index < scenes.length - 1) {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setScene(index + 1);
          playScene(index + 1);
        });
      } else {
        setFinished(true);
        buttonOpacity.setValue(0);
        buttonScale.setValue(0.5);
        Animated.parallel([
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(buttonScale, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, delay);
  };

  const current = scenes[scene];
  const accent = current.color;

  const interpolatedBg = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["#fafafa", "#f5f5f5"],
  });

  const renderIcon = () => {
    if (current.icon === "bar") {
      const widthAnim = barAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", `${current.value * 100}%`],
      });
      return (
        <View style={styles.barWrapper}>
          <Text style={[styles.barLabel, { color: accent }]}>
            {current.label}
          </Text>
          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                { width: widthAnim, backgroundColor: accent },
              ]}
            />
          </View>
          <Text style={[styles.barPercent, { color: accent }]}>
            {Math.round(current.value * 100)}%
          </Text>
        </View>
      );
    }

    if (current.icon === "pulse") {
      const pulseScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.4],
      });
      const pulseOpacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 0],
      });
      return (
        <View style={styles.pulseWrapper}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                borderColor: accent,
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <View style={[styles.pulseCore, { backgroundColor: accent }]} />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: interpolatedBg }]}
      />
      <View style={styles.progressRow}>
        {scenes.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor: i <= scene ? accent : "rgba(0,0,0,0.1)",
                width: i === scene ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>

      {current.icon !== "none" && (
        <View style={styles.iconArea}>{renderIcon()}</View>
      )}

      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Text style={[styles.text, { fontSize: current.size }]}>
          {current.text}
        </Text>
      </Animated.View>

      {finished && (
        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ scale: buttonScale }, { translateY }],
          }}
        >
          <Pressable
            style={[styles.button, { borderColor: accent }]}
            onPress={() => onFinish()}
          >
            <Text style={[styles.buttonText, { color: accent }]}>
              EMPEZAR HOY
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    overflow: "hidden",
    gap: 16,
  },
  text: {
    color: "#111827",
    fontFamily: "Outfit_700Bold",
    textAlign: "center",
    letterSpacing: -1,
  },
  button: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 2,
  },
  progressRow: {
    position: "absolute",
    top: 60,
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  iconArea: {
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  barWrapper: {
    width: width * 0.7,
    alignItems: "center",
  },
  barLabel: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 8,
  },
  barTrack: {
    width: "100%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 7,
  },
  barPercent: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "900",
  },
  pulseWrapper: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
  },
  pulseCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
