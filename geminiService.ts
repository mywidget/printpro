
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Strictly follow Gemini API guidelines for initialization and API key usage.
// Ensure process.env.API_KEY is used directly in the constructor and .text is accessed as a property.
export const getAiRecommendation = async (userInput: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a professional printing expert. Based on the user's request: "${userInput}", suggest the best material, printing type, and approximate pricing logic. Keep it concise and professional.`,
    });
    // Fix: response.text is a property, not a method.
    return response.text || "I couldn't generate a recommendation.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error getting AI advice. Please try again later.";
  }
};

// Fix: Strictly follow Gemini API guidelines for JSON response handling, initialization, and schema definition.
export const parseOrderWithAi = async (userInput: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this printing request into a JSON object: "${userInput}". Extract customer name, product, quantity, and specs.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            product: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            specs: { type: Type.STRING },
            notes: { type: Type.STRING }
          },
          propertyOrdering: ["customerName", "product", "quantity", "specs", "notes"],
        }
      }
    });
    // Fix: Safely handle the response text as a property and trim it before parsing.
    const text = response.text;
    return text ? JSON.parse(text.trim()) : null;
  } catch (error) {
    console.error("AI Parse Error:", error);
    return null;
  }
};
