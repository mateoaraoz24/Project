import 'react-native-gesture-handler';
import { View } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { UserProvider } from "../context/userProvider";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";

export default function Layout() {
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });
  if (!loaded) return null;
  return (
    <View style={{ flex: 1, backgroundColor: "#050505" }}>
      <UserProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: "#fff" },
            headerTitle: "",
          }}
        />
      </UserProvider>
    </View>
  );
}
