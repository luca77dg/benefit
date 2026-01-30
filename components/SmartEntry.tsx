
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Plus, AlertCircle, Mic, MicOff, Keyboard, X } from 'lucide-react';
import { aiService } from '../services/geminiService';
import { NewSpesa, Utente, Tipologia } from '../types';

interface SmartEntryProps {
  onAdd: (expense: NewSpesa) => void;
}

export const SmartEntry: React.FC<SmartEntryProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [preview, setPreview] = useState<Partial<NewSpesa> | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleMagicAnalysis(transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  const handleMagicAnalysis = async (textToParse: string) => {
    const trimmedInput = textToParse.trim();
    if (!trimmedInput) return;
    setIsLoading(true);
    try {
      const result = await aiService.parseSmartEntry(trimmedInput);
      if (result) setPreview(result);
      else alert("Riprova a scrivere i dettagli.");
    } catch (error) {
      alert("Errore AI. Controlla la connessione.");
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
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 md:p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white mb-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <h3 className="font-black text-sm uppercase tracking-widest">Smart Entry</h3>
        </div>
        {isListening && <div className="text-[9px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> In ascolto</div>}
      </div>
      
      <div className="relative group">
        <input
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder='Es: "Federica 20€ benzina"'
          className="w-full bg-white/15 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all pr-24 text-sm md:text-base font-medium"
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleMagicAnalysis(input)}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button onClick={toggleListening} className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}>
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button onClick={() => handleMagicAnalysis(input)} disabled={isLoading} className="bg-white text-indigo-700 p-2.5 rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {preview && (
        <div className="mt-4 p-5 bg-white/10 rounded-2xl border border-white/20 animate-in slide-in-from-top-4 duration-300 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Dati rilevati</span>
            <button onClick={() => setPreview(null)}><X className="w-4 h-4 text-white/50" /></button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-black/20 p-3 rounded-xl">
              <label className="opacity-50 block text-[8px] font-black uppercase mb-1">Chi</label>
              <select value={preview.utente || ''} onChange={(e) => setPreview({...preview, utente: e.target.value as Utente})} className="bg-transparent font-bold w-full outline-none text-sm appearance-none cursor-pointer">
                <option value="" disabled className="text-slate-800">Scegli</option>
                <option value="Luca" className="text-slate-800">Luca</option>
                <option value="Federica" className="text-slate-800">Federica</option>
              </select>
            </div>
            <div className="bg-black/20 p-3 rounded-xl">
              <label className="opacity-50 block text-[8px] font-black uppercase mb-1">Importo</label>
              <input type="number" step="0.01" value={preview.importo} onChange={(e) => setPreview({...preview, importo: parseFloat(e.target.value)})} className="bg-transparent font-bold w-full outline-none text-sm" />
            </div>
          </div>
          
          <button 
            onClick={confirmAdd}
            disabled={!preview.utente || !preview.importo}
            className="w-full bg-white text-indigo-800 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
          >
            Salva ora
          </button>
        </div>
      )}
    </div>
  );
};
