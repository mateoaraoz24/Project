import { Pressable, Text, View } from "react-native";
import {router} from 'expo-router'
export default function Physical() {
  return (
    <View>
      <Text>Hola espiritual</Text>
      <Pressable onPress={()=>router.push("/test-input")}><Text>nose</Text></Pressable>
    </View>
  );
}

