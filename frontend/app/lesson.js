import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { apiFetch } from "../lib/sesion";
import { generateBookLesson } from "../lib/gemini";

export default function Lesson() {
  const { bookId, title, author, description, targetLessons } =
    useLocalSearchParams();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({
    lessons_viewed: 0,
    target_lessons: Number(targetLessons) || 12,
    reached_limit: false,
  });
  useEffect(() => {
    init();
  }, []);
  const init = async () => {
    setLoading(true);
    try {
      const progressRes = await apiFetch("/mental/books/progress");
      const progressData = await progressRes.json();
  
      if (progressData.success) {
        const currentBook = progressData.data.find(
          (b) => b.id === Number(bookId)
        );
        if (currentBook) {
          setProgress({
            lessons_viewed: currentBook.lessons_viewed,
            target_lessons: currentBook.target_lessons || 12,
            reached_limit: currentBook.reached_limit,
          });
        }
      }
      await loadLesson();
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const loadLesson = async () => {
    setLoading(true);
    try {
      const topicsRes = await apiFetch(
        `/mental/books/${bookId}/previous-topics`
      );
      const topicsData = await topicsRes.json();
      const previousTopics = topicsData.success ? topicsData.data : [];
      const result = await generateBookLesson(
        {
          title,
          author,
          description: description || "",
        },
        previousTopics,
        previousTopics.length >= (Number(targetLessons) || 12)
      );
      if (!result) {
        setLesson(null);
        return;
      }
      setLesson(result);
      await apiFetch("/mental/books/lesson", {
        method: "POST",
        body: JSON.stringify({
          book_id: Number(bookId),
          topic: result.topic,
          lesson: result.lesson,
        }),
      });
      setProgress((prev) => {
        const viewed = prev.lessons_viewed + 1;
        const target = prev.target_lessons;
        return {
          lessons_viewed: viewed,
          target_lessons: target,
          reached_limit: viewed >= target,
        };
      });
    } catch (e) {
      console.log("Error cargando lección:", e);
      setLesson(null);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={[styles.text,{ marginTop: 12 }]}>Cargando lección...</Text>
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={[styles.text, { fontSize: 30, fontWeight: "700" }]}>
        {title}
      </Text>
      <Text
        style={[
          styles.text,
          { color: "#868e96", marginTop: 4, marginBottom: 8 },
        ]}
      >
        {author}
      </Text>
      <Text style={[styles.text, { marginBottom: 16, color: "#495057" }]}>
        Lección {progress.lessons_viewed} de {progress.target_lessons}
      </Text>
      {progress.reached_limit && (
        <View style={styles.limit}>
          <Text style={[styles.text, { fontSize: 15 }]}>
            Has explorado las ideas principales de este libro. Puedes seguir
            sacando lecciones o cambiar de libro.
          </Text>
        </View>
      )}

      {lesson ? (
        <>
          <Text
            style={[
              styles.text,
              { fontSize: 18, fontWeight: "600", marginBottom: 10 },
            ]}
          >
            {lesson.topic}
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 26 }]}>
            {lesson.lesson}
          </Text>
        </>
      ) : (
        <Text style={[styles.text, { fontSize: 18 }]}>
          No se pudo generar la lección.
        </Text>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  text: {
    fontFamily: "Outfit_400Regular",
  },
  limit: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  loading:{ 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
}
});
