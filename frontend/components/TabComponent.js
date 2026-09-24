import { View } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
export const renderIcon = (name, bgcolor) => {
  return ({ focused }) => (
    <View
      style={{
        backgroundColor: focused ? `${bgcolor}` : "transparent",
        width: 65,
        height: 45,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
      }}
    >
      <FontAwesome6 name={name} size={20} color={focused ? "#fff" : "#000"} />
    </View>
  );
};
