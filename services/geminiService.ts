
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

// Helper per ottenere l'API KEY in modo sicuro nel browser
const getSafeApiKey = (): string => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
};

const apiKey = getSafeApiKey();

export const aiService = {
  /**
   * Smart Entry: Analizza il linguaggio naturale per creare un oggetto spesa.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    if (!apiKey) {
      console.warn("API Key mancante per Gemini. L'analisi Smart Entry non funzionerà.");
      return null;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
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
   * AI Assistant: Fornisce analisi basate sui dati esistenti.
   */
  getAnalysis: async (history: Spesa[], query: string): Promise<string> => {
    if (!apiKey) return "Configura la tua API KEY di Google Gemini per attivare l'assistente IA.";

    try {
      const ai = new GoogleGenAI({ apiKey });
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
      return "Errore nella comunicazione con l'assistente IA. Verifica la tua connessione o l'API Key.";
    }
  }
};
