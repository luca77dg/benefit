
import { GoogleGenAI, Type } from "@google/genai";
import { Spesa, NewSpesa } from "../types";

export const aiService = {
  /**
   * Smart Entry: Analizza il linguaggio naturale per creare un oggetto spesa.
   */
  parseSmartEntry: async (input: string): Promise<Partial<NewSpesa> | null> => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key mancante nel sistema.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ 
          parts: [{ 
            text: `Estrai i dati di spesa dalla frase e restituisci SOLO JSON.
            Frase: "${input}"
            Oggi è: ${new Date().toLocaleDateString('it-IT')}.
            Regole: utente (Luca o Federica), tipologia (Spesa, Welfare, Benzina), importo (numero), data (YYYY-MM-DD), note (stringa).` 
          }] 
        }],
        config: {
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

      try {
        return JSON.parse(text.trim());
      } catch (e) {
        console.error("Errore JSON IA:", text);
        return null;
      }
    } catch (error) {
      console.error("AI Error:", error);
      throw error;
    }
  },

  /**
   * AI Assistant: Fornisce analisi basate sui dati esistenti.
   */
  getAnalysis: async (history: Spesa[], query: string): Promise<string> => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return "Chiave API non configurata.";

      const ai = new GoogleGenAI({ apiKey });
      const dataSummary = history.map(s => 
        `${s.data}: ${s.utente} ha speso ${s.importo}€ in ${s.tipologia}${s.note ? ' (' + s.note + ')' : ''}`
      ).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ 
          parts: [{ 
            text: `Sei un esperto analista finanziario personale per la coppia Luca e Federica. 
            Basandoti sui seguenti dati di spesa:
            ${dataSummary}
            
            Rispondi in modo cordiale e conciso alla seguente domanda dell'utente: "${query}"` 
          }] 
        }]
      });

      return response.text || "Spiacente, non ho potuto generare un'analisi.";
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return "Si è verificato un errore durante l'analisi dei dati.";
    }
  }
};
