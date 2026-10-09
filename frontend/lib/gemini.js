import { GEMINI_API_KEY } from "@env";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const analyzeFood = async (base64Image) => {
  const prompt = `
  Analiza esta fotografía de comida con el mayor detalle posible.
  Identifica todos los alimentos visibles y estima el peso de la parte comestible de cada uno.
  Reglas estrictas:
  - Estima únicamente la parte visible del alimento.
  - No supongas comida oculta debajo de otros alimentos.
  - No asumas altura o profundidad que no pueda observarse claramente.
  - Si existe duda, subestima antes que sobreestimar.
  - No utilices el tamaño del plato como referencia principal.
  - Prioriza el tamaño visible de cada alimento respecto a los demás alimentos presentes.
  - No generes pesos fuera de rangos realistas salvo que la imagen lo demuestre claramente.
  - Cuando exista incertidumbre en la cantidad, elige siempre la estimación más conservadora.
  - La estimación debe corresponder solamente a la porción visible en la fotografía.
  - Estima pesos realistas usando números específicos (ej: 87g, 134g, 176g, 219g, 68g). Evita números redondos como 100g, 150g o 200g por defecto.
  - Cada alimento debe ser independiente. No combines alimentos (por ejemplo, nunca devuelvas "arroz con pollo").
  - No dupliques alimentos. Si un alimento ya fue identificado, no lo vuelvas a incluir con otro nombre.
  - Solo incluye alimentos claramente visibles o altamente probables. No inventes ingredientes ocultos.
  - Si hay aceite, mantequilla, salsa o aderezo visible o claramente utilizado, inclúyelo como un alimento separado.
  - display_name debe ser un nombre natural y amigable en español.
  - search_name DEBE estar SIEMPRE en inglés, independientemente del idioma de la conversación.
  - Utiliza el nombre más común en bases de datos nutricionales como FatSecret.
  - Incluye el método de cocción cuando sea claramente visible (grilled, fried, boiled, baked, roasted, steamed, etc.).
  - Ejemplos válidos:
    • grilled chicken breast
    • white rice
    • scrambled eggs
    • olive oil
    • baked potato
    • broccoli
  - Nunca utilices español en search_name.
  - Si el método de cocción no puede determinarse con suficiente certeza, utiliza el nombre genérico en inglés (por ejemplo, "chicken breast" en lugar de inventar "grilled chicken breast").
  IMPORTANTE:
  - display_name está en español.
  - search_name está SIEMPRE en inglés.
  - confidence representa tu nivel de certeza sobre la identificación del alimento y la estimación del peso (0.0 = muy incierto, 1.0 = muy seguro).
  - Si la imagen NO contiene ningún alimento comestible (ej: un zapato, una persona, una mesa vacía, un carro), establece "is_food" en false y deja el arreglo "foods" vacío.
  - Si la imagen SÍ contiene comida, establece "is_food" en true y devuelve los alimentos normalmente.
  - Si un alimento proteico (carne molida, pollo, res, cerdo) está mezclado con salsa, identifícalo SIEMPRE por el nombre de la carne pura cocida (ej: "ground beef") para no arruinar el cálculo de proteína.
  - Trata las salsas de tomate, aceites o aderezos como un ingrediente totalmente SEPARADO en la lista, estimando su propio peso por separado. Nunca fusiones la carne con la salsa en un mismo item de búsqueda.
  Devuelve ÚNICAMENTE este JSON válido, sin texto adicional, sin markdown:
  {
    "is_food": true,
    "meal_name": "Nombre global del plato en español (ej: Arroz con pollo desmenuzado)",
    "foods": [
      {
        "display_name": "",
        "search_name": "",
        "estimated_grams": 0,
        "confidence": 0.0
      }
    ]
  }
  `;
  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              is_food: { type: "BOOLEAN" },
              meal_name: { type: "STRING" },
              foods: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    display_name: { type: "STRING" },
                    search_name: { type: "STRING" },
                    estimated_grams: { type: "NUMBER" },
                    confidence: { type: "NUMBER" },
                  },
                  required: [
                    "display_name",
                    "search_name",
                    "estimated_grams",
                    "confidence",
                  ],
                },
              },
            },
            required: ["is_food", "meal_name", "foods"],
          },
        },
      }),
    });

    const data = await response.json();
    if (!data || !data.candidates || data.candidates.length === 0) {
      console.log("⚠️ Error crudo de la API de Google:", data);
      return null;
    }

    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini no devolvió candidatos válidos:", data);
      return null;
    }
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Error con Gemini:", error);
    return null;
  }
};
export const generateBookLesson = async (
  book,
  previousTopics,
  reachedLimit = false
) => {
  const prompt = reachedLimit
    ? `
      El usuario ya exploró bastantes lecciones de "${book.title}" de ${book.author}.
      Ahora dame una forma práctica de APLICAR las ideas de este libro en la vida real esta semana.
      Sé concreto y accionable.
      Máximo 550 palabras.
    `
    : `
      Genera una lección breve (máximo 550 palabras) del libro "${
        book.title
      }" de ${book.author}.
      Descripción: ${book.description}

      Ya se mostraron estos temas, NO los repitas: ${
        previousTopics.length > 0 ? previousTopics.join(", ") : "ninguno"
      }

      Responde en español, tono del autor, aplicable a la vida diaria.
    `;
  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              topic: { type: "STRING" },
              lesson: { type: "STRING" },
            },
            required: ["topic", "lesson"],
          },
        },
      }),
    });

    const data = await response.json();
    if (!data?.candidates?.length) {
      console.log("Error de Gemini:", data);
      return null;
    }
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Error generando lección:", error);
    return null;
  }
};

export const generateDailyAdvice = async () => {
  const prompt = `
  Genera un consejo motivacional breve (máximo 200 palabras) sobre disciplina,
  fuerza mental, optimismo o crecimiento personal, en español, con un tono directo e inspirador.
  Responde solo con el texto del consejo, sin comillas ni formato adicional.
  `;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    if (!data?.candidates?.length) {
      console.log("Error de Gemini:", data);
      return null;
    }
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error("Error generando consejo:", error);
    return null;
  }
};

export const transcribeAudio = async (base64Audio, mimeType = "audio/mp4") => {
  const prompt =
    "Transcribe este audio en español de forma literal. Devuelve solo el texto transcrito, sin comentarios ni formato adicional.";

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Audio } },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!data?.candidates?.length) {
      console.log("Error de Gemini:", data);
      return null;
    }
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error("Error transcribiendo audio:", error);
    return null;
  }
};
export const generateSocialProfile = async (onboardingText) => {
  const prompt = `
Eres el módulo de análisis social de una aplicación de desarrollo personal.
Tu trabajo es comprender la situación social del usuario y convertirla en un punto de partida útil para su mejora.

CONTEXTO DE LA APLICACIÓN
La aplicación busca ayudar a las personas a conocerse mejor, desarrollar habilidades sociales reales y mejorar mediante pequeñas acciones constantes. No busca crear personas perfectas, extrovertidas a la fuerza ni dependientes de la aprobación de los demás.

INFORMACIÓN DEL USUARIO
<user_input>
${onboardingText}
</user_input>

QUÉ DEBES ANALIZAR
- Qué situaciones sociales le resultan fáciles o difíciles.
- Qué habilidades quiere desarrollar.
- Qué obstáculos menciona explícitamente.
- Qué fortalezas, experiencias o recursos personales pueden ayudarle.
- Qué áreas de mejora tienen mayor utilidad para su vida cotidiana.

No confundas ser introvertido con tener un problema social.
No inventes inseguridades, emociones, experiencias ni intenciones.
No diagnostiques trastornos ni etiquetes la personalidad.
Si falta información, trabaja únicamente con lo que sabes.
No conviertas cada dificultad en un defecto: identifica oportunidades concretas de aprendizaje.

REGLAS
- Español natural, cercano y respetuoso.
- El resumen describe la situación, no juzga.
- Entre 2 y 5 focus_areas.
- Cada área = habilidad práctica, no etiqueta vaga.
- Prioriza lo que el usuario expresó.
- No des retos ni lecciones todavía.
`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              summary: { type: "STRING" },
              focus_areas: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
            },
            required: ["summary", "focus_areas"],
          },
        },
      }),
    });

    const data = await response.json();
    if (!data?.candidates?.length) {
      console.log("Error Gemini profile:", data);
      return null;
    }
    return JSON.parse(data.candidates[0].content.parts[0].text.trim());
  } catch (e) {
    console.error("Error generateSocialProfile:", e);
    return null;
  }
};

export const generateMonthlyChallenge = async (profile) => {
  const prompt = `
Eres el entrenador de habilidades sociales de una aplicación de desarrollo personal.
Diseña UN reto de 30 días para mejorar una habilidad social mediante práctica real.

PERFIL DEL USUARIO
<profile>
${JSON.stringify(profile)}
</profile>

BASE DE APRENDIZAJE
Inspírate en principios generales de:
- Dale Carnegie: escucha activa, interés genuino, apreciación sincera.
- Daniel Goleman: conciencia emocional y empatía.
- Stephen Covey: iniciativa y responsabilidad personal.

No inventes citas ni reproduzcas libros.

El reto debe:
- Centrarse en un área prioritaria del perfil.
- Ser concreto y sostenible 30 días.
- Practicable en vida cotidiana.
- Medible por acciones observables del usuario.
- No exigir resultados de otras personas ni aprobación externa.
- No fomentar manipulación ni comparación.
`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" },
            },
            required: ["title", "description"],
          },
        },
      }),
    });

    const data = await response.json();
    if (!data?.candidates?.length) {
      console.log("Error Gemini monthly:", data);
      return null;
    }
    return JSON.parse(data.candidates[0].content.parts[0].text.trim());
  } catch (e) {
    console.error("Error generateMonthlyChallenge:", e);
    return null;
  }
};

export const generateDailyChallenge = async (profile, monthly) => {
  const prompt = `
Eres el entrenador diario de habilidades sociales de una aplicación de desarrollo personal.
Genera UN reto para hoy y UNA mini-lección.
PERFIL
<profile>
${JSON.stringify(profile)}
</profile>

RETO MENSUAL ACTUAL
<monthly_challenge>
${JSON.stringify(monthly)}
</monthly_challenge>

FUENTES DE INSPIRACIÓN
Inspírate en los principios generales de:
1. "Cómo ganar amigos e influir sobre las personas", de Dale Carnegie
2. "Inteligencia emocional", de Daniel Goleman
3. "Los 7 hábitos de la gente altamente efectiva", de Stephen Covey

Utiliza estos principios para crear enseñanzas originales.
No inventes citas ni reproduzcas texto de los libros.

El reto debe:
- Estar conectado con una de las áreas del perfil.
- Contribuir al reto mensual cuando tenga sentido.
- Poder completarse hoy en una situación cotidiana.
- Ser concreto: el usuario debe saber exactamente qué intentar.
- Tener una dificultad de 1 a 3:
  1 = muy sencillo y accesible;
  2 = requiere un pequeño esfuerzo;
  3 = supone salir moderadamente de la zona de comodidad.
- Respetar los límites, preferencias y circunstancias del usuario.

La mini-lección debe:
- Enseñar un principio útil y explicar por qué funciona.
- Dar una forma concreta de aplicar ese principio.
- Relacionarse directamente con el reto de hoy.
- Ayudar al usuario a comprender la habilidad, no solo a obedecer
  instrucciones.
- Ser breve, pero aportar una idea que pueda recordar y utilizar
  en futuras situaciones.

Estilo: español natural, directo, sin toxicidad ni presión social.
`;
try {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            description: { type: "STRING" },
            skill: { type: "STRING" },
            difficulty: { type: "NUMBER" },
            mini_lesson_title: { type: "STRING" },
            mini_lesson_content: { type: "STRING" },
          },
          required: [
            "title",
            "description",
            "skill",
            "difficulty",
            "mini_lesson_title",
            "mini_lesson_content",
          ],
        },
      },
    }),
  });

  const data = await response.json();
  if (!data?.candidates?.length) {
    console.log("Error Gemini daily:", data);
    return null;
  }
  return JSON.parse(data.candidates[0].content.parts[0].text.trim());
} catch (e) {
  console.error("Error generateDailyChallenge:", e);
  return null;
}
};