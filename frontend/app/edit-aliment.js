import { Pressable, Text, TextInput, View, StyleSheet } from "react-native";
import { useGlobalSearchParams, router } from "expo-router";
import { useFoodStore } from "../store/foodStore";
import { useState } from "react";
import { PieChart } from "react-native-gifted-charts";
export default function EditAliment() {
  const params = useGlobalSearchParams();
  const index = parseInt(params.index_edited, 10);
  const foods = useFoodStore((state) => state.foods);
  const updateFoodGrams = useFoodStore((state) => state.updateFoodGrams);
  const deleteFood = useFoodStore((state) => state.deleteFood);
  const item = foods[index];
  const currentGrams = item?.grams || 100;
  const baseMacros = {
    kcal: item?.base_kcal || 0,
    protein: item?.base_protein || 0,
    carbs: item?.base_carbs || 0,
    fat: item?.base_fat || 0,
  };
  const [grams, setGrams] = useState(String(currentGrams));
  const numericalGrams = parseInt(grams, 10) || 0;
  const displayKcal = Math.round(baseMacros.kcal * numericalGrams);
  const displayProtein = Math.round(baseMacros.protein * numericalGrams);
  const displayCarbs = (baseMacros.carbs * numericalGrams).toFixed(1);
  const displayFat = (baseMacros.fat * numericalGrams).toFixed(1);
  const [chartGrams, setChartGrams] = useState(
    parseInt(params.grams, 10) || 100
  );
  const pieData = [
    { value: Math.max(0.1, baseMacros.protein * chartGrams), color: "#2f9e44" },
    { value: Math.max(0.1, baseMacros.carbs * chartGrams), color: "#9c36b5" },
    { value: Math.max(0.1, baseMacros.fat * chartGrams), color: "#f08c00" },
  ];

  const handleSave = () => {
    updateFoodGrams(index, numericalGrams);
    router.back();
  };
  const handleDelete = () => {
    deleteFood(index);
    router.back();
  };
  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Alimento no encontrado</Text>
        <Pressable
          style={[styles.button, { borderColor: "#e8590c" }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.text, { color: "#e8590c" }]}>Volver</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: 30 }]}>{item.display_name}</Text>
      <View style={styles.gramsContainer}>
        <View style={styles.editGramsContainer}>
          <TextInput
            value={grams}
            style={styles.input}
            keyboardType="numeric"
            onChangeText={setGrams}
          />
          <Text style={styles.text}>g</Text>
        </View>
        <PieChart
          data={pieData}
          radius={75}
          donut
          innerRadius={48}
          innerCircleColor={"#ffffff"}
        />
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.infoSubContainer}>
          <View style={styles.macroInfo}>
            <Text style={styles.text}>{displayProtein}g</Text>
            <Text style={[styles.text, { color: "#2f9e44" }]}>Proteina</Text>
          </View>
          <View style={styles.macroInfo}>
            <Text style={styles.text}>{displayCarbs}g</Text>
            <Text style={[styles.text, { color: "#9c36b5" }]}>Carbos</Text>
          </View>
        </View>
        <View style={styles.infoSubContainer}>
          <View style={styles.macroInfo}>
            <Text style={styles.text}>{displayFat}g</Text>
            <Text style={[styles.text, { color: "#f08c00" }]}>Grasas</Text>
          </View>
          <View style={styles.macroInfo}>
            <Text style={styles.text}>{displayKcal}</Text>
            <Text style={[styles.text, { color: "#1971c2" }]}>Kcal</Text>
          </View>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, { borderColor: "#e03131" }]}
          onPress={handleDelete}
        >
          <Text style={[styles.text, { color: "#e03131" }]}>Eliminar</Text>
        </Pressable>
        <Pressable
          style={[styles.button, { borderColor: "#e8590c" }]}
          onPress={handleSave}
        >
          <Text style={[styles.text, { color: "#e8590c" }]}>Guardar</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  text: {
    fontFamily: "Outfit_400Regular",
    fontSize: 18,
  },
  gramsContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  editGramsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 25,
  },
  infoSubContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 30,
  },
  macroInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    borderWidth: 2,
    borderColor: "#000",
    width: 75,
    textAlign: "center",
    fontFamily: "Outfit_400Regular",
    fontSize: 18,
    borderRadius: 12,
  },
  buttonContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 15,
    paddingTop: 25,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderWidth: 2,
    borderRadius: 8,
  },
});
