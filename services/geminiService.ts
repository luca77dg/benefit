
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

export const aiService = {
  /**
   * Smart Entry: Analizza il linguaggio naturale per creare un oggetto spesa.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    try {
      // Inizializzazione diretta come da linee guida
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analizza questa frase in italiano e estrai i dati per una spesa.
        Frase: "${input}"
        Oggi è il ${new Date().toISOString().split('T')[0]}.
        Identifica l'utente (Luca o Federica), la tipologia (Spesa, Welfare, Benzina), l'importo (numero) e la data (formato YYYY-MM-DD). 
        Se l'utente non è specificato, lascia il campo utente nullo. 
        Se la data non è specificata, usa quella di oggi.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              utente: { type: Type.STRING, description: "Deve essere 'Luca', 'Federica' o null" },
              tipologia: { type: Type.STRING, description: "Deve essere 'Spesa', 'Welfare' o 'Benzina'" },
              importo: { type: Type.NUMBER },
              data: { type: Type.STRING },
              note: { type: Type.STRING }
            },
            required: ["tipologia", "importo", "data"]
          }
        }
      });

      const text = response.text;
      if (!text) return null;
      return JSON.parse(text.trim());
    } catch (error) {
      console.error("AI Parse Error:", error);
      throw error; // Rilanciamo l'errore per gestirlo nel componente
    }
  },

  /**
   * AI Assistant: Fornisce analisi basate sui dati esistenti.
   */
  getAnalysis: async (history: Spesa[], query: string): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const dataSummary = history.map(s => 
        `${s.data}: ${s.utente} ha speso ${s.importo}€ in ${s.tipologia}${s.note ? ` (${s.note})` : ''}`
      ).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Agisci come un consulente finanziario esperto per una coppia, Luca e Federica.
        Ecco i dati delle loro spese recenti:
        ${dataSummary}

        Domanda dell'utente: "${query}"

        Rispondi in modo professionale, amichevole e sintetico in italiano.`,
      });

      return response.text || "Mi dispiace, non sono riuscito a generare un'analisi.";
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return "Errore nella comunicazione con l'assistente IA. Verifica la configurazione.";
    }
  }
};
