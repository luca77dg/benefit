
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

export const aiService = {
  /**
   * Smart Entry: Analizza il linguaggio naturale per creare un oggetto spesa.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    try {
      // Inizializziamo l'istanza con la chiave corrente
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Estrai i dati di spesa da: "${input}". Oggi è il ${new Date().toLocaleDateString('it-IT')}.`,
        config: {
          systemInstruction: "Sei un estrattore di dati. Rispondi solo in JSON con campi: utente (Luca/Federica), tipologia (Spesa/Welfare/Benzina), importo (numero), data (YYYY-MM-DD), note. Se l'utente non è specificato, lascia null.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              utente: { type: Type.STRING, nullable: true },
              tipologia: { type: Type.STRING, nullable: true },
              importo: { type: Type.NUMBER, nullable: true },
              data: { type: Type.STRING, nullable: true },
              note: { type: Type.STRING, nullable: true }
            }
          }
        }
      });

      const text = response.text;
      if (!text) return null;

      return JSON.parse(text.trim());
    } catch (error: any) {
      console.error("AI Error:", error);
      if (error.message?.toLowerCase().includes("not found") || error.message?.includes("404")) {
        throw new Error("KEY_NOT_FOUND");
      }
      throw error;
    }
  },

  /**
   * AI Assistant: Analisi dati storici.
   */
  getAnalysis: async (history: Spesa[], query: string): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const dataStr = JSON.stringify(history);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analizza questi dati: ${dataStr}. Rispondi alla domanda: ${query}`,
        config: {
          systemInstruction: "Sei un assistente per una coppia. Sii breve e simpatico. Usa i nomi Luca e Federica."
        }
      });

      return response.text || "Non ho capito, puoi riprovare?";
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      if (error.message?.toLowerCase().includes("not found") || error.message?.includes("404")) {
        throw new Error("KEY_NOT_FOUND");
      }
      return "Errore nell'analisi dei dati.";
    }
  }
};
