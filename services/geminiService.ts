
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

// Funzione helper per recuperare la chiave API in modo robusto
const getApiKey = () => {
  return process.env.API_KEY || (process.env as any).VITE_API_KEY || "";
};

export const aiService = {
  /**
   * Smart Entry: Analizza il linguaggio naturale per creare un oggetto spesa.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    const key = getApiKey();
    
    if (!key) {
      console.error("API Key mancante nel sistema.");
      throw new Error("CHIAVE_MANCANTE");
    }

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analizza questa operazione di spesa: "${input}". Oggi è il ${new Date().toLocaleDateString('it-IT')}.`,
        config: {
          systemInstruction: "Estrai dati in JSON: utente (Luca/Federica), tipologia (Spesa/Welfare/Benzina), importo (numero), data (YYYY-MM-DD), note.",
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
      console.error("Dettaglio Errore AI:", error);
      const msg = error.message?.toLowerCase() || "";
      
      if (msg.includes("401") || msg.includes("api key not valid") || msg.includes("invalid")) {
        throw new Error("CHIAVE_NON_VALIDA");
      }
      if (msg.includes("404") || msg.includes("not found")) {
        throw new Error("MODELLO_NON_DISPONIBILE");
      }
      if (msg.includes("fetch") || msg.includes("network")) {
        throw new Error("ERRORE_RETE");
      }
      throw new Error(error.message || "ERRORE_GENERICO");
    }
  },

  /**
   * AI Assistant: Analisi dati storici.
   */
  getAnalysis: async (history: Spesa[], query: string): Promise<string> => {
    const key = getApiKey();
    if (!key) return "Configura la chiave API per usare l'assistente.";

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Dati: ${JSON.stringify(history)}. Domanda: ${query}`,
        config: {
          systemInstruction: "Sei un assistente per la gestione spese di Luca e Federica. Rispondi in modo conciso e amichevole."
        }
      });

      return response.text || "Non ho potuto elaborare un'analisi.";
    } catch (error: any) {
      console.error("Analysis Error:", error);
      return `Errore tecnico: ${error.message}`;
    }
  }
};
