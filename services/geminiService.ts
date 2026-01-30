
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

export const aiService = {
  /**
   * Smart Entry: Analizza il linguaggio naturale per creare un oggetto spesa.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    try {
      // Inizializziamo l'istanza con la chiave corrente iniettata dall'ambiente
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
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
            },
            required: ["importo", "tipologia"]
          }
        }
      });

      if (!response.text) {
        throw new Error("La risposta dell'IA è vuota.");
      }

      return JSON.parse(response.text.trim());
    } catch (error: any) {
      console.error("AI Error:", error);
      // Trasmettiamo il messaggio d'errore specifico per il debug nell'interfaccia
      const errorMsg = error.message || "Errore sconosciuto";
      if (errorMsg.includes("404") || errorMsg.includes("not found")) {
        throw new Error("MODELLO_NON_TROVATO");
      }
      if (errorMsg.includes("401") || errorMsg.includes("API key")) {
        throw new Error("CHIAVE_NON_VALIDA");
      }
      throw new Error(errorMsg);
    }
  },

  /**
   * AI Assistant: Analisi dati storici.
   */
  getAnalysis: async (history: Spesa[], query: string): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const dataStr = JSON.stringify(history);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analizza questi dati: ${dataStr}. Rispondi alla domanda: ${query}`,
        config: {
          systemInstruction: "Sei un assistente per una coppia (Luca e Federica). Sii breve, usa emoji e rispondi in italiano."
        }
      });

      return response.text || "Non ho potuto generare un'analisi.";
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      return `Errore nell'analisi: ${error.message}`;
    }
  }
};
