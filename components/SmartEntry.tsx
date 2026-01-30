
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
  const [errorStatus, setErrorStatus] = useState<'NONE' | 'MISSING_KEY' | 'INVALID_KEY' | 'GENERIC'>('NONE');
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

  const handleMagicAnalysis = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsLoading(true);
    setErrorStatus('NONE');
    
    try {
      const result = await aiService.parseSmartEntry(textToParse);
      if (result) setPreview(result);
    } catch (error: any) {
      if (error.message === "CHIAVE_MANCANTE") setErrorStatus('MISSING_KEY');
      else if (error.message === "CHIAVE_NON_VALIDA") setErrorStatus('INVALID_KEY');
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
          <h3 className="font-black text-xs uppercase tracking-widest">IA Smart Entry</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
          <div className={`w-1.5 h-1.5 rounded-full ${errorStatus === 'NONE' ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`}></div>
          <span className="text-[10px] font-bold uppercase">Stato IA</span>
        </div>
      </div>
      
      <div className="relative">
        <input
          type="text" value={input} onChange={(e) => { setInput(e.target.value); setErrorStatus('NONE'); }}
          placeholder='Es: "60 euro spesa Federica"'
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/40 pr-24"
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleMagicAnalysis(input)}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button 
            onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()}
            className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 shadow-lg' : 'bg-white/10'}`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => handleMagicAnalysis(input)} 
            disabled={isLoading || !input.trim()}
            className="bg-white text-indigo-700 p-2.5 rounded-xl shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {errorStatus !== 'NONE' && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-red-100 uppercase tracking-widest">
                {errorStatus === 'MISSING_KEY' ? "Configurazione Errata" : "Chiave non Valida"}
              </p>
              <p className="text-[11px] text-red-200/90 leading-relaxed mt-1">
                {errorStatus === 'MISSING_KEY' 
                  ? "Vercel non trova la variabile. Assicurati che si chiami 'API_KEY' (non APY!)." 
                  : "La chiave esiste ma Google dice che non è valida. Controlla di averla copiata tutta."}
              </p>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="mt-4 p-5 bg-white/10 rounded-2xl border border-white/20 animate-in zoom-in-95">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Rilevamento IA</span>
            <button onClick={() => setPreview(null)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-black/20 p-3 rounded-xl">
              <span className="block text-[8px] opacity-50 uppercase font-black mb-1">Utente</span>
              <span className="font-bold text-lg">{preview.utente || '?'}</span>
            </div>
            <div className="bg-black/20 p-3 rounded-xl">
              <span className="block text-[8px] opacity-50 uppercase font-black mb-1">Importo</span>
              <span className="font-bold text-lg">€{preview.importo?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          <button 
            onClick={confirmAdd}
            className="w-full bg-white text-indigo-700 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
          >
            Conferma e Salva
          </button>
        </div>
      )}
    </div>
  );
};
