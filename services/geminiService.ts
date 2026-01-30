
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

export const aiService = {
  /**
   * Smart Entry: Analizza il linguaggio naturale per creare un oggetto spesa.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    // La chiave DEVE chiamarsi API_KEY nel pannello Vercel
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.error("ERRORE CRITICO: process.env.API_KEY non è definita.");
      throw new Error("CHIAVE_MANCANTE");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Estrai dati spesa in JSON da questa frase: "${input}". Oggi è il ${new Date().toLocaleDateString('it-IT')}.`,
        config: {
          systemInstruction: "Sei un assistente per la gestione spese. Estrai i dati in formato JSON. Campi: utente (Luca o Federica), tipologia (Spesa, Welfare o Benzina), importo (numero decimale), data (YYYY-MM-DD), note (opzionale).",
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
      if (!text) throw new Error("L'IA ha restituito una risposta vuota.");
      return JSON.parse(text.trim());
    } catch (error: any) {
      console.error("Dettaglio Errore Gemini API:", error);
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("401") || msg.includes("api key") || msg.includes("not valid")) {
        throw new Error("CHIAVE_NON_VALIDA");
      }
      throw new Error(error.message || "ERRORE_GENERICO");
    }
  },

  /**
   * AI Assistant: Analisi dati storici.
   */
  getAnalysis: async (history: Spesa[], query: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Errore: La variabile API_KEY non è configurata correttamente su Vercel.";

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Dati della coppia: ${JSON.stringify(history)}. Domanda: ${query}`,
        config: {
          systemInstruction: "Rispondi in italiano in modo amichevole e sintetico analizzando le spese di Luca e Federica."
        }
      });

      return response.text || "Non sono riuscito a generare un'analisi.";
    } catch (error: any) {
      return `Errore tecnico: ${error.message}`;
    }
  }
};
