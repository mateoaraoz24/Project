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
