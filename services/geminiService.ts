
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const aiService = {
  /**
   * Smart Entry: Parses natural language into an expense object.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analizza questa frase in italiano e estrai i dati per una spesa.
        Frase: "${input}"
        Oggi è il ${new Date().toISOString().split('T')[0]}.
        Identifica l'utente (Luca o Federica), la tipologia (Spesa, Welfare, Benzina), l'importo (numero) e la data (formato YYYY-MM-DD). Se l'utente non è specificato, lascia vuoto. Se la data non è specificata, usa quella di oggi.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              utente: { type: Type.STRING, description: "Deve essere 'Luca' o 'Federica' o null" },
              tipologia: { type: Type.STRING, description: "Deve essere 'Spesa', 'Welfare' o 'Benzina'" },
              importo: { type: Type.NUMBER },
              data: { type: Type.STRING },
              note: { type: Type.STRING }
            },
            required: ["tipologia", "importo", "data"]
          }
        }
      });

      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error("AI Parse Error:", error);
      return null;
    }
  },

  /**
   * AI Assistant: Provides analysis based on existing data.
   */
  getAnalysis: async (history: Spesa[], query: string): Promise<string> => {
    try {
      const dataSummary = history.map(s => 
        `${s.data}: ${s.utente} ha speso ${s.importo}€ in ${s.tipologia}${s.note ? ` (${s.note})` : ''}`
      ).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Agisci come un consulente finanziario esperto per una coppia, Luca e Federica.
        Ecco i dati delle loro spese recenti (benefit/welfare):
        ${dataSummary}

        Domanda dell'utente: "${query}"

        Rispondi in modo professionale, amichevole e sintetico in italiano. Fornisci insight basati sui dati se possibile.`,
      });

      return response.text || "Mi dispiace, non sono riuscito a generare un'analisi.";
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return "Errore nella comunicazione con l'assistente IA.";
    }
  }
};
