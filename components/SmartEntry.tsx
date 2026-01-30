
import { Sparkles, Loader2, Mic, MicOff, X, Key, AlertCircle, RefreshCw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/geminiService';
import { NewSpesa, Utente } from '../types';

interface SmartEntryProps {
  onAdd: (expense: NewSpesa) => void;
}

export const SmartEntry: React.FC<SmartEntryProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [preview, setPreview] = useState<Partial<NewSpesa> | null>(null);
  const [errorStatus, setErrorStatus] = useState<'NONE' | 'MISSING_KEY' | 'INVALID_KEY' | 'MODEL_ERROR' | 'NETWORK' | 'GENERIC'>('NONE');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleMagicAnalysis(transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleOpenKey = async () => {
    try {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setErrorStatus('NONE');
        alert("Chiave selezionata. Ora riprova a inviare il comando.");
      } else {
        alert("Selettore non disponibile. Assicurati di essere nell'ambiente corretto.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMagicAnalysis = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsLoading(true);
    setErrorStatus('NONE');
    
    try {
      const result = await aiService.parseSmartEntry(textToParse);
      if (result) setPreview(result);
    } catch (error: any) {
      console.error("Catch in Component:", error.message);
      if (error.message === "CHIAVE_MANCANTE") setErrorStatus('MISSING_KEY');
      else if (error.message === "CHIAVE_NON_VALIDA") setErrorStatus('INVALID_KEY');
      else if (error.message === "MODELLO_NON_DISPONIBILE") setErrorStatus('MODEL_ERROR');
      else if (error.message === "ERRORE_RETE") setErrorStatus('NETWORK');
      else setErrorStatus('GENERIC');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAdd = () => {
    if (preview?.utente && preview.tipologia && preview.importo && preview.data) {
      onAdd(preview as NewSpesa);
      setPreview(null);
      setInput('');
    }
  };

  return (
    <div className="bg-indigo-700 p-5 md:p-6 rounded-3xl shadow-xl text-white mb-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <h3 className="font-black text-xs uppercase tracking-widest">Inserimento Vocale / Smart</h3>
        </div>
        <button 
          onClick={handleOpenKey}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Imposta Chiave</span>
        </button>
      </div>
      
      <div className="relative">
        <input
          type="text" value={input} onChange={(e) => { setInput(e.target.value); setErrorStatus('NONE'); }}
          placeholder='Es: "50 euro benzina Luca"'
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/40 pr-24"
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleMagicAnalysis(input)}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button 
            onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()}
            className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => handleMagicAnalysis(input)} 
            disabled={isLoading || !input.trim()}
            className="bg-white text-indigo-700 p-2.5 rounded-xl shadow-lg disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Error Messages with Action Buttons */}
      {errorStatus !== 'NONE' && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-100 uppercase tracking-wide">
                {errorStatus === 'MISSING_KEY' && "Chiave API Mancante"}
                {errorStatus === 'INVALID_KEY' && "Chiave API non Valida"}
                {errorStatus === 'MODEL_ERROR' && "Modello non Abilitato"}
                {errorStatus === 'NETWORK' && "Errore di Rete"}
                {errorStatus === 'GENERIC' && "Errore di Connessione"}
              </p>
              <p className="text-[11px] text-red-200/80 leading-relaxed mt-1">
                {errorStatus === 'MISSING_KEY' && "Non hai impostato la chiave API. Usa il tasto sopra per selezionarla."}
                {errorStatus === 'INVALID_KEY' && "La chiave inserita non è corretta o è scaduta. Prova a riselezionarla."}
                {errorStatus === 'MODEL_ERROR' && "Il tuo progetto non ha accesso a Gemini 3. Prova a cambiare progetto nel selettore."}
                {(errorStatus === 'NETWORK' || errorStatus === 'GENERIC') && "Verifica la connessione internet o riprova tra pochi secondi."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleOpenKey}
              className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[10px] font-black uppercase transition-all"
            >
              Configura Chiave
            </button>
            <button 
              onClick={() => handleMagicAnalysis(input)}
              className="flex-1 bg-red-500/40 hover:bg-red-500/60 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> Riprova
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="mt-4 p-5 bg-white/10 rounded-2xl border border-white/20 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Rilevato</span>
            <button onClick={() => setPreview(null)}><X className="w-4 h-4 opacity-50" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm font-bold">
            <div className="bg-black/20 p-3 rounded-xl">
              <span className="block text-[8px] opacity-40 uppercase mb-1">Chi</span>
              {preview.utente}
            </div>
            <div className="bg-black/20 p-3 rounded-xl">
              <span className="block text-[8px] opacity-40 uppercase mb-1">Importo</span>
              €{preview.importo}
            </div>
          </div>
          <button 
            onClick={confirmAdd}
            className="w-full bg-white text-indigo-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest"
          >
            Conferma Spesa
          </button>
        </div>
      )}
    </div>
  );
};
