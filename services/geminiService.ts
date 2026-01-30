
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

export const aiService = {
  /**
   * Smart Entry: Analizza il linguaggio naturale per creare un oggetto spesa.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    // Ora process.env.API_KEY sarà disponibile grazie alla modifica in vite.config.ts
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined") {
      console.error("ERRORE: API_KEY non trovata nell'ambiente di esecuzione.");
      throw new Error("CHIAVE_MANCANTE");
    }

    try {
      // Inizializzazione rigorosa come da specifiche Google GenAI SDK
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analizza questa spesa e convertila in JSON: "${input}". Oggi è il ${new Date().toLocaleDateString('it-IT')}.`,
        config: {
          systemInstruction: "Sei BenefitSync, un assistente esperto. Estrai sempre: utente (Luca/Federica), tipologia (Spesa/Welfare/Benzina), importo (numero), data (YYYY-MM-DD), note. Rispondi SOLO con il JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              utente: { type: Type.STRING, nullable: true },
              tipologia: { type: Type.STRING, nullable: true },
              importo: { type: Type.NUMBER, nullable: true },
              data: { type: Type.STRING, nullable: true },
              note: { type: Type.STRING, nullable: true }
            },
            required: ["importo", "tipologia"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Risposta IA vuota");
      return JSON.parse(text.trim());
    } catch (error: any) {
      console.error("Dettaglio Errore Gemini:", error);
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("401") || msg.includes("api key")) {
        throw new Error("CHIAVE_NON_VALIDA");
      }
      throw new Error("ERRORE_GENERICO");
    }
  },

  /**
   * AI Assistant: Analisi dati storici.
   */
  getAnalysis: async (history: Spesa[], query: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "undefined") return "Errore: Variabile API_KEY non configurata su Vercel.";

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analizza questi dati: ${JSON.stringify(history)}. Domanda: ${query}`,
        config: {
          systemInstruction: "Sei un analista finanziario di coppia. Rispondi in modo conciso, amichevole e in italiano."
        }
      });

      return response.text || "Non è stato possibile generare un'analisi.";
    } catch (error: any) {
      return `Errore nell'analisi: ${error.message}`;
    }
  }
};
