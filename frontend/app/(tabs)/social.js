import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
export default function Physical() {
  return (
    <View>
      <Text>Hola social</Text>
      <Pressable onPress={() => router.replace("/image")}><Text>Image</Text></Pressable>
    </View>
  );
}
