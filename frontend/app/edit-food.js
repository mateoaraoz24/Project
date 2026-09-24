import {
  Text,
  View,
  Image,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
} from "react-native";
import { useFoodStore } from "../store/foodStore";
import { useGlobalSearchParams, router } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config/api";
import { useState, useEffect } from "react";
export default function EditFood() {
  const params = useGlobalSearchParams();
  const foods = useFoodStore((state) => state.foods);
  const deleteFood = useFoodStore((state) => state.deleteFood);
  const image = params.imageUri || params.imageuri || null;
  const [mealName, setMealName] = useState(params.mealName || params.mealname);
  const [error, setError] = useState("");
  const [mealNameCreated, setMealNameCreated] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [categoryValue, setCategoryValue] = useState(
    params.mealType || "breakfast"
  );
  const [categoryItems, setCategoryItems] = useState([
    { label: "Desayuno", value: "breakfast" },
    { label: "Almuerzo", value: "lunch" },
    { label: "Cena", value: "dinner" },
    { label: "Snacks", value: "snacks" },
  ]);
  const resetFoods = useFoodStore((state) => state.resetFoods);
  const [saving, setSaving] = useState(false);
  const finalMealName = mealName || mealNameCreated;
  const isEditing = !!params.mealId;

  const uploadImage = async (localUri) => {
    const token = await SecureStore.getItemAsync("access_token");
    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      name: "meal.jpg",
      type: "image/jpeg",
    });

    const response = await fetch(`${API_URL}/nutrition/upload-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      setError("Error al subir la imagen");
      throw new Error(data.message || "Error subiendo imagen");
    }
    return data.data.url;
  };
  const handleSave = async () => {
    if (saving) return;
    if (!finalMealName || !finalMealName.trim()) {
      setError("Debes poner algun nombre para tu comida");
      return;
    }
    if (foods.length === 0) {
      setError("Debes añadir comidas");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let uploadedImageUrl = image;
      if (image && image.startsWith("file://")) {
        uploadedImageUrl = await uploadImage(image);
      }
      const token = await SecureStore.getItemAsync("access_token");
      const url = isEditing
        ? `${API_URL}/nutrition/meal/${params.mealId}`
        : `${API_URL}/nutrition/save`;
      const method = isEditing ? "PUT" : "POST";
      console.log(method)
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meal_name: finalMealName,
          meal_type: categoryValue,
          image_url: uploadedImageUrl || null,
          date: !isEditing ? params.date : undefined,
          foods: foods.map((f) => ({
            food_id: f.food_id || null,
            display_name: f.display_name,
            grams: f.grams,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
          })),
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        setError(data.message);
        return;
      }
      resetFoods();
      router.replace("/nutrition");
    } catch (e) {
      setError("Error al guardar la comida");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const response = await fetch(
        `${API_URL}/nutrition/meal/${params.mealId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (!data.success) {
        setError(data.message);
        return;
      }
      resetFoods();
      router.replace("/nutrition");
    } catch (e) {
      setError("Error al eliminar la comida");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      {image && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image }}
            resizeMode="cover"
            style={styles.img}
          />
        </View>
      )}
      <View
        style={[
          styles.datesContainer,
          image ? { marginTop: -30 } : { justifyContent: "center" },
        ]}
      >
        <DropDownPicker
          open={openCategory}
          value={categoryValue}
          items={categoryItems}
          setOpen={setOpenCategory}
          setValue={setCategoryValue}
          setItems={setCategoryItems}
          style={{ height: 50, borderWidth: 0 }}
          dropDownDirection={image ? "TOP" : "BOTTOM"}
          containerStyle={{ width: image ? "40%" : "60%" }}
          dropDownContainerStyle={{
            borderWidth: 1,
            borderColor: "#e9ecef",
            backgroundColor: "#fff",
          }}
          labelStyle={{
            textAlign: "left",
            fontFamily: "Outfit_400Regular",
            fontSize: image ? 16 : 20,
          }}
          zIndex={3100}
          zIndexInverse={1000}
        />
        {mealName ? (
          <Text style={[styles.text, { fontSize: 22, marginBottom: 10 }]}>
            {mealName}
          </Text>
        ) : (
          <TextInput
            value={mealNameCreated}
            onChangeText={setMealNameCreated}
            placeholder="Ex: Desayuno Nutritivo"
            style={styles.mealNameInput}
          />
        )}
        <View style={image ? { flex: 1 } : { maxHeight: 400 }}>
          <FlatList
            data={foods}
            keyExtractor={(item, index) =>
              `${item.food_id || "manual"}-${index}`
            }
            showsVerticalScrollIndicator={true}
            renderItem={({ item, index }) => (
              <Pressable
                style={styles.foodContainer}
                onPress={() =>
                  router.push({
                    pathname: "/edit-aliment",
                    params: { index_edited: index },
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.aliment}>
                    <Text
                      style={[styles.text, { fontSize: 16 }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.display_name}
                    </Text>
                    <View style={styles.inputContainer}>
                      <Text style={[styles.text, { fontSize: 16 }]}>
                        {item.grams}
                      </Text>
                      <Text style={styles.text}> g</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.macrosContainer}>
                  <Text style={styles.text}>{item.calories || 0} kcal</Text>
                  <View style={styles.macros}>
                    <Text style={[styles.text, { color: "#2f9e44" }]}>
                      P: {item.protein || 0}g
                    </Text>
                    <Text style={[styles.text, { color: "#9c36b5" }]}>
                      C: {item.carbs || 0}g
                    </Text>
                    <Text style={[styles.text, { color: "#f08c00" }]}>
                      G: {item.fat || 0}g
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => deleteFood(index)}>
                  <MaterialIcons
                    name="delete-outline"
                    size={24}
                    color="#e03131"
                    style={{ padding: 5 }}
                  />
                </Pressable>
              </Pressable>
            )}
          />
        </View>
      </View>
      {error && <Text>{error}</Text>}
      <View style={styles.buttonContainer}>
        {isEditing && (
          <Pressable
            style={[styles.button, { borderColor: "#e03131" }]}
            onPress={handleDelete}
          >
            <Text style={[styles.text, { fontSize: 18, color: "#e03131" }]}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.button, { borderColor: "#099268" }]}
          onPress={() => router.push("/search-food")}
        >
          <Text style={[styles.text, { fontSize: 18, color: "#099268" }]}>
            + Alimento
          </Text>
        </Pressable>
        <Pressable
          style={[styles.button, { borderColor: "#e8590c" }]}
          onPress={handleSave}
        >
          <Text style={[styles.text, { fontSize: 18, color: "#e8590c" }]}>
            {saving ? "Guardando" : "Guardar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    paddingVertical: 25,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    flex: 1,
  },
  aliment: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    maxWidth: 100,
  },
  imageContainer: {
    width: "100%",
    height: 325,
  },
  img: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  datesContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderRadius: 18,
    paddingHorizontal: 10,
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  inputContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 5,
    maxWidth: 120,
    alignItems: "center",
  },
  mealNameInput: {
    fontFamily: "Outfit_400Regular",
    fontSize: 28,
    marginBottom: 10,
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
  buttonContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 15,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderRadius: 8,
  },
});
