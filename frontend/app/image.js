import React, { useState } from "react";
import { View, Button, Image, Text, Alert, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { analyzeFood } from "../lib/gemini";
import { API_URL } from "../config/api";

export default function ImageScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  

  const seleccionarImagen = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      setLoading(true);

      const analysis = await analyzeFood(result.assets[0].base64);

      if (!analysis) {
        setLoading(false);
        Alert.alert("Error", "No se pudo analizar la imagen");
        return;
      }
      const response = await fetch(`${API_URL}/nutrition/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analysis),
      });
      const data = await response.json();

      setLoading(false);

      if (!data.success) {
        Alert.alert("Error", data.message);
        return;
      }

      setResult(data.data);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, alignItems: "center" }}>
      <Button title="📸 Subir Imagen" onPress={seleccionarImagen} />

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: 280,
            height: 280,
            marginVertical: 20,
            borderRadius: 12,
          }}
        />
      )}

      {loading && (
        <Text style={{ marginTop: 20, fontSize: 16 }}>
          Analizando con Gemini...
        </Text>
      )}

      {result && (
        <View style={{ marginTop: 20, width: "100%" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Alimentos detectados
          </Text>

          {result.map((food, index) => (
            <View
              key={index}
              style={{
                marginTop: 15,
                padding: 12,
                borderWidth: 1,
                borderRadius: 10,
              }}
            >
              <Text>🍽️ {food.display_name}</Text>
              <Text>⚖️ {food.grams} g</Text>
              <Text>🔥 {food.calories} kcal</Text>
              <Text>🥩 {food.protein} g proteína</Text>
              <Text>🍚 {food.carbs} g carbs</Text>
              <Text>🥑 {food.fat} g grasa</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
