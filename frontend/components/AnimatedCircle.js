import React from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function AnimatedCircle({ scaleAnim, color }) {
  return (
    <View style={styles.centerWrapper}>
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrapper: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    shadowColor: "#fff",
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
});
