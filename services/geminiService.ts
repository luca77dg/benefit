
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

export const aiService = {
  /**
   * Smart Entry: Analizza il linguaggio naturale per creare un oggetto spesa.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
      console.error("ERRORE: API_KEY non valida o mancante.");
      throw new Error("CHIAVE_MANCANTE");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Utilizziamo gemini-flash-latest che è il più compatibile con tutte le API key
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Analizza questa spesa e convertila in JSON: "${input}". Oggi è il ${new Date().toLocaleDateString('it-IT')}.`,
        config: {
          systemInstruction: "Sei un assistente per la gestione spese di coppia. Estrai dati JSON: utente (Luca/Federica), tipologia (Spesa/Welfare/Benzina), importo (numero), data (YYYY-MM-DD), note. Rispondi solo col JSON.",
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
      if (!text) throw new Error("Risposta vuota");
      return JSON.parse(text.trim());
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("401") || msg.includes("api key") || msg.includes("not found")) {
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
    if (!apiKey || apiKey === "undefined") return "Errore: Chiave non configurata.";

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Dati: ${JSON.stringify(history)}. Domanda: ${query}`,
        config: {
          systemInstruction: "Sei un analista finanziario amichevole. Rispondi in italiano in modo sintetico."
        }
      });

      return response.text || "Impossibile generare l'analisi.";
    } catch (error: any) {
      return `Errore: ${error.message}`;
    }
  }
};
