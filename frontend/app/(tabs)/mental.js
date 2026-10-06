import { Pressable, Text, FlatList, View, StyleSheet, ActivityIndicator } from "react-native";
import { apiFetch } from "../../lib/sesion";
import { useEffect, useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
export default function Mental() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [])
  );

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/mental/books/progress");
      const data = await response.json();
      if (data.success) {
        setBooks(data.data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9c36b5" />
        <Text style={[styles.text, { marginTop: 12, color: "#868e96" }]}>
          Cargando...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: 55 }]}>Mental</Text>
      <Pressable
        style={[styles.button, { borderColor: "#9c36b5" }]}
        onPress={() =>
          router.push({
            pathname: "/dailyAdvice",
          })
        }
      >
        <Text
          style={[
            styles.text,
            { fontSize: 20, textAlign: "center", color: "#9c36b5" },
          ]}
        >
          Consejo del dia
        </Text>
      </Pressable>
      <View style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Text style={[styles.text, { fontSize: 30 }]}>Libros</Text>
        <FlatList
          data={books}
          keyExtractor={(item) => item.id.toString()}
          style={{ maxHeight: 350 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/lesson",
                  params: {
                    bookId: item.id,
                    title: item.title,
                    author: item.author,
                    description: item.description || "",
                    targetLessons: item.target_lessons || 12,
                  },
                })
              }
              style={[
                styles.book,
                {
                  borderColor: item.lessons_viewed > 0 ? "#e8590c" : "#868e96",
                },
              ]}
            >
              <Text style={[styles.text, { fontSize: 17, fontWeight: "600" }]}>
                {item.title}
              </Text>
              <Text style={[styles.text, { color: "#868e96", marginTop: 4 }]}>
                {item.author}
              </Text>
              <Text
                style={[
                  styles.text,
                  {
                    marginTop: 6,
                    color: item.lessons_viewed > 0 ? "#1971c2" : "#495057",
                  },
                ]}
              >
                {item.lessons_viewed} / {item.target_lessons} lecciones
              </Text>
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
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 15,
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
  button: {
    paddingVertical: 15,
    borderWidth: 2,
    borderRadius: 8,
  },
  book: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
