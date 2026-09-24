import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { useFoodStore } from "../store/foodStore";
import { API_URL } from "../config/api";
import { router } from "expo-router";
export default function SearchFood() {
  const addFood = useFoodStore((state) => state.addFood);
  const foods = useFoodStore((state) => state.foods);
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const info = {
    huevo: "1 huevo mediano equivale aproximadamente a 50-55g",
    platano: "1 plátano mediano equivale aproximadamente a 120-130g",
    arroz: "1 taza de arroz cocido equivale aproximadamente a 200g",
    pollo: "1 pechuga de pollo mediana equivale aproximadamente a 150-180g",
    manzana: "1 manzana mediana equivale aproximadamente a 150-180g",
    pan: "1 rebanada de pan equivale aproximadamente a 30-35g",
    leche: "1 vaso de leche equivale aproximadamente a 240ml",
    yogurt: "1 pote de yogurt griego equivale aproximadamente a 150-170g",
    pasta: "1 taza de pasta cocida equivale aproximadamente a 200g",
    carne: "1 filete de carne mediano equivale aproximadamente a 150-200g",
    aguacate: "1/2 aguacate equivale aproximadamente a 100g",
    tomate: "1 tomate mediano equivale aproximadamente a 120-150g",
    zanahoria: "1 zanahoria mediana equivale aproximadamente a 60-70g",
    papas: "1 papa mediana equivale aproximadamente a 150g",
    queso: "1 porción de queso equivale aproximadamente a 30g",
  };
  const onSelectFood = (item) => {
    const newIndex = addFood(item);
    router.replace({
      pathname: "/edit-aliment",
      params: { index_edited: newIndex },
    });
  };
  const onSearch = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/nutrition/search?${new URLSearchParams({
          q: searchValue,
        })}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoading(false);
    }
  };
  const getPortionInfo = (value) => {
    if (!value) return null;
    const lowerSearch = value.toLowerCase().trim();
    const keys = Object.keys(info).sort((a, b) => b.length - a.length);

    for (const key of keys) {
      if (lowerSearch.includes(key)) {
        return info[key];
      }
    }
    return null;
  };
  const portionInfo = getPortionInfo(searchValue);
  return (
    <View style={styles.container}>
      <View style={styles.searcherContainer}>
        <TextInput
          value={searchValue}
          onChangeText={setSearchValue}
          keyboardType="default"
          placeholder="ex: huevo o carne cocida"
          style={[
            styles.search,
            { fontFamily: "Outfit_400Regular", fontSize: 16, flex: 1 },
          ]}
        />
        <Pressable onPress={onSearch} style={styles.search}>
          <Text
            style={[
              styles.text,
              {
                fontSize: 16,
                color: "#099268",
                width: 85,
                textAlign: "center",
              },
            ]}
          >
            {loading ? "Buscando..." : "Buscar"}
          </Text>
        </Pressable>
      </View>
      {portionInfo && !loading && results && (
        <View style={styles.infoContainer}>
          <View style={styles.infoIcon}>
            <Text style={[styles.text, { color: "#9c36b5", fontSize: 16 }]}>
              i
            </Text>
          </View>
          <Text
            style={[styles.text, { color: "#9c36b5", flex: 1, fontSize: 16 }]}
          >
            {portionInfo}
          </Text>
        </View>
      )}
      <View>
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.food_id}-${index}`}
          style={{ maxHeight: 500 }}
          renderItem={({ item, index }) => (
            <Pressable
              style={styles.foodContainer}
              onPress={() => onSelectFood(item)}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.aliment}>
                  <Text
                    style={[styles.text, { fontSize: 16 }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.food_name}
                  </Text>
                  <View style={styles.gramsContainer}>
                    <Text style={[styles.text, { fontSize: 16 }]}>100</Text>
                    <Text style={styles.text}> g</Text>
                  </View>
                </View>
              </View>
              <View style={styles.macrosContainer}>
                <Text style={styles.text}>
                  {item.calories_per_100g || 0} kcal
                </Text>
                <View style={styles.macros}>
                  <Text style={[styles.text, { color: "#2f9e44" }]}>
                    P: {item.protein_per_100g || 0}g
                  </Text>
                  <Text style={[styles.text, { color: "#9c36b5" }]}>
                    C: {item.carbs_per_100g || 0}g
                  </Text>
                  <Text style={[styles.text, { color: "#f08c00" }]}>
                    G: {item.fat_per_100g || 0}g
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    flex: 1,
    gap: 15,
    justifyContent: "center",
  },
  aliment: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    maxWidth: 100,
  },
  gramsContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 5,
    maxWidth: 120,
    alignItems: "center",
  },
  text: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
  },
  foodContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    gap: 2,
    borderColor: "#000",
    borderRadius: 8,
    marginBottom: 10,
    padding: 8,
  },
  foodList: {
    flex: 1,
  },
  macrosContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  macros: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  searcherContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    gap: 5,
  },
  search: {
    borderWidth: 2,
    borderColor: "#099268",
    paddingVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  infoContainer: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: "#9c36b5",
    display: "flex",
    flexDirection: "row",
    borderRadius: 12,
    gap: 15,
    alignItems: "center",
  },
  infoIcon: {
    borderWidth: 2,
    borderColor: "#9c36b5",
    borderRadius: 16,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});
