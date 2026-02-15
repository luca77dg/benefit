import { Sparkles, Loader2, Mic, MicOff, X, AlertCircle, User, Tag, Euro, Calendar } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/geminiService';
import { NewSpesa, AppSettings } from '../types';

interface SmartEntryProps {
  onAdd: (expense: NewSpesa) => void;
  settings: AppSettings;
}

export const SmartEntry: React.FC<SmartEntryProps> = ({ onAdd, settings }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [preview, setPreview] = useState<Partial<NewSpesa> | null>(null);
  const [hasError, setHasError] = useState(false);
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
    setHasError(false);
    
    try {
      const result = await aiService.parseSmartEntry(textToParse, settings);
      if (result) setPreview(result);
    } catch (error: any) {
      console.error("AI Entry Error:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAdd = () => {
    if (preview?.utente && preview.tipologia && preview.importo && preview.data) {
      onAdd(preview as NewSpesa);
      setPreview(null);
      setInput('');
    } else {
      alert("Assicurati che tutti i campi siano compilati correttamente nell'anteprima.");
    }
  };

  return (
    <div className="bg-indigo-700 p-5 md:p-8 rounded-[32px] shadow-2xl text-white mb-8 border border-white/10 relative overflow-hidden transition-all duration-500">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/10 rounded-xl">
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-100">IA Smart Entry</h3>
        </div>
      </div>

      <div className="relative z-10">
        <input
          type="text" 
          value={input} 
          onChange={(e) => { setInput(e.target.value); setHasError(false); }}
          placeholder='Es: "15 euro pizza Federica"'
          className="w-full bg-white/10 border border-white/20 rounded-[24px] px-6 py-5 text-white placeholder:text-white/30 outline-none focus:ring-4 focus:ring-white/10 pr-28 transition-all text-lg font-medium shadow-inner"
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleMagicAnalysis(input)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button 
            onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()} 
            className={`p-3.5 rounded-2xl transition-all active:scale-90 ${isListening ? 'bg-red-500 shadow-lg shadow-red-900/40' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => handleMagicAnalysis(input)} 
            disabled={isLoading || !input.trim()} 
            className="bg-white text-indigo-700 p-3.5 rounded-2xl shadow-xl disabled:opacity-50 transition-all hover:bg-indigo-50 active:scale-95"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {hasError && (
        <div className="mt-5 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl relative z-10 animate-in slide-in-from-top-2">
          <p className="text-[11px] text-red-100 flex items-center gap-2 tracking-wide font-bold uppercase">
            <AlertCircle className="w-4 h-4" /> Non sono riuscito ad elaborare la richiesta.
          </p>
        </div>
      )}

      {preview && (
        <div className="mt-6 p-6 bg-white/10 rounded-[28px] border border-white/20 relative z-10 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Verifica Anteprima</span>
            </div>
            <button onClick={() => setPreview(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {/* Box Utente */}
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
              <span className="flex items-center gap-1.5 text-[8px] opacity-40 uppercase font-black mb-2 tracking-widest">
                <User className="w-2.5 h-2.5" /> Chi
              </span>
              <select 
                className="bg-transparent font-bold text-sm outline-none w-full cursor-pointer appearance-none"
                value={preview.utente || ''}
                onChange={(e) => setPreview({...preview, utente: e.target.value})}
              >
                <option value="" disabled className="text-slate-900">Seleziona...</option>
                {settings.utenti.map(u => <option key={u} value={u} className="text-slate-900 font-bold">{u}</option>)}
              </select>
            </div>

            {/* Box Categoria */}
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
              <span className="flex items-center gap-1.5 text-[8px] opacity-40 uppercase font-black mb-2 tracking-widest">
                <Tag className="w-2.5 h-2.5" /> Cosa
              </span>
              <select 
                className="bg-transparent font-bold text-sm outline-none w-full cursor-pointer appearance-none"
                value={preview.tipologia || ''}
                onChange={(e) => setPreview({...preview, tipologia: e.target.value})}
              >
                <option value="" disabled className="text-slate-900">Categoria...</option>
                {settings.categorie.map(c => <option key={c} value={c} className="text-slate-900 font-bold">{c}</option>)}
              </select>
            </div>

            {/* Box Importo */}
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
              <span className="flex items-center gap-1.5 text-[8px] opacity-40 uppercase font-black mb-2 tracking-widest">
                <Euro className="w-2.5 h-2.5" /> Cifra
              </span>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  step="0.01"
                  className="bg-transparent font-bold text-sm outline-none w-full"
                  value={preview.importo || ''}
                  onChange={(e) => setPreview({...preview, importo: parseFloat(e.target.value)})}
                />
                <span className="text-xs font-black opacity-30">€</span>
              </div>
            </div>
            
            {/* Box Data (Sempre visibile per sicurezza) */}
            <div className="sm:col-span-3 bg-black/20 p-4 rounded-2xl border border-white/5 group hover:border-white/20 transition-all flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[8px] opacity-40 uppercase font-black tracking-widest">
                <Calendar className="w-2.5 h-2.5" /> Data Operazione
              </span>
              <input 
                type="date"
                className="bg-transparent font-bold text-xs outline-none text-right cursor-pointer"
                value={preview.data || ''}
                onChange={(e) => setPreview({...preview, data: e.target.value})}
              />
            </div>
          </div>

          <button 
            onClick={confirmAdd} 
            className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:bg-indigo-50 active:scale-[0.98] transition-all"
          >
            Conferma e Registra
          </button>
        </div>
      )}
    </div>
  );
};
