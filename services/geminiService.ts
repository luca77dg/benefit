
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

export const aiService = {
  /**
   * Smart Entry: Analizza il linguaggio naturale per creare un oggetto spesa.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    try {
      // Inizializziamo l'istanza subito prima dell'uso per garantire l'uso della chiave più recente
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Estrai i dati di spesa dalla seguente frase e restituisci ESCLUSIVAMENTE un oggetto JSON valido. 
        Oggi è il ${new Date().toLocaleDateString('it-IT')}.
        Frase: "${input}"`,
        config: {
          systemInstruction: "Sei un estrattore di dati finanziari. Estrai: utente (Luca o Federica), tipologia (Spesa, Welfare o Benzina), importo (numero decimale), data (formato YYYY-MM-DD), note (descrizione breve). Restituisci solo il JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              utente: { type: Type.STRING, enum: ['Luca', 'Federica'] },
              tipologia: { type: Type.STRING, enum: ['Spesa', 'Welfare', 'Benzina'] },
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
    } catch (error: any) {
      console.error("AI Error Details:", error);
      
      // Se l'errore indica che l'entità non è stata trovata, potrebbe essere necessaria la selezione della chiave
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("KEY_NOT_FOUND");
      }
      
      throw error;
    }
  },

  /**
   * AI Assistant: Fornisce analisi basate sui dati esistenti.
   */
  getAnalysis: async (history: Spesa[], query: string): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const dataSummary = history.map(s => 
        `${s.data}: ${s.utente} ha speso ${s.importo}€ in ${s.tipologia}${s.note ? ' (' + s.note + ')' : ''}`
      ).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Basandoti su questi dati di spesa:\n${dataSummary}\n\nRispondi alla domanda: "${query}"`,
        config: {
          systemInstruction: "Sei un assistente finanziario per Luca e Federica. Rispondi in modo conciso e amichevole in italiano."
        }
      });

      return response.text || "Non ho potuto generare un'analisi.";
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      if (error.message?.includes("Requested entity was not found")) {
        return "Errore: Progetto API non trovato. Assicurati di aver selezionato una chiave valida.";
      }
      return "Si è verificato un errore durante l'analisi.";
    }
  }
};
